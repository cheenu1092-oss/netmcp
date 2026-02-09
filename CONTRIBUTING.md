# Contributing to NetMCP

Thanks for your interest in contributing to NetMCP! This project provides MCP servers for networking intelligence.

## Getting Started

1. Fork the repo and clone it locally
2. Pick a package to work on from `packages/`
3. Install dependencies: `cd packages/<name> && npm install`
4. Run the server: `npm start`

## Project Structure

```
netmcp/
├── packages/           # MCP server packages
│   ├── oui-lookup/     # IEEE OUI MAC-to-vendor
│   ├── rfc-search/     # IETF Datatracker API
│   ├── nvd-network-cves/ # NIST NVD vulnerabilities
│   ├── fcc-devices/    # FCC equipment authorization
│   └── threegpp-specs/ # 3GPP 5G/LTE standards
├── skills/             # OpenClaw skill definitions
└── CONTRIBUTING.md
```

## Adding a New Package

1. Create `packages/<name>/` with:
   - `package.json` — Use `@netmcp/` scope, `type: "module"`, MCP SDK dep
   - `src/index.js` — MCP server using `McpServer` from `@modelcontextprotocol/sdk`
   - `.actor/actor.json` — Apify actor config
   - `.actor/pay_per_event.json` — Pricing config
   - `README.md` — Usage examples

2. Create `skills/<name>/SKILL.md` with YAML frontmatter (`name` + `description`)

3. Update the root `README.md` packages table

## Code Style

- ES Modules (`import`/`export`)
- Use `zod` for input validation (it's a transitive dep of MCP SDK)
- Return JSON as `text` content type from tools
- Handle errors gracefully — never crash, always return error JSON
- Follow the patterns in existing packages

## Testing

Test each MCP server by piping JSON-RPC requests to stdin:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node src/index.js
```

## Data Sources

We only use **free, public, authoritative** APIs:
- No API keys required (some optional for higher rate limits)
- No scraping of private data
- All data sources are well-documented government or standards body APIs

## Pull Requests

- One package per PR is ideal
- Include tests if possible
- Make sure `npm install && npm start` works
- Don't include `node_modules/` or `package-lock.json` changes unless necessary

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
