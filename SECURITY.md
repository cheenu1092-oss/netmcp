# Security Policy

## Supported Versions

NetMCP follows semantic versioning. Security updates are provided for the following versions:

| Version | Supported          | Notes |
| ------- | ------------------ | ----- |
| 1.x     | :white_check_mark: | Current stable release |
| < 1.0   | :x:                | Development versions (not recommended for production) |

**Recommendation:** Always use the latest stable version from npm or the `main` branch on GitHub.

---

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in NetMCP, please report it responsibly.

### 🔒 **DO NOT** disclose vulnerabilities publicly

**Please do not:**
- Open a public GitHub issue
- Discuss the vulnerability in public forums or social media
- Share exploit code publicly before the issue is fixed

### ✉️ How to Report

**Email:** naga22694+clawd@gmail.com  
**Subject:** `[SECURITY] NetMCP Vulnerability Report`

**Include in your report:**
1. **Description:** Clear explanation of the vulnerability
2. **Affected component:** Which package(s) and tool(s) are affected
3. **Reproduction steps:** Detailed steps to reproduce the issue
4. **Impact assessment:** What can an attacker achieve?
5. **Suggested fix:** (optional) If you have a patch or mitigation strategy
6. **Disclosure timeline:** Your preferred timeline for public disclosure (we aim for 90 days)

**Example:**
```
Subject: [SECURITY] NetMCP Vulnerability Report

Package: @netmcp/nvd-network-cves
Tool: cve_search
Severity: HIGH

Description:
The cve_search tool does not properly sanitize user input before passing
it to the NVD API, allowing an attacker to inject additional query parameters.

Reproduction:
1. Call cve_search with input: "wifi&apiKey=ATTACKER_KEY"
2. Observe that the attacker's API key is included in the request

Impact:
- API key leakage
- Unauthorized access to NVD API quotas

Suggested Fix:
Add URL encoding to all query parameters before constructing the API request.
```

### 📅 Response Timeline

- **24 hours:** Initial acknowledgment of your report
- **7 days:** Initial assessment and severity classification
- **30 days:** Fix developed and tested (for HIGH/CRITICAL issues)
- **90 days:** Public disclosure (coordinated with reporter)

We will keep you informed throughout the process.

---

## Security Best Practices for Users

### 1. Input Validation
NetMCP includes input validation (max 1000 chars, format checks), but always validate user input in your application before passing it to NetMCP tools.

```javascript
// Good practice:
const userInput = sanitizeInput(req.body.query);
const result = await mcpClient.callTool('cve_search', { keyword: userInput });
```

### 2. Rate Limiting
NetMCP packages include rate limiting for external APIs, but you should still implement your own rate limiting at the application level to prevent abuse.

### 3. Error Handling
Never expose raw error messages to end users. NetMCP sanitizes errors, but always wrap tool calls in try/catch blocks:

```javascript
try {
  const result = await mcpClient.callTool('fcc_search', { query });
} catch (err) {
  console.error('Tool call failed:', err);
  // Return generic error to user
  return { error: 'Search failed. Please try again.' };
}
```

### 4. Dependencies
Keep NetMCP packages up to date:

```bash
npm update @netmcp/*
```

Check for security advisories:

```bash
npm audit
```

### 5. API Keys (if using Apify deployment)
- Never commit API keys to version control
- Use environment variables: `APIFY_API_TOKEN`, `APIFY_PROXY_PASSWORD`
- Rotate keys regularly
- Use separate keys for development/production

---

## Security Features

NetMCP includes several security features out-of-the-box:

### ✅ Input Validation
- **Max length:** All tools reject inputs > 1000 characters (DoS prevention)
- **Format checks:** CVE IDs, RFC numbers, MAC addresses, spec numbers validated
- **SQL injection protection:** FCC Devices package sanitizes SQL queries
- **Hex validation:** MAC addresses checked for valid hex characters

### ✅ Rate Limiting
- **Thread-safe:** All rate limiters use promise queues to prevent race conditions
- **Per-package limits:**
  - NVD: 5 req/30s (strict NVD API compliance)
  - RFC Search: 5 req/10s
  - FCC Devices: 10 req/10s
  - OUI Lookup: No rate limit (local database)
  - 3GPP Specs: No rate limit (curated + occasional FTP scraping)

### ✅ Timeouts
- **Network calls:** 10-15s timeouts on all HTTP requests (prevents hangs)
- **Graceful errors:** Timeout errors return user-friendly messages

### ✅ Caching
- **NVD CVEs:** 24-hour in-memory cache reduces API load and rate limit pressure
- **Cache isolation:** Separate caches for different query types (CVE lookup vs. search)

### ✅ Error Sanitization
- Raw API errors are not exposed to users
- Stack traces are logged server-side only
- User-facing errors are generic and helpful

---

## Known Limitations

### 1. In-Memory Cache
The NVD cache is in-memory only. If the server restarts, the cache is cleared. For production deployments with high traffic, consider adding a persistent cache layer (Redis, Memcached).

### 2. Single-Threaded Rate Limiting
Rate limiters are thread-safe for Node.js single-threaded event loop, but do not coordinate across multiple processes. For multi-process deployments (e.g., PM2 cluster mode), use a shared rate limiter (Redis-based).

### 3. No Authentication
NetMCP servers (when run as MCP or Apify actors) do not include authentication. If exposing via HTTP, add authentication middleware:

```javascript
// Example: API key middleware
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.EXPECTED_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### 4. FTP Scraping (3GPP Specs)
The 3GPP package scrapes FTP HTML pages. This is fragile and could break if the FTP server changes. The package falls back to curated data, but FTP scraping should be monitored.

---

## Security Audit History

| Date       | Auditor          | Scope                | Findings | Status |
|------------|------------------|----------------------|----------|--------|
| 2026-02-09 | Automated Review | All 5 packages       | 1 HIGH (SQL injection), 2 MEDIUM, 6 LOW | ✅ All fixed |
| 2026-03-20 | Internal Review  | Cycles 1-20 improvements | 0 HIGH, 0 MEDIUM, 0 LOW | ✅ Clean |

**Next audit:** Scheduled for Q2 2026 (external security review)

---

## Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

| Researcher | Date | Vulnerability | Severity |
|------------|------|---------------|----------|
| *(No reports yet)* | - | - | - |

**Want to be listed here?** Report a valid security issue following this policy!

---

## Contact

- **Security issues:** naga22694+clawd@gmail.com  
- **General support:** GitHub Issues (https://github.com/cheenu1092-oss/netmcp/issues)  
- **Discussions:** GitHub Discussions (https://github.com/cheenu1092-oss/netmcp/discussions)

---

## License

This security policy is part of the NetMCP project and is licensed under the MIT License.
