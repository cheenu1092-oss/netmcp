---
name: fcc-devices
description: Search the FCC Equipment Authorization database for certified wireless devices and manufacturers via CLI scripts or MCP server. Use when identifying device manufacturers by FCC ID, looking up wireless equipment certifications, or tracking new device registrations in the US market.
---

# FCC Devices — Equipment Authorization Search

## CLI Usage (Quick & Easy)

Simple bash wrapper scripts for direct command-line use:

```bash
cd ./skills/fcc-devices/scripts

# Search grantees by name
./search.sh "Samsung" name 5

# Get specific grantee by FCC ID
./get.sh 2AY5N

# Get recent registrations
./recent.sh 30 5
```

## MCP Server Setup

```bash
cd SKILL_DIR/../../packages/fcc-devices
npm install && node src/index.js

# Or install into Claude Code config
./scripts/install-mcp.sh
```

## Tools Available

### `fcc_search` — Search grantees
Input: Query + type ("name", "code", or "country")
Returns: Grantee code, company name, address, country, registration date

### `fcc_get` — Look up a specific grantee code
Input: Grantee code (first 3-5 chars of an FCC ID)
Returns: Full grantee details with equipment search URL

### `fcc_recent` — Recently registered grantees
Input: Limit, optional country filter
Returns: Most recently registered wireless device manufacturers

## Understanding FCC IDs

FCC IDs have two parts:
- **Grantee Code** (3-5 chars): Identifies the manufacturer (e.g. BCG = Apple)
- **Product Code** (remaining): Identifies the specific device model

## Data Source

FCC Open Data (Socrata API): `opendata.fcc.gov/resource/3b3k-34jp.json` — No auth required.

## Examples

- "Who makes the device with FCC ID BCG-E2511A?" → `fcc_get` with grantee_code "BCG"
- "Find Samsung's FCC registrations" → `fcc_search` with query "Samsung"
- "Recent device manufacturers from South Korea" → `fcc_recent` with country "South Korea"
