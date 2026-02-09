#!/usr/bin/env node
/**
 * NetMCP FCC Devices — MCP server for querying FCC Equipment Authorization database.
 *
 * Tools:
 *   - fcc_search: Search by grantee name, FCC ID, or product description
 *   - fcc_get: Get details for a specific FCC ID (grantee code)
 *   - fcc_recent: Recently registered grantees in the equipment authorization system
 *
 * Data source: FCC Open Data (Socrata API) — grantee registrations
 *              FCC EAS GenericSearch — equipment details
 *              https://opendata.fcc.gov/resource/3b3k-34jp.json
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const FCC_OPENDATA_API = 'https://opendata.fcc.gov/resource/3b3k-34jp.json';
const FCC_SEARCH_URL = 'https://apps.fcc.gov/oetcf/eas/reports/GenericSearchResult.cfm';

// ── Helpers ────────────────────────────────────────────────────

/**
 * Sanitize user input for use in Socrata SoQL queries.
 * Removes SQL metacharacters and wildcards to prevent injection.
 */
function sanitizeInput(input) {
  // Allow only: alphanumeric, spaces, hyphens, dots, commas, parentheses
  // Remove: SQL wildcards (%), operators, quotes, semicolons, etc.
  return input.replace(/[^\w\s\-\.,()]/g, '').trim();
}

async function fetchJSON(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Query the FCC Open Data (Socrata) API for grantee registrations.
 */
async function queryOpenData(params) {
  const url = new URL(FCC_OPENDATA_API);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return fetchJSON(url.toString());
}

function formatGrantee(g) {
  return {
    grantee_code: g.grantee_code || null,
    grantee_name: g.grantee_name || null,
    address: g.mailing_address || null,
    city: g.city || null,
    state: g.state || null,
    country: g.country || null,
    zip_code: g.zip_code || null,
    contact: g.contact_name || null,
    date_received: g.date_received || null,
    fcc_search_url: g.grantee_code
      ? `https://apps.fcc.gov/oetcf/eas/reports/GenericSearch.cfm?calledFromFrame=Y&grantee_code=${g.grantee_code}`
      : null,
  };
}

// ── MCP Server ─────────────────────────────────────────────────

const server = new McpServer({
  name: 'fcc-devices',
  version: '1.0.0',
  description: 'FCC Equipment Authorization database — search wireless device certifications, grantees, and FCC IDs',
});

// Tool: fcc_search
server.tool(
  'fcc_search',
  'Search the FCC Equipment Authorization database by grantee name, grantee code, or country. Returns registered companies that manufacture wireless devices.',
  {
    query: z.string().describe('Search query — grantee name (e.g. "Apple", "Samsung"), grantee code (e.g. "BCG"), or country (e.g. "United States")'),
    search_type: z.enum(['name', 'code', 'country']).optional().default('name').describe('Type of search: "name" for company name, "code" for grantee code, "country" for country filter'),
    limit: z.number().optional().default(20).describe('Max results (default 20, max 100)'),
  },
  async ({ query, search_type, limit }) => {
    try {
      const cap = Math.min(limit, 100);
      let data;

      switch (search_type) {
        case 'code':
          data = await queryOpenData({
            grantee_code: sanitizeInput(query).toUpperCase(),
            '$limit': cap,
          });
          break;
        case 'country':
          data = await queryOpenData({
            '$where': `upper(country) like '%${sanitizeInput(query).toUpperCase()}%'`,
            '$limit': cap,
            '$order': 'date_received DESC',
          });
          break;
        case 'name':
        default:
          data = await queryOpenData({
            '$where': `upper(grantee_name) like '%${sanitizeInput(query).toUpperCase()}%'`,
            '$limit': cap,
            '$order': 'date_received DESC',
          });
          break;
      }

      const results = (data || []).map(formatGrantee);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query,
            search_type,
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

// Tool: fcc_get
server.tool(
  'fcc_get',
  'Get details for a specific FCC grantee by their grantee code. The grantee code is the first 3-5 characters of an FCC ID.',
  {
    grantee_code: z.string().describe('FCC grantee code (3-5 alphanumeric chars, e.g. "BCG" for Apple, "A3L" for Samsung)'),
  },
  async ({ grantee_code }) => {
    try {
      const code = sanitizeInput(grantee_code).toUpperCase();
      
      // Validate grantee code format (3-5 alphanumeric characters)
      if (!/^[A-Z0-9]{3,5}$/.test(code)) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Invalid grantee code format: "${grantee_code}". Must be 3-5 alphanumeric characters (e.g., "BCG", "A3L").`,
            }),
          }],
        };
      }
      
      const data = await queryOpenData({
        grantee_code: code,
      });

      if (!data?.length) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `No grantee found for code "${code}".`,
              hint: 'Grantee codes are 3-5 alphanumeric characters. Try fcc_search to find the correct code.',
            }),
          }],
        };
      }

      const grantee = formatGrantee(data[0]);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...grantee,
            equipment_search_url: `https://apps.fcc.gov/oetcf/eas/reports/GenericSearch.cfm?calledFromFrame=Y&grantee_code=${code}`,
            note: 'Use the equipment_search_url to browse all certified devices for this grantee on the FCC website.',
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

// Tool: fcc_recent
server.tool(
  'fcc_recent',
  'Get the most recently registered grantees in the FCC Equipment Authorization System. Useful for tracking new wireless device manufacturers.',
  {
    limit: z.number().optional().default(20).describe('Number of recent grantees to return (default 20, max 100)'),
    country: z.string().optional().describe('Filter by country (e.g. "United States", "China", "South Korea")'),
  },
  async ({ limit, country }) => {
    try {
      const cap = Math.min(limit, 100);
      const params = {
        '$limit': cap,
        '$order': 'date_received DESC',
      };

      if (country) {
        params['$where'] = `upper(country) like '%${sanitizeInput(country).toUpperCase()}%'`;
      }

      const data = await queryOpenData(params);
      const results = (data || []).map(formatGrantee);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            count: results.length,
            country_filter: country || 'all',
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
