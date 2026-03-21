# @netmcp/oui-lookup

MCP server for looking up MAC address vendors using the IEEE OUI (Organizationally Unique Identifier) database — the official registry of 38,000+ hardware manufacturers worldwide.

## Features

- **oui_lookup** — Identify vendor from any MAC address format
- **oui_search** — Find all OUI assignments for a vendor
- **oui_stats** — Database statistics (entries, vendors, update date)

Returns: Vendor name, address, OUI prefix (first 6 MAC address characters).

## Quick Start

```bash
cd packages/oui-lookup
npm install
npm run update-db  # Download latest IEEE OUI database
npm start
```

## MCP Client Config

```json
{
  "mcpServers": {
    "oui-lookup": {
      "command": "node",
      "args": ["packages/oui-lookup/src/index.js"]
    }
  }
}
```

## Usage Examples

Look up a MAC address (any format):
```
oui_lookup({ mac: "00:1A:2B:3C:4D:5E" })  
oui_lookup({ mac: "00-1A-2B-3C-4D-5E" })  
oui_lookup({ mac: "001A.2B3C.4D5E" })     
oui_lookup({ mac: "001A2B3C4D5E" })       
```

Find all Apple OUI assignments:
```
oui_search({ query: "Apple", limit: 20 })
```

Get database statistics:
```
oui_stats()
```

## Understanding OUIs

The first 6 characters (3 bytes) of a MAC address are the **OUI** — a globally unique identifier assigned by IEEE to hardware manufacturers.

Example: `00:1A:2B:3C:4D:5E`
- **OUI:** `00:1A:2B` → identifies the manufacturer (e.g., Cisco, Apple)
- **Device ID:** `3C:4D:5E` → unique to this specific device

Companies can own multiple OUIs (Apple has 500+, Cisco has 1,000+).

## Data Source

[IEEE OUI Database](https://standards-oui.ieee.org/oui/oui.txt) — 4.3MB text file, 38,000+ assignments, updated monthly.

**No API keys needed.** Database is cached locally for instant lookups.

## License

MIT
