---
name: nvd-network-cves
description: Search the NIST National Vulnerability Database for networking-related CVEs via CLI scripts or MCP server. Use when looking up security vulnerabilities, CVSS scores, affected products, or CVE details for networking equipment (Cisco, Juniper, Fortinet), protocols (BGP, SSL, WiFi), or general cybersecurity topics.
---

# NVD Network CVEs — Security Vulnerability Search

## CLI Usage (Quick & Easy)

Simple bash wrapper scripts for direct command-line use:

```bash
cd ~/clawd/projects/netmcp/skills/nvd-network-cves/scripts

# Search CVEs by keyword
./search.sh "wifi" 5

# Get specific CVE details
./get.sh CVE-2023-44487

# Search by vendor and product
./vendor.sh cisco ios_xe 5
```

## MCP Server Setup

```bash
cd SKILL_DIR/../../packages/nvd-network-cves
npm install && node src/index.js

# Or install into Claude Code config
./scripts/install-mcp.sh
```

## Tools Available

### `cve_search` — Search CVEs by keyword
Input: Keyword (e.g. "wifi", "cisco router", "bgp hijack")
Returns: CVE ID, description, CVSS score, severity, affected products

### `cve_get` — Get a specific CVE by ID
Input: CVE identifier (e.g. "CVE-2023-44487", "CVE-2024-12345")
Returns: Full details including references and weakness categories

### `cve_by_vendor` — Search by vendor/product
Input: Vendor name and optional product
Returns: CVEs affecting that vendor's products

## Rate Limits

NVD API allows 5 requests per 30 seconds without an API key. The server handles rate limiting automatically and will queue requests if needed.

## Data Source

NIST NVD REST API 2.0: `services.nvd.nist.gov/rest/json/cves/2.0` — No auth required.

## Examples

- "Are there any recent WiFi vulnerabilities?" → `cve_search` with keyword "wifi"
- "Tell me about CVE-2023-44487" → `cve_get`
- "What Cisco IOS XE CVEs exist?" → `cve_by_vendor` with vendor "cisco", product "ios_xe"
- "Find BGP-related security issues" → `cve_search` with keyword "bgp"
