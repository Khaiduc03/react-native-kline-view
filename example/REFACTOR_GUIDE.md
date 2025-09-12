# React Native K-line View - Hướng dẫn Refactor TypeScript

## 📋 Tổng quan

Dự án đã được refactor từ JavaScript sang TypeScript với cấu trúc component được tách riêng để dễ bảo trì và mở rộng.

## 🗂️ Cấu trúc thư mục mới

```
example/
├── src/
│   ├── components/          # Các React components
│   │   ├── KLineChart.tsx
│   │   ├── Toolbar.tsx
│   │   ├── ControlBar.tsx
│   │   ├── TimeSelector.tsx
│   │   ├── IndicatorSelector.tsx
│   │   ├── DrawToolSelector.tsx
│   │   └── index.ts
│   ├── constants/           # Các hằng số và cấu hình
│   │   └── index.ts
│   ├── hooks/              # Custom React hooks
│   │   └── useKLineChart.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   └── utils/              # Utility functions
│       └── index.ts
├── App.tsx                 # Main App component
├── App.js                  # Legacy JavaScript version
├── tsconfig.json           # TypeScript configuration
└── package.json
```

## 🔧 Các thay đổi chính

### 1. **TypeScript Migration**
- Tất cả files được chuyển từ `.js` sang `.tsx`
- Thêm type definitions cho tất cả props và state
- Strict type checking được bật

### 2. **Component Separation**
- **KLineChart**: Component chính hiển thị biểu đồ
- **Toolbar**: Thanh công cụ trên cùng với toggle theme
- **ControlBar**: Thanh điều khiển dưới cùng
- **TimeSelector**: Modal chọn thời gian
- **IndicatorSelector**: Modal chọn chỉ báo
- **DrawToolSelector**: Panel chọn công cụ vẽ

### 3. **Custom Hook**
- **useKLineChart**: Quản lý toàn bộ state và logic của ứng dụng
- Tách biệt logic khỏi UI components
- Dễ dàng test và tái sử dụng

### 4. **Type Safety**
- Định nghĩa rõ ràng các interface cho props
- Type checking cho tất cả functions
- IntelliSense support tốt hơn

## 📖 Hướng dẫn sử dụng

### 1. **Cài đặt dependencies**

```bash
# Cài đặt TypeScript
npm install --save-dev typescript @types/react @types/react-native

# Hoặc sử dụng yarn
yarn add -D typescript @types/react @types/react-native
```

### 2. **Cấu hình TypeScript**

File `tsconfig.json` đã được tạo với cấu hình phù hợp cho React Native:

```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["es2017", "es2018", "es2019", "es2020", "dom"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

### 3. **Sử dụng Components**

#### **KLineChart Component**
```tsx
import { KLineChart } from './src/components';

<KLineChart
  optionList={optionList}
  onDrawItemDidTouch={onDrawItemDidTouch}
  onDrawItemComplete={onDrawItemComplete}
  onDrawPointComplete={onDrawPointComplete}
/>
```

#### **Custom Hook**
```tsx
import { useKLineChart } from './src/hooks/useKLineChart';

const MyComponent = () => {
  const {
    state,
    toggleTheme,
    selectTimeType,
    // ... other methods
  } = useKLineChart();

  return (
    // Your JSX
  );
};
```

### 4. **Thêm Component mới**

#### **Tạo Component**
```tsx
// src/components/MyNewComponent.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { MyComponentProps } from '../types';

const MyNewComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
};

export default MyNewComponent;
```

#### **Thêm vào index.ts**
```tsx
// src/components/index.ts
export { default as MyNewComponent } from './MyNewComponent';
```

#### **Thêm types**
```tsx
// src/types/index.ts
export interface MyComponentProps {
  title: string;
  onPress: () => void;
}
```

### 5. **Thêm Custom Hook mới**

```tsx
// src/hooks/useMyCustomHook.ts
import { useState, useCallback } from 'react';

export const useMyCustomHook = () => {
  const [value, setValue] = useState<string>('');

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return {
    value,
    updateValue,
  };
};
```

## 🎯 Lợi ích của cấu trúc mới

### **1. Type Safety**
- Phát hiện lỗi tại compile time
- IntelliSense tốt hơn
- Refactoring an toàn hơn

### **2. Component Reusability**
- Components có thể tái sử dụng
- Props được định nghĩa rõ ràng
- Dễ dàng test từng component

### **3. Code Organization**
- Logic được tách biệt khỏi UI
- Dễ dàng tìm và sửa lỗi
- Cấu trúc rõ ràng, dễ hiểu

### **4. Maintainability**
- Dễ dàng thêm tính năng mới
- Dễ dàng sửa lỗi
- Code dễ đọc và hiểu

## 🔄 Migration từ JavaScript

### **Bước 1: Cài đặt TypeScript**
```bash
npm install --save-dev typescript @types/react @types/react-native
```

### **Bước 2: Cấu hình tsconfig.json**
Sử dụng file `tsconfig.json` đã được tạo sẵn.

### **Bước 3: Chuyển đổi files**
1. Đổi extension từ `.js` sang `.tsx`
2. Thêm type annotations
3. Import types từ `src/types`

### **Bước 4: Cập nhật imports**
```tsx
// Thay vì
import MyComponent from './MyComponent';

// Sử dụng
import { MyComponent } from './src/components';
```

## 🐛 Troubleshooting

### **Lỗi TypeScript thường gặp**

1. **Property does not exist on type**
   - Kiểm tra interface definition
   - Đảm bảo props được truyền đúng

2. **Cannot find module**
   - Kiểm tra path imports
   - Đảm bảo file tồn tại

3. **Type 'any' is not allowed**
   - Thêm type annotations cụ thể
   - Sử dụng `unknown` thay vì `any`

### **Performance Tips**

1. **Memoization**
   ```tsx
   const MemoizedComponent = React.memo(MyComponent);
   ```

2. **useCallback cho functions**
   ```tsx
   const handlePress = useCallback(() => {
     // logic
   }, [dependencies]);
   ```

3. **useMemo cho expensive calculations**
   ```tsx
   const expensiveValue = useMemo(() => {
     return calculateExpensiveValue(data);
   }, [data]);
   ```

## 📚 Tài liệu tham khảo

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React Native TypeScript](https://reactnative.dev/docs/typescript)

---

**Lưu ý**: Cấu trúc mới này tương thích ngược với code JavaScript cũ. Bạn có thể chạy song song cả hai phiên bản trong quá trình migration.
