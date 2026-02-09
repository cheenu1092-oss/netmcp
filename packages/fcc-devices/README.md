# @netmcp/fcc-devices

MCP server for searching the FCC Equipment Authorization database — the official registry of all wireless devices certified for sale in the United States.

## Features

- **fcc_search** — Search grantees by name, grantee code, or country
- **fcc_get** — Get details for a specific FCC grantee code
- **fcc_recent** — Recently registered grantees (new wireless device manufacturers)

Returns: Grantee code, company name, address, country, contact, registration date, and links to FCC equipment search.

## Quick Start

```bash
cd packages/fcc-devices
npm install
npm start
```

## MCP Client Config

```json
{
  "mcpServers": {
    "fcc-devices": {
      "command": "node",
      "args": ["packages/fcc-devices/src/index.js"]
    }
  }
}
```

## Usage Examples

Search for Apple's FCC grantee records:
```
fcc_search({ query: "Apple", search_type: "name" })
```

Look up grantee code BCG (Apple):
```
fcc_get({ grantee_code: "BCG" })
```

Recent grantee registrations from China:
```
fcc_recent({ limit: 10, country: "China" })
```

## Understanding FCC IDs

An FCC ID consists of two parts:
- **Grantee Code** (first 3-5 chars) — identifies the manufacturer
- **Product Code** (remaining chars) — identifies the specific device

Example: `BCG-E2511A` → BCG = Apple, E2511A = specific iPhone model

## Data Source

[FCC Open Data (Socrata API)](https://opendata.fcc.gov/resource/3b3k-34jp.json) — Free, no auth required.

## License

MIT
