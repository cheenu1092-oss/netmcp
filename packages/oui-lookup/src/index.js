#!/usr/bin/env node
/**
 * NetMCP OUI Lookup — MCP server for IEEE MAC address vendor resolution.
 *
 * Tools:
 *   - oui_lookup: Resolve a MAC address or OUI prefix to its vendor/manufacturer
 *   - oui_search: Search vendors by name (e.g. "Cisco", "Apple")
 *   - oui_stats: Get database statistics
 *
 * Data source: IEEE OUI registry (https://standards-oui.ieee.org/oui/oui.txt)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'oui.json');

// ── Load database ──────────────────────────────────────────────

let db = {};

function loadDb() {
  if (!existsSync(DB_PATH)) {
    console.error(`OUI database not found at ${DB_PATH}. Run: npm run update-db`);
    return;
  }
  const raw = readFileSync(DB_PATH, 'utf-8');
  db = JSON.parse(raw);
  console.error(`Loaded ${Object.keys(db).length.toLocaleString()} OUI entries`);
}

loadDb();

// ── Helpers ────────────────────────────────────────────────────

/**
 * Normalize a MAC address or OUI prefix to uppercase hex (no separators).
 * Accepts: AA:BB:CC:DD:EE:FF, AA-BB-CC-DD-EE-FF, AABB.CCDD.EEFF, AABBCC, etc.
 * Throws an error if input contains non-hex characters.
 */
function normalizeMAC(input) {
  const normalized = input.replace(/[:\-.\s]/g, '').toUpperCase();
  
  // Validate that the result contains only hex characters
  if (!/^[0-9A-F]+$/.test(normalized)) {
    throw new Error(`Invalid MAC address format: contains non-hex characters. Input: "${input}"`);
  }
  
  return normalized;
}

/**
 * Extract the 6-char OUI prefix from a normalized MAC string.
 */
function extractOUI(normalized) {
  return normalized.slice(0, 6);
}

// ── MCP Server ─────────────────────────────────────────────────

const server = new McpServer({
  name: 'oui-lookup',
  version: '1.0.0',
  description: 'IEEE OUI database — resolve MAC addresses to device vendors',
});

// Tool: oui_lookup
server.tool(
  'oui_lookup',
  'Resolve a MAC address or OUI prefix to its vendor/manufacturer. Accepts formats: AA:BB:CC:DD:EE:FF, AA-BB-CC, AABBCC, etc.',
  {
    mac: z.string().describe('MAC address or OUI prefix (any common format)'),
  },
  async ({ mac }) => {
    let normalized;
    try {
      normalized = normalizeMAC(mac);
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: err.message }),
        }],
      };
    }
    
    if (normalized.length < 6) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Input too short. Need at least 6 hex characters (3 octets).' }),
        }],
      };
    }

    const prefix = extractOUI(normalized);
    const entry = db[prefix];

    if (!entry) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            prefix,
            found: false,
            message: `No vendor found for OUI prefix ${prefix}. May be a locally-administered or unregistered address.`,
          }),
        }],
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          prefix,
          found: true,
          vendor: entry.vendor,
          address: entry.address || null,
          mac_input: mac,
        }),
      }],
    };
  }
);

// Tool: oui_search
server.tool(
  'oui_search',
  'Search the OUI database by vendor name. Returns matching OUI prefixes.',
  {
    query: z.string().describe('Vendor name to search for (e.g. "Cisco", "Apple", "Juniper")'),
    limit: z.number().optional().default(20).describe('Max results to return (default 20)'),
  },
  async ({ query, limit }) => {
    // Sanitize query: allow only alphanumeric, spaces, hyphens, dots, and common punctuation
    const sanitized = query.replace(/[^\w\s\-\.,&()]/g, '').trim();
    if (sanitized.length === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Search query is empty after sanitization. Please use alphanumeric characters.',
          }),
        }],
      };
    }
    
    const q = sanitized.toLowerCase();
    const cap = Math.min(limit, 100);  // Cap at 100 results
    const results = [];

    for (const [prefix, entry] of Object.entries(db)) {
      if (entry.vendor.toLowerCase().includes(q)) {
        results.push({ prefix, vendor: entry.vendor, address: entry.address || null });
        if (results.length >= cap) break;
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          count: results.length,
          truncated: results.length >= limit,
          results,
        }),
      }],
    };
  }
);

// Tool: oui_stats
server.tool(
  'oui_stats',
  'Get statistics about the OUI database (total entries, top vendors by count).',
  {},
  async () => {
    const total = Object.keys(db).length;

    // Count entries per vendor
    const vendorCounts = {};
    for (const entry of Object.values(db)) {
      const v = entry.vendor;
      vendorCounts[v] = (vendorCounts[v] || 0) + 1;
    }

    // Top 20 vendors by OUI count
    const topVendors = Object.entries(vendorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([vendor, count]) => ({ vendor, oui_count: count }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          total_entries: total,
          unique_vendors: Object.keys(vendorCounts).length,
          source: 'IEEE Standards Association (standards-oui.ieee.org)',
          top_vendors: topVendors,
        }),
      }],
    };
  }
);

// ── Start ──────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
