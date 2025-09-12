# React Native K-line View - TypeScript Refactor

## 🎯 Tổng quan

Dự án đã được refactor hoàn toàn từ JavaScript sang TypeScript với cấu trúc component được tách riêng, giúp code dễ bảo trì, mở rộng và có type safety tốt hơn.

## ✨ Tính năng mới

- ✅ **TypeScript Support**: Type safety và IntelliSense tốt hơn
- ✅ **Component Architecture**: Tách riêng các component để dễ quản lý
- ✅ **Custom Hooks**: Logic được tách biệt khỏi UI
- ✅ **Type Definitions**: Định nghĩa rõ ràng cho tất cả props và state
- ✅ **Modular Structure**: Cấu trúc thư mục rõ ràng, dễ hiểu

## 🗂️ Cấu trúc dự án

```
example/
├── src/
│   ├── components/          # React Components
│   │   ├── KLineChart.tsx   # Main chart component
│   │   ├── Toolbar.tsx      # Top toolbar with theme toggle
│   │   ├── ControlBar.tsx   # Bottom control bar
│   │   ├── TimeSelector.tsx # Time period selector modal
│   │   ├── IndicatorSelector.tsx # Technical indicator selector
│   │   ├── DrawToolSelector.tsx  # Drawing tool selector
│   │   └── index.ts         # Component exports
│   ├── constants/           # Constants and configurations
│   │   └── index.ts         # Theme, time periods, indicators
│   ├── hooks/              # Custom React hooks
│   │   └── useKLineChart.ts # Main chart logic hook
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # All interfaces and types
│   └── utils/              # Utility functions
│       └── index.ts        # Helper functions and calculations
├── App.tsx                 # Main App component (TypeScript)
├── App.js                  # Legacy JavaScript version
├── tsconfig.json           # TypeScript configuration
└── REFACTOR_GUIDE.md       # Detailed refactor guide
```

## 🚀 Cách sử dụng

### 1. **Chạy ứng dụng TypeScript**

```bash
# Cài đặt dependencies
npm install

# Chạy trên iOS
npm run ios

# Chạy trên Android
npm run android
```

### 2. **Sử dụng Components**

```tsx
import React from 'react';
import { KLineChart, Toolbar, ControlBar } from './src/components';
import { useKLineChart } from './src/hooks/useKLineChart';

const MyApp = () => {
  const { state, toggleTheme } = useKLineChart();

  return (
    <View>
      <Toolbar isDarkTheme={state.isDarkTheme} onToggleTheme={toggleTheme} />
      <KLineChart optionList={state.optionList} />
      <ControlBar {...controlBarProps} />
    </View>
  );
};
```

### 3. **Sử dụng Custom Hook**

```tsx
import { useKLineChart } from './src/hooks/useKLineChart';

const MyComponent = () => {
  const {
    state,
    toggleTheme,
    selectTimeType,
    selectIndicator,
    // ... other methods
  } = useKLineChart();

  // Your component logic
};
```

## 🔧 Cấu hình TypeScript

### **tsconfig.json**
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

## 📚 API Reference

### **Components**

#### **KLineChart**
```tsx
interface KLineChartProps {
  optionList: string | null;
  onDrawItemDidTouch?: (event: any) => void;
  onDrawItemComplete?: (event: any) => void;
  onDrawPointComplete?: (event: any) => void;
}
```

#### **Toolbar**
```tsx
interface ToolbarProps {
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}
```

#### **ControlBar**
```tsx
interface ControlBarProps {
  selectedTimeType: number;
  selectedMainIndicator: number;
  selectedSubIndicator: number;
  selectedDrawTool: number;
  onTimeTypePress: () => void;
  onIndicatorPress: () => void;
  onDrawToolPress: () => void;
  onClearDrawings: () => void;
  theme: Theme;
}
```

### **Custom Hook**

#### **useKLineChart**
```tsx
const {
  state,                    // App state
  toggleTheme,             // Toggle dark/light theme
  selectTimeType,          // Select time period
  selectIndicator,         // Select technical indicator
  selectDrawTool,          // Select drawing tool
  clearDrawings,           // Clear all drawings
  toggleDrawContinue,      // Toggle continuous drawing
  showTimeSelector,        // Show time selector modal
  showIndicatorSelector,   // Show indicator selector modal
  showDrawToolSelector,    // Show draw tool selector
  closeSelectors,          // Close all selectors
  onDrawItemDidTouch,      // Drawing item touch handler
  onDrawItemComplete,      // Drawing item complete handler
  onDrawPointComplete,     // Drawing point complete handler
} = useKLineChart();
```

### **Types**

#### **KLineData**
```tsx
interface KLineData {
  id: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dateString: string;
  selectedItemList?: Array<{
    title: string;
    detail: string;
    color?: any;
  }>;
  // ... technical indicator data
}
```

#### **Theme**
```tsx
interface Theme {
  backgroundColor: string;
  textColor: string;
  increaseColor: string;
  decreaseColor: string;
  // ... other theme properties
}
```

## 🎨 Customization

### **Thêm Component mới**

1. **Tạo component file**
```tsx
// src/components/MyComponent.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { MyComponentProps } from '../types';

const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
};

export default MyComponent;
```

2. **Thêm vào exports**
```tsx
// src/components/index.ts
export { default as MyComponent } from './MyComponent';
```

3. **Định nghĩa types**
```tsx
// src/types/index.ts
export interface MyComponentProps {
  title: string;
  onPress: () => void;
}
```

### **Thêm Custom Hook**

```tsx
// src/hooks/useMyHook.ts
import { useState, useCallback } from 'react';

export const useMyHook = () => {
  const [value, setValue] = useState<string>('');

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return { value, updateValue };
};
```

## 🔄 Migration từ JavaScript

### **Bước 1: Backup code cũ**
```bash
cp App.js App.js.backup
```

### **Bước 2: Cài đặt TypeScript**
```bash
npm install --save-dev typescript @types/react @types/react-native
```

### **Bước 3: Sử dụng cấu trúc mới**
- Import components từ `src/components`
- Sử dụng `useKLineChart` hook
- Thêm type annotations

### **Bước 4: Test và debug**
```bash
npm run ios
npm run android
```

## 🐛 Troubleshooting

### **Lỗi TypeScript thường gặp**

1. **Property does not exist**
   - Kiểm tra interface definition
   - Đảm bảo props được truyền đúng

2. **Cannot find module**
   - Kiểm tra import paths
   - Đảm bảo file tồn tại

3. **Type 'any' is not allowed**
   - Thêm type annotations cụ thể
   - Sử dụng `unknown` thay vì `any`

### **Performance Issues**

1. **Component re-renders**
   - Sử dụng `React.memo`
   - Optimize `useCallback` dependencies

2. **Memory leaks**
   - Cleanup event listeners
   - Cancel timers và animations

## 📖 Tài liệu tham khảo

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React Native TypeScript](https://reactnative.dev/docs/typescript)
- [React Hooks Guide](https://reactjs.org/docs/hooks-intro.html)

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes với TypeScript
4. Tạo Pull Request

## 📄 License

Apache License 2.0 - Xem [LICENSE](../LICENSE) để biết thêm chi tiết.

---

**Lưu ý**: Cấu trúc mới này tương thích ngược với code JavaScript cũ. Bạn có thể chạy song song cả hai phiên bản trong quá trình migration.
