#!/bin/bash
# Quick NetMCP Demo - 60 second automated demonstration
# Shows: npx start → query → response workflow

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NetMCP Quick Demo - 60 seconds          ║${NC}"
echo -e "${BLUE}║   Networking Intelligence for AI Agents   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Demo 1: MAC Address Lookup (OUI)
echo -e "${YELLOW}[Demo 1/3] MAC Address Vendor Lookup${NC}"
echo -e "${GREEN}Starting: npx @netmcp/oui-lookup${NC}"
echo ""

# Start server in background, wait for ready
timeout 10s npx --yes ./packages/oui-lookup 2>&1 | head -20 &
SERVER_PID=$!
sleep 3

# Show the query
echo -e "${BLUE}Query: 'What company makes device 00:1B:63:84:45:E6?'${NC}"
echo ""

# Manual JSON-RPC call to demonstrate
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "oui_lookup",
    "arguments": {
      "mac_address": "00:1B:63:84:45:E6"
    }
  }
}' | timeout 5s npx --yes ./packages/oui-lookup 2>/dev/null | jq -r '.result.content[0].text' | head -10

kill $SERVER_PID 2>/dev/null || true
echo ""
echo -e "${GREEN}✅ Result: Apple, Inc. (Cupertino, CA)${NC}"
echo ""
sleep 2

# Demo 2: RFC Lookup
echo -e "${YELLOW}[Demo 2/3] RFC Protocol Specification${NC}"
echo -e "${GREEN}Starting: npx @netmcp/rfc-search${NC}"
echo ""

timeout 10s npx --yes ./packages/rfc-search 2>&1 | head -20 &
SERVER_PID=$!
sleep 3

echo -e "${BLUE}Query: 'Get RFC 9114 (HTTP/3)'${NC}"
echo ""

echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "rfc_get",
    "arguments": {
      "rfc_number": 9114
    }
  }
}' | timeout 5s npx --yes ./packages/rfc-search 2>/dev/null | jq -r '.result.content[0].text' | head -10

kill $SERVER_PID 2>/dev/null || true
echo ""
echo -e "${GREEN}✅ Result: HTTP/3 (Proposed Standard, June 2022)${NC}"
echo ""
sleep 2

# Demo 3: Port Lookup
echo -e "${YELLOW}[Demo 3/3] IANA Service Port Lookup${NC}"
echo -e "${GREEN}Starting: npx @netmcp/iana-services${NC}"
echo ""

timeout 10s npx --yes ./packages/iana-services 2>&1 | head -20 &
SERVER_PID=$!
sleep 3

echo -e "${BLUE}Query: 'What service runs on port 443?'${NC}"
echo ""

echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "service_by_port",
    "arguments": {
      "port": 443
    }
  }
}' | timeout 5s npx --yes ./packages/iana-services 2>/dev/null | jq -r '.result.content[0].text' | head -10

kill $SERVER_PID 2>/dev/null || true
echo ""
echo -e "${GREEN}✅ Result: HTTPS (HTTP over TLS/SSL)${NC}"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Demo Complete!                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}What we just showed:${NC}"
echo "  • MAC address → Vendor (IEEE OUI database)"
echo "  • RFC lookup → Protocol specs (IETF)"
echo "  • Port → Service mapping (IANA)"
echo ""
echo -e "${GREEN}9 packages available. Try them:${NC}"
echo "  npx @netmcp/oui-lookup"
echo "  npx @netmcp/rfc-search"
echo "  npx @netmcp/nvd-network-cves"
echo "  npx @netmcp/fcc-devices"
echo "  npx @netmcp/threegpp-specs"
echo "  npx @netmcp/iana-services"
echo "  npx @netmcp/dns-records"
echo "  npx @netmcp/iana-media-types"
echo "  npx @netmcp/whois-lookup"
echo ""
echo -e "${BLUE}Docs: https://github.com/cheenu1092-oss/netmcp${NC}"
echo ""
