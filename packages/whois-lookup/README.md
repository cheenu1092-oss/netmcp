# @netmcp/whois-lookup

**MCP server for WHOIS domain, IP, and ASN lookups using the whois CLI.**

## Features

- **5 tools:**
  - `whois_lookup` — Universal lookup (auto-detects domain/IP/ASN)
  - `whois_domain` — Domain registration info (registrar, dates, status)
  - `whois_ip` — IP address allocation and network info
  - `whois_asn` — Autonomous System Number info
  - `whois_stats` — Performance and usage statistics

- **Auto-detection:** Automatically detects query type (domain, IPv4, IPv6, ASN)
- **Parsed output:** Extracts common fields (registrar, creation date, netname, country, etc.)
- **Raw + parsed:** Returns both raw WHOIS output and parsed key-value pairs
- **Timeouts:** 15-second timeout prevents hanging on slow WHOIS servers
- **Error handling:** Clear messages for missing whois CLI, timeouts, invalid queries

## Prerequisites

**Requires `whois` CLI tool installed:**

```bash
# macOS
brew install whois

# Ubuntu/Debian
sudo apt install whois

# RHEL/Fedora
sudo dnf install whois
```

## Quick Start

```bash
npm install
npm start
```

## MCP Client Config

Add to your MCP client settings (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "whois-lookup": {
      "command": "node",
      "args": ["/path/to/netmcp/packages/whois-lookup/src/index.js"]
    }
  }
}
```

## Usage Examples

### Universal Lookup (Auto-Detect)

```
User: "Look up example.com"
Tool: whois_lookup({ "query": "example.com" })
Response:
{
  "query": "example.com",
  "type": "domain",
  "raw": "...",
  "parsed": { ... },
  "registrar": "RESERVED-Internet Assigned Numbers Authority",
  "created": "1995-08-14T04:00:00Z",
  "expires": "2024-08-13T04:00:00Z",
  "status": "clientDeleteProhibited clientTransferProhibited clientUpdateProhibited"
}
```

### Domain Registration Info

```
User: "When does google.com expire?"
Tool: whois_domain({ "domain": "google.com" })
Response:
{
  "domain": "google.com",
  "registrar": "MarkMonitor Inc.",
  "created": "1997-09-15T04:00:00Z",
  "expires": "2028-09-14T04:00:00Z",
  "status": "clientDeleteProhibited clientTransferProhibited clientUpdateProhibited serverDeleteProhibited serverTransferProhibited serverUpdateProhibited",
  "parsed": { ... }
}
```

### IP Address Lookup

```
User: "Who owns 8.8.8.8?"
Tool: whois_ip({ "ip": "8.8.8.8" })
Response:
{
  "ip": "8.8.8.8",
  "type": "ipv4",
  "netname": "LVLT-GOGL-8-8-8",
  "org": "Google LLC",
  "country": "US",
  "parsed": { ... }
}
```

### ASN Lookup

```
User: "What is AS15169?"
Tool: whois_asn({ "asn": "AS15169" })
Response:
{
  "asn": "AS15169",
  "as_name": "GOOGLE",
  "org": "Google LLC",
  "country": "US",
  "parsed": { ... }
}
```

### Performance Stats

```
User: "How many WHOIS queries have been made?"
Tool: whois_stats({})
Response:
{
  "total_queries": 42,
  "domain_queries": 20,
  "ip_queries": 15,
  "asn_queries": 7,
  "errors": 2,
  "success_rate": 95.24
}
```

## Understanding WHOIS

WHOIS is a query protocol for domain, IP, and ASN registration information:

- **Domains:** Registrar, creation/expiration dates, status, nameservers
- **IP addresses:** Network allocation, organization, country, abuse contact
- **ASNs:** Autonomous system name, organization, routing info

WHOIS queries hit distributed servers maintained by registries (IANA, ARIN, RIPE, etc.).

## Data Source

- **Protocol:** WHOIS (RFC 3912)
- **CLI:** System `whois` command (connects to appropriate registry servers)
- **No API keys needed** — uses public WHOIS protocol
- **Timeouts:** 15 seconds (some WHOIS servers are slow)

## Common WHOIS Registries

- **Domains:** Verisign (com/net), PIR (org), regional registries
- **IPv4:** ARIN (North America), RIPE (Europe), APNIC (Asia-Pacific)
- **IPv6:** Same as IPv4 regional registries
- **ASNs:** IANA delegates to ARIN, RIPE, APNIC, LACNIC, AfriNIC

## License

MIT
