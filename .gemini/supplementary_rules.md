# React Native KLine Chart View - Supplementary Development Rules

## Adapter Pattern Implementation

### KLineChartAdapter

**Purpose**: Manage data list with adapter pattern to decouple data management from view rendering

**Core Methods**:

| Method              | Purpose                | Implementation                    |
| ------------------- | ---------------------- | --------------------------------- |
| `getCount()`        | Get candle count       | Return `datas.size()`             |
| `getItem(position)` | Get candle at position | Return `datas.get(position)`      |
| `getDate(position)` | Get date string        | Return `datas.get(position).Date` |

**Data Operations**:

```java
// 1. Replace all data (header)
public void addHeaderData(List<KLineEntity> data) {
    if (data != null && !data.isEmpty()) {
        datas.clear();
        datas.addAll(data);
        notifyDataSetChanged();
    }
}

// 2. Insert at beginning (footer)
public void addFooterData(List<KLineEntity> data) {
    if (data != null) {
        datas.clear();
        datas.addAll(0, data);  // Insert at index 0
        notifyDataSetChanged();
    }
}

// 3. Find and update or append
public void reloadKLineItem(KLineEntity entity) {
    int findIndex = -1;
    for (int i = 0; i < datas.size(); i++) {
        KLineEntity model = datas.get(i);
        if (model.getDate().equals(entity.getDate())) {
            findIndex = i;
            break;
        }
    }
    if (findIndex != -1) {
        datas.set(findIndex, entity);  // Update existing
    } else {
        datas.add(entity);             // Append new
    }
    notifyDataSetChanged();
}
```

**Rules**:

- Always call `notifyDataSetChanged()` after modifying data
- Use date string as unique identifier for candles
- Clear data before bulk operations to avoid memory issues

---

## File Structure Guidelines

### JavaScript Layer Files

```
├── index.js              # React component wrapper with forwardRef
├── index.d.ts            # TypeScript type definitions
└── package.json          # Dependencies and metadata
```

### Android Native Files

```
android/src/main/java/com/github/fujianlian/klinechart/
├── RNKLineView.java                    # ViewManager (command handling)
├── HTKLineConfigManager.java           # Configuration management
├── HTKLineContainerView.java           # Main container view
├── KLineEntity.java                    # Data model for candles
├── KLineChartAdapter.java              # Adapter pattern implementation
├── HTKLineTargetItem.java              # Indicator value model
├── HTMainDraw.java                     # Main chart drawing
├── HTVolumeDraw.java                   # Volume chart drawing
└── HTDrawType.java                     # Drawing type enums
```

### iOS Native Files

```
ios/Classes/
├── RNKLineView.swift                   # View manager
├── RNKLineViewCommands.swift/m         # Command handling
├── HTKLineConfigManager.swift          # Configuration management
├── HTKLineContainerView.swift          # Container view
├── HTKLineModel.swift                  # Data model
├── HTMainDraw.swift                    # Main chart drawing
└── HTVolumeDraw.swift                  # Volume chart drawing
```

---

## Development Workflow

### Adding New Features

1. **Plan the change**:

   - Identify affected layers (JS, Android, iOS)
   - Define configuration schema additions
   - Design type definitions

2. **Implement JavaScript layer**:

   - Update `index.d.ts` with new types
   - Add new methods to component if needed
   - Update default configuration

3. **Implement Android layer**:

   - Add new fields to `KLineEntity` if needed
   - Update `HTKLineConfigManager` parser
   - Update drawing logic in relevant files
   - Add new commands if needed

4. **Implement iOS layer**:

   - Mirror Android implementation
   - Ensure command IDs match
   - Test thread safety

5. **Test cross-platform**:
   - Test on both platforms
   - Verify configuration works
   - Check performance impact

### Adding New Indicators

**Steps**:

1. **Add fields to KLineEntity**:

   ```java
   public float customIndicator1;
   public float customIndicator2;
   public List<HTKLineTargetItem> customIndicatorList = new ArrayList();
   ```

2. **Add parsing in HTKLineConfigManager.packModel()**:

   ```java
   if (keyValue.containsKey("customIndicator1")) {
       entity.customIndicator1 = ((Number)keyValue.get("customIndicator1")).floatValue();
   }
   ```

3. **Add configuration in targetList**:

   ```javascript
   customIndicatorList: [{ title: "CI1", value: 14, selected: true, index: 0 }];
   ```

4. **Update drawing logic** in appropriate draw class to render the indicator

5. **Update TypeScript types** in `index.d.ts`

6. **Add calculation logic** for the indicator values

### Adding New Drawing Tools

**Steps**:

1. Define new `HTDrawType` enum value
2. Add drawing logic in appropriate draw class
3. Update `drawList` configuration to support new type
4. Add event handlers for new drawing interactions
5. Test drawing save/load functionality

---

## Data Transformation Pipeline

### Candle Data Flow

```
JavaScript Candle Object
  ↓ (React Native Bridge)
ReadableMap
  ↓ (readableMapToMap)
Map<String, Object>
  ↓ (packModel)
KLineEntity
  ↓ (Adapter)
Chart Rendering
```

**Each step must**:

- Handle null values gracefully
- Validate data types before casting
- Apply sensible default values
- Log errors appropriately with context

### Indicator Calculation Flow

```
Raw OHLC Data
  ↓
Parse indicator parameters from targetList
  ↓
Calculate indicator values (MA, BOLL, MACD, etc.)
  ↓
Store in KLineEntity fields
  ↓
Render on chart with proper colors
```

**Rules for calculations**:

- Perform calculations on worker thread
- Cache calculated values in entity
- Recalculate only when necessary (new data or config change)
- Use efficient algorithms for moving averages
- Handle edge cases (insufficient data for period)

---

## Debugging Guidelines

### Common Issues and Solutions

1. **Chart not updating**:

   - Check if `reloadConfigManager()` is called
   - Verify data is on UI thread when updating view
   - Check if adapter's `notifyDataSetChanged()` is called

2. **Indicators not showing**:

   - Verify `selected: true` in targetList
   - Check if indicator values are calculated
   - Verify color is not transparent (0x00...)

3. **Performance issues**:

   - Profile with large datasets (1000+ candles)
   - Check for work on UI thread
   - Verify no unnecessary re-renders
   - Check memory leaks with profiler

4. **Cross-platform differences**:
   - Compare command handling between iOS/Android
   - Verify color format conversions
   - Check thread dispatch differences

### Logging Best Practices

```java
// Android
Log.d("KLineChart", "Setting " + candles.size() + " candles");
Log.e("KLineChart", "Failed to parse candle", exception);

// iOS (Swift)
print("[KLineChart] Setting \(candles.count) candles")
```

**Rules**:

- Always include component name in logs
- Use appropriate log levels (DEBUG, INFO, WARN, ERROR)
- Include relevant context (data size, operation type)
- Never log sensitive data

---

## Version Control Guidelines

### Commit Message Format

```
[Platform] Category: Brief description

- Detailed change 1
- Detailed change 2

Fixes #issue_number
```

**Examples**:

- `[Android] Fix: Prevent crash when updating empty chart`
- `[iOS] Feature: Add RSI indicator support`
- `[JS] Docs: Update TypeScript definitions for new props`
- `[Both] Refactor: Improve threading model for data parsing`

### Branch Naming

- `feature/indicator-name` - New indicator
- `fix/issue-description` - Bug fixes
- `refactor/component-name` - Code refactoring
- `docs/update-readme` - Documentation updates

---

## Release Checklist

Before releasing a new version:

- [ ] All tests passing on Android
- [ ] All tests passing on iOS
- [ ] TypeScript definitions updated
- [ ] Example app tested with new features
- [ ] Documentation updated (README, CHANGELOG)
- [ ] Performance benchmarks run
- [ ] Memory leaks checked
- [ ] Breaking changes documented
- [ ] Migration guide provided (if needed)
- [ ] Version numbers updated (package.json, podspec, gradle)

---

## Future Considerations

### Potential Improvements

1. **WebAssembly for calculations**: Move indicator calculations to WASM for better performance
2. **Custom indicator plugins**: Allow developers to register custom indicators
3. **Themes system**: Predefined color themes (dark, light, high contrast)
4. **Accessibility**: Screen reader support, keyboard navigation
5. **Export functionality**: Export chart as image/PDF
6. **Historical data loading**: Load older data on scroll
7. **Multiple timeframes**: Switch between 1m, 5m, 1h, 1d views
8. **Annotation tools**: Text boxes, arrows, shapes

### Deprecated Features to Remove

- Legacy drawing tool formats (if any)
- Unused indicator calculations
- Old configuration formats without migration path
