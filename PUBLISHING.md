# Publishing Guide

This guide explains how to publish NetMCP packages to npm registry.

## Prerequisites

1. **npm account** — Create one at https://www.npmjs.com/signup
2. **npm access** — Must be logged in on your local machine
3. **2FA configured** — Recommended for security (npmjs.com → Account → Two-Factor Authentication)

## Quick Publish (One Command)

Once you're logged in to npm, publishing all 9 packages is a single command:

```bash
# Test first (dry run - no actual publishing)
npm run publish-all:dry-run

# Publish for real (after verifying dry run)
npm run publish-all
```

The script will:
1. ✅ Verify you're logged in to npm
2. ✅ Show your npm username
3. ✅ Verify package contents with `npm pack --dry-run` for each package
4. ✅ Publish each package to npm registry
5. ✅ Show summary (success/fail counts)
6. ✅ Provide next steps (badges, GitHub release, changelog update)

## Manual Setup (First Time Only)

### Step 1: Login to npm

```bash
npm login
```

You'll be prompted for:
- **Username:** Your npm username
- **Password:** Your npm password
- **Email:** Your npm email (public)
- **OTP:** Two-factor authentication code (if enabled)

To verify you're logged in:

```bash
npm whoami
# Should print your npm username
```

### Step 2: Verify Access to @netmcp Scope

The packages are scoped under `@netmcp/*` which requires:
- Either you own the `@netmcp` scope
- Or you have been added as a collaborator

To check scope ownership:

```bash
npm owner ls @netmcp/oui-lookup
# (Will fail if package doesn't exist yet - this is expected)
```

If you don't own the scope, you'll need to either:
1. Use your own scope (e.g., `@yourname/oui-lookup`)
2. Request access from the `@netmcp` scope owner
3. Use unscoped package names (e.g., `netmcp-oui-lookup`)

**Note:** All packages are configured with `"publishConfig": { "access": "public" }` so scoped packages will be public by default.

## Publishing Workflow

### For First-Time Publishing

```bash
# 1. Login to npm
npm login

# 2. Test dry run (verifies package contents without publishing)
npm run publish-all:dry-run

# 3. Review output - all 9 packages should show "✅ Dry run successful"

# 4. Publish for real
npm run publish-all

# 5. Verify on npmjs.com
# Visit: https://www.npmjs.com/package/@netmcp/oui-lookup
#        https://www.npmjs.com/package/@netmcp/rfc-search
#        ... (all 9 packages)
```

### For Subsequent Releases

```bash
# 1. Update version in all package.json files
#    (or use lerna/changesets for automated versioning)

# 2. Update CHANGELOG.md with release notes

# 3. Commit changes
git add -A
git commit -m "chore: release v1.1.0"

# 4. Publish to npm
npm run publish-all

# 5. Create Git tag and push
git tag v1.1.0
git push && git push --tags

# 6. Create GitHub Release
gh release create v1.1.0 --title "v1.1.0" --notes "See CHANGELOG.md"
```

## Post-Publishing Checklist

After successful publishing:

- [ ] **Update README badges** — Add npm version shields:
  ```markdown
  [![npm version](https://img.shields.io/npm/v/@netmcp/oui-lookup.svg)](https://www.npmjs.com/package/@netmcp/oui-lookup)
  ```
- [ ] **Create GitHub release** — Tag and release notes
- [ ] **Update CHANGELOG.md** — Add published date to Unreleased section
- [ ] **Test installation** — `npx @netmcp/oui-lookup` should work
- [ ] **Update MCP Marketplace listings** — Submit to Smithery, Glama, mcp.run (see MCP_MARKETPLACE.md)
- [ ] **Announce** — Social media, internal channels, HackerNews, etc.

## Troubleshooting

### "need auth" Error

```
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in.
```

**Solution:** Run `npm login` first.

### "402 Payment Required" Error (for scoped packages)

```
npm error code E402
npm error 402 Payment Required - PUT https://registry.npmjs.org/@netmcp%2foui-lookup
```

**Solution:** Add `"publishConfig": { "access": "public" }` to package.json.
(Already configured in all NetMCP packages)

### "EPUBLISHCONFLICT" Error (version already published)

```
npm error code EPUBLISHCONFLICT
npm error publish fail Cannot publish over existing version.
```

**Solution:** Update version in package.json (e.g., `1.0.0` → `1.0.1`), then try again.

### "ENOENT" Error (missing files)

```
npm error code ENOENT
npm error enoent ENOENT: no such file or directory
```

**Solution:** Verify `"files"` field in package.json includes all required files.
Run `npm pack --dry-run` to preview package contents.

### Rate Limiting

npm has rate limits on publishing:
- **New users:** Limited to a few packages per day initially
- **Established users:** Higher limits after building reputation
- **Organizations:** Higher limits

If you hit rate limits, wait 24 hours and try again.

## Security Best Practices

1. **Enable 2FA** — Protects against account compromise
2. **Use automation tokens** — For CI/CD publishing (see GitHub Actions section)
3. **Review package contents** — Always run dry-run first (`npm pack --dry-run`)
4. **Don't commit secrets** — Never commit npm tokens to git
5. **Use .npmignore** — Exclude dev files (.env, .git, tests, etc.)

## Automation with GitHub Actions (Optional)

For automated releases on git tag:

```yaml
# .github/workflows/publish.yml
name: Publish to npm
on:
  push:
    tags:
      - 'v*'
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24.x
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run publish-all
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

To set up:
1. Create automation token at https://www.npmjs.com/settings/tokens
2. Add `NPM_TOKEN` secret to GitHub repository settings
3. Push a git tag: `git tag v1.0.0 && git push --tags`

## Package Details

All 9 NetMCP packages are configured identically for publishing:

| Package | Scope | Version | Files |
|---------|-------|---------|-------|
| oui-lookup | @netmcp | 1.0.0 | src/, data/oui.json, README.md |
| rfc-search | @netmcp | 1.0.0 | src/, README.md |
| nvd-network-cves | @netmcp | 1.0.0 | src/, README.md |
| fcc-devices | @netmcp | 1.0.0 | src/, README.md |
| threegpp-specs | @netmcp | 1.0.0 | src/, README.md |
| iana-services | @netmcp | 1.0.0 | src/, data/iana-services.json, README.md |
| dns-records | @netmcp | 1.0.0 | src/, README.md |
| iana-media-types | @netmcp | 1.0.0 | src/, README.md |
| whois-lookup | @netmcp | 1.0.0 | src/, README.md |

Each package has:
- ✅ `"publishConfig": { "access": "public" }` (scoped packages are public)
- ✅ `"bin"` field (enables `npx @netmcp/package-name`)
- ✅ `"files"` field (controls what gets published)
- ✅ `"repository"` field (links to GitHub)
- ✅ `"keywords"` field (npmjs.com discoverability)
- ✅ `"license": "MIT"` (open source license)

## Support

- **Documentation:** See README.md, GETTING_STARTED.md, CONTRIBUTING.md
- **Issues:** https://github.com/cheenu1092-oss/netmcp/issues
- **Security:** See SECURITY.md for vulnerability reporting
- **Email:** naga22694+clawd@gmail.com

---

*Last updated: Cycle 50 (2026-03-24)*
