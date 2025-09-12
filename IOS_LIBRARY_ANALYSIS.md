# 📊 React Native K-Line View - iOS Library Analysis

## 🎯 Tổng quan

Thư viện `react-native-kline-view` iOS là một thư viện mạnh mẽ và toàn diện để hiển thị biểu đồ K-line (nến) trong ứng dụng React Native trên iOS. Thư viện được viết bằng Swift và được thiết kế theo kiến trúc modular với khả năng tùy chỉnh cao và hiệu suất tối ưu.

## 🏗️ Kiến trúc tổng thể

```
┌─────────────────────────────────────┐
│        React Native Layer          │
│  (RNKLineView.swift, RNKLineView.m)│
├─────────────────────────────────────┤
│        Container Layer              │
│  (HTKLineContainerView.swift)       │
├─────────────────────────────────────┤
│        Chart Layer                  │
│  (HTKLineView.swift)                │
├─────────────────────────────────────┤
│        Drawing Layer                │
│  (HTDrawContext.swift, HTDrawItem)  │
├─────────────────────────────────────┤
│        Data Layer                   │
│  (HTKLineModel.swift, HTKLineConfigManager)│
├─────────────────────────────────────┤
│        Drawing Components           │
│  (HTMainDraw, HTVolumeDraw, etc.)   │
└─────────────────────────────────────┘
```

## 📁 Cấu trúc thư mục

```
ios/Classes/
├── Bridge.h                          # Objective-C bridge header
├── RNKLineView.swift                 # React Native view manager (Swift)
├── RNKLineView.m                     # React Native view manager (Objective-C)
├── HTKLineContainerView.swift        # Main container view
├── HTKLineView.swift                 # Main chart view
├── HTKLineConfigManager.swift        # Configuration manager
├── HTKLineModel.swift                # Data models
├── HTKLineDrawProtocol.swift         # Drawing protocol
├── HTDrawContext.swift               # Drawing context manager
├── HTDrawItem.swift                  # Drawing item model
├── HTShotView.swift                  # Screenshot functionality
├── HTMainDraw.swift                  # Main chart drawing
├── HTVolumeDraw.swift                # Volume chart drawing
├── HTMacdDraw.swift                  # MACD indicator drawing
├── HTKdjDraw.swift                   # KDJ indicator drawing
├── HTRsiDraw.swift                   # RSI indicator drawing
└── HTWrDraw.swift                    # WR indicator drawing
```

## 🔧 Các thành phần chính

### 1. React Native Integration Layer

#### `RNKLineView.swift` - Swift View Manager

```swift
@objc(RNKLineView)
@objcMembers
class RNKLineView: RCTViewManager {
    static let queue = DispatchQueue.init(label: "com.hublot.klinedata")

    override func view() -> UIView! {
        return HTKLineContainerView()
    }

    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
```

**Chức năng:**

- **View Manager**: Quản lý view cho React Native
- **Background Queue**: Xử lý data parsing trong background thread
- **Main Queue Setup**: Yêu cầu setup trên main thread

#### `RNKLineView.m` - Objective-C Bridge

```objc
@interface RCT_EXTERN_MODULE(RNKLineView, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(onDrawItemDidTouch, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDrawItemComplete, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDrawPointComplete, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(optionList, NSString)

@end
```

**Chức năng:**

- **Event Exports**: Export các events cho React Native
- **Props Export**: Export props cho React Native
- **Bridge**: Kết nối Swift code với React Native

### 2. Container Layer

#### `HTKLineContainerView.swift` - Main Container

```swift
class HTKLineContainerView: UIView {
    var configManager = HTKLineConfigManager()

    @objc var onDrawItemDidTouch: RCTBubblingEventBlock?
    @objc var onDrawItemComplete: RCTBubblingEventBlock?
    @objc var onDrawPointComplete: RCTBubblingEventBlock?

    @objc var optionList: String? {
        didSet {
            // Parse JSON và cập nhật config trong background thread
            RNKLineView.queue.async { [weak self] in
                // JSON parsing logic
                DispatchQueue.main.async {
                    self?.reloadConfigManager(self?.configManager)
                }
            }
        }
    }
}
```

**Chức năng:**

- **Props Handling**: Xử lý props từ React Native
- **Background Processing**: Parse JSON trong background thread
- **Event Callbacks**: Gửi events về React Native
- **Touch Handling**: Xử lý touch events cho drawing

**Touch Event Handling:**

```swift
override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    touchesGesture(touches, .began)
}

override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
    touchesGesture(touches, .changed)
}

override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    touchesGesture(touches, .ended)
}

func touchesGesture(_ touched: Set<UITouch>, _ state: UIGestureRecognizerState) {
    guard var location = touched.first?.location(in: self) else {
        shotView.shotPoint = nil
        return
    }
    // Convert location và xử lý drawing gestures
    klineView.drawContext.touchesGesture(location, translation, state)
    shotView.shotPoint = state != .ended ? touched.first?.location(in: self) : nil
}
```

### 3. Chart Layer

#### `HTKLineView.swift` - Main Chart View

```swift
class HTKLineView: UIScrollView {
    var configManager: HTKLineConfigManager
    lazy var drawContext: HTDrawContext = {
        let drawContext = HTDrawContext.init(self, configManager)
        return drawContext
    }()

    // Drawing components
    let mainDraw = HTMainDraw.init()
    let volumeDraw = HTVolumeDraw.init()
    let macdDraw = HTMacdDraw.init()
    let kdjDraw = HTKdjDraw.init()
    let rsiDraw = HTRsiDraw.init()
    let wrDraw = HTWrDraw.init()

    var childDraw: HTKLineDrawProtocol?
    var animationView = LottieAnimationView()
}
```

**Chức năng:**

- **ScrollView**: Kế thừa UIScrollView cho scroll functionality
- **Drawing Context**: Quản lý drawing system
- **Drawing Components**: Các component vẽ chart và indicators
- **Lottie Animation**: Hỗ trợ Lottie animations

**Gesture Handling:**

```swift
init(_ frame: CGRect, _ configManager: HTKLineConfigManager) {
    // ... initialization
    addGestureRecognizer(UILongPressGestureRecognizer.init(target: self, action: #selector(longPressSelector)))
    addGestureRecognizer(UITapGestureRecognizer.init(target: self, action: #selector(tapSelector)))
    addGestureRecognizer(UIPinchGestureRecognizer.init(target: self, action: #selector(pinchSelector)))
}

@objc func longPressSelector(_ gesture: UILongPressGestureRecognizer) {
    let index = Int(floor(gesture.location(in: self).x / configManager.itemWidth))
    selectedIndex = index
    self.setNeedsDisplay()
}

@objc func pinchSelector(_ gesture: UIPinchGestureRecognizer) {
    switch gesture.state {
    case .changed:
        scale += (gesture.scale - 1) / 10
    default:
        break
    }
    scale = max(0.3, min(scale, 3))
    // Update content size và offset
}
```

**Rendering Pipeline:**

```swift
override func draw(_ rect: CGRect) {
    guard let context = UIGraphicsGetCurrentContext(), configManager.modelArray.count > 0 else {
        return
    }

    calculateBaseHeight()
    contextTranslate(context, CGFloat(visibleRange.lowerBound) * configManager.itemWidth, { context in
        drawCandle(context)
    })

    contextTranslate(context, contentOffset.x, { context in
        drawText(context)
        drawValue(context)
        drawHighLow(context)
        drawTime(context)
        drawClosePrice(context)
        drawSelectedLine(context)
        drawSelectedBoard(context)
        drawSelectedTime(context)
        drawContext.draw(contentOffset.x)
    })
}
```

### 4. Drawing System

#### `HTDrawContext.swift` - Drawing Context Manager

```swift
class HTDrawContext {
    var configManager: HTKLineConfigManager
    weak var klineView: HTKLineView?

    lazy var drawItemList: [HTDrawItem] = {
        let drawItemList = [HTDrawItem]()
        return drawItemList
    }()

    var breakTouch = false
}
```

**Gesture Handling:**

```swift
func touchesGesture(_ location: CGPoint, _ translation: CGPoint, _ state: UIGestureRecognizerState) {
    guard let klineView = klineView, breakTouch == false else {
        if state == .ended {
            breakTouch = false
        }
        return
    }

    switch state {
    case .began:
        // Handle touch began
        if (drawItem == nil || (drawItem?.pointList.count ?? 0) >= (drawItem?.drawType.count ?? 0)) {
            let drawItem = HTDrawItem.init(configManager.drawType, location)
            drawItemList.append(drawItem)
            configManager.onDrawItemDidTouch?(drawItem, drawItemList.count - 1)
        } else {
            drawItem?.pointList.append(location)
        }
    case .ended, .changed:
        // Handle touch moved/ended
        if let drawItem = drawItem {
            configManager.onDrawPointComplete?(drawItem, drawItemList.count - 1)
            if index == drawItem.drawType.count - 1 {
                configManager.onDrawItemComplete?(drawItem, drawItemList.count - 1)
            }
        }
    default:
        break
    }
    setNeedsDisplay()
}
```

**Rendering:**

```swift
func draw(_ contenOffset: CGFloat) {
    guard let context = UIGraphicsGetCurrentContext() else {
        return
    }
    for (itemIndex, drawItem) in drawItemList.enumerated() {
        for (index, _) in drawItem.pointList.enumerated() {
            drawMapper(context, drawItem, index, itemIndex)
        }
    }
}
```

#### `HTDrawItem.swift` - Drawing Item Model

```swift
enum HTDrawType: Int {
    case none = 0
    case line = 1
    case horizontalLine = 2
    case verticalLine = 3
    case halfLine = 4
    case parallelLine = 5
    case rectangle = 101
    case parallelogram = 102

    var count: Int {
        switch self {
        case .line, .horizontalLine, .verticalLine, .halfLine, .rectangle:
            return 2
        case .parallelLine, .parallelogram:
            return 3
        default:
            return 0
        }
    }
}

class HTDrawItem: NSObject {
    var drawType = HTDrawType.none
    var drawColor = UIColor.init(red: 0.27, green: 0.37, blue: 1, alpha: 1)
    var drawLineHeight: CGFloat = 1
    var drawDashWidth: CGFloat = 1
    var drawDashSpace: CGFloat = 1
    var drawIsLock = false
    var pointList = [CGPoint]()
    var touchMoveIndexList = [Int]()
}
```

**Geometry Calculations:**

```swift
// Tính khoảng cách giữa 2 điểm
static func distance(p1: CGPoint, p2: CGPoint) -> CGFloat {
    let a = p2.y - p1.y
    let b = p1.x - p2.x
    let d = sqrt(pow(a, 2) + pow(b, 2))
    return d
}

// Tính trung điểm
static func centerPoint(p1: CGPoint, p2: CGPoint) -> CGPoint {
    let a = p2.x + p1.x
    let b = p1.y + p2.y
    return CGPoint.init(x: a / 2.0, y: b / 2.0)
}

// Tính khoảng cách từ điểm đến đường thẳng
static func pedalPoint(p1: CGPoint, p2: CGPoint, x0: CGPoint) -> Double {
    let a = p2.y - p1.y
    let b = p1.x - p2.x
    let c = p2.x * p1.y - p1.x * p2.y
    let d = abs((a * x0.x + b * x0.y + c)) / sqrt(pow(a, 2) + pow(b, 2))
    return Double(d)
}
```

### 5. Data Layer

#### `HTKLineModel.swift` - Data Models

```swift
class HTKLineItemModel: NSObject {
    var value: CGFloat = 0
    var title = ""
    var selected = true
    var index = 0

    static func packModelArray(_ modelList: [[String: Any]]) -> [HTKLineItemModel] {
        var modelArray = [HTKLineItemModel]()
        for dictionary in modelList {
            let itemModel = HTKLineItemModel()
            itemModel.title = dictionary["title"] as? String ?? ""
            itemModel.value = dictionary["value"] as? CGFloat ?? 0
            itemModel.selected = dictionary["selected"] as? Bool ?? true
            itemModel.index = dictionary["index"] as? Int ?? 0
            if itemModel.selected {
                modelArray.append(itemModel)
            }
        }
        return modelArray
    }
}

class HTKLineModel: NSObject {
    var dateString: String = ""
    var id: CGFloat = 0
    var open: CGFloat = 0
    var high: CGFloat = 0
    var low: CGFloat = 0
    var close: CGFloat = 0
    var volume: CGFloat = 0

    // BOLL indicators
    var bollMb: CGFloat = 0
    var bollUp: CGFloat = 0
    var bollDn: CGFloat = 0

    // MA indicators
    var maList = [HTKLineItemModel]()
    var maVolumeList = [HTKLineItemModel]()

    // MACD indicators
    var macdValue: CGFloat = 0
    var macdDea: CGFloat = 0
    var macdDif: CGFloat = 0

    // KDJ indicators
    var kdjK: CGFloat = 0
    var kdjD: CGFloat = 0
    var kdjJ: CGFloat = 0

    // RSI indicators
    var rsiList = [HTKLineItemModel]()

    // WR indicators
    var wrList = [HTKLineItemModel]()

    var selectedItemList = [[String: Any]]()

    lazy var increment: Bool = {
        let increment = close >= open
        return increment
    }()
}
```

#### `HTKLineConfigManager.swift` - Configuration Manager

```swift
enum HTKLineMainType: Int {
    case none = -1
    case ma = 1
    case boll = 2
}

enum HTKLineChildType: Int {
    case none = -1
    case macd = 3
    case kdj = 4
    case rsi = 5
    case wr = 6
}

enum HTKLineDrawType: Int {
    case none = 0
    case line = 1
    case horizontalLine = 2
    case verticalLine = 3
    case halfLine = 4
    case parallelLine = 5
    case rectangle = 6
    case parallelogram = 7
}

enum HTDrawState: Int {
    case none = -3
    case showPencil = -2
    case showContext = -1
}

class HTKLineConfigManager: NSObject {
    var modelArray = [HTKLineModel]()
    var shouldScrollToEnd = true

    // Drawing configuration
    var drawShouldContinue = false
    var drawType = HTKLineDrawType.none
    var drawColor = UIColor.orange
    var drawLineHeight: CGFloat = 0.5
    var drawDashWidth: CGFloat = 1
    var drawDashSpace: CGFloat = 1
    var drawIsLock = false

    // Chart configuration
    var primary: Int = 0
    var second: Int = 0
    var time = 1
    var price: Int = 4
    var volume: Int = 4

    // Layout
    var itemWidth: CGFloat = 9
    var candleWidth: CGFloat = 7
    var paddingTop: CGFloat = 0
    var paddingRight: CGFloat = 0
    var paddingBottom: CGFloat = 0
    var mainFlex: CGFloat = 0
    var volumeFlex: CGFloat = 0

    // Colors
    var increaseColor = UIColor.red
    var decreaseColor = UIColor.green
    var minuteLineColor = UIColor.blue
    var targetColorList = [UIColor]()

    // Fonts
    var fontFamily = ""
    var textColor = UIColor.white
    var headerTextFontSize: CGFloat = 10
    var rightTextFontSize: CGFloat = 10
    var candleTextFontSize: CGFloat = 10
    var candleTextColor = UIColor.orange

    // Callbacks
    var onDrawItemDidTouch: HTKLineDrawItemBlock?
    var onDrawItemComplete: HTKLineDrawItemBlock?
    var onDrawPointComplete: HTKLineDrawItemBlock?
}
```

**JSON Parsing:**

```swift
func reloadOptionList(_ optionList: [String: Any]) {
    // Parse model array
    if let modelList = optionList["modelArray"] as? [[String: Any]] {
        modelArray = HTKLineModel.packModelArray(modelList)
    }

    // Parse target list
    if let targetList = optionList["targetList"] as? [String: Any] {
        maList = HTKLineItemModel.packModelArray(targetList["maList"] as? [[String: Any]] ?? [])
        maVolumeList = HTKLineItemModel.packModelArray(targetList["maVolumeList"] as? [[String: Any]] ?? [])
        rsiList = HTKLineItemModel.packModelArray(targetList["rsiList"] as? [[String: Any]] ?? [])
        wrList = HTKLineItemModel.packModelArray(targetList["wrList"] as? [[String: Any]] ?? [])
        // Parse indicator parameters
    }

    // Parse draw list
    if let drawList = optionList["drawList"] as? [String: Any] {
        // Parse drawing configuration
    }

    // Parse config list
    if let configList = optionList["configList"] as? [String: Any] {
        // Parse chart configuration
    }
}
```

### 6. Drawing Components

#### `HTKLineDrawProtocol.swift` - Drawing Protocol

```swift
protocol HTKLineDrawProtocol: class {
    func minMaxRange(_ visibleModelArray: [HTKLineModel], _ configManager: HTKLineConfigManager) -> Range<CGFloat>
    func drawCandle(_ model: HTKLineModel, _ index: Int, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager)
    func drawLine(_ model: HTKLineModel, _ lastModel: HTKLineModel, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ index: Int, _ lastIndex: Int, _ context: CGContext, _ configManager: HTKLineConfigManager)
    func drawText(_ model: HTKLineModel, _ baseX: CGFloat, _ baseY: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager)
    func drawValue(_ maxValue: CGFloat, _ minValue: CGFloat, _ baseX: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager)
}
```

**Extension với Common Methods:**

```swift
extension HTKLineDrawProtocol {
    func drawCandle(high: CGFloat, low: CGFloat, maxValue: CGFloat, minValue: CGFloat, baseY: CGFloat, height: CGFloat, index: Int, width: CGFloat, color: UIColor, verticalAlignBottom: Bool, context: CGContext, configManager: HTKLineConfigManager) {
        let itemWidth = configManager.itemWidth
        let scale = (maxValue - minValue) / height
        let paddingHorizontal = (itemWidth - width) / 2.0
        let x = CGFloat(index) * itemWidth + paddingHorizontal
        let y = baseY + (maxValue - high) / scale
        let height = (high - (!verticalAlignBottom ? low : minValue)) / scale
        context.setFillColor(color.cgColor)
        context.fill(CGRect.init(x: x, y: y, width: width, height: height))
    }

    func drawLine(value: CGFloat, lastValue: CGFloat, maxValue: CGFloat, minValue: CGFloat, baseY: CGFloat, height: CGFloat, index: Int, lastIndex: Int, color: UIColor, isBezier: Bool, context: CGContext, configManager: HTKLineConfigManager) {
        let width = configManager.lineWidth
        let path = createLinePath(value: value, lastValue: lastValue, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, lastIndex: lastIndex, isBezier: isBezier, existPath: nil, context: context, configManager: configManager)
        context.addPath(path.cgPath)
        context.setStrokeColor(color.cgColor)
        context.setLineWidth(width)
        context.drawPath(using: .stroke)
    }
}
```

#### `HTMainDraw.swift` - Main Chart Drawing

```swift
class HTMainDraw: NSObject, HTKLineDrawProtocol {
    func minMaxRange(_ visibleModelArray: [HTKLineModel], _ configManager: HTKLineConfigManager) -> Range<CGFloat> {
        var maxValue = CGFloat.leastNormalMagnitude
        var minValue = CGFloat.greatestFiniteMagnitude

        for model in visibleModelArray {
            var valueList = [model.high, model.low]
            switch configManager.mainType {
            case .ma:
                valueList.append(contentsOf: model.maList.map({ $0.value }))
            case .boll:
                valueList.append(contentsOf: [model.bollMb, model.bollUp, model.bollDn])
            default:
                break
            }
            maxValue = max(maxValue, valueList.max() ?? 0)
            minValue = min(minValue, valueList.min() ?? 0)
        }
        return Range<CGFloat>.init(uncheckedBounds: (lower: minValue, upper: maxValue))
    }

    func drawCandle(_ model: HTKLineModel, _ index: Int, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        let color = model.increment ? configManager.increaseColor : configManager.decreaseColor
        if (configManager.isMinute) {
            // Draw minute chart
        } else {
            // Draw candlestick chart
            drawCandle(high: findValue(true), low: findValue(false), maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, width: configManager.candleWidth, color: color, verticalAlignBottom: false, context: context, configManager: configManager)
            drawCandle(high: model.high, low: model.low, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, width: configManager.candleLineWidth, color: color, verticalAlignBottom: false, context: context, configManager: configManager)
        }
    }
}
```

#### `HTVolumeDraw.swift` - Volume Chart Drawing

```swift
class HTVolumeDraw: NSObject, HTKLineDrawProtocol {
    func drawCandle(_ model: HTKLineModel, _ index: Int, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        var color = model.increment ? configManager.increaseColor : configManager.decreaseColor
        var width = configManager.candleWidth
        if (configManager.isMinute) {
            color = configManager.minuteVolumeCandleColor
            width = configManager.minuteVolumeCandleWidth
        }
        drawCandle(high: model.volume, low: minValue, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, width: width, color: color, verticalAlignBottom: true, context: context, configManager: configManager)
    }
}
```

#### `HTMacdDraw.swift` - MACD Indicator Drawing

```swift
class HTMacdDraw: NSObject, HTKLineDrawProtocol {
    func drawCandle(_ model: HTKLineModel, _ index: Int, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        let color = model.macdValue > 0 ? configManager.increaseColor : configManager.decreaseColor
        let valueList = [model.macdValue, 0]
        let high = valueList.max() ?? 0
        let low = valueList.min() ?? 0
        drawCandle(high: high, low: low, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, width: configManager.macdCandleWidth, color: color, verticalAlignBottom: false, context: context, configManager: configManager)
    }

    func drawLine(_ model: HTKLineModel, _ lastModel: HTKLineModel, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ index: Int, _ lastIndex: Int, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        let itemList = [
            ["value": model.macdDif, "lastValue": lastModel.macdDif, "color": configManager.targetColorList[0]],
            ["value": model.macdDea, "lastValue": lastModel.macdDea, "color": configManager.targetColorList[1]],
        ]
        for item in itemList {
            drawLine(value: item["value"] as? CGFloat ?? 0, lastValue: item["lastValue"] as? CGFloat ?? 0, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, lastIndex: lastIndex, color: item["color"] as? UIColor ?? UIColor.orange, isBezier: false, context: context, configManager: configManager)
        }
    }
}
```

### 7. Screenshot Functionality

#### `HTShotView.swift` - Screenshot View

```swift
class HTShotView: UIView {
    var shotView: UIView?
    var shotColor: UIColor?
    var shotPoint: CGPoint? {
        didSet {
            reloadImage()
        }
    }
    var dimension: CGFloat = 100

    lazy var imageView: UIImageView = {
        let imageView = UIImageView.init(frame: CGRect.zero)
        imageView.contentMode = .center
        return imageView
    }()
}
```

**Screenshot Generation:**

```swift
func reloadImage() -> Void {
    guard let shotView = shotView, let shotPoint = shotPoint else {
        imageView.isHidden = true
        return
    }
    let scale = UIScreen.main.scale

    // Render view to image
    UIGraphicsBeginImageContextWithOptions(shotView.bounds.size, false, scale)
    shotView.layer.render(in: UIGraphicsGetCurrentContext()!)
    var image = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()

    // Add background color
    let insetBounds = shotView.bounds.insetBy(dx: -dimension, dy: -dimension)
    UIGraphicsBeginImageContextWithOptions(insetBounds.size, false, scale)
    shotColor?.set()
    UIRectFill(insetBounds)
    image?.draw(at: CGPoint.init(x: dimension, y: dimension))
    image = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()

    // Crop to dimension
    let radius = dimension / 2.0
    let rect = CGRect.init(x: shotPoint.x - radius + dimension, y: shotPoint.y - radius + dimension, width: dimension, height: dimension)
    let frame = CGRect.init(x: rect.origin.x * scale, y: rect.origin.y * scale, width: rect.size.width * scale, height: rect.size.height * scale)

    guard let imageRef = image?.cgImage?.cropping(to: frame), let orientation = image?.imageOrientation else {
        return
    }

    image = UIImage.init(cgImage: imageRef, scale: scale / 1.5, orientation: orientation)
    imageView.image = image
    imageView.isHidden = false
}
```

## 🔄 Data Flow

### 1. Initialization Flow

```
React Native → RNKLineView.m → RNKLineView.swift → HTKLineContainerView → HTKLineView
```

### 2. Data Processing Flow

```
JSON String → HTKLineContainerView.optionList → Background Thread → HTKLineConfigManager.reloadOptionList() → Main Thread → HTKLineView.reloadConfigManager()
```

### 3. Drawing Flow

```
Touch Event → HTKLineContainerView → HTDrawContext → HTDrawItem → Core Graphics Drawing
```

### 4. Event Flow

```
Native Event → HTKLineContainerView → RCTBubblingEventBlock → React Native Bridge → JavaScript
```

## 🎨 Rendering Pipeline

### 1. Main Chart Rendering

```swift
// HTKLineView.draw()
1. Calculate base height và visible range
2. Draw candles với context translation
3. Draw text, values, high/low indicators
4. Draw time labels
5. Draw close price indicator
6. Draw selected line và board
7. Draw selected time
8. Draw drawing items
```

### 2. Drawing System Rendering

```swift
// HTDrawContext.draw()
1. Iterate through drawItemList
2. For each drawItem, iterate through pointList
3. Calculate line segments for each point
4. Draw lines với appropriate styling
5. Draw control points cho selected items
```

## ⚡ Performance Optimizations

### 1. Background Processing

- **JSON Parsing**: Parse JSON trong background thread
- **Main Thread Updates**: UI updates chỉ trên main thread
- **Queue Management**: Sử dụng dedicated queue cho data processing

### 2. Memory Management

- **Weak References**: Sử dụng weak references để tránh retain cycles
- **Lazy Loading**: Lazy initialization của expensive objects
- **Image Caching**: Efficient image caching cho screenshots

### 3. Rendering Optimization

- **Visible Range**: Chỉ render visible items
- **Context Translation**: Efficient context transformations
- **Path Reuse**: Reuse drawing paths khi possible

### 4. Touch Optimization

- **Hit Testing**: Efficient hit testing cho drawing items
- **Gesture Recognition**: Proper gesture state management
- **Touch Delegation**: Proper touch event delegation

## 🔧 Customization Points

### 1. Adding New Drawing Tools

```swift
// 1. Add to HTDrawType enum
enum HTDrawType: Int {
    // ... existing types
    case fibonacciRetracement = 8
}

// 2. Update count property
var count: Int {
    switch self {
    // ... existing cases
    case .fibonacciRetracement:
        return 2
    default:
        return 0
    }
}

// 3. Implement logic in HTDrawItem.lineListWithIndex()
case .fibonacciRetracement:
    // Implement fibonacci retracement logic
    return [(point, lastPoint)]
```

### 2. Adding New Indicators

```swift
// 1. Create new draw class
class HTStochasticDraw: NSObject, HTKLineDrawProtocol {
    func minMaxRange(_ visibleModelArray: [HTKLineModel], _ configManager: HTKLineConfigManager) -> Range<CGFloat> {
        // Calculate stochastic range
    }

    func drawCandle(_ model: HTKLineModel, _ index: Int, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        // Draw stochastic candles
    }

    // Implement other protocol methods
}

// 2. Add to HTKLineChildType enum
enum HTKLineChildType: Int {
    // ... existing types
    case stochastic = 7
}

// 3. Add to HTKLineView
let stochasticDraw = HTStochasticDraw.init()

// 4. Update reloadConfigManager method
case .stochastic:
    childDraw = stochasticDraw
```

### 3. Custom Styling

```swift
// Extend HTKLineConfigManager
extension HTKLineConfigManager {
    var customPrimaryColor: UIColor {
        return UIColor.systemBlue
    }

    var customSecondaryColor: UIColor {
        return UIColor.systemCyan
    }

    var customFontSize: CGFloat {
        return 14.0
    }
}
```

### 4. Custom Data Processing

```swift
// Extend HTKLineModel
extension HTKLineModel {
    var customIndicator: CGFloat {
        // Calculate custom indicator
        return 0.0
    }

    static func calculateCustomIndicator(_ modelArray: [HTKLineModel], period: Int) {
        for i in period..<modelArray.count {
            let model = modelArray[i]
            // Calculate custom indicator value
            model.customIndicator = calculateValue(modelArray, index: i, period: period)
        }
    }
}
```

## 🚀 Advanced Features

### 1. Screenshot Functionality

- **Real-time Capture**: Capture chart state during touch
- **Scaled Rendering**: Apply scale transformations (1.5x)
- **Background Color**: Add background color cho screenshots
- **Corner Radius**: Round corner clipping cho thumbnails

### 2. Gesture Recognition

- **Long Press**: Detect long press gestures cho selection
- **Tap**: Handle tap gestures
- **Pinch**: Pinch-to-zoom functionality (0.3x - 3.0x)
- **Scroll**: Pan functionality với momentum

### 3. Drawing System

- **Multiple Drawing Tools**:
  - Line, Horizontal Line, Vertical Line
  - Ray, Rectangle, Parallelogram
  - Parallel Lines
- **Interactive Editing**: Drag and drop drawing items
- **Visual Feedback**: Highlight selected items với control points
- **Persistence**: Save và restore drawing state

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

### 6. Lottie Animation Support

- **Animation Integration**: Support cho Lottie animations
- **Close Price Animation**: Animated close price indicator
- **Custom Animations**: Support cho custom Lottie animations

## 🔍 Debugging và Troubleshooting

### 1. Common Issues

- **Memory Leaks**: Ensure proper cleanup của strong references
- **Performance Issues**: Check visible range calculation
- **Touch Issues**: Verify gesture recognizer setup
- **Rendering Issues**: Check Core Graphics context state

### 2. Debug Tools

- **Print Statements**: Use print() để debug
- **Breakpoints**: Set breakpoints trong Xcode
- **Instruments**: Use Xcode Instruments để profile
- **Console Logging**: Use console logging cho debugging

### 3. Best Practices

- **Thread Safety**: Ensure UI updates on main thread
- **Memory Management**: Proper cleanup của resources
- **Error Handling**: Handle edge cases gracefully
- **Testing**: Test với different data sizes và configurations

## 📚 API Reference

### HTKLineConfigManager Properties

```swift
// Data
var modelArray: [HTKLineModel]
var shouldScrollToEnd: Bool

// Drawing
var drawType: HTKLineDrawType
var drawColor: UIColor
var drawLineHeight: CGFloat
var drawShouldContinue: Bool

// Chart
var primary: Int
var second: Int
var time: Int
var isMinute: Bool

// Colors
var increaseColor: UIColor
var decreaseColor: UIColor
var minuteLineColor: UIColor
var targetColorList: [UIColor]

// Layout
var itemWidth: CGFloat
var candleWidth: CGFloat
var mainFlex: CGFloat
var volumeFlex: CGFloat

// Callbacks
var onDrawItemDidTouch: HTKLineDrawItemBlock?
var onDrawItemComplete: HTKLineDrawItemBlock?
var onDrawPointComplete: HTKLineDrawItemBlock?
```

### HTDrawType Values

```swift
case none = 0              // No drawing
case line = 1              // Line (2 points)
case horizontalLine = 2    // Horizontal line (2 points)
case verticalLine = 3      // Vertical line (2 points)
case halfLine = 4          // Ray (2 points)
case parallelLine = 5      // Parallel lines (3 points)
case rectangle = 101       // Rectangle (2 points)
case parallelogram = 102   // Parallelogram (3 points)
```

### HTKLineMainType Values

```swift
case none = -1    // No primary indicator
case ma = 1       // Moving Average
case boll = 2     // Bollinger Bands
```

### HTKLineChildType Values

```swift
case none = -1    // No secondary indicator
case macd = 3     // MACD indicator
case kdj = 4      // KDJ indicator
case rsi = 5      // RSI indicator
case wr = 6       // WR indicator
```

## 🎯 Kết luận

Thư viện `react-native-kline-view` iOS là một solution hoàn chỉnh và mạnh mẽ cho việc hiển thị biểu đồ K-line trong React Native trên iOS. Với kiến trúc modular, khả năng tùy chỉnh cao, và hiệu suất tối ưu, thư viện cung cấp:

- **Complete K-line Chart**: Candlestick, volume, technical indicators
- **Advanced Drawing System**: Multiple drawing tools với interactive editing
- **High Performance**: Optimized rendering và memory management
- **Rich Customization**: Colors, fonts, layouts, behaviors
- **Professional Features**: Screenshot, gesture recognition, multi-touch
- **Extensible Architecture**: Easy to add new indicators và drawing tools
- **Lottie Animation Support**: Support cho advanced animations
- **Swift Integration**: Modern Swift code với proper memory management

Thư viện phù hợp cho các ứng dụng tài chính, trading, và bất kỳ ứng dụng nào cần hiển thị dữ liệu biểu đồ chuyên nghiệp trên iOS platform.
