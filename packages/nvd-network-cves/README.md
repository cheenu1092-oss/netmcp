# @netmcp/nvd-network-cves

MCP server for searching the NIST National Vulnerability Database (NVD) for networking-related security vulnerabilities.

## Features

- **cve_search** — Search CVEs by keyword (e.g. "wifi", "cisco", "bgp")
- **cve_get** — Get detailed info for a specific CVE ID
- **cve_by_vendor** — Find CVEs affecting a specific vendor/product

Returns: CVE ID, description, CVSS score, severity, affected products, references, and weakness categories.

## Quick Start

```bash
cd packages/nvd-network-cves
npm install
npm start
```

## MCP Client Config

```json
{
  "mcpServers": {
    "nvd-network-cves": {
      "command": "node",
      "args": ["packages/nvd-network-cves/src/index.js"]
    }
  }
}
```

## Usage Examples

Search for WiFi vulnerabilities:
```
cve_search({ keyword: "wifi" })
```

Look up a specific CVE:
```
cve_get({ cve_id: "CVE-2023-44487" })
```

Find Cisco IOS XE vulnerabilities:
```
cve_by_vendor({ vendor: "cisco", product: "ios_xe" })
```

## Data Source

[NIST NVD API 2.0](https://services.nvd.nist.gov/rest/json/cves/2.0) — Free, no auth required.

Rate limit: 5 requests per 30 seconds (without API key). The server handles rate limiting automatically.

## License

MIT
