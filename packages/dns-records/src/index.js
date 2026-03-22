#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

/**
 * @typedef {Object} DNSRecordType
 * @property {number} type - DNS TYPE value (0-65535)
 * @property {string} name - Record type name (e.g., "A", "AAAA", "MX")
 * @property {string} description - What this record type does
 * @property {string} [rfc] - RFC reference if available
 * @property {string} category - Category (data, mail, security, meta, obsolete, experimental)
 */

/**
 * @typedef {Object} DNSSearchResult
 * @property {string} query - Search query
 * @property {number} count - Number of results
 * @property {boolean} truncated - Whether results were truncated
 * @property {DNSRecordType[]} results - Matching DNS record types
 */

/**
 * @typedef {Object} DNSStatsResult
 * @property {number} total_record_types - Total curated record types
 * @property {number} total_queries - Total queries since startup
 * @property {number} curated_hits - Queries satisfied by curated database
 * @property {string} curated_hit_rate - Percentage of queries satisfied (formatted)
 * @property {Object<string, number>} by_category - Count of record types by category
 * @property {string} data_source - Source of DNS data
 */

/**
 * Curated DNS resource record types from IANA DNS parameters registry.
 * Source: https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml
 * 
 * @type {DNSRecordType[]}
 */
const DNS_RECORDS = [
  // Core data records
  { type: 1, name: 'A', description: 'IPv4 host address', rfc: 'RFC 1035', category: 'data' },
  { type: 28, name: 'AAAA', description: 'IPv6 host address', rfc: 'RFC 3596', category: 'data' },
  { type: 5, name: 'CNAME', description: 'Canonical name (alias)', rfc: 'RFC 1035', category: 'data' },
  { type: 2, name: 'NS', description: 'Authoritative name server', rfc: 'RFC 1035', category: 'data' },
  { type: 12, name: 'PTR', description: 'Domain name pointer (reverse DNS)', rfc: 'RFC 1035', category: 'data' },
  { type: 6, name: 'SOA', description: 'Start of authority (zone metadata)', rfc: 'RFC 1035', category: 'meta' },
  { type: 16, name: 'TXT', description: 'Text strings (SPF, DKIM, etc.)', rfc: 'RFC 1035', category: 'data' },
  
  // Mail records
  { type: 15, name: 'MX', description: 'Mail exchange server', rfc: 'RFC 1035', category: 'mail' },
  
  // Service discovery
  { type: 33, name: 'SRV', description: 'Service locator (host + port)', rfc: 'RFC 2782', category: 'data' },
  { type: 35, name: 'NAPTR', description: 'Naming authority pointer (ENUM, SIP)', rfc: 'RFC 3403', category: 'data' },
  
  // DNSSEC records
  { type: 48, name: 'DNSKEY', description: 'DNS public key', rfc: 'RFC 4034', category: 'security' },
  { type: 46, name: 'RRSIG', description: 'DNSSEC signature', rfc: 'RFC 4034', category: 'security' },
  { type: 47, name: 'NSEC', description: 'Next secure record (DNSSEC)', rfc: 'RFC 4034', category: 'security' },
  { type: 43, name: 'DS', description: 'Delegation signer (DNSSEC chain)', rfc: 'RFC 4034', category: 'security' },
  { type: 50, name: 'NSEC3', description: 'Hashed next secure (DNSSEC)', rfc: 'RFC 5155', category: 'security' },
  { type: 51, name: 'NSEC3PARAM', description: 'NSEC3 parameters', rfc: 'RFC 5155', category: 'security' },
  { type: 25, name: 'KEY', description: 'Public key (obsolete, use DNSKEY)', rfc: 'RFC 2535', category: 'obsolete' },
  { type: 24, name: 'SIG', description: 'Signature (obsolete, use RRSIG)', rfc: 'RFC 2535', category: 'obsolete' },
  
  // Certificate and security
  { type: 257, name: 'CAA', description: 'Certification authority authorization', rfc: 'RFC 8659', category: 'security' },
  { type: 44, name: 'SSHFP', description: 'SSH public key fingerprint', rfc: 'RFC 4255', category: 'security' },
  { type: 52, name: 'TLSA', description: 'TLS certificate association (DANE)', rfc: 'RFC 6698', category: 'security' },
  { type: 59, name: 'CDS', description: 'Child DS (DNSSEC automation)', rfc: 'RFC 7344', category: 'security' },
  { type: 60, name: 'CDNSKEY', description: 'Child DNSKEY (DNSSEC automation)', rfc: 'RFC 7344', category: 'security' },
  { type: 61, name: 'OPENPGPKEY', description: 'OpenPGP public key', rfc: 'RFC 7929', category: 'security' },
  
  // Modern HTTP/HTTPS records
  { type: 64, name: 'SVCB', description: 'Service binding (HTTP/3, QUIC)', rfc: 'RFC 9460', category: 'data' },
  { type: 65, name: 'HTTPS', description: 'HTTPS-specific service binding', rfc: 'RFC 9460', category: 'data' },
  
  // IPv6 and internationalization
  { type: 38, name: 'A6', description: 'IPv6 address (experimental, obsolete)', rfc: 'RFC 3226', category: 'obsolete' },
  { type: 39, name: 'DNAME', description: 'Delegation name (subtree alias)', rfc: 'RFC 6672', category: 'data' },
  
  // Meta and query types
  { type: 41, name: 'OPT', description: 'EDNS0 option (pseudo-record)', rfc: 'RFC 6891', category: 'meta' },
  { type: 249, name: 'TKEY', description: 'Transaction key (for TSIG)', rfc: 'RFC 2930', category: 'meta' },
  { type: 250, name: 'TSIG', description: 'Transaction signature (auth)', rfc: 'RFC 8945', category: 'meta' },
  { type: 251, name: 'IXFR', description: 'Incremental zone transfer', rfc: 'RFC 1995', category: 'meta' },
  { type: 252, name: 'AXFR', description: 'Full zone transfer', rfc: 'RFC 1035', category: 'meta' },
  { type: 255, name: 'ANY', description: 'Query for all records (deprecated)', rfc: 'RFC 8482', category: 'meta' },
  
  // Location and geographic
  { type: 29, name: 'LOC', description: 'Location information (lat/long)', rfc: 'RFC 1876', category: 'data' },
  { type: 99, name: 'SPF', description: 'Sender Policy Framework (obsolete, use TXT)', rfc: 'RFC 7208', category: 'obsolete' },
  
  // Experimental and rare
  { type: 13, name: 'HINFO', description: 'Host information (CPU/OS)', rfc: 'RFC 8482', category: 'obsolete' },
  { type: 17, name: 'RP', description: 'Responsible person', rfc: 'RFC 1183', category: 'data' },
  { type: 18, name: 'AFSDB', description: 'AFS database location', rfc: 'RFC 1183', category: 'data' },
  { type: 42, name: 'APL', description: 'Address prefix list', rfc: 'RFC 3123', category: 'experimental' },
  { type: 45, name: 'IPSECKEY', description: 'IPsec public key', rfc: 'RFC 4025', category: 'security' },
  { type: 55, name: 'HIP', description: 'Host identity protocol', rfc: 'RFC 8005', category: 'experimental' },
  { type: 249, name: 'TKEY', description: 'Transaction key', rfc: 'RFC 2930', category: 'meta' },
  { type: 32769, name: 'DLV', description: 'DNSSEC lookaside validation (obsolete)', rfc: 'RFC 4431', category: 'obsolete' },
];

/** @type {number} */
let totalQueries = 0;

/** @type {number} */
let curatedHits = 0;

/**
 * Look up DNS record type by type number.
 * 
 * @param {number} typeNumber - DNS TYPE value (0-65535)
 * @returns {DNSRecordType|null}
 */
function getRecordByType(typeNumber) {
  return DNS_RECORDS.find(r => r.type === typeNumber) || null;
}

/**
 * Look up DNS record type by name (case-insensitive).
 * 
 * @param {string} name - Record type name (e.g., "A", "AAAA", "MX")
 * @returns {DNSRecordType|null}
 */
function getRecordByName(name) {
  const normalized = name.toUpperCase();
  return DNS_RECORDS.find(r => r.name === normalized) || null;
}

/**
 * Search DNS record types by keyword or description (case-insensitive).
 * 
 * @param {string} query - Search query
 * @param {number} [limit=20] - Max results to return
 * @returns {DNSSearchResult}
 */
function searchRecords(query, limit = 20) {
  const q = query.toLowerCase();
  const matches = DNS_RECORDS.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.description.toLowerCase().includes(q) ||
    (r.rfc && r.rfc.toLowerCase().includes(q)) ||
    r.category.toLowerCase().includes(q)
  );
  
  return {
    query,
    count: matches.length,
    truncated: matches.length > limit,
    results: matches.slice(0, limit),
  };
}

/**
 * Get DNS record statistics.
 * 
 * @returns {DNSStatsResult}
 */
function getStats() {
  const byCategory = DNS_RECORDS.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, /** @type {Object<string, number>} */ ({}));
  
  const hitRate = totalQueries > 0 ? ((curatedHits / totalQueries) * 100).toFixed(1) : '0.0';
  
  return {
    total_record_types: DNS_RECORDS.length,
    total_queries: totalQueries,
    curated_hits: curatedHits,
    curated_hit_rate: `${hitRate}%`,
    by_category: byCategory,
    data_source: 'IANA DNS Parameters Registry (curated)',
  };
}

// Create MCP server
const server = new McpServer({
  name: 'dns-records',
  version: '1.0.0',
});

// Tool 1: record_by_type - Look up DNS record type by type number
server.tool(
  'record_by_type',
  'Look up DNS resource record type by type number (0-65535)',
  {
    type: z.number()
      .min(0, 'Type number must be between 0 and 65535')
      .max(65535, 'Type number must be between 0 and 65535')
      .describe('DNS TYPE value (e.g., 1 for A, 28 for AAAA)'),
  },
  async ({ type }) => {
    totalQueries++;
    
    // Input validation
    if (type < 0 || type > 65535) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Invalid DNS type number. Must be between 0 and 65535.',
            hint: 'Common types: 1=A, 28=AAAA, 15=MX, 5=CNAME, 16=TXT',
          }),
        }],
      };
    }
    
    const record = getRecordByType(type);
    
    if (record) {
      curatedHits++;
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            type: record.type,
            name: record.name,
            description: record.description,
            rfc: record.rfc || 'N/A',
            category: record.category,
            found: true,
          }),
        }],
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `No record type found for TYPE ${type}`,
            hint: 'This type may be reserved, unassigned, or not in curated database. Check IANA DNS parameters for full list.',
            found: false,
          }),
        }],
      };
    }
  }
);

// Tool 2: record_by_name - Look up DNS record type by name
server.tool(
  'record_by_name',
  'Look up DNS resource record type by name (e.g., "A", "AAAA", "MX")',
  {
    name: z.string()
      .min(1, 'Name cannot be empty')
      .max(1000, 'Name too long. Maximum 1000 characters.')
      .describe('Record type name (case-insensitive, e.g., "A", "AAAA", "MX")'),
  },
  async ({ name }) => {
    totalQueries++;
    
    // Input validation
    if (!name || name.length === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Name cannot be empty.',
            hint: 'Provide a record type name like "A", "AAAA", "MX", "CNAME", etc.',
          }),
        }],
      };
    }
    
    if (name.length > 1000) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Input too long. Maximum 1000 characters.' }),
        }],
      };
    }
    
    const record = getRecordByName(name);
    
    if (record) {
      curatedHits++;
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            type: record.type,
            name: record.name,
            description: record.description,
            rfc: record.rfc || 'N/A',
            category: record.category,
            found: true,
          }),
        }],
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `No record type found with name "${name}"`,
            hint: 'Common types: A, AAAA, CNAME, MX, NS, TXT, SRV, CAA. Use record_search to find by keyword.',
            found: false,
          }),
        }],
      };
    }
  }
);

// Tool 3: record_search - Search DNS record types by keyword
server.tool(
  'record_search',
  'Search DNS resource record types by keyword or description',
  {
    query: z.string()
      .min(1, 'Query cannot be empty')
      .max(1000, 'Query too long. Maximum 1000 characters.')
      .describe('Search query (searches name, description, RFC, category)'),
    limit: z.number()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .describe('Maximum number of results to return (default 20, max 100)'),
  },
  async ({ query, limit }) => {
    totalQueries++;
    
    // Input validation
    if (!query || query.length === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Query cannot be empty.',
            hint: 'Try: "mail", "ipv6", "security", "dnssec", "service", etc.',
          }),
        }],
      };
    }
    
    if (query.length > 1000) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Input too long. Maximum 1000 characters.' }),
        }],
      };
    }
    
    const result = searchRecords(query, limit);
    
    if (result.count > 0) {
      curatedHits++;
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result),
      }],
    };
  }
);

// Tool 4: dns_stats - Get DNS record database statistics
server.tool(
  'dns_stats',
  'Get DNS resource record database statistics and performance metrics',
  {},
  async () => {
    totalQueries++;
    curatedHits++;  // Stats requests always hit curated data
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(getStats()),
      }],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
