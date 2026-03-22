#!/usr/bin/env node

/**
 * @file IANA Service/Port/Protocol Registry MCP Server
 * Provides tools for looking up IANA-registered services, ports, and protocols.
 * Data source: IANA Service Name and Transport Protocol Port Number Registry
 * @see https://www.iana.org/assignments/service-names-port-numbers/
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ============================================================================
// CURATED IANA SERVICE/PORT DATABASE
// ============================================================================

/**
 * @typedef {object} ServiceEntry
 * @property {string} name - Service name
 * @property {number|string} port - Port number or range
 * @property {string} protocol - Transport protocol (tcp, udp, sctp, dccp)
 * @property {string} description - Service description
 * @property {string} [assignee] - Assignee/contact (optional)
 * @property {string} [reference] - RFC or reference document (optional)
 */

/**
 * @typedef {object} ProtocolEntry
 * @property {number} number - Protocol number
 * @property {string} name - Protocol keyword
 * @property {string} description - Protocol description
 * @property {string} [reference] - RFC or reference (optional)
 */

/**
 * Curated list of well-known IANA services and ports
 * Source: https://www.iana.org/assignments/service-names-port-numbers/
 * @type {ServiceEntry[]}
 */
const WELL_KNOWN_SERVICES = [
  // System Ports (0-1023)
  { name: 'ftp-data', port: 20, protocol: 'tcp', description: 'File Transfer Protocol (Data)', reference: 'RFC959' },
  { name: 'ftp', port: 21, protocol: 'tcp', description: 'File Transfer Protocol (Control)', reference: 'RFC959' },
  { name: 'ssh', port: 22, protocol: 'tcp', description: 'Secure Shell', reference: 'RFC4253' },
  { name: 'telnet', port: 23, protocol: 'tcp', description: 'Telnet', reference: 'RFC854' },
  { name: 'smtp', port: 25, protocol: 'tcp', description: 'Simple Mail Transfer Protocol', reference: 'RFC5321' },
  { name: 'dns', port: 53, protocol: 'tcp/udp', description: 'Domain Name System', reference: 'RFC1035' },
  { name: 'dhcp', port: 67, protocol: 'udp', description: 'Dynamic Host Configuration Protocol (Server)', reference: 'RFC2131' },
  { name: 'dhcp', port: 68, protocol: 'udp', description: 'Dynamic Host Configuration Protocol (Client)', reference: 'RFC2131' },
  { name: 'http', port: 80, protocol: 'tcp', description: 'Hypertext Transfer Protocol', reference: 'RFC9110' },
  { name: 'pop3', port: 110, protocol: 'tcp', description: 'Post Office Protocol v3', reference: 'RFC1939' },
  { name: 'ntp', port: 123, protocol: 'udp', description: 'Network Time Protocol', reference: 'RFC5905' },
  { name: 'imap', port: 143, protocol: 'tcp', description: 'Internet Message Access Protocol', reference: 'RFC9051' },
  { name: 'snmp', port: 161, protocol: 'udp', description: 'Simple Network Management Protocol', reference: 'RFC3411' },
  { name: 'snmptrap', port: 162, protocol: 'udp', description: 'SNMP Trap', reference: 'RFC3411' },
  { name: 'bgp', port: 179, protocol: 'tcp', description: 'Border Gateway Protocol', reference: 'RFC4271' },
  { name: 'ldap', port: 389, protocol: 'tcp', description: 'Lightweight Directory Access Protocol', reference: 'RFC4511' },
  { name: 'https', port: 443, protocol: 'tcp', description: 'HTTP over TLS/SSL', reference: 'RFC9110' },
  { name: 'smtps', port: 465, protocol: 'tcp', description: 'SMTP over TLS/SSL', reference: 'RFC8314' },
  { name: 'syslog', port: 514, protocol: 'udp', description: 'Syslog', reference: 'RFC5424' },
  { name: 'imaps', port: 993, protocol: 'tcp', description: 'IMAP over TLS/SSL', reference: 'RFC9051' },
  { name: 'pop3s', port: 995, protocol: 'tcp', description: 'POP3 over TLS/SSL', reference: 'RFC2595' },

  // Registered Ports (1024-49151)
  { name: 'mssql', port: 1433, protocol: 'tcp', description: 'Microsoft SQL Server', assignee: 'Microsoft' },
  { name: 'oracle', port: 1521, protocol: 'tcp', description: 'Oracle Database', assignee: 'Oracle' },
  { name: 'mysql', port: 3306, protocol: 'tcp', description: 'MySQL Database', assignee: 'Oracle' },
  { name: 'rdp', port: 3389, protocol: 'tcp', description: 'Remote Desktop Protocol', assignee: 'Microsoft' },
  { name: 'postgresql', port: 5432, protocol: 'tcp', description: 'PostgreSQL Database', assignee: 'PostgreSQL Global Development Group' },
  { name: 'vnc', port: 5900, protocol: 'tcp', description: 'Virtual Network Computing', assignee: 'RealVNC Ltd' },
  { name: 'redis', port: 6379, protocol: 'tcp', description: 'Redis key-value store', assignee: 'Redis Ltd' },
  { name: 'http-alt', port: 8080, protocol: 'tcp', description: 'HTTP Alternate (commonly used)', assignee: 'Network Working Group' },
  { name: 'https-alt', port: 8443, protocol: 'tcp', description: 'HTTPS Alternate (commonly used)', assignee: 'Network Working Group' },
  { name: 'elasticsearch', port: 9200, protocol: 'tcp', description: 'Elasticsearch HTTP', assignee: 'Elastic' },
  { name: 'mongodb', port: 27017, protocol: 'tcp', description: 'MongoDB database', assignee: 'MongoDB Inc' },

  // Notable UDP services
  { name: 'tftp', port: 69, protocol: 'udp', description: 'Trivial File Transfer Protocol', reference: 'RFC1350' },
  { name: 'rip', port: 520, protocol: 'udp', description: 'Routing Information Protocol', reference: 'RFC2453' },

  // VPN/Tunneling
  { name: 'ipsec-ike', port: 500, protocol: 'udp', description: 'IPsec IKE', reference: 'RFC5996' },
  { name: 'openvpn', port: 1194, protocol: 'udp', description: 'OpenVPN', assignee: 'OpenVPN Inc' },
  { name: 'l2tp', port: 1701, protocol: 'udp', description: 'Layer 2 Tunneling Protocol', reference: 'RFC3931' },

  // Messaging/Communication
  { name: 'xmpp-client', port: 5222, protocol: 'tcp', description: 'XMPP Client Connection', reference: 'RFC6120' },
  { name: 'xmpp-server', port: 5269, protocol: 'tcp', description: 'XMPP Server Connection', reference: 'RFC6120' },
  { name: 'sip', port: 5060, protocol: 'tcp/udp', description: 'Session Initiation Protocol', reference: 'RFC3261' },
  { name: 'sips', port: 5061, protocol: 'tcp', description: 'SIP over TLS', reference: 'RFC3261' },
];

/**
 * IANA IP Protocol Numbers
 * Source: https://www.iana.org/assignments/protocol-numbers/
 * @type {ProtocolEntry[]}
 */
const PROTOCOLS = [
  { number: 0, name: 'HOPOPT', description: 'IPv6 Hop-by-Hop Option', reference: 'RFC8200' },
  { number: 1, name: 'ICMP', description: 'Internet Control Message Protocol', reference: 'RFC792' },
  { number: 2, name: 'IGMP', description: 'Internet Group Management Protocol', reference: 'RFC1112' },
  { number: 4, name: 'IPv4', description: 'IPv4 encapsulation', reference: 'RFC2003' },
  { number: 6, name: 'TCP', description: 'Transmission Control Protocol', reference: 'RFC9293' },
  { number: 8, name: 'EGP', description: 'Exterior Gateway Protocol', reference: 'RFC888' },
  { number: 17, name: 'UDP', description: 'User Datagram Protocol', reference: 'RFC768' },
  { number: 41, name: 'IPv6', description: 'IPv6 encapsulation', reference: 'RFC2473' },
  { number: 43, name: 'IPv6-Route', description: 'Routing Header for IPv6', reference: 'RFC8200' },
  { number: 44, name: 'IPv6-Frag', description: 'Fragment Header for IPv6', reference: 'RFC8200' },
  { number: 47, name: 'GRE', description: 'Generic Routing Encapsulation', reference: 'RFC2784' },
  { number: 50, name: 'ESP', description: 'Encapsulating Security Payload', reference: 'RFC4303' },
  { number: 51, name: 'AH', description: 'Authentication Header', reference: 'RFC4302' },
  { number: 58, name: 'IPv6-ICMP', description: 'ICMP for IPv6', reference: 'RFC4443' },
  { number: 59, name: 'IPv6-NoNxt', description: 'No Next Header for IPv6', reference: 'RFC8200' },
  { number: 60, name: 'IPv6-Opts', description: 'Destination Options for IPv6', reference: 'RFC8200' },
  { number: 89, name: 'OSPF', description: 'Open Shortest Path First', reference: 'RFC2328' },
  { number: 132, name: 'SCTP', description: 'Stream Control Transmission Protocol', reference: 'RFC4960' },
];

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/** @type {number} Total number of queries across all tools */
let totalQueries = 0;

/** @type {number} Curated database hits (didn't need IANA API) */
let curatedHits = 0;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate input string length (max 1000 chars to prevent DoS)
 * @param {string} input - User input to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
function validateInputLength(input) {
  if (typeof input !== 'string') {
    return 'Input must be a string';
  }
  if (input.length > 1000) {
    return 'Input too long. Maximum 1000 characters.';
  }
  return null;
}

/**
 * Search curated services by port number
 * @param {number} port - Port number to search
 * @param {string} [protocol] - Optional protocol filter (tcp, udp, etc.)
 * @returns {ServiceEntry[]} Matching service entries
 */
function searchByPort(port, protocol = null) {
  return WELL_KNOWN_SERVICES.filter(s => {
    const portMatch = s.port === port || (typeof s.port === 'string' && s.port.includes(port.toString()));
    if (!portMatch) return false;
    if (protocol && !s.protocol.toLowerCase().includes(protocol.toLowerCase())) return false;
    return true;
  });
}

/**
 * Search curated services by name (case-insensitive)
 * @param {string} name - Service name to search
 * @returns {ServiceEntry[]} Matching service entries
 */
function searchByName(name) {
  const q = name.toLowerCase();
  return WELL_KNOWN_SERVICES.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.description.toLowerCase().includes(q)
  );
}

/**
 * Get protocol by number
 * @param {number} number - Protocol number
 * @returns {ProtocolEntry|null} Protocol entry or null if not found
 */
function getProtocol(number) {
  return PROTOCOLS.find(p => p.number === number) || null;
}

/**
 * Search protocols by name (case-insensitive)
 * @param {string} name - Protocol name or keyword to search
 * @returns {ProtocolEntry[]} Matching protocol entries
 */
function searchProtocols(name) {
  const q = name.toLowerCase();
  return PROTOCOLS.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.description.toLowerCase().includes(q)
  );
}

// ============================================================================
// MCP SERVER SETUP
// ============================================================================

const server = new McpServer({
  name: 'iana-services',
  version: '1.0.0',
});

// ============================================================================
// TOOL: service_by_port - Lookup service(s) by port number
// ============================================================================

server.tool(
  'service_by_port',
  'Look up IANA-registered services by port number',
  {
    port: z.number().int().min(0).max(65535).describe('Port number (0-65535)'),
    protocol: z.string().optional().describe('Optional protocol filter (tcp, udp, sctp)'),
  },
  async ({ port, protocol }) => {
    totalQueries++;
    
    const results = searchByPort(port, protocol);
    
    if (results.length > 0) {
      curatedHits++;
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          port,
          protocol: protocol || 'any',
          found: results.length > 0,
          count: results.length,
          services: results,
          note: results.length === 0 ? 
            'Port not found in curated database. May be unassigned or registered for private use.' : 
            null,
        }, null, 2),
      }],
    };
  }
);

// ============================================================================
// TOOL: service_by_name - Search services by name or description
// ============================================================================

server.tool(
  'service_by_name',
  'Search IANA-registered services by name or description',
  {
    query: z.string().describe('Service name or description keyword to search'),
    limit: z.number().int().min(1).max(100).optional().default(10).describe('Maximum results to return'),
  },
  async ({ query, limit }) => {
    totalQueries++;
    
    const lengthError = validateInputLength(query);
    if (lengthError) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: lengthError }),
        }],
      };
    }

    const results = searchByName(query).slice(0, limit);
    
    if (results.length > 0) {
      curatedHits++;
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          found: results.length > 0,
          count: results.length,
          truncated: searchByName(query).length > limit,
          services: results,
        }, null, 2),
      }],
    };
  }
);

// ============================================================================
// TOOL: protocol_by_number - Get protocol by IANA protocol number
// ============================================================================

server.tool(
  'protocol_by_number',
  'Look up IP protocol by IANA protocol number',
  {
    number: z.number().int().min(0).max(255).describe('Protocol number (0-255)'),
  },
  async ({ number }) => {
    totalQueries++;
    
    const protocol = getProtocol(number);
    
    if (protocol) {
      curatedHits++;
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          number,
          found: protocol !== null,
          protocol: protocol || null,
          note: protocol === null ? 
            'Protocol number not found in curated database. May be unassigned or reserved.' : 
            null,
        }, null, 2),
      }],
    };
  }
);

// ============================================================================
// TOOL: protocol_search - Search protocols by name or description
// ============================================================================

server.tool(
  'protocol_search',
  'Search IP protocols by name or description',
  {
    query: z.string().describe('Protocol name or keyword to search'),
    limit: z.number().int().min(1).max(50).optional().default(10).describe('Maximum results to return'),
  },
  async ({ query, limit }) => {
    totalQueries++;
    
    const lengthError = validateInputLength(query);
    if (lengthError) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: lengthError }),
        }],
      };
    }

    const results = searchProtocols(query).slice(0, limit);
    
    if (results.length > 0) {
      curatedHits++;
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          found: results.length > 0,
          count: results.length,
          truncated: searchProtocols(query).length > limit,
          protocols: results,
        }, null, 2),
      }],
    };
  }
);

// ============================================================================
// TOOL: iana_stats - Performance and database statistics
// ============================================================================

server.tool(
  'iana_stats',
  'Get IANA services package statistics',
  {},
  async () => {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          total_queries: totalQueries,
          curated_hits: curatedHits,
          curated_hit_rate: totalQueries > 0 ? 
            ((curatedHits / totalQueries) * 100).toFixed(1) + '%' : 
            '0%',
          services_database_size: WELL_KNOWN_SERVICES.length,
          protocols_database_size: PROTOCOLS.length,
          port_range: '0-65535',
          protocol_range: '0-255',
        }, null, 2),
      }],
    };
  }
);

// ============================================================================
// SERVER START
// ============================================================================

const transport = new StdioServerTransport();

server.connect(transport).catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
