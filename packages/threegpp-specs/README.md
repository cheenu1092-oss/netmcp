# @netmcp/threegpp-specs

MCP server for searching 3GPP specifications — the standards behind 5G NR, LTE, and mobile networks worldwide.

## Features

- **spec_search** — Search specs by number or keyword (e.g. "23.501", "5G security", "NWDAF")
- **spec_get** — Get details for a specific spec number (e.g. "TS 38.300")
- **spec_releases** — List specs by 3GPP release (15=5G Phase 1, 18=5G-Advanced)

Returns: Spec number, title, type (TS/TR), responsible working group, releases, status, and archive link.

## Quick Start

```bash
cd packages/threegpp-specs
npm install
npm start
```

## MCP Client Config

```json
{
  "mcpServers": {
    "threegpp-specs": {
      "command": "node",
      "args": ["packages/threegpp-specs/src/index.js"]
    }
  }
}
```

## Usage Examples

Search for 5G core architecture specs:
```
spec_search({ query: "5G architecture" })
```

Get details for the main 5G system architecture spec:
```
spec_get({ spec_number: "23.501" })
```

List all Release 18 (5G-Advanced) specs:
```
spec_releases({ release: 18 })
```

## 3GPP Series Reference

| Series | Area | Working Group |
|--------|------|---------------|
| 21 | Requirements | SA |
| 22 | Service Requirements | SA1 |
| 23 | Architecture | SA2 |
| 24 | NAS Signalling | CT1 |
| 25 | WCDMA Radio | RAN |
| 26 | Codecs | SA4 |
| 28 | Signalling (MAP, GTP) | CT4 |
| 29 | Core Network APIs | CT3/CT4 |
| 33 | Security | SA3 |
| 36 | LTE Radio (E-UTRA) | RAN |
| 38 | 5G NR Radio | RAN |

## Data Source

- Curated database of 40+ key 3GPP specs with titles and release info
- Live FTP directory scraping from [3GPP archive](https://www.3gpp.org/ftp/Specs/archive/)
- No auth required

## License

MIT
