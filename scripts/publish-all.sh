#!/bin/bash
# publish-all.sh - Publish all NetMCP packages to npm registry
# Usage: 
#   ./scripts/publish-all.sh --dry-run  # Test without publishing
#   ./scripts/publish-all.sh            # Publish for real

set -e  # Exit on error

DRY_RUN=""
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN="--dry-run"
  echo "🔍 DRY RUN MODE - No packages will be published"
  echo ""
fi

# Check npm authentication
if ! npm whoami &>/dev/null; then
  echo "❌ Not logged in to npm. Run: npm login"
  echo ""
  echo "Then run this script again:"
  echo "  ./scripts/publish-all.sh $DRY_RUN"
  exit 1
fi

echo "✅ Logged in to npm as: $(npm whoami)"
echo ""

# List of all packages to publish
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

PUBLISHED_COUNT=0
FAILED_COUNT=0
FAILED_PACKAGES=()

echo "📦 Publishing ${#PACKAGES[@]} packages..."
echo ""

for pkg in "${PACKAGES[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📦 $pkg"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  cd "packages/$pkg"
  
  # Show package info
  PKG_NAME=$(node -p "require('./package.json').name")
  PKG_VERSION=$(node -p "require('./package.json').version")
  echo "Package: $PKG_NAME@$PKG_VERSION"
  
  # Run npm pack to verify package contents
  echo ""
  echo "🔍 Verifying package contents..."
  if ! npm pack --dry-run; then
    echo "❌ npm pack failed for $pkg"
    FAILED_COUNT=$((FAILED_COUNT + 1))
    FAILED_PACKAGES+=("$pkg (pack failed)")
    cd ../..
    continue
  fi
  
  # Publish to npm
  echo ""
  if [[ -n "$DRY_RUN" ]]; then
    echo "🔍 Would publish: npm publish $DRY_RUN"
    if npm publish $DRY_RUN; then
      echo "✅ Dry run successful for $pkg"
      PUBLISHED_COUNT=$((PUBLISHED_COUNT + 1))
    else
      echo "❌ Dry run failed for $pkg"
      FAILED_COUNT=$((FAILED_COUNT + 1))
      FAILED_PACKAGES+=("$pkg (dry run failed)")
    fi
  else
    echo "🚀 Publishing to npm..."
    if npm publish; then
      echo "✅ Published $PKG_NAME@$PKG_VERSION"
      PUBLISHED_COUNT=$((PUBLISHED_COUNT + 1))
    else
      echo "❌ Publish failed for $pkg"
      FAILED_COUNT=$((FAILED_COUNT + 1))
      FAILED_PACKAGES+=("$pkg (publish failed)")
    fi
  fi
  
  cd ../..
  echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Successful: $PUBLISHED_COUNT/${#PACKAGES[@]}"
echo "❌ Failed: $FAILED_COUNT/${#PACKAGES[@]}"

if [[ $FAILED_COUNT -gt 0 ]]; then
  echo ""
  echo "Failed packages:"
  for failed in "${FAILED_PACKAGES[@]}"; do
    echo "  - $failed"
  done
  echo ""
  exit 1
fi

if [[ -z "$DRY_RUN" ]]; then
  echo ""
  echo "🎉 All packages published successfully!"
  echo ""
  echo "Next steps:"
  echo "  1. Update README badges with npm version shields"
  echo "  2. Create GitHub release (git tag v1.0.0 && git push --tags)"
  echo "  3. Update CHANGELOG.md with published date"
  echo "  4. Announce on social media / internal channels"
else
  echo ""
  echo "✅ Dry run complete. To publish for real, run:"
  echo "  ./scripts/publish-all.sh"
fi
