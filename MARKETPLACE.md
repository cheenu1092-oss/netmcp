# MCP Marketplace Listings

> Submission metadata for MCP marketplace directories to improve discoverability after npm publishing.

This document contains all metadata and assets needed for submitting NetMCP packages to MCP marketplace directories (Smithery, Glama, mcp.run, etc.).

---

## General Metadata (All Marketplaces)

**Project Name:** NetMCP  
**Tagline:** Networking Intelligence for AI Agents  
**Description (short):** Open-source MCP servers that give AI agents structured access to networking standards, device databases, and security data.

**Description (long):**
> AI agents helping network engineers constantly need to look up protocol specs, device info, and security vulnerabilities. Right now they hallucinate RFC numbers, guess at port assignments, and miss critical CVEs.
>
> NetMCP fixes that by wrapping authoritative, free, public networking databases in Model Context Protocol servers — so any AI agent (Claude, GPT, Cursor, OpenClaw, etc.) can query them directly.
>
> **9 packages, 41 tools, 75 tests.** Production-ready with CI/CD, comprehensive docs, and security best practices.

**Author:** Nagarjun Srinivasan (@nagaconda)  
**Organization:** jugaad-lab  
**License:** MIT  
**Repository:** https://github.com/cheenu1092-oss/netmcp  
**Homepage:** https://github.com/cheenu1092-oss/netmcp  
**Documentation:** https://github.com/cheenu1092-oss/netmcp/blob/main/README.md  
**Getting Started:** https://github.com/cheenu1092-oss/netmcp/blob/main/GETTING_STARTED.md  
**Contributing:** https://github.com/cheenu1092-oss/netmcp/blob/main/CONTRIBUTING.md  
**Security:** https://github.com/cheenu1092-oss/netmcp/blob/main/SECURITY.md  
**Publishing Guide:** https://github.com/cheenu1092-oss/netmcp/blob/main/PUBLISHING.md  
**Changelog:** https://github.com/cheenu1092-oss/netmcp/blob/main/CHANGELOG.md

**Category:** Networking, Security, Development Tools  
**Tags:** networking, security, mcp, oui, rfc, nvd, cve, fcc, 3gpp, iana, dns, whois, protocols, standards

**Minimum Requirements:**
- Node.js 20.x or higher
- MCP-compatible client (Claude Desktop, Cursor, OpenClaw, etc.)
- Optional: system `whois` CLI for whois-lookup package

**Installation Methods:**
1. **npm install** (after publishing): `npm install @netmcp/<package-name>`
2. **npx** (instant, no install): `npx @netmcp/<package-name>`
3. **Apify Hosted** (no self-hosting): https://apify.com/jugaad-lab
4. **Git clone** (development): `git clone https://github.com/cheenu1092-oss/netmcp.git`

---

## Individual Package Listings

Each package should be submitted individually to marketplaces. Use these package-specific metadata blocks:

### 1. @netmcp/oui-lookup

**Package Name:** @netmcp/oui-lookup  
**npm URL:** https://www.npmjs.com/package/@netmcp/oui-lookup *(after publishing)*  
**Description:** Lookup MAC address vendor information from the IEEE OUI database (38,000+ manufacturers).  
**Tools:** 4 (oui_lookup, oui_search, oui_vendor_count, oui_stats)  
**Data Source:** IEEE OUI Registry (public)  
**Local Database:** 4.3MB cached IEEE database  
**Rate Limiting:** None (local database, instant lookups)  
**Use Cases:**
- Identify device manufacturer from MAC address
- Security investigations (unknown devices on network)
- Network inventory and asset management
- IoT device classification

**Example Queries:**
- "What company makes the device with MAC address 00:1A:2B:3C:4D:5E?"
- "Show me all MAC prefixes for Apple devices"
- "How many OUI assignments does Cisco have?"

**README:** https://github.com/cheenu1092-oss/netmcp/blob/main/packages/oui-lookup/README.md

---

### 2. @netmcp/rfc-search

**Package Name:** @netmcp/rfc-search  
**npm URL:** https://www.npmjs.com/package/@netmcp/rfc-search *(after publishing)*  
**Description:** Search and retrieve IETF RFC documents (153,000+ technical specs for internet protocols).  
**Tools:** 4 (rfc_get, rfc_search, rfc_recent, rfc_stats)  
**Data Source:** IETF Datatracker API (official source)  
**Rate Limiting:** 5 requests per 10 seconds  
**Network Timeout:** 10 seconds  
**Use Cases:**
- Lookup protocol specifications by RFC number
- Search RFCs by keyword or topic
- Research internet standards history
- Verify protocol implementations against specs

**Example Queries:**
- "Get me RFC 9000 (QUIC protocol)"
- "Find all RFCs about TLS"
- "What are the recent RFCs from the last 30 days?"

**README:** https://github.com/cheenu1092-oss/netmcp/blob/main/packages/rfc-search/README.md

---

### 3. @netmcp/nvd-network-cves

**Package Name:** @netmcp/nvd-network-cves  
**npm URL:** https://www.npmjs.com/package/@netmcp/nvd-network-cves *(after publishing)*  
**Description:** Search NIST National Vulnerability Database for network-related CVEs (250,000+ security vulnerabilities).  
**Tools:** 6 (cve_get, cve_search, cve_by_vendor, cve_by_product, cve_recent, cve_cache_stats)  
**Data Source:** NIST NVD API (official source)  
**Caching:** 24-hour in-memory cache (reduces API load)  
**Rate Limiting:** 5 requests per 30 seconds (NVD strict limits)  
**Network Timeout:** 15 seconds  
**Use Cases:**
- Vulnerability research and threat intelligence
- Security assessments and audits
- Patch management and remediation planning
- CVSS score analysis

**Example Queries:**
- "Get details for CVE-2023-44487 (HTTP/2 Rapid Reset)"
- "Find all CVEs for Cisco IOS"
- "Show me recent Wi-Fi vulnerabilities"
- "What's the cache hit rate for CVE lookups?"

**README:** https://github.com/cheenu1092-oss/netmcp/blob/main/packages/nvd-network-cves/README.md

---

### 4. @netmcp/fcc-devices

**Package Name:** @netmcp/fcc-devices  
**npm URL:** https://www.npmjs.com/package/@netmcp/fcc-devices *(after publishing)*  
**Description:** Search FCC Equipment Authorization database for wireless device certifications (20,000+ grantees).  
**Tools:** 4 (fcc_get, fcc_search, fcc_recent, fcc_stats)  
**Data Source:** FCC Socrata Open Data API (official source)  
**Rate Limiting:** 10 requests per 10 seconds  
**Network Timeout:** 15 seconds  
**Use Cases:**
- Verify FCC certification for wireless products
- Research device manufacturers and grantees
- Compliance and regulatory checks
- Product development and certification planning

**Example Queries:**
- "What FCC ID is associated with Apple?"
- "Find all recent FCC equipment approvals from South Korea"
- "Get details for FCC Grantee Code BCGA"

**README:** https://github.com/cheenu1092-oss/netmcp/blob/main/packages/fcc-devices/README.md

---

### 5. @netmcp/threegpp-specs

**Package Name:** @netmcp/threegpp-specs  
**npm URL:** https://www.npmjs.com/package/@netmcp/threegpp-specs *(after publishing)*  
**Description:** Search 3GPP specifications for 5G/LTE standards (50+ curated specs, FTP fallback for all).  
**Tools:** 4 (spec_get, spec_search, spec_releases, spec_stats)  
**Data Source:** 3GPP Archive + curated local database  
**Curated Database:** 50+ key specifications (instant lookups)  
**FTP Fallback:** Live scraping for comprehensive coverage  
**Network Timeout:** 10 seconds  
**Use Cases:**
- 5G/LTE protocol research
- Mobile network architecture design
- Telecom standards compliance
- Specification version tracking across 3GPP releases

**Example Queries:**
- "Get me 3GPP spec 23.501 (5G System Architecture)"
- "Find all specifications related to NR (5G New Radio)"
- "What are the key specs from 3GPP Release 15?"

**README:** https://github.com/cheenu1092-oss/netmcp/blob/main/packages/threegpp-specs/README.md

---

### 6. @netmcp/iana-services

**Package Name:** @netmcp/iana-services  
**npm URL:** https://www.npmjs.com/package/@netmcp/iana-services *(after publishing)*  
**Description:** Lookup IANA service names, port numbers, and IP protocol assignments (40+ well-known services).  
**Tools:** 5 (service_by_port, service_by_name, protocol_by_number, protocol_search, iana_stats)  
**Data Source:** Curated IANA Service Name and Transport Protocol Port Number Registry  
**Local Database:** 40+ services/ports, 17 IP protocols  
**Rate Limiting:** None (local database, instant lookups)  
**Use Cases:**
- Port number identification and reverse lookup
- Protocol research (TCP, UDP, ICMP, ESP, etc.)
- Firewall rule documentation
- Network security analysis

**Example Queries:**
- "What service runs on port 443?"
- "Find all ports used by VPN protocols"
- "What is IP protocol number 50?" (Answer: ESP)
- "Search for messaging-related services"

**README:** https://github.com/cheenu1092-oss/netmcp/blob/main/packages/iana-services/README.md

---

### 7. @netmcp/dns-records

**Package Name:** @netmcp/dns-records  
**npm URL:** https://www.npmjs.com/package/@netmcp/dns-records *(after publishing)*  
**Description:** Lookup DNS resource record types from IANA registry (48 record types including DNSSEC).  
**Tools:** 4 (record_by_type, record_by_name, record_search, dns_stats)  
**Data Source:** Curated IANA DNS Resource Record Types Registry  
**Local Database:** 48 record types (A, AAAA, MX, CNAME, DNSSEC, etc.)  
**Rate Limiting:** None (local database, instant lookups)  
**Use Cases:**
- DNS protocol research
- DNSSEC implementation planning
- Record type identification (e.g., "What is TYPE 257?")
- DNS security analysis

**Example Queries:**
- "What is DNS record TYPE 28?" (Answer: AAAA)
- "Find all DNSSEC-related record types"
- "Search for HTTP service binding records"
- "Show me all security-related DNS record types"

**README:** https://github.com/cheenu1092-oss/netmcp/blob/main/packages/dns-records/README.md

---

### 8. @netmcp/iana-media-types

**Package Name:** @netmcp/iana-media-types  
**npm URL:** https://www.npmjs.com/package/@netmcp/iana-media-types *(after publishing)*  
**Description:** Lookup IANA media types (MIME types) by extension, type, or category (80+ types).  
**Tools:** 5 (media_by_extension, media_by_type, media_search, media_by_category, media_stats)  
**Data Source:** Curated IANA Media Types Registry  
**Local Database:** 80+ MIME types covering common use cases  
**Rate Limiting:** None (local database, instant lookups)  
**Use Cases:**
- File extension to MIME type mapping
- HTTP Content-Type header generation
- Web development and API design
- Content type validation

**Example Queries:**
- "What MIME type should I use for .webp files?"
- "Find all video-related media types"
- "Search for JSON-based MIME types"
- "Show me all application/* media types in the database"

**README:** https://github.com/cheenu1092-oss/netmcp/blob/main/packages/iana-media-types/README.md

---

### 9. @netmcp/whois-lookup

**Package Name:** @netmcp/whois-lookup  
**npm URL:** https://www.npmjs.com/package/@netmcp/whois-lookup *(after publishing)*  
**Description:** Universal WHOIS lookups for domains, IP addresses, and AS numbers via whois CLI.  
**Tools:** 5 (whois_lookup, whois_domain, whois_ip, whois_asn, whois_stats)  
**Data Source:** WHOIS protocol (RFC 3912) via system CLI  
**Requirement:** System `whois` CLI tool (standard on Linux/macOS)  
**Network Timeout:** 15 seconds  
**Output:** Both raw WHOIS output and parsed key-value pairs  
**Use Cases:**
- Domain registration research (registrar, dates, status)
- IP address allocation and network info
- Autonomous System Number (ASN) lookups
- Security investigations and threat intelligence

**Example Queries:**
- "Who owns example.com?"
- "What network does IP address 8.8.8.8 belong to?"
- "Get information about AS15169 (Google)"
- "Parse the creation date and registrar for github.com"

**README:** https://github.com/cheenu1092-oss/netmcp/blob/main/packages/whois-lookup/README.md

---

## Smithery (smithery.ai) Submission

**Submission Method:** GitHub repository submission  
**Documentation:** https://smithery.ai/docs/submitting-servers

**Required Fields:**
- GitHub repository URL: `https://github.com/cheenu1092-oss/netmcp`
- Package manager: npm
- Category: Networking, Security, Development Tools
- Description: (use "Description (long)" above)
- Installation command: `npx @netmcp/<package-name>`

**Smithery Metadata (mcp.json format):**

```json
{
  "$schema": "https://smithery.ai/schema/mcp.json",
  "name": "NetMCP",
  "description": "Open-source MCP servers that give AI agents structured access to networking standards, device databases, and security data.",
  "homepage": "https://github.com/cheenu1092-oss/netmcp",
  "license": "MIT",
  "author": {
    "name": "Nagarjun Srinivasan",
    "email": "naga22694+clawd@gmail.com",
    "url": "https://github.com/nagaconda"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/cheenu1092-oss/netmcp.git"
  },
  "packages": [
    {
      "name": "@netmcp/oui-lookup",
      "description": "Lookup MAC address vendor information from the IEEE OUI database (38,000+ manufacturers)",
      "category": "networking",
      "install": "npx @netmcp/oui-lookup"
    },
    {
      "name": "@netmcp/rfc-search",
      "description": "Search and retrieve IETF RFC documents (153,000+ technical specs)",
      "category": "networking",
      "install": "npx @netmcp/rfc-search"
    },
    {
      "name": "@netmcp/nvd-network-cves",
      "description": "Search NIST NVD for network-related CVEs (250,000+ vulnerabilities)",
      "category": "security",
      "install": "npx @netmcp/nvd-network-cves"
    },
    {
      "name": "@netmcp/fcc-devices",
      "description": "Search FCC Equipment Authorization database (20,000+ grantees)",
      "category": "networking",
      "install": "npx @netmcp/fcc-devices"
    },
    {
      "name": "@netmcp/threegpp-specs",
      "description": "Search 3GPP specifications for 5G/LTE standards",
      "category": "networking",
      "install": "npx @netmcp/threegpp-specs"
    },
    {
      "name": "@netmcp/iana-services",
      "description": "Lookup IANA service names, port numbers, and IP protocol assignments",
      "category": "networking",
      "install": "npx @netmcp/iana-services"
    },
    {
      "name": "@netmcp/dns-records",
      "description": "Lookup DNS resource record types from IANA registry (48 types)",
      "category": "networking",
      "install": "npx @netmcp/dns-records"
    },
    {
      "name": "@netmcp/iana-media-types",
      "description": "Lookup IANA media types (MIME types) by extension or category",
      "category": "development",
      "install": "npx @netmcp/iana-media-types"
    },
    {
      "name": "@netmcp/whois-lookup",
      "description": "Universal WHOIS lookups for domains, IP addresses, and AS numbers",
      "category": "networking",
      "install": "npx @netmcp/whois-lookup"
    }
  ],
  "keywords": [
    "networking",
    "security",
    "mcp",
    "oui",
    "rfc",
    "nvd",
    "cve",
    "fcc",
    "3gpp",
    "iana",
    "dns",
    "whois",
    "protocols",
    "standards"
  ]
}
```

---

## Glama Submission

**Submission Method:** Web form or API  
**Documentation:** (URL TBD — check https://glama.ai for submission process)

**Required Fields (estimated based on typical marketplaces):**
- Name: NetMCP
- Short description: Networking Intelligence for AI Agents
- Long description: (use "Description (long)" above)
- Category: Networking, Security
- Repository: https://github.com/cheenu1092-oss/netmcp
- License: MIT
- npm packages: `@netmcp/oui-lookup`, `@netmcp/rfc-search`, `@netmcp/nvd-network-cves`, `@netmcp/fcc-devices`, `@netmcp/threegpp-specs`, `@netmcp/iana-services`, `@netmcp/dns-records`, `@netmcp/iana-media-types`, `@netmcp/whois-lookup`
- Installation: `npx @netmcp/<package-name>`
- Documentation: https://github.com/cheenu1092-oss/netmcp/blob/main/README.md

---

## mcp.run Submission

**Submission Method:** GitHub Pull Request to mcp.run registry  
**Documentation:** (URL TBD — check https://mcp.run for submission process)

**Registry Entry Format (YAML estimated):**

```yaml
---
name: NetMCP
slug: netmcp
description: Open-source MCP servers that give AI agents structured access to networking standards, device databases, and security data.
author: Nagarjun Srinivasan
repository: https://github.com/cheenu1092-oss/netmcp
homepage: https://github.com/cheenu1092-oss/netmcp
license: MIT
category:
  - networking
  - security
  - development
tags:
  - networking
  - security
  - mcp
  - oui
  - rfc
  - nvd
  - cve
  - fcc
  - 3gpp
  - iana
  - dns
  - whois
packages:
  - name: "@netmcp/oui-lookup"
    install: "npx @netmcp/oui-lookup"
  - name: "@netmcp/rfc-search"
    install: "npx @netmcp/rfc-search"
  - name: "@netmcp/nvd-network-cves"
    install: "npx @netmcp/nvd-network-cves"
  - name: "@netmcp/fcc-devices"
    install: "npx @netmcp/fcc-devices"
  - name: "@netmcp/threegpp-specs"
    install: "npx @netmcp/threegpp-specs"
  - name: "@netmcp/iana-services"
    install: "npx @netmcp/iana-services"
  - name: "@netmcp/dns-records"
    install: "npx @netmcp/dns-records"
  - name: "@netmcp/iana-media-types"
    install: "npx @netmcp/iana-media-types"
  - name: "@netmcp/whois-lookup"
    install: "npx @netmcp/whois-lookup"
---
```

---

## Screenshots & Media Assets

**Required for marketplace submissions:**

1. **Terminal screenshot** — Example query flow showing:
   - Starting an MCP server
   - AI agent querying a tool
   - Formatted response

2. **Architecture diagram** — (already in README.md)
   - Use GitHub-rendered Mermaid diagram PNG export
   - Or screenshot from README.md

3. **Demo GIF/video** — (P1 priority, create with asciinema)
   - 30-60 second recording
   - Shows: `npx @netmcp/oui-lookup` → start → query → response → exit
   - Recommended tool: `asciinema record demo.cast` → `agg demo.cast demo.gif`

**Asset locations (after creation):**
- `assets/screenshot-terminal.png`
- `assets/architecture-diagram.png`
- `assets/demo.gif`

---

## Social Media & Blog Post Templates

**X/Twitter announcement** (when packages published):
> 🚀 NetMCP is now on npm!
>
> 9 packages, 41 tools for AI agents to query:
> • MAC → Vendor (IEEE OUI)
> • RFCs (IETF Datatracker)
> • CVEs (NIST NVD)
> • FCC Device Auth
> • 3GPP 5G/LTE Specs
> • IANA Registries (Services, DNS, MIME)
> • WHOIS (Domains/IP/ASN)
>
> Try it: `npx @netmcp/oui-lookup`
>
> https://github.com/cheenu1092-oss/netmcp

**LinkedIn/Blog post outline:**
1. Problem: AI agents hallucinate networking data
2. Solution: NetMCP wraps authoritative sources in MCP protocol
3. Features: 9 packages, 41 tools, production-ready
4. Use cases: Network engineering, security research, protocol development
5. Getting started: `npx @netmcp/<package-name>`
6. Call to action: Try it, contribute, star on GitHub

---

## Post-Publishing Checklist

After packages are published to npm, submit to marketplaces in this order:

1. **Update README.md badges:**
   - [ ] Add npm version badges for all 9 packages
   - [ ] Add npm download count badges
   - [ ] Verify CI/CD badge still shows passing

2. **Smithery submission:**
   - [ ] Submit `mcp.json` metadata file
   - [ ] Link to GitHub repository
   - [ ] Verify all 9 packages listed

3. **Glama submission:**
   - [ ] Fill out web form with metadata above
   - [ ] Upload screenshot/demo assets
   - [ ] Verify listing appears

4. **mcp.run submission:**
   - [ ] Create YAML registry entry
   - [ ] Submit Pull Request to mcp.run registry repo
   - [ ] Monitor PR for feedback/approval

5. **Social media:**
   - [ ] Post to X/Twitter (@nagaconda)
   - [ ] Post to LinkedIn (Nagarjun Srinivasan)
   - [ ] Post to relevant subreddits (r/networking, r/netsec, r/programming)
   - [ ] Post to Hacker News (if appropriate timing)

6. **Community outreach:**
   - [ ] Post to MCP Discord server
   - [ ] Post to Anthropic Discord (Claude community)
   - [ ] Email HPE Networking team (showcase demo)

---

## Maintenance & Updates

**After initial marketplace submissions:**

1. **Version updates:** When publishing new package versions, update:
   - [ ] npm (automatic via `npm publish`)
   - [ ] Smithery (may auto-detect npm updates)
   - [ ] Glama (check if manual update needed)
   - [ ] mcp.run (submit PR with new version numbers)

2. **New packages:** When adding new NetMCP packages:
   - [ ] Update this MARKETPLACE.md with new package metadata
   - [ ] Update mcp.json for Smithery
   - [ ] Submit new package to Glama
   - [ ] Submit PR to mcp.run with new package entry

3. **Analytics:** Monitor marketplace analytics (if available):
   - [ ] Download counts per package
   - [ ] User feedback and ratings
   - [ ] Support questions and common issues

---

## Support & Contact

**Marketplace listing support contact:**
- Email: naga22694+clawd@gmail.com
- GitHub Issues: https://github.com/cheenu1092-oss/netmcp/issues
- Discussions: https://github.com/cheenu1092-oss/netmcp/discussions

**For marketplace-specific questions:**
- Smithery: (check smithery.ai/docs for support)
- Glama: (check glama.ai for support)
- mcp.run: (check mcp.run for support)

---

*Last updated: 2026-03-22 (Cycle 53)*
*Status: Ready for submission after npm publishing*
