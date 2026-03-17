# BinanceLiveScreen: Tài Liệu Hoạt Động Chi Tiết

Tài liệu này mô tả chính xác cách `example/screens/BinanceLiveScreen.tsx` vận hành trong repo hiện tại, theo đúng flow runtime.

## 1) Mục tiêu của màn hình

`BinanceLiveScreen` là màn hình K-line realtime theo mô hình:

- Lấy lịch sử nến ban đầu bằng REST (`fetchBinanceKLineData`)
- Sau đó nhận cập nhật tick bằng WebSocket (`parseBinanceWsKlineUpdate`)
- Chọn đúng command cho chart:
  - `setData` khi reset hoặc repair full data
  - `appendCandle` khi có nến mới (timestamp lớn hơn nến cuối)
  - `updateLastCandle` khi cập nhật nến hiện tại (timestamp bằng nến cuối)
- Hỗ trợ `onLoadMore` để kéo thêm dữ liệu cũ
- Hỗ trợ draw tools (line/hline/rect) và đồng bộ trạng thái draw từ native callback

## 2) Kiến trúc dữ liệu và state

### 2.1 Refs (dữ liệu mutable, không trigger render)

- `klineRef: RNKLineViewRef | null`
  - Ref đến chart, dùng gọi imperative API (`setData`, `appendCandle`, `updateLastCandle`)
- `rawCandlesRef: KLineRawPoint[]`
  - Nguồn dữ liệu gốc realtime trong memory
  - Dùng để quyết định append/update/set mỗi khi có tick mới
- `wsRef: WebSocket | null`
  - Socket hiện tại
- `reconnectTimerRef: setTimeout | null`
  - Timer reconnect exponential backoff
- `reconnectRef: (() => void) | null`
  - Hàm reconnect thủ công được gán trong effect
- `sessionRef: number`
  - Token phiên hiện tại để chặn race condition giữa phiên cũ và mới

### 2.2 State UI chính

- Cặp dữ liệu thị trường: `symbol`, `interval`
- Trạng thái kết nối: `loading`, `error`, `isConnected`, `isReconnecting`, `lastPrice`
- Trạng thái chỉ báo: `mainMAEnabled`, `mainBOLLEnabled`, `mainSUPEREnabled`, `emaEnabled`, `second`
- Trạng thái draw: `drawType`, `shouldReloadDrawItemIndex`, `drawColor`, `drawLineHeight`, `drawDashWidth`, `drawDashSpace`, `drawIsLock`, `clearDrawNonce`
- Modal điều khiển: `controlsModalVisible`

## 3) Chuẩn hóa dữ liệu nến

### 3.1 Input gốc từ service

`KLineRawPoint` (từ REST và WS):

```ts
type KLineRawPoint = {
  time: number;   // milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
```

### 3.2 Hàm `buildCandle`

Chuyển từ `KLineRawPoint` sang `Candle` mà `RNKLineView` dùng:

- `id = time`
- `dateString = MM-DD HH:mm`
- map trực tiếp OHLCV
- tạo `selectedItemList` chuẩn O/H/L/C/VOL để hiển thị panel chọn điểm

Điểm quan trọng: `id` phải đơn điệu tăng theo thời gian để append/update không bị lệch.

## 4) Các config được memo hóa

### 4.1 `mainIndicatorsConfig`

Tạo từ state bật/tắt MA/EMA/SUPER/BOLL. Được truyền vào prop `mainIndicators`.

### 4.2 `subChartsConfig`

Định nghĩa pane phụ theo `second`:

- `3` => MACD
- `4` => KDJ
- `5` => RSI
- `-1` => không pane phụ

### 4.3 `themeConfig`

Set màu indicator (ma/ema/super).

### 4.4 `drawConfig`

Đóng gói toàn bộ trạng thái draw để truyền vào prop `draw`.

- `shouldClearDraw = clearDrawNonce > 0`
- Khi bấm clear, `clearDrawNonce` tăng và effect ngay sau đó reset về 0

## 5) Luồng `onLoadMore` (kéo nến cũ)

`handleLoadMore(ctx)` chạy khi chart cần dữ liệu trước `earliestId`:

1. Ghi lại `sessionIdAtRequest = sessionRef.current`
2. Xác định `earliestId`
3. Gọi REST với `endTime = earliestId - 1`
4. Nếu session đã đổi (user đổi symbol/interval), bỏ kết quả cũ để tránh chèn sai phiên
5. Lọc nến cũ thật sự (`item.time < currentFirstId`), sort tăng dần
6. Prepend vào `rawCandlesRef`
7. Trả về:
   - `candles: olderRaw.map(buildCandle)`
   - `hasMore: olderRaw.length > 0 && raw.length >= LOAD_MORE_PAGE_SIZE`

Ý nghĩa: chart sẽ tự prepend nhẹ nhàng mà không snap viewport.

## 6) Luồng bootstrap + realtime trong `useEffect([symbol, interval])`

Mỗi lần đổi `symbol` hoặc `interval`, toàn bộ phiên được reset.

### 6.1 Phase reset đầu effect

- `sessionId = ++sessionRef.current`
- clear timer reconnect cũ
- đóng socket cũ (`closeSocket`)
- `rawCandlesRef.current = []`
- `klineRef.current?.setData([])` để reset chart
- reset state UI (`loading=true`, clear error, clear lastPrice...)

### 6.2 Phase bootstrap history (REST)

Trong `bootstrap()`:

1. Gọi `fetchBinanceKLineData(symbol, interval, 300)`
2. Guard phiên (`active` + `sessionId`) để bỏ kết quả stale
3. Gán `rawCandlesRef.current = raw`
4. `historyCandles = raw.map(buildCandle)`
5. `klineRef.current?.setData(historyCandles)`
6. set `lastPrice` theo nến cuối
7. Nếu rỗng: set lỗi `No data from Binance`
8. Nếu có dữ liệu: gọi `connectWebSocket(0)`
9. Cuối cùng `setLoading(false)` nếu phiên vẫn hợp lệ

### 6.3 Phase realtime WebSocket

`connectWebSocket(attempt)`:

- Tạo URL qua `buildBinanceWsUrl(symbol, interval)`
- Mở socket mới và gán `wsRef.current`

#### `onopen`

- Nếu socket/phiên không còn hợp lệ thì đóng ngay
- Ngược lại set `isConnected=true`, `isReconnecting=false`, clear error

#### `onmessage`

1. Parse payload bằng `parseBinanceWsKlineUpdate`
2. Nếu parse fail thì bỏ qua
3. So sánh `rawCandle.time` với nến cuối trong `rawCandlesRef` để xác định `updateKind`:
   - `append`: `rawCandle.time > lastRaw.time`
   - `update`: `rawCandle.time === lastRaw.time`
   - `set`: out-of-order hoặc repair
4. Cập nhật `rawCandlesRef`
5. Gọi chart command tương ứng:
   - `append` => `appendCandle(baseCandle)`
   - `update` => `updateLastCandle(baseCandle)`
   - `set` => rebuild full `setData(fullCandles)`

Đây là logic quan trọng nhất để giữ hiệu năng và độ ổn định realtime.

#### `onerror`

- Set `error = 'WebSocket error'` (có guard phiên)

#### `onclose`

- Nếu socket vừa đóng vẫn là socket active của phiên hiện tại:
  - `isConnected = false`
  - Tính backoff: `retryDelay = min(10000, 1000 * 2^attempt)`
  - `isReconnecting = true`
  - set timeout reconnect với `attempt + 1`

### 6.4 Cleanup khi unmount hoặc dependency đổi

Trong return cleanup của effect:

- `active = false`
- `reconnectRef.current = null`
- clear reconnect timer
- đóng socket
- reset `isConnected/isReconnecting`

Mục tiêu: tránh memory leak và tránh callback từ session cũ ghi đè session mới.

## 7) Reconnect thủ công

`reconnectRef.current` được gán trong effect và dùng cho nút `Reconnect`.

Flow:

1. Clear timer cũ
2. Đóng socket cũ
3. Reset trạng thái kết nối/lỗi
4. Gọi `connectWebSocket(0)` ngay

Lưu ý: reconnect thủ công chỉ mở WS, không fetch lại full history.

## 8) Draw tools và callback chạm

### 8.1 Nhận callback từ native

`onDrawItemDidTouch(event)`:

- Đọc `event.nativeEvent` (fallback `event`)
- Nếu có `shouldReloadDrawItemIndex` => sync state
- Nếu có `drawType` => sync state
- Nếu có `drawIsLock` => sync state

Mục tiêu: UI React và trạng thái draw native giữ đồng bộ hai chiều.

### 8.2 Clear draw

`triggerClearDraw()`:

- Tăng `clearDrawNonce`
- set `shouldReloadDrawItemIndex = -2`
- set `drawType = 0`

Effect phụ sẽ reset nonce về 0 để `shouldClearDraw` chỉ bật trong một nhịp ngắn.

## 9) Cây UI chính

Màn hình gồm:

- Header + subtitle
- `BinanceControlSummary` hiển thị symbol/interval/chỉ báo/sub indicator/draw mode
- Status row (`Loading/Error/Reconnecting/Live/Idle`) + last price
- Vùng chart chứa `RNKLineView`
- Nút `Reconnect`
- `BinanceControlsModal` để đổi symbol/interval/chỉ báo/draw

## 10) Props `RNKLineView` đang dùng trong màn hình này

```tsx
<RNKLineView
  ref={klineRef}
  initialData={[]}
  preset="binance"
  mainIndicators={mainIndicatorsConfig}
  subCharts={subChartsConfig}
  volume={{ enabled: true, maPeriods: [5, 10] }}
  theme={themeConfig}
  draw={drawConfig}
  interaction={{ autoFollow: false, loadMoreThreshold: 48 }}
  onLoadMore={handleLoadMore}
  onDrawItemDidTouch={onDrawItemDidTouch}
/>
```

## 11) Invariants quan trọng cần giữ khi copy sang dự án khác

- Không bỏ `sessionRef` guard, nếu không sẽ bị race khi user đổi symbol/interval nhanh.
- Không đổi nhầm rule realtime:
  - cùng timestamp => `updateLastCandle`
  - timestamp mới => `appendCandle`
  - out-of-order repair => `setData`
- Không bỏ dedupe ở `onLoadMore` (`item.time < currentFirstId`).
- `id` của candle phải theo timestamp và tăng dần.
- Luôn cleanup socket + timer trong effect cleanup.

## 12) Các lỗi thường gặp và cách xử lý

- Chart giật/nhảy viewport:
  - Nguyên nhân: gọi `setData` quá thường xuyên
  - Cách xử lý: chỉ `setData` khi reset hoặc repair, còn lại dùng append/update
- Dữ liệu trùng nến khi kéo load more:
  - Nguyên nhân: không lọc theo `currentFirstId`
  - Cách xử lý: giữ filter `item.time < currentFirstId`
- Dữ liệu “cũ đè mới” khi đổi symbol liên tục:
  - Nguyên nhân: thiếu guard session
  - Cách xử lý: giữ `sessionRef` check ở mọi async callback
- Reconnect lặp vô hạn quá nhanh:
  - Nguyên nhân: không có exponential backoff
  - Cách xử lý: giữ `Math.min(10000, 1000 * Math.pow(2, attempt))`

## 13) Checklist port nhanh

1. Copy `BinanceService.ts` và xác nhận endpoint WS/REST dùng được trong môi trường đích.
2. Copy `BinanceLiveScreen.tsx` + 2 component UI controls Binance.
3. Đăng ký route và điều hướng vào screen.
4. Chạy thử 3 case:
   - Nến mới => append
   - Tick cùng nến => updateLast
   - Scroll trái load-more => prepend ổn, không trùng
5. Tắt mạng giả lập để kiểm tra reconnect/backoff.

