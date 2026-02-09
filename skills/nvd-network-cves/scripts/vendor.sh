#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$SCRIPT_DIR/../../../packages/nvd-network-cves"

# Ensure deps
[ -d "$PKG_DIR/node_modules" ] || (cd "$PKG_DIR" && npm install --silent)

# Build JSON-RPC request
VENDOR="${1:?Usage: vendor.sh <vendor> <product> [limit]}"
PRODUCT="${2:?Usage: vendor.sh <vendor> <product> [limit]}"
LIMIT="${3:-10}"
REQUEST='{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cve_by_vendor","arguments":{"vendor":"'"$VENDOR"'","product":"'"$PRODUCT"'","limit":'$LIMIT'}}}'

# Call MCP server and extract result
echo "$REQUEST" | node "$PKG_DIR/src/index.js" 2>/dev/null | python3 -c "
import sys, json
resp = json.loads(sys.stdin.read())
data = json.loads(resp['result']['content'][0]['text'])
print(json.dumps(data, indent=2))
"
