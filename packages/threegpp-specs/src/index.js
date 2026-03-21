#!/usr/bin/env node
/**
 * NetMCP 3GPP Specs — MCP server for searching 3GPP specifications (5G/LTE/NR).
 *
 * Tools:
 *   - spec_search: Search 3GPP specifications by number or keyword
 *   - spec_get: Get details for a specific spec (e.g. TS 23.501)
 *   - spec_releases: List specs by 3GPP release (15, 16, 17, 18)
 *
 * Data source: 3GPP FTP archive (https://www.3gpp.org/ftp/Specs/archive/)
 *              Spec directory listing is scraped and cached.
 *
 * Spec numbers follow the format: SS.NNN (e.g. 23.501, 38.300)
 * Series map to technology areas (21-series = Requirements, 23 = Architecture, etc.)
 *
 * @typedef {Object} SeriesInfo
 * @property {string} area - Technology area name (e.g., "Architecture", "Security")
 * @property {string} group - Responsible working group (e.g., "SA2", "RAN", "CT1")
 * @property {string} description - Detailed description of the series
 *
 * @typedef {Object} SpecInfo
 * @property {string} number - Spec number in SS.NNN format (e.g., "23.501", "38.300")
 * @property {string} title - Full specification title
 * @property {string} type - Specification type ("TS" for Technical Specification, "TR" for Technical Report)
 * @property {string} series - Series number (first two digits of spec number)
 * @property {number[]} releases - List of 3GPP releases where this spec exists (e.g., [15, 16, 17, 18])
 * @property {string} group - Responsible working group
 * @property {string} area - Technology area or domain
 *
 * @typedef {Object} ReleaseInfo
 * @property {string} name - Release name (e.g., "Release 15")
 * @property {string} year - Year of release freeze
 * @property {string} tech - Technology introduced/enhanced (e.g., "5G Phase 1", "LTE-Advanced")
 * @property {string} status - Release status ("Frozen", "Under change control", "Open")
 *
 * @typedef {Object} FormattedSpec
 * @property {string} number - Spec number (e.g., "23.501")
 * @property {string} title - Specification title
 * @property {string} type - "TS" or "TR"
 * @property {string} series - Series number
 * @property {string|null} series_name - Series area name
 * @property {string|null} responsible_group - Working group responsible for the spec
 * @property {string|null} area - Technology area or description
 * @property {number[]} releases - List of applicable 3GPP releases
 * @property {string} status - "Active" or "Frozen"
 * @property {string} archive_url - URL to the 3GPP archive for this spec
 *
 * @typedef {Object} SpecSearchResult
 * @property {string} query - Original search query
 * @property {number} returned - Number of results returned
 * @property {FormattedSpec[]} results - Array of matching specifications
 *
 * @typedef {Object} SpecReleaseResult
 * @property {ReleaseInfo} release - Release metadata
 * @property {number} release_number - Release number (e.g., 15, 16, 17, 18)
 * @property {number} curated_specs_count - Number of curated specs in this release
 * @property {FormattedSpec[]} curated_specs - Array of specifications
 * @property {string[]|undefined} ftp_series_available - List of series available on FTP (e.g., ["23_series", "38_series"])
 * @property {string} ftp_url - URL to the 3GPP FTP for this release
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const ARCHIVE_BASE = 'https://www.3gpp.org/ftp/Specs/archive';
const LATEST_BASE = 'https://www.3gpp.org/ftp/Specs/latest';

// ── 3GPP Series Metadata ──────────────────────────────────────

/**
 * @type {Record<string, SeriesInfo>}
 */
const SERIES_INFO = {
  '21': { area: 'Requirements', group: 'SA', description: 'Requirements specifications' },
  '22': { area: 'Service & System Aspects', group: 'SA1', description: 'Service requirements' },
  '23': { area: 'Architecture', group: 'SA2', description: 'System architecture and procedures' },
  '24': { area: 'Signalling Protocols', group: 'CT1', description: 'NAS protocols (CC, MM, SMS)' },
  '25': { area: 'Radio Access (UTRA/UTRAN)', group: 'RAN', description: 'WCDMA/HSPA radio access' },
  '26': { area: 'Codecs', group: 'SA4', description: 'Speech and multimedia codecs' },
  '27': { area: 'Data', group: 'CT1', description: 'Data terminal equipment interfaces' },
  '28': { area: 'Signalling (SS No.7)', group: 'CT4', description: 'MAP, GTP, Diameter signalling' },
  '29': { area: 'Core Network Protocols', group: 'CT3/CT4', description: 'SIP, Diameter, HTTP/2 APIs' },
  '31': { area: 'UICC/USIM', group: 'CT6', description: 'SIM/USIM/ISIM specifications' },
  '32': { area: 'OAM', group: 'SA5', description: 'Charging, performance, fault management' },
  '33': { area: 'Security', group: 'SA3', description: 'Security algorithms, protocols, architectures' },
  '34': { area: 'Testing (UTRA)', group: 'RAN5', description: 'UTRA UE conformance testing' },
  '35': { area: 'Security Algorithms', group: 'SA3', description: 'Encryption and integrity algorithms' },
  '36': { area: 'LTE Radio', group: 'RAN', description: 'E-UTRA/E-UTRAN (4G LTE) radio specifications' },
  '37': { area: 'Radio Measurements', group: 'RAN4', description: 'Radio measurement and protocol conformance' },
  '38': { area: 'NR (5G Radio)', group: 'RAN', description: 'NR/NG-RAN (5G New Radio) specifications' },
};

/**
 * Well-known key specifications with titles and descriptions.
 * This serves as a curated index for the most commonly referenced specs.
 * @type {SpecInfo[]}
 */
const KEY_SPECS = [
  // 5G Core & Architecture
  { number: '23.501', title: 'System architecture for the 5G System (5GS)', type: 'TS', series: '23', releases: [15,16,17,18], group: 'SA2', area: '5G Core Architecture' },
  { number: '23.502', title: 'Procedures for the 5G System (5GS)', type: 'TS', series: '23', releases: [15,16,17,18], group: 'SA2', area: '5G Core Procedures' },
  { number: '23.503', title: 'Policy and charging control framework for the 5G System', type: 'TS', series: '23', releases: [15,16,17,18], group: 'SA2', area: '5G Policy & Charging' },
  { number: '23.288', title: 'Architecture enhancements for 5G System (NWDAF)', type: 'TS', series: '23', releases: [16,17,18], group: 'SA2', area: '5G Analytics' },
  { number: '23.256', title: 'Support of Uncrewed Aerial Systems (UAS) connectivity', type: 'TS', series: '23', releases: [17,18], group: 'SA2', area: 'Drones/UAS' },

  // 5G NR Radio
  { number: '38.300', title: 'NR; Overall description; Stage-2', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN', area: '5G NR Overview' },
  { number: '38.101-1', title: 'NR; User Equipment (UE) radio transmission and reception; Part 1: Range 1 Standalone', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN4', area: '5G NR UE RF' },
  { number: '38.101-2', title: 'NR; User Equipment (UE) radio transmission and reception; Part 2: Range 2 Standalone', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN4', area: '5G NR mmWave' },
  { number: '38.211', title: 'NR; Physical channels and modulation', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN1', area: '5G NR Physical Layer' },
  { number: '38.212', title: 'NR; Multiplexing and channel coding', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN1', area: '5G NR Coding' },
  { number: '38.213', title: 'NR; Physical layer procedures for control', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN1', area: '5G NR Control' },
  { number: '38.214', title: 'NR; Physical layer procedures for data', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN1', area: '5G NR Data' },
  { number: '38.321', title: 'NR; Medium Access Control (MAC) protocol specification', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN2', area: '5G NR MAC' },
  { number: '38.322', title: 'NR; Radio Link Control (RLC) protocol specification', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN2', area: '5G NR RLC' },
  { number: '38.323', title: 'NR; Packet Data Convergence Protocol (PDCP) specification', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN2', area: '5G NR PDCP' },
  { number: '38.331', title: 'NR; Radio Resource Control (RRC) protocol specification', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN2', area: '5G NR RRC' },
  { number: '38.401', title: 'NG-RAN; Architecture description', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN3', area: '5G RAN Architecture' },
  { number: '38.413', title: 'NG-RAN; NG Application Protocol (NGAP)', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN3', area: '5G NGAP' },
  { number: '38.423', title: 'NG-RAN; Xn Application Protocol (XnAP)', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN3', area: '5G XnAP' },
  { number: '38.473', title: 'NG-RAN; F1 Application Protocol (F1AP)', type: 'TS', series: '38', releases: [15,16,17,18], group: 'RAN3', area: '5G F1AP' },

  // LTE Radio
  { number: '36.300', title: 'E-UTRA and E-UTRAN; Overall description; Stage 2', type: 'TS', series: '36', releases: [8,9,10,11,12,13,14,15,16,17,18], group: 'RAN', area: 'LTE Overview' },
  { number: '36.211', title: 'E-UTRA; Physical channels and modulation', type: 'TS', series: '36', releases: [8,9,10,11,12,13,14,15,16,17], group: 'RAN1', area: 'LTE Physical Layer' },
  { number: '36.331', title: 'E-UTRA; Radio Resource Control (RRC) protocol specification', type: 'TS', series: '36', releases: [8,9,10,11,12,13,14,15,16,17], group: 'RAN2', area: 'LTE RRC' },
  { number: '36.413', title: 'E-UTRA; S1 Application Protocol (S1AP)', type: 'TS', series: '36', releases: [8,9,10,11,12,13,14,15,16,17], group: 'RAN3', area: 'LTE S1AP' },

  // Core Network & Protocols
  { number: '29.500', title: 'Technical Realization of Service Based Architecture', type: 'TS', series: '29', releases: [15,16,17,18], group: 'CT3', area: '5G SBA' },
  { number: '29.501', title: 'Principles and Guidelines for Services Definition', type: 'TS', series: '29', releases: [15,16,17,18], group: 'CT3', area: '5G API Design' },
  { number: '29.510', title: 'NF Repository Services (NRF)', type: 'TS', series: '29', releases: [15,16,17,18], group: 'CT3', area: '5G NRF' },
  { number: '29.571', title: 'Common Data Types for Service Based Interfaces', type: 'TS', series: '29', releases: [15,16,17,18], group: 'CT3', area: '5G Common Data' },

  // NAS (Non-Access Stratum)
  { number: '24.501', title: '5GS; NAS protocol for 5G System; Stage 3', type: 'TS', series: '24', releases: [15,16,17,18], group: 'CT1', area: '5G NAS' },
  { number: '24.502', title: 'Access to the 3GPP 5GCN via non-3GPP access', type: 'TS', series: '24', releases: [15,16,17,18], group: 'CT1', area: '5G Non-3GPP Access' },

  // Security
  { number: '33.501', title: 'Security architecture and procedures for 5G System', type: 'TS', series: '33', releases: [15,16,17,18], group: 'SA3', area: '5G Security' },
  { number: '33.401', title: 'Security architecture for SAE (LTE Security)', type: 'TS', series: '33', releases: [8,9,10,11,12,13,14,15,16,17], group: 'SA3', area: 'LTE Security' },

  // Management / OAM
  { number: '32.255', title: '5G data connectivity domain charging', type: 'TS', series: '32', releases: [15,16,17,18], group: 'SA5', area: '5G Charging' },
  { number: '28.531', title: 'Management and orchestration; Provisioning', type: 'TS', series: '28', releases: [15,16,17,18], group: 'SA5', area: 'Network Slicing Mgmt' },
  { number: '28.541', title: 'Management and orchestration; 5G NRM information model', type: 'TS', series: '28', releases: [15,16,17,18], group: 'SA5', area: '5G NRM' },

  // Service Requirements
  { number: '22.261', title: 'Service requirements for the 5G system', type: 'TS', series: '22', releases: [15,16,17,18], group: 'SA1', area: '5G Requirements' },
  { number: '22.278', title: 'Service requirements for the Evolved Packet System (EPS)', type: 'TS', series: '22', releases: [8,9,10,11,12,13,14,15], group: 'SA1', area: 'LTE/EPS Requirements' },

  // Technical Reports (TRs)
  { number: '21.915', title: 'Release 15 Description; Summary of Rel-15 Work Items', type: 'TR', series: '21', releases: [15], group: 'SA', area: 'Release Summary' },
  { number: '21.916', title: 'Release 16 Description; Summary of Rel-16 Work Items', type: 'TR', series: '21', releases: [16], group: 'SA', area: 'Release Summary' },
  { number: '21.917', title: 'Release 17 Description; Summary of Rel-17 Work Items', type: 'TR', series: '21', releases: [17], group: 'SA', area: 'Release Summary' },
  { number: '21.918', title: 'Release 18 Description; Summary of Rel-18 Work Items', type: 'TR', series: '21', releases: [18], group: 'SA', area: 'Release Summary' },
  { number: '38.912', title: 'Study on New Radio (NR) access technology', type: 'TR', series: '38', releases: [14,15], group: 'RAN', area: '5G NR Study' },
  { number: '23.700-series', title: 'Study items for Stage 2 architecture enhancements', type: 'TR', series: '23', releases: [17,18], group: 'SA2', area: 'Architecture Studies' },
];

/**
 * 3GPP Release information.
 * @type {Record<number, ReleaseInfo>}
 */
const RELEASES = {
  8:  { name: 'Release 8',  year: '2008', tech: 'LTE (4G)', status: 'Frozen' },
  9:  { name: 'Release 9',  year: '2009', tech: 'LTE-Advanced prep', status: 'Frozen' },
  10: { name: 'Release 10', year: '2011', tech: 'LTE-Advanced (4.5G)', status: 'Frozen' },
  11: { name: 'Release 11', year: '2012', tech: 'LTE-Advanced enhancements', status: 'Frozen' },
  12: { name: 'Release 12', year: '2014', tech: 'LTE-Advanced Pro prep', status: 'Frozen' },
  13: { name: 'Release 13', year: '2016', tech: 'LTE-Advanced Pro (4.9G)', status: 'Frozen' },
  14: { name: 'Release 14', year: '2017', tech: 'LTE-A Pro, 5G study items', status: 'Frozen' },
  15: { name: 'Release 15', year: '2018', tech: '5G Phase 1 (NSA + SA)', status: 'Frozen' },
  16: { name: 'Release 16', year: '2020', tech: '5G Phase 2 (URLLC, V2X, NPN)', status: 'Frozen' },
  17: { name: 'Release 17', year: '2022', tech: '5G-Advanced prep (NTN, RedCap, XR)', status: 'Frozen' },
  18: { name: 'Release 18', year: '2024', tech: '5G-Advanced (AI/ML, Ambient IoT)', status: 'Under change control' },
  19: { name: 'Release 19', year: '2025-26', tech: '5G-Advanced Phase 2 / 6G study', status: 'Open' },
};

// ── Helpers ────────────────────────────────────────────────────

/**
 * Scrape a 3GPP FTP directory listing for spec folders.
 * Fetches HTML from 3GPP archive FTP server and extracts spec numbers via regex.
 * @param {string} seriesPath - FTP path to series directory (e.g., "23_series", "38_series")
 * @returns {Promise<string[]>} Array of spec numbers found (e.g., ["23.501", "23.502"])
 * @throws {Error} If HTTP request fails or times out
 */
async function fetchSpecList(seriesPath) {
  const url = `${ARCHIVE_BASE}/${seriesPath}/`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Extract spec folder names like "23.501", "38.300" from href links
    const regex = /href="[^"]*?(\d{2}\.\d{3}[a-zA-Z0-9\-]*)"/g;
    const specs = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      specs.push(match[1]);
    }
    return [...new Set(specs)];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Format a SpecInfo object into a standardized FormattedSpec with all metadata.
 * Enriches spec with series information and determines status based on releases.
 * @param {SpecInfo} spec - Raw specification object
 * @returns {FormattedSpec} Formatted specification with full metadata
 */
function formatSpec(spec) {
  const seriesNum = spec.number.split('.')[0];
  const seriesInfo = SERIES_INFO[seriesNum] || {};

  return {
    number: spec.number,
    title: spec.title,
    type: spec.type,
    series: seriesNum,
    series_name: seriesInfo.area || null,
    responsible_group: spec.group || seriesInfo.group || null,
    area: spec.area || seriesInfo.description || null,
    releases: spec.releases || [],
    status: spec.releases?.includes(18) ? 'Active' : 'Frozen',
    archive_url: `${ARCHIVE_BASE}/${seriesNum}_series/${spec.number}/`,
  };
}

// ── MCP Server ─────────────────────────────────────────────────

const server = new McpServer({
  name: 'threegpp-specs',
  version: '1.0.0',
  description: '3GPP specifications database — search 5G/LTE/NR standards, releases, and spec details',
});

// Tool: spec_search
server.tool(
  'spec_search',
  'Search 3GPP specifications by number or keyword. Covers 5G NR, LTE, core network, security, and all 3GPP technology areas.',
  {
    query: z.string().describe('Search query — spec number (e.g. "23.501", "38.300") or keyword (e.g. "5G security", "NR physical", "NWDAF", "network slicing")'),
    limit: z.number().optional().default(20).describe('Max results (default 20)'),
  },
  async ({ query, limit }) => {
    try {
      const q = query.toLowerCase().trim();
      const cap = Math.min(limit, 100);

      // Search through our curated spec database
      let results = KEY_SPECS.filter(spec => {
        const searchable = [
          spec.number,
          spec.title,
          spec.area,
          spec.group,
          spec.type,
          SERIES_INFO[spec.series]?.area || '',
          SERIES_INFO[spec.series]?.description || '',
        ].join(' ').toLowerCase();

        return searchable.includes(q);
      });

      // If the query looks like a series number (e.g. "38"), also try fetching from the FTP
      const seriesMatch = q.match(/^(\d{2})$/);
      if (seriesMatch && SERIES_INFO[seriesMatch[1]]) {
        const seriesNum = seriesMatch[1];
        try {
          const ftpSpecs = await fetchSpecList(`${seriesNum}_series`);
          const ftpResults = ftpSpecs.map(num => ({
            number: num,
            title: `${SERIES_INFO[seriesNum]?.area || 'Unknown'} specification`,
            type: 'TS',
            series: seriesNum,
            releases: [],
            group: SERIES_INFO[seriesNum]?.group || null,
            area: SERIES_INFO[seriesNum]?.description || null,
          }));
          // Merge: prefer curated entries, add FTP-only ones
          const known = new Set(results.map(r => r.number));
          for (const ftp of ftpResults) {
            if (!known.has(ftp.number)) {
              results.push(ftp);
            }
          }
        } catch {
          // FTP fetch failed, use local data only
        }
      }

      results = results.slice(0, cap).map(formatSpec);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query,
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

// Tool: spec_get
server.tool(
  'spec_get',
  'Get details for a specific 3GPP specification by its number (e.g. "TS 23.501", "38.300", "33.501"). Returns title, responsible group, releases, and archive link.',
  {
    spec_number: z.string().describe('3GPP spec number (e.g. "23.501", "TS 38.300", "33.501")'),
  },
  async ({ spec_number }) => {
    try {
      // Normalize: strip TS/TR prefix, trim
      const cleaned = spec_number.replace(/^(TS|TR)\s*/i, '').trim();

      // Find in our curated database
      const spec = KEY_SPECS.find(s => s.number === cleaned);

      if (spec) {
        const formatted = formatSpec(spec);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(formatted),
          }],
        };
      }

      // Not in curated DB — try to look it up via FTP
      const seriesNum = cleaned.split('.')[0];
      if (!SERIES_INFO[seriesNum]) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Unknown series "${seriesNum}". Valid 3GPP series: ${Object.keys(SERIES_INFO).join(', ')}`,
            }),
          }],
        };
      }

      // Check if spec exists on FTP
      try {
        const ftpSpecs = await fetchSpecList(`${seriesNum}_series`);
        if (ftpSpecs.includes(cleaned)) {
          const seriesInfo = SERIES_INFO[seriesNum];
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                number: cleaned,
                title: `${seriesInfo.area} specification (details not in curated database)`,
                type: 'TS',
                series: seriesNum,
                series_name: seriesInfo.area,
                responsible_group: seriesInfo.group,
                area: seriesInfo.description,
                releases: [],
                status: 'Unknown (check archive)',
                archive_url: `${ARCHIVE_BASE}/${seriesNum}_series/${cleaned}/`,
                note: 'This spec exists in the 3GPP archive but is not in our curated database. Visit the archive URL for full details.',
              }),
            }],
          };
        }
      } catch {
        // FTP unavailable
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `Spec "${cleaned}" not found.`,
            hint: 'Try spec_search with a keyword to find the correct spec number.',
            series_info: SERIES_INFO[seriesNum] || null,
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

// Tool: spec_releases
server.tool(
  'spec_releases',
  'List 3GPP specifications by release number. Shows what was introduced or updated in each release (15=5G Phase 1, 16=Phase 2, 17=5G-Advanced, 18=AI/ML).',
  {
    release: z.number().describe('3GPP release number (e.g. 15, 16, 17, 18). Release 15 = first 5G, 18 = 5G-Advanced'),
  },
  async ({ release }) => {
    try {
      const relInfo = RELEASES[release];
      if (!relInfo) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Unknown release ${release}. Available releases: ${Object.keys(RELEASES).join(', ')}`,
              releases: RELEASES,
            }),
          }],
        };
      }

      // Filter specs that include this release
      const specs = KEY_SPECS
        .filter(s => s.releases.includes(release))
        .map(formatSpec);

      // Try to get the FTP listing for this release
      let ftpSeriesList = [];
      try {
        const url = `${LATEST_BASE}/Rel-${release}/`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
          const html = await res.text();
          const regex = /href="[^"]*?(\d{2}_series)"/g;
          let match;
          while ((match = regex.exec(html)) !== null) {
            ftpSeriesList.push(match[1]);
          }
        }
      } catch {
        // Ignore FTP errors
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            release: relInfo,
            release_number: release,
            curated_specs_count: specs.length,
            curated_specs: specs,
            ftp_series_available: ftpSeriesList.length ? ftpSeriesList : undefined,
            ftp_url: `${LATEST_BASE}/Rel-${release}/`,
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
