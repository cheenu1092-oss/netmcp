# API Rate Limits & Performance Guide

This document provides a centralized reference for rate limits, timeouts, caching, and performance characteristics across all NetMCP packages.

## Quick Reference Table

| Package | API Dependency | Rate Limit | Timeout | Caching | Response Time |
|---------|---------------|------------|---------|---------|---------------|
| `oui-lookup` | None (local database) | N/A | N/A | Permanent (4.6MB file) | <10ms |
| `rfc-search` | IETF Datatracker API | 5 req/10s | 10s | None | 200-500ms |
| `nvd-network-cves` | NIST NVD API | 5 req/30s | 15s | 24 hours | 500ms-2s (cache: <10ms) |
| `fcc-devices` | FCC Socrata API | 10 req/10s | 15s | None | 300-800ms |
| `threegpp-specs` | 3GPP FTP (fallback) | N/A | 10s | Curated database | 50-300ms (FTP: 1-3s) |
| `iana-services` | None (local database) | N/A | N/A | Permanent (CSV file) | <10ms |
| `dns-records` | None (local database) | N/A | N/A | Permanent (CSV file) | <10ms |
| `iana-media-types` | None (local database) | N/A | N/A | Permanent (CSV file) | <10ms |
| `whois-lookup` | WHOIS protocol servers | None (system whois) | 10s | None | 500ms-5s |

---

## Package-by-Package Details

### oui-lookup — IEEE OUI Database

**Data source:** Local IEEE OUI database (4.6MB JSON file)  
**API dependency:** None  
**Rate limiting:** Not applicable (local-only)  
**Timeout:** Not applicable  
**Caching:** Permanent (38,869 OUI entries loaded at startup)  
**Response time:** <10ms (in-memory lookup)

**Performance characteristics:**
- Instant responses (no network calls)
- Zero external dependencies
- Database updated via `npm run update-db` (downloads latest from IEEE)
- Suitable for high-volume/real-time applications

**Tools:**
- `oui_lookup` — MAC address → vendor lookup
- `oui_search` — Search vendors by keyword
- `oui_count` — Count OUIs per vendor
- `oui_stats` — Database statistics

**Best practices:**
- Run `npm run update-db` monthly to refresh IEEE assignments
- No rate limiting concerns for local queries

---

### rfc-search — IETF Datatracker

**Data source:** IETF Datatracker API (https://datatracker.ietf.org/api/)  
**API dependency:** External HTTP API  
**Rate limiting:** **5 requests per 10 seconds** (conservative)  
**Timeout:** 10 seconds  
**Caching:** None (live API queries)  
**Response time:** 200-500ms (network-dependent)

**Performance characteristics:**
- Thread-safe rate limiter (promise queue prevents concurrent violation)
- Rate limiter activations tracked via `rfc_stats` tool
- IETF API has no published rate limits; we use conservative 5/10s
- Timeout prevents indefinite hangs on slow network

**Tools:**
- `rfc_get` — Get specific RFC by number
- `rfc_search` — Search RFCs by keyword
- `rfc_recent` — Recent RFCs by area (optional)
- `rfc_stats` — Performance metrics (queries, rate limiter activations)

**Best practices:**
- Batch queries when possible (combine keywords in single search)
- Use `rfc_stats` to monitor rate limiter activations
- For high-volume use cases, consider caching RFC metadata locally

**What triggers rate limiting:**
- Concurrent queries from same process
- Multiple agents sharing same NetMCP server
- Rapid sequential queries (<2s apart)

**Rate limiter behavior:**
- Waits if 5 requests made in last 10 seconds
- Queue depth visible via `rfc_stats`
- Transparent to caller (blocking wait, then proceeds)

---

### nvd-network-cves — NIST NVD

**Data source:** NIST NVD API (https://services.nvd.nist.gov/rest/json/)  
**API dependency:** External HTTP API  
**Rate limiting:** **5 requests per 30 seconds** (strict NVD limit)  
**Timeout:** 15 seconds  
**Caching:** **24 hours** (in-memory)  
**Response time:** 500ms-2s (first query), <10ms (cache hits)

**Performance characteristics:**
- Thread-safe rate limiter (promise queue prevents concurrent violation)
- 24-hour in-memory cache (CVE data rarely changes after publication)
- Cache hit rate typically 40-60% in security workflows
- Separate caches for CVE lookups and keyword searches
- Cache statistics visible via `cve_cache_stats` tool

**Tools:**
- `cve_get` — Get specific CVE by ID
- `cve_search` — Search CVEs by keyword
- `cve_by_vendor` — CVEs by vendor/product
- `cve_recent` — Recent CVEs (30 days)
- `cve_severity` — CVEs by CVSS severity
- `cve_cache_stats` — Cache performance metrics

**Best practices:**
- Query same CVE multiple times? Cache hit = instant response
- Use `cve_cache_stats` to monitor cache efficiency
- NVD rate limit is **strict** (enforced server-side) — violating causes 403 blocks
- For high-volume scanning, consider NVD API key (higher limits) — **not currently supported**

**What triggers rate limiting:**
- Concurrent queries from same process
- Cache misses (unique CVEs) trigger API calls
- Multiple agents sharing same NetMCP server

**Cache behavior:**
- Cache key: CVE ID, keyword query, or vendor+product
- TTL: 24 hours from first query
- Eviction: Automatic after TTL expiry
- Cache hit returns `"cached": true` in response

**NVD API limits (without API key):**
| Scenario | Limit | Enforcement |
|----------|-------|-------------|
| Public requests | 5 per 30s | Server-side (403 on violation) |
| With API key | 50 per 30s | Not currently supported |

---

### fcc-devices — FCC Equipment Authorization

**Data source:** FCC Socrata API (https://opendata.fcc.gov/)  
**API dependency:** External HTTP API  
**Rate limiting:** **10 requests per 10 seconds** (conservative)  
**Timeout:** 15 seconds  
**Caching:** None (live API queries)  
**Response time:** 300-800ms (network-dependent)

**Performance characteristics:**
- Thread-safe rate limiter (promise queue prevents concurrent violation)
- FCC Socrata API has 1000 req/day public limit (we're well under with 10/10s)
- Rate limiter activations tracked via `fcc_stats` tool
- Timeout prevents indefinite hangs on slow network

**Tools:**
- `fcc_search` — Search by company name/grantee
- `fcc_recent` — Recent FCC approvals
- `fcc_country` — Equipment by country of origin
- `fcc_stats` — Performance metrics (queries, rate limiter activations)

**Best practices:**
- FCC database has 20K+ grantees — search is fuzzy-matched
- Use `fcc_stats` to monitor rate limiter activations
- For high-volume use cases, consider FCC API key (higher limits) — **not currently supported**

**What triggers rate limiting:**
- Concurrent queries from same process
- Rapid sequential queries (<1s apart)
- Multiple agents sharing same NetMCP server

**FCC API limits:**
| Scenario | Limit | Enforcement |
|----------|-------|-------------|
| Public requests | 1000/day | Server-side (documented but rarely enforced) |
| Our conservative limit | 10 per 10s | Client-side (prevents hitting daily cap) |

---

### threegpp-specs — 3GPP Standards

**Data source:** Curated database + 3GPP FTP (fallback)  
**API dependency:** 3GPP FTP server (ftp.3gpp.org) for unlisted specs  
**Rate limiting:** Not applicable (FTP is different protocol)  
**Timeout:** 10 seconds  
**Caching:** Curated database (50+ key specs), no cache for FTP  
**Response time:** 50-300ms (curated), 1-3s (FTP fallback)

**Performance characteristics:**
- **Curated hits:** Instant (in-memory, 50+ specifications)
- **FTP fallback:** 1-3s (network-dependent, spec series listing)
- Curated hit rate: 60-80% (most common specs covered)
- FTP scraping fragile (depends on 3GPP server availability)
- Stats tool shows curated vs FTP performance

**Tools:**
- `spec_get` — Get specification by number
- `spec_search` — Search specifications by keyword
- `spec_releases` — Filter by 3GPP release
- `spec_stats` — Performance metrics (curated hits, FTP calls)

**Best practices:**
- Use `spec_stats` to monitor curated vs FTP usage
- For high-volume use cases, consider forking and expanding curated database
- FTP may timeout during 3GPP server maintenance

**What triggers FTP calls:**
- Querying unlisted specifications (not in curated database)
- Search queries with no curated matches
- Release filtering (requires spec series listing)

**Performance breakdown:**
| Query type | Curated | FTP Fallback | Response Time |
|-----------|---------|--------------|---------------|
| Popular specs (LTE, 5G NR, IMS) | ✅ Yes | N/A | 50-150ms |
| Older specs (2G, 3G) | ⚠️ Partial | Sometimes | 200-1500ms |
| New specs (Release 18+) | ❌ No | Always | 1-3s |

---

### iana-services — IANA Service Name/Port Registry

**Data source:** Local IANA CSV database  
**API dependency:** None  
**Rate limiting:** Not applicable (local-only)  
**Timeout:** Not applicable  
**Caching:** Permanent (CSV file loaded at startup)  
**Response time:** <10ms (in-memory lookup)

**Performance characteristics:**
- Instant responses (no network calls)
- Zero external dependencies
- Database includes 40+ services (HTTP, HTTPS, SSH, DNS, SMTP, etc.)
- Suitable for high-volume/real-time applications

**Tools:**
- `services_get` — Get service by name or port
- `services_search` — Search services by keyword/protocol
- `services_list` — List services by protocol (TCP/UDP)
- `services_range` — Services in port range
- `services_stats` — Database statistics

**Best practices:**
- No rate limiting concerns for local queries
- Database is static (updated manually from IANA)

---

### dns-records — IANA DNS Resource Record Types

**Data source:** Local IANA CSV database  
**API dependency:** None  
**Rate limiting:** Not applicable (local-only)  
**Timeout:** Not applicable  
**Caching:** Permanent (CSV file loaded at startup)  
**Response time:** <10ms (in-memory lookup)

**Performance characteristics:**
- Instant responses (no network calls)
- Zero external dependencies
- Database includes 48 DNS record types (A, AAAA, MX, CNAME, TXT, etc.)
- Suitable for high-volume/real-time applications

**Tools:**
- `dns_get` — Get DNS record type by name or value
- `dns_search` — Search by keyword/purpose
- `dns_list` — List by status (active/deprecated/experimental)
- `dns_stats` — Database statistics

**Best practices:**
- No rate limiting concerns for local queries
- Database is static (updated manually from IANA)

---

### iana-media-types — IANA Media Type Registry

**Data source:** Local IANA CSV database  
**API dependency:** None  
**Rate limiting:** Not applicable (local-only)  
**Timeout:** Not applicable  
**Caching:** Permanent (CSV file loaded at startup)  
**Response time:** <10ms (in-memory lookup)

**Performance characteristics:**
- Instant responses (no network calls)
- Zero external dependencies
- Database includes 80+ media types (text/html, application/json, image/png, etc.)
- Suitable for high-volume/real-time applications

**Tools:**
- `media_get` — Get media type by name/subtype
- `media_search` — Search by keyword
- `media_list` — List by top-level type (text, application, image, etc.)
- `media_suffix` — Media types by suffix (+json, +xml, etc.)
- `media_stats` — Database statistics

**Best practices:**
- No rate limiting concerns for local queries
- Database is static (updated manually from IANA)

---

### whois-lookup — WHOIS Protocol

**Data source:** WHOIS protocol (system `whois` command)  
**API dependency:** WHOIS servers (varies by TLD/RIR)  
**Rate limiting:** None (enforced by WHOIS servers themselves)  
**Timeout:** 10 seconds  
**Caching:** None (live protocol queries)  
**Response time:** 500ms-5s (server-dependent)

**Performance characteristics:**
- Uses system `whois` command (requires `whois` package installed)
- Response time varies wildly by WHOIS server (some fast, some slow)
- Type auto-detection (domain, IPv4, IPv6, ASN)
- Timeout prevents indefinite hangs on slow/unresponsive servers

**Tools:**
- `whois_lookup` — Universal lookup (auto-detects type)
- `whois_domain` — Domain name registration info
- `whois_ip` — IP address allocation (RIR lookup)
- `whois_asn` — Autonomous System Number info
- `whois_stats` — Performance metrics (query counts by type)

**Best practices:**
- WHOIS servers enforce their own rate limits (not visible to us)
- Some servers block after 10-100 queries per day per IP
- For high-volume lookups, consider WHOIS API services (not supported)
- Timeout catches unresponsive servers (returns timeout error)

**What triggers slow responses:**
- Geographic distance to authoritative WHOIS server
- WHOIS server load/capacity
- Network congestion
- Server maintenance windows

**Performance breakdown:**
| Query type | Typical server | Response Time |
|-----------|---------------|---------------|
| Popular domains (.com, .net) | Verisign | 500-1500ms |
| Country TLDs (.uk, .de) | Registry-specific | 1-3s |
| IP addresses | ARIN/RIPE/APNIC | 500-2000ms |
| ASN lookups | RIR servers | 1-3s |

---

## High-Volume Usage Patterns

### Scenario 1: Real-time MAC address lookups (oui-lookup)

**Best package:** `oui-lookup`  
**Why:** Local database, <10ms response, no rate limits  
**Considerations:** Run `npm run update-db` monthly for latest IEEE data  
**Estimated capacity:** 10,000+ queries/second (memory-bound)

---

### Scenario 2: Security scanning (nvd-network-cves)

**Best package:** `nvd-network-cves`  
**Why:** 24-hour cache, rate-limited for NVD compliance  
**Considerations:**
- First scan: 5 CVEs per 30 seconds (rate limit applies)
- Repeat scans: Instant (cache hits)
- Cache hit rate: 40-60% typical
- For >500 CVEs, expect 10-20 minutes (first scan)

**Optimization strategies:**
- Query broad searches first (`cve_search` for vendor)
- Then drill down to specific CVEs (`cve_get`)
- Cache warms up over time (repeated scans faster)
- Use `cve_cache_stats` to monitor hit rate

---

### Scenario 3: Standards research (rfc-search, threegpp-specs)

**Best package:** `rfc-search` (for RFCs), `threegpp-specs` (for 3GPP)  
**Why:** Broad coverage, timeout protection  
**Considerations:**
- `rfc-search`: 5 queries per 10 seconds (30/minute)
- `threegpp-specs`: Curated hits = instant, FTP fallback = slower
- For deep research, pace queries or cache results locally

---

### Scenario 4: Network troubleshooting (iana-services, dns-records, whois-lookup)

**Best package:** `iana-services` + `dns-records` (instant), `whois-lookup` (as-needed)  
**Why:** Port/protocol lookups are instant (local), WHOIS for deeper investigation  
**Considerations:**
- Port/DNS lookups: No rate limits (local databases)
- WHOIS: Use sparingly (server-enforced rate limits)
- Expect 500ms-5s for WHOIS responses

---

## Monitoring & Observability

All packages include `*_stats` tools for performance monitoring:

| Package | Stats Tool | Key Metrics |
|---------|-----------|-------------|
| `oui-lookup` | `oui_stats` | Database size, vendor count |
| `rfc-search` | `rfc_stats` | Total queries, rate limiter activations |
| `nvd-network-cves` | `cve_cache_stats` | Cache hits/misses, hit rate, cache size |
| `fcc-devices` | `fcc_stats` | Total queries, rate limiter activations |
| `threegpp-specs` | `spec_stats` | Curated hits, FTP calls, hit rate |
| `iana-services` | `services_stats` | Database size, protocol breakdown |
| `dns-records` | `dns_stats` | Database size, record status breakdown |
| `iana-media-types` | `media_stats` | Database size, type breakdown |
| `whois-lookup` | `whois_stats` | Query counts by type, success rate |

**How to use stats tools:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "cve_cache_stats"
  }
}
```

**Example response:**
```json
{
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"cache_hits\":42,\"cache_misses\":13,\"hit_rate_percent\":76.36,\"cache_size\":55,\"cache_ttl_hours\":24}"
    }]
  }
}
```

---

## Troubleshooting Rate Limit Issues

### Symptom: "Rate limit exceeded" errors

**Likely cause:** Concurrent queries violating API limits

**Solutions:**
1. Check stats tool (e.g., `rfc_stats`, `fcc_stats`) for rate limiter activations
2. Reduce query frequency (pace queries)
3. For NVD: Use cache-friendly queries (repeated CVEs = instant)
4. Consider running multiple NetMCP instances (each has independent rate limiter)

---

### Symptom: Timeouts on external API packages

**Likely cause:** Network congestion, API server overload, or timeout too short

**Solutions:**
1. Check network connectivity (`ping datatracker.ietf.org`, `curl https://services.nvd.nist.gov`)
2. Retry query (transient network issues common)
3. For persistent timeouts, API server may be down
4. WHOIS timeouts: Try alternative WHOIS server (some TLDs have mirrors)

---

### Symptom: Slow responses from threegpp-specs

**Likely cause:** FTP fallback (curated database miss)

**Solutions:**
1. Check `spec_stats` — high FTP calls = poor curated coverage
2. Use more specific queries (e.g., "38.300" instead of "NR PHY")
3. Contribute commonly-queried specs to curated database (see CONTRIBUTING.md)

---

## Best Practices Summary

### DO:
- ✅ Use local database packages (`oui-lookup`, `iana-*`, `dns-records`) for high-volume queries
- ✅ Monitor stats tools to track performance and rate limiter usage
- ✅ Leverage caching where available (`nvd-network-cves` 24hr cache)
- ✅ Pace queries to external APIs (respect rate limits)
- ✅ Handle timeouts gracefully (retry transient failures)

### DON'T:
- ❌ Bypass rate limiters (concurrent queries are serialized automatically)
- ❌ Assume instant responses for external APIs (network latency varies)
- ❌ Query NVD in tight loops (5 per 30s limit is strict)
- ❌ Ignore timeout errors (investigate network/server issues)
- ❌ Rely solely on WHOIS for bulk lookups (server-enforced rate limits)

---

## Performance Benchmarks (Estimated)

Based on typical network conditions and API behavior:

| Package | Cold start (1st query) | Warm cache/local | Queries/minute (sustained) |
|---------|----------------------|------------------|---------------------------|
| `oui-lookup` | <10ms | <10ms | Unlimited (memory-bound) |
| `rfc-search` | 200-500ms | N/A | 30 (rate limit: 5/10s) |
| `nvd-network-cves` | 500ms-2s | <10ms (cache) | 10 (rate limit: 5/30s) |
| `fcc-devices` | 300-800ms | N/A | 60 (rate limit: 10/10s) |
| `threegpp-specs` | 50-300ms (curated) | 50-300ms | Unlimited (curated) |
| `iana-services` | <10ms | <10ms | Unlimited (memory-bound) |
| `dns-records` | <10ms | <10ms | Unlimited (memory-bound) |
| `iana-media-types` | <10ms | <10ms | Unlimited (memory-bound) |
| `whois-lookup` | 500ms-5s | N/A | ~60 (WHOIS server limits) |

**Note:** Benchmarks are estimates based on typical conditions. Actual performance varies by network latency, API server load, and hardware.

---

## Future Improvements

Potential enhancements to rate limiting and performance:

1. **Persistent cache for NVD** — SQLite/Redis instead of in-memory (survives restarts)
2. **Distributed rate limiting** — Coordinate limits across multiple NetMCP instances
3. **API key support** — NVD and FCC offer higher limits with API keys
4. **Request prioritization** — Critical queries bypass rate limiter queue
5. **Adaptive rate limiting** — Adjust limits based on API 429 responses
6. **Circuit breakers** — Fail fast when API server is down (avoid timeout delays)
7. **Metrics export** — Prometheus/OpenTelemetry for production observability

See [CONTRIBUTING.md](CONTRIBUTING.md) if you'd like to help implement any of these.

---

## Related Documentation

- [Getting Started Guide](GETTING_STARTED.md) — 5-minute onboarding
- [README.md](README.md) — Project overview
- [CONTRIBUTING.md](CONTRIBUTING.md) — Development workflow
- [Package READMEs](./packages/) — Per-package documentation
