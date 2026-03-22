# DNS Records - IANA DNS Resource Record Type Lookups

MCP server for looking up DNS resource record types from the IANA DNS parameters registry.

## Features

- **4 tools** for DNS record type lookups:
  - `record_by_type` - Look up record by TYPE number (0-65535)
  - `record_by_name` - Look up record by name (A, AAAA, MX, etc.)
  - `record_search` - Search records by keyword or description
  - `dns_stats` - Database and performance statistics

## Quick Start

```bash
npm install
npm start
```

## MCP Client Configuration

```json
{
  "mcpServers": {
    "dns-records": {
      "command": "node",
      "args": ["/path/to/packages/dns-records/src/index.js"]
    }
  }
}
```

## Usage Examples

### Look up A record
```
User: What is a DNS A record?
AI calls: record_by_name({ name: "A" })
Response: {
  "type": 1,
  "name": "A",
  "description": "IPv4 host address",
  "rfc": "RFC 1035",
  "category": "data",
  "found": true
}
```

### Look up by type number
```
User: What is DNS TYPE 28?
AI calls: record_by_type({ type: 28 })
Response: {
  "type": 28,
  "name": "AAAA",
  "description": "IPv6 host address",
  "rfc": "RFC 3596",
  "category": "data",
  "found": true
}
```

### Search for DNSSEC records
```
User: What DNS record types are used for DNSSEC?
AI calls: record_search({ query: "dnssec", limit: 10 })
Response: {
  "query": "dnssec",
  "count": 6,
  "truncated": false,
  "results": [
    { "type": 48, "name": "DNSKEY", "description": "DNS public key", ... },
    { "type": 46, "name": "RRSIG", "description": "DNSSEC signature", ... },
    { "type": 47, "name": "NSEC", "description": "Next secure record (DNSSEC)", ... },
    { "type": 43, "name": "DS", "description": "Delegation signer (DNSSEC chain)", ... },
    { "type": 50, "name": "NSEC3", "description": "Hashed next secure (DNSSEC)", ... },
    { "type": 51, "name": "NSEC3PARAM", "description": "NSEC3 parameters", ... }
  ]
}
```

### Get database statistics
```
User: Show DNS record database stats
AI calls: dns_stats({})
Response: {
  "total_record_types": 48,
  "total_queries": 42,
  "curated_hits": 39,
  "curated_hit_rate": "92.9%",
  "by_category": {
    "data": 18,
    "mail": 1,
    "security": 11,
    "meta": 7,
    "obsolete": 6,
    "experimental": 3
  },
  "data_source": "IANA DNS Parameters Registry (curated)"
}
```

## Understanding DNS Record Types

DNS uses different record types to store different kinds of information:

### Categories

- **Data records**: Store actual data (A, AAAA, CNAME, TXT, SRV, etc.)
- **Mail records**: Email routing (MX)
- **Security records**: DNSSEC, TLS, SSH, CAA
- **Meta records**: Zone management (SOA, NS, AXFR, TSIG)
- **Obsolete**: Deprecated types (replaced by newer standards)
- **Experimental**: Not widely deployed

### Common Record Types

| Type | Name | Description | Use Case |
|------|------|-------------|----------|
| 1 | A | IPv4 address | Map domain to IPv4 |
| 28 | AAAA | IPv6 address | Map domain to IPv6 |
| 5 | CNAME | Canonical name | Alias one domain to another |
| 15 | MX | Mail exchange | Email server routing |
| 2 | NS | Name server | Authoritative DNS server |
| 16 | TXT | Text | SPF, DKIM, DMARC, verification |
| 33 | SRV | Service | Discover services (SIP, XMPP) |
| 257 | CAA | Cert authority | Control who can issue TLS certs |
| 64 | SVCB | Service binding | HTTP/3, QUIC |
| 65 | HTTPS | HTTPS binding | HTTPS-specific service info |

### DNSSEC Records

- **DNSKEY** (48): Public key for zone
- **RRSIG** (46): Cryptographic signature
- **DS** (43): Delegation signer (chain of trust)
- **NSEC** (47): Proof of non-existence
- **NSEC3** (50): Hashed proof (privacy-preserving)

## Data Source

- **Registry**: IANA DNS Parameters (https://www.iana.org/assignments/dns-parameters/)
- **Curated database**: 48 common and important record types
- **No external API**: All lookups from local curated database (instant, reliable)
- **License**: IANA data is public domain

## License

MIT
