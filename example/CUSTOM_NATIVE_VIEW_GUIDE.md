# Custom Native View Guide - React Native K-line View

## 🎯 Tổng quan

Custom Native View cho phép bạn tùy chỉnh hoàn toàn giao diện và hành vi của K-line chart với nhiều tùy chọn nâng cao hơn so với component mặc định.

## ✨ Tính năng Custom Native View

### **1. Custom Styling**

- Tùy chỉnh container style
- Tùy chỉnh chart style
- Custom background components
- Flexible layout options

### **2. Custom Behavior**

- Enable/disable gestures
- Custom zoom controls
- Custom scroll behavior
- Custom drawing tools

### **3. Custom UI Components**

- Custom header với menu và settings
- Custom footer với actions
- Custom side panels (left/right)
- Custom overlay với settings
- Custom loading và error states

### **4. Advanced Gesture Handling**

- Pan gestures với animation
- Zoom gestures với scale
- Long press detection
- Custom touch handling

### **5. Chart Control Methods**

- Programmatic zoom in/out
- Scroll to specific index
- Clear drawings
- Refresh chart data
- Reset transformations

## 🚀 Cách sử dụng

### **1. Basic Usage**

```tsx
import { CustomKLineChart } from './src/components';
import { useCustomKLineChart } from './src/hooks/useCustomKLineChart';

const MyComponent = () => {
  const { state, actions, chartControls, chartRef } = useCustomKLineChart();

  return (
    <CustomKLineChart
      ref={chartRef}
      optionList={optionList}
      onChartPress={actions.onChartPress}
      onChartZoom={actions.onChartZoom}
    />
  );
};
```

### **2. Advanced Usage với Custom Components**

```tsx
import {
  CustomKLineChart,
  CustomHeader,
  CustomFooter,
  CustomLeftPanel,
  CustomRightPanel,
  CustomOverlay,
} from './src/components';

const AdvancedChart = () => {
  const { state, actions, chartControls, chartRef } = useCustomKLineChart();

  return (
    <CustomKLineChart
      ref={chartRef}
      optionList={optionList}
      // Custom header
      showHeader={true}
      headerComponent={
        <CustomHeader
          title="Advanced Chart"
          onMenuPress={() => actions.toggleLeftPanel()}
          onSettingsPress={() => actions.toggleOverlay()}
        />
      }
      // Custom footer
      showFooter={true}
      footerComponent={
        <CustomFooter
          onRefresh={() => actions.refreshChart()}
          onFullscreen={() => actions.toggleHeader()}
          onShare={() => console.log('Share')}
        />
      }
      // Custom side panels
      showLeftPanel={state.showLeftPanel}
      leftPanelComponent={
        <CustomLeftPanel
          onZoomIn={() => chartControls.zoomIn()}
          onZoomOut={() => chartControls.zoomOut()}
          onReset={() => chartControls.resetTransform()}
        />
      }
      showRightPanel={state.showRightPanel}
      rightPanelComponent={
        <CustomRightPanel
          onToggleMA={() => console.log('Toggle MA')}
          onToggleMACD={() => console.log('Toggle MACD')}
          onToggleVolume={() => console.log('Toggle Volume')}
        />
      }
      // Custom overlay
      showOverlay={state.showOverlay}
      overlayContent={<CustomOverlay onClose={() => actions.toggleOverlay()} />}
    />
  );
};
```

## 🔧 Custom Hook API

### **useCustomKLineChart Hook**

```tsx
const {
  state, // Chart state
  actions, // State actions
  chartControls, // Chart control methods
  chartRef, // Chart reference
} = useCustomKLineChart();
```

### **State Properties**

```tsx
interface CustomChartState {
  // Chart state
  isLoading: boolean;
  hasError: boolean;
  isRefreshing: boolean;

  // Gesture state
  isPanning: boolean;
  isZooming: boolean;
  currentScale: number;
  currentPan: { x: number; y: number };

  // UI state
  showOverlay: boolean;
  showHeader: boolean;
  showFooter: boolean;
  showLeftPanel: boolean;
  showRightPanel: boolean;

  // Chart data state
  chartData: any;
  selectedIndex: number;
  visibleRange: { start: number; end: number };

  // Custom components state
  overlayContent: React.ReactNode | null;
  headerContent: React.ReactNode | null;
  footerContent: React.ReactNode | null;
  leftPanelContent: React.ReactNode | null;
  rightPanelContent: React.ReactNode | null;
  backgroundContent: React.ReactNode | null;
}
```

### **Actions Methods**

```tsx
interface CustomChartActions {
  // Chart actions
  setLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  refreshChart: () => void;

  // Gesture actions
  setPanning: (panning: boolean) => void;
  setZooming: (zooming: boolean) => void;
  setScale: (scale: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetTransform: () => void;

  // UI actions
  toggleOverlay: () => void;
  setOverlayContent: (content: React.ReactNode | null) => void;
  toggleHeader: () => void;
  setHeaderContent: (content: React.ReactNode | null) => void;
  toggleFooter: () => void;
  setFooterContent: (content: React.ReactNode | null) => void;
  toggleLeftPanel: () => void;
  setLeftPanelContent: (content: React.ReactNode | null) => void;
  toggleRightPanel: () => void;
  setRightPanelContent: (content: React.ReactNode | null) => void;
  setBackgroundContent: (content: React.ReactNode | null) => void;

  // Chart data actions
  setChartData: (data: any) => void;
  setSelectedIndex: (index: number) => void;
  setVisibleRange: (range: { start: number; end: number }) => void;

  // Event handlers
  onChartPress: (event: any) => void;
  onChartLongPress: (event: any) => void;
  onChartPan: (event: any) => void;
  onChartZoom: (event: any) => void;
  onDrawItemDidTouch: (event: any) => void;
  onDrawItemComplete: (event: any) => void;
  onDrawPointComplete: (event: any) => void;
}
```

### **Chart Control Methods**

```tsx
const chartControls = {
  scrollToEnd: () => void;
  scrollToIndex: (index: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  clearDrawings: () => void;
  getChartData: () => any;
  resetTransform: () => void;
};
```

## 🎨 Custom Components

### **1. CustomHeader**

```tsx
<CustomHeader
  title="Chart Title"
  onMenuPress={() => console.log('Menu pressed')}
  onSettingsPress={() => console.log('Settings pressed')}
  theme={theme}
/>
```

### **2. CustomFooter**

```tsx
<CustomFooter
  onRefresh={() => console.log('Refresh')}
  onFullscreen={() => console.log('Fullscreen')}
  onShare={() => console.log('Share')}
  theme={theme}
/>
```

### **3. CustomLeftPanel**

```tsx
<CustomLeftPanel
  onZoomIn={() => chartControls.zoomIn()}
  onZoomOut={() => chartControls.zoomOut()}
  onReset={() => chartControls.resetTransform()}
  theme={theme}
/>
```

### **4. CustomRightPanel**

```tsx
<CustomRightPanel
  onToggleMA={() => console.log('Toggle MA')}
  onToggleMACD={() => console.log('Toggle MACD')}
  onToggleVolume={() => console.log('Toggle Volume')}
  theme={theme}
/>
```

### **5. CustomOverlay**

```tsx
<CustomOverlay onClose={() => actions.toggleOverlay()} theme={theme} />
```

### **6. CustomBackground**

```tsx
<CustomBackground theme={theme} />
```

### **7. CustomLoading**

```tsx
<CustomLoading message="Loading chart..." theme={theme} />
```

### **8. CustomError**

```tsx
<CustomError
  message="Error loading chart"
  onRetry={() => actions.refreshChart()}
  theme={theme}
/>
```

## 🔄 Event Handling

### **Chart Events**

```tsx
<CustomKLineChart
  onChartPress={event => {
    console.log('Chart pressed:', event);
  }}
  onChartLongPress={event => {
    console.log('Chart long pressed:', event);
  }}
  onChartPan={event => {
    console.log('Chart panned:', event);
  }}
  onChartZoom={event => {
    console.log('Chart zoomed:', event);
  }}
  onDrawItemDidTouch={event => {
    console.log('Draw item touched:', event);
  }}
  onDrawItemComplete={event => {
    console.log('Draw item completed:', event);
  }}
  onDrawPointComplete={event => {
    console.log('Draw point completed:', event);
  }}
/>
```

## 🎯 Advanced Features

### **1. Custom Gesture Handling**

```tsx
const { state, actions } = useCustomKLineChart();

// Enable/disable gestures
<CustomKLineChart
  enableGestures={true}
  enableZoom={true}
  enableScroll={true}
  enableDrawing={true}
  onChartPan={event => {
    actions.setPanning(true);
    actions.setPan({ x: event.dx, y: event.dy });
  }}
  onChartZoom={event => {
    actions.setZooming(true);
    actions.setScale(event.scale);
  }}
/>;
```

### **2. Custom Styling**

```tsx
<CustomKLineChart
  containerStyle={{
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }}
  chartStyle={{
    backgroundColor: '#F5F5F5',
  }}
/>
```

### **3. Custom Loading States**

```tsx
<CustomKLineChart
  isLoading={state.isLoading}
  loadingComponent={
    <View style={styles.customLoading}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text>Custom loading message...</Text>
    </View>
  }
  hasError={state.hasError}
  errorComponent={
    <View style={styles.customError}>
      <Text>Custom error message...</Text>
      <TouchableOpacity onPress={() => actions.refreshChart()}>
        <Text>Retry</Text>
      </TouchableOpacity>
    </View>
  }
/>
```

### **4. Programmatic Control**

```tsx
const { chartControls, chartRef } = useCustomKLineChart();

// Zoom controls
const handleZoomIn = () => {
  chartControls.zoomIn();
};

const handleZoomOut = () => {
  chartControls.zoomOut();
};

const handleReset = () => {
  chartControls.resetTransform();
};

// Scroll controls
const handleScrollToEnd = () => {
  chartControls.scrollToEnd();
};

const handleScrollToIndex = (index: number) => {
  chartControls.scrollToIndex(index);
};

// Drawing controls
const handleClearDrawings = () => {
  chartControls.clearDrawings();
};
```

## 🎨 Customization Examples

### **1. Trading Dashboard**

```tsx
const TradingDashboard = () => {
  const { state, actions, chartControls, chartRef } = useCustomKLineChart();

  return (
    <CustomKLineChart
      ref={chartRef}
      optionList={optionList}
      showHeader={true}
      headerComponent={
        <CustomHeader
          title="BTC/USDT"
          onMenuPress={() => actions.toggleLeftPanel()}
          onSettingsPress={() => actions.toggleOverlay()}
        />
      }
      showLeftPanel={state.showLeftPanel}
      leftPanelComponent={
        <CustomLeftPanel
          onZoomIn={() => chartControls.zoomIn()}
          onZoomOut={() => chartControls.zoomOut()}
          onReset={() => chartControls.resetTransform()}
        />
      }
      showRightPanel={state.showRightPanel}
      rightPanelComponent={
        <CustomRightPanel
          onToggleMA={() => console.log('Toggle MA')}
          onToggleMACD={() => console.log('Toggle MACD')}
          onToggleVolume={() => console.log('Toggle Volume')}
        />
      }
      showFooter={true}
      footerComponent={
        <CustomFooter
          onRefresh={() => actions.refreshChart()}
          onFullscreen={() => actions.toggleHeader()}
          onShare={() => console.log('Share chart')}
        />
      }
    />
  );
};
```

### **2. Mobile Trading App**

```tsx
const MobileTradingApp = () => {
  const { state, actions, chartControls, chartRef } = useCustomKLineChart();

  return (
    <View style={styles.container}>
      <CustomKLineChart
        ref={chartRef}
        optionList={optionList}
        showHeader={true}
        headerComponent={
          <View style={styles.mobileHeader}>
            <Text style={styles.symbol}>BTC/USDT</Text>
            <Text style={styles.price}>$45,230.50</Text>
            <Text style={styles.change}>+2.5%</Text>
          </View>
        }
        showFooter={true}
        footerComponent={
          <View style={styles.mobileFooter}>
            <TouchableOpacity onPress={() => chartControls.zoomIn()}>
              <Text>🔍+</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => chartControls.zoomOut()}>
              <Text>🔍-</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => chartControls.resetTransform()}>
              <Text>🎯</Text>
            </TouchableOpacity>
          </View>
        }
        enableGestures={true}
        enableZoom={true}
        enableScroll={true}
      />
    </View>
  );
};
```

## 🐛 Troubleshooting

### **Common Issues**

1. **Chart not rendering**

   - Check if `optionList` is properly formatted
   - Ensure `chartRef` is properly connected
   - Verify native module is properly linked

2. **Gestures not working**

   - Check if `enableGestures` is set to `true`
   - Verify `onChartPan` and `onChartZoom` handlers are provided
   - Ensure no other components are intercepting touch events

3. **Custom components not showing**

   - Check if corresponding `show*` props are set to `true`
   - Verify component props are properly passed
   - Ensure components are properly imported

4. **Performance issues**
   - Use `React.memo` for custom components
   - Optimize `useCallback` dependencies
   - Consider reducing animation complexity

### **Performance Tips**

1. **Memoization**

   ```tsx
   const MemoizedCustomHeader = React.memo(CustomHeader);
   ```

2. **Optimized callbacks**

   ```tsx
   const handleChartPress = useCallback(event => {
     // Handle press
   }, []);
   ```

3. **Conditional rendering**
   ```tsx
   {
     state.showHeader && <CustomHeader {...headerProps} />;
   }
   ```

## 📚 API Reference

### **CustomKLineChart Props**

| Prop                  | Type                   | Default | Description                     |
| --------------------- | ---------------------- | ------- | ------------------------------- |
| `optionList`          | `string \| null`       | -       | Chart configuration JSON string |
| `containerStyle`      | `any`                  | -       | Custom container styling        |
| `chartStyle`          | `any`                  | -       | Custom chart styling            |
| `enableGestures`      | `boolean`              | `true`  | Enable gesture handling         |
| `enableZoom`          | `boolean`              | `true`  | Enable zoom gestures            |
| `enableScroll`        | `boolean`              | `true`  | Enable scroll gestures          |
| `enableDrawing`       | `boolean`              | `true`  | Enable drawing tools            |
| `showOverlay`         | `boolean`              | `false` | Show overlay component          |
| `overlayContent`      | `React.ReactNode`      | -       | Custom overlay content          |
| `isLoading`           | `boolean`              | `false` | Show loading state              |
| `loadingComponent`    | `React.ReactNode`      | -       | Custom loading component        |
| `hasError`            | `boolean`              | `false` | Show error state                |
| `errorComponent`      | `React.ReactNode`      | -       | Custom error component          |
| `showHeader`          | `boolean`              | `false` | Show header component           |
| `headerComponent`     | `React.ReactNode`      | -       | Custom header component         |
| `showFooter`          | `boolean`              | `false` | Show footer component           |
| `footerComponent`     | `React.ReactNode`      | -       | Custom footer component         |
| `showLeftPanel`       | `boolean`              | `false` | Show left panel                 |
| `leftPanelComponent`  | `React.ReactNode`      | -       | Custom left panel content       |
| `showRightPanel`      | `boolean`              | `false` | Show right panel                |
| `rightPanelComponent` | `React.ReactNode`      | -       | Custom right panel content      |
| `backgroundComponent` | `React.ReactNode`      | -       | Custom background component     |
| `onChartPress`        | `(event: any) => void` | -       | Chart press handler             |
| `onChartLongPress`    | `(event: any) => void` | -       | Chart long press handler        |
| `onChartPan`          | `(event: any) => void` | -       | Chart pan handler               |
| `onChartZoom`         | `(event: any) => void` | -       | Chart zoom handler              |
| `onDrawItemDidTouch`  | `(event: any) => void` | -       | Draw item touch handler         |
| `onDrawItemComplete`  | `(event: any) => void` | -       | Draw item complete handler      |
| `onDrawPointComplete` | `(event: any) => void` | -       | Draw point complete handler     |

### **CustomKLineChartRef Methods**

| Method          | Parameters      | Description              |
| --------------- | --------------- | ------------------------ |
| `scrollToEnd`   | -               | Scroll to end of chart   |
| `scrollToIndex` | `index: number` | Scroll to specific index |
| `zoomIn`        | -               | Zoom in chart            |
| `zoomOut`       | -               | Zoom out chart           |
| `resetZoom`     | -               | Reset zoom to default    |
| `clearDrawings` | -               | Clear all drawings       |
| `getChartData`  | -               | Get current chart data   |
| `refreshChart`  | -               | Refresh chart data       |

---

**Lưu ý**: Custom Native View cung cấp khả năng tùy chỉnh mạnh mẽ nhưng cần được sử dụng cẩn thận để đảm bảo performance và trải nghiệm người dùng tốt nhất.
