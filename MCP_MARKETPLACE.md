# MCP Marketplace Listings

> Metadata for submitting NetMCP packages to MCP server directories (Smithery, Glama, mcp.run).

This document contains all required information for listing NetMCP servers in popular MCP marketplaces, making them discoverable to AI agent users.

---

## 📦 Package Overview

| Package | Description | Tools | Data Source |
|---------|-------------|-------|-------------|
| **oui-lookup** | MAC address → vendor lookup | 4 | IEEE OUI Registry (38K+ manufacturers) |
| **rfc-search** | IETF RFC lookup and search | 4 | IETF Datatracker (153K+ documents) |
| **nvd-network-cves** | Network vulnerability search | 6 | NIST NVD (250K+ CVEs, 24hr cache) |
| **fcc-devices** | FCC equipment authorization | 4 | FCC Equipment Auth (20K+ grantees) |
| **threegpp-specs** | 3GPP/5G specification lookup | 4 | 3GPP Archive (curated + FTP) |
| **iana-services** | Port/protocol lookup | 5 | IANA Service Registry (40+ services) |
| **dns-records** | DNS record type reference | 4 | IANA DNS RR Types (48 types) |
| **iana-media-types** | MIME type lookup | 5 | IANA Media Types (80+ types) |
| **whois-lookup** | Domain/IP/ASN WHOIS queries | 5 | WHOIS Protocol (universal) |

**Total:** 9 packages, 41 tools, 0 API keys required

---

## 🏪 Smithery (smithery.ai)

Smithery is the primary MCP server marketplace. It supports npm packages, GitHub repos, and Docker images.

### Submission Format

For each package, submit via **smithery.ai/submit** with this metadata:

#### 1. oui-lookup
```json
{
  "name": "@netmcp/oui-lookup",
  "displayName": "OUI Lookup (MAC → Vendor)",
  "description": "Look up device manufacturers by MAC address prefix using IEEE's OUI database (38K+ manufacturers). Instant local lookups, no API key needed.",
  "repository": "https://github.com/cheenu1092-oss/netmcp",
  "license": "MIT",
  "keywords": ["mac-address", "oui", "ieee", "vendor-lookup", "networking", "hardware"],
  "categories": ["networking", "data-lookup"],
  "installation": {
    "npm": "@netmcp/oui-lookup",
    "docker": "netmcp:latest oui-lookup",
    "npx": "npx @netmcp/oui-lookup"
  },
  "tools": [
    "oui_lookup - Look up manufacturer by MAC address",
    "oui_search - Search OUI database by vendor name",
    "oui_stats - Get OUI database statistics"
  ],
  "useCases": [
    "Device identification in network scans",
    "MAC address validation",
    "Vendor research for security audits",
    "IoT device cataloging"
  ],
  "dataSource": "IEEE OUI Registry (public, free, no API key)",
  "performance": "1-5ms response time, 200-1000 QPS",
  "author": "Nagarjun Srinivasan",
  "contact": "naga22694+clawd@gmail.com"
}
```

#### 2. rfc-search
```json
{
  "name": "@netmcp/rfc-search",
  "displayName": "RFC Search (IETF Standards)",
  "description": "Search and retrieve IETF RFCs, Internet-Drafts, and BCPs from the official Datatracker API (153K+ documents). Rate-limited API access, no key required.",
  "repository": "https://github.com/cheenu1092-oss/netmcp",
  "license": "MIT",
  "keywords": ["rfc", "ietf", "internet-standards", "protocol", "networking"],
  "categories": ["networking", "documentation", "research"],
  "installation": {
    "npm": "@netmcp/rfc-search",
    "docker": "netmcp:latest rfc-search",
    "npx": "npx @netmcp/rfc-search"
  },
  "tools": [
    "rfc_get - Get specific RFC by number",
    "rfc_search - Search RFCs by keyword",
    "rfc_recent - Get recently published RFCs",
    "rfc_stats - API usage statistics"
  ],
  "useCases": [
    "Protocol research and implementation",
    "Standards compliance checking",
    "Technical documentation lookup",
    "Citation generation"
  ],
  "dataSource": "IETF Datatracker API (public, free, rate-limited 5 req/10s)",
  "performance": "200-1000ms response time, 0.5-5 QPS",
  "author": "Nagarjun Srinivasan",
  "contact": "naga22694+clawd@gmail.com"
}
```

#### 3. nvd-network-cves
```json
{
  "name": "@netmcp/nvd-network-cves",
  "displayName": "NVD CVE Search (Network Vulnerabilities)",
  "description": "Search NIST's National Vulnerability Database for network-related CVEs (250K+ vulnerabilities). 24-hour cache, rate-limited API, no key required.",
  "repository": "https://github.com/cheenu1092-oss/netmcp",
  "license": "MIT",
  "keywords": ["cve", "vulnerability", "security", "nvd", "nist", "networking"],
  "categories": ["security", "networking", "data-lookup"],
  "installation": {
    "npm": "@netmcp/nvd-network-cves",
    "docker": "netmcp:latest nvd-network-cves",
    "npx": "npx @netmcp/nvd-network-cves"
  },
  "tools": [
    "cve_get - Get CVE details by ID",
    "cve_search - Search CVEs by keyword",
    "cve_by_vendor - Find CVEs for vendor/product",
    "cve_cache_stats - Cache performance metrics"
  ],
  "useCases": [
    "Security vulnerability research",
    "CVE impact assessment",
    "Vendor security history",
    "Security audit automation"
  ],
  "dataSource": "NIST NVD API (public, free, rate-limited 5 req/30s)",
  "performance": "1000-2000ms cold cache, 2-5ms cache hit (400x speedup!)",
  "author": "Nagarjun Srinivasan",
  "contact": "naga22694+clawd@gmail.com"
}
```

#### 4. fcc-devices
```json
{
  "name": "@netmcp/fcc-devices",
  "displayName": "FCC Equipment Authorization",
  "description": "Search FCC Equipment Authorization database for approved wireless devices (20K+ grantees). Rate-limited API access, no key required.",
  "repository": "https://github.com/cheenu1092-oss/netmcp",
  "license": "MIT",
  "keywords": ["fcc", "wireless", "device-approval", "compliance", "networking"],
  "categories": ["networking", "compliance", "data-lookup"],
  "installation": {
    "npm": "@netmcp/fcc-devices",
    "docker": "netmcp:latest fcc-devices",
    "npx": "npx @netmcp/fcc-devices"
  },
  "tools": [
    "fcc_get - Get FCC grantee by ID",
    "fcc_search - Search by company/product",
    "fcc_recent - Recently approved devices",
    "fcc_stats - API usage statistics"
  ],
  "useCases": [
    "Device compliance verification",
    "Wireless product research",
    "Competitor analysis",
    "IoT device sourcing"
  ],
  "dataSource": "FCC Socrata API (public, free, rate-limited 10 req/10s)",
  "performance": "500-1500ms response time, 1-10 QPS",
  "author": "Nagarjun Srinivasan",
  "contact": "naga22694+clawd@gmail.com"
}
```

#### 5. threegpp-specs
```json
{
  "name": "@netmcp/threegpp-specs",
  "displayName": "3GPP Specifications (5G/LTE)",
  "description": "Search 3GPP technical specifications for 5G, LTE, and mobile standards. Hybrid local database + FTP scraping for comprehensive coverage.",
  "repository": "https://github.com/cheenu1092-oss/netmcp",
  "license": "MIT",
  "keywords": ["3gpp", "5g", "lte", "mobile", "telecom", "standards"],
  "categories": ["networking", "telecom", "documentation"],
  "installation": {
    "npm": "@netmcp/threegpp-specs",
    "docker": "netmcp:latest threegpp-specs",
    "npx": "npx @netmcp/threegpp-specs"
  },
  "tools": [
    "spec_get - Get specification by number",
    "spec_search - Search specs by keyword",
    "spec_releases - Filter by 3GPP release",
    "spec_stats - Database statistics"
  ],
  "useCases": [
    "5G/LTE protocol implementation",
    "Mobile network research",
    "Standards compliance",
    "Technical documentation lookup"
  ],
  "dataSource": "3GPP Archive (curated database + FTP scraping)",
  "performance": "5-20ms curated hits, 1000-3000ms FTP fallback",
  "author": "Nagarjun Srinivasan",
  "contact": "naga22694+clawd@gmail.com"
}
```

#### 6. iana-services
```json
{
  "name": "@netmcp/iana-services",
  "displayName": "IANA Service Registry (Ports/Protocols)",
  "description": "Look up port numbers and protocol assignments from IANA's official registry (40+ services). Instant local lookups, no API key needed.",
  "repository": "https://github.com/cheenu1092-oss/netmcp",
  "license": "MIT",
  "keywords": ["iana", "port", "protocol", "service", "networking"],
  "categories": ["networking", "data-lookup"],
  "installation": {
    "npm": "@netmcp/iana-services",
    "docker": "netmcp:latest iana-services",
    "npx": "npx @netmcp/iana-services"
  },
  "tools": [
    "service_by_port - Look up service by port number",
    "service_by_name - Look up service by name",
    "service_search - Search by keyword",
    "service_list - List all services",
    "service_stats - Database statistics"
  ],
  "useCases": [
    "Port number validation",
    "Service identification in logs",
    "Firewall rule documentation",
    "Network troubleshooting"
  ],
  "dataSource": "IANA Service Registry (public, free, local database)",
  "performance": "1-5ms response time, 200-1000 QPS",
  "author": "Nagarjun Srinivasan",
  "contact": "naga22694+clawd@gmail.com"
}
```

#### 7. dns-records
```json
{
  "name": "@netmcp/dns-records",
  "displayName": "DNS Record Type Reference",
  "description": "Look up DNS record types (A, AAAA, MX, etc.) from IANA's official registry (48 types). Instant local lookups, no API key needed.",
  "repository": "https://github.com/cheenu1092-oss/netmcp",
  "license": "MIT",
  "keywords": ["dns", "record-types", "iana", "networking"],
  "categories": ["networking", "dns", "data-lookup"],
  "installation": {
    "npm": "@netmcp/dns-records",
    "docker": "netmcp:latest dns-records",
    "npx": "npx @netmcp/dns-records"
  },
  "tools": [
    "dns_by_type - Get DNS record by type code",
    "dns_by_name - Get DNS record by name",
    "dns_list - List all DNS record types",
    "dns_stats - Database statistics"
  ],
  "useCases": [
    "DNS configuration",
    "Record type validation",
    "Zone file documentation",
    "DNS troubleshooting"
  ],
  "dataSource": "IANA DNS RR Types Registry (public, free, local database)",
  "performance": "1-5ms response time, 200-1000 QPS",
  "author": "Nagarjun Srinivasan",
  "contact": "naga22694+clawd@gmail.com"
}
```

#### 8. iana-media-types
```json
{
  "name": "@netmcp/iana-media-types",
  "displayName": "IANA Media Types (MIME Types)",
  "description": "Look up MIME types and media types from IANA's official registry (80+ types). Instant local lookups, no API key needed.",
  "repository": "https://github.com/cheenu1092-oss/netmcp",
  "license": "MIT",
  "keywords": ["mime", "media-types", "iana", "content-type", "networking"],
  "categories": ["networking", "web", "data-lookup"],
  "installation": {
    "npm": "@netmcp/iana-media-types",
    "docker": "netmcp:latest iana-media-types",
    "npx": "npx @netmcp/iana-media-types"
  },
  "tools": [
    "media_by_extension - Get MIME type by file extension",
    "media_by_type - Get details by MIME type",
    "media_search - Search by keyword",
    "media_by_category - List by category",
    "media_stats - Database statistics"
  ],
  "useCases": [
    "Content-Type header validation",
    "File extension mapping",
    "HTTP response configuration",
    "Web server setup"
  ],
  "dataSource": "IANA Media Types Registry (public, free, local database)",
  "performance": "1-5ms response time, 200-1000 QPS",
  "author": "Nagarjun Srinivasan",
  "contact": "naga22694+clawd@gmail.com"
}
```

#### 9. whois-lookup
```json
{
  "name": "@netmcp/whois-lookup",
  "displayName": "WHOIS Lookup (Domain/IP/ASN)",
  "description": "Universal WHOIS queries for domains, IP addresses, and ASNs using the standard WHOIS protocol. No API key required.",
  "repository": "https://github.com/cheenu1092-oss/netmcp",
  "license": "MIT",
  "keywords": ["whois", "domain", "ip", "asn", "networking"],
  "categories": ["networking", "security", "data-lookup"],
  "installation": {
    "npm": "@netmcp/whois-lookup",
    "docker": "netmcp:latest whois-lookup",
    "npx": "npx @netmcp/whois-lookup"
  },
  "tools": [
    "whois_lookup - Universal WHOIS query",
    "whois_domain - Domain-specific lookup",
    "whois_ip - IP address lookup",
    "whois_asn - ASN lookup",
    "whois_stats - Query statistics"
  ],
  "useCases": [
    "Domain registration lookup",
    "IP geolocation",
    "ASN ownership verification",
    "Abuse contact research"
  ],
  "dataSource": "WHOIS Protocol (public, free, distributed)",
  "performance": "500-2000ms response time, 1-5 QPS",
  "author": "Nagarjun Srinivasan",
  "contact": "naga22694+clawd@gmail.com"
}
```

### Smithery Submission Checklist

- [ ] All 9 packages submitted via smithery.ai/submit
- [ ] Screenshots/demos provided (link to DEMO.md)
- [ ] Tags include "networking", "mcp-server", "no-api-key"
- [ ] Installation instructions link to GETTING_STARTED.md
- [ ] License confirmed as MIT
- [ ] Repository URL points to https://github.com/cheenu1092-oss/netmcp
- [ ] Contact email: naga22694+clawd@gmail.com

---

## 🌐 Glama (glama.ai)

Glama is an AI agent marketplace focusing on MCP-enabled tools.

### Submission Format

Glama uses a similar JSON schema to Smithery. Submit via their web form or API.

**Quick submission for all 9 packages:**
- Repository: https://github.com/cheenu1092-oss/netmcp
- Category: Networking & Security Tools
- Tags: mcp-server, networking, no-api-key, open-source
- License: MIT
- Installation: See GETTING_STARTED.md
- Demo: See DEMO.md

**Unique selling points for Glama:**
1. **Zero API keys** — all 9 packages work out-of-the-box
2. **Production-ready** — 75 tests, 100% JSDoc coverage, clean ESLint
3. **Fast** — Local DB packages: 1-5ms, API packages: 200-2000ms
4. **Comprehensive** — 41 tools across 9 networking domains
5. **Open source** — MIT license, contributions welcome

---

## 🔍 mcp.run

mcp.run is a developer-focused MCP server directory.

### Submission Format

mcp.run uses GitHub-based discovery. Ensure the following in `package.json` for each package:

```json
{
  "keywords": [
    "mcp-server",
    "networking",
    "mcp",
    "model-context-protocol"
  ],
  "mcp": {
    "tools": [
      { "name": "tool_name", "description": "..." }
    ]
  }
}
```

**Currently missing:** `mcp` field in package.json files. Add this in a future cycle.

**Submission steps:**
1. Add `mcp` field to all 9 package.json files
2. Submit repository via mcp.run/submit
3. Wait for automated discovery (checks npm registry + GitHub)
4. Verify listings appear on mcp.run

---

## 📊 Metrics & Analytics

Track marketplace performance:

- **Smithery:** Check downloads/stars on package pages
- **Glama:** Check agent usage in dashboard
- **mcp.run:** Check GitHub stars/forks as proxy

**Success metrics:**
- 100+ downloads/week across all packages (Month 1)
- 500+ downloads/week (Month 3)
- 5+ GitHub stars/month
- 1+ external contribution/month

---

## 🚀 Post-Submission Tasks

After submitting to all 3 marketplaces:

1. **Add badges to README.md:**
   ```markdown
   [![Smithery](https://img.shields.io/badge/Smithery-Listed-blue)](https://smithery.ai/server/@netmcp)
   [![Glama](https://img.shields.io/badge/Glama-Listed-green)](https://glama.ai/mcp/@netmcp)
   [![mcp.run](https://img.shields.io/badge/mcp.run-Listed-orange)](https://mcp.run/@netmcp)
   ```

2. **Announce on social media:**
   - X/Twitter: @cheenu1092 + @nagaconda
   - LinkedIn: Nagarjun Srinivasan
   - Reddit: r/MachineLearning, r/networking
   - Hacker News: Show HN post

3. **Update CHANGELOG.md:**
   - Add marketplace listings under "Changed" section
   - Note submission dates and links

4. **Monitor submissions:**
   - Check approval status weekly
   - Respond to marketplace feedback/questions
   - Update metadata if requested

---

## 📝 Notes

- **All 9 packages ready for submission** — npm publishing config complete, bin fields set, READMEs comprehensive
- **Awaiting npm publish** — need to run `npm login` and `npm publish` for each package (blocked on NPM_TOKEN setup)
- **Future enhancement:** Add `mcp` field to package.json for mcp.run automated discovery
- **Screenshots needed:** Create terminal recordings for Smithery submission (link to DEMO.md)

**Estimated time to complete submissions:** 1-2 hours (manual web forms, 9 packages × 3 marketplaces = 27 submissions)
