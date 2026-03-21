# @netmcp/rfc-search

MCP server for searching Internet RFCs (Request for Comments) using the official IETF Datatracker API — the authoritative source for internet standards, protocols, and best practices.

## Features

- **rfc_get** — Get details for a specific RFC by number
- **rfc_search** — Search RFCs by keyword or topic
- **rfc_recent** — Recently published RFCs (new standards)
- **rfc_stats** — Performance metrics (queries, rate limiting, queue depth)

Returns: RFC number, title, abstract, authors, publication date, status (Proposed Standard, Informational, etc.), stream (IETF, IRTF, etc.), and full-text URL.

## Quick Start

```bash
cd packages/rfc-search
npm install
npm start
```

## MCP Client Config

```json
{
  "mcpServers": {
    "rfc-search": {
      "command": "node",
      "args": ["packages/rfc-search/src/index.js"]
    }
  }
}
```

## Usage Examples

Get details for RFC 9000 (QUIC protocol):
```
rfc_get({ number: 9000 })
```

Search for TLS security RFCs:
```
rfc_search({ query: "TLS", limit: 10 })
```

Recently published standards:
```
rfc_recent({ limit: 20 })
```

Performance metrics:
```
rfc_stats()
```

## Understanding RFC Numbers

RFCs are numbered sequentially starting from 1 (1969). As of 2024, over 9,600 RFCs exist.

Example: **RFC 9000** — QUIC: A UDP-Based Multiplexed and Secure Transport  
- **Number:** 9000  
- **Status:** Proposed Standard  
- **Stream:** IETF  
- **Published:** May 2021  

Famous RFCs:
- **RFC 1149** — "IP over Avian Carriers" (April Fools' joke, but technically valid!)
- **RFC 2324** — "Hyper Text Coffee Pot Control Protocol" (HTCPCP)
- **RFC 7540** — HTTP/2 (current web standard)
- **RFC 9293** — TCP (Transmission Control Protocol, updated 2022)

## Data Source

[IETF Datatracker API](https://datatracker.ietf.org/api/v1/doc/document/) — Free, no auth required.

**Rate limiting:** 5 requests per 10 seconds (automatic backoff if exceeded).

## License

MIT
