# Bản Đồ Kiến Trúc Toàn Dự Án `react-native-kline-view`

Tài liệu này tổng hợp end-to-end kiến trúc hiện tại của repo, tập trung vào:
- Luồng dữ liệu JS ↔ Native (Android/iOS)
- Public API và contract sự kiện
- Cách `example` tích hợp realtime/drawing/prediction
- Điểm cần lưu ý khi phát triển tiếp

## 1) Kiến trúc tổng thể theo 4 lớp

### Lớp 1: Public API JS/TS
- Entry component: `index.js`
- Type definition: `index.d.ts`
- Public surface:
  - Props:
    - `optionList?: string`
    - `onDrawItemDidTouch?`
    - `onDrawItemComplete?`
    - `onDrawPointComplete?`
    - `onPredictionSelect?`
  - Imperative ref API:
    - `setData(candles: Candle[])`
    - `appendCandle(candle: Candle)`
    - `updateLastCandle(candle: Candle)`
    - `unPredictionSelect()`
- Dispatch strategy theo platform:
  - iOS: gọi trực tiếp `NativeModules.RNKLineView.<method>(reactTag, payload)`
  - Android: `UIManager.dispatchViewManagerCommand(nodeHandle, commandName, [payload])`

### Lớp 2: Android Bridge + Native Chart
- ViewManager: `android/src/main/java/com/github/fujianlian/klinechart/RNKLineView.java`
  - Export event names: `onDrawItemDidTouch`, `onDrawItemComplete`, `onDrawPointComplete`, `onPredictionSelect`
  - Export command map: `setData`, `appendCandle`, `updateLastCandle`, `unPredictionSelect`
  - `optionList` được parse từ JSON string (fastjson) và nạp vào `HTKLineConfigManager`
- Container: `android/src/main/java/com/github/fujianlian/klinechart/container/HTKLineContainerView.java`
  - Chứa `KLineChartView`
  - Bind callback native → RN event emitter
  - Đồng bộ draw context và prediction select
- Config manager: `android/src/main/java/com/github/fujianlian/klinechart/HTKLineConfigManager.java`
  - Parse `modelArray`, `targetList`, `drawList`, `configList`, prediction fields
  - Map raw candle object thành `KLineEntity`

### Lớp 3: iOS Bridge + Native Chart
- ViewManager: `ios/Classes/RNKLineView.swift` + ObjC export `ios/Classes/RNKLineView.m`
  - Export `optionList`, events và imperative methods (`setData/append/updateLast/unPredictionSelect`)
  - Lookup view qua `viewRegistry` và `uiManager.view(forReactTag:)` (hỗ trợ Paper/Fabric path)
- Container: `ios/Classes/HTKLineContainerView.swift`
  - Parse `optionList` trên queue riêng `RNKLineView.queue`
  - Update UI trên main thread
  - Bridge draw/prediction callbacks về JS
- Config manager: `ios/Classes/HTKLineConfigManager.swift`
  - Parse cùng nhóm field với Android
  - Quản lý enum main/child indicator và draw state

### Lớp 4: Example App (tài liệu tích hợp thực tế)
- Main screen: `example/screens/KLineScreen.tsx`
- Data source: `example/screens/BinanceService.ts`
- Strategy/prediction input: `example/screens/smc-strategy.ts`
- Vai trò:
  - Build `optionList` từ state/UI
  - Serialize `JSON.stringify(optionList)` truyền vào prop
  - Dùng ref API để realtime incremental update
  - Nhận callback draw/prediction để đồng bộ UI

---

## 2) Public interface/type cần nắm

### 2.1 `Candle` tối thiểu
```ts
{
  id: number;
  dateString: string;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
  selectedItemList?: Array<Record<string, any>>;
  [key: string]: any;
}
```

### 2.2 Cấu trúc `optionList` cấp cao
```ts
{
  modelArray: KLineModel[];
  shouldScrollToEnd: boolean;
  targetList: { maList, maVolumeList, bollN, bollP, macdS, macdL, macdM, kdjN, kdjM1, kdjM2, rsiList, wrList };
  price: number;
  volume: number;
  primary: number; // 1=MA, 2=BOLL
  second: number;  // 3=MACD,4=KDJ,5=RSI,6=WR
  time: number;    // -1 minute line, còn lại timeframe
  configList: { ...màu sắc, kích thước, layout, font, lottie, rightOffsetCandles... };
  drawList: { drawType, shouldReloadDrawItemIndex, drawShouldContinue, drawColor, ... };
  predictionList?: PredictionTarget[];
  predictionStartTime?: number;
  predictionEntry?: number;
  predictionStopLoss?: number;
  predictionBias?: string;
  predictionEntryZones?: any[];
  predictionMinCandles?: number;
}
```

---

## 3) API contract JS ↔ Android ↔ iOS

## 3.1 Commands (imperative ref)

| JS API | Payload JS | Android nhận ở đâu | iOS nhận ở đâu | Tác động native |
|---|---|---|---|---|
| `setData(candles)` | `Candle[]` | `RNKLineView.receiveCommand(...COMMAND_SET_DATA...)` | `RNKLineView.setData(_:candles:)` | Replace toàn bộ `modelArray`, reload chart |
| `appendCandle(candle)` | `Candle` | `...COMMAND_APPEND_CANDLE...` | `RNKLineView.appendCandle(_:candle:)` | Append 1 candle vào cuối, reload chart |
| `updateLastCandle(candle)` | `Candle` | `...COMMAND_UPDATE_LAST_CANDLE...` | `RNKLineView.updateLastCandle(_:candle:)` | Replace candle cuối (hoặc append nếu empty) |
| `unPredictionSelect()` | `null`/unused | `...COMMAND_UN_PREDICTION_SELECT...` | `RNKLineView.unPredictionSelect(_:unused:)` | Clear trạng thái prediction selection |

Ghi chú:
- Android parse `ReadableMap/ReadableArray` -> Java Map/List, sau đó parse model ở worker thread rồi `post` về UI thread.
- iOS dùng `addUIBlock`, thao tác model trên queue riêng rồi update UI main thread.

## 3.2 Props + Events

| JS prop/event | Android | iOS | Payload chính |
|---|---|---|---|
| `optionList` | `@ReactProp(name = "optionList")` parse JSON -> `reloadOptionList` | `@objc var optionList` parse JSON -> `reloadOptionList` | JSON string cấu hình đầy đủ |
| `onDrawItemDidTouch` | emit qua `RCTEventEmitter.receiveEvent` | `RCTBubblingEventBlock` | `{ shouldReloadDrawItemIndex, drawColor?, drawLineHeight?, drawDashWidth?, drawDashSpace?, drawIsLock? }` |
| `onDrawItemComplete` | emit map rỗng | emit map rỗng | `{}` |
| `onDrawPointComplete` | emit `pointCount` | emit `pointCount` | `{ pointCount }` |
| `onPredictionSelect` | emit payload từ prediction hit test | emit payload từ `klineView.onPredictionSelect` | details object (type/index/price/color...) |

---

## 4) Luồng dữ liệu chính

### 4.1 Full reload qua `optionList`
1. JS (`KLineScreen`) tính indicator + draw/prediction state -> `optionList` object.
2. JS serialize `JSON.stringify(optionList)` -> prop `optionList`.
3. Native parse JSON, cập nhật config manager và model.
4. Native `reloadConfigManager` để vẽ lại chart.

Phù hợp khi:
- Đổi timeframe, đổi bộ indicator, đổi theme/layout
- Thay đổi cấu hình lớn (draw config, prediction overlays, style)

### 4.2 Incremental realtime qua ref APIs
1. JS giữ dataset gần nhất trong `nativeDataRef`.
2. Khi có candle mới: recompute indicator trên JS -> gọi `appendCandle(latest)`.
3. Khi candle hiện tại thay đổi: recompute -> gọi `updateLastCandle(latest)`.
4. Native chỉ cập nhật dataset nội bộ và reload, không cần rebuild `optionList` mỗi tick.

### 4.3 Event callback native -> JS
- Draw interaction:
  - Touch draw item -> `onDrawItemDidTouch`
  - Complete draw item -> `onDrawItemComplete`
  - Complete point -> `onDrawPointComplete`
- Prediction interaction:
  - Select entry/sl/tp -> `onPredictionSelect`
  - JS lưu vào state UI (`selectedPrediction`)

---

## 5) Checklist test scenarios (xác nhận hiểu đúng hệ thống)

1. Scenario 1: Khởi tạo chart bằng `optionList` đầy đủ
- Input: `modelArray` + `targetList` + `configList` + `drawList`
- Expected: chart render đúng candle/indicator/theme, không crash parse

2. Scenario 2: Realtime incremental không rebuild `optionList`
- Bước: gọi `appendCandle` nhiều lần, xen kẽ `updateLastCandle`
- Expected: chart cập nhật đúng, state draw/prediction không bị reset ngoài ý muốn

3. Scenario 3: Drawing callbacks
- Bước: chọn tool, vẽ item, chạm lại item
- Expected: nhận đủ `onDrawItemDidTouch`, `onDrawItemComplete`, `onDrawPointComplete`

4. Scenario 4: Prediction select/unselect
- Bước: bật prediction data, chạm vùng prediction, sau đó gọi `unPredictionSelect`
- Expected: có event `onPredictionSelect`; unselect clear state trên chart

5. Scenario 5: So sánh iOS/Android cùng payload
- Input: cùng `optionList` + cùng stream `append/update`
- Expected: hành vi hiển thị/interaction tương đồng ở mức tính năng

---

## 6) Điểm cần lưu ý khi phát triển tiếp

1. Nhất quán numeric types qua bridge
- RN bridge numbers là `double`; cả Android/iOS đang cast về float/CGFloat ở nhiều nơi.
- Với tài sản giá rất nhỏ/lớn, cần test sai số hiển thị và trục giá.

2. `drawType` đã đồng bộ raw value giữa JS và iOS/Android
- JS dùng constants `rectangle=101`, `parallelogram=102`.
- iOS parse `drawList.drawType` bằng `HTDrawType` (định nghĩa 101/102), Android map qua `HTDrawType.drawTypeFromRawValue(...)`.
- Kết luận: không có lệch raw value ở runtime cho 2 draw type này.

3. Khác biệt parse KDJ trên Android
- Android `packModel` gán:
  - `entity.k <- kdjD`
  - `entity.d <- kdjJ`
  - `entity.j <- kdjK`
- iOS map đúng tên field (`kdjK/kdjD/kdjJ`).
- Đây là điểm rủi ro cross-platform output của chỉ báo KDJ.

4. Realtime pipeline hiện recompute indicator ở JS
- Cách này đơn giản nhưng tốn CPU khi candle count lớn và tick dày.
- Nếu scale cao hơn, cân nhắc incremental indicator engine hoặc move compute xuống native/worker.

5. `optionList` JSON kích thước lớn
- Serialize full object mỗi lần state đổi có thể nặng bridge.
- Nên giữ pattern hiện tại: chỉ full reload khi đổi config lớn, còn tick realtime dùng ref API.

6. Đồng bộ state draw/prediction với reload
- Một số cờ như `shouldReloadDrawItemIndex`, `shouldClearDraw`, `shouldFixDraw` có vòng đời ngắn.
- App layer cần reset flag đúng nhịp (example đang dùng timeout ngắn) để tránh lặp tác vụ.

7. Log debug native khá nhiều
- iOS/Android đều có nhiều `print/log` cho commands và payload keys.
- Khi release nên có cơ chế giảm log để tránh noise và chi phí runtime.

---

## 7) Deep-dive render engine (đọc kỹ)

1. Android render pipeline trong `BaseKLineChartView`
- `calculateValue()`:
  - Tính `mStartIndex/mStopIndex` theo `scrollX + scale`.
  - Quét visible range để lấy min/max cho main/volume/child.
  - Nới biên Y để chứa prediction (`entry/sl/tp`) + padding 5%.
- `drawK()`:
  - `canvas.translate(-mScrollX * mScaleX, 0)` + `canvas.scale(mScaleX, 1)`.
  - Draw main, volume, child draw theo từng candle.
- `drawPrediction()`:
  - Vẽ gradient zone + Entry/SL + TP (đường chéo từ entry tới target).
  - Tạo hit payload select line qua `onSingleTapUp()`.

2. iOS render pipeline trong `HTKLineView`
- `reloadContentSize()` + `scrollViewDidScroll()`:
  - Tính `visibleRange` theo `contentOffset/itemWidth`.
- Draw pass:
  - Main/volume/child qua protocol draw (`HTMainDraw`, `HTVolumeDraw`, ...).
  - Prediction overlay riêng với animation (`CADisplayLink`, `predictionAnimationProgress`).
- `tapSelector()`:
  - Hit-test prediction theo content coordinates, chọn candidate gần nhất, emit payload.

3. Trục tọa độ và scaling
- Android dùng tọa độ ảo dựa trên `mScrollX/mScaleX`; iOS dùng `UIScrollView contentOffset + itemWidth`.
- Cả hai cùng chiến lược: convert giá -> Y qua min/max visible range; convert index -> X qua `itemWidth`.

---

## 8) Deep-dive state machine cho drawing

1. Core trạng thái
- `drawType`: loại công cụ hiện tại.
- `shouldReloadDrawItemIndex`: trạng thái popup/context/dang chọn item.
- `drawShouldContinue`: vẽ liên tục hay tắt tool sau khi hoàn tất.
- `shouldFixDraw`, `shouldClearDraw`, `drawShouldTrash`: các cờ one-shot.

2. Luồng thao tác
- Bắt đầu touch:
  - Nếu chạm trúng item/point cũ -> chuyển sang mode edit/drag.
  - Nếu không trúng và `drawType != none` -> tạo/tiếp tục item mới.
- Kết thúc touch điểm cuối:
  - Emit `onDrawPointComplete`.
  - Nếu đủ số điểm của tool:
    - Emit `onDrawItemComplete`.
    - Nếu `drawShouldContinue=false` -> native set `drawType=none`.

3. Khác biệt ngưỡng hit-test
- Android dùng ngưỡng hit lớn hơn (ví dụ khoảng cách tới point ~30).
- iOS dùng ngưỡng nhỏ hơn (ví dụ point hit ~10).
- Ảnh hưởng: cùng thao tác tay có thể “dễ chọn” trên Android hơn iOS.

---

## 9) Parity matrix iOS vs Android (đã xác thực)

1. Dữ liệu & indicator parse
- MA/BOLL/MACD/RSI/WR: logic parse tương đương về field naming.
- KDJ: Android đang map nhầm `k/d/j` từ `kdjD/kdjJ/kdjK`; iOS map đúng `kdjK/kdjD/kdjJ`.

2. Prediction start index
- Android: tìm index đầu tiên có `entity.id >= predictionStartTime`.
- iOS: tìm từ cuối về, index thỏa `model.id <= predictionStartTime`.
- Có thể tạo chênh vị trí “điểm bắt đầu prediction zone”.

3. Prediction hit-test
- Android: `hitThreshold` theo dp (30dp), ưu tiên đường gần nhất theo khoảng cách Y.
- iOS: ngưỡng tách `X/Y` nhỏ hơn và có kiểm tra biên content/line segment chi tiết hơn.

4. Deselect behavior
- Cả hai đều clear selected prediction khi:
  - scroll bắt đầu
  - tap vùng rỗng
  - gọi `unPredictionSelect()`
- Callback deselect đều gửi payload rỗng (`{}`).

---

## 10) Entry points nên đọc khi onboarding
- Public API: `index.js`, `index.d.ts`
- Android bridge: `android/src/main/java/com/github/fujianlian/klinechart/RNKLineView.java`
- Android container/config: 
  - `android/src/main/java/com/github/fujianlian/klinechart/container/HTKLineContainerView.java`
  - `android/src/main/java/com/github/fujianlian/klinechart/HTKLineConfigManager.java`
- iOS bridge/container/config:
  - `ios/Classes/RNKLineView.swift`
  - `ios/Classes/RNKLineView.m`
  - `ios/Classes/HTKLineContainerView.swift`
  - `ios/Classes/HTKLineConfigManager.swift`
- Integration demo:
  - `example/screens/KLineScreen.tsx`
  - `example/screens/BinanceService.ts`
  - `example/screens/smc-strategy.ts`
