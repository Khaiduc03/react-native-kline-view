# AI Coding Agent Rules

> Hướng dẫn cho các AI coding agents (Copilot, Cursor, Claude, etc.) khi làm việc với dự án này.

## 🎯 Mục Đích Dự Án

Thư viện React Native hiển thị biểu đồ nến (K-Line/Candlestick) chuyên nghiệp cho ứng dụng trading. Sử dụng native code để đạt hiệu suất 60fps.

> ⚠️ **QUAN TRỌNG**: Đây là dự án **PHÁT TRIỂN THƯ VIỆN**, không phải app!
> - Source code thư viện: Thư mục gốc (`index.js`, `ios/`, `android/`)
> - App kiểm thử: Thư mục `example/`
> - Luôn test trong `example/` sau khi sửa code thư viện

## 📁 Cấu Trúc Quan Trọng

```
├── index.js          → React Native bridge (imperative API)
├── index.d.ts        → TypeScript definitions  
├── ios/Classes/      → Swift implementation (THƯ VIỆN)
├── android/src/      → Java implementation (THƯ VIỆN)
└── example/          → Demo app (KIỂM THỬ)
    ├── screens/KLineScreen.tsx  → Test screen
    └── ios/ & android/          → Native builds
```

## 🔤 Quy Tắc Code

| Ngôn ngữ | Indent | Style Guide |
|----------|--------|-------------|
| JS/TS | 2 spaces | ESLint + Prettier |
| Swift | 4 spaces | Apple Swift Guidelines |
| Java | 4 spaces | Google Java Style |

## ⚡ Performance Rules

```
✅ Parse JSON trên background thread
✅ Update UI trên main thread
✅ Tránh allocations trong draw loops
✅ Sử dụng object pooling
❌ Không block main thread
❌ Không tạo objects trong render loops
```

## 🔌 Bridge Verification (BẮT BUỘC)

Khi code bridge JS ↔ Native, **PHẢI kiểm tra**:

### 1. Kiểm tra module tồn tại
```javascript
const manager = NativeModules?.RNKLineView;
if (!manager) {
  console.warn('[RNKLineView] Native module not found');
  return;
}
```

### 2. Kiểm tra method tồn tại
```javascript
if (typeof manager[commandName] !== 'function') {
  console.warn(`[RNKLineView] Method ${commandName} not found`);
  return;
}
```

### 3. Log data gửi đi
```javascript
console.log('[RNKLineView] Sending:', commandName, payload);
```

### 4. Log data nhận được (Native)
```swift
// iOS
print("[RNKLineView][iOS] Received:", commandName)
```
```java
// Android  
Log.i(TAG, "Received: " + commandName);
```

## 🏗️ Patterns

### Imperative API (JS → Native)
```javascript
// Thay vì re-render toàn bộ, dùng ref methods
klineRef.current?.setData(candles)
klineRef.current?.appendCandle(candle)
klineRef.current?.updateLastCandle(candle)
```

### Drawing Protocol (iOS)
```swift
protocol HTKLineDrawProtocol {
    func minMaxRange(...) -> Range<CGFloat>
    func drawCandle(...)
    func drawLine(...)
    func drawText(...)
}
```

## 📝 Naming Conventions

- **iOS Classes**: `HT{Feature}{Type}.swift` (HTMainDraw, HTVolumeDraw)
- **Android Classes**: `{Feature}.java` hoặc `HT{Feature}.java`
- **TypeScript Types**: PascalCase (Candle, PredictionPayload)
- **Functions**: camelCase (setData, appendCandle)

## 🔄 Quy Trình Phát Triển

```
1. Sửa code thư viện (index.js, ios/, android/)
2. Rebuild example app
3. Test trong example/
4. Kiểm tra logs (JS + Native)
5. Lặp lại
```

### Rebuild sau khi sửa thư viện
```bash
# iOS - Cần reinstall pods
cd example/ios && pod install && cd ..
yarn ios

# Android
cd example && yarn android
```

### Xem logs
```bash
# iOS logs
npx react-native log-ios

# Android logs
adb logcat | grep RNKLineView
```

## ✅ Checklist Khi Thêm Feature

- [ ] Update TypeScript types (`index.d.ts`)
- [ ] Implement iOS (Swift)
- [ ] Implement Android (Java)
- [ ] Add to imperative API if needed (`index.js`)
- [ ] **Thêm console.log ở JS** để verify
- [ ] **Thêm print/Log.i ở Native** để verify
- [ ] **Rebuild example app**
- [ ] **Kiểm tra logs** xem data có đến Native không
- [ ] Test với data lớn (1000+ candles)
- [ ] Test cả iOS và Android

## 🚫 Những Điều Cần Tránh

1. **Đừng** dùng `!` force unwrap trong Swift
2. **Đừng** ignore null checks trong Java
3. **Đừng** hardcode colors/dimensions
4. **Đừng** quên edge cases (empty data, single candle)
5. **Đừng** tạo breaking changes trong public API
6. **Đừng** assume bridge hoạt động mà không test - PHẢI verify bằng logs
7. **Đừng** skip rebuild example app sau khi sửa thư viện
8. **Đừng** xóa debug logs cho đến khi feature đã verify xong

## 💡 Tips

- Prediction feature hiện chỉ có trên iOS
- ConfigManager quản lý toàn bộ state
- ModelArray chứa dữ liệu nến
- VisibleModelArray là subset đang hiển thị
