# 🎯 Custom Pan View Guide - React Native K-Line Chart

## 📋 Tổng quan

Hướng dẫn này sẽ chỉ cho bạn cách **custom lại bảng view khi pan** trên K-line chart mà **KHÔNG cần** xuống native code. Tất cả customization đều được thực hiện ở tầng React Native.

## 🎨 Có 2 cách để custom Pan View

### **Cách 1: Sử dụng CustomKLineChart (Khuyến nghị)**

Đây là cách **dễ nhất** và **linh hoạt nhất**. Bạn có thể custom hoàn toàn UI của pan view bằng React Native components.

#### **1.1. Sử dụng CustomPanView component có sẵn**

```typescript
import CustomKLineChart from './src/components/CustomKLineChart';

<CustomKLineChart
  optionList={optionList}
  // Enable pan view
  enablePanView={true}
  panViewTheme="dark" // hoặc "light"
  // Các props khác...
/>;
```

#### **1.2. Tạo CustomPanView riêng**

```typescript
// src/components/MyCustomPanView.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MyCustomPanViewProps {
  data: any;
  visible: boolean;
  position: { x: number; y: number };
  theme: 'light' | 'dark';
}

const MyCustomPanView: React.FC<MyCustomPanViewProps> = ({
  data,
  visible,
  position,
  theme,
}) => {
  if (!visible || !data) return null;

  return (
    <View style={[styles.container, { left: position.x, top: position.y }]}>
      <Text style={styles.title}>My Custom Pan View</Text>
      <Text>Price: {data.close}</Text>
      <Text>Volume: {data.volume}</Text>
      {/* Thêm các thông tin khác... */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyCustomPanView;
```

#### **1.3. Tích hợp CustomPanView vào CustomKLineChart**

```typescript
// Trong CustomKLineChart.tsx
import MyCustomPanView from './MyCustomPanView';

// Thay thế CustomPanView bằng MyCustomPanView
{
  enablePanView && (
    <MyCustomPanView
      data={panData}
      visible={isPanVisible}
      position={panPosition}
      theme={panViewTheme}
    />
  );
}
```

### **Cách 2: Sử dụng renderLeftPanel/renderRightPanel**

Nếu bạn muốn hiển thị thông tin ở panel bên trái hoặc phải thay vì tooltip floating:

```typescript
<CustomKLineChart
  optionList={optionList}
  // Custom left panel
  showLeftPanel={true}
  leftPanelComponent={(data) => (
    <View style={styles.leftPanel}>
      <Text>Price: {data?.close}</Text>
      <Text>Volume: {data?.volume}</Text>
    </View>
  )}
  // Custom right panel
  showRightPanel={true}
  rightPanelComponent={(data) => (
    <View style={styles.rightPanel}>
      <Text>MA5: {data?.ma5}</Text>
      <Text>MA10: {data?.ma10}</Text>
    </View>
  )}
/>
```

## 🔧 Chi tiết Implementation

### **1. usePanData Hook**

Hook này quản lý state của pan view:

```typescript
// src/hooks/usePanData.ts
export const usePanData = () => {
  const [panData, setPanData] = useState<PanData | null>(null);
  const [panPosition, setPanPosition] = useState<PanPosition>({ x: 0, y: 0 });
  const [isPanVisible, setIsPanVisible] = useState(false);

  const showPan = useCallback((data: PanData, position: PanPosition) => {
    setPanData(data);
    setPanPosition(position);
    setIsPanVisible(true);
  }, []);

  const hidePan = useCallback(() => {
    setIsPanVisible(false);
    setPanData(null);
  }, []);

  const processKLineData = useCallback((rawData: any): PanData => {
    // Process raw K-line data thành format phù hợp
    return {
      time: rawData.dateString || '',
      open: rawData.open || 0,
      high: rawData.high || 0,
      low: rawData.low || 0,
      close: rawData.close || 0,
      change: rawData.close - rawData.open,
      changePercent: ((rawData.close - rawData.open) / rawData.open) * 100,
      volume: rawData.volume || 0,
      // Thêm các indicators...
    };
  }, []);

  return {
    panData,
    panPosition,
    isPanVisible,
    showPan,
    hidePan,
    processKLineData,
  };
};
```

### **2. PanResponder Integration**

PanResponder được tích hợp trong CustomKLineChart để detect pan gestures:

```typescript
// Trong CustomKLineChart.tsx
const panResponder = PanResponder.create({
  onStartShouldSetPanResponder: () => enableGestures,
  onMoveShouldSetPanResponder: () => enableGestures,
  onPanResponderMove: (evt, gestureState) => {
    if (enableScroll) {
      // Update pan position
      panRef.setValue({
        x: lastPanRef.current.x + gestureState.dx,
        y: lastPanRef.current.y + gestureState.dy,
      });

      // Handle pan view
      if (enablePanView && optionList) {
        try {
          const data = JSON.parse(optionList);
          if (data.modelArray && data.modelArray.length > 0) {
            // Calculate which data point is closest to touch position
            const touchX = evt.nativeEvent.locationX;
            const itemWidth = data.configList?.itemWidth || 9;
            const dataIndex = Math.floor(touchX / itemWidth);

            if (dataIndex >= 0 && dataIndex < data.modelArray.length) {
              const klineData = data.modelArray[dataIndex];
              const processedData = processKLineData(klineData);
              showPan(processedData, {
                x: touchX,
                y: evt.nativeEvent.locationY,
              });
            }
          }
        } catch (error) {
          console.error('Error parsing optionList for pan view:', error);
        }
      }
    }
  },
  onPanResponderRelease: () => {
    if (enablePanView) {
      hidePan();
    }
  },
});
```

## 🎨 Customization Options

### **1. Styling**

```typescript
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#1A1D21', // Dark theme background
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    minWidth: 250,
    maxWidth: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#212832',
  },
  section: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#8B95A1',
    fontWeight: '500',
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CFD3D6',
  },
});
```

### **2. Theme Support**

```typescript
interface CustomPanViewProps {
  theme: 'light' | 'dark';
  // ... other props
}

const CustomPanView: React.FC<CustomPanViewProps> = ({ theme, ...props }) => {
  const isDark = theme === 'dark';
  const styles = createStyles(isDark);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1A1D21' : '#F7F9FA' },
      ]}
    >
      {/* Content */}
    </View>
  );
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1A1D21' : '#F7F9FA',
      // ... other styles
    },
    text: {
      color: isDark ? '#CFD3D6' : '#14171A',
    },
  });
```

### **3. Animation**

```typescript
import { Animated } from 'react-native';

const CustomPanView: React.FC<CustomPanViewProps> = ({ visible, ...props }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Content */}
    </Animated.View>
  );
};
```

### **4. Data Processing**

```typescript
const processKLineData = useCallback((rawData: any): PanData => {
  // Calculate change and change percent
  const change = rawData.close - rawData.open;
  const changePercent = (change / rawData.open) * 100;

  return {
    time: rawData.dateString || rawData.time || '',
    open: rawData.open || 0,
    high: rawData.high || 0,
    low: rawData.low || 0,
    close: rawData.close || 0,
    change,
    changePercent,
    volume: rawData.volume || rawData.vol || 0,

    // Moving Averages
    ma5: rawData.ma5 || rawData.maList?.[0]?.value,
    ma10: rawData.ma10 || rawData.maList?.[1]?.value,
    ma20: rawData.ma20 || rawData.maList?.[2]?.value,

    // MACD
    macd: rawData.macd || rawData.macdValue,
    dif: rawData.dif || rawData.macdDif,
    dea: rawData.dea || rawData.macdDea,

    // KDJ
    kdjK: rawData.kdjK,
    kdjD: rawData.kdjD,
    kdjJ: rawData.kdjJ,

    // RSI
    rsi: rawData.rsi || rawData.rsiList?.[0]?.value,

    // WR
    wr: rawData.wr || rawData.wrList?.[0]?.value,
  };
}, []);
```

## 🚀 Advanced Features

### **1. Multiple Pan Views**

```typescript
const CustomMultiPanView: React.FC<Props> = ({ data, position, theme }) => {
  const [activeTab, setActiveTab] = useState<'price' | 'indicators' | 'volume'>(
    'price'
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'price' && styles.activeTab]}
          onPress={() => setActiveTab('price')}
        >
          <Text style={styles.tabText}>Price</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'indicators' && styles.activeTab]}
          onPress={() => setActiveTab('indicators')}
        >
          <Text style={styles.tabText}>Indicators</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'volume' && styles.activeTab]}
          onPress={() => setActiveTab('volume')}
        >
          <Text style={styles.tabText}>Volume</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'price' && <PriceView data={data} />}
      {activeTab === 'indicators' && <IndicatorsView data={data} />}
      {activeTab === 'volume' && <VolumeView data={data} />}
    </View>
  );
};
```

### **2. Interactive Elements**

```typescript
const InteractivePanView: React.FC<Props> = ({ data, position, theme }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setShowDetails(!showDetails)}
        style={styles.header}
      >
        <Text style={styles.title}>Price Info</Text>
        <Text style={styles.arrow}>{showDetails ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.details}>
          <Text>Open: {data.open}</Text>
          <Text>High: {data.high}</Text>
          <Text>Low: {data.low}</Text>
          <Text>Close: {data.close}</Text>
        </View>
      )}
    </View>
  );
};
```

### **3. Custom Positioning**

```typescript
const getPanViewPosition = (
  position: { x: number; y: number },
  screenWidth: number,
  screenHeight: number
) => {
  const panViewWidth = 300;
  const panViewHeight = 200;

  let x = position.x - panViewWidth / 2;
  let y = position.y - panViewHeight - 20; // 20px above touch point

  // Adjust if going off screen
  if (x < 10) x = 10;
  if (x + panViewWidth > screenWidth - 10) x = screenWidth - panViewWidth - 10;
  if (y < 10) y = position.y + 20; // Show below if no space above
  if (y + panViewHeight > screenHeight - 10)
    y = screenHeight - panViewHeight - 10;

  return { x, y };
};
```

## 📱 Example Usage

### **Complete Example**

```typescript
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CustomKLineChart from './src/components/CustomKLineChart';
import { useKLineChart } from './src/hooks/useKLineChart';

const App: React.FC = () => {
  const [enablePanView, setEnablePanView] = useState(true);
  const [panViewTheme, setPanViewTheme] = useState<'light' | 'dark'>('dark');

  const { state, optionList } = useKLineChart();

  return (
    <View style={styles.container}>
      <CustomKLineChart
        optionList={optionList}
        // Pan view customization
        enablePanView={enablePanView}
        panViewTheme={panViewTheme}
        // Chart behavior
        enableGestures={true}
        enableZoom={true}
        enableScroll={true}
        enableDrawing={true}
        // Event handlers
        onChartPress={(event) => console.log('Chart pressed:', event)}
        onChartLongPress={(event) => console.log('Chart long pressed:', event)}
        onChartPan={(event) => console.log('Chart pan:', event)}
        onChartZoom={(event) => console.log('Chart zoom:', event)}
        // Styling
        containerStyle={styles.chartContainer}
        chartStyle={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chartContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chart: {
    flex: 1,
  },
});

export default App;
```

## 🎯 Kết luận

Với cách tiếp cận này, bạn có thể:

✅ **Custom hoàn toàn** UI của pan view mà không cần touch native code  
✅ **Sử dụng React Native components** quen thuộc  
✅ **Tích hợp dễ dàng** với existing codebase  
✅ **Linh hoạt cao** trong việc styling và behavior  
✅ **Performance tốt** vì chỉ render khi cần  
✅ **Dễ maintain** và debug

**Khuyến nghị**: Sử dụng **Cách 1** với `CustomKLineChart` và `CustomPanView` để có được sự linh hoạt tối đa trong việc custom pan view mà không cần xuống native code!
