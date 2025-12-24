# Contributing to React Native KLine View

Cảm ơn bạn đã quan tâm đến việc đóng góp cho dự án! 🎉

## 📋 Quy tắc đóng góp

### Code Style

1. **JavaScript/TypeScript**: Tuân thủ ESLint và Prettier config
2. **Swift (iOS)**: Indent 4 spaces, tuân thủ Swift style guide
3. **Java (Android)**: Indent 4 spaces, tuân thủ Google Java style

### Commit Messages

Sử dụng format [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `docs`: Thay đổi documentation
- `style`: Thay đổi formatting (không ảnh hưởng logic)
- `refactor`: Refactor code
- `perf`: Cải thiện performance
- `test`: Thêm/sửa tests
- `chore`: Maintenance tasks

**Ví dụ:**
```
feat(ios): add support for custom indicator colors
fix(android): resolve crash on pinch zoom
docs: update README with new API
```

### Pull Request Process

1. Fork repository
2. Tạo branch từ `main`: `git checkout -b feature/your-feature`
3. Commit changes với message rõ ràng
4. Push và tạo Pull Request
5. Đợi review và address feedback

### Testing

- Chạy `yarn lint` trước khi commit
- Test trên cả iOS và Android
- Thêm test cases cho tính năng mới

## 🛠️ Development Setup

```bash
# Clone repo
git clone https://github.com/Khaiduc03/react-native-kline-view.git
cd react-native-kline-view

# Install dependencies
yarn install

# Run example app
cd example
yarn install
yarn ios  # hoặc yarn android
```

## 📁 Project Structure

```
├── index.js          # JS entry point
├── index.d.ts        # TypeScript definitions
├── ios/              # iOS native code (Swift)
├── android/          # Android native code (Java)
└── example/          # Demo application
```

## ❓ Questions?

Mở issue trên GitHub nếu bạn có câu hỏi hoặc gặp vấn đề.
