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
const _FCC_SEARCH_URL = 'https://apps.fcc.gov/oetcf/eas/reports/GenericSearchResult.cfm'; // Reserved for future use

// ── Type Definitions ───────────────────────────────────────────

/**
 * @typedef {object} SocrataGrantee
 * @property {string} [grantee_code] - FCC grantee code (3-5 alphanumeric)
 * @property {string} [grantee_name] - Company name
 * @property {string} [mailing_address] - Mailing address
 * @property {string} [city] - City
 * @property {string} [state] - State
 * @property {string} [country] - Country
 * @property {string} [zip_code] - ZIP code
 * @property {string} [contact_name] - Contact person
 * @property {string} [date_received] - Registration date (ISO 8601)
 */

/**
 * @typedef {object} FCCGrantee
 * @property {string|null} grantee_code - FCC grantee code
 * @property {string|null} grantee_name - Company name
 * @property {string|null} address - Mailing address
 * @property {string|null} city - City
 * @property {string|null} state - State
 * @property {string|null} country - Country
 * @property {string|null} zip_code - ZIP code
 * @property {string|null} contact - Contact person
 * @property {string|null} date_received - Registration date
 * @property {string|null} fcc_search_url - URL to search FCC equipment
 */

/**
 * @typedef {object} FCCSearchResult
 * @property {string} query - Search query
 * @property {string} search_type - Type of search ("name", "code", "country")
 * @property {number} returned - Number of results returned
 * @property {FCCGrantee[]} results - Array of grantee records
 */

/**
 * @typedef {object} FCCRecentResult
 * @property {number} count - Number of results
 * @property {string} country_filter - Country filter applied (or "all")
 * @property {FCCGrantee[]} results - Array of recent grantee registrations
 */

// ── Rate Limiting ──────────────────────────────────────────────

// FCC Socrata API rate limit: 10 requests per 10 seconds (conservative)
// Socrata limits are typically 1000 req/day, but we're being extra cautious
const MAX_REQUESTS = 10;
const REQUEST_WINDOW = 10000; // 10 seconds in milliseconds

/** @type {number[]} */
const requestTimestamps = [];

/** @type {Promise<void>} */
let rateLimitQueue = Promise.resolve();

// Performance metrics
let totalQueries = 0;
let rateLimiterActivations = 0;

/**
 * Thread-safe rate limiter using a promise queue.
 * Ensures requests respect the 10 req/10s limit even under concurrent tool calls.
 * @returns {Promise<void>} Resolves when it's safe to make a request
 */
async function rateLimitWait() {
  // Serialize all rate limit checks via a promise queue
  return new Promise((resolve) => {
    rateLimitQueue = rateLimitQueue.then(async () => {
      const now = Date.now();
      
      // Remove timestamps outside the current window
      while (requestTimestamps.length && requestTimestamps[0] < now - REQUEST_WINDOW) {
        requestTimestamps.shift();
      }
      
      // If at limit, wait until oldest request expires
      if (requestTimestamps.length >= MAX_REQUESTS) {
        const waitMs = requestTimestamps[0] + REQUEST_WINDOW - now + 100; // +100ms buffer
        rateLimiterActivations++;
        await new Promise(r => setTimeout(r, waitMs));
      }
      
      // Record this request
      requestTimestamps.push(Date.now());
      resolve();
    });
  });
}

// ── Helpers ────────────────────────────────────────────────────

/**
 * Sanitize user input for use in Socrata SoQL queries.
 * Removes SQL metacharacters and wildcards to prevent injection.
 * @param {string} input - User input string
 * @returns {string} Sanitized string (alphanumeric, spaces, hyphens, dots, commas, parens only)
 */
function sanitizeInput(input) {
  // Allow only: alphanumeric, spaces, hyphens, dots, commas, parentheses
  // Remove: SQL wildcards (%), operators, quotes, semicolons, etc.
  return input.replace(/[^\w\s.,()-]/g, '').trim();
}

/**
 * Fetch JSON from a URL with rate limiting and timeout.
 * @param {string} url - URL to fetch
 * @param {number} [timeoutMs] - Timeout in milliseconds
 * @returns {Promise<SocrataGrantee[]>} Parsed JSON response
 * @throws {Error} HTTP errors or timeout
 */
async function fetchJSON(url, timeoutMs = 15000) {
  // Apply rate limiting before making request
  await rateLimitWait();
  totalQueries++;
  
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
 * @param {Record<string, string|number>} params - Query parameters
 * @returns {Promise<SocrataGrantee[]>} Array of grantee records
 */
async function queryOpenData(params) {
  const url = new URL(FCC_OPENDATA_API);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return fetchJSON(url.toString());
}

/**
 * Format a Socrata API grantee record into a standardized FCCGrantee object.
 * @param {SocrataGrantee} g - Raw Socrata grantee record
 * @returns {FCCGrantee} Formatted grantee object
 */
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
    // Validate input length (DoS prevention)
    if (query.length > 1000) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Input too long. Maximum 1000 characters.' }),
        }],
      };
    }
    
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

// Tool: fcc_stats
server.tool(
  'fcc_stats',
  'Get runtime statistics and performance metrics for the FCC devices server.',
  {},
  async () => {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          total_queries: totalQueries,
          rate_limiter_activations: rateLimiterActivations,
          current_queue_depth: requestTimestamps.length,
          rate_limit: {
            max_requests: MAX_REQUESTS,
            window_ms: REQUEST_WINDOW,
            window_seconds: REQUEST_WINDOW / 1000,
          },
        }),
      }],
    };
  }
);

// ── Start ──────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
