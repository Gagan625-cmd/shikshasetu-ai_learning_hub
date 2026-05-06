#!/bin/bash
# ShikshaSetu Production Build Script
# Usage: bash BUILD_COMMANDS.sh

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════"
echo "    🚀 ShikshaSetu Production APK Build"
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 1: Check prerequisites
echo "✓ Step 1: Checking prerequisites..."
node_version=$(node --version)
echo "  Node.js version: $node_version"

if ! command -v eas &> /dev/null; then
    echo "  ❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Step 2: Install dependencies
echo ""
echo "✓ Step 2: Installing dependencies..."
npm install 2>&1 | tail -5

# Step 3: Run linter
echo ""
echo "✓ Step 3: Linting code..."
npx expo lint 2>&1 | tail -3

# Step 4: Build APK
echo ""
echo "✓ Step 4: Building production APK..."
echo "  ⏱️  This will take 10-15 minutes"
echo "  📧 Check your email for completion notification"
echo ""

npx eas build -p android --profile production --type apk

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ APK Build Started!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📱 Next steps:"
echo "   1. Download APK from the link provided above"
echo "   2. Transfer to Android phone"
echo "   3. Install: adb install shikshasetu.apk"
echo "   4. Or tap APK file on phone to install"
echo ""
echo "🔗 Check build status: https://expo.dev/builds"
echo ""
