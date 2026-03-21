# Contributing to NetMCP

Thanks for your interest in contributing to NetMCP! This project provides production-ready MCP servers for networking intelligence.

## Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/netmcp.git
cd netmcp

# 2. Install all dependencies (uses npm workspaces)
npm install

# 3. Run smoke tests (19 tests, ~18s)
bash test-all.sh

# 4. Run integration tests (18 tests, ~60s)
bash test-integration.sh

# 5. Lint code (must pass with 0 errors, 0 warnings)
npm run lint
```

## Project Structure

```
netmcp/
├── packages/           # MCP server packages (npm workspaces)
│   ├── oui-lookup/     # IEEE OUI MAC-to-vendor (4.6MB database)
│   ├── rfc-search/     # IETF Datatracker API
│   ├── nvd-network-cves/ # NIST NVD vulnerabilities (with 24hr cache)
│   ├── fcc-devices/    # FCC equipment authorization
│   └── threegpp-specs/ # 3GPP 5G/LTE standards (curated + FTP)
├── .github/workflows/  # GitHub Actions CI/CD
│   └── test.yml        # Runs tests + lint on Node 20.x, 22.x, 24.x
├── test-all.sh         # 19 smoke tests (basic functionality)
├── test-integration.sh # 18 integration tests (edge cases, concurrency)
├── eslint.config.js    # ESLint with JSDoc type validation
├── CHANGELOG.md        # Keep a Changelog format
└── CONTRIBUTING.md     # This file
```

## Code Standards

### Required for All Contributions

- ✅ **ESLint:** `npm run lint` must pass with 0 errors, 0 warnings
- ✅ **Tests:** All 37 tests (19 smoke + 18 integration) must pass
- ✅ **JSDoc:** 100% type annotation coverage (see existing packages)
- ✅ **Input validation:** Max 1000 chars, format checks, sanitization
- ✅ **Error handling:** Never crash, always return error JSON
- ✅ **Rate limiting:** Required for all packages calling external APIs
- ✅ **Timeouts:** All network calls must have 10-15s timeout

### Code Style

- **ES Modules** (`import`/`export`, `type: "module"` in package.json)
- **JSDoc types** for all functions, parameters, return values, and data structures
- **zod** for runtime input validation (transitive dep of MCP SDK)
- **Conventional commits** (`feat:`, `fix:`, `docs:`, `test:`, `ci:`, `refactor:`)
- **No console.log** (use proper error returns instead)

### Example JSDoc (required pattern):

```javascript
/**
 * Fetch data from external API with timeout and rate limiting
 * @param {string} url - API endpoint URL
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Object>} - API response data
 */
async function fetchJSON(url, timeoutMs) {
  await rateLimitWait();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}
```

## Development Workflow

### 1. Set Up Your Environment

```bash
# Install dependencies (npm workspaces hoists shared deps)
npm install

# Verify setup
npm ls --workspaces --depth=0
# Should show: @netmcp/oui-lookup, @netmcp/rfc-search, etc.
```

### 2. Make Changes

```bash
# Create a branch
git checkout -b feat/add-iana-port-lookup

# Make your changes in packages/<name>/src/index.js

# Add JSDoc type annotations (see existing packages)
# Add input validation (max 1000 chars, format checks)
# Add rate limiting if calling external APIs
# Add timeout to all network calls (10-15s)
```

### 3. Test Your Changes

```bash
# Run smoke tests
bash test-all.sh

# Run integration tests
bash test-integration.sh

# Lint your code (must be 0 errors, 0 warnings)
npm run lint

# Auto-fix linting issues (if possible)
npm run lint:fix
```

### 4. Manual Testing

```bash
# Test your MCP server manually
cd packages/<your-package>
npm start

# In another terminal, send JSON-RPC request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"your_tool","arguments":{"input":"test"}}}' | nc localhost 3000
```

### 5. Update Documentation

- Add usage examples to package README.md
- Add entry to root CHANGELOG.md (Keep a Changelog format)
- Update root README.md if adding a new package

### 6. Submit Pull Request

- **One package per PR** (easier to review)
- **Include tests** for new functionality
- **Pass all CI checks** (GitHub Actions runs on push)
- **Update CHANGELOG.md** with your changes

## Adding a New Package

### 1. Package Structure

Create `packages/<name>/` with these files:

```
packages/<name>/
├── package.json        # See template below
├── src/
│   └── index.js        # MCP server implementation
├── jsconfig.json       # Enable static type checking
├── .npmignore          # Exclude dev files from npm package
└── README.md           # Usage examples
```

### 2. package.json Template

```json
{
  "name": "@netmcp/<name>",
  "version": "0.1.0",
  "description": "MCP server for <description>",
  "type": "module",
  "main": "src/index.js",
  "files": ["src/", "README.md"],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "start": "node src/index.js"
  },
  "keywords": ["mcp", "networking", "<your-keywords>"],
  "author": "NetMCP Contributors",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4"
  }
}
```

### 3. src/index.js Template

```javascript
#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

/** @typedef {Object} YourDataType
 * @property {string} field1 - Description
 * @property {number} field2 - Description
 */

// Rate limiting (if calling external APIs)
/** @type {number[]} */
const requestTimestamps = [];
/** @type {Promise<void>} */
let rateLimitQueue = Promise.resolve();
const MAX_REQUESTS = 5;
const REQUEST_WINDOW = 10000; // 10 seconds

/**
 * Thread-safe rate limiter
 * @returns {Promise<void>}
 */
async function rateLimitWait() {
  rateLimitQueue = rateLimitQueue.then(async () => {
    const now = Date.now();
    while (requestTimestamps.length && requestTimestamps[0] < now - REQUEST_WINDOW) {
      requestTimestamps.shift();
    }
    if (requestTimestamps.length >= MAX_REQUESTS) {
      const waitMs = requestTimestamps[0] + REQUEST_WINDOW - now + 100;
      await new Promise(r => setTimeout(r, waitMs));
      return rateLimitWait();
    }
    requestTimestamps.push(Date.now());
  });
  return rateLimitQueue;
}

/**
 * Fetch data with timeout and rate limiting
 * @param {string} url - API endpoint
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Object>} - API response
 */
async function fetchJSON(url, timeoutMs = 10000) {
  await rateLimitWait();
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

const server = new McpServer({
  name: '<your-package-name>',
  version: '0.1.0',
});

// Register your tool
server.tool(
  'your_tool_name',
  'Tool description',
  {
    input: z.string().max(1000, 'Input too long. Maximum 1000 characters.').describe('Input parameter'),
  },
  async ({ input }) => {
    try {
      // Your implementation here
      const result = { message: 'Success', input };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: err.message }),
        }],
      };
    }
  }
);

// Start server
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
```

### 4. jsconfig.json (Enable Type Checking)

```json
{
  "compilerOptions": {
    "checkJs": true,
    "module": "ES2022",
    "target": "ES2022",
    "moduleResolution": "node",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 5. .npmignore

```
.actor/
*.test.js
test/
jsconfig.json
.DS_Store
.env
```

### 6. Add Tests

Add test cases to `test-all.sh`:

```bash
echo "  your_tool_name (description)... "
TOOL_OUTPUT=$(mcp_call "your_tool_name" '{"input":"test"}')
if echo "$TOOL_OUTPUT" | grep -q '"expected_field"'; then
  echo "✅ PASS"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo "❌ FAIL"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

### 7. Update Documentation

- Add row to root `README.md` packages table
- Add usage example to root README "Usage Examples" section
- Add entry to `CHANGELOG.md`

## Data Sources Policy

We **only** use free, public, authoritative data sources:

✅ **Allowed:**
- Government APIs (FCC, NIST NVD, etc.)
- Standards bodies (IETF, 3GPP, IEEE)
- Open data portals (Socrata, data.gov)
- Public databases with clear licensing

❌ **Not Allowed:**
- Scraping private websites
- APIs requiring payment
- Data with unclear licensing
- Bypassing rate limits or ToS

## Pull Request Checklist

Before submitting your PR, verify:

- [ ] `npm install` works (no errors)
- [ ] `bash test-all.sh` passes (19/19 tests)
- [ ] `bash test-integration.sh` passes (18/18 tests)
- [ ] `npm run lint` passes (0 errors, 0 warnings)
- [ ] All functions have JSDoc type annotations
- [ ] Input validation includes max 1000 char check
- [ ] Network calls have timeouts (10-15s)
- [ ] Rate limiting added if calling external APIs
- [ ] Error handling returns JSON (never crashes)
- [ ] CHANGELOG.md updated
- [ ] README.md updated (if adding package or major feature)
- [ ] Conventional commit messages used
- [ ] No `node_modules/` or lockfile changes (unless adding deps)

## Code Review Process

1. **Automated checks** run via GitHub Actions (tests + lint)
2. **Maintainer review** (usually within 48 hours)
3. **Feedback iteration** (address review comments)
4. **Merge** once all checks pass and maintainer approves

## Getting Help

- **Questions?** Open a GitHub Discussion
- **Bug reports?** Open a GitHub Issue
- **Want to contribute but not sure where to start?** Check "good first issue" label

## License

By contributing, you agree that your contributions will be licensed under the MIT License (same as the project).

---

**Thank you for contributing to NetMCP!** 🎉
