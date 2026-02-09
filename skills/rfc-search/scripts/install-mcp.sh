#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$SCRIPT_DIR/../../../packages/rfc-search"
PKG_NAME="rfc-search"
SERVER_NAME="netmcp-rfc-search"

# Find Claude Code config
if [ -f ~/.claude.json ]; then
  CONFIG=~/.claude.json
elif [ -f ~/.claude/config.json ]; then
  CONFIG=~/.claude/config.json
else
  echo "❌ Claude Code config not found at ~/.claude.json or ~/.claude/config.json"
  exit 1
fi

# Check if already installed
if grep -q "\"$SERVER_NAME\"" "$CONFIG" 2>/dev/null; then
  echo "✅ $SERVER_NAME already installed in Claude Code config"
  exit 0
fi

# Add MCP server entry
echo "📦 Installing $SERVER_NAME MCP server to $CONFIG..."

# Create a temporary file with the new server entry
TEMP_CONFIG=$(mktemp)
python3 -c "
import json, sys
with open('$CONFIG', 'r') as f:
    config = json.load(f)

if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers']['$SERVER_NAME'] = {
    'command': 'node',
    'args': ['$PKG_DIR/src/index.js']
}

with open('$TEMP_CONFIG', 'w') as f:
    json.dump(config, f, indent=2)
"

# Replace config
mv "$TEMP_CONFIG" "$CONFIG"

echo "✅ $SERVER_NAME installed successfully!"
echo "   Restart Claude Code to load the new MCP server."
