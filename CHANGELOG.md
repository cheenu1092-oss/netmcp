# Changelog

All notable changes to the NetMCP project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Security policy (SECURITY.md)** for vulnerability reporting and security best practices (2026-03-21)
  - Comprehensive vulnerability reporting guidelines (responsible disclosure process)
  - Supported versions table (semver policy)
  - Expected response timeline (24hr acknowledgment, 90-day disclosure)
  - Security best practices for users (input validation, rate limiting, error handling, dependency management)
  - Documents all built-in security features (input validation, rate limiting, timeouts, caching, error sanitization)
  - Known limitations section (in-memory cache, single-threaded rate limiter, no authentication)
  - Security audit history (automated review 2026-02-09, all HIGH/MEDIUM issues resolved)
  - Hall of Fame for security researchers (responsible disclosure recognition)
  - Standard for production-ready open source projects (especially security-focused tools)
- **GitHub issue and PR templates** for better contributor experience (2026-03-21)
  - Bug report template (YAML form) with structured fields for package, tool, environment, etc.
  - Feature request template (YAML form) with data source details, priority, willingness to contribute
  - Pull request template (Markdown) with comprehensive checklist (14 items) covering code quality, testing, documentation, security
  - Templates guide contributors through submission requirements from CONTRIBUTING.md
  - Reduces maintainer burden by ensuring structured, complete submissions
  - Professional open source project standard (aligns with production-ready infrastructure)
- **Architecture diagram** added to README (2026-03-21)
  - Mermaid diagram showing AI agents → MCP protocol → NetMCP servers → data sources
  - Highlights key features: rate limiting, caching, timeouts, input validation, JSDoc, tests
  - Improves documentation and onboarding for new users/contributors
  - Visualizes monorepo structure and data flow
- **Input validation improvements** (2026-03-21)
  - Max string length validation (1000 chars) across all packages to prevent DoS attacks
  - 3GPP spec number format validation (SS.NNN format like 23.501, 38.300)
  - Integration tests for validation features (2 new tests)
  - Addresses "Must Fix (Before Production)" security item from code review
- **Integration test suite** with 18 comprehensive tests (2026-03-21)
  - Thread-safe rate limiting verification (concurrent API calls)
  - NVD cache behavior validation (hits, misses, stats tool)
  - Error handling tests (invalid CVE format, short MAC, non-existent RFC, etc.)
  - Boundary case tests (max limits, zero limits, empty queries, special characters)
  - Rate limiter enforcement verification (RFC 5 req/10s, FCC 10 req/10s)
  - Data integrity tests (MAC normalization, CVSS extraction, 3GPP spec format)
  - Input validation tests (max length, spec format validation)
- **npm publishing configuration** for all 5 packages
  - Added `files` field to control which files are published to npm
  - Added `publishConfig` with `access: "public"` for scoped packages
  - Created `.npmignore` files to exclude dev/test files from npm packages
  - Verified package contents with `npm pack --dry-run` for all packages
  - Ready for publishing to npm registry
- **ESLint with JSDoc type validation** for automated code quality checks
  - Modern flat config format (eslint.config.js)
  - Type-aware linting leveraging comprehensive JSDoc annotations
  - Catches common mistakes (unused vars, undefined globals, regex errors)
  - Integrated into GitHub Actions CI/CD pipeline
  - npm scripts: `npm run lint`, `npm run lint:fix`
- **npm workspaces configuration** for proper monorepo tooling
  - Single `npm install` at root installs all package dependencies
  - Hoisted shared dependencies (@modelcontextprotocol/sdk)
  - Workspace-aware scripts for testing and running individual packages
- GitHub Actions CI/CD workflow for automated testing across Node.js 20.x, 22.x, 24.x
  - Upgraded to Node.js 24.x LTS (dropped end-of-life 18.x)
  - Enabled npm dependency caching for faster CI runs
  - Tests run on every push and pull request
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
- Unnecessary escape characters in regex patterns across all packages
- Unused variable warnings by prefixing reserved constants with underscore

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
