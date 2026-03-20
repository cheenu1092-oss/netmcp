#!/usr/bin/env node
/**
 * NetMCP NVD Network CVEs — MCP server for querying NIST NVD security vulnerabilities.
 *
 * Tools:
 *   - cve_search: Search CVEs by keyword (e.g. "wifi", "cisco", "bgp")
 *   - cve_get: Get a specific CVE by ID (e.g. CVE-2024-12345)
 *   - cve_by_vendor: Search CVEs affecting a specific vendor/product
 *
 * Data source: NIST NVD API 2.0 (https://services.nvd.nist.gov/rest/json/cves/2.0)
 * Rate limit: 5 requests per 30 seconds (without API key)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

// ── Rate limiting ──────────────────────────────────────────────

const REQUEST_WINDOW = 30_000; // 30 seconds
const MAX_REQUESTS = 5;
const requestTimestamps = [];

async function rateLimitWait() {
  const now = Date.now();
  // Remove timestamps older than the window
  while (requestTimestamps.length && requestTimestamps[0] < now - REQUEST_WINDOW) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS) {
    const waitMs = requestTimestamps[0] + REQUEST_WINDOW - now + 100;
    console.error(`Rate limit: waiting ${waitMs}ms`);
    await new Promise(r => setTimeout(r, waitMs));
  }
  requestTimestamps.push(Date.now());
}

// ── Helpers ────────────────────────────────────────────────────

async function fetchNVD(params, timeoutMs = 15000) {
  await rateLimitWait();

  const url = new URL(NVD_API);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (res.status === 403) {
      throw new Error('NVD API rate limit exceeded. Try again in 30 seconds.');
    }
    if (!res.ok) {
      throw new Error(`NVD API error: HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`NVD API timeout after ${timeoutMs}ms. The API may be overloaded, try again later.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract the most relevant CVSS score from a CVE's metrics.
 * Prefers v3.1 > v4.0 > v3.0 > v2.
 */
function extractCVSS(metrics) {
  if (!metrics) return { score: null, severity: null, version: null };

  // Try CVSS v3.1 first (most common)
  if (metrics.cvssMetricV31?.length) {
    const primary = metrics.cvssMetricV31.find(m => m.type === 'Primary') || metrics.cvssMetricV31[0];
    return {
      score: primary.cvssData.baseScore,
      severity: primary.cvssData.baseSeverity,
      version: '3.1',
    };
  }

  // CVSS v4.0
  if (metrics.cvssMetricV40?.length) {
    const primary = metrics.cvssMetricV40.find(m => m.type === 'Primary') || metrics.cvssMetricV40[0];
    return {
      score: primary.cvssData.baseScore,
      severity: primary.cvssData.baseSeverity,
      version: '4.0',
    };
  }

  // CVSS v3.0
  if (metrics.cvssMetricV30?.length) {
    const primary = metrics.cvssMetricV30.find(m => m.type === 'Primary') || metrics.cvssMetricV30[0];
    return {
      score: primary.cvssData.baseScore,
      severity: primary.cvssData.baseSeverity,
      version: '3.0',
    };
  }

  // CVSS v2 fallback
  if (metrics.cvssMetricV2?.length) {
    const primary = metrics.cvssMetricV2.find(m => m.type === 'Primary') || metrics.cvssMetricV2[0];
    return {
      score: primary.cvssData.baseScore,
      severity: primary.baseSeverity || null,
      version: '2.0',
    };
  }

  return { score: null, severity: null, version: null };
}

/**
 * Extract affected products from CPE configurations.
 * Returns an object with products array, truncation flag, and total count.
 */
function extractAffectedProducts(configurations) {
  if (!configurations?.length) {
    return {
      products: [],
      truncated: false,
      total_count: 0
    };
  }

  const products = new Set();
  for (const config of configurations) {
    for (const node of config.nodes || []) {
      for (const match of node.cpeMatch || []) {
        if (match.vulnerable) {
          // Parse CPE 2.3 format: cpe:2.3:type:vendor:product:version:...
          const parts = match.criteria.split(':');
          if (parts.length >= 5) {
            const vendor = parts[3];
            const product = parts[4];
            if (vendor !== '*' && product !== '*') {
              products.add(`${vendor}/${product}`);
            } else if (vendor !== '*') {
              products.add(vendor);
            }
          }
        }
      }
    }
  }
  
  const totalCount = products.size;
  const productArray = [...products].slice(0, 20);
  
  return {
    products: productArray,
    truncated: totalCount > 20,
    total_count: totalCount
  };
}

function formatCVE(vuln) {
  const cve = vuln.cve;
  const cvss = extractCVSS(cve.metrics);
  const enDesc = cve.descriptions?.find(d => d.lang === 'en');
  const affectedInfo = extractAffectedProducts(cve.configurations);

  return {
    id: cve.id,
    description: enDesc?.value || null,
    published: cve.published,
    lastModified: cve.lastModified,
    status: cve.vulnStatus,
    cvss_score: cvss.score,
    cvss_severity: cvss.severity,
    cvss_version: cvss.version,
    affected_products: affectedInfo.products,
    affected_products_count: affectedInfo.total_count,
    affected_products_truncated: affectedInfo.truncated,
    references: (cve.references || []).slice(0, 5).map(r => ({
      url: r.url,
      tags: r.tags || [],
    })),
    weaknesses: (cve.weaknesses || []).flatMap(w =>
      w.description.filter(d => d.lang === 'en').map(d => d.value)
    ),
  };
}

// ── MCP Server ─────────────────────────────────────────────────

const server = new McpServer({
  name: 'nvd-network-cves',
  version: '1.0.0',
  description: 'NIST NVD vulnerability database — search networking CVEs, CVSS scores, and affected products',
});

// Tool: cve_search
server.tool(
  'cve_search',
  'Search CVEs by keyword. Useful for finding vulnerabilities related to networking topics like "wifi", "bgp", "cisco router", "ssl", etc.',
  {
    keyword: z.string().describe('Search keyword (e.g. "wifi", "cisco", "bgp hijack", "openssl")'),
    limit: z.number().optional().default(10).describe('Max results to return (default 10, max 50)'),
  },
  async ({ keyword, limit }) => {
    try {
      const cap = Math.min(limit, 50);
      const data = await fetchNVD({
        keywordSearch: keyword,
        resultsPerPage: cap,
      });

      const results = (data.vulnerabilities || []).map(formatCVE);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            keyword,
            total_results: data.totalResults || 0,
            returned: results.length,
            results,
          }),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: err.message }),
        }],
      };
    }
  }
);

// Tool: cve_get
server.tool(
  'cve_get',
  'Get detailed information about a specific CVE by its ID. Returns CVSS score, description, affected products, and references.',
  {
    cve_id: z.string().describe('CVE identifier (e.g. "CVE-2024-12345", "CVE-2023-44487")'),
  },
  async ({ cve_id }) => {
    try {
      // Normalize: ensure uppercase and proper format
      const id = cve_id.toUpperCase().trim();
      if (!/^CVE-\d{4}-\d{4,}$/.test(id)) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: `Invalid CVE ID format: "${cve_id}". Expected format: CVE-YYYY-NNNNN` }),
          }],
        };
      }

      const data = await fetchNVD({ cveId: id });

      if (!data.vulnerabilities?.length) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: `CVE ${id} not found.` }),
          }],
        };
      }

      const result = formatCVE(data.vulnerabilities[0]);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: err.message }),
        }],
      };
    }
  }
);

// Tool: cve_by_vendor
server.tool(
  'cve_by_vendor',
  'Search CVEs affecting a specific vendor or product. Uses CPE matching to find vulnerabilities by vendor name and optional product.',
  {
    vendor: z.string().describe('Vendor name (e.g. "cisco", "juniper", "fortinet", "paloaltonetworks")'),
    product: z.string().optional().describe('Product name (e.g. "ios_xe", "srx_series", "fortigate")'),
    limit: z.number().optional().default(10).describe('Max results to return (default 10, max 50)'),
  },
  async ({ vendor, product, limit }) => {
    try {
      const cap = Math.min(limit, 50);

      // Build keyword search combining vendor and product
      const keyword = product ? `${vendor} ${product}` : vendor;

      const data = await fetchNVD({
        keywordSearch: keyword,
        resultsPerPage: cap,
      });

      const results = (data.vulnerabilities || []).map(formatCVE);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            vendor,
            product: product || null,
            total_results: data.totalResults || 0,
            returned: results.length,
            results,
          }),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: err.message }),
        }],
      };
    }
  }
);

// ── Start ──────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
