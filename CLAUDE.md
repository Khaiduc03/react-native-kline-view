# Claude Instructions for React Native KLine View

## Project Summary

React Native KLine View is a high-performance candlestick charting library with native iOS (Swift) and Android (Java) implementations. It's designed for trading applications requiring 60fps scrolling, zooming, and real-time updates.

> ⚠️ **CRITICAL**: This is a LIBRARY development project!
> - Library code: Root folder (`index.js`, `ios/`, `android/`)
> - Test app: `example/` folder
> - Always rebuild and test in `example/` after library changes
> - Always verify bridge connection with logs before assuming it works

## Key Technical Details

### Stack
- React Native >= 0.66.0 (supports New Architecture)
- iOS: Swift, UIKit, CoreGraphics, Lottie
- Android: Java, Custom Views, Canvas
- TypeScript for type definitions

### Entry Points
- `index.js` - JS bridge with imperative API
- `ios/Classes/RNKLineView.swift` - iOS ViewManager
- `android/.../RNKLineView.java` - Android ViewManager

### Core Components

**iOS:**
- `HTKLineView` - Main UIScrollView-based chart
- `HTKLineContainerView` - Wrapper handling RN props
- `HTKLineConfigManager` - Configuration state
- `HT*Draw` classes - Drawing implementations

**Android:**
- `KLineChartView` - Main custom View
- `HTKLineContainerView` - Container wrapper
- `HTKLineConfigManager` - Configuration
- `draw/` package - Drawing implementations

## Bridge Verification (MANDATORY)

When implementing/modifying bridge code, ALWAYS add verification:

### JavaScript Side
```javascript
function runCommand(nativeRef, commandName, payload) {
  const nodeHandle = findNodeHandle(nativeRef.current);
  console.log('[RNKLineView] runCommand:', commandName, payload); // MUST LOG
  
  if (!nodeHandle) {
    console.warn('[RNKLineView] No nodeHandle');
    return;
  }
  
  const manager = NativeModules?.RNKLineView;
  if (!manager) {
    console.warn('[RNKLineView] NativeModules.RNKLineView missing');
    return;
  }
  
  if (typeof manager[commandName] !== 'function') {
    console.warn(`[RNKLineView] Method ${commandName} not found`);
    return;
  }
  
  manager[commandName](nodeHandle, payload);
}
```

### Native Side (iOS)
```swift
@objc func setData(_ reactTag: NSNumber, candles: NSArray) {
    print("[RNKLineView][iOS] setData called, count:", candles.count) // MUST LOG
    // ... implementation
}
```

### Native Side (Android)
```java
case COMMAND_SET_DATA: {
    Log.i(TAG, "setData called, count=" + candleArray.size()); // MUST LOG
    // ... implementation
}
```

## Development Workflow

```
1. Modify library code (index.js, ios/Classes/, android/src/)
2. Rebuild example: cd example && yarn ios (or android)
3. Test feature in example app
4. Check logs: JS console + native logs (Xcode/Logcat)
5. Verify data flows correctly through bridge
6. Repeat until working
```

## Coding Standards

### When Writing JavaScript/TypeScript:
```javascript
// ✅ Good
const handleUpdate = candle => {
  klineRef.current?.updateLastCandle(candle);
};

// ❌ Avoid
function handleUpdate(candle) {
  klineRef.current.updateLastCandle(candle)
}
```

### When Writing Swift:
```swift
// ✅ Good
guard let configManager = self.configManager else { return }
let models = HTKLineModel.packModelArray(candles)

// ❌ Avoid
let models = HTKLineModel.packModelArray(candles!)
```

### When Writing Java:
```java
// ✅ Good
final List<KLineEntity> entities = configManager.packModelList(candleMaps);
if (entities == null) return;

// ❌ Avoid
List entities = configManager.packModelList(candleMaps);
```

## Common Modifications

### Adding Imperative Command:
1. `index.js`: Add to useImperativeHandle
2. `index.d.ts`: Update RNKLineViewRef interface
3. `RNKLineView.swift`: Add @objc func
4. `RNKLineView.java`: Add to receiveCommand switch

### Adding Technical Indicator:
1. Create `HT{Name}Draw.swift` implementing protocol
2. Create Java equivalent in `draw/` package
3. Add enum case to config managers
4. Update TypeScript types

## Important Constraints

1. **Thread Safety**: Always parse JSON on background thread
2. **Memory**: Large datasets need efficient handling
3. **Platform Parity**: Features should work on both platforms
4. **Performance**: No heavy work in draw loops
5. **Bridge Verification**: NEVER assume bridge works - always add logs
6. **Library vs App**: Code changes go in root folder, testing in example/
7. **Rebuild Required**: After library changes, must rebuild example app

## Response Guidelines

When helping with this project:
- Consider both iOS and Android implications
- Preserve existing code patterns
- Update TypeScript types for API changes
- Suggest performance optimizations when relevant
- Use Vietnamese or English based on user's language
