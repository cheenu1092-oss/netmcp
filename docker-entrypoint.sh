#!/bin/sh
# NetMCP Docker entrypoint — run specified MCP server package
set -e

PACKAGE="${1:-$NETMCP_PACKAGE}"

# Validate package exists
if [ ! -d "/app/packages/$PACKAGE" ]; then
  echo "❌ Error: Package '$PACKAGE' not found"
  echo ""
  echo "Available packages:"
  ls -1 /app/packages/
  exit 1
fi

# Run the MCP server (stdio mode)
echo "🚀 Starting NetMCP server: $PACKAGE"
exec node "/app/packages/$PACKAGE/src/index.js"
