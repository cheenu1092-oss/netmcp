# Release Process

> How to publish NetMCP packages to npm

---

## Prerequisites

Before releasing any package:

1. **All tests must pass**
   ```bash
   npm test              # Run all smoke tests (36 tests)
   npm run test:integration   # Run integration tests (30 tests)
   ```

2. **ESLint must be clean**
   ```bash
   npm run lint          # Must show 0 errors, 0 warnings
   ```

3. **GitHub Actions CI must be passing**
   - Check https://github.com/cheenu1092-oss/netmcp/actions
   - All 4 jobs must be green (Code Quality Check + 3 Node.js versions)

4. **CHANGELOG.md must be updated**
   - Document all changes since last release
   - Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
   - Move items from "Unreleased" to new version section

5. **npm login must be configured**
   ```bash
   npm whoami            # Verify you're logged in
   npm login             # Login if needed
   ```

---

## Publishing Process

### Step 1: Pre-Publish Validation

Run the validation checklist:

```bash
# Verify working directory is clean
git status            # Should show "nothing to commit, working tree clean"

# Run all quality checks
npm test              # 36 smoke tests
npm run test:integration   # 30 integration tests
npm run lint          # ESLint (0 errors, 0 warnings)

# Verify npm pack works for all packages
npm run pack:all      # (if script exists, otherwise run manually)
```

### Step 2: Version Bumping

**Semantic Versioning (semver):**
- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- **MAJOR** (e.g., `1.0.0` → `2.0.0`): Breaking changes
- **MINOR** (e.g., `1.0.0` → `1.1.0`): New features, backward-compatible
- **PATCH** (e.g., `1.0.0` → `1.0.1`): Bug fixes, backward-compatible

**Single package release:**
```bash
cd packages/<package-name>
npm version patch     # Or 'minor' or 'major'
```

**All packages release (synchronized versions):**
```bash
# Use npm workspaces to bump all packages
npm version patch --workspaces
```

### Step 3: Update CHANGELOG.md

1. Move "Unreleased" items to new version section:
   ```markdown
   ## [1.0.1] - 2026-03-22
   
   ### Added
   - New feature X
   
   ### Fixed
   - Bug Y
   
   ## [1.0.0] - 2026-02-09
   ...
   ```

2. Add link to GitHub comparison at bottom:
   ```markdown
   [1.0.1]: https://github.com/cheenu1092-oss/netmcp/compare/v1.0.0...v1.0.1
   ```

### Step 4: Commit and Tag

```bash
git add .
git commit -m "chore(release): publish v1.0.1"
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

### Step 5: Publish to npm

**Single package:**
```bash
cd packages/<package-name>
npm publish --access public
```

**All packages:**
```bash
npm publish --workspaces --access public
```

**Dry run first (recommended):**
```bash
npm publish --dry-run --workspace=packages/<package-name>
```

---

## Post-Publish Verification

### 1. Verify npm Registry

Check that packages are live:
```bash
npm view @netmcp/<package-name>
npm view @netmcp/oui-lookup         # Example
```

### 2. Test Installation

```bash
# Create temporary test directory
mkdir /tmp/netmcp-test && cd /tmp/netmcp-test
npm init -y

# Test installing published package
npm install @netmcp/<package-name>

# Verify it works
npx @netmcp/<package-name>
```

### 3. Update README Badges

Add npm version badge to root README.md:
```markdown
[![npm version](https://badge.fury.io/js/%40netmcp%2Foui-lookup.svg)](https://www.npmjs.com/package/@netmcp/oui-lookup)
```

### 4. GitHub Release

Create GitHub release from tag:
1. Go to https://github.com/cheenu1092-oss/netmcp/releases/new
2. Select tag `v1.0.1`
3. Title: `v1.0.1`
4. Description: Copy CHANGELOG entries for this version
5. Click "Publish release"

---

## Package-Specific Notes

### oui-lookup
- **Size:** ~1.2MB (compressed) due to 4.3MB OUI database
- **Database:** Cached in git (committed in Cycle 27 for CI reliability)
- **Update script:** `npm run update-db` fetches latest IEEE OUI data

### nvd-network-cves
- **Rate limiting:** 5 req/30s (strict NVD API limits)
- **Caching:** 24-hour in-memory cache (reduces API load)
- **Cache stats:** `cve_cache_stats` tool monitors performance

### fcc-devices
- **API:** Uses FCC Socrata Open Data API
- **Rate limiting:** 10 req/10s (conservative)
- **Input sanitization:** `sanitizeInput()` prevents SQL injection

### rfc-search
- **API:** IETF Datatracker API
- **Rate limiting:** 5 req/10s
- **Timeout:** 10s on all network calls

### threegpp-specs
- **Data:** Hybrid curated database + live FTP scraping
- **FTP server:** https://www.3gpp.org/ftp/Specs/
- **Curated:** 50+ key specs (LTE, 5G, IMS, etc.)

### iana-services
- **Data:** Curated local database (40+ well-known ports/services)
- **Protocols:** 17 common IP protocols (TCP, UDP, ICMP, etc.)
- **No API calls:** Instant lookups (zero external dependencies)

### dns-records
- **Data:** Curated local database (48 DNS resource record types)
- **Categories:** Data, Mail, Security, Meta, Obsolete, Experimental, Modern HTTP/HTTPS
- **No API calls:** Instant lookups (zero external dependencies)

### iana-media-types
- **Data:** Curated local database (80+ common MIME types)
- **Categories:** application, audio, image, text, video, multipart
- **No API calls:** Instant lookups (zero external dependencies)

---

## Troubleshooting

### "402 Payment Required" Error

**Cause:** Scoped `@netmcp/*` packages default to private on npm (requires paid account).

**Fix:** All packages already have `publishConfig.access: "public"` in package.json (added in Cycle 16).

### "ENEEDAUTH" Error

**Cause:** Not logged in to npm.

**Fix:**
```bash
npm login
# Follow prompts to authenticate
npm whoami    # Verify login succeeded
```

### "EPUBLISHCONFLICT" Error

**Cause:** Version already published to npm registry.

**Fix:** Bump version number:
```bash
npm version patch    # Increments patch version
npm publish --access public
```

### Test Failures Before Publish

**Cause:** Code changes broke existing functionality.

**Fix:**
1. Review failing test output
2. Fix the bug
3. Verify all tests pass: `npm test && npm run test:integration`
4. Commit fix: `git commit -am "fix: resolve test failure"`
5. Re-run pre-publish validation

---

## Automated Releases (Future)

### semantic-release

When ready for fully automated releases, configure `semantic-release`:

1. Install dependencies:
   ```bash
   npm install --save-dev semantic-release @semantic-release/changelog @semantic-release/git
   ```

2. Create `.releaserc.json`:
   ```json
   {
     "branches": ["main"],
     "plugins": [
       "@semantic-release/commit-analyzer",
       "@semantic-release/release-notes-generator",
       "@semantic-release/changelog",
       "@semantic-release/npm",
       "@semantic-release/git",
       "@semantic-release/github"
     ]
   }
   ```

3. Add GitHub Actions workflow (`.github/workflows/release.yml`):
   ```yaml
   name: Release
   on:
     push:
       branches: [main]
   jobs:
     release:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 24.x
             registry-url: https://registry.npmjs.org/
         - run: npm ci
         - run: npm test
         - run: npx semantic-release
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

4. Requires conventional commits:
   - `feat:` triggers MINOR version bump
   - `fix:` triggers PATCH version bump
   - `BREAKING CHANGE:` in commit body triggers MAJOR version bump

---

## Release Checklist

**Before publishing:**
- [ ] All 66 tests passing (36 smoke + 30 integration)
- [ ] ESLint clean (0 errors, 0 warnings)
- [ ] GitHub Actions CI passing (all 4 jobs green)
- [ ] CHANGELOG.md updated with new version
- [ ] Version bumped in package.json files
- [ ] Working tree clean (`git status`)
- [ ] npm login configured (`npm whoami`)

**Publishing:**
- [ ] Dry run successful (`npm publish --dry-run`)
- [ ] Published to npm (`npm publish --access public`)
- [ ] Commit and tag created (`git tag v1.0.1 && git push --tags`)

**After publishing:**
- [ ] Package visible on npm registry (`npm view @netmcp/<package>`)
- [ ] Installation works (`npm install @netmcp/<package>`)
- [ ] GitHub release created from tag
- [ ] README badges updated (optional)

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history and release notes.

---

## Contact

- **GitHub:** https://github.com/cheenu1092-oss/netmcp
- **Issues:** https://github.com/cheenu1092-oss/netmcp/issues
- **Email:** naga22694+clawd@gmail.com (for security issues only, see [SECURITY.md](./SECURITY.md))
