#!/bin/bash
# Comprehensive test script for all NetMCP packages

echo "========================================="
echo "NetMCP Comprehensive Test Suite"
echo "========================================="
echo ""

PASS=0
FAIL=0

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

test_tool() {
    local pkg=$1
    local tool=$2
    local json=$3
    local desc=$4
    
    echo -n "  $tool ($desc)... "
    cd "$SCRIPT_DIR/packages/$pkg"
    result=$(echo "$json" | node src/index.js 2>/dev/null)
    
    if echo "$result" | grep -q '"result"'; then
        echo "✅ PASS"
        ((PASS++))
    else
        echo "❌ FAIL"
        echo "    Output: $result"
        ((FAIL++))
    fi
}

echo "1. oui-lookup (4 tools)"
test_tool "oui-lookup" "oui_lookup" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"oui_lookup","arguments":{"mac":"00:1A:2B:3C:4D:5E"}}}' \
    "valid MAC"

test_tool "oui-lookup" "oui_lookup" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"oui_lookup","arguments":{"mac":"AB"}}}' \
    "short MAC - should return error message in result"

test_tool "oui-lookup" "oui_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"oui_search","arguments":{"query":"Apple","limit":3}}}' \
    "search Apple"

test_tool "oui-lookup" "oui_stats" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"oui_stats","arguments":{}}}' \
    "stats"

echo ""
echo "2. rfc-search (4 tools)"
test_tool "rfc-search" "rfc_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"rfc_get","arguments":{"number":8446}}}' \
    "RFC 8446"

test_tool "rfc-search" "rfc_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"rfc_search","arguments":{"query":"bgp","limit":3,"rfc_only":true}}}' \
    "search BGP"

test_tool "rfc-search" "rfc_recent" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"rfc_recent","arguments":{"limit":3}}}' \
    "recent RFCs"

test_tool "rfc-search" "rfc_stats" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"rfc_stats","arguments":{}}}' \
    "stats"

echo ""
echo "3. nvd-network-cves (6 tools)"
echo "   Note: NVD API has rate limits (5 req/30s), but caching reduces load"

test_tool "nvd-network-cves" "cve_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_get","arguments":{"cve_id":"CVE-2023-44487"}}}' \
    "CVE-2023-44487"

sleep 6  # Rate limit spacing

test_tool "nvd-network-cves" "cve_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_get","arguments":{"cve_id":"not-a-cve"}}}' \
    "invalid CVE format"

# Test cache hit (same CVE as before - should be instant)
test_tool "nvd-network-cves" "cve_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_get","arguments":{"cve_id":"CVE-2023-44487"}}}' \
    "CVE-2023-44487 (cached)"

sleep 6

test_tool "nvd-network-cves" "cve_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_search","arguments":{"keyword":"wifi","limit":3}}}' \
    "search wifi"

sleep 6

test_tool "nvd-network-cves" "cve_by_vendor" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_by_vendor","arguments":{"vendor":"cisco","limit":3}}}' \
    "Cisco CVEs"

# Test cache stats tool
test_tool "nvd-network-cves" "cve_cache_stats" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_cache_stats","arguments":{}}}' \
    "cache stats"

echo ""
echo "4. fcc-devices (4 tools)"

test_tool "fcc-devices" "fcc_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fcc_search","arguments":{"query":"Apple","search_type":"name","limit":3}}}' \
    "search Apple"

test_tool "fcc-devices" "fcc_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fcc_get","arguments":{"grantee_code":"BCG"}}}' \
    "BCG grantee"

test_tool "fcc-devices" "fcc_recent" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fcc_recent","arguments":{"limit":3}}}' \
    "recent grantees"

test_tool "fcc-devices" "fcc_stats" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fcc_stats","arguments":{}}}' \
    "stats"

echo ""
echo "5. threegpp-specs (4 tools)"

test_tool "threegpp-specs" "spec_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"spec_get","arguments":{"spec_number":"23.501"}}}' \
    "TS 23.501"

test_tool "threegpp-specs" "spec_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"spec_search","arguments":{"query":"5G","limit":3}}}' \
    "search 5G"

test_tool "threegpp-specs" "spec_releases" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"spec_releases","arguments":{"release":18}}}' \
    "Release 18"

test_tool "threegpp-specs" "spec_stats" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"spec_stats","arguments":{}}}' \
    "stats"

echo ""
echo "6. iana-services (5 tools)"

test_tool "iana-services" "service_by_port" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"service_by_port","arguments":{"port":443}}}' \
    "port 443"

test_tool "iana-services" "service_by_name" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"service_by_name","arguments":{"query":"http","limit":3}}}' \
    "search http"

test_tool "iana-services" "protocol_by_number" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"protocol_by_number","arguments":{"number":6}}}' \
    "protocol 6 (TCP)"

test_tool "iana-services" "protocol_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"protocol_search","arguments":{"query":"control","limit":3}}}' \
    "search control"

test_tool "iana-services" "iana_stats" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"iana_stats","arguments":{}}}' \
    "stats"

echo ""
echo "7. dns-records (4 tools)"

test_tool "dns-records" "record_by_type" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"record_by_type","arguments":{"type":1}}}' \
    "type 1 (A record)"

test_tool "dns-records" "record_by_name" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"record_by_name","arguments":{"name":"AAAA"}}}' \
    "name AAAA"

test_tool "dns-records" "record_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"record_search","arguments":{"query":"dnssec","limit":5}}}' \
    "search dnssec"

test_tool "dns-records" "dns_stats" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"dns_stats","arguments":{}}}' \
    "stats"

echo ""
echo "8. iana-media-types (5 tools)"

test_tool "iana-media-types" "media_by_extension" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"media_by_extension","arguments":{"extension":".json"}}}' \
    "extension .json"

test_tool "iana-media-types" "media_by_type" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"media_by_type","arguments":{"type":"image/webp"}}}' \
    "type image/webp"

test_tool "iana-media-types" "media_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"media_search","arguments":{"query":"video","limit":5}}}' \
    "search video"

test_tool "iana-media-types" "media_by_category" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"media_by_category","arguments":{"category":"audio"}}}' \
    "category audio"

test_tool "iana-media-types" "media_stats" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"media_stats","arguments":{}}}' \
    "stats"

echo ""
echo "9. whois-lookup (5 tools)"
test_tool "whois-lookup" "whois_lookup" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"whois_lookup","arguments":{"query":"example.com"}}}' \
    "universal lookup - domain"

test_tool "whois-lookup" "whois_domain" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"whois_domain","arguments":{"domain":"example.com"}}}' \
    "domain lookup"

test_tool "whois-lookup" "whois_ip" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"whois_ip","arguments":{"ip":"8.8.8.8"}}}' \
    "IP lookup"

test_tool "whois-lookup" "whois_asn" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"whois_asn","arguments":{"asn":"AS15169"}}}' \
    "ASN lookup"

test_tool "whois-lookup" "whois_stats" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"whois_stats","arguments":{}}}' \
    "stats"

echo ""
echo "========================================="
echo "SUMMARY: ✅ $PASS passed, ❌ $FAIL failed"
echo "========================================="

[ $FAIL -eq 0 ] && exit 0 || exit 1
