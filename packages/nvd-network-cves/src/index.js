#!/usr/bin/env node
/**
 * NetMCP NVD Network CVEs — MCP server for querying NIST NVD security vulnerabilities.
 *
 * Tools:
 *   - cve_search: Search CVEs by keyword (e.g. "wifi", "cisco", "bgp")
 *   - cve_get: Get a specific CVE by ID (e.g. CVE-2024-12345)
 *   - cve_by_vendor: Search CVEs affecting a specific vendor/product
 *   - cve_cache_stats: View cache performance metrics (hit rate, cache size)
 *
 * Data source: NIST NVD API 2.0 (https://services.nvd.nist.gov/rest/json/cves/2.0)
 * Rate limit: 5 requests per 30 seconds (without API key)
 * Caching: 24-hour in-memory cache to reduce API load and improve response times
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

// ── Type Definitions ───────────────────────────────────────────

/**
 * Cache entry with data and timestamp for TTL tracking.
 * @typedef {Object} CacheEntry
 * @property {any} data - Cached data
 * @property {number} timestamp - Timestamp when data was cached (ms)
 */

/**
 * CVSS scoring information extracted from CVE metrics.
 * @typedef {Object} CVSSMetric
 * @property {number|null} score - CVSS base score (0-10)
 * @property {string|null} severity - Severity rating (CRITICAL, HIGH, MEDIUM, LOW)
 * @property {string|null} version - CVSS version (2.0, 3.0, 3.1, 4.0)
 */

/**
 * Affected products extracted from CPE configurations.
 * @typedef {Object} AffectedProductsInfo
 * @property {string[]} products - Array of vendor/product strings (max 20)
 * @property {boolean} truncated - True if more than 20 products affected
 * @property {number} total_count - Total number of affected products
 */

/**
 * CVE reference link with metadata.
 * @typedef {Object} CVEReference
 * @property {string} url - Reference URL
 * @property {string[]} tags - Reference tags (e.g., "Patch", "Vendor Advisory")
 */

/**
 * Formatted CVE vulnerability data.
 * @typedef {Object} FormattedCVE
 * @property {string} id - CVE identifier (e.g., CVE-2024-12345)
 * @property {string|null} description - English description
 * @property {string} published - Publication date (ISO 8601)
 * @property {string} lastModified - Last modified date (ISO 8601)
 * @property {string} status - Vulnerability status (e.g., "Analyzed", "Modified")
 * @property {number|null} cvss_score - CVSS base score
 * @property {string|null} cvss_severity - CVSS severity rating
 * @property {string|null} cvss_version - CVSS version used
 * @property {string[]} affected_products - Array of affected vendor/product strings
 * @property {number} affected_products_count - Total affected products count
 * @property {boolean} affected_products_truncated - True if product list truncated
 * @property {CVEReference[]} references - Reference URLs (max 5)
 * @property {string[]} weaknesses - CWE weakness descriptions
 */

/**
 * CVE search result response.
 * @typedef {Object} CVESearchResult
 * @property {string} keyword - Search keyword used
 * @property {number} total_results - Total results available in NVD
 * @property {number} returned - Number of results returned
 * @property {FormattedCVE[]} results - Array of formatted CVEs
 * @property {boolean} [cached] - True if result came from cache
 */

/**
 * CVE vendor search result response.
 * @typedef {Object} CVEVendorResult
 * @property {string} vendor - Vendor name searched
 * @property {string|null} product - Product name (if specified)
 * @property {number} total_results - Total results available in NVD
 * @property {number} returned - Number of results returned
 * @property {FormattedCVE[]} results - Array of formatted CVEs
 * @property {boolean} [cached] - True if result came from cache
 */

/**
 * Cache statistics response.
 * @typedef {Object} CacheStatsResult
 * @property {number} cache_hits - Number of cache hits
 * @property {number} cache_misses - Number of cache misses
 * @property {number} total_requests - Total requests (hits + misses)
 * @property {number} hit_rate_percent - Cache hit rate percentage
 * @property {number} cve_cache_size - Number of CVE cache entries
 * @property {number} search_cache_size - Number of search cache entries
 * @property {number} total_cache_entries - Total cache entries
 * @property {number} cache_ttl_hours - Cache TTL in hours
 */

// ── Caching ────────────────────────────────────────────────────

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (CVE data is relatively static)
/** @type {Map<string, CacheEntry>} */
const cveCache = new Map(); // Cache for CVE lookups by ID
/** @type {Map<string, CacheEntry>} */
const searchCache = new Map(); // Cache for keyword/vendor searches
/** @type {number} */
let cacheHits = 0;
/** @type {number} */
let cacheMisses = 0;

/**
 * Get cached data if still valid.
 * @param {Map} cache - Cache map to query
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if expired/missing
 */
function getCached(cache, key) {
  const entry = cache.get(key);
  if (!entry) {
    cacheMisses++;
    return null;
  }
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    cacheMisses++;
    return null;
  }
  cacheHits++;
  return entry.data;
}

/**
 * Store data in cache with current timestamp.
 * @param {Map} cache - Cache map to update
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
function setCache(cache, key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ── Rate limiting ──────────────────────────────────────────────

const REQUEST_WINDOW = 30_000; // 30 seconds
const MAX_REQUESTS = 5;
/** @type {number[]} */
const requestTimestamps = [];
/** @type {Promise<void>} */
let rateLimitQueue = Promise.resolve();

/**
 * Thread-safe rate limiter using a promise queue.
 * Prevents race conditions when multiple tools are called concurrently.
 * @returns {Promise<void>}
 */
async function rateLimitWait() {
  // Queue this request to execute sequentially
  return new Promise((resolve) => {
    rateLimitQueue = rateLimitQueue.then(async () => {
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
      resolve();
    });
  });
}

// ── Helpers ────────────────────────────────────────────────────

/**
 * Fetch data from NVD API 2.0 with rate limiting and timeout.
 * @param {Object} params - NVD API query parameters (cveId, keywordSearch, etc.)
 * @param {number} [timeoutMs=15000] - Request timeout in milliseconds
 * @returns {Promise<Object>} - NVD API response JSON
 * @throws {Error} - On rate limit exceeded, timeout, or HTTP errors
 */
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
 * @param {Object} metrics - CVE metrics object from NVD API
 * @returns {CVSSMetric} - CVSS score, severity, and version
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
 * @param {Object[]} configurations - CPE configuration nodes from NVD API
 * @returns {AffectedProductsInfo} - Affected products info (max 20 products, truncation flag, total count)
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

/**
 * Format raw NVD vulnerability data into standardized CVE object.
 * @param {Object} vuln - Raw vulnerability object from NVD API
 * @returns {FormattedCVE} - Formatted CVE with CVSS, description, affected products, references
 */
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
      const cacheKey = `search:${keyword.toLowerCase()}:${cap}`;
      
      // Check cache first
      const cached = getCached(searchCache, cacheKey);
      if (cached) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              ...cached,
              cached: true,
            }),
          }],
        };
      }

      // Cache miss - fetch from NVD API
      const data = await fetchNVD({
        keywordSearch: keyword,
        resultsPerPage: cap,
      });

      const results = (data.vulnerabilities || []).map(formatCVE);
      
      const response = {
        keyword,
        total_results: data.totalResults || 0,
        returned: results.length,
        results,
      };
      
      // Store in cache
      setCache(searchCache, cacheKey, response);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response),
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

      // Check cache first
      const cached = getCached(cveCache, id);
      if (cached) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              ...cached,
              cached: true,
            }),
          }],
        };
      }

      // Cache miss - fetch from NVD API
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
      
      // Store in cache
      setCache(cveCache, id, result);

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
      const cacheKey = `vendor:${vendor.toLowerCase()}:${product?.toLowerCase() || 'all'}:${cap}`;
      
      // Check cache first
      const cached = getCached(searchCache, cacheKey);
      if (cached) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              ...cached,
              cached: true,
            }),
          }],
        };
      }

      // Cache miss - fetch from NVD API
      const data = await fetchNVD({
        keywordSearch: keyword,
        resultsPerPage: cap,
      });

      const results = (data.vulnerabilities || []).map(formatCVE);
      
      const response = {
        vendor,
        product: product || null,
        total_results: data.totalResults || 0,
        returned: results.length,
        results,
      };
      
      // Store in cache
      setCache(searchCache, cacheKey, response);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response),
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

// Tool: cve_cache_stats
server.tool(
  'cve_cache_stats',
  'Get cache statistics including hit/miss ratio, cache size, and memory usage. Helps monitor caching efficiency.',
  {},
  async () => {
    const totalRequests = cacheHits + cacheMisses;
    const hitRate = totalRequests > 0 ? ((cacheHits / totalRequests) * 100).toFixed(2) : '0.00';
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          cache_hits: cacheHits,
          cache_misses: cacheMisses,
          total_requests: totalRequests,
          hit_rate_percent: parseFloat(hitRate),
          cve_cache_size: cveCache.size,
          search_cache_size: searchCache.size,
          total_cache_entries: cveCache.size + searchCache.size,
          cache_ttl_hours: CACHE_TTL / (60 * 60 * 1000),
        }),
      }],
    };
  }
);

// ── Start ──────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
