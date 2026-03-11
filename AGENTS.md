# AGENTS.md - Hướng Dẫn Agent Cho `react-native-kline-view`

Tài liệu này giúp mọi agent mới vào repo có thể đọc hiểu nhanh kiến trúc và chọn đúng skill khi làm việc.

## 1) Mục tiêu dự án

- Thư viện React Native hiển thị K-line chart hiệu năng cao.
- Core là native rendering trên cả Android/iOS, JS chỉ điều phối dữ liệu và cấu hình.
- Cần giữ parity hành vi giữa hai nền tảng cho:
  - realtime candles (`setData`, `appendCandle`, `updateLastCandle`)
  - drawing tools
  - prediction select/deselect

## 2) Cấu trúc cần đọc trước (theo thứ tự)

1. Public API:
- `index.js`
- `index.d.ts`

2. Android bridge + container + config:
- `android/src/main/java/com/github/fujianlian/klinechart/RNKLineView.java`
- `android/src/main/java/com/github/fujianlian/klinechart/container/HTKLineContainerView.java`
- `android/src/main/java/com/github/fujianlian/klinechart/HTKLineConfigManager.java`

3. iOS bridge + container + config:
- `ios/Classes/RNKLineView.swift`
- `ios/Classes/RNKLineView.m`
- `ios/Classes/HTKLineContainerView.swift`
- `ios/Classes/HTKLineConfigManager.swift`

4. Render engine:
- Android: `BaseKLineChartView.java`, `KLineChartView.java`, `android/.../draw/*`
- iOS: `HTKLineView.swift`, `HTMainDraw.swift`, `HTVolumeDraw.swift`, `HTMacdDraw.swift`, `HTKdjDraw.swift`, `HTRsiDraw.swift`, `HTWrDraw.swift`

5. Example integration:
- `example/screens/KLineScreen.tsx`
- `example/screens/BinanceService.ts`
- `example/screens/smc-strategy.ts`

## 3) Nguồn tài liệu nội bộ trong repo

- Kiến trúc tổng hợp đã phân tích: `PROJECT_ARCHITECTURE_VI.md`
- Tài liệu phân tích cũ: `CODE_ANALYSIS.md`

Khi cần hiểu hệ thống nhanh, ưu tiên `PROJECT_ARCHITECTURE_VI.md` trước.

## 4) Quy ước làm việc cho agent trong repo này

1. Không phá vỡ API công khai hiện có:
- Props: `optionList`, `onDrawItemDidTouch`, `onDrawItemComplete`, `onDrawPointComplete`, `onPredictionSelect`
- Ref API: `setData`, `appendCandle`, `updateLastCandle`, `unPredictionSelect`

2. Mọi thay đổi JS API phải đối chiếu cả 3 nơi:
- `index.js`
- `index.d.ts`
- bridge native (Android + iOS)

3. Ưu tiên incremental realtime:
- Tick realtime: dùng `appendCandle`/`updateLastCandle`
- Chỉ rebuild `optionList` khi đổi cấu hình lớn

4. Khi sửa một nền tảng, phải kiểm tra parity với nền tảng còn lại:
- mapping field
- hit-test threshold
- callback payload

## 4.1) Chuẩn bridge hiện tại (quan trọng)

Repo này đang dùng **2 cơ chế command khác nhau theo platform**:
- iOS: `index.js` gọi trực tiếp `NativeModules.RNKLineView.<method>(reactTag, payload)`
- Android: `index.js` gọi `UIManager.dispatchViewManagerCommand(nodeHandle, commandName, [payload])`

Do đó khi sửa bridge, bắt buộc:
1. Giữ đúng tên command string: `setData`, `appendCandle`, `updateLastCandle`, `unPredictionSelect`.
2. Android phải giữ cả 2 receiver path:
- `receiveCommand(root, int commandId, args)`
- `receiveCommand(root, String commandId, args)`
3. iOS phải giữ export method trong `ios/Classes/RNKLineView.m` khớp với `RNKLineView.swift`.

Lưu ý:
- `ios/Classes/RNKLineViewCommands.swift` hiện là module phụ, **không phải đường gọi chính** từ `index.js`.
- Không tự ý chuyển một platform sang cơ chế khác nếu chưa migrate đồng bộ cả JS + Android + iOS.
- Event đang export kiểu direct ở Android và `RCTBubblingEventBlock` ở iOS; khi đổi event semantics phải kiểm tra lại behavior app.

## 5) Skill routing (bắt buộc dùng khi khớp ngữ cảnh)

### A) Skill: `react-native-best-practices`
- Path: `~/.agents/skills/react-native-best-practices/SKILL.md`
- Dùng khi:
  - tối ưu FPS, jank, startup time, memory
  - tối ưu bundle size hoặc profiling
  - review performance PR
- Cách áp dụng:
  1. mở `SKILL.md`
  2. chọn đúng file trong `references/` theo vấn đề
  3. follow workflow Measure -> Optimize -> Re-measure -> Validate

### B) Skill: `react-native-native-modules`
- Path: `~/.agents/skills/react-native-native-modules/SKILL.md`
- Dùng khi:
  - thêm/sửa native module bridge iOS/Android
  - đổi contract event/command JS <-> native
  - xử lý vấn đề threading, sync/async native method
- Cách áp dụng:
  1. xác định thay đổi ở JS spec + iOS + Android
  2. cập nhật type/bridge đồng bộ
  3. xác nhận payload tương thích hai nền tảng

### C) Skill: `upgrade-react-native`
- Path: `~/.agents/skills/upgrade-react-native/SKILL.md`
- Dùng khi:
  - yêu cầu nâng version React Native
  - migrate native project files do upgrade
- Cách gọi:
  - `/upgrade-react-native <targetVersion>`
- Lưu ý: chỉ dùng cho task upgrade version, không dùng cho bugfix thường.

### D) Skill: `find-skills`
- Path: `~/.agents/skills/find-skills/SKILL.md`
- Dùng khi:
  - user cần tìm/cài thêm skill mới cho workflow chưa có

## 6) Checklist khi nhận task mới

1. Xác định task thuộc nhóm nào:
- API/bridge
- render/indicator
- draw/prediction interaction
- performance
- RN upgrade

2. Kích hoạt skill tương ứng (mục 5) nếu khớp ngữ cảnh.

3. Đọc tối thiểu các file bắt buộc trước khi sửa:
- `index.js`, `index.d.ts`
- bridge file liên quan của Android + iOS
- `example/screens/KLineScreen.tsx` để xác minh cách app dùng API

4. Sau khi sửa:
- rà lại parity iOS/Android
- đảm bảo không đổi payload contract ngoài ý muốn
- nếu có thay đổi contract, cập nhật `README.md` và `index.d.ts`

## 7) Rủi ro đã biết (ưu tiên chú ý)

1. KDJ mapping Android hiện có dấu hiệu không khớp iOS khi parse payload field.
2. Logic chọn `predictionStartTime` có khác biệt Android/iOS (điểm bắt đầu zone có thể lệch).
3. Hit-test threshold draw/prediction khác nhau giữa 2 nền tảng.

Khi đụng các vùng này, bắt buộc kiểm tra kỹ cả hai nền tảng trước khi chốt.

## 8) Command gợi ý cho agent

- Chạy ví dụ RN:
  - `cd example && yarn start`
  - `cd example && yarn ios`
  - `cd example && yarn android`

- Tìm nhanh code:
  - `rg "setData|appendCandle|updateLastCandle|onPredictionSelect"`
  - `rg "drawType|shouldReloadDrawItemIndex|prediction" android ios example`
