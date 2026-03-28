#!/bin/bash

# Daily Planner Delight - Production Dependencies Installation Script
# Run this script with: bash INSTALL_PACKAGES.sh

echo "📦 Installing production-ready dependencies..."
echo ""

# Phase 1: Firebase packages
echo "🔥 Installing Firebase packages..."
bun add @react-native-firebase/app \
  @react-native-firebase/auth \
  @react-native-firebase/firestore \
  @react-native-firebase/analytics \
  @react-native-firebase/crashlytics

# Phase 2: RevenueCat for subscriptions
echo "💳 Installing RevenueCat..."
bun add react-native-purchases

# Phase 3: Notifications
echo "🔔 Installing notifications..."
bun add expo-notifications

# Phase 4: Updates and linking
echo "🔗 Installing Expo updates and linking..."
bun add expo-updates

# Phase 5: Development and testing dependencies
echo "🧪 Installing dev dependencies..."
bun add -D jest \
  @testing-library/react-native \
  @testing-library/jest-native \
  @testing-library/react-hooks \
  @types/jest \
  prettier \
  husky \
  lint-staged \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-plugin-jsx-a11y \
  eslint-plugin-react-hooks

# Phase 6: Additional utilities
echo "🛠️  Installing additional utilities..."
bun add react-native-reanimated@latest

echo ""
echo "✅ All packages installed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Create a .env file based on .env.example"
echo "2. Set up Firebase project and download google-services.json"
echo "3. Configure RevenueCat in their dashboard"
echo "4. Run: npx expo prebuild (if needed)"
echo "5. Run: bun run start"
