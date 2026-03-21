# NetMCP — Networking Intelligence for AI Agents

> Open-source MCP servers that give AI agents structured access to networking standards, device databases, and security data.

**Self-host for free** or use the **[hosted version on Apify →](https://apify.com/jugaad-lab)**

[![Test Suite](https://github.com/cheenu1092-oss/netmcp/actions/workflows/test.yml/badge.svg)](https://github.com/cheenu1092-oss/netmcp/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What is this?

AI agents helping network engineers constantly need to look up protocol specs, device info, and security vulnerabilities. Right now they hallucinate RFC numbers, guess at port assignments, and miss critical CVEs.

NetMCP fixes that by wrapping authoritative, free, public networking databases in [Model Context Protocol](https://modelcontextprotocol.io/) servers — so any AI agent (Claude, GPT, Cursor, OpenClaw, etc.) can query them directly.

## Packages

| Package | Data Source | Records | Status |
|---------|-----------|---------|--------|
| [`oui-lookup`](./packages/oui-lookup) | IEEE OUI (MAC → Vendor) | 38K+ manufacturers | ✅ Done |
| [`rfc-search`](./packages/rfc-search) | IETF Datatracker | 153K+ documents | ✅ Done |
| [`nvd-network-cves`](./packages/nvd-network-cves) | NIST NVD | 250K+ CVEs | ✅ Done |
| [`fcc-devices`](./packages/fcc-devices) | FCC Equipment Auth | 20K+ grantees | ✅ Done |
| [`threegpp-specs`](./packages/threegpp-specs) | 3GPP Archive | 5G/LTE standards | ✅ Done |

## Use it 3 ways

### 1. MCP Server (Claude Code, Cursor, OpenClaw, any MCP client)

```bash
# Clone and run locally
git clone https://github.com/cheenu1092-oss/netmcp.git
cd netmcp/packages/oui-lookup
npm install && npm start
```

Add to your MCP client config:
```json
{
  "mcpServers": {
    "oui-lookup": {
      "command": "node",
      "args": ["packages/oui-lookup/src/index.js"]
    },
    "rfc-search": {
      "command": "node",
      "args": ["packages/rfc-search/src/index.js"]
    },
    "nvd-network-cves": {
      "command": "node",
      "args": ["packages/nvd-network-cves/src/index.js"]
    },
    "fcc-devices": {
      "command": "node",
      "args": ["packages/fcc-devices/src/index.js"]
    },
    "threegpp-specs": {
      "command": "node",
      "args": ["packages/threegpp-specs/src/index.js"]
    }
  }
}
```

### 2. Apify Actor (hosted, pay-per-query)

No setup needed. Use via Apify Store:
- [OUI Lookup →](https://apify.com/jugaad-lab/oui-lookup)
- [RFC Search →](https://apify.com/jugaad-lab/rfc-search)
- [NVD Network CVEs →](https://apify.com/jugaad-lab/nvd-network-cves)
- [FCC Devices →](https://apify.com/jugaad-lab/fcc-devices)
- [3GPP Specs →](https://apify.com/jugaad-lab/threegpp-specs)

### 3. OpenClaw / Claude Code Skill

```bash
# Install as an OpenClaw skill
clawhub install jugaad-lab/oui-lookup
```

## Usage Examples

Once configured in your MCP client, you can ask natural language questions and the AI will use the appropriate tool:

### OUI Lookup (MAC Address → Vendor)
**Ask:** "Who makes the device with MAC address 00:1A:2B:3C:4D:5E?"  
**Tool used:** `oui_lookup`  
**Response:**
```json
{
  "prefix": "001A2B",
  "found": true,
  "vendor": "Apple, Inc.",
  "address": "1 Infinite Loop, Cupertino CA 95014, US"
}
```

**Ask:** "Find all Cisco OUIs"  
**Tool used:** `oui_search`  
**Returns:** List of all MAC prefixes registered to Cisco

---

### RFC Search (Internet Standards)
**Ask:** "What's RFC 9293 about?"  
**Tool used:** `rfc_get`  
**Response:**
```json
{
  "name": "RFC9293",
  "title": "Transmission Control Protocol (TCP)",
  "abstract": "This document specifies the Internet Transmission Control Protocol (TCP)...",
  "status": "INTERNET STANDARD",
  "published": "2022-08",
  "url": "https://www.rfc-editor.org/rfc/rfc9293.html"
}
```

**Ask:** "Find recent RFCs about QUIC"  
**Tool used:** `rfc_search`  
**Returns:** List of QUIC-related RFCs with titles and links

---

### NVD Network CVEs (Security Vulnerabilities)
**Ask:** "Tell me about CVE-2023-44487 (HTTP/2 Rapid Reset)"  
**Tool used:** `cve_get`  
**Response:**
```json
{
  "cve_id": "CVE-2023-44487",
  "description": "HTTP/2 rapid reset vulnerability allows denial of service...",
  "cvss_score": 7.5,
  "severity": "HIGH",
  "published": "2023-10-10",
  "affected_products": ["nginx", "envoy", "apache-httpd", ...],
  "references": [...]
}
```

**Ask:** "Find recent WiFi vulnerabilities"  
**Tool used:** `cve_search`  
**Returns:** List of CVEs mentioning "wifi" in description

**Performance:** Includes 24-hour cache + rate limiting. Use `cve_cache_stats` to monitor.

---

### FCC Devices (Wireless Equipment Certifications)
**Ask:** "What wireless devices has Apple gotten FCC approval for recently?"  
**Tool used:** `fcc_search` (by name: "Apple")  
**Response:**
```json
{
  "query": "Apple",
  "count": 143,
  "results": [
    {
      "grantee_name": "Apple Inc.",
      "grantee_code": "BCG",
      "country": "United States",
      "date_received": "2024-01-15"
    },
    ...
  ]
}
```

**Ask:** "Show me recent FCC certifications from China"  
**Tool used:** `fcc_search` (by country: "China")  
**Returns:** List of recent wireless device approvals

---

### 3GPP Specs (5G/LTE Standards)
**Ask:** "What's 3GPP spec 23.501 about?"  
**Tool used:** `spec_get`  
**Response:**
```json
{
  "number": "23.501",
  "title": "System architecture for the 5G System (5GS)",
  "series": "23_series",
  "technology": "Core Network and Terminals",
  "release": 16,
  "status": "Under change control",
  "url": "https://www.3gpp.org/ftp/Specs/archive/23_series/23.501/"
}
```

**Ask:** "Find 3GPP specs about network slicing"  
**Tool used:** `spec_search`  
**Returns:** List of specs with "slicing" in title (28.801, 23.501, etc.)

---

## Why these data sources?

All data is **free, public, and authoritative**:
- **IEEE OUI** — Official MAC address vendor registry (38K+ manufacturers)
- **IETF/RFC** — Every internet standard ever written (153K+ documents)
- **NIST NVD** — US government vulnerability database (250K+ CVEs)
- **FCC EAS** — Official US wireless equipment certifications (20K+ grantees)
- **3GPP** — Global 5G/LTE/NR standards body (5K+ specifications)

**No API keys needed. No rate limit issues. No scraping gray areas.**

## Technical Features

- ✅ **100% JSDoc type coverage** — IDE autocomplete, static analysis
- ✅ **Thread-safe rate limiting** — prevents API throttling under concurrent load
- ✅ **24-hour caching (NVD)** — faster responses, reduced API pressure
- ✅ **Comprehensive test suite** — 35 tests (19 smoke + 16 integration)
- ✅ **CI/CD with GitHub Actions** — tests on Node.js 20.x, 22.x, 24.x
- ✅ **ESLint + type validation** — zero errors, zero warnings
- ✅ **npm workspaces** — efficient monorepo with hoisted dependencies
- ✅ **Production-ready** — timeouts, error handling, input sanitization

## Built by

**[Nagarjun Srinivasan](https://github.com/nagaconda)** — Principal Systems Engineer at HPE Networking, holder of [US Patent 10986606](https://patents.google.com/patent/US10986606) on wireless signal strength methods. Building AI-driven self-driving networks by day, open-source networking tools by night.

Part of the **[jugaad-lab](https://github.com/jugaad-lab)** open source collective.

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — use it however you want.
