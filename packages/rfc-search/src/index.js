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

const DATATRACKER_API = 'https://datatracker.ietf.org/api/v1';
const RFC_EDITOR_API = 'https://www.rfc-editor.org/rfc';

// ── Helpers ────────────────────────────────────────────────────

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

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
          text: JSON.stringify({ error: err.message }),
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
          text: JSON.stringify({ error: err.message }),
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
      let url = `${DATATRACKER_API}/doc/document/?format=json&limit=${cap}&type=rfc&order_by=-time`;

      if (area) {
        url += `&group__parent__acronym=${encodeURIComponent(area)}`;
      }

      const data = await fetchJSON(url);
      const results = (data.objects || []).map(formatRFC);

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
          text: JSON.stringify({ error: err.message }),
        }],
      };
    }
  }
);

// ── Start ──────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
