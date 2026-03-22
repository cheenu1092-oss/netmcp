# npm Publishing Guide

> **Status:** All 9 packages are ready for npm publish. This guide documents the exact steps.

## Pre-Publish Verification ✅

All packages have been verified with `npm pack --dry-run`:

| Package | Version | Size | Files | Status |
|---------|---------|------|-------|--------|
| @netmcp/oui-lookup | 1.0.0 | 1.2 MB | 4 | ✅ Ready |
| @netmcp/rfc-search | 1.0.0 | 5.3 KB | 3 | ✅ Ready |
| @netmcp/nvd-network-cves | 1.0.0 | 6.2 KB | 3 | ✅ Ready |
| @netmcp/fcc-devices | 1.0.0 | 4.9 KB | 3 | ✅ Ready |
| @netmcp/threegpp-specs | 1.0.0 | 7.7 KB | 3 | ✅ Ready |
| @netmcp/iana-services | 1.0.0 | 5.3 KB | 3 | ✅ Ready |
| @netmcp/dns-records | 0.1.0 | 5.4 KB | 3 | ✅ Ready |
| @netmcp/iana-media-types | 1.0.0 | 6.7 KB | 3 | ✅ Ready |
| @netmcp/whois-lookup | 0.1.0 | 4.9 KB | 3 | ✅ Ready |

**Total packages:** 9  
**Total tools:** 41  
**All tests passing:** ✅ 75/75 (41 smoke + 34 integration)  
**ESLint:** ✅ 0 errors, 0 warnings  
**Security:** ✅ 0 vulnerabilities

## Publishing Steps

### 1. Authenticate with npm

```bash
# Login to npm (one-time setup)
npm login

# Verify login
npm whoami
# Expected: your npm username
```

### 2. Publish All Packages

Run this script from the repository root:

```bash
#!/bin/bash
# publish-all.sh — Publish all 9 NetMCP packages to npm

set -e  # Exit on error

PACKAGES=(
  "oui-lookup"
  "rfc-search"
  "nvd-network-cves"
  "fcc-devices"
  "threegpp-specs"
  "iana-services"
  "dns-records"
  "iana-media-types"
  "whois-lookup"
)

echo "🚀 Publishing 9 NetMCP packages to npm..."
echo ""

for PKG in "${PACKAGES[@]}"; do
  echo "📦 Publishing @netmcp/$PKG..."
  cd "packages/$PKG"
  npm publish --access public
  cd ../..
  echo "✅ Published @netmcp/$PKG"
  echo ""
done

echo "🎉 All 9 packages published successfully!"
echo ""
echo "Verify on npm:"
for PKG in "${PACKAGES[@]}"; do
  echo "  https://www.npmjs.com/package/@netmcp/$PKG"
done
```

**OR publish packages individually:**

```bash
# Navigate to each package directory and publish
cd packages/oui-lookup && npm publish --access public
cd ../rfc-search && npm publish --access public
cd ../nvd-network-cves && npm publish --access public
cd ../fcc-devices && npm publish --access public
cd ../threegpp-specs && npm publish --access public
cd ../iana-services && npm publish --access public
cd ../dns-records && npm publish --access public
cd ../iana-media-types && npm publish --access public
cd ../whois-lookup && npm publish --access public
```

### 3. Verify Publication

After publishing, verify each package appears on npm:

```bash
# Check package exists
npm view @netmcp/oui-lookup

# Install and test
npm install @netmcp/oui-lookup
npx @netmcp/oui-lookup
```

Visit npm package pages:
- https://www.npmjs.com/package/@netmcp/oui-lookup
- https://www.npmjs.com/package/@netmcp/rfc-search
- https://www.npmjs.com/package/@netmcp/nvd-network-cves
- https://www.npmjs.com/package/@netmcp/fcc-devices
- https://www.npmjs.com/package/@netmcp/threegpp-specs
- https://www.npmjs.com/package/@netmcp/iana-services
- https://www.npmjs.com/package/@netmcp/dns-records
- https://www.npmjs.com/package/@netmcp/iana-media-types
- https://www.npmjs.com/package/@netmcp/whois-lookup

### 4. Update README Badges

After publishing, add npm version badges to README.md:

```markdown
[![npm version](https://img.shields.io/npm/v/@netmcp/oui-lookup.svg)](https://www.npmjs.com/package/@netmcp/oui-lookup)
[![npm downloads](https://img.shields.io/npm/dm/@netmcp/oui-lookup.svg)](https://www.npmjs.com/package/@netmcp/oui-lookup)
```

## Package Configuration ✅

All packages have correct metadata:

### Required Fields (All ✅ Complete)
- ✅ `name`: @netmcp/\<package-name\>
- ✅ `version`: 1.0.0 or 0.1.0 (new packages)
- ✅ `description`: Clear one-liner
- ✅ `keywords`: Relevant tags (mcp, networking, etc.)
- ✅ `repository`: GitHub URL
- ✅ `license`: MIT
- ✅ `author`: Nagarjun Srinivasan
- ✅ `bin`: Executable entry point (for npx support)
- ✅ `main`: src/index.js
- ✅ `files`: ["src/", "README.md", "data/"] (varies by package)
- ✅ `publishConfig`: { "access": "public" }
- ✅ `dependencies`: @modelcontextprotocol/sdk@1.0.4

### File Exclusions (All ✅ Complete)
All packages have `.npmignore` excluding:
- test/
- *.test.js
- .actor/
- jsconfig.json
- .env
- .DS_Store

## Post-Publish Tasks

### 1. Tag Release
```bash
git tag v1.0.0
git push origin v1.0.0
```

### 2. Create GitHub Release
- Go to https://github.com/cheenu1092-oss/netmcp/releases/new
- Tag: v1.0.0
- Title: "v1.0.0 — Initial npm Release (9 Packages, 41 Tools)"
- Description:
  ```
  ## 🎉 First npm Release
  
  All 9 NetMCP packages are now available on npm!
  
  **Install any package:**
  ```bash
  npm install @netmcp/oui-lookup
  npx @netmcp/oui-lookup
  ```
  
  **Packages:**
  - @netmcp/oui-lookup (4 tools)
  - @netmcp/rfc-search (4 tools)
  - @netmcp/nvd-network-cves (6 tools)
  - @netmcp/fcc-devices (4 tools)
  - @netmcp/threegpp-specs (4 tools)
  - @netmcp/iana-services (5 tools)
  - @netmcp/dns-records (4 tools)
  - @netmcp/iana-media-types (5 tools)
  - @netmcp/whois-lookup (5 tools)
  
  **Total:** 41 networking intelligence tools for AI agents
  
  See [GETTING_STARTED.md](GETTING_STARTED.md) for usage examples.
  ```

### 3. Update CHANGELOG.md
Add release notes:
```markdown
## [1.0.0] - 2026-03-22

### Added
- **npm publication:** All 9 packages published to npm registry
- **npx support:** All packages runnable via `npx @netmcp/<package-name>`
- **Getting Started guide:** Comprehensive 5-minute onboarding (GETTING_STARTED.md)
- **Professional README:** Architecture diagram, usage examples, technical features

### Packages Published
- @netmcp/oui-lookup@1.0.0
- @netmcp/rfc-search@1.0.0
- @netmcp/nvd-network-cves@1.0.0
- @netmcp/fcc-devices@1.0.0
- @netmcp/threegpp-specs@1.0.0
- @netmcp/iana-services@1.0.0
- @netmcp/dns-records@0.1.0
- @netmcp/iana-media-types@1.0.0
- @netmcp/whois-lookup@0.1.0
```

### 4. Announce on Social Media
- Twitter/X: "🚀 NetMCP is now on npm! 9 packages, 41 tools, networking intelligence for AI agents. #MCP #AI #networking"
- LinkedIn: Professional announcement with architecture diagram
- Discord/Slack communities: Share in relevant channels

### 5. Submit to MCP Marketplaces
- Smithery.ai: https://smithery.ai/submit
- Glama: https://glama.ai/mcp/servers
- mcp.run: https://mcp.run/submit

## Troubleshooting

### Error: 402 Payment Required
**Cause:** Scoped packages (@netmcp/*) default to private on npm Free plan  
**Solution:** Ensure `publishConfig.access: "public"` in package.json (✅ already configured)

### Error: Version already exists
**Cause:** Attempting to publish same version twice  
**Solution:** Bump version in package.json:
```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

### Error: Not logged in
**Cause:** npm authentication required  
**Solution:** Run `npm login` and enter credentials

### Error: E403 Forbidden
**Cause:** Package name already taken OR insufficient permissions  
**Solution:** Verify @netmcp scope is available, or contact npm support

## Future Releases

For version updates, use conventional commits + semantic versioning:

```bash
# Make changes
git add .
git commit -m "feat: add new tool xyz"

# Bump version
cd packages/<package-name>
npm version minor  # or patch/major

# Publish
npm publish

# Tag and push
git tag v1.1.0
git push origin v1.1.0
```

## Automated Releases (Future)

Consider adding GitHub Actions workflow for automated releases:
- `release.yml`: Trigger on tag push, run tests, publish to npm
- `semantic-release`: Automated versioning based on commit messages
- `changesets`: Coordinated versioning across monorepo packages

---

**Last updated:** 2026-03-22 (Cycle 52)  
**Status:** ✅ Ready for npm publish (awaiting credentials)
