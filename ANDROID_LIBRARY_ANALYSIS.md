# 📊 React Native K-Line View - Android Library Analysis

## 🎯 Tổng quan

Thư viện `react-native-kline-view` Android là một thư viện mạnh mẽ và toàn diện để hiển thị biểu đồ K-line (nến) trong ứng dụng React Native. Thư viện được thiết kế theo kiến trúc layered architecture với khả năng tùy chỉnh cao và hiệu suất tối ưu.

## 🏗️ Kiến trúc tổng thể

```
┌─────────────────────────────────────┐
│        React Native Layer          │
│  (RNKLineView, RNKLineViewPackage) │
├─────────────────────────────────────┤
│        Container Layer              │
│  (HTKLineContainerView, HTShotView) │
├─────────────────────────────────────┤
│        Chart Layer                  │
│  (KLineChartView, BaseKLineChartView)│
├─────────────────────────────────────┤
│        Drawing Layer                │
│  (HTDrawContext, HTDrawItem, etc.)  │
├─────────────────────────────────────┤
│        Data Layer                   │
│  (KLineEntity, DataHelper, etc.)    │
├─────────────────────────────────────┤
│        Utility Layer                │
│  (Formatters, Utils, etc.)          │
└─────────────────────────────────────┘
```

## 📁 Cấu trúc thư mục

```
android/src/main/java/com/github/fujianlian/klinechart/
├── base/                          # Interface và base classes
│   ├── IAdapter.java             # Adapter interface
│   ├── IChartDraw.java           # Chart drawing interface
│   ├── IDateTimeFormatter.java   # DateTime formatter interface
│   └── IValueFormatter.java      # Value formatter interface
├── container/                     # Container và drawing system
│   ├── HTDrawContext.java        # Drawing context manager
│   ├── HTDrawItem.java           # Individual drawing item
│   ├── HTDrawState.java          # Drawing states
│   ├── HTDrawType.java           # Drawing types enum
│   ├── HTKLineContainerView.java # Main container view
│   ├── HTPoint.java              # Point utility class
│   └── HTShotView.java           # Screenshot functionality
├── draw/                         # Drawing components
│   ├── KDJDraw.java             # KDJ indicator drawing
│   ├── MACDDraw.java            # MACD indicator drawing
│   ├── MainDraw.java            # Main chart drawing
│   ├── PrimaryStatus.java       # Primary indicator status
│   ├── RSIDraw.java             # RSI indicator drawing
│   ├── SecondStatus.java        # Secondary indicator status
│   ├── VolumeDraw.java          # Volume chart drawing
│   └── WRDraw.java              # WR indicator drawing
├── entity/                       # Data entities và interfaces
│   ├── ICandle.java             # Candle interface
│   ├── IKDJ.java                # KDJ interface
│   ├── IKLine.java              # Main K-line interface
│   ├── IMACD.java               # MACD interface
│   ├── IRSI.java                # RSI interface
│   ├── IVolume.java             # Volume interface
│   └── IWR.java                 # WR interface
├── formatter/                    # Formatters
│   ├── BigValueFormatter.java   # Big value formatter
│   ├── DateFormatter.java       # Date formatter
│   ├── TimeFormatter.java       # Time formatter
│   └── ValueFormatter.java      # Value formatter
├── utils/                        # Utility classes
│   ├── DateUtil.java            # Date utilities
│   └── ViewUtil.java            # View utilities
├── BaseKLineChartView.java       # Base chart view
├── DataHelper.java              # Technical indicator calculations
├── HTKLineConfigManager.java    # Configuration manager
├── HTKLineTargetItem.java       # Target item for indicators
├── KLineChartAdapter.java       # Chart adapter
├── KLineChartView.java          # Main chart view
├── KLineEntity.java             # Main data entity
├── RNKLineView.java             # React Native view manager
├── RNKLineViewPackage.java      # React Native package
└── ScrollAndScaleView.java      # Scroll and scale functionality
```

## 🔧 Các thành phần chính

### 1. React Native Integration Layer

#### `RNKLineView.java`

- **Chức năng**: View Manager chính cho React Native
- **Kế thừa**: `SimpleViewManager<HTKLineContainerView>`
- **Events**:
  - `onDrawItemDidTouch`: Khi touch vào drawing item
  - `onDrawItemComplete`: Khi hoàn thành drawing item
  - `onDrawPointComplete`: Khi hoàn thành drawing point
- **Props**: `optionList` - Cấu hình chart dưới dạng JSON string

```java
@ReactProp(name = "optionList")
public void setOptionList(final HTKLineContainerView containerView, String optionList) {
    // Parse JSON và cập nhật config trong background thread
    new Thread(new Runnable() {
        @Override
        public void run() {
            Map optionMap = (Map)JSON.parse(optionList, disableDecimalFeature);
            containerView.configManager.reloadOptionList(optionMap);
            containerView.post(() -> containerView.reloadConfigManager());
        }
    }).start();
}
```

#### `RNKLineViewPackage.java`

- **Chức năng**: Đăng ký package với React Native
- **View Managers**: Đăng ký `RNKLineView`

### 2. Container Layer

#### `HTKLineContainerView.java`

- **Chức năng**: Container chính chứa chart và xử lý touch events
- **Kế thừa**: `RelativeLayout`
- **Thành phần**:
  - `KLineChartView klineView`: Chart view chính
  - `HTShotView shotView`: Screenshot view
  - `HTKLineConfigManager configManager`: Configuration manager

**Touch Event Handling**:

```java
@Override
public boolean onTouchEvent(MotionEvent event) {
    handlerDraw(event);    // Xử lý drawing gestures
    handlerShot(event);    // Xử lý screenshot
    return true;
}

private void handlerDraw(MotionEvent event) {
    HTPoint location = new HTPoint(event.getX(), event.getY());
    location = convertLocation(location);
    klineView.drawContext.touchesGesture(location, translation, state);
}
```

#### `HTShotView.java`

- **Chức năng**: Tạo screenshot/thumbnail của chart
- **Kế thừa**: `View`
- **Tính năng**:
  - Real-time capture khi touch
  - Scale transformation (1.5x)
  - Round corner clipping
  - Bitmap manipulation

```java
public void setPoint(HTPoint point) {
    if (point != null) {
        bitmap = loadBitmapFromView(shotView);
        Matrix matrix = new Matrix();
        matrix.postScale(scale, scale);
        // Apply transformations và clipping
    }
}
```

### 3. Chart Layer

#### `BaseKLineChartView.java`

- **Chức năng**: Base class cho tất cả chart views
- **Kế thừa**: `ScrollAndScaleView implements Drawable.Callback`
- **Core Properties**:
  - `HTKLineConfigManager configManager`: Configuration
  - `HTDrawContext drawContext`: Drawing context
  - Paint objects cho grid, text, background
  - Data management (max/min values, indices)

**Rendering Pipeline**:

```java
@Override
protected void onDraw(Canvas canvas) {
    // 1. Draw background
    // 2. Draw grid
    // 3. Calculate visible range
    // 4. Draw main chart (candles, MA, BOLL)
    // 5. Draw volume chart
    // 6. Draw child indicators (MACD, KDJ, RSI, WR)
    // 7. Draw crosshair
    // 8. Draw drawing items
    // 9. Draw text labels
}
```

#### `KLineChartView.java`

- **Chức năng**: Main chart implementation
- **Kế thừa**: `BaseKLineChartView`
- **Drawing Components**:
  - `MainDraw mMainDraw`: Main chart drawing
  - `VolumeDraw mVolumeDraw`: Volume chart
  - `MACDDraw mMACDDraw`: MACD indicator
  - `KDJDraw mKDJDraw`: KDJ indicator
  - `RSIDraw mRSIDraw`: RSI indicator
  - `WRDraw mWRDraw`: WR indicator

**Indicator Switching**:

```java
public void changeSecondDrawType(SecondStatus secondStatus) {
    switch (secondStatus) {
        case MACD: setChildDraw(0); break;
        case KDJ: setChildDraw(1); break;
        case RSI: setChildDraw(2); break;
        case WR: setChildDraw(3); break;
        case NONE: hideChildDraw(); break;
    }
}
```

#### `ScrollAndScaleView.java`

- **Chức năng**: Gesture handling cho scroll và scale
- **Kế thừa**: `RelativeLayout implements GestureDetector.OnGestureListener, ScaleGestureDetector.OnScaleGestureListener`
- **Tính năng**:
  - Horizontal scrolling
  - Pinch-to-zoom (0.5x - 2.0x)
  - Long press detection
  - Multi-touch support

### 4. Drawing System

#### `HTDrawContext.java`

- **Chức năng**: Quản lý context vẽ và xử lý drawing gestures
- **Properties**:
  - `List<HTDrawItem> drawItemList`: Danh sách drawing items
  - `Paint paint`: Paint object cho drawing
  - `BaseKLineChartView klineView`: Reference đến chart view

**Gesture Handling**:

```java
public void touchesGesture(HTPoint location, HTPoint translation, int state) {
    switch (state) {
        case MotionEvent.ACTION_DOWN:
            // Tạo drawing item mới hoặc thêm point
            if (drawItem == null || drawItem.pointList.size() >= drawItem.drawType.count()) {
                drawItem = new HTDrawItem(configManager.drawType, location);
                drawItemList.add(drawItem);
            } else {
                drawItem.pointList.add(location);
            }
            break;
        case MotionEvent.ACTION_MOVE:
            // Cập nhật point cuối
            break;
        case MotionEvent.ACTION_UP:
            // Hoàn thành drawing
            configManager.onDrawItemComplete.invoke(drawItem, drawItemList.size() - 1);
            break;
    }
}
```

#### `HTDrawItem.java`

- **Chức năng**: Đại diện cho một drawing item
- **Properties**:
  - `HTDrawType drawType`: Loại drawing
  - `int drawColor`: Màu sắc
  - `float drawLineHeight`: Độ dày đường
  - `List<HTPoint> pointList`: Danh sách các điểm

**Geometry Calculations**:

```java
// Tính khoảng cách giữa 2 điểm
public static float distance(HTPoint p1, HTPoint p2);

// Tính trung điểm
public static HTPoint centerPoint(HTPoint p1, HTPoint p2);

// Tính khoảng cách từ điểm đến đường thẳng
public static float pedalPoint(HTPoint p1, HTPoint p2, HTPoint x0);
```

#### `HTDrawType.java`

- **Chức năng**: Enum định nghĩa các loại drawing tools
- **Types**:
  - `line`: Đường thẳng (2 điểm)
  - `horizontalLine`: Đường ngang (2 điểm)
  - `verticalLine`: Đường dọc (2 điểm)
  - `halfLine`: Tia (2 điểm)
  - `rectangle`: Hình chữ nhật (2 điểm)
  - `parallelLine`: Đường song song (3 điểm)
  - `parallelogram`: Hình bình hành (3 điểm)

### 5. Data Layer

#### `KLineEntity.java`

- **Chức năng**: Main data entity cho K-line data
- **Implements**: `IKLine` (extends tất cả indicator interfaces)
- **OHLC Data**:
  - `float Open, High, Low, Close`: Giá mở, cao, thấp, đóng
  - `float Volume`: Khối lượng
  - `String Date`: Ngày tháng

**Technical Indicators**:

```java
// MA indicators
public float MA5Price, MA10Price, MA20Price, MA30Price, MA60Price;

// BOLL indicators
public float up, mb, dn;

// MACD indicators
public float dea, dif, macd;

// KDJ indicators
public float k, d, j;

// RSI indicators
public float rsi;

// WR indicators
public float wr;
```

#### `DataHelper.java`

- **Chức năng**: Tính toán các chỉ báo kỹ thuật
- **Methods**:
  - `calculateRSI()`: Tính RSI (Relative Strength Index)
  - `calculateKDJ()`: Tính KDJ (Stochastic Oscillator)
  - `calculateWR()`: Tính WR (Williams %R)
  - `calculateMACD()`: Tính MACD (Moving Average Convergence Divergence)
  - `calculateBOLL()`: Tính BOLL (Bollinger Bands)
  - `calculateMA()`: Tính MA (Moving Average)

**RSI Calculation Example**:

```java
static void calculateRSI(List<KLineEntity> dataList) {
    float rsiABSEma = 0;
    float rsiMaxEma = 0;
    for (int i = 0; i < dataList.size(); i++) {
        KLineEntity point = dataList.get(i);
        if (i > 0) {
            float Rmax = Math.max(0, closePrice - dataList.get(i - 1).getClosePrice());
            float RAbs = Math.abs(closePrice - dataList.get(i - 1).getClosePrice());

            rsiMaxEma = (Rmax + (14f - 1) * rsiMaxEma) / 14f;
            rsiABSEma = (RAbs + (14f - 1) * rsiABSEma) / 14f;
            rsi = (rsiMaxEma / rsiABSEma) * 100;
        }
        point.rsi = rsi;
    }
}
```

### 6. Drawing Components

#### `MainDraw.java`

- **Chức năng**: Vẽ main chart (candles, MA, BOLL)
- **Implements**: `IChartDraw<ICandle>`
- **Paint Objects**:
  - `mLinePaint`: Cho đường line
  - `mRedPaint, mGreenPaint`: Cho nến tăng/giảm
  - `ma5Paint, ma10Paint, ma30Paint`: Cho MA lines
  - `minuteGradientPaint`: Cho minute chart gradient

**Candle Drawing**:

```java
public void drawCandle(Canvas canvas, ICandle curPoint, float x, BaseKLineChartView view) {
    float r = mCandleWidth / 2;
    float high = view.getMainY(curPoint.getHighPrice());
    float low = view.getMainY(curPoint.getLowPrice());
    float open = view.getMainY(curPoint.getOpenPrice());
    float close = view.getMainY(curPoint.getClosePrice());

    // Vẽ body và wick của nến
    if (curPoint.getClosePrice() >= curPoint.getOpenPrice()) {
        // Nến tăng - màu đỏ
        canvas.drawRect(x - r, close, x + r, open, mRedPaint);
    } else {
        // Nến giảm - màu xanh
        canvas.drawRect(x - r, open, x + r, close, mGreenPaint);
    }
}
```

#### `VolumeDraw.java`

- **Chức năng**: Vẽ volume chart
- **Implements**: `IChartDraw<IVolume>`
- **Features**:
  - Volume histogram
  - MA volume lines
  - Color coding theo giá đóng cửa

#### `MACDDraw.java`

- **Chức năng**: Vẽ MACD indicator
- **Components**:
  - DIF line (blue)
  - DEA line (yellow)
  - MACD histogram (red/green bars)

#### `KDJDraw.java`

- **Chức năng**: Vẽ KDJ indicator
- **Components**:
  - K line (blue)
  - D line (yellow)
  - J line (purple)

### 7. Configuration Management

#### `HTKLineConfigManager.java`

- **Chức năng**: Quản lý tất cả cấu hình của chart
- **Data Configuration**:
  - `List<KLineEntity> modelArray`: Data array
  - `Boolean shouldScrollToEnd`: Auto scroll to end

**Drawing Configuration**:

```java
public HTDrawType drawType = HTDrawType.none;
public int drawColor = Color.RED;
public float drawLineHeight = 1;
public float drawDashWidth = 1;
public float drawDashSpace = 1;
public Boolean drawIsLock = false;
public Boolean drawShouldContinue = false;
```

**Chart Configuration**:

```java
public PrimaryStatus primaryStatus = PrimaryStatus.MA;  // MA, BOLL, NONE
public SecondStatus secondStatus = SecondStatus.MACD;   // MACD, KDJ, RSI, WR, NONE
public Boolean isMinute = false;                        // Minute chart mode

// Colors
public int increaseColor = Color.RED;                   // Rising color
public int decreaseColor = Color.GREEN;                 // Falling color
public int minuteLineColor = Color.BLUE;                // Minute line color

// Layout
public float itemWidth = 9;                             // Item width
public float candleWidth = 7;                           // Candle width
public float mainFlex = 0.716f;                         // Main chart flex
public float volumeFlex = 0.122f;                       // Volume chart flex
```

**Event Callbacks**:

```java
public Callback onDrawItemComplete;     // Drawing item completed
public Callback onDrawItemDidTouch;     // Drawing item touched
public Callback onDrawPointComplete;    // Drawing point completed
```

### 8. Utility Layer

#### `ValueFormatter.java`

- **Chức năng**: Format giá trị số
- **Features**:
  - Price formatting với decimal places
  - Volume formatting
  - Big number formatting
  - Customizable precision

```java
public String format(float value, int rightLength, boolean fillzero) {
    String numberString = String.valueOf(value);
    numberString = new BigDecimal(numberString).toPlainString();
    // Format với số chữ số thập phân cố định
    return numberString;
}
```

#### `DateFormatter.java`

- **Chức năng**: Format ngày tháng
- **Uses**: `DateUtil.DateFormat` (yyyy/MM/dd format)

#### `ViewUtil.java`

- **Chức năng**: Utility functions cho view
- **Methods**:
  - `Dp2Px()`: Convert dp to pixels
  - `Px2Dp()`: Convert pixels to dp

## 🔄 Data Flow

### 1. Initialization Flow

```
React Native → RNKLineView → HTKLineContainerView → KLineChartView → BaseKLineChartView
```

### 2. Data Processing Flow

```
Raw Data → KLineEntity → DataHelper.calculateXXX() → Processed Data → Chart Rendering
```

### 3. Drawing Flow

```
Touch Event → HTKLineContainerView → HTDrawContext → HTDrawItem → Canvas Drawing
```

### 4. Event Flow

```
Native Event → HTKLineContainerView → RNKLineView → React Native Bridge → JavaScript
```

## 🎨 Rendering Pipeline

### 1. Main Chart Rendering

```java
// BaseKLineChartView.onDraw()
1. Draw background với backgroundColor
2. Draw grid lines với gridColor
3. Calculate visible range (mStartIndex, mStopIndex)
4. Draw main chart:
   - Candles (MainDraw.drawCandle)
   - MA lines (MainDraw.drawMA)
   - BOLL bands (MainDraw.drawBOLL)
5. Draw volume chart (VolumeDraw.drawHistogram)
6. Draw child indicators:
   - MACD (MACDDraw.drawTranslated)
   - KDJ (KDJDraw.drawTranslated)
   - RSI (RSIDraw.drawTranslated)
   - WR (WRDraw.drawTranslated)
7. Draw crosshair khi long press
8. Draw drawing items (HTDrawContext.onDraw)
9. Draw text labels và values
```

### 2. Drawing System Rendering

```java
// HTDrawContext.onDraw()
1. Iterate through drawItemList
2. For each drawItem, iterate through pointList
3. Calculate line segments for each point:
   - HTDrawItem.lineListWithIndex()
   - Handle different draw types (line, rectangle, etc.)
4. Draw lines với appropriate styling:
   - drawLine() với color, thickness, dash pattern
5. Draw control points cho selected items:
   - Circle với alpha background
   - Solid circle cho control point
```

## ⚡ Performance Optimizations

### 1. Canvas Optimization

- **Paint Reuse**: Reuse Paint objects để tránh allocation
- **Path-based Drawing**: Sử dụng Path objects cho complex shapes
- **Clipping**: Sử dụng canvas clipping cho rounded corners
- **Anti-aliasing**: Enable anti-aliasing cho smooth rendering

### 2. Touch Optimization

- **Early Return**: Return early từ touch handlers khi possible
- **Hit Testing**: Efficient hit testing cho drawing items
- **Gesture State Management**: Proper state management cho gestures

### 3. Memory Management

- **Object Pooling**: Reuse objects khi possible
- **Lazy Loading**: Load data chỉ khi needed
- **Efficient Calculations**: Optimize mathematical calculations

### 4. Rendering Optimization

- **Visible Range Calculation**: Chỉ render visible items
- **Dirty Region**: Chỉ invalidate changed regions
- **Hardware Acceleration**: Sử dụng hardware acceleration khi available

## 🔧 Customization Points

### 1. Adding New Drawing Tools

```java
// 1. Add to HTDrawType enum
public enum HTDrawType {
    // ... existing types
    fibonacciRetracement;  // Add new tool
}

// 2. Implement logic in HTDrawItem.lineListWithIndex()
case fibonacciRetracement: {
    // Implement fibonacci retracement logic
    // Calculate fibonacci levels
    // Return line segments
}

// 3. Update count() method
public int count() {
    if (this == fibonacciRetracement) {
        return 2; // Required number of points
    }
    // ... existing cases
}
```

### 2. Adding New Indicators

```java
// 1. Create new draw class
public class StochasticDraw implements IChartDraw<IStochastic> {
    private Paint mKPaint, mDPaint;

    @Override
    public void drawTranslated(@Nullable IStochastic lastPoint, @NonNull IStochastic curPoint,
                              float lastX, float curX, @NonNull Canvas canvas,
                              @NonNull BaseKLineChartView view, int position) {
        // Draw stochastic lines
    }

    @Override
    public void drawText(@NonNull Canvas canvas, @NonNull BaseKLineChartView view,
                        int position, float x, float y) {
        // Draw stochastic text
    }

    @Override
    public float getMaxValue(IStochastic point) {
        return Math.max(point.getK(), point.getD());
    }

    @Override
    public float getMinValue(IStochastic point) {
        return Math.min(point.getK(), point.getD());
    }

    @Override
    public IValueFormatter getValueFormatter() {
        return new ValueFormatter();
    }
}

// 2. Add to KLineChartView
private StochasticDraw mStochasticDraw;

private void initView() {
    // ... existing initialization
    mStochasticDraw = new StochasticDraw(this);
    addChildDraw(mStochasticDraw);
}

// 3. Add to SecondStatus enum
public enum SecondStatus {
    MACD, KDJ, RSI, WR, STOCHASTIC, NONE
}

// 4. Update changeSecondDrawType method
case STOCHASTIC: {
    setChildDraw(4);  // Index of stochastic draw
    break;
}
```

### 3. Custom Styling

```java
// Modify HTKLineConfigManager
public class HTKLineConfigManager {
    // Custom colors
    public int customPrimaryColor = Color.BLUE;
    public int customSecondaryColor = Color.CYAN;

    // Custom fonts
    public String customFontFamily = "Roboto";
    public float customFontSize = 14f;

    // Custom line styles
    public float customLineWidth = 2.0f;
    public float customDashWidth = 5.0f;
    public float customDashSpace = 3.0f;

    // Custom layout
    public float customPadding = 20f;
    public float customMargin = 10f;
}
```

### 4. Custom Data Processing

```java
// Extend DataHelper
public class CustomDataHelper extends DataHelper {
    // Custom indicator calculation
    public static void calculateCustomIndicator(List<KLineEntity> dataList, int period) {
        for (int i = period; i < dataList.size(); i++) {
            KLineEntity point = dataList.get(i);
            // Calculate custom indicator
            float customValue = calculateCustomValue(dataList, i, period);
            point.customIndicator = customValue;
        }
    }

    private static float calculateCustomValue(List<KLineEntity> dataList, int index, int period) {
        // Custom calculation logic
        return 0.0f;
    }
}
```

## 🚀 Advanced Features

### 1. Screenshot Functionality

- **Real-time Capture**: Capture chart state during touch
- **Scaled Rendering**: Apply scale transformations (1.5x)
- **Clipping**: Round corner clipping cho thumbnails
- **Bitmap Manipulation**: Efficient bitmap operations

### 2. Gesture Recognition

- **Multi-touch Support**: Handle multiple touch points
- **Long Press Detection**: Detect long press gestures
- **Scale Gestures**: Pinch-to-zoom functionality (0.5x - 2.0x)
- **Scroll Gestures**: Pan functionality với momentum
- **Drawing Gestures**: Touch-based drawing system

### 3. Drawing System

- **Multiple Drawing Tools**:
  - Line, Horizontal Line, Vertical Line
  - Ray, Rectangle, Parallelogram
  - Parallel Lines
- **Interactive Editing**: Drag and drop drawing items
- **Visual Feedback**: Highlight selected items với control points
- **Persistence**: Save và restore drawing state
- **Customization**: Custom colors, line styles, dash patterns

### 4. Technical Indicators

- **Moving Averages**: MA5, MA10, MA20, MA30, MA60
- **Bollinger Bands**: Upper, Middle, Lower bands
- **MACD**: DIF, DEA, MACD histogram
- **KDJ**: K, D, J lines
- **RSI**: Relative Strength Index
- **WR**: Williams %R
- **Volume**: Volume histogram với MA volume lines

### 5. Chart Types

- **Candlestick Chart**: Standard OHLC candles
- **Minute Chart**: Line chart với gradient fill
- **Volume Chart**: Volume histogram
- **Multi-panel Layout**: Main chart + volume + indicators

## 🔍 Debugging và Troubleshooting

### 1. Common Issues

- **Memory Leaks**: Ensure proper cleanup của Paint objects
- **Performance Issues**: Check visible range calculation
- **Touch Issues**: Verify gesture detector setup
- **Rendering Issues**: Check canvas state và clipping

### 2. Debug Tools

- **Logging**: Use Android Log để debug
- **Canvas Debug**: Override onDraw để add debug info
- **Touch Debug**: Log touch events để debug gestures
- **Performance Profiling**: Use Android Studio profiler

### 3. Best Practices

- **Thread Safety**: Ensure UI updates on main thread
- **Memory Management**: Proper cleanup của resources
- **Error Handling**: Handle edge cases gracefully
- **Testing**: Test với different data sizes và configurations

## 📚 API Reference

### HTKLineConfigManager Properties

```java
// Data
List<KLineEntity> modelArray
Boolean shouldScrollToEnd

// Drawing
HTDrawType drawType
int drawColor
float drawLineHeight
Boolean drawShouldContinue

// Chart
PrimaryStatus primaryStatus
SecondStatus secondStatus
Boolean isMinute

// Colors
int increaseColor
int decreaseColor
int minuteLineColor

// Layout
float itemWidth
float candleWidth
float mainFlex
float volumeFlex

// Callbacks
Callback onDrawItemComplete
Callback onDrawItemDidTouch
Callback onDrawPointComplete
```

### HTDrawType Values

```java
none              // No drawing
line              // Line (2 points)
horizontalLine    // Horizontal line (2 points)
verticalLine      // Vertical line (2 points)
halfLine          // Ray (2 points)
parallelLine      // Parallel lines (3 points)
rectangle         // Rectangle (2 points)
parallelogram     // Parallelogram (3 points)
```

### PrimaryStatus Values

```java
MA      // Moving Average
BOLL    // Bollinger Bands
NONE    // No primary indicator
```

### SecondStatus Values

```java
MACD    // MACD indicator
KDJ     // KDJ indicator
RSI     // RSI indicator
WR      // WR indicator
NONE    // No secondary indicator
```

## 🎯 Kết luận

Thư viện `react-native-kline-view` Android là một solution hoàn chỉnh và mạnh mẽ cho việc hiển thị biểu đồ K-line trong React Native. Với kiến trúc modular, khả năng tùy chỉnh cao, và hiệu suất tối ưu, thư viện cung cấp:

- **Complete K-line Chart**: Candlestick, volume, technical indicators
- **Advanced Drawing System**: Multiple drawing tools với interactive editing
- **High Performance**: Optimized rendering và memory management
- **Rich Customization**: Colors, fonts, layouts, behaviors
- **Professional Features**: Screenshot, gesture recognition, multi-touch
- **Extensible Architecture**: Easy to add new indicators và drawing tools

Thư viện phù hợp cho các ứng dụng tài chính, trading, và bất kỳ ứng dụng nào cần hiển thị dữ liệu biểu đồ chuyên nghiệp.
