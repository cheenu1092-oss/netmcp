#!/bin/bash
# Comprehensive test script for all NetMCP packages

echo "========================================="
echo "NetMCP Comprehensive Test Suite"
echo "========================================="
echo ""

PASS=0
FAIL=0

test_tool() {
    local pkg=$1
    local tool=$2
    local json=$3
    local desc=$4
    
    echo -n "  $tool ($desc)... "
    cd ~/clawd/projects/netmcp/packages/$pkg
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

echo "1. oui-lookup (3 tools)"
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
echo "2. rfc-search (3 tools)"
test_tool "rfc-search" "rfc_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"rfc_get","arguments":{"number":8446}}}' \
    "RFC 8446"

test_tool "rfc-search" "rfc_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"rfc_search","arguments":{"query":"bgp","limit":3,"rfc_only":true}}}' \
    "search BGP"

test_tool "rfc-search" "rfc_recent" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"rfc_recent","arguments":{"limit":3}}}' \
    "recent RFCs"

echo ""
echo "3. nvd-network-cves (3 tools)"
echo "   Note: NVD API has rate limits (5 req/30s)"

test_tool "nvd-network-cves" "cve_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_get","arguments":{"cve_id":"CVE-2023-44487"}}}' \
    "CVE-2023-44487"

sleep 6  # Rate limit spacing

test_tool "nvd-network-cves" "cve_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_get","arguments":{"cve_id":"not-a-cve"}}}' \
    "invalid CVE format"

sleep 6

test_tool "nvd-network-cves" "cve_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_search","arguments":{"keyword":"wifi","limit":3}}}' \
    "search wifi"

sleep 6

test_tool "nvd-network-cves" "cve_by_vendor" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_by_vendor","arguments":{"vendor":"cisco","limit":3}}}' \
    "Cisco CVEs"

echo ""
echo "4. fcc-devices (3 tools)"

test_tool "fcc-devices" "fcc_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fcc_search","arguments":{"query":"Apple","search_type":"name","limit":3}}}' \
    "search Apple"

test_tool "fcc-devices" "fcc_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fcc_get","arguments":{"grantee_code":"BCG"}}}' \
    "BCG grantee"

test_tool "fcc-devices" "fcc_recent" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fcc_recent","arguments":{"limit":3}}}' \
    "recent grantees"

echo ""
echo "5. threegpp-specs (3 tools)"

test_tool "threegpp-specs" "spec_get" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"spec_get","arguments":{"spec_number":"23.501"}}}' \
    "TS 23.501"

test_tool "threegpp-specs" "spec_search" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"spec_search","arguments":{"query":"5G","limit":3}}}' \
    "search 5G"

test_tool "threegpp-specs" "spec_releases" \
    '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"spec_releases","arguments":{"release":18}}}' \
    "Release 18"

echo ""
echo "========================================="
echo "SUMMARY: ✅ $PASS passed, ❌ $FAIL failed"
echo "========================================="

[ $FAIL -eq 0 ] && exit 0 || exit 1
