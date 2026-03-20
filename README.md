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

## Why these data sources?

All data is **free, public, and authoritative**:
- **IEEE OUI** — Official MAC address vendor registry
- **IETF/RFC** — Every internet standard ever written
- **NIST NVD** — US government vulnerability database
- **FCC EAS** — Official US wireless equipment certifications
- **3GPP** — Global 5G/LTE/NR standards body

No API keys needed. No rate limit issues. No scraping gray areas.

## Built by

**[Nagarjun Srinivasan](https://github.com/nagaconda)** — Principal Systems Engineer at HPE Networking, holder of [US Patent 10986606](https://patents.google.com/patent/US10986606) on wireless signal strength methods. Building AI-driven self-driving networks by day, open-source networking tools by night.

Part of the **[jugaad-lab](https://github.com/jugaad-lab)** open source collective.

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — use it however you want.
