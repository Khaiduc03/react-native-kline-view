# React Native KLine View - AI Agent Rules

## Project Overview

This is a **React Native library development project** for displaying professional K-Line (Candlestick) charts. It uses native code for both iOS (Swift) and Android (Java) to achieve 60fps performance.

> ⚠️ **IMPORTANT**: This is a LIBRARY project, NOT an app project!
> - Library source code: Root folder (`index.js`, `ios/`, `android/`)
> - Testing/Demo app: `example/` folder
> - Always test changes in the `example/` app after modifying library code

## Tech Stack

- **JavaScript/TypeScript**: React Native bridge layer
- **Swift**: iOS native implementation (ios/Classes/)
- **Java**: Android native implementation (android/src/main/java/)
- **React Native**: >= 0.66.0, supports New Architecture (Fabric)

## Project Structure

```
├── index.js              # Main entry - React Native bridge
├── index.d.ts            # TypeScript type definitions
├── ios/Classes/          # iOS Swift implementation
│   ├── RNKLineView.swift         # RN ViewManager bridge
│   ├── HTKLineView.swift         # Main chart view (UIScrollView)
│   ├── HTKLineContainerView.swift # Container wrapper
│   ├── HTKLineModel.swift        # Data models
│   ├── HTKLineConfigManager.swift # Configuration
│   ├── HT*Draw.swift             # Drawing components (Main, Volume, MACD, etc.)
│   └── HTPrediction*.swift       # Price prediction overlay
├── android/src/main/java/com/github/fujianlian/klinechart/
│   ├── RNKLineView.java          # RN ViewManager
│   ├── HTKLineContainerView.java # Container
│   ├── KLineChartView.java       # Main chart
│   ├── draw/                     # Drawing components
│   └── entity/                   # Data entities
└── example/              # Demo app
    └── screens/KLineScreen.tsx   # Main demo screen
```

## Coding Conventions

### JavaScript/TypeScript
- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Use **trailing commas**
- Use **arrow functions** with `avoid` parens for single params
- Prefer `const` over `let`, never use `var`
- Use TypeScript types from `index.d.ts`

### Swift (iOS)
- Use **4 spaces** for indentation
- Follow Apple Swift API Design Guidelines
- Use `guard` for early returns
- Prefix private properties with class context (e.g., `configManager`)
- Use `lazy var` for expensive initializations
- Handle optionals safely with `guard let` or `if let`

### Java (Android)
- Use **4 spaces** for indentation
- Follow Google Java Style Guide
- Use `final` for immutable variables
- Handle null checks explicitly
- Use meaningful variable names

## Key Patterns

### React Native Bridge
```javascript
// iOS: Use NativeModules for imperative commands
NativeModules.RNKLineView.methodName(reactTag, payload);

// Android: Use UIManager.dispatchViewManagerCommand
UIManager.dispatchViewManagerCommand(nodeHandle, commandId, [payload]);
```

### ⚠️ Bridge Verification (CRITICAL)
When adding/modifying bridge code, ALWAYS verify:

1. **JS → Native connection exists**:
   ```javascript
   // Check if native module is available
   const manager = NativeModules?.RNKLineView;
   if (!manager) {
     console.warn('[RNKLineView] Native module not found');
     return;
   }
   ```

2. **Method exists on native side**:
   ```javascript
   if (typeof manager[commandName] !== 'function') {
     console.warn(`[RNKLineView] Method ${commandName} not found`);
     return;
   }
   ```

3. **Data is being sent correctly**:
   ```javascript
   console.log('[RNKLineView] Sending to native:', commandName, payload);
   ```

4. **Native side receives data**:
   ```swift
   // iOS - Add logging in RNKLineView.swift
   print("[RNKLineView][iOS] Received:", commandName, payload)
   ```
   ```java
   // Android - Add logging in RNKLineView.java
   Log.i(TAG, "Received: " + commandName + " payload=" + payload);
   ```

### Data Flow
1. `optionList` (JSON string) → Native parsing → `configManager` → Render
2. Imperative API: `ref.setData()`, `ref.appendCandle()`, `ref.updateLastCandle()`

### Drawing Protocol (iOS)
All indicators implement `HTKLineDrawProtocol`:
- `minMaxRange()` - Calculate value range
- `drawCandle()` - Draw individual candle
- `drawLine()` - Draw indicator lines
- `drawText()` - Draw labels

## Important Notes

1. **Performance Critical**: This is a charting library - avoid unnecessary re-renders
2. **Thread Safety**: Parse data on background thread, update UI on main thread
3. **Memory**: Be careful with large datasets (thousands of candles)
4. **Platform Parity**: Try to maintain feature parity between iOS and Android
5. **Prediction Feature**: Currently iOS-only (Phase 2)

## Common Tasks

### Adding a New Indicator
1. iOS: Create `HT{Name}Draw.swift` implementing `HTKLineDrawProtocol`
2. Android: Create draw class in `draw/` folder
3. Update `HTKLineConfigManager` to handle new indicator type
4. Update TypeScript types in `index.d.ts`

### Adding a New Imperative Command
1. Add method to `index.js` `useImperativeHandle`
2. iOS: Add `@objc func` to `RNKLineView.swift`
3. Android: Add command to `RNKLineView.java` `receiveCommand()`
4. Update TypeScript interface `RNKLineViewRef`
5. **Add console.log in JS** to verify method is called
6. **Add print/Log.i in native** to verify data is received
7. **Test in example app** and check logs on both platforms

## Do's and Don'ts

### Do's ✅
- Keep native code performant (avoid allocations in draw loops)
- Use existing patterns when adding features
- Update TypeScript types when changing API
- Test on both iOS and Android
- Use meaningful commit messages (Conventional Commits)
- **Add logging when implementing bridge methods**
- **Verify data flow: JS → Bridge → Native → UI**
- **Test in example/ app after every library change**

### Don'ts ❌
- Don't use inline styles extensively in React Native
- Don't block main thread with heavy computations
- Don't ignore optional values in Swift (use safe unwrapping)
- Don't hardcode colors/dimensions (use configManager)
- Don't forget to handle edge cases (empty data, single candle, etc.)
- **Don't assume bridge works without testing** - always verify with logs
- **Don't skip rebuilding example app** after library changes
- **Don't remove debug logs** until feature is fully verified

## File Naming

- iOS: `HT{Feature}{Type}.swift` (e.g., `HTMainDraw.swift`)
- Android: `{Feature}.java` or `HT{Feature}.java`
- TypeScript: `camelCase.ts` or `PascalCase.tsx` for components

## Development Workflow

### Library Development Cycle
```
1. Modify library code (root: index.js, ios/, android/)
2. Rebuild example app to pick up changes
3. Test in example app
4. Verify bridge communication with logs
5. Repeat
```

### Rebuilding After Library Changes
```bash
# iOS - Need to reinstall pods
cd example/ios && pod install && cd ..
yarn ios

# Android - Usually auto-rebuilds, but if not:
cd example
yarn android
```

### Verifying Bridge Connection
```bash
# Watch iOS logs
npx react-native log-ios

# Watch Android logs
npx react-native log-android
# or
adb logcat | grep RNKLineView
```

## Testing

- Run `yarn lint` before committing
- Test on iOS Simulator and Android Emulator
- Test with various data sizes (10, 100, 1000+ candles)
- Test gestures: scroll, pinch-zoom, long-press, tap
- **ALWAYS verify bridge logs** when testing new features
- Check both JS console and native logs for errors
