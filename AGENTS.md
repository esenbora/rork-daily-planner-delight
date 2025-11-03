# Agent Development Guidelines

## Commands

- **Build**: `bun run start` (mobile), `bun run start-web` (web), `bun run start-web-dev` (debug)
- **Lint**: `bun run lint` (ESLint with expo config)
- **Test**: `bunx jest` (all tests), `bunx jest path/to/test.test.ts` (single test)
- **Typecheck**: `bunx tsc --noEmit` (TypeScript strict mode)

## Code Style

### Formatting
- Prettier config: single quotes, semicolons, trailing commas ES5, 100 char width
- Use `@/*` path alias for imports (configured in tsconfig.json)
- Import order: React/React Native → third-party → internal types → internal components

### TypeScript
- Strict mode enabled
- Define interfaces in `constants/types.ts`
- Use union types for categories/priorities: `TaskCategory`, `TaskPriority`
- Optional props with `?` operator

### React Patterns
- Use `React.memo` for performance optimization
- Functional components with TypeScript interfaces
- Context providers for state management (`TaskContext`, `SubscriptionContext`)
- Expo Router file-based routing

### Error Handling
- Use `Alert.alert()` for user confirmations
- Wrap async operations in try/catch
- Log errors with Firebase analytics: `logError(error, context)`

### Testing
- Jest with expo preset
- Test files in `__tests__` directories with `.test.ts` extension
- 10s timeout for API-dependent tests
- Coverage threshold: 70% across all metrics