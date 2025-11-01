# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Daily Planner Delight** is a cross-platform (iOS, Android, Web) daily planning application built with React Native and Expo Router. The app features task management, time-based scheduling with a visual time wheel, subscription management via RevenueCat, and cloud sync via Firebase.

## Development Commands

### Start Development Server

```bash
# Start with Rork CLI (recommended for production workflow)
bun run start                    # Mobile with tunnel
bun run start-web                # Web preview with tunnel
bun run start-web-dev            # Web with debug output

# Alternative: Start with Expo CLI directly
bunx expo start                  # Interactive menu (press 'i' for iOS, 'a' for Android)
bunx expo start --ios            # Direct iOS launch
bunx expo start --android        # Direct Android launch
bunx expo start --web            # Web only
bunx expo start --tunnel         # Enable tunnel mode (for remote testing)
bunx expo start --clear          # Clear cache if needed
```

### Package Management

```bash
bun install                      # Install dependencies
bunx expo install --fix          # Fix dependency mismatches
```

### Linting

```bash
bun run lint                     # Run ESLint
```

### Troubleshooting

```bash
# Clear cache and restart
bunx expo start --clear

# Clean install
rm -rf node_modules .expo
bun install

# Kill stuck processes
killall node
pkill -f expo
```

## Architecture

### State Management Strategy

The app uses a **hybrid state management approach**:

1. **React Context** (`TaskContext`, `SubscriptionContext`) - Primary app-level state
2. **React Query + tRPC** - Server state management (currently configured but backend not fully implemented)
3. **AsyncStorage** - Local persistence and offline fallback
4. **Firestore Real-time Listeners** - Cloud sync when authenticated

### Data Flow Architecture

#### Task Management Flow

```
User Action → TaskContext
    ↓
Check: useFirestore?
    ↓
YES: Write to Firestore → Real-time listener updates state → Cache to AsyncStorage
NO:  Update local state → Save to AsyncStorage
```

**Key files:**
- `contexts/TaskContext.tsx` - Task CRUD operations, date selection, onboarding state
- `lib/firestore-sync.ts` - Firestore integration (tasks collection, real-time subscriptions)
- `lib/notifications.ts` - Local notification scheduling for tasks

#### Subscription Management Flow

```
App Init → RevenueCat SDK Init → Fetch Customer Info → Update SubscriptionContext
    ↓
Real-time CustomerInfo Listener → Auto-update subscription state
    ↓
Purchase/Restore → RevenueCat API → Update state → Cache to AsyncStorage
```

**Key files:**
- `contexts/SubscriptionContext.tsx` - Subscription state, feature gates, purchase flow
- `lib/revenuecat.ts` - RevenueCat integration (offerings, purchases, entitlements)

### Authentication & User Management

- **Authentication:** Firebase Auth (configured in `lib/firebase.ts`)
- **User Identification:** Firebase UID is used to:
  - Namespace Firestore collections (`users/{userId}/tasks`)
  - Identify RevenueCat customers for cross-device subscription sync

### File-Based Routing (Expo Router)

The app uses Expo Router v6 with file-based routing:

```
app/
├── _layout.tsx              # Root layout with providers
├── index.tsx                # Main daily planner view
├── focus.tsx                # Focus mode screen
├── weekly.tsx               # Weekly overview (modal)
├── statistics.tsx           # Analytics/stats (modal)
├── subscription.tsx         # Subscription paywall (modal)
├── settings.tsx             # App settings (modal)
├── legal.tsx                # Terms/Privacy (modal)
└── +not-found.tsx           # 404 handler
```

**Navigation pattern:** Modals are presented with `presentation: 'modal'` in Stack screen options.

### Environment Configuration

**Required environment variables** (see `.env.example`):

- `EXPO_PUBLIC_RORK_API_BASE_URL` - tRPC backend API URL
- Firebase config (11 variables for web + iOS)
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` - RevenueCat iOS key
- App environment flags (`EXPO_PUBLIC_APP_ENVIRONMENT`, `EXPO_PUBLIC_ENABLE_ANALYTICS`)

**Environment helper:** `utils/env.ts` - Type-safe environment variable access

### Component Architecture

**Custom UI Components:**
- `TimeWheel.tsx` - Visual time selection wheel (24-hour format)
- `TaskList.tsx` - Task list with drag-to-reorder support
- `TaskItem.tsx` - Individual task card with completion toggle
- `AddTaskModal.tsx` - Task creation form
- `OnboardingFlow.tsx` - First-time user experience
- `ErrorBoundary.tsx` - React error boundary for crash handling

### Third-Party Integrations

1. **Firebase** (`lib/firebase.ts`)
   - Firestore for task cloud storage
   - Analytics for user behavior tracking
   - Auth for user authentication

2. **RevenueCat** (`lib/revenuecat.ts`)
   - Subscription management
   - In-app purchase handling
   - Entitlement checking for feature gates

3. **Expo Notifications** (`lib/notifications.ts`)
   - Local notification scheduling for task reminders
   - Requires custom development build (not available in Expo Go)

## Build & Deployment

### Development Builds (for testing native features)

```bash
# Install EAS CLI
bun install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Builds

```bash
# iOS
eas build --platform ios --profile production
eas submit --platform ios

# Android
eas build --platform android --profile production
eas submit --platform android
```

**Build profiles** are defined in `eas.json`:
- `development` - Development client with simulator support
- `preview` - Internal testing build
- `production` - App Store/Play Store release

### Web Deployment

```bash
# Build for web
eas build --platform web

# Deploy with EAS Hosting
eas hosting:configure
eas hosting:deploy
```

## Key Development Patterns

### Adding a New Feature with Subscription Gate

1. Define feature limit in `lib/revenuecat.ts` `getFeatureLimits()`
2. Check feature access in component:
```tsx
const { hasFeature } = useSubscription();
if (!hasFeature('featureName')) {
  // Show upgrade prompt
}
```

### Adding a New Task Field

1. Update `Task` type in `constants/types.ts`
2. Update Firestore schema in `lib/firestore-sync.ts`
3. Update UI in `AddTaskModal.tsx` and `TaskItem.tsx`
4. Handle migration in `TaskContext.tsx` if needed

### Offline-First Pattern

The app follows an offline-first approach:
- Always write to local state first for immediate UI update
- Sync to cloud in background if authenticated
- Cache cloud data to AsyncStorage for offline access
- Fall back to cached data if sync fails

### Analytics & Error Logging

```tsx
import { logAnalyticsEvent, logError } from '@/lib/firebase';

// Track user actions
logAnalyticsEvent('task_created', { category: 'work' });

// Log errors with context
try {
  await riskyOperation();
} catch (error) {
  logError(error as Error, { context: 'featureName', userId });
}
```

## Testing Strategy

### Testing on Physical Devices

1. Install **Rork app** from App Store or **Expo Go**
2. Run `bun run start`
3. Scan QR code from terminal

### Testing Native Features (Notifications, In-App Purchases)

Native features require a **custom development build** (Expo Go doesn't support them):

1. Create development build: `eas build --profile development`
2. Install on device
3. Run with dev client: `bun start --dev-client`

### Web Testing

```bash
bun run start-web              # Quick web preview
```

**Note:** Web preview has limitations (no native APIs, different navigation behavior).

## Common Gotchas

1. **Firestore Offline Persistence:** Configured with `experimentalForceLongPolling: true` for React Native compatibility
2. **Migration Pattern:** One-time migration from AsyncStorage to Firestore is tracked with `@planner_migration_complete` key
3. **Task Ordering:** Tasks use both `order` field (for manual sorting) and `startTime` field (for time-based sorting)
4. **RevenueCat User Identity:** Call `identifySubscriptionUser(userId)` after Firebase auth to sync subscriptions across devices
5. **TypeScript Path Alias:** `@/*` maps to project root (configured in `tsconfig.json`)

## Project Metadata

- **Bundle ID (iOS):** `app.rork.daily-planner-delight`
- **Package (Android):** `app.rork.daily_planner_delight`
- **Expo SDK:** v54+
- **React Native:** v0.81.4
- **React:** v19.1.0
- **Expo Router:** v6
