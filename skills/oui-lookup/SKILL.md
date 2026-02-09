---
name: oui-lookup
description: Resolve MAC addresses to device vendors using the IEEE OUI registry. Use when identifying unknown devices on a network, troubleshooting connectivity, or auditing device manufacturers. Supports lookup by MAC address, search by vendor name, and database stats.
---

# OUI Lookup — IEEE MAC Address Vendor Resolution

## Quick Start

```bash
# Ensure the database exists
node SKILL_DIR/../../packages/oui-lookup/scripts/update-oui-db.js

# Run as MCP server
node SKILL_DIR/../../packages/oui-lookup/src/index.js
```

## Tools Available

### `oui_lookup` — Resolve MAC to vendor
Input: Any MAC format (`AA:BB:CC:DD:EE:FF`, `AA-BB-CC`, `AABBCC`)
Returns: Vendor name, address, country

### `oui_search` — Search by vendor name
Input: Vendor name query (e.g. "Cisco", "Apple")
Returns: All matching OUI prefixes (up to `limit`)

### `oui_stats` — Database statistics
Returns: Total entries, unique vendors, top 20 vendors by OUI count

## Data Source

IEEE Standards Association OUI registry: `standards-oui.ieee.org/oui/oui.txt`
Updated by running `npm run update-db` in the package directory. 50K+ entries.

## Examples

- "What vendor made the device at MAC AA:BB:CC:11:22:33?" → `oui_lookup`
- "How many OUI prefixes does Cisco own?" → `oui_search` with query "Cisco"
- "What are the top device manufacturers by registered MACs?" → `oui_stats`
