# @netmcp/iana-services

MCP server for IANA service/port/protocol registry lookups.

## Features

- **5 tools** for comprehensive IANA registry access:
  - `service_by_port` - Look up services by port number
  - `service_by_name` - Search services by name or description
  - `protocol_by_number` - Get IP protocol by number (0-255)
  - `protocol_search` - Search protocols by name or keyword
  - `iana_stats` - Performance and database statistics
- **Curated database** of 40+ well-known services and ports
- **Protocol registry** with 17 common IP protocols
- **Input validation** (max 1000 chars, port/protocol range checks)
- **Performance metrics** (query count, curated hit rate)

## Quick Start

```bash
npm install
npm start
```

## MCP Client Configuration

Add to your MCP client config (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "iana-services": {
      "command": "node",
      "args": ["/path/to/netmcp/packages/iana-services/src/index.js"]
    }
  }
}
```

## Usage Examples

**Look up a service by port:**
```
What service uses port 443?
→ Uses tool: service_by_port(port=443)
→ Returns: HTTPS (HTTP over TLS/SSL) [RFC9110]
```

**Search services by name:**
```
What ports does MySQL use?
→ Uses tool: service_by_name(query="mysql")
→ Returns: Port 3306/tcp (MySQL Database)
```

**Get protocol by number:**
```
What is IP protocol 6?
→ Uses tool: protocol_by_number(number=6)
→ Returns: TCP (Transmission Control Protocol) [RFC9293]
```

**Search protocols:**
```
What protocols are used for VPNs?
→ Uses tool: protocol_search(query="encapsulation")
→ Returns: ESP (50), AH (51), GRE (47), IPv6 (41)
```

**Get statistics:**
```
Show IANA stats
→ Uses tool: iana_stats()
→ Returns: Query count, hit rate, database sizes
```

## Understanding IANA Registries

The **Internet Assigned Numbers Authority (IANA)** maintains authoritative registries of:
- **Service Names and Port Numbers** (0-65535)
- **Protocol Numbers** (0-255)

### Port Ranges:
- **0-1023:** Well-Known Ports (system services)
- **1024-49151:** Registered Ports (user services)
- **49152-65535:** Dynamic/Private Ports (ephemeral)

### Common Protocols:
- **TCP (6):** Reliable, connection-oriented transport
- **UDP (17):** Connectionless, best-effort delivery
- **ICMP (1):** Internet Control Message Protocol
- **SCTP (132):** Stream Control Transmission Protocol

## Data Source

- **Source:** IANA Service Name and Transport Protocol Port Number Registry
- **URL:** https://www.iana.org/assignments/service-names-port-numbers/
- **Protocol Numbers:** https://www.iana.org/assignments/protocol-numbers/
- **Coverage:** 40+ well-known services, 17 common protocols
- **License:** Public domain (IANA data)
- **Update frequency:** Curated database (rarely changes)

This package provides a curated subset of the IANA registry for common networking tasks. For comprehensive lookups of all 15,000+ registered services, use the official IANA CSV downloads.

## License

MIT
