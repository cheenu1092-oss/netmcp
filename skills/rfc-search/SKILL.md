---
name: rfc-search
description: Search and retrieve IETF RFCs and Internet Standards via CLI scripts or MCP server. Use when looking up networking protocols, internet standards, RFC numbers, or protocol specifications. Covers 153K+ documents including WiFi (802.11), TCP/IP, BGP, TLS, HTTP, DNS, QUIC, and all IETF working group output.
---

# RFC Search — IETF Standards & Protocol Lookup

## CLI Usage (Quick & Easy)

Simple bash wrapper scripts for direct command-line use:

```bash
cd ~/clawd/projects/netmcp/skills/rfc-search/scripts

# Get a specific RFC by number
./get.sh 8446

# Search RFCs by keyword
./search.sh "bgp" 5

# Get recent RFCs
./recent.sh 5
```

## MCP Server Setup

```bash
cd SKILL_DIR/../../packages/rfc-search
npm install && node src/index.js

# Or install into Claude Code config
./scripts/install-mcp.sh
```

## Tools Available

### `rfc_get` — Get a specific RFC by number
Input: RFC number (e.g. 791 for IP, 8446 for TLS 1.3)
Returns: Title, abstract, status, page count, link to full text

### `rfc_search` — Search by keyword/topic
Input: Query string, optional `rfc_only` flag
Returns: Matching documents with abstracts

### `rfc_recent` — Latest published RFCs
Input: Limit, optional IETF area filter
Returns: Most recently published standards

## IETF Area Codes (for filtering)

- `int` — Internet (IP, DHCP, DNS)
- `rtg` — Routing (BGP, OSPF, IS-IS)
- `sec` — Security (TLS, IPsec, OAuth)
- `ops` — Operations & Management (SNMP, NETCONF)
- `tsv` — Transport (TCP, UDP, QUIC)
- `wit` — Web & Internet Transport (HTTP)

## Data Source

IETF Datatracker REST API — no auth required: `datatracker.ietf.org/api/v1/`
