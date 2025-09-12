# React Native K-line View - Hướng dẫn sử dụng

## 📋 Mục lục

1. [Cài đặt](#cài-đặt)
2. [Cấu hình cơ bản](#cấu-hình-cơ-bản)
3. [Sử dụng component](#sử-dụng-component)
4. [Cấu hình dữ liệu](#cấu-hình-dữ-liệu)
5. [Tùy chỉnh giao diện](#tùy-chỉnh-giao-diện)
6. [Công cụ vẽ](#công-cụ-vẽ)
7. [Chỉ báo kỹ thuật](#chỉ-báo-kỹ-thuật)
8. [Xử lý sự kiện](#xử-lý-sự-kiện)
9. [Ví dụ thực tế](#ví-dụ-thực-tế)
10. [Troubleshooting](#troubleshooting)

## 🚀 Cài đặt

### 1. Cài đặt package

```bash
npm install react-native-kline-view
# hoặc
yarn add react-native-kline-view
```

### 2. Cấu hình iOS

```bash
cd ios && pod install
```

### 3. Cấu hình Android

Android không cần cấu hình thêm.

## ⚙️ Cấu hình cơ bản

### Import component

```javascript
import React, { Component } from 'react';
import { View, processColor } from 'react-native';
import RNKLineView from 'react-native-kline-view';
```

### Cấu hình cơ bản

```javascript
class KLineChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      optionList: null,
    };
  }

  componentDidMount() {
    this.loadKLineData();
  }

  loadKLineData = () => {
    const optionList = {
      modelArray: this.generateMockData(),
      shouldScrollToEnd: true,
      configList: {
        itemWidth: 9,
        candleWidth: 7,
        paddingTop: 20,
        paddingBottom: 20,
        paddingRight: 20,
        mainFlex: 0.7,
        volumeFlex: 0.2,
        colorList: {
          increaseColor: processColor('#00C853'),
          decreaseColor: processColor('#FF1744'),
        },
        textColor: processColor('#FFFFFF'),
        backgroundColor: processColor('#000000'),
      },
    };

    this.setState({ optionList: JSON.stringify(optionList) });
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <RNKLineView style={{ flex: 1 }} optionList={this.state.optionList} />
      </View>
    );
  }
}
```

## 📊 Cấu hình dữ liệu

### Định dạng dữ liệu K-line

```javascript
const klineData = [
  {
    id: 1640995200000, // Timestamp
    open: 50000, // Giá mở cửa
    high: 51000, // Giá cao nhất
    low: 49500, // Giá thấp nhất
    close: 50500, // Giá đóng cửa
    volume: 1000000, // Khối lượng
    dateString: '2022-01-01 00:00', // Chuỗi ngày tháng
  },
  // ... thêm dữ liệu khác
];
```

### Tạo dữ liệu mẫu

```javascript
generateMockData = () => {
  const data = [];
  let lastClose = 50000;
  const now = Date.now();

  for (let i = 0; i < 200; i++) {
    const time = now - (200 - i) * 15 * 60 * 1000; // 15 phút

    const open = lastClose;
    const volatility = 0.02; // 2% biến động
    const change = (Math.random() - 0.5) * open * volatility;
    const close = Math.max(open + change, open * 0.95);

    const maxPrice = Math.max(open, close);
    const minPrice = Math.min(open, close);
    const high = maxPrice + Math.random() * open * 0.01;
    const low = minPrice - Math.random() * open * 0.01;
    const volume = (0.5 + Math.random()) * 1000000;

    data.push({
      id: time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(2)),
      dateString: this.formatTime(time),
    });

    lastClose = close;
  }

  return data;
};
```

## 🎨 Tùy chỉnh giao diện

### Cấu hình màu sắc

```javascript
const colorConfig = {
  colorList: {
    increaseColor: processColor('#00C853'), // Màu tăng
    decreaseColor: processColor('#FF1744'), // Màu giảm
    minuteLineColor: processColor('#2196F3'), // Màu đường phút
  },
  textColor: processColor('#FFFFFF'), // Màu chữ
  backgroundColor: processColor('#000000'), // Màu nền
  gridColor: processColor('#333333'), // Màu lưới
  candleTextColor: processColor('#FFA726'), // Màu chữ nến
};
```

### Cấu hình kích thước

```javascript
const sizeConfig = {
  itemWidth: 9, // Chiều rộng mỗi nến
  candleWidth: 7, // Chiều rộng thân nến
  paddingTop: 20, // Padding trên
  paddingBottom: 20, // Padding dưới
  paddingRight: 20, // Padding phải
  mainFlex: 0.7, // Tỷ lệ chiều cao biểu đồ chính
  volumeFlex: 0.2, // Tỷ lệ chiều cao biểu đồ khối lượng
  headerTextFontSize: 12, // Kích thước chữ tiêu đề
  rightTextFontSize: 10, // Kích thước chữ trục phải
  candleTextFontSize: 10, // Kích thước chữ nến
};
```

### Chủ đề tối/sáng

```javascript
const lightTheme = {
  backgroundColor: processColor('#FFFFFF'),
  textColor: processColor('#000000'),
  gridColor: processColor('#E0E0E0'),
  increaseColor: processColor('#4CAF50'),
  decreaseColor: processColor('#F44336'),
};

const darkTheme = {
  backgroundColor: processColor('#121212'),
  textColor: processColor('#FFFFFF'),
  gridColor: processColor('#333333'),
  increaseColor: processColor('#00E676'),
  decreaseColor: processColor('#FF5252'),
};
```

## ✏️ Công cụ vẽ

### Cấu hình công cụ vẽ

```javascript
const drawConfig = {
  drawType: 1, // 1: Đường thẳng, 2: Đường ngang, 3: Đường dọc
  drawShouldContinue: false, // Tiếp tục vẽ sau khi hoàn thành
  drawColor: processColor('#FF9800'),
  drawLineHeight: 1,
  drawDashWidth: 5,
  drawDashSpace: 3,
  drawIsLock: false,
};
```

### Xử lý sự kiện vẽ

```javascript
<RNKLineView
  optionList={this.state.optionList}
  onDrawItemDidTouch={this.onDrawItemDidTouch}
  onDrawItemComplete={this.onDrawItemComplete}
  onDrawPointComplete={this.onDrawPointComplete}
/>;

// Xử lý sự kiện
onDrawItemDidTouch = (event) => {
  console.log('Drawing item touched:', event.nativeEvent);
};

onDrawItemComplete = (event) => {
  console.log('Drawing completed:', event.nativeEvent);
};

onDrawPointComplete = (event) => {
  console.log('Drawing point completed:', event.nativeEvent.pointCount);
};
```

## 📈 Chỉ báo kỹ thuật

### Cấu hình MA (Moving Average)

```javascript
const maConfig = {
  maList: [
    { title: 'MA5', value: 5, selected: true, index: 0 },
    { title: 'MA10', value: 10, selected: true, index: 1 },
    { title: 'MA20', value: 20, selected: true, index: 2 },
  ],
};
```

### Cấu hình BOLL (Bollinger Bands)

```javascript
const bollConfig = {
  bollN: '20', // Chu kỳ
  bollP: '2', // Hệ số độ lệch chuẩn
};
```

### Cấu hình MACD

```javascript
const macdConfig = {
  macdS: '12', // Chu kỳ EMA nhanh
  macdL: '26', // Chu kỳ EMA chậm
  macdM: '9', // Chu kỳ tín hiệu
};
```

### Cấu hình KDJ

```javascript
const kdjConfig = {
  kdjN: '9', // Chu kỳ
  kdjM1: '3', // Hệ số làm mịn K
  kdjM2: '3', // Hệ số làm mịn D
};
```

## 🔧 Cấu hình hoàn chỉnh

```javascript
const completeConfig = {
  modelArray: klineData,
  shouldScrollToEnd: true,

  // Cấu hình chỉ báo
  targetList: {
    maList: maConfig.maList,
    maVolumeList: volumeMaConfig,
    bollN: bollConfig.bollN,
    bollP: bollConfig.bollP,
    macdS: macdConfig.macdS,
    macdL: macdConfig.macdL,
    macdM: macdConfig.macdM,
    kdjN: kdjConfig.kdjN,
    kdjM1: kdjConfig.kdjM1,
    kdjM2: kdjConfig.kdjM2,
  },

  // Cấu hình giao diện
  configList: {
    ...colorConfig,
    ...sizeConfig,
    fontFamily: 'Arial',
    targetColorList: [
      processColor('#FF6B6B'),
      processColor('#4ECDC4'),
      processColor('#45B7D1'),
      processColor('#96CEB4'),
    ],
  },

  // Cấu hình vẽ
  drawList: drawConfig,

  // Cấu hình chính
  primary: 1, // 1: MA, 2: BOLL
  second: 3, // 3: MACD, 4: KDJ, 5: RSI, 6: WR
  time: 1, // 1: 1 phút, 2: 3 phút, etc.
  price: 2, // Độ chính xác giá
  volume: 0, // Độ chính xác khối lượng
};
```

## 📱 Ví dụ thực tế

### Component hoàn chỉnh

```javascript
import React, { Component } from 'react';
import { View, StyleSheet, processColor } from 'react-native';
import RNKLineView from 'react-native-kline-view';

class TradingChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      optionList: null,
      isDarkTheme: false,
    };
  }

  componentDidMount() {
    this.loadChartData();
  }

  loadChartData = () => {
    const theme = this.state.isDarkTheme
      ? this.getDarkTheme()
      : this.getLightTheme();

    const optionList = {
      modelArray: this.generateMockData(),
      shouldScrollToEnd: true,
      targetList: this.getIndicatorConfig(),
      configList: theme,
      drawList: this.getDrawConfig(),
      primary: 1,
      second: 3,
      time: 1,
      price: 2,
      volume: 0,
    };

    this.setState({
      optionList: JSON.stringify(optionList),
    });
  };

  getLightTheme = () => ({
    itemWidth: 9,
    candleWidth: 7,
    paddingTop: 20,
    paddingBottom: 20,
    paddingRight: 20,
    mainFlex: 0.7,
    volumeFlex: 0.2,
    colorList: {
      increaseColor: processColor('#4CAF50'),
      decreaseColor: processColor('#F44336'),
    },
    textColor: processColor('#000000'),
    backgroundColor: processColor('#FFFFFF'),
    gridColor: processColor('#E0E0E0'),
  });

  getDarkTheme = () => ({
    itemWidth: 9,
    candleWidth: 7,
    paddingTop: 20,
    paddingBottom: 20,
    paddingRight: 20,
    mainFlex: 0.7,
    volumeFlex: 0.2,
    colorList: {
      increaseColor: processColor('#00E676'),
      decreaseColor: processColor('#FF5252'),
    },
    textColor: processColor('#FFFFFF'),
    backgroundColor: processColor('#121212'),
    gridColor: processColor('#333333'),
  });

  getIndicatorConfig = () => ({
    maList: [
      { title: 'MA5', value: 5, selected: true, index: 0 },
      { title: 'MA10', value: 10, selected: true, index: 1 },
      { title: 'MA20', value: 20, selected: true, index: 2 },
    ],
    macdS: '12',
    macdL: '26',
    macdM: '9',
  });

  getDrawConfig = () => ({
    drawType: 0,
    drawShouldContinue: false,
    drawColor: processColor('#FF9800'),
    drawLineHeight: 1,
  });

  generateMockData = () => {
    // Implementation như trên
  };

  toggleTheme = () => {
    this.setState({ isDarkTheme: !this.state.isDarkTheme }, () => {
      this.loadChartData();
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <RNKLineView
          style={styles.chart}
          optionList={this.state.optionList}
          onDrawItemDidTouch={this.onDrawItemDidTouch}
          onDrawItemComplete={this.onDrawItemComplete}
          onDrawPointComplete={this.onDrawPointComplete}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  chart: {
    flex: 1,
  },
});

export default TradingChart;
```

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **Chart không hiển thị**

   - Kiểm tra `optionList` có đúng định dạng JSON không
   - Đảm bảo `modelArray` có dữ liệu

2. **Performance chậm**

   - Giảm số lượng data points
   - Tối ưu hóa `itemWidth` và `candleWidth`

3. **Lỗi màu sắc**

   - Sử dụng `processColor()` cho tất cả màu sắc
   - Kiểm tra định dạng màu hex

4. **Drawing tools không hoạt động**
   - Kiểm tra cấu hình `drawList`
   - Đảm bảo event handlers được định nghĩa

### Tips tối ưu

- Sử dụng `shouldScrollToEnd: false` khi cập nhật dữ liệu real-time
- Tối ưu hóa `itemWidth` dựa trên mật độ dữ liệu
- Sử dụng theme switching thay vì tạo config mới
- Cache `optionList` khi có thể

---

**Lưu ý**: Hướng dẫn này dựa trên phiên bản mới nhất của thư viện. Để biết thêm chi tiết, hãy tham khảo [example/App.js](./example/App.js).
