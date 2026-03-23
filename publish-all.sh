#!/bin/bash
# publish-all.sh — Publish all 9 NetMCP packages to npm
# 
# Prerequisites:
#   - npm login (run once to authenticate)
#   - All tests passing
#   - Clean git state
# 
# Usage:
#   ./publish-all.sh

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Packages to publish (in dependency order)
PACKAGES=(
  "oui-lookup"
  "rfc-search"
  "nvd-network-cves"
  "fcc-devices"
  "threegpp-specs"
  "iana-services"
  "dns-records"
  "iana-media-types"
  "whois-lookup"
)

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       NetMCP npm Publisher — Publishing 9 Packages            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Pre-flight checks
echo -e "${YELLOW}⚡ Running pre-flight checks...${NC}"

# 1. Check if npm is logged in
if ! npm whoami >/dev/null 2>&1; then
  echo -e "${RED}❌ Not logged in to npm${NC}"
  echo ""
  echo "Please run: npm login"
  echo "Then try again."
  exit 1
fi

NPM_USER=$(npm whoami)
echo -e "${GREEN}✅ Logged in as: $NPM_USER${NC}"

# 2. Check git status
if [[ -n $(git status --porcelain) ]]; then
  echo -e "${YELLOW}⚠️  Warning: Uncommitted changes detected${NC}"
  echo ""
  git status --short
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
else
  echo -e "${GREEN}✅ Git working tree is clean${NC}"
fi

# 3. Run tests
echo ""
echo -e "${YELLOW}🧪 Running test suite...${NC}"
if bash test-all.sh >/dev/null 2>&1; then
  echo -e "${GREEN}✅ All tests passing (75/75)${NC}"
else
  echo -e "${RED}❌ Tests failed${NC}"
  echo ""
  echo "Please fix failing tests before publishing."
  echo "Run: bash test-all.sh"
  exit 1
fi

# 4. Lint check
echo -e "${YELLOW}🔍 Running ESLint...${NC}"
if npx eslint . >/dev/null 2>&1; then
  echo -e "${GREEN}✅ No lint errors${NC}"
else
  echo -e "${YELLOW}⚠️  ESLint warnings detected (continuing anyway)${NC}"
fi

# Start publishing
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Publishing Packages (Total: ${#PACKAGES[@]})${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

PUBLISHED=0
FAILED=0
FAILED_PACKAGES=()

for PKG in "${PACKAGES[@]}"; do
  echo -e "${YELLOW}📦 Publishing @netmcp/$PKG...${NC}"
  
  if cd "packages/$PKG" && npm publish --access public; then
    echo -e "${GREEN}✅ Published @netmcp/$PKG${NC}"
    ((PUBLISHED++))
  else
    echo -e "${RED}❌ Failed to publish @netmcp/$PKG${NC}"
    ((FAILED++))
    FAILED_PACKAGES+=("$PKG")
  fi
  
  cd ../..
  echo ""
done

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Publication Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Published:${NC} $PUBLISHED/${#PACKAGES[@]}"
echo -e "  ${RED}Failed:${NC}    $FAILED/${#PACKAGES[@]}"
echo ""

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed packages:${NC}"
  for PKG in "${FAILED_PACKAGES[@]}"; do
    echo "  - $PKG"
  done
  echo ""
  exit 1
fi

# Success!
echo -e "${GREEN}🎉 All 9 packages published successfully!${NC}"
echo ""
echo -e "${BLUE}Verify on npm:${NC}"
for PKG in "${PACKAGES[@]}"; do
  echo "  https://www.npmjs.com/package/@netmcp/$PKG"
done
echo ""

# Next steps
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Next Steps${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "1. Tag the release:"
echo "   git tag v1.0.0"
echo "   git push origin v1.0.0"
echo ""
echo "2. Create GitHub Release:"
echo "   https://github.com/cheenu1092-oss/netmcp/releases/new"
echo ""
echo "3. Update README with npm badges"
echo ""
echo "4. Submit to MCP Marketplaces (see MCP_MARKETPLACE.md):"
echo "   - Smithery.ai: https://smithery.ai/submit"
echo "   - Glama: https://glama.ai/mcp/servers"
echo "   - mcp.run: https://mcp.run/submit"
echo ""
echo "5. Announce on social media (Twitter/X, LinkedIn, Discord)"
echo ""

exit 0
