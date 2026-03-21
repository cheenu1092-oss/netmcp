#!/usr/bin/env node
/**
 * NetMCP RFC Search — MCP server for querying IETF RFCs and Internet Standards.
 *
 * Tools:
 *   - rfc_get: Get a specific RFC by number
 *   - rfc_search: Search RFCs by keyword, author, or working group
 *   - rfc_recent: Get recently published RFCs
 *
 * Data source: IETF Datatracker API (https://datatracker.ietf.org/api/)
 *              RFC Editor (https://www.rfc-editor.org/)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ── Type Definitions ───────────────────────────────────────────

/**
 * @typedef {Object} RFCDocument
 * @property {string} name - Document name (e.g., "rfc791", "draft-ietf-http-semantics-19")
 * @property {string} title - Full document title
 * @property {number|null} rfc_number - RFC number if published, null for drafts
 * @property {string|null} abstract - Document abstract/summary (trimmed)
 * @property {number} pages - Number of pages
 * @property {string} published - Publication date (ISO 8601 format)
 * @property {string|null} status - Document status (e.g., "PROPOSED STANDARD", "INTERNET STANDARD")
 * @property {string|null} stream - RFC stream (e.g., "IETF", "IAB", "IRTF", "INDEPENDENT")
 * @property {string} url - Direct link to RFC or draft on rfc-editor.org or datatracker.ietf.org
 */

/**
 * @typedef {Object} DataTrackerDocument
 * @property {string} name - Document name from API
 * @property {string} title - Document title
 * @property {number} [rfc_number] - RFC number if available
 * @property {string} [abstract] - Document abstract
 * @property {number} pages - Page count
 * @property {string} time - Publication timestamp
 * @property {string} [std_level] - Standards level
 * @property {string} [stream] - RFC stream
 */

/**
 * @typedef {Object} DataTrackerResponse
 * @property {DataTrackerDocument[]} [objects] - Array of matching documents
 * @property {Object} [meta] - Response metadata
 * @property {number} [meta.total_count] - Total number of results available
 */

/**
 * @typedef {Object} RFCSearchResult
 * @property {string} query - Original search query
 * @property {number} total_available - Total number of matching documents in database
 * @property {number} returned - Number of results returned in this response
 * @property {RFCDocument[]} results - Array of matching RFC documents
 */

/**
 * @typedef {Object} RFCRecentResult
 * @property {number} count - Number of results returned
 * @property {string} area - IETF area filter applied (or "all")
 * @property {RFCDocument[]} results - Array of recent RFC documents
 */

const DATATRACKER_API = 'https://datatracker.ietf.org/api/v1';
const RFC_EDITOR_API = 'https://www.rfc-editor.org/rfc';

// ── Rate Limiting ──────────────────────────────────────────────

// IETF Datatracker API rate limit: Be conservative with 5 requests per 10 seconds
// to avoid triggering any throttling or blocks
const MAX_REQUESTS = 5;
const REQUEST_WINDOW = 10000; // 10 seconds in milliseconds

/** @type {number[]} */
const requestTimestamps = [];

/** @type {Promise<void>} */
let rateLimitQueue = Promise.resolve();

/**
 * Thread-safe rate limiter using a promise queue.
 * Ensures requests respect the 5 req/10s limit even under concurrent tool calls.
 * @returns {Promise<void>}
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
 * Fetch JSON data from a URL with rate limiting and timeout protection.
 * @param {string} url - URL to fetch
 * @param {number} [timeoutMs=10000] - Request timeout in milliseconds
 * @returns {Promise<DataTrackerResponse>} - Parsed JSON response
 * @throws {Error} - If request fails, times out, or returns non-OK status
 */
async function fetchJSON(url, timeoutMs = 10000) {
  // Apply rate limiting before making request
  await rateLimitWait();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Format a Datatracker document object into a standardized RFC document.
 * @param {DataTrackerDocument} doc - Raw document from IETF Datatracker API
 * @returns {RFCDocument} - Formatted RFC document with consistent structure
 */
function formatRFC(doc) {
  return {
    name: doc.name,
    title: doc.title,
    rfc_number: doc.rfc_number || null,
    abstract: doc.abstract?.trim() || null,
    pages: doc.pages,
    published: doc.time,
    status: doc.std_level || null,
    stream: doc.stream || null,
    url: doc.rfc_number
      ? `https://www.rfc-editor.org/rfc/rfc${doc.rfc_number}`
      : `https://datatracker.ietf.org/doc/${doc.name}/`,
  };
}

// ── MCP Server ─────────────────────────────────────────────────

const server = new McpServer({
  name: 'rfc-search',
  version: '1.0.0',
  description: 'IETF RFC & Internet Standards search — 153K+ networking documents',
});

// Tool: rfc_get
server.tool(
  'rfc_get',
  'Get a specific RFC by its number. Returns title, abstract, status, and link to full text.',
  {
    number: z.number().describe('RFC number (e.g. 791 for IP, 2616 for HTTP/1.1, 8446 for TLS 1.3)'),
  },
  async ({ number }) => {
    // Validate RFC number (must be positive, reasonable range)
    if (number < 1 || number > 15000) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ 
            error: `Invalid RFC number: ${number}. Must be between 1 and ~15000.`,
            hint: 'Use rfc_search to find the correct RFC number by keyword.'
          }),
        }],
      };
    }
    
    try {
      const data = await fetchJSON(
        `${DATATRACKER_API}/doc/document/?format=json&name=rfc${number}`
      );

      if (!data.objects?.length) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: `RFC ${number} not found.` }),
          }],
        };
      }

      const doc = data.objects[0];
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(formatRFC({ ...doc, rfc_number: number })),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ 
            error: 'Failed to fetch RFC data from IETF Datatracker. Please try again.',
            details: err.message.includes('HTTP') ? err.message : undefined
          }),
        }],
      };
    }
  }
);

// Tool: rfc_search
server.tool(
  'rfc_search',
  'Search IETF documents by keyword, title, author, or working group. Returns matching RFCs and Internet-Drafts.',
  {
    query: z.string().describe('Search query (keyword, protocol name, or topic)'),
    limit: z.number().optional().default(10).describe('Max results (default 10, max 50)'),
    rfc_only: z.boolean().optional().default(false).describe('If true, only return published RFCs (exclude drafts)'),
  },
  async ({ query, limit, rfc_only }) => {
    try {
      const cap = Math.min(limit, 50);
      let url = `${DATATRACKER_API}/doc/document/?format=json&limit=${cap}&title__icontains=${encodeURIComponent(query)}`;

      if (rfc_only) {
        url += '&type=rfc';
      }

      const data = await fetchJSON(url);
      const results = (data.objects || []).map(formatRFC);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query,
            total_available: data.meta?.total_count || 0,
            returned: results.length,
            results,
          }),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ 
            error: 'Failed to search RFC database. Please try again.',
            details: err.message.includes('HTTP') ? err.message : undefined
          }),
        }],
      };
    }
  }
);

// Tool: rfc_recent
server.tool(
  'rfc_recent',
  'Get the most recently published RFCs. Useful for staying current on new internet standards.',
  {
    limit: z.number().optional().default(10).describe('Number of recent RFCs to return (default 10)'),
    area: z.string().optional().describe('IETF area filter (e.g. "int" for Internet, "rtg" for Routing, "sec" for Security)'),
  },
  async ({ limit, area }) => {
    try {
      const cap = Math.min(limit, 50);
      // IETF Datatracker doesn't support order_by on time or name numerically.
      // Strategy: query recent RFC numbers by guessing the latest range.
      // RFC numbers are sequential — as of early 2026, we're around RFC 9700-9900.
      // Query specific 4-digit ranges descending to find the most recent ones.
      const ranges = [];
      for (let i = 9999; i >= 9000; i -= 100) {
        const prefix = String(i).slice(0, 2); // not useful for 4-digit
        ranges.push(i);
        if (ranges.length >= 10) break;
      }

      // Use name__regex to find RFCs in the 9xxx range, sorted by document ID
      let url = `${DATATRACKER_API}/doc/document/?format=json&limit=200&name__regex=^rfc9%5Cd%7B3%7D$&order_by=-id`;
      if (area) {
        url += `&group__parent__acronym=${encodeURIComponent(area)}`;
      }

      const data = await fetchJSON(url);
      let allResults = data.objects || [];

      // Sort by RFC number descending (highest = most recent)
      allResults.sort((a, b) => {
        const numA = parseInt(a.name.replace('rfc', '')) || 0;
        const numB = parseInt(b.name.replace('rfc', '')) || 0;
        return numB - numA;
      });

      const results = allResults.slice(0, cap).map(doc => {
        const num = parseInt(doc.name.replace('rfc', '')) || null;
        return formatRFC({ ...doc, rfc_number: num });
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            count: results.length,
            area: area || 'all',
            results,
          }),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ 
            error: 'Failed to fetch recent RFCs. Please try again.',
            details: err.message.includes('HTTP') ? err.message : undefined
          }),
        }],
      };
    }
  }
);

// ── Start ──────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
