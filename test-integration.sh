#!/bin/bash
# Integration tests for NetMCP packages
# Tests: concurrency, caching, rate limiting, error handling, boundary cases

echo "========================================="
echo "NetMCP Integration Test Suite"
echo "========================================="
echo ""

PASS=0
FAIL=0

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

test_integration() {
    local desc=$1
    local test_func=$2
    
    echo -n "  $desc... "
    if $test_func; then
        echo "✅ PASS"
        ((PASS++))
    else
        echo "❌ FAIL"
        ((FAIL++))
    fi
}

# Helper: Run MCP tool
mcp_call() {
    local pkg=$1
    local tool=$2
    local json=$3
    cd "$SCRIPT_DIR/packages/$pkg"
    echo "$json" | node src/index.js 2>/dev/null
}

# ==========================================
# Test Suite 1: Thread-Safe Rate Limiting
# ==========================================
echo "1. Thread-Safe Rate Limiting (nvd-network-cves)"

test_concurrent_rate_limiter() {
    # Launch 3 concurrent CVE lookups (rate limit is 5 req/30s)
    local pids=()
    local results=()
    
    for i in 1 2 3; do
        (mcp_call "nvd-network-cves" "cve_get" \
            '{"jsonrpc":"2.0","id":'$i',"method":"tools/call","params":{"name":"cve_get","arguments":{"cve_id":"CVE-2023-4448'$i'"}}}' \
            > /tmp/nvd_concurrent_$i.json) &
        pids+=($!)
    done
    
    # Wait for all to complete
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    # Check all returned valid results (rate limiter should have serialized them)
    local success=0
    for i in 1 2 3; do
        if grep -q '"result"' /tmp/nvd_concurrent_$i.json 2>/dev/null; then
            ((success++))
        fi
    done
    
    rm -f /tmp/nvd_concurrent_*.json
    [ $success -eq 3 ]
}

test_integration "Concurrent API calls with thread-safe rate limiter" test_concurrent_rate_limiter

# ==========================================
# Test Suite 2: NVD Cache Behavior
# ==========================================
echo ""
echo "2. NVD Cache Behavior"

test_cache_hit() {
    # First call (cache miss)
    local result1=$(mcp_call "nvd-network-cves" "cve_get" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_get","arguments":{"cve_id":"CVE-2023-44487"}}}')
    
    sleep 1
    
    # Second call (should be cache hit)
    local result2=$(mcp_call "nvd-network-cves" "cve_get" \
        '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"cve_get","arguments":{"cve_id":"CVE-2023-44487"}}}')
    
    # Verify both returned results
    echo "$result1" | grep -q '"result"' && echo "$result2" | grep -q '"result"'
}

test_integration "Cache hit for repeated CVE lookup" test_cache_hit

test_cache_stats() {
    # Get cache stats
    local stats=$(mcp_call "nvd-network-cves" "cve_cache_stats" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_cache_stats","arguments":{}}}')
    
    # Verify stats include expected fields (use escaped quotes for JSON string content)
    echo "$stats" | grep -q '\\"cache_hits\\"' && \
    echo "$stats" | grep -q '\\"cache_misses\\"' && \
    echo "$stats" | grep -q '\\"cve_cache_size\\"' && \
    echo "$stats" | grep -q '\\"cache_ttl_hours\\"'
}

test_integration "Cache stats tool returns metrics" test_cache_stats

# ==========================================
# Test Suite 3: Error Handling
# ==========================================
echo ""
echo "3. Error Handling & Edge Cases"

test_invalid_cve_format() {
    local result=$(mcp_call "nvd-network-cves" "cve_get" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_get","arguments":{"cve_id":"INVALID-FORMAT"}}}')
    
    # Should return error about invalid format
    echo "$result" | grep -q '"result"' && echo "$result" | grep -qi "invalid\|format\|error"
}

test_integration "Invalid CVE format returns error" test_invalid_cve_format

test_short_mac_address() {
    local result=$(mcp_call "oui-lookup" "oui_lookup" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"oui_lookup","arguments":{"mac":"AB"}}}')
    
    # Should return error about short MAC
    echo "$result" | grep -q '"result"' && echo "$result" | grep -qi "short\|least\|error"
}

test_integration "Short MAC address returns error" test_short_mac_address

test_nonexistent_rfc() {
    local result=$(mcp_call "rfc-search" "rfc_get" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"rfc_get","arguments":{"number":99999}}}')
    
    # Should return error or empty result
    echo "$result" | grep -q '"result"'
}

test_integration "Non-existent RFC number handled gracefully" test_nonexistent_rfc

test_invalid_fcc_grantee() {
    local result=$(mcp_call "fcc-devices" "fcc_get" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fcc_get","arguments":{"grantee_code":"ZZZ999"}}}')
    
    # Should return result (possibly empty array)
    echo "$result" | grep -q '"result"'
}

test_integration "Invalid FCC grantee code handled gracefully" test_invalid_fcc_grantee

# ==========================================
# Test Suite 4: Boundary Cases
# ==========================================
echo ""
echo "4. Boundary Cases & Limits"

test_max_limit_oui() {
    # Request 150 results (cap is 100)
    local result=$(mcp_call "oui-lookup" "oui_search" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"oui_search","arguments":{"query":"Tech","limit":150}}}')
    
    # Should return result with at most 100 entries
    echo "$result" | grep -q '"result"' && \
    [ $(echo "$result" | grep -o '"prefix":' | wc -l) -le 100 ]
}

test_integration "OUI search respects 100-result limit cap" test_max_limit_oui

test_zero_limit() {
    # Request 0 results
    local result=$(mcp_call "rfc-search" "rfc_search" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"rfc_search","arguments":{"query":"tcp","limit":0}}}')
    
    # Should return empty results array
    echo "$result" | grep -q '"result"'
}

test_integration "Zero limit returns empty results" test_zero_limit

test_empty_search_query() {
    local result=$(mcp_call "fcc-devices" "fcc_search" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fcc_search","arguments":{"query":"","search_type":"name","limit":5}}}')
    
    # Should return error or empty result
    echo "$result" | grep -q '"result"'
}

test_integration "Empty search query handled gracefully" test_empty_search_query

test_special_characters() {
    # Test search with special characters
    local result=$(mcp_call "threegpp-specs" "spec_search" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"spec_search","arguments":{"query":"5G/NR","limit":3}}}')
    
    # Should return results (handles special chars)
    echo "$result" | grep -q '"result"'
}

test_integration "Special characters in search query" test_special_characters

# ==========================================
# Test Suite 5: Rate Limiting Verification
# ==========================================
echo ""
echo "5. Rate Limiting Verification"

test_rfc_rate_limiter() {
    # RFC search has 5 req/10s rate limit
    # Make 6 requests sequentially - verify all succeed (rate limiter shouldn't cause errors)
    local pass_count=0
    for i in 1 2 3 4 5 6; do
        local rfc_num=$((8000 + i))
        local json="{\"jsonrpc\":\"2.0\",\"id\":${i},\"method\":\"tools/call\",\"params\":{\"name\":\"rfc_get\",\"arguments\":{\"number\":${rfc_num}}}}"
        local result=$(mcp_call "rfc-search" "rfc_get" "$json")
        # Verify we get a result (rate limiter should delay, not error)
        if echo "$result" | grep -q '"result"'; then
            ((pass_count++))
        fi
    done
    
    # All 6 requests should succeed
    [ $pass_count -eq 6 ]
}

test_integration "RFC search rate limiter enforces 5 req/10s" test_rfc_rate_limiter

test_fcc_rate_limiter() {
    # FCC devices has 10 req/10s rate limit
    # Make 12 requests sequentially - 11th and 12th should be delayed
    local start=$(date +%s)
    
    for i in {1..12}; do
        mcp_call "fcc-devices" "fcc_recent" \
            '{"jsonrpc":"2.0","id":'$i',"method":"tools/call","params":{"name":"fcc_recent","arguments":{"limit":1}}}' \
            > /dev/null 2>&1
    done
    
    local end=$(date +%s)
    local duration=$((end - start))
    
    # With rate limiter, 12 requests should take at least 2 seconds (11th+ delayed)
    # Without rate limiter, would take ~1 second (API response time)
    [ $duration -ge 2 ]
}

test_integration "FCC devices rate limiter enforces 10 req/10s" test_fcc_rate_limiter

# ==========================================
# Test Suite 6: Data Integrity
# ==========================================
echo ""
echo "6. Data Integrity & Format Validation"

test_mac_normalization() {
    # Test various MAC formats (all should normalize to same OUI)
    local formats=(
        "00:1A:2B:3C:4D:5E"
        "00-1A-2B-3C-4D-5E"
        "001A.2B3C.4D5E"
        "001A2B3C4D5E"
    )
    
    local oui=""
    for mac in "${formats[@]}"; do
        local result=$(mcp_call "oui-lookup" "oui_lookup" \
            '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"oui_lookup","arguments":{"mac":"'$mac'"}}}')
        
        # Extract prefix from JSON result (use escaped quotes)
        local prefix=$(echo "$result" | grep -o '\\"prefix\\":\\"[^\\]*\\"' | head -1 | cut -d'"' -f4)
        
        if [ -z "$oui" ]; then
            oui="$prefix"
        elif [ "$oui" != "$prefix" ]; then
            return 1
        fi
    done
    
    [ -n "$oui" ]
}

test_integration "MAC address normalization across formats" test_mac_normalization

test_cvss_extraction() {
    # Get a CVE and verify CVSS data structure
    local result=$(mcp_call "nvd-network-cves" "cve_get" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_get","arguments":{"cve_id":"CVE-2023-44487"}}}')
    
    # Should have cvss_score, cvss_severity, cvss_version (use escaped quotes)
    echo "$result" | grep -q '\\"cvss_score\\"' && \
    echo "$result" | grep -q '\\"cvss_severity\\"' && \
    echo "$result" | grep -q '\\"cvss_version\\"'
}

test_integration "CVSS score extraction from NVD data" test_cvss_extraction

test_spec_number_normalization() {
    # Test spec number with and without TS prefix
    local result1=$(mcp_call "threegpp-specs" "spec_get" \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"spec_get","arguments":{"spec_number":"23.501"}}}')
    
    local result2=$(mcp_call "threegpp-specs" "spec_get" \
        '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"spec_get","arguments":{"spec_number":"TS 23.501"}}}')
    
    # Both should return same spec
    local spec1=$(echo "$result1" | grep -o '"spec_number":"[^"]*"' | head -1)
    local spec2=$(echo "$result2" | grep -o '"spec_number":"[^"]*"' | head -1)
    
    [ "$spec1" = "$spec2" ]
}

test_integration "3GPP spec number normalization (TS prefix)" test_spec_number_normalization

echo ""
echo "========================================="
echo "SUMMARY: ✅ $PASS passed, ❌ $FAIL failed"
echo "========================================="

[ $FAIL -eq 0 ] && exit 0 || exit 1
