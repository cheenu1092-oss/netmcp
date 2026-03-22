# Getting Started with NetMCP

> Get networking intelligence into your AI agent in 5 minutes.

## What you'll build

By the end of this guide, your AI agent (Claude Code, Cursor, or any MCP client) will be able to:
- Look up device vendors from MAC addresses
- Search internet standards (RFCs)
- Query security vulnerabilities (CVEs)
- And access 38+ other networking intelligence tools

## Prerequisites

- **Node.js 20.x or later** ([download here](https://nodejs.org/))
- **An MCP-compatible client:**
  - [Claude Code](https://claude.ai/code) (recommended)
  - [Cursor](https://cursor.sh/)
  - [OpenClaw](https://openclaw.ai/)
  - Any client that supports [Model Context Protocol](https://modelcontextprotocol.io/)

## Quick Start (5 minutes)

### Step 1: Clone the repo

```bash
git clone https://github.com/cheenu1092-oss/netmcp.git
cd netmcp
```

### Step 2: Install dependencies

```bash
npm install
```

This installs all 9 packages via npm workspaces.

### Step 3: Pick a package to start with

We'll use **oui-lookup** (MAC address → vendor mapping) as an example:

```bash
cd packages/oui-lookup
npm run update-db  # Downloads IEEE OUI database (4.3MB, one-time)
```

### Step 4: Configure your MCP client

Add this to your MCP client configuration:

**For Claude Code** (`~/.claude/mcp_config.json`):
```json
{
  "mcpServers": {
    "oui-lookup": {
      "command": "node",
      "args": ["/absolute/path/to/netmcp/packages/oui-lookup/src/index.js"]
    }
  }
}
```

**For Cursor** (`.cursorrules` or Cursor settings):
```json
{
  "mcp": {
    "servers": {
      "oui-lookup": {
        "command": "node",
        "args": ["/absolute/path/to/netmcp/packages/oui-lookup/src/index.js"]
      }
    }
  }
}
```

**For OpenClaw** (`~/.clawdbot/clawdbot.json`):
```json
{
  "agents": {
    "main": {
      "mcp": {
        "oui-lookup": {
          "command": "node",
          "args": ["/absolute/path/to/netmcp/packages/oui-lookup/src/index.js"],
          "env": {}
        }
      }
    }
  }
}
```

> ⚠️ **Important:** Replace `/absolute/path/to/netmcp` with your actual path (e.g., `/Users/yourname/projects/netmcp`)

### Step 5: Restart your AI agent

Restart Claude Code, Cursor, or OpenClaw so it picks up the new MCP configuration.

### Step 6: Try your first query

Ask your AI agent:

> "What company makes devices with MAC address 00:1A:2B:3C:4D:5E?"

The agent will use the `oui_lookup` tool and respond:

```
The MAC address 00:1A:2B:3C:4D:5E belongs to Apple, Inc.
Vendor details:
- OUI Prefix: 001A2B
- Company: Apple, Inc.
- Address: 1 Infinite Loop, Cupertino CA 95014, US
```

**🎉 Success!** Your AI agent now has access to IEEE's official MAC address vendor database.

---

## What just happened?

1. Your AI agent received your question
2. It decided to use the `oui_lookup` tool from the oui-lookup MCP server
3. The server looked up the MAC address in the local IEEE database (38,000+ vendors)
4. The agent formatted the result in natural language

**No API keys. No rate limits. No internet required** (database is local).

---

## Next Steps

### Add more packages

Each NetMCP package is an independent MCP server. Add as many as you need:

```json
{
  "mcpServers": {
    "oui-lookup": {
      "command": "node",
      "args": ["/path/to/netmcp/packages/oui-lookup/src/index.js"]
    },
    "rfc-search": {
      "command": "node",
      "args": ["/path/to/netmcp/packages/rfc-search/src/index.js"]
    },
    "nvd-network-cves": {
      "command": "node",
      "args": ["/path/to/netmcp/packages/nvd-network-cves/src/index.js"]
    }
  }
}
```

**Available packages:**

| Package | What it does | Example query |
|---------|-------------|---------------|
| `oui-lookup` | MAC address → vendor | "Who makes MAC 00:1A:2B:...?" |
| `rfc-search` | Internet standards | "What's RFC 9293 about?" |
| `nvd-network-cves` | Security vulnerabilities | "Tell me about CVE-2023-44487" |
| `fcc-devices` | Wireless certifications | "What devices has Apple certified?" |
| `threegpp-specs` | 5G/LTE specifications | "What's 3GPP spec 23.501?" |
| `iana-services` | Port & protocol lookup | "What runs on port 443?" |
| `dns-records` | DNS record types | "What's a DNS AAAA record?" |
| `iana-media-types` | MIME types | "What's the MIME type for .webp?" |
| `whois-lookup` | Domain/IP/ASN info | "Look up example.com" |

### Explore package capabilities

Each package has multiple tools. Ask your agent:

> "What tools are available in oui-lookup?"

It will respond with:
- `oui_lookup` — Look up vendor by MAC address
- `oui_search` — Search for vendors by name
- `oui_vendors` — List all unique vendors
- `oui_stats` — Get database statistics

### Try advanced queries

NetMCP packages support complex queries:

**Security research:**
> "Find recent CVEs affecting nginx with CVSS score above 7.0"

**Standards lookup:**
> "Search for RFCs about HTTP/2 published after 2020"

**Device research:**
> "Show me wireless devices certified by Samsung in the last 6 months"

**Network debugging:**
> "What service typically runs on port 8080 and what's its IANA status?"

---

## Configuration Tips

### Use absolute paths

MCP clients need absolute paths (not `~` or relative paths):

```bash
# ✅ Good
"/Users/yourname/projects/netmcp/packages/oui-lookup/src/index.js"

# ❌ Bad
"~/projects/netmcp/packages/oui-lookup/src/index.js"
"./packages/oui-lookup/src/index.js"
```

### Multiple packages, one config

You can configure all 9 packages at once. They run independently (no conflicts):

```json
{
  "mcpServers": {
    "oui-lookup": { "command": "node", "args": ["/path/to/oui-lookup/src/index.js"] },
    "rfc-search": { "command": "node", "args": ["/path/to/rfc-search/src/index.js"] },
    "nvd-network-cves": { "command": "node", "args": ["/path/to/nvd-network-cves/src/index.js"] },
    "fcc-devices": { "command": "node", "args": ["/path/to/fcc-devices/src/index.js"] },
    "threegpp-specs": { "command": "node", "args": ["/path/to/threegpp-specs/src/index.js"] },
    "iana-services": { "command": "node", "args": ["/path/to/iana-services/src/index.js"] },
    "dns-records": { "command": "node", "args": ["/path/to/dns-records/src/index.js"] },
    "iana-media-types": { "command": "node", "args": ["/path/to/iana-media-types/src/index.js"] },
    "whois-lookup": { "command": "node", "args": ["/path/to/whois-lookup/src/index.js"] }
  }
}
```

### Environment variables (optional)

Some packages accept environment variables for configuration:

```json
{
  "mcpServers": {
    "nvd-network-cves": {
      "command": "node",
      "args": ["/path/to/nvd-network-cves/src/index.js"],
      "env": {
        "NVD_RATE_LIMIT": "10",
        "NVD_CACHE_TTL": "3600"
      }
    }
  }
}
```

Check each package's README for available options.

---

## Troubleshooting

### "Command not found: node"

Install Node.js 20.x or later from [nodejs.org](https://nodejs.org/).

### "Cannot find module @modelcontextprotocol/sdk"

Run `npm install` from the netmcp root directory (not inside a package).

### "MCP server not responding"

1. Check that the path in your config is absolute (not relative)
2. Test the server manually:
   ```bash
   cd packages/oui-lookup
   node src/index.js
   ```
   You should see: `OUI Lookup MCP server running on stdio`
3. Check your MCP client logs for detailed error messages

### "Database not found" (oui-lookup)

Run `npm run update-db` from the `packages/oui-lookup` directory to download the IEEE database.

### Rate limit errors (nvd-network-cves)

The NVD package has built-in rate limiting (5 requests per 30 seconds). Wait a few seconds between queries or check cache stats:

> "Show me NVD cache stats"

---

## Alternative: Use Apify (Hosted)

Don't want to self-host? Use the hosted version on Apify:

- No installation required
- Pay-per-query pricing
- Same MCP interface

Available on [Apify Store](https://apify.com/jugaad-lab):
- [oui-lookup](https://apify.com/jugaad-lab/oui-lookup)
- [rfc-search](https://apify.com/jugaad-lab/rfc-search)
- [nvd-network-cves](https://apify.com/jugaad-lab/nvd-network-cves)
- [fcc-devices](https://apify.com/jugaad-lab/fcc-devices)
- [threegpp-specs](https://apify.com/jugaad-lab/threegpp-specs)

---

## Learn More

- **Full documentation:** [README.md](README.md)
- **Contributing guidelines:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security policy:** [SECURITY.md](SECURITY.md)
- **Architecture diagram:** See [README.md#architecture](README.md#architecture)
- **MCP Protocol:** [modelcontextprotocol.io](https://modelcontextprotocol.io/)

---

## What's Next?

Now that you have NetMCP running, explore the other packages:

1. **rfc-search** — Search 153,000+ internet standards
2. **nvd-network-cves** — Query 250,000+ security vulnerabilities (with 24-hour cache!)
3. **fcc-devices** — Look up wireless equipment certifications
4. **threegpp-specs** — Access 5G/LTE specifications
5. **iana-services** — Look up port/protocol assignments
6. **dns-records** — Query DNS resource record types
7. **iana-media-types** — Look up MIME types
8. **whois-lookup** — Query domain/IP/ASN registration data

Happy networking! 🚀

---

**Questions?** Open an issue on [GitHub](https://github.com/cheenu1092-oss/netmcp/issues).
