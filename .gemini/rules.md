# React Native KLine Chart View - Development Rules

## Project Overview

- **Platform**: React Native library for K-Line (candlestick) charts
- **Target**: iOS and Android
- **Language**: TypeScript (JS layer), Java (Android), Swift (iOS)

## Architecture Principles

### 1. Cross-Platform Consistency

- Maintain unified API across iOS and Android
- Platform-specific implementations should follow same patterns
- **iOS**: Use NativeModules for direct method calls
- **Android**: Use UIManager.dispatchViewManagerCommand

### 2. Threading Model

**CRITICAL**: Always use multi-threading for data processing to avoid blocking UI thread

```
UI Thread → Copy data from bridge
  ↓
Worker Thread → Parse and transform data
  ↓
UI Thread → Update view and render
```

**Rules**:

- Parse JSON data on worker thread
- Transform data structures on worker thread
- Only update UI components on main/UI thread
- Never block UI thread with heavy computations

### 3. Type Safety

**All data conversions MUST include**:

- Null checking
- Type casting with safety
- Default values for missing data

```java
// Example
Object object = keyValue.get("value");
if (object == null) {
    object = new Double(0);
}
float value = ((Number) object).floatValue();
```

### 4. Config-Driven Design

**Principle**: Chart behavior should be fully configurable from JavaScript without native rebuild

**Configuration includes**:

- Colors, sizes, fonts
- Indicators and parameters
- Drawing tools
- Layout proportions

## Code Standards

### JavaScript/TypeScript Layer

#### Data Types

```typescript
type Candle = {
  id: number;
  dateString: string;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
  selectedItemList?: Array<Record<string, any>>;
  [key: string]: any; // Allow dynamic indicator fields
};
```

#### Methods

All imperative methods must be exposed via `forwardRef`:

- `setData(candles)`: Replace entire dataset
- `appendCandle(candle)`: Add new candle at the end
- `updateLastCandle(candle)`: Update last candle

### Android Native Layer

#### Command Handling

All commands must follow this ID mapping:

- `setData` = 1
- `appendCandle` = 2
- `updateLastCandle` = 3

#### Data Flow Pattern

```java
case COMMAND_SET_DATA: {
    // 1. Copy data from bridge (UI thread)
    final List<Map<String, Object>> candleMaps = new ArrayList<>();

    // 2. Parse on worker thread
    new Thread(() -> {
        final List<KLineEntity> entities = /* transform */;

        // 3. Update UI on main thread
        root.post(() -> {
            root.configManager.modelArray.clear();
            root.configManager.modelArray.addAll(entities);
            root.reloadConfigManager();
        });
    }).start();
}
```

#### Helper Methods

- `readableMapToMap()`: Convert ReadableMap → Map<String, Object>
- `readableArrayToList()`: Convert ReadableArray → List<Object>
- Handle all types: Null, Boolean, Number, String, Map, Array

### iOS Native Layer

#### Pattern Consistency

- Follow same command structure as Android
- Use Swift pattern matching for command handling
- Maintain thread safety with DispatchQueue

## Data Model Rules

### KLineEntity Structure

**Required fields**:

```java
public float id;
public String Date;
public float Open, High, Low, Close, Volume;
```

**Indicator fields** (dynamically populated):

- MA: `MA5Price`, `MA10Price`, `MA20Price`, `MA30Price`, `MA60Price`
- BOLL: `up`, `mb`, `dn`
- MACD: `dea`, `dif`, `macd`
- KDJ: `k`, `d`, `j`
- RSI: `rsi`
- WR: `r`
- Volume MA: `MA5Volume`, `MA10Volume`

### Configuration Schema

**Structure format**:

```javascript
{
  modelArray: [/* candles */],
  targetList: {/* indicator configs */},
  drawList: {/* drawing tool configs */},
  configList: {/* display configs */},
  primary: 1,  // 1=MA, 2=BOLL
  second: 3,   // 3=MACD, 4=KDJ, 5=RSI, 6=WR
  shouldScrollToEnd: true
}
```

### Indicator Configuration Details

**TargetList Structure**:

```javascript
targetList: {
  // Moving Average configuration
  maList: [
    { title: "MA5", value: 5, selected: true, index: 0 },
    { title: "MA10", value: 10, selected: true, index: 1 },
    { title: "MA20", value: 20, selected: true, index: 2 },
    { title: "MA30", value: 30, selected: false, index: 3 },
    { title: "MA60", value: 60, selected: false, index: 4 }
  ],

  // Volume Moving Average
  maVolumeList: [
    { title: "MA5", value: 5, selected: true, index: 0 },
    { title: "MA10", value: 10, selected: true, index: 1 }
  ],

  // RSI configuration
  rsiList: [
    { title: "RSI", value: 14, selected: true, index: 0 }
  ],

  // Williams %R configuration
  wrList: [
    { title: "WR", value: 14, selected: true, index: 0 }
  ],

  // Bollinger Bands parameters
  bollN: "20",  // Period
  bollP: "2",   // Standard deviation multiplier

  // MACD parameters
  macdL: "26",  // Long period
  macdM: "9",   // Signal period
  macdS: "12",  // Short period

  // KDJ parameters
  kdjN: "9",    // N period
  kdjM1: "3",   // M1 period
  kdjM2: "3"    // M2 period
}
```

**Rules for Indicators**:

- `selected: true` means the indicator will be displayed
- `index` determines the display order
- Only selected items are added to the model array
- All period values must be positive integers
- Default values should match common trading standards

### Drawing Tools Configuration

**DrawList Structure**:

```javascript
drawList: {
  shotBackgroundColor: 0xFF000000,  // Screenshot background color
  drawType: 0,                       // 0=None, 1=Line, 2=Horizontal, etc.
  drawShouldContinue: false,         // Continue drawing mode
  shouldFixDraw: false,              // Fix drawing position
  shouldClearDraw: false,            // Clear all drawings
  drawColor: 0xFFFFFFFF,            // Drawing color
  drawLineHeight: 1,                 // Line thickness
  drawDashWidth: 1,                  // Dash line segment width
  drawDashSpace: 1,                  // Dash line segment space
  drawIsLock: false,                 // Lock drawings (prevent editing)
  shouldReloadDrawItemIndex: -1,     // Index to reload (-1 = none)
  drawShouldTrash: false             // Delete drawing
}
```

**Drawing Types (HTDrawType)**:

- `0`: No drawing
- `1`: Line
- `2`: Horizontal line
- Add more types as needed

### Display Configuration Details

**ConfigList Structure**:

```javascript
configList: {
  // Color configuration
  colorList: {
    increaseColor: 0xFF00FF00,  // Green for price increase
    decreaseColor: 0xFFFF0000   // Red for price decrease
  },

  // Layout proportions
  mainFlex: 0.716,      // 71.6% for main chart area
  volumeFlex: 0.122,    // 12.2% for volume area

  // Padding
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,

  // Candle dimensions
  itemWidth: 9,         // Total width per item
  candleWidth: 7,       // Actual candle body width

  // Typography
  fontFamily: "System",
  textColor: 0xFFFFFFFF,
  headerTextFontSize: 9,
  rightTextFontSize: 10,
  candleTextFontSize: 11,

  // Chart colors
  minuteLineColor: 0xFF4CAF50,
  targetColorList: [
    0xFF1E88E5,  // Color for first indicator
    0xFFFFA726,  // Color for second indicator
    0xFFAB47BC   // Color for third indicator
  ],

  // Gradient for minute/line charts
  minuteGradientColorList: [0xFF4CAF50, 0x00000000],
  minuteGradientLocationList: [0, 1]  // 0 = top, 1 = bottom
}
```

**Color Format Rules**:

- Always use Android format: `0xAARRGGBB`
- AA = alpha (transparency), RR = red, GG = green, BB = blue
- Example: `0xFFFF0000` = fully opaque red
- Example: `0x80FF0000` = 50% transparent red

## Performance Best Practices

### Memory Management

- Clear arrays before adding large datasets
- Use efficient data structures (ArrayList vs LinkedList)
- Avoid unnecessary object creation in render loop

### Rendering Optimization

- Only trigger re-render when data actually changes
- Use adapter pattern to manage data updates
- Implement efficient min/max calculations for scaling

### Real-time Updates

- Use `updateLastCandle()` instead of full `setData()` for tick updates
- Batch multiple updates if receiving high-frequency data
- Implement throttling for rapid updates

## Event System

### Native → React Native Events

```java
public static String onDrawItemDidTouchKey = "onDrawItemDidTouch";
public static String onDrawItemCompleteKey = "onDrawItemComplete";
public static String onDrawPointCompleteKey = "onDrawPointComplete";
```

**Rules**:

- Always emit events with proper payload structure
- Handle event listeners properly in JavaScript layer
- Clean up event subscriptions on unmount

## Testing Guidelines

### Unit Tests

- Test all data transformation functions
- Verify null safety for all conversions
- Test threading behavior

### Integration Tests

- Test command flow from JS → Native
- Verify data updates reflect in UI
- Test with edge cases (empty data, single candle, large datasets)

### Performance Tests

- Benchmark with 1000+ candles
- Test memory usage with large datasets
- Verify smooth scrolling and zooming

## Common Pitfalls to Avoid

1. **Threading Issues**: Never parse data on UI thread
2. **Memory Leaks**: Always clear old data before loading new dataset
3. **Type Mismatches**: Always validate data types from bridge
4. **Config Complexity**: Keep configuration schema documented and validated
5. **Platform Differences**: Test both iOS and Android for every feature

## Code Review Checklist

Before submitting code:

- [ ] Threading model is correct (worker thread for parsing)
- [ ] All null checks are in place
- [ ] TypeScript types are up to date
- [ ] Configuration schema is documented
- [ ] Tested on both iOS and Android
- [ ] Performance impact measured for large datasets
- [ ] Event handlers are properly cleaned up
- [ ] No hardcoded values (use configuration)

## Use Cases

This library is designed for:

- Real-time cryptocurrency/stock charts
- Historical data visualization
- Technical analysis tools
- Trading platforms

**Note**: Library is highly customizable but requires understanding of technical indicators and chart rendering for effective use.
