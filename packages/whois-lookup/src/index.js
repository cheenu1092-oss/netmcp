#!/usr/bin/env node

/**
 * @file WHOIS Lookup MCP Server - Domain, IP, and ASN information via whois CLI
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Performance metrics
let totalQueries = 0;
let domainQueries = 0;
let ipQueries = 0;
let asnQueries = 0;
let errors = 0;

/**
 * WHOIS query result
 * @typedef {object} WhoisResult
 * @property {string} query - Original query input
 * @property {string} type - Query type (domain, ipv4, ipv6, asn)
 * @property {string} raw - Raw WHOIS output
 * @property {object} parsed - Parsed key-value pairs
 * @property {string} [registrar] - Registrar name (domain queries)
 * @property {string} [created] - Creation date (domain queries)
 * @property {string} [expires] - Expiration date (domain queries)
 * @property {string} [status] - Domain status
 * @property {string} [netname] - Network name (IP queries)
 * @property {string} [country] - Country code
 * @property {string} [org] - Organization name
 */

/**
 * WHOIS statistics
 * @typedef {object} WhoisStatsResult
 * @property {number} total_queries - Total WHOIS queries
 * @property {number} domain_queries - Domain lookups
 * @property {number} ip_queries - IP address lookups
 * @property {number} asn_queries - ASN lookups
 * @property {number} errors - Failed queries
 * @property {number} success_rate - Percentage of successful queries
 */

/**
 * Detect query type based on input format
 * @param {string} query - User input
 * @returns {string} Query type (domain, ipv4, ipv6, asn, unknown)
 */
function detectQueryType(query) {
  // ASN pattern: AS12345 or 12345
  if (/^(AS)?\d+$/i.test(query)) {
    return 'asn';
  }
  
  // IPv4 pattern
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(query)) {
    return 'ipv4';
  }
  
  // IPv6 pattern (simplified, accepts :: notation)
  if (/^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i.test(query)) {
    return 'ipv6';
  }
  
  // Domain pattern (contains dot and no slashes)
  if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(query)) {
    return 'domain';
  }
  
  return 'unknown';
}

/**
 * Parse WHOIS raw output into key-value pairs
 * @param {string} raw - Raw WHOIS output
 * @returns {Record<string, string>} Parsed fields
 */
function parseWhoisOutput(raw) {
  const parsed = {};
  const lines = raw.split('\n');
  
  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('%') || line.trim().startsWith('#')) {
      continue;
    }
    
    // Parse key: value format
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
      const value = match[2].trim();
      
      // Store first occurrence (often most relevant)
      if (!parsed[key]) {
        parsed[key] = value;
      }
    }
  }
  
  return parsed;
}

/**
 * Execute WHOIS query via system CLI
 * @param {string} query - Domain, IP, or ASN to look up
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<WhoisResult>} WHOIS result
 */
async function executeWhois(query, timeoutMs = 15000) {
  totalQueries++;
  
  const type = detectQueryType(query);
  
  // Update query type counters
  if (type === 'domain') domainQueries++;
  else if (type === 'ipv4' || type === 'ipv6') ipQueries++;
  else if (type === 'asn') asnQueries++;
  
  // Normalize ASN queries (add AS prefix if missing)
  let normalizedQuery = query;
  if (type === 'asn' && !/^AS/i.test(query)) {
    normalizedQuery = `AS${query}`;
  }
  
  try {
    // Execute whois command with timeout
    const { stdout, stderr } = await execAsync(`whois ${normalizedQuery}`, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024, // 1MB buffer
    });
    
    if (stderr && stderr.length > 0) {
      console.error(`WHOIS stderr: ${stderr}`);
    }
    
    const raw = stdout;
    const parsed = parseWhoisOutput(raw);
    
    // Build result with type-specific fields
    const result = {
      query: query,
      type: type,
      raw: raw,
      parsed: parsed,
    };
    
    // Extract common domain fields
    if (type === 'domain') {
      result.registrar = parsed.registrar || parsed.sponsoring_registrar || null;
      result.created = parsed.creation_date || parsed.created || null;
      result.expires = parsed.registry_expiry_date || parsed.expiry_date || null;
      result.status = parsed.domain_status || parsed.status || null;
    }
    
    // Extract common IP/network fields
    if (type === 'ipv4' || type === 'ipv6') {
      result.netname = parsed.netname || parsed.network_name || null;
      result.country = parsed.country || null;
      result.org = parsed.org_name || parsed.organization || parsed.org || null;
    }
    
    // Extract ASN fields
    if (type === 'asn') {
      result.asn = parsed.origin || parsed.aut_num || normalizedQuery;
      result.as_name = parsed.as_name || parsed.descr || null;
      result.org = parsed.org_name || parsed.organization || null;
      result.country = parsed.country || null;
    }
    
    return result;
  } catch (err) {
    errors++;
    
    // Handle timeout
    if (err.killed && err.signal === 'SIGTERM') {
      throw new Error(`WHOIS query timeout after ${timeoutMs}ms. The WHOIS server may be slow or unresponsive.`);
    }
    
    // Handle command not found
    if (err.code === 127 || (err.message && err.message.includes('not found'))) {
      throw new Error('WHOIS command not found. Please install whois CLI tool (e.g., apt install whois, brew install whois)');
    }
    
    // Generic error
    throw new Error(`WHOIS query failed: ${err.message}`);
  }
}

/**
 * Main server setup
 */
async function main() {
  const server = new McpServer({
    name: 'whois-lookup',
    version: '0.1.0',
  });

  // Tool 1: whois_lookup - Look up domain, IP, or ASN
  server.tool(
    'whois_lookup',
    'Look up WHOIS information for a domain, IP address, or ASN',
    {
      query: z.string().max(1000).describe('Domain name, IP address, or ASN to look up'),
    },
    async ({ query }) => {
      try {
        const result = await executeWhois(query);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
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

  // Tool 2: whois_domain - Look up domain WHOIS
  server.tool(
    'whois_domain',
    'Look up domain registration information (registrar, dates, status)',
    {
      domain: z.string().max(1000).describe('Domain name (e.g., example.com)'),
    },
    async ({ domain }) => {
      try {
        const type = detectQueryType(domain);
        
        if (type !== 'domain') {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'Input does not appear to be a valid domain name',
                hint: 'Expected format: example.com',
              }),
            }],
          };
        }
        
        const result = await executeWhois(domain);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              domain: result.query,
              registrar: result.registrar,
              created: result.created,
              expires: result.expires,
              status: result.status,
              parsed: result.parsed,
            }, null, 2),
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

  // Tool 3: whois_ip - Look up IP address WHOIS
  server.tool(
    'whois_ip',
    'Look up IP address allocation and network information',
    {
      ip: z.string().max(1000).describe('IPv4 or IPv6 address'),
    },
    async ({ ip }) => {
      try {
        const type = detectQueryType(ip);
        
        if (type !== 'ipv4' && type !== 'ipv6') {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'Input does not appear to be a valid IP address',
                hint: 'Expected format: 8.8.8.8 or 2001:4860:4860::8888',
              }),
            }],
          };
        }
        
        const result = await executeWhois(ip);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              ip: result.query,
              type: result.type,
              netname: result.netname,
              org: result.org,
              country: result.country,
              parsed: result.parsed,
            }, null, 2),
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

  // Tool 4: whois_asn - Look up ASN information
  server.tool(
    'whois_asn',
    'Look up Autonomous System Number (ASN) information',
    {
      asn: z.string().max(1000).describe('ASN (e.g., AS15169 or 15169)'),
    },
    async ({ asn }) => {
      try {
        const type = detectQueryType(asn);
        
        if (type !== 'asn') {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'Input does not appear to be a valid ASN',
                hint: 'Expected format: AS15169 or 15169',
              }),
            }],
          };
        }
        
        const result = await executeWhois(asn);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              asn: result.asn,
              as_name: result.as_name,
              org: result.org,
              country: result.country,
              parsed: result.parsed,
            }, null, 2),
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

  // Tool 5: whois_stats - Performance statistics
  server.tool(
    'whois_stats',
    'Get WHOIS lookup performance and usage statistics',
    {},
    async () => {
      const successRate = totalQueries > 0
        ? ((totalQueries - errors) / totalQueries * 100).toFixed(2)
        : 0;
      
      /** @type {WhoisStatsResult} */
      const stats = {
        total_queries: totalQueries,
        domain_queries: domainQueries,
        ip_queries: ipQueries,
        asn_queries: asnQueries,
        errors: errors,
        success_rate: parseFloat(successRate),
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        }],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WHOIS Lookup MCP Server running on stdio');
}

main().catch(console.error);
