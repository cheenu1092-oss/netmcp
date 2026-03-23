# NetMCP Performance Guide

> Response times, throughput, and optimization strategies for production deployments.

## Quick Reference

| Package | Typical Response Time | Throughput (QPS) | Data Source |
|---------|----------------------|------------------|-------------|
| oui-lookup | 2-5ms | 200-500 | Local database (38K entries) |
| rfc-search | 300-800ms | 1-3 | IETF Datatracker API |
| nvd-network-cves (cold) | 1000-2000ms | 0.5-1 | NVD API (strict rate limits) |
| nvd-network-cves (cached) | 2-5ms | 200-500 | In-memory cache (24hr TTL) |
| fcc-devices | 200-600ms | 1-5 | FCC Socrata API |
| threegpp-specs (curated) | 5-20ms | 50-200 | Local database (50+ key specs) |
| threegpp-specs (FTP) | 1000-3000ms | 0.3-1 | 3GPP FTP scraping |
| iana-services | 1-3ms | 300-1000 | Local database (40+ services) |
| dns-records | 1-3ms | 300-1000 | Local database (48 record types) |
| iana-media-types | 1-3ms | 300-1000 | Local database (80+ MIME types) |
| whois-lookup | 500-2000ms | 0.5-2 | Distributed WHOIS servers |

## Performance Characteristics

### Local Database Packages (Instant Response)

**oui-lookup, iana-services, dns-records, iana-media-types**

- **Response time:** 1-5ms
- **Throughput:** 200-1000 queries/sec
- **Scalability:** No external dependencies, scales horizontally
- **Use cases:** High-frequency lookups, real-time dashboards, batch processing

**Why so fast?**
- All data loaded into memory at startup
- Zero network calls
- Simple hash table or array lookups
- No rate limiting needed

**Optimization tips:**
- Use Docker for consistent startup times
- Pre-load databases before accepting queries
- Consider read-only filesystem for security

---

### API-Calling Packages (Network-Dependent)

**rfc-search, fcc-devices, whois-lookup**

- **Response time:** 200-2000ms (varies by API health)
- **Throughput:** 0.5-5 queries/sec (rate limited)
- **Scalability:** Limited by external API rate limits
- **Use cases:** Interactive queries, research, one-off lookups

**Rate limits:**
- `rfc-search`: 5 requests/10 seconds (IETF Datatracker)
- `fcc-devices`: 10 requests/10 seconds (FCC Socrata)
- `whois-lookup`: 10-second timeout per query (no formal rate limit)

**Optimization tips:**
- Queue requests to avoid rate limit errors
- Use multiple API keys/tokens if available (not currently supported)
- Implement application-level caching for repeated queries
- Consider batch queries where APIs support it

---

### Hybrid: nvd-network-cves (Cache + API)

**Performance profile:**
- **First query (cold cache):** 1000-2000ms (NVD API call + rate limiting)
- **Subsequent queries (cache hit):** 2-5ms (400x faster!)
- **Cache TTL:** 24 hours
- **Rate limit:** 5 requests/30 seconds (NVD strict limits)

**Cache effectiveness:**
- Popular CVEs (Log4j, Heartbleed) → near-instant response after first lookup
- Security scan workflows → 50%+ cache hit rate (same CVEs queried repeatedly)
- Research/exploration → lower hit rate (diverse queries)

**Monitor cache performance:**
```bash
# Use the cve_cache_stats tool
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_cache_stats","arguments":{}}}' | \
  node packages/nvd-network-cves/src/index.js
```

**Output:**
```json
{
  "cache_hits": 234,
  "cache_misses": 67,
  "hit_rate_percent": 77.7,
  "cache_size": 67,
  "cache_ttl_hours": 24
}
```

**Optimization tips:**
- Pre-populate cache with common CVEs during startup
- Monitor hit rate and adjust TTL if needed (edit src/index.js)
- For very high traffic, consider Redis/memcached for shared cache across instances
- Use CVE-YYYY-NNNNN format (not keywords) for best cache performance

---

### Hybrid: threegpp-specs (Curated + FTP Scraping)

**Performance profile:**
- **Curated database (50+ key specs):** 5-20ms
- **FTP scraping (all specs):** 1000-3000ms
- **Cache:** None (data changes infrequently, not worth caching)

**Curated specs include:**
- 5G Core (23.501, 23.502, 23.503)
- NR Radio (38.211, 38.212, 38.300, 38.401)
- IMS/VoLTE (23.228, 24.229)
- Security (33.501)

**When FTP scraping triggers:**
- Unknown spec number not in curated list
- Fallback for comprehensive coverage (5000+ specs)
- Slower but complete

**Optimization tips:**
- Use `spec_search` first to find spec numbers (searches curated DB)
- Then use `spec_get` with known numbers (fast curated lookup)
- Avoid wildcards or broad searches (forces FTP scraping)
- Consider contributing popular specs to curated list (PR welcome!)

---

## Production Deployment Strategies

### Single Instance (Small Scale)

**Setup:**
```bash
# Run all 9 servers via Docker Compose
docker-compose up -d

# Or run individual servers
docker run -d --name oui-lookup netmcp:latest oui-lookup
docker run -d --name rfc-search netmcp:latest rfc-search
```

**Expected performance:**
- Local DB packages: 200-1000 QPS per instance
- API packages: 0.5-5 QPS per instance (rate limited)
- Total capacity: ~500-1000 QPS (dominated by local DB queries)

**Bottlenecks:**
- External API rate limits (NVD, IETF, FCC, WHOIS)
- Network latency to external services
- CPU/memory not a bottleneck (Node.js single-threaded is sufficient)

---

### Multi-Instance (High Availability)

**Setup:**
```bash
# Kubernetes deployment with replicas
kubectl apply -f kubernetes/oui-lookup-deployment.yaml

# Docker Swarm with replicas
docker stack deploy -c docker-compose.yml netmcp
docker service scale netmcp_oui-lookup=3
```

**Expected performance:**
- Local DB packages: Linear scaling (3 instances = 3x throughput)
- API packages: No scaling benefit (shared global rate limits)
- High availability: Zero downtime deploys, automatic failover

**Bottlenecks:**
- API packages still limited by external rate limits (5-10 req/sec globally)
- nvd-network-cves cache not shared across instances (consider Redis)

---

### Distributed (Enterprise Scale)

**Setup:**
```bash
# Load balancer + multiple NetMCP clusters
# Different clusters for different regions (reduce latency)

# US cluster
helm install netmcp-us ./helm/netmcp --set region=us-east-1

# EU cluster
helm install netmcp-eu ./helm/netmcp --set region=eu-west-1

# API gateway with intelligent routing
# - Route local DB queries to nearest cluster (low latency)
# - Route API queries to least-loaded cluster (maximize rate limit usage)
```

**Expected performance:**
- Local DB packages: 10K+ QPS (multiple clusters)
- API packages: Still 0.5-5 QPS per API (global rate limits)
- Latency: 10-50ms (geo-distributed clusters)

**Advanced optimizations:**
- **Shared cache layer (Redis):** nvd-network-cves cache shared across all instances
- **API key rotation:** Multiple NVD API keys (5 keys = 25 req/30s)
- **Query deduplication:** Collapse identical concurrent queries into single API call
- **Pre-warming:** Populate cache with top 1000 CVEs during startup
- **Smart routing:** Route to cached instance first, fallback to API if needed

---

## Benchmarking Your Deployment

### Quick Benchmark (Single Query)

```bash
#!/usr/bin/env bash
# Measure single query response time

start=$(date +%s%3N)

echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"oui_lookup","arguments":{"mac":"00:1A:2B:3C:4D:5E"}}}' | \
  node packages/oui-lookup/src/index.js > /dev/null

end=$(date +%s%3N)
elapsed=$((end - start))

echo "Response time: ${elapsed}ms"
```

### Load Test (Sustained Throughput)

```bash
#!/usr/bin/env bash
# Measure sustained throughput over 60 seconds

queries=0
start=$(date +%s)

while [ $(($(date +%s) - start)) -lt 60 ]; do
  echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"oui_lookup","arguments":{"mac":"00:1A:2B:3C:4D:5E"}}}' | \
    node packages/oui-lookup/src/index.js > /dev/null 2>&1 &
  
  queries=$((queries + 1))
  
  # Limit concurrent processes (avoid resource exhaustion)
  if [ $((queries % 10)) -eq 0 ]; then
    wait
  fi
done

wait

qps=$((queries / 60))
echo "Throughput: ${qps} queries/sec"
```

### Docker Performance Test

```bash
#!/usr/bin/env bash
# Benchmark Docker container

docker run -i netmcp:latest oui-lookup <<'EOF'
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"oui_lookup","arguments":{"mac":"00:1A:2B:3C:4D:5E"}}}
EOF
```

---

## Troubleshooting Performance Issues

### Slow Response Times (Local DB Packages)

**Symptoms:** oui-lookup, iana-services, dns-records taking >100ms

**Possible causes:**
- Database not loaded yet (check logs for "Loaded X entries")
- Disk I/O contention (slow filesystem, Docker volume performance)
- Resource constraints (CPU/memory limits too low)

**Solutions:**
```bash
# Check database load status
docker logs oui-lookup | grep "Loaded"

# Increase Docker resource limits
docker update --cpus 2 --memory 512m oui-lookup

# Pre-warm database before accepting traffic
node packages/oui-lookup/src/index.js <<< '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"oui_stats","arguments":{}}}'
```

---

### Rate Limit Errors (API Packages)

**Symptoms:** "Rate limit exceeded", "429 Too Many Requests"

**Possible causes:**
- Too many concurrent queries to same API
- Rate limiter misconfigured (shouldn't happen, but check src/index.js)
- Multiple instances hitting same API without coordination

**Solutions:**
```bash
# Check rate limiter stats
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"rfc_stats","arguments":{}}}' | \
  node packages/rfc-search/src/index.js

# Reduce query rate (application-level queueing)
# Queue queries client-side to match rate limits:
# - NVD: 5 req/30s = 1 req every 6 seconds
# - IETF: 5 req/10s = 1 req every 2 seconds
# - FCC: 10 req/10s = 1 req every 1 second
```

---

### Cache Not Working (nvd-network-cves)

**Symptoms:** Every CVE query takes 1000-2000ms (no cache hits)

**Possible causes:**
- Server restarted (cache is in-memory, not persistent)
- Queries using different arguments (cache key includes all params)
- Cache TTL expired (24 hours default)

**Check cache stats:**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_cache_stats","arguments":{}}}' | \
  node packages/nvd-network-cves/src/index.js
```

**Solutions:**
- Pre-populate cache with common CVEs on startup
- Use exact CVE ID format (CVE-YYYY-NNNNN) for best cache performance
- Consider persistent cache (Redis) for multi-instance deployments
- Increase TTL if CVE data changes infrequently (edit src/index.js)

---

## Appendix: Hardware Requirements

### Minimum (Development/Testing)

- **CPU:** 1 core (2 GHz)
- **Memory:** 256 MB
- **Disk:** 10 MB (OUI database is largest at 4.6 MB)
- **Network:** Any (external APIs require internet access)

### Recommended (Production Single Instance)

- **CPU:** 2 cores (2.4 GHz+)
- **Memory:** 512 MB
- **Disk:** 50 MB (logs + databases)
- **Network:** 10 Mbps+ (for API calls)

### Enterprise (Multi-Instance Cluster)

- **CPU:** 4-8 cores per node
- **Memory:** 1-2 GB per node
- **Disk:** 100 MB per node
- **Network:** 100 Mbps+ (low latency preferred)
- **Load balancer:** HAProxy, NGINX, or cloud LB

---

## Performance Roadmap

**Planned improvements:**

1. **Persistent cache layer (Redis)** — Share nvd-network-cves cache across instances
2. **Query batching** — Batch multiple queries into single API call (where APIs support it)
3. **Smart retry logic** — Exponential backoff for failed API calls
4. **Metrics endpoint** — Prometheus/OpenMetrics for monitoring (response times, cache hit rate, error rate)
5. **Request deduplication** — Collapse identical concurrent queries
6. **Pre-warming scripts** — Load cache with popular CVEs on startup
7. **API key rotation** — Support multiple NVD/IETF keys for higher rate limits

---

*Last updated: 2026-03-22*
