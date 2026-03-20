# Changelog

All notable changes to the NetMCP project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **npm workspaces configuration** for proper monorepo tooling
  - Single `npm install` at root installs all package dependencies
  - Hoisted shared dependencies (@modelcontextprotocol/sdk)
  - Workspace-aware scripts for testing and running individual packages
- GitHub Actions CI/CD workflow for automated testing across Node.js 18.x, 20.x, 22.x
- **24-hour in-memory cache for nvd-network-cves** with automatic expiration
  - Separate caches for CVE lookups and keyword/vendor searches
  - New `cve_cache_stats` tool for monitoring cache performance
  - Cache hits bypass rate limiting entirely (instant responses)
- Network timeout protection in `rfc-search` (10s timeout)
- Network timeout protection in `nvd-network-cves` (15s timeout)
- Thread-safe rate limiter for `nvd-network-cves` (prevents race conditions)
- Comprehensive improvement log tracking hourly development cycles
- This CHANGELOG.md file to track project changes

### Fixed
- SQL injection vulnerability in `fcc-devices` via proper input sanitization
- Input validation in `oui-lookup` search queries
- MAC address hex validation in `oui-lookup`
- RFC number range validation in `rfc-search` (1-15000)
- Error message information disclosure in `rfc-search`
- Affected products truncation indicator in `nvd-network-cves`
- Grantee code format validation in `fcc-devices`
- GitHub Actions workflow cache configuration for monorepo structure
- Race condition in NVD rate limiter under concurrent load

### Security
- **Fixed 5 dependency vulnerabilities** (1 low, 1 moderate, 3 high)
  - @hono/node-server: Authorization bypass in static paths
  - ajv: ReDoS vulnerability with $data option
  - express-rate-limit: IPv4-mapped IPv6 bypass
  - hono: Multiple security issues (timing attacks, cookie injection, SSE injection, file access, prototype pollution)
  - qs: arrayLimit bypass DoS vulnerability
- Sanitized user input across all search queries to prevent injection attacks
- Improved error messages to avoid exposing internal API details
- Added request limit caps to prevent resource exhaustion (max 100 results)

## [1.0.0] - 2026-02-09

### Added
- Initial release of NetMCP monorepo with 5 MCP servers:
  - **oui-lookup**: IEEE OUI/MAC address vendor lookups (38,869 entries)
  - **rfc-search**: IETF RFC document search and retrieval
  - **nvd-network-cves**: NVD CVE search with CVSS scoring and CPE parsing
  - **fcc-devices**: FCC device database search via Socrata API
  - **threegpp-specs**: 3GPP technical specification lookup (curated + FTP)
- 17 total MCP tools across all packages
- Comprehensive README documentation for each package
- SKILL.md files for OpenClaw integration
- Apify Actor configurations for serverless deployment
- Rate limiting implementation in `nvd-network-cves` (5 req/10s)
- Manual test suite covering all 17 tools (100% pass rate)

### Technical Details
- MCP Protocol v1.12.1 compliance
- ES modules throughout
- Zod-based input validation
- Clean separation of concerns (formatters, helpers, tools)
- Timeout protection in external API calls (10-15s)
- Graceful error handling with user-friendly messages

---

## Version History

### Package Versions
All packages currently at version 1.0.0:
- `@netmcp/oui-lookup`: 1.0.0
- `@netmcp/rfc-search`: 1.0.0
- `@netmcp/nvd-network-cves`: 1.0.0
- `@netmcp/fcc-devices`: 1.0.0
- `@netmcp/threegpp-specs`: 1.0.0

---

## Roadmap

### Planned Features
- [ ] Caching layer for NVD API calls (reduce rate limit pressure)
- [ ] npm workspace configuration for monorepo tooling
- [ ] TypeScript type definitions or comprehensive JSDoc
- [ ] Integration tests beyond smoke tests
- [ ] Rate limiting for `rfc-search` and `fcc-devices`
- [ ] New networking tools (IANA port lookup, DNS tools, BGP looking glass)

### Under Consideration
- [ ] Fuzzy search for vendor names in `oui-lookup`
- [ ] NVD API key support for higher rate limits
- [ ] WHOIS lookup integration
- [ ] Wireshark dissector database integration

---

[Unreleased]: https://github.com/cheenu1092-oss/netmcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/cheenu1092-oss/netmcp/releases/tag/v1.0.0
