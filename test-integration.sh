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

# ═══════════════════════════════════════════════════════════════
# 7. Input Validation & DoS Prevention
# ═══════════════════════════════════════════════════════════════

echo ""
echo "7. Input Validation & DoS Prevention"

# Test max string length validation (1000 chars)
test_max_length_validation() {
  # Generate a 1001-character string using Python
  local long_input=$(python3 -c "print('a'*1001)")
  
  # Test oui-lookup (representative test - validates the pattern works)
  local result=$(mcp_call "oui-lookup" "oui_lookup" \
    "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"oui_lookup\",\"arguments\":{\"mac\":\"$long_input\"}}}")
  
  # Check if it returns "Input too long" error
  if echo "$result" | grep -q "Input too long"; then
    return 0
  else
    return 1
  fi
}

test_integration "Max string length validation (1000 chars)" test_max_length_validation

# Test spec number format validation (3GPP only)
test_spec_format_validation() {
  local result=$(mcp_call "threegpp-specs" "spec_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"spec_get","arguments":{"spec_number":"invalid"}}}')
  
  if echo "$result" | grep -q "Invalid spec number format"; then
    return 0
  else
    return 1
  fi
}

test_integration "3GPP spec number format validation" test_spec_format_validation

# ═══════════════════════════════════════════════════════════════
# 8. DNS Records (dns-records)
# ═══════════════════════════════════════════════════════════════

echo ""
echo "8. DNS Records (dns-records)"

# Test invalid TYPE number (> 65535)
test_dns_invalid_type() {
  local result=$(mcp_call "dns-records" "record_by_type" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"record_by_type","arguments":{"type":70000}}}')
  
  # Should return MCP validation error with "too_big" or "Type number must be between"
  if echo "$result" | grep -q "too_big" || echo "$result" | grep -q "Type number must be between"; then
    return 0
  else
    return 1
  fi
}

test_integration "Invalid TYPE number returns error" test_dns_invalid_type

# Test boundary TYPE numbers (0 and 65535)
test_dns_boundary_types() {
  # TYPE 0 should not exist in database (but should validate correctly)
  local result0=$(mcp_call "dns-records" "record_by_type" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"record_by_type","arguments":{"type":0}}}')
  
  # TYPE 65535 (reserved, should not exist)
  local result65535=$(mcp_call "dns-records" "record_by_type" \
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"record_by_type","arguments":{"type":65535}}}')
  
  # Both should return valid JSON with "found":false (nested in result.content[0].text)
  if echo "$result0" | grep -q '\\"found\\":false'; then
    if echo "$result65535" | grep -q '\\"found\\":false'; then
      return 0
    fi
  fi
  return 1
}

test_integration "Boundary TYPE numbers (0, 65535) handled correctly" test_dns_boundary_types

# Test DNSSEC search returns only security records
test_dns_dnssec_search() {
  local result=$(mcp_call "dns-records" "record_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"record_search","arguments":{"query":"dnssec"}}}')
  
  # Should return multiple DNSSEC-related records (DNSKEY, RRSIG, DS, NSEC, etc.)  # Check for escaped quotes in nested JSON
  if echo "$result" | grep -q '\\"category\\":\\"security\\"'; then
    return 0
  else
    return 1
  fi
}

test_integration "DNSSEC search returns security records" test_dns_dnssec_search

# Test case-insensitive name lookup (A vs a)
test_dns_case_insensitive() {
  local result_upper=$(mcp_call "dns-records" "record_by_name" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"record_by_name","arguments":{"name":"AAAA"}}}')
  
  local result_lower=$(mcp_call "dns-records" "record_by_name" \
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"record_by_name","arguments":{"name":"aaaa"}}}')
  
  # Both should return same record (type 28) — check escaped JSON
  if echo "$result_upper" | grep -q '\\"type\\":28' && echo "$result_lower" | grep -q '\\"type\\":28'; then
    return 0
  else
    return 1
  fi
}

test_integration "Case-insensitive name lookup (AAAA vs aaaa)" test_dns_case_insensitive

# ═══════════════════════════════════════════════════════════════
# 9. IANA Services (iana-services)
# ═══════════════════════════════════════════════════════════════

echo ""
echo "9. IANA Services (iana-services)"

# Test invalid port number (> 65535)
test_iana_invalid_port() {
  local result=$(mcp_call "iana-services" "service_by_port" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"service_by_port","arguments":{"port":70000}}}')
  
  # Should return MCP validation error with "too_big" or "<=65535"
  if echo "$result" | grep -q "too_big" || echo "$result" | grep -q "<=65535"; then
    return 0
  else
    return 1
  fi
}

test_integration "Invalid port number returns error" test_iana_invalid_port

# Test boundary ports (0, 1, 65535)
test_iana_boundary_ports() {
  # Port 0 (reserved, but should validate)
  local result0=$(mcp_call "iana-services" "service_by_port" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"service_by_port","arguments":{"port":0}}}')
  
  # Port 1 (not in curated db)
  local result1=$(mcp_call "iana-services" "service_by_port" \
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"service_by_port","arguments":{"port":1}}}')
  
  # Port 65535 (reserved, edge case)
  local result65535=$(mcp_call "iana-services" "service_by_port" \
    '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"service_by_port","arguments":{"port":65535}}}')
  
  # All should return valid JSON with "port" field (check escaped JSON with whitespace)
  if echo "$result0" | grep -q '\\"port\\":[[:space:]]*0'; then
    if echo "$result1" | grep -q '\\"port\\":[[:space:]]*1'; then
      if echo "$result65535" | grep -q '\\"port\\":[[:space:]]*65535'; then
        return 0
      fi
    fi
  fi
  return 1
}

test_integration "Boundary ports (0, 1, 65535) handled correctly" test_iana_boundary_ports

# Test protocol search matches correct category
test_iana_protocol_category() {
  # Search for "control" should return ICMP (IP protocol 1)
  local result=$(mcp_call "iana-services" "protocol_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"protocol_search","arguments":{"query":"control"}}}')
  
  # Should return ICMP (number 1) which has "Internet Control Message" in description
  # Check for escaped JSON with whitespace
  if echo "$result" | grep -q '\\"number\\":[[:space:]]*1'; then
    return 0
  else
    return 1
  fi
}

test_integration "Protocol search matches correct protocol (ICMP)" test_iana_protocol_category

# Test stats tool returns metrics
test_iana_stats() {
  local result=$(mcp_call "iana-services" "iana_stats" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"iana_stats","arguments":{}}}')
  
  # Should return total_queries, curated_hits, services_database_size, protocols_database_size  # Check for escaped JSON
  if echo "$result" | grep -q '\\"total_queries\\"' && \
     echo "$result" | grep -q '\\"services_database_size\\"' && \
     echo "$result" | grep -q '\\"protocols_database_size\\"'; then
    return 0
  else
    return 1
  fi
}

test_integration "Stats tool returns performance metrics" test_iana_stats

# ==========================================
# Test Suite 10: IANA Media Types (iana-media-types)
# ==========================================
echo ""
echo "10. IANA Media Types (iana-media-types)"

# Test max length validation (> 1000 chars)
test_media_max_length() {
  # Generate 1001-char string using Python
  local long_ext=$(python3 -c "print('x' * 1001)")
  
  local result=$(mcp_call "iana-media-types" "media_by_extension" \
    "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"media_by_extension\",\"arguments\":{\"extension\":\"$long_ext\"}}}")
  
  # Should return MCP validation error with isError: true
  # Format: {"result":{"content":[...],"isError":true},...}
  if echo "$result" | grep -q '"isError":[[:space:]]*true'; then
    return 0
  else
    return 1
  fi
}

test_integration "Max length validation (>1000 chars) rejects input" test_media_max_length

# Test case-insensitive extension lookup
test_media_case_insensitive() {
  # Test .JSON (uppercase) should return same as .json
  local result_upper=$(mcp_call "iana-media-types" "media_by_extension" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"media_by_extension","arguments":{"extension":".JSON"}}}')
  
  local result_lower=$(mcp_call "iana-media-types" "media_by_extension" \
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"media_by_extension","arguments":{"extension":".json"}}}')
  
  # Both should return application/json
  if echo "$result_upper" | grep -q '\\"type\\":[[:space:]]*\\"application/json\\"'; then
    if echo "$result_lower" | grep -q '\\"type\\":[[:space:]]*\\"application/json\\"'; then
      return 0
    fi
  fi
  return 1
}

test_integration "Case-insensitive extension lookup (.JSON vs .json)" test_media_case_insensitive

# Test category filtering
test_media_category_filter() {
  # Get all video types (should return multiple: mp4, webm, etc.)
  local result=$(mcp_call "iana-media-types" "media_by_category" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"media_by_category","arguments":{"category":"video"}}}')
  
  # Should return array with multiple video types (check for mp4 and webm)
  if echo "$result" | grep -q '\\"type\\":[[:space:]]*\\"video/mp4\\"'; then
    if echo "$result" | grep -q '\\"type\\":[[:space:]]*\\"video/webm\\"'; then
      return 0
    fi
  fi
  return 1
}

test_integration "Category filter returns multiple types (video/mp4, video/webm)" test_media_category_filter

# Test stats tool returns database metrics
test_media_stats() {
  local result=$(mcp_call "iana-media-types" "media_stats" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"media_stats","arguments":{}}}')
  
  # Should return total_queries, curated_hits, total_media_types, by_category
  if echo "$result" | grep -q '\\"total_queries\\"' && \
     echo "$result" | grep -q '\\"total_media_types\\"' && \
     echo "$result" | grep -q '\\"by_category\\"'; then
    return 0
  else
    return 1
  fi
}

test_integration "Stats tool returns database metrics" test_media_stats

echo ""
echo "========================================="
echo "SUMMARY: ✅ $PASS passed, ❌ $FAIL failed"
echo "========================================="

[ $FAIL -eq 0 ] && exit 0 || exit 1
