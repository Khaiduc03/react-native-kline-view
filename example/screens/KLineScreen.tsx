/**
 * K-line chart example screen
 * Supports indicators, touch drawing tools, and theme switching.
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Switch,
  processColor,
  Platform,
  PixelRatio,
} from 'react-native';
import RNKLineView, {
  PredictionPayload,
  SMCEntryZone,
  SMCResult,
  type Candle,
  type DrawItemCompleteEvent,
  type DrawItemTouchEvent,
  type DrawPointCompleteEvent,
  type RNKLineViewRef,
} from 'react-native-kline-view';

// ==================== Type Definitions ====================

interface KLineRawPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SelectedItem {
  title: string;
  detail: string;
  color?: number;
}

interface MAItem {
  value: number;
  title: string;
}

interface RSItem {
  value: number;
  index: number;
  title: string;
}

interface WRItem {
  value: number;
  index: number;
  title: string;
}

interface KLineModel extends KLineRawPoint {
  id: number;
  vol: number;
  dateString: string;
  selectedItemList: SelectedItem[];
  maList?: (MAItem | undefined)[];
  maVolumeList?: (MAItem | undefined)[];
  bollMb?: number;
  bollUp?: number;
  bollDn?: number;
  macdValue?: number;
  macdDea?: number;
  macdDif?: number;
  kdjK?: number;
  kdjD?: number;
  kdjJ?: number;
  rsiList?: (RSItem | undefined)[];
  wrList?: (WRItem | undefined)[];
}

interface IndicatorConfig {
  title: string;
  selected: boolean;
  index: number;
}

interface TargetList {
  maList: IndicatorConfig[];
  maVolumeList: IndicatorConfig[];
  bollN: string;
  bollP: string;
  macdS: string;
  macdL: string;
  macdM: string;
  kdjN: string;
  kdjM1: string;
  kdjM2: string;
  rsiList: IndicatorConfig[];
  wrList: IndicatorConfig[];
}

interface DrawList {
  shotBackgroundColor: number;
  drawType: number;
  shouldReloadDrawItemIndex: number;
  drawShouldContinue: boolean;
  drawColor: number;
  drawLineHeight: number;
  drawDashWidth: number;
  drawDashSpace: number;
  drawIsLock: boolean;
  shouldFixDraw: boolean;
  shouldClearDraw: boolean;
}

interface ConfigList {
  colorList: {
    increaseColor: number;
    decreaseColor: number;
  };
  targetColorList: number[];
  minuteLineColor: number;
  minuteGradientColorList: number[];
  minuteGradientLocationList: number[];
  backgroundColor: number;
  textColor: number;
  gridColor: number;
  candleTextColor: number;
  panelBackgroundColor: number;
  panelBorderColor: number;
  panelTextColor: number;
  selectedPointContainerColor: number;
  selectedPointContentColor: number;
  closePriceCenterBackgroundColor: number;
  closePriceCenterBorderColor: number;
  closePriceCenterTriangleColor: number;
  closePriceCenterSeparatorColor: number;
  closePriceRightBackgroundColor: number;
  closePriceRightSeparatorColor: number;
  closePriceRightLightLottieFloder: string;
  closePriceRightLightLottieScale: number;
  panelGradientColorList: number[];
  panelGradientLocationList: number[];
  mainFlex: number;
  volumeFlex: number;
  paddingTop: number;
  paddingBottom: number;
  paddingRight: number;
  itemWidth: number;
  candleWidth: number;
  minuteVolumeCandleColor: number;
  minuteVolumeCandleWidth: number;
  macdCandleWidth: number;
  headerTextFontSize: number;
  rightTextFontSize: number;
  candleTextFontSize: number;
  panelTextFontSize: number;
  panelMinWidth: number;
  fontFamily: string;
  closePriceRightLightLottieSource: string;
}

interface KLineOptionList {
  modelArray: KLineModel[];
  shouldScrollToEnd: boolean;
  targetList: TargetList;
  price: number;
  volume: number;
  primary: number;
  second: number;
  time: number;
  configList: ConfigList;
  drawList: DrawList;
}

interface Theme {
  backgroundColor: string;
  titleColor: string;
  detailColor: string;
  textColor7724: string;
  headerColor: string;
  tabBarBackgroundColor: string;
  backgroundColor9103: string;
  backgroundColor9703: string;
  backgroundColor9113: string;
  backgroundColor9709: string;
  backgroundColor9603: string;
  backgroundColor9411: string;
  backgroundColor9607: string;
  backgroundColor9609: string;
  backgroundColor9509: string;
  backgroundColorBlue: string;
  buttonColor: string;
  borderColor: string;
  backgroundOpacity: string;
  increaseColor: string;
  decreaseColor: string;
  minuteLineColor: string;
  gridColor: string;
  separatorColor: string;
  textColor: string;
}

// ==================== Helper Functions ====================

const fixRound = (
  value: number | null | undefined,
  precision: number,
  showSign = false,
  showGrouping = false,
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }

  let result = Number(value).toFixed(precision);

  if (showGrouping) {
    // Add thousands separator
    result = result.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  if (showSign && value > 0) {
    result = '+' + result;
  }

  return result;
};

const FORMAT = (text: string): string => text;

const formatTime = (timestamp: number, format = 'MM-DD HH:mm'): string => {
  const date = new Date(timestamp);

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Common formatting patterns
  return format
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

const calculateBOLL = (data: KLineModel[], n = 20, p = 2): KLineModel[] => {
  return data.map((item, index) => {
    if (index < n - 1) {
      return {
        ...item,
        bollMb: item.close,
        bollUp: item.close,
        bollDn: item.close,
      };
    }

    // Calculate MA
    let sum = 0;
    for (let i = index - n + 1; i <= index; i++) {
      sum += data[i].close;
    }
    const ma = sum / n;

    // Calculate standard deviation
    let variance = 0;
    for (let i = index - n + 1; i <= index; i++) {
      variance += Math.pow(data[i].close - ma, 2);
    }
    const std = Math.sqrt(variance / (n - 1));

    return {
      ...item,
      bollMb: ma,
      bollUp: ma + p * std,
      bollDn: ma - p * std,
    };
  });
};

const calculateMACD = (
  data: KLineModel[],
  s = 12,
  l = 26,
  m = 9,
): KLineModel[] => {
  let ema12 = data[0].close;
  let ema26 = data[0].close;
  let dea = 0;

  return data.map((item, index) => {
    if (index === 0) {
      return {
        ...item,
        macdValue: 0,
        macdDea: 0,
        macdDif: 0,
      };
    }

    // Calculate EMA
    ema12 = (2 * item.close + (s - 1) * ema12) / (s + 1);
    ema26 = (2 * item.close + (l - 1) * ema26) / (l + 1);

    const dif = ema12 - ema26;
    dea = (2 * dif + (m - 1) * dea) / (m + 1);
    const macd = 2 * (dif - dea);

    return {
      ...item,
      macdValue: macd,
      macdDea: dea,
      macdDif: dif,
    };
  });
};

const calculateKDJ = (
  data: KLineModel[],
  n = 9,
  m1 = 3,
  m2 = 3,
): KLineModel[] => {
  let k = 50;
  let d = 50;

  return data.map((item, index) => {
    if (index === 0) {
      return {
        ...item,
        kdjK: k,
        kdjD: d,
        kdjJ: 3 * k - 2 * d,
      };
    }

    // Find the highest and lowest prices within the last n periods
    const startIndex = Math.max(0, index - n + 1);
    let highest = -Infinity;
    let lowest = Infinity;

    for (let i = startIndex; i <= index; i++) {
      highest = Math.max(highest, data[i].high);
      lowest = Math.min(lowest, data[i].low);
    }

    const rsv =
      highest === lowest
        ? 50
        : ((item.close - lowest) / (highest - lowest)) * 100;
    k = (rsv + (m1 - 1) * k) / m1;
    d = (k + (m1 - 1) * d) / m1;
    const j = m2 * k - 2 * d;

    return {
      ...item,
      kdjK: k,
      kdjD: d,
      kdjJ: j,
    };
  });
};

// Screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isHorizontalScreen = screenWidth > screenHeight;

const COLOR = (r: number, g: number, b: number, a = 1): string => {
  if (a === 1) {
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
      b * 255,
    )})`;
  } else {
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
      b * 255,
    )}, ${a})`;
  }
};

// Theme configuration
class ThemeManager {
  static themes = {
    light: {
      // Base colors
      backgroundColor: 'white',
      titleColor: COLOR(0.08, 0.09, 0.12),
      detailColor: COLOR(0.55, 0.62, 0.68),
      textColor7724: COLOR(0.77, 0.81, 0.84),

      // Special background colors
      headerColor: COLOR(0.97, 0.97, 0.98),
      tabBarBackgroundColor: 'white',
      backgroundColor9103: COLOR(0.91, 0.92, 0.93),
      backgroundColor9703: COLOR(0.97, 0.97, 0.98),
      backgroundColor9113: COLOR(0.91, 0.92, 0.93),
      backgroundColor9709: COLOR(0.97, 0.97, 0.98),
      backgroundColor9603: COLOR(0.96, 0.97, 0.98),
      backgroundColor9411: COLOR(0.94, 0.95, 0.96),
      backgroundColor9607: COLOR(0.96, 0.97, 0.99),
      backgroundColor9609: 'white',
      backgroundColor9509: COLOR(0.95, 0.97, 0.99),

      // Functional colors
      backgroundColorBlue: COLOR(0, 0.4, 0.93),
      buttonColor: COLOR(0, 0.4, 0.93),
      borderColor: COLOR(0.91, 0.92, 0.93),
      backgroundOpacity: COLOR(0, 0, 0, 0.5),

      // K-line colors
      increaseColor: COLOR(0.0, 0.78, 0.32), // Up color: green
      decreaseColor: COLOR(1.0, 0.27, 0.27), // Down color: red
      minuteLineColor: COLOR(0, 0.4, 0.93),

      // Grid and borders
      gridColor: COLOR(0.91, 0.92, 0.93),
      separatorColor: COLOR(0.91, 0.92, 0.93),

      // Text colors
      textColor: COLOR(0.08, 0.09, 0.12),
    },
    dark: {
      // Base colors
      backgroundColor: COLOR(0.07, 0.12, 0.19),
      titleColor: COLOR(0.81, 0.83, 0.91),
      detailColor: COLOR(0.43, 0.53, 0.66),
      textColor7724: COLOR(0.24, 0.33, 0.42),

      // Special background colors
      headerColor: COLOR(0.09, 0.16, 0.25),
      tabBarBackgroundColor: COLOR(0.09, 0.16, 0.25),
      backgroundColor9103: COLOR(0.03, 0.09, 0.14),
      backgroundColor9703: COLOR(0.03, 0.09, 0.14),
      backgroundColor9113: COLOR(0.13, 0.2, 0.29),
      backgroundColor9709: COLOR(0.09, 0.16, 0.25),
      backgroundColor9603: COLOR(0.03, 0.09, 0.14),
      backgroundColor9411: COLOR(0.11, 0.17, 0.25),
      backgroundColor9607: COLOR(0.07, 0.15, 0.23),
      backgroundColor9609: COLOR(0.09, 0.15, 0.23),
      backgroundColor9509: COLOR(0.09, 0.16, 0.25),

      // Functional colors
      backgroundColorBlue: COLOR(0.14, 0.51, 1),
      buttonColor: COLOR(0.14, 0.51, 1),
      borderColor: COLOR(0.13, 0.2, 0.29),
      backgroundOpacity: COLOR(0, 0, 0, 0.8),

      // K-line colors
      increaseColor: COLOR(0.0, 1.0, 0.53), // Up color: bright green
      decreaseColor: COLOR(1.0, 0.4, 0.4), // Down color: bright red
      minuteLineColor: COLOR(0.14, 0.51, 1),

      // Grid and borders
      gridColor: COLOR(0.13, 0.2, 0.29),
      separatorColor: COLOR(0.13, 0.2, 0.29),

      // Text colors
      textColor: COLOR(0.81, 0.83, 0.91),
    },
  };

  static getCurrentTheme(isDark: boolean): Theme {
    return this.themes[isDark ? 'dark' : 'light'] as Theme;
  }
}

// Timeframe constants
const TimeConstants = {
  oneMinute: 1,
  threeMinute: 2,
  fiveMinute: 3,
  fifteenMinute: 4,
  thirtyMinute: 5,
  oneHour: 6,
  fourHour: 7,
  sixHour: 8,
  oneDay: 9,
  oneWeek: 10,
  oneMonth: 11,
  minuteHour: -1, // Intraday (minute line)
};

// Timeframe labels (using constants)
const TimeTypes: Record<number, { label: string; value: number }> = {
  1: { label: 'Intraday', value: TimeConstants.minuteHour },
  2: { label: '1m', value: TimeConstants.oneMinute },
  3: { label: '3m', value: TimeConstants.threeMinute },
  4: { label: '5m', value: TimeConstants.fiveMinute },
  5: { label: '15m', value: TimeConstants.fifteenMinute },
  6: { label: '30m', value: TimeConstants.thirtyMinute },
  7: { label: '1h', value: TimeConstants.oneHour },
  8: { label: '4h', value: TimeConstants.fourHour },
  9: { label: '6h', value: TimeConstants.sixHour },
  10: { label: '1D', value: TimeConstants.oneDay },
  11: { label: '1W', value: TimeConstants.oneWeek },
  12: { label: '1M', value: TimeConstants.oneMonth },
};

// Indicator types (sub-chart indices are 3–6)
const IndicatorTypes: {
  main: Record<number, { label: string; value: string }>;
  sub: Record<number, { label: string; value: string }>;
} = {
  main: {
    1: { label: 'MA', value: 'ma' },
    2: { label: 'BOLL', value: 'boll' },
    0: { label: 'NONE', value: 'none' },
  },
  sub: {
    3: { label: 'MACD', value: 'macd' },
    4: { label: 'KDJ', value: 'kdj' },
    5: { label: 'RSI', value: 'rsi' },
    6: { label: 'WR', value: 'wr' },
    0: { label: 'NONE', value: 'none' },
  },
};

// Drawing type constants
const DrawTypeConstants = {
  none: 0,
  show: -1,
  line: 1,
  horizontalLine: 2,
  verticalLine: 3,
  halfLine: 4,
  parallelLine: 5,
  rectangle: 101,
  parallelogram: 102,
};

// Drawing state constants
const DrawStateConstants = {
  none: -3,
  showPencil: -2,
  showContext: -1,
};

// Drawing tool labels
const DrawToolTypes: Record<number, { label: string; value: number }> = {
  [DrawTypeConstants.none]: {
    label: 'CloseDraw',
    value: DrawTypeConstants.none,
  },
  [DrawTypeConstants.line]: { label: 'Segment', value: DrawTypeConstants.line },
  [DrawTypeConstants.horizontalLine]: {
    label: 'Horizontal line',
    value: DrawTypeConstants.horizontalLine,
  },
  [DrawTypeConstants.verticalLine]: {
    label: 'Vertical line',
    value: DrawTypeConstants.verticalLine,
  },
  [DrawTypeConstants.halfLine]: {
    label: 'Ray',
    value: DrawTypeConstants.halfLine,
  },
  [DrawTypeConstants.parallelLine]: {
    label: 'Parallel channel',
    value: DrawTypeConstants.parallelLine,
  },
  [DrawTypeConstants.rectangle]: {
    label: 'Rectangle',
    value: DrawTypeConstants.rectangle,
  },
  [DrawTypeConstants.parallelogram]: {
    label: 'Parallelogram',
    value: DrawTypeConstants.parallelogram,
  },
};

// Drawing tool helpers
const DrawToolHelper = {
  name: (type: number): string => {
    switch (type) {
      case DrawTypeConstants.line:
        return FORMAT('Segment');
      case DrawTypeConstants.horizontalLine:
        return FORMAT('Horizontal line');
      case DrawTypeConstants.verticalLine:
        return FORMAT('Vertical line');
      case DrawTypeConstants.halfLine:
        return FORMAT('Ray');
      case DrawTypeConstants.parallelLine:
        return FORMAT('Parallel channel');
      case DrawTypeConstants.rectangle:
        return FORMAT('Rectangle');
      case DrawTypeConstants.parallelogram:
        return FORMAT('Parallelogram');
    }
    return '';
  },

  count: (type: number): number => {
    if (
      type === DrawTypeConstants.line ||
      type === DrawTypeConstants.horizontalLine ||
      type === DrawTypeConstants.verticalLine ||
      type === DrawTypeConstants.halfLine ||
      type === DrawTypeConstants.rectangle
    ) {
      return 2;
    }
    if (
      type === DrawTypeConstants.parallelLine ||
      type === DrawTypeConstants.parallelogram
    ) {
      return 3;
    }
    return 0;
  },
};

// Assuming these types are defined elsewhere or will be added at the top of the file
// import { PredictionPayload, SMCResult } from './types';
// import SMC_DEMO_JSON from './smc_demo.json';

// ==================== Mock SMC Demo Data ====================

const smcDemoJson: SMCResult = {
  session_id: 'demo-session-001',
  question_input: 'Demo price prediction',
  target_language: 'en',
  model_name: 'gpt-4',
  provider_type: 'openai',
  collection_name: 'demo',
  symbol: 'BTCUSDT',
  interval: '1h',
  mode: 'swing',
  timestamp: Date.now(),
  currentPrice: 50000,
  smcData: {
    orderBlocks: [
      {
        type: 'bullish',
        time: Date.now() - 3600000 * 10,
        high: 48800,
        low: 48200,
        open: 48300,
        close: 48700,
        startIndex: 0,
        endIndex: 5,
        mitigated: false,
      },
    ],
    structureEvents: [
      {
        time: Date.now() - 3600000 * 5,
        type: 'BOS',
        direction: 'bullish',
        level: 49500,
        fromIndex: 0,
        toIndex: 10,
        category: 'swing',
      },
    ],
    liquidityZones: [
      {
        time: Date.now() - 3600000 * 8,
        type: 'EQH',
        level: 53000,
        fromIndex: 5,
        toIndex: 12,
        category: 'swing',
      },
    ],
    fairValueGaps: [
      {
        type: 'bullish',
        startTime: Date.now() - 3600000 * 6,
        startIndex: 8,
        topPrice: 49200,
        bottomPrice: 48900,
        mitigated: false,
        mitigatedIndex: null,
      },
    ],
    premiumDiscount: [
      {
        fromIndex: 0,
        toIndex: 20,
        midpoint: 50500,
      },
    ],
    swingsInternal: [
      {
        time: Date.now() - 3600000 * 12,
        price: 48000,
        type: 'low',
        index: 2,
      },
      {
        time: Date.now() - 3600000 * 6,
        price: 51000,
        type: 'high',
        index: 10,
      },
    ],
    swingsSwing: [
      {
        time: Date.now() - 3600000 * 24,
        price: 47000,
        type: 'low',
        index: 0,
      },
    ],
  },
  metadata: {
    totalOrderBlocks: 1,
    activeOrderBlocks: 1,
    mitigatedOrderBlocks: 0,
    totalStructureEvents: 1,
    bosCount: 1,
    chochCount: 0,
    totalLiquidityZones: 1,
    eqhCount: 1,
    eqlCount: 0,
    totalFairValueGaps: 1,
    activeFvgCount: 1,
    mitigatedFvgCount: 0,
    currentTrend: 'bullish',
    lastStructureType: 'BOS',
    priceInPremium: false,
    nearestSupport: 48000,
    nearestResistance: 53000,
  },
  tradingSignals: {
    bias: 'bullish',
    strength: 'medium',
    entryZones: [
      {
        type: 'order_block',
        price: 48500,
        confidence: 'high',
        reason: 'Strong bullish order block with previous reaction',
      },
      {
        type: 'fvg',
        price: 49000,
        confidence: 'medium',
        reason: 'Fair value gap providing secondary entry opportunity',
      },
    ],
    targets: [
      {
        level: 52000,
        type: 'structure_high',
        reason: 'Previous swing high acting as supply zone',
      },
      {
        level: 54000,
        type: 'liquidity_sweep',
        reason: 'Major liquidity zone from weekly timeframe',
      },
      {
        level: 56000,
        type: 'fibonacci',
        reason: 'Extended target at 1.618 Fibonacci extension',
      },
    ],
    stopLoss: 47500,
    riskRewardRatio: 2.8,
  },
};

// ==================== Prediction Builder ====================

const buildPredictionPayload = (smcResult: SMCResult): PredictionPayload => {
  const { interval, currentPrice, tradingSignals, metadata } = smcResult;

  // Map interval to milliseconds
  const intervalMs = (() => {
    switch (interval) {
      case '1m':
        return 60000;
      case '3m':
        return 180000;
      case '5m':
        return 300000;
      case '15m':
        return 900000;
      case '30m':
        return 1800000;
      case '1h':
        return 3600000;
      case '4h':
        return 14400000;
      case '1d':
        return 86400000;
      case '1w':
        return 604800000;
      default:
        return 3600000; // Default 1h
    }
  })();

  // Calculate horizon candles based on interval
  const horizonCandles = (() => {
    if (intervalMs <= 900000) return 48; // <=15m
    if (intervalMs === 3600000) return 24; // 1h
    return 12; // 4h, 1d
  })();

  // Build levels from SMC data
  const levels: PredictionPayload['levels'] = [
    { type: 'SL', price: tradingSignals.stopLoss, label: 'Stop Loss' },
    { type: 'SUP', price: metadata.nearestSupport, label: 'Support' },
    { type: 'RES', price: metadata.nearestResistance, label: 'Resistance' },
  ];

  // Add entry zone as ENTRY level (prefer high confidence)
  const bestEntry =
    tradingSignals.entryZones.find(
      (z: SMCEntryZone) => z.confidence === 'high',
    ) || tradingSignals.entryZones[0];
  if (bestEntry) {
    levels.push({ type: 'ENTRY', price: bestEntry.price, label: 'Entry' });
  }

  // Add targets as TP1, TP2, TP3...
  tradingSignals.targets.forEach((target: any, idx: number) => {
    const tpType = `TP${idx + 1}` as 'TP1' | 'TP2' | 'TP3';
    levels.push({
      type: tpType,
      price: target.level,
      label: `Target ${idx + 1}`,
    });
  });

  // Build mean line points
  const isBullish = tradingSignals.bias === 'bullish';
  const entryPrice = bestEntry?.price || currentPrice;
  const tp1 = tradingSignals.targets[0]?.level || currentPrice;
  const tp2 = tradingSignals.targets[1]?.level || tp1;

  const points: PredictionPayload['points'] = [];
  points.push({ offset: 0, price: currentPrice });

  if (isBullish) {
    // Dip towards entry around offset 6-10
    points.push({ offset: 6, price: (currentPrice + entryPrice) / 2 });
    points.push({ offset: 10, price: entryPrice });
    // Rise to TP1
    points.push({ offset: Math.floor(horizonCandles * 0.5), price: tp1 });
    // Rise to TP2 by horizon
    points.push({ offset: horizonCandles, price: tp2 });
  } else {
    // Bearish: rise towards entry, then fall to targets
    points.push({ offset: 6, price: (currentPrice + entryPrice) / 2 });
    points.push({ offset: 10, price: entryPrice });
    points.push({ offset: Math.floor(horizonCandles * 0.5), price: tp1 });
    points.push({ offset: horizonCandles, price: tp2 });
  }

  // Build confidence cone bands
  const slPrice = tradingSignals.stopLoss;
  const supPrice = metadata.nearestSupport;
  const resPrice = metadata.nearestResistance;
  const lastTarget =
    tradingSignals.targets[tradingSignals.targets.length - 1]?.level || tp2;

  const bands: PredictionPayload['bands'] = [];
  const segmentCount = 4;
  for (let i = 0; i < segmentCount; i++) {
    const startOffset = Math.floor((i * horizonCandles) / segmentCount);
    const endOffset = Math.floor(((i + 1) * horizonCandles) / segmentCount);
    const widthFactor = (i + 1) / segmentCount;

    if (isBullish) {
      const baseBottom = Math.max(slPrice, supPrice);
      const baseTop = Math.max(resPrice, lastTarget);
      const bottom = baseBottom - baseBottom * 0.02 * widthFactor;
      const top = baseTop + baseTop * 0.02 * widthFactor;
      bands.push({ startOffset, endOffset, bottom, top });
    } else {
      const baseTop = Math.min(slPrice, supPrice);
      const baseBottom = Math.min(resPrice, lastTarget);
      const bottom = baseBottom - baseBottom * 0.02 * widthFactor;
      const top = baseTop + baseTop * 0.02 * widthFactor;
      bands.push({
        startOffset,
        endOffset,
        bottom: Math.min(bottom, top),
        top: Math.max(bottom, top),
      });
    }
  }

  // Build tooltip
  const tooltip: PredictionPayload['tooltip'] = {
    question:
      bestEntry?.reason ||
      tradingSignals.targets[0]?.reason ||
      'Price prediction based on SMC analysis',
    subtitle: `${tradingSignals.bias.toUpperCase()} | ${
      tradingSignals.strength
    } | R:R ${tradingSignals.riskRewardRatio.toFixed(1)}`,
  };

  return {
    intervalMs,
    horizonCandles,
    bias: tradingSignals.bias,
    strength: tradingSignals.strength,
    points,
    bands,
    levels,
    tooltip,
  };
};

// ==================== Pure Functions ====================

const generateMockData = (): KLineRawPoint[] => {
  const data: KLineRawPoint[] = [];
  let lastClose = 50000;
  const now = Date.now();

  for (let i = 0; i < 200; i++) {
    const time = now - (200 - i) * 15 * 60 * 1000; // 15-minute interval

    // Next open equals previous close (continuity)
    const open = lastClose;

    // Generate reasonable high/low
    const volatility = 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * open * volatility;
    const close = Math.max(open + change, open * 0.95); // Max drawdown 5%

    // Ensure high >= max(open, close) and low <= min(open, close)
    const maxPrice = Math.max(open, close);
    const minPrice = Math.min(open, close);
    const high = maxPrice + Math.random() * open * 0.01; // Up to +1%
    const low = minPrice - Math.random() * open * 0.01; // Down to -1%

    const volume = (0.5 + Math.random()) * 1000000; // Volume between 500k and 1.5M

    data.push({
      time: time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(2)),
    });

    lastClose = close;
  }

  return data;
};

const calculateMAWithConfig = (
  data: KLineModel[],
  periodConfigs: Array<{ period: number; index: number }>,
): KLineModel[] => {
  return data.map((item, index) => {
    const maList: (MAItem | undefined)[] = new Array(3); // Fixed 3 slots

    periodConfigs.forEach(config => {
      if (index < config.period - 1) {
        maList[config.index] = { value: item.close, title: `${config.period}` };
      } else {
        let sum = 0;
        for (let i = index - config.period + 1; i <= index; i++) {
          sum += data[i].close;
        }
        maList[config.index] = {
          value: sum / config.period,
          title: `${config.period}`,
        };
      }
    });

    return { ...item, maList };
  });
};

const calculateVolumeMAWithConfig = (
  data: KLineModel[],
  periodConfigs: Array<{ period: number; index: number }>,
): KLineModel[] => {
  return data.map((item, index) => {
    const maVolumeList: (MAItem | undefined)[] = new Array(2); // Fixed 2 slots

    periodConfigs.forEach(config => {
      if (index < config.period - 1) {
        maVolumeList[config.index] = {
          value: item.volume,
          title: `${config.period}`,
        };
      } else {
        let sum = 0;
        for (let i = index - config.period + 1; i <= index; i++) {
          sum += data[i].volume;
        }
        maVolumeList[config.index] = {
          value: sum / config.period,
          title: `${config.period}`,
        };
      }
    });

    return { ...item, maVolumeList };
  });
};

const calculateRSIWithConfig = (
  data: KLineModel[],
  periodConfigs: Array<{ period: number; index: number }>,
): KLineModel[] => {
  return data.map((item, index) => {
    if (index === 0) {
      const rsiList: (RSItem | undefined)[] = new Array(3); // Fixed 3 slots
      periodConfigs.forEach(config => {
        rsiList[config.index] = {
          value: 50,
          index: config.index,
          title: `${config.period}`,
        };
      });
      return { ...item, rsiList };
    }

    const rsiList: (RSItem | undefined)[] = new Array(3); // Fixed 3 slots
    periodConfigs.forEach(config => {
      if (index < config.period) {
        rsiList[config.index] = {
          value: 50,
          index: config.index,
          title: `${config.period}`,
        };
        return;
      }

      let gains = 0;
      let losses = 0;

      for (let i = index - config.period + 1; i <= index; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) gains += change;
        else losses += Math.abs(change);
      }

      const avgGain = gains / config.period;
      const avgLoss = losses / config.period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);

      rsiList[config.index] = {
        value: rsi,
        index: config.index,
        title: `${config.period}`,
      };
    });

    return { ...item, rsiList };
  });
};

const calculateWRWithConfig = (
  data: KLineModel[],
  periodConfigs: Array<{ period: number; index: number }>,
): KLineModel[] => {
  return data.map((item, index) => {
    const wrList: (WRItem | undefined)[] = new Array(1); // Fixed 1 slot

    periodConfigs.forEach(config => {
      if (index < config.period - 1) {
        wrList[config.index] = {
          value: -50,
          index: config.index,
          title: `${config.period}`,
        };
        return;
      }

      // Find the highest and lowest prices in the last `period` periods
      let highest = -Infinity;
      let lowest = Infinity;

      for (let i = index - config.period + 1; i <= index; i++) {
        highest = Math.max(highest, data[i].high);
        lowest = Math.min(lowest, data[i].low);
      }

      const wr =
        highest === lowest
          ? -50
          : -((highest - item.close) / (highest - lowest)) * 100;
      wrList[config.index] = {
        value: wr,
        index: config.index,
        title: `${config.period}`,
      };
    });

    return { ...item, wrList };
  });
};

const calculateIndicatorsFromTargetList = (
  data: KLineModel[],
  targetList: TargetList,
  isMASelected: boolean,
  isBOLLSelected: boolean,
  isMACDSelected: boolean,
  isKDJSelected: boolean,
  _isRSISelected: boolean, // Used in addIndicatorToSelectedList, not here
  _isWRSelected: boolean, // Used in addIndicatorToSelectedList, not here
): KLineModel[] => {
  let processedData = [...data];

  // Calculate MA indicator
  const selectedMAPeriods = targetList.maList
    .filter(item => item.selected)
    .map(item => ({ period: parseInt(item.title, 10), index: item.index }));

  if (selectedMAPeriods.length > 0) {
    processedData = calculateMAWithConfig(processedData, selectedMAPeriods);
  }

  // Calculate Volume MA
  const selectedVolumeMAPeriods = targetList.maVolumeList
    .filter(item => item.selected)
    .map(item => ({ period: parseInt(item.title, 10), index: item.index }));

  if (selectedVolumeMAPeriods.length > 0) {
    processedData = calculateVolumeMAWithConfig(
      processedData,
      selectedVolumeMAPeriods,
    );
  }

  // Calculate Bollinger Bands
  if (isBOLLSelected) {
    processedData = calculateBOLL(
      processedData,
      parseInt(targetList.bollN, 10),
      parseInt(targetList.bollP, 10),
    );
  }

  // Calculate MACD indicator
  if (isMACDSelected) {
    processedData = calculateMACD(
      processedData,
      parseInt(targetList.macdS, 10),
      parseInt(targetList.macdL, 10),
      parseInt(targetList.macdM, 10),
    );
  }

  // Calculate KDJ
  if (isKDJSelected) {
    processedData = calculateKDJ(
      processedData,
      parseInt(targetList.kdjN, 10),
      parseInt(targetList.kdjM1, 10),
      parseInt(targetList.kdjM2, 10),
    );
  }

  // Calculate RSI
  const selectedRSIPeriods = targetList.rsiList
    .filter(item => item.selected)
    .map(item => ({ period: parseInt(item.title, 10), index: item.index }));

  if (selectedRSIPeriods.length > 0) {
    processedData = calculateRSIWithConfig(processedData, selectedRSIPeriods);
  }

  // Calculate Williams %R
  const selectedWRPeriods = targetList.wrList
    .filter(item => item.selected)
    .map(item => ({ period: parseInt(item.title, 10), index: item.index }));

  if (selectedWRPeriods.length > 0) {
    processedData = calculateWRWithConfig(processedData, selectedWRPeriods);
  }

  return processedData;
};

const addIndicatorToSelectedList = (
  item: KLineModel,
  targetList: TargetList,
  priceCount: number,
  isMASelected: boolean,
  isBOLLSelected: boolean,
  isMACDSelected: boolean,
  isKDJSelected: boolean,
  isRSISelected: boolean,
  isWRSelected: boolean,
): void => {
  // Add MA display
  if (isMASelected && item.maList) {
    item.maList.forEach(maItem => {
      if (maItem && maItem.title) {
        item.selectedItemList.push({
          title: `MA${maItem.title}`,
          detail: fixRound(maItem.value, priceCount, false, false),
        });
      }
    });
  }

  // Add Bollinger Bands display
  if (isBOLLSelected && item.bollMb !== undefined) {
    item.selectedItemList.push(
      {
        title: 'BOLL Upper',
        detail: fixRound(item.bollUp!, priceCount, false, false),
      },
      {
        title: 'BOLL Middle',
        detail: fixRound(item.bollMb, priceCount, false, false),
      },
      {
        title: 'BOLL Lower',
        detail: fixRound(item.bollDn!, priceCount, false, false),
      },
    );
  }

  // Add MACD display
  if (isMACDSelected && item.macdDif !== undefined) {
    item.selectedItemList.push(
      { title: 'DIF', detail: fixRound(item.macdDif, 4, false, false) },
      { title: 'DEA', detail: fixRound(item.macdDea!, 4, false, false) },
      { title: 'MACD', detail: fixRound(item.macdValue!, 4, false, false) },
    );
  }

  // Add KDJ display
  if (isKDJSelected && item.kdjK !== undefined) {
    item.selectedItemList.push(
      { title: 'K', detail: fixRound(item.kdjK, 2, false, false) },
      { title: 'D', detail: fixRound(item.kdjD!, 2, false, false) },
      { title: 'J', detail: fixRound(item.kdjJ!, 2, false, false) },
    );
  }

  // Add RSI display
  if (isRSISelected && item.rsiList) {
    item.rsiList.forEach(rsiItem => {
      if (rsiItem && rsiItem.title) {
        item.selectedItemList.push({
          title: `RSI${rsiItem.title}`,
          detail: fixRound(rsiItem.value, 2, false, false),
        });
      }
    });
  }

  // Add Williams %R display
  if (isWRSelected && item.wrList) {
    item.wrList.forEach(wrItem => {
      if (wrItem && wrItem.title) {
        item.selectedItemList.push({
          title: `WR${wrItem.title}`,
          detail: fixRound(wrItem.value, 2, false, false),
        });
      }
    });
  }
};

const processKLineData = (
  rawData: KLineRawPoint[],
  targetList: TargetList,
  isDarkTheme: boolean,
  isMASelected: boolean,
  isBOLLSelected: boolean,
  isMACDSelected: boolean,
  isKDJSelected: boolean,
  isRSISelected: boolean,
  isWRSelected: boolean,
): KLineModel[] => {
  // Mock symbol config
  const symbol = {
    price: 2, // Price precision
    volume: 0, // Volume precision
  };
  const priceCount = symbol.price;
  const volumeCount = symbol.volume;

  // Compute all technical indicators
  let processedData: KLineModel[] = rawData.map(item => ({
    ...item,
    id: item.time,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    vol: item.volume,
    dateString: '',
    selectedItemList: [],
  }));

  // Compute indicators based on targetList config
  processedData = calculateIndicatorsFromTargetList(
    processedData,
    targetList,
    isMASelected,
    isBOLLSelected,
    isMACDSelected,
    isKDJSelected,
    isRSISelected,
    isWRSelected,
  );

  return processedData.map(item => {
    // Time formatting
    const time = formatTime(item.id, 'MM-DD HH:mm');

    // Calculate Change and Change %
    const appendValue = item.close - item.open;
    const appendPercent = (appendValue / item.open) * 100;
    const isAppend = appendValue >= 0;
    const prefixString = isAppend ? '+' : '-';
    const appendValueString =
      prefixString + fixRound(Math.abs(appendValue), priceCount, true, false);
    const appendPercentString =
      prefixString + fixRound(Math.abs(appendPercent), 2, true, false) + '%';

    // Color configuration
    const theme = ThemeManager.getCurrentTheme(isDarkTheme);
    const colorValue = isAppend
      ? processColor(theme.increaseColor)
      : processColor(theme.decreaseColor);
    const color: number | undefined =
      colorValue !== null && colorValue !== undefined
        ? toColorNumber(colorValue)
        : undefined;

    // Add formatted fields
    item.dateString = `${time}`;
    item.selectedItemList = [
      { title: FORMAT('Time'), detail: `${time}` },
      {
        title: FORMAT('Open'),
        detail: fixRound(item.open, priceCount, true, false),
      },
      {
        title: FORMAT('High'),
        detail: fixRound(item.high, priceCount, true, false),
      },
      {
        title: FORMAT('Low'),
        detail: fixRound(item.low, priceCount, true, false),
      },
      {
        title: FORMAT('Close'),
        detail: fixRound(item.close, priceCount, true, false),
      },
      { title: FORMAT('Change'), detail: appendValueString, color },
      { title: FORMAT('Change %'), detail: appendPercentString, color },
      {
        title: FORMAT('Volume'),
        detail: fixRound(item.vol, volumeCount, true, false),
      },
    ];

    // Add indicator display info to selectedItemList
    addIndicatorToSelectedList(
      item,
      targetList,
      priceCount,
      isMASelected,
      isBOLLSelected,
      isMACDSelected,
      isKDJSelected,
      isRSISelected,
      isWRSelected,
    );

    return item;
  });
};

const getTargetList = (
  selectedMainIndicator: number,
  selectedSubIndicator: number,
): TargetList => {
  const isMASelected = selectedMainIndicator === 1;
  const isRSISelected = selectedSubIndicator === 5;
  const isWRSelected = selectedSubIndicator === 6;

  return {
    maList: [
      { title: '5', selected: isMASelected, index: 0 },
      { title: '10', selected: isMASelected, index: 1 },
      { title: '20', selected: isMASelected, index: 2 },
    ],
    maVolumeList: [
      { title: '5', selected: true, index: 0 },
      { title: '10', selected: true, index: 1 },
    ],
    bollN: '20',
    bollP: '2',
    macdS: '12',
    macdL: '26',
    macdM: '9',
    kdjN: '9',
    kdjM1: '3',
    kdjM2: '3',
    rsiList: [
      { title: '6', selected: isRSISelected, index: 0 },
      { title: '12', selected: isRSISelected, index: 1 },
      { title: '24', selected: isRSISelected, index: 2 },
    ],
    wrList: [{ title: '14', selected: isWRSelected, index: 0 }],
  };
};

// Helper to convert processColor result to number
const toColorNumber = (color: ReturnType<typeof processColor>): number => {
  if (color === null || color === undefined) {
    return 0;
  }
  return typeof color === 'number' ? color : 0;
};

const packOptionList = (
  modelArray: KLineModel[],
  targetList: TargetList,
  isDarkTheme: boolean,
  selectedMainIndicator: number,
  selectedSubIndicator: number,
  selectedTimeType: number,
  drawList: DrawList,
): KLineOptionList => {
  const theme = ThemeManager.getCurrentTheme(isDarkTheme);

  // Basic configuration
  const pixelRatio =
    Platform.select({
      android: PixelRatio.get(),
      ios: 1,
    }) || 1;

  const configList: ConfigList = {
    colorList: {
      increaseColor: toColorNumber(processColor(theme.increaseColor)),
      decreaseColor: toColorNumber(processColor(theme.decreaseColor)),
    },
    targetColorList: [
      toColorNumber(processColor(COLOR(0.96, 0.86, 0.58))),
      toColorNumber(processColor(COLOR(0.38, 0.82, 0.75))),
      toColorNumber(processColor(COLOR(0.8, 0.57, 1))),
      toColorNumber(processColor(COLOR(1, 0.23, 0.24))),
      toColorNumber(processColor(COLOR(0.44, 0.82, 0.03))),
      toColorNumber(processColor(COLOR(0.44, 0.13, 1))),
    ],
    minuteLineColor: toColorNumber(processColor(theme.minuteLineColor)),
    minuteGradientColorList: [
      toColorNumber(
        processColor(COLOR(0.094117647, 0.341176471, 0.831372549, 0.149019608)),
      ),
      toColorNumber(
        processColor(COLOR(0.266666667, 0.501960784, 0.97254902, 0.149019608)),
      ),
      toColorNumber(
        processColor(COLOR(0.074509804, 0.121568627, 0.188235294, 0)),
      ),
      toColorNumber(
        processColor(COLOR(0.074509804, 0.121568627, 0.188235294, 0)),
      ),
    ],
    minuteGradientLocationList: [0, 0.3, 0.6, 1],
    backgroundColor: toColorNumber(processColor(theme.backgroundColor)),
    textColor: toColorNumber(processColor(theme.detailColor)),
    gridColor: toColorNumber(processColor(theme.gridColor)),
    candleTextColor: toColorNumber(processColor(theme.titleColor)),
    panelBackgroundColor: toColorNumber(
      processColor(
        isDarkTheme ? COLOR(0.03, 0.09, 0.14, 0.9) : COLOR(1, 1, 1, 0.95),
      ),
    ),
    panelBorderColor: toColorNumber(processColor(theme.detailColor)),
    panelTextColor: toColorNumber(processColor(theme.titleColor)),
    selectedPointContainerColor: toColorNumber(processColor('transparent')),
    selectedPointContentColor: toColorNumber(
      processColor(isDarkTheme ? theme.titleColor : 'white'),
    ),
    closePriceCenterBackgroundColor: toColorNumber(
      processColor(theme.backgroundColor9703),
    ),
    closePriceCenterBorderColor: toColorNumber(
      processColor(theme.textColor7724),
    ),
    closePriceCenterTriangleColor: toColorNumber(
      processColor(theme.textColor7724),
    ),
    closePriceCenterSeparatorColor: toColorNumber(
      processColor(theme.detailColor),
    ),
    closePriceRightBackgroundColor: toColorNumber(
      processColor(theme.backgroundColor),
    ),
    closePriceRightSeparatorColor: toColorNumber(
      processColor(theme.backgroundColorBlue),
    ),
    closePriceRightLightLottieFloder: 'images',
    closePriceRightLightLottieScale: 0.4,
    panelGradientColorList: isDarkTheme
      ? [
          toColorNumber(
            processColor(COLOR(0.0588235, 0.101961, 0.160784, 0.2)),
          ),
          toColorNumber(
            processColor(COLOR(0.811765, 0.827451, 0.913725, 0.101961)),
          ),
          toColorNumber(processColor(COLOR(0.811765, 0.827451, 0.913725, 0.2))),
          toColorNumber(
            processColor(COLOR(0.811765, 0.827451, 0.913725, 0.101961)),
          ),
          toColorNumber(
            processColor(COLOR(0.0784314, 0.141176, 0.223529, 0.2)),
          ),
        ]
      : [
          toColorNumber(processColor(COLOR(1, 1, 1, 0))),
          toColorNumber(
            processColor(COLOR(0.54902, 0.623529, 0.678431, 0.101961)),
          ),
          toColorNumber(
            processColor(COLOR(0.54902, 0.623529, 0.678431, 0.25098)),
          ),
          toColorNumber(
            processColor(COLOR(0.54902, 0.623529, 0.678431, 0.101961)),
          ),
          toColorNumber(processColor(COLOR(1, 1, 1, 0))),
        ],
    panelGradientLocationList: [0, 0.25, 0.5, 0.75, 1],
    mainFlex:
      selectedSubIndicator === 0 ? (isHorizontalScreen ? 0.75 : 0.85) : 0.6,
    volumeFlex: isHorizontalScreen ? 0.25 : 0.15,
    paddingTop: 20 * pixelRatio,
    paddingBottom: 20 * pixelRatio,
    paddingRight: 50 * pixelRatio,
    itemWidth: 8 * pixelRatio,
    candleWidth: 6 * pixelRatio,
    minuteVolumeCandleColor: toColorNumber(
      processColor(COLOR(0.0941176, 0.509804, 0.831373, 0.501961)),
    ),
    minuteVolumeCandleWidth: 2 * pixelRatio,
    macdCandleWidth: 1 * pixelRatio,
    headerTextFontSize: 10 * pixelRatio,
    rightTextFontSize: 10 * pixelRatio,
    candleTextFontSize: 10 * pixelRatio,
    panelTextFontSize: 10 * pixelRatio,
    panelMinWidth: 130 * pixelRatio,
    fontFamily:
      Platform.select({
        ios: 'DINPro-Medium',
        android: '',
      }) || '',
    closePriceRightLightLottieSource: '',
  };

  return {
    modelArray: modelArray,
    shouldScrollToEnd: true,
    targetList: targetList,
    price: 2, // Price precision
    volume: 0, // Volume precision
    primary: selectedMainIndicator,
    second: selectedSubIndicator,
    time: TimeTypes[selectedTimeType].value,
    configList: configList,
    drawList: drawList,
  };
};

// ==================== Component ====================

const KLineScreen: React.FC = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [selectedTimeType, setSelectedTimeType] = useState(2); // corresponds to 1m
  const [selectedMainIndicator, setSelectedMainIndicator] = useState(1); // corresponds to MA
  const [selectedSubIndicator, setSelectedSubIndicator] = useState(
    isHorizontalScreen ? 0 : 3,
  ); // corresponds to MACD
  const [selectedDrawTool, setSelectedDrawTool] = useState(
    DrawTypeConstants.none,
  );
  const [showIndicatorSelector, setShowIndicatorSelector] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [showDrawToolSelector, setShowDrawToolSelector] = useState(false);
  const [klineData, setKlineData] = useState<KLineRawPoint[]>(
    generateMockData(),
  );
  const [drawShouldContinue, setDrawShouldContinue] = useState(true);
  const [drawReloadIndex, setDrawReloadIndex] = useState(
    DrawStateConstants.none,
  );
  const [drawClearFlag, setDrawClearFlag] = useState(false);

  const kLineViewRef = useRef<RNKLineViewRef | null>(null);
  const [isKLineReady, setIsKLineReady] = useState(false);

  const handleKLineRef = useCallback((ref: RNKLineViewRef | null) => {
    kLineViewRef.current = ref;
    setIsKLineReady(!!ref);
    if (ref) {
      console.log('RNKLineView ref attached');
    }
  }, []);

  // Hold the latest dataset on the JS side (useful for Phase 1 imperative updates)
  const nativeDataRef = useRef<KLineModel[]>([]);

  const handleNativeReset = useCallback(() => {
    // Clear chart and in-memory dataset
    nativeDataRef.current = [];
    kLineViewRef.current?.setData?.([]);
  }, []);

  const handleLoadPredictionDemo = useCallback(() => {
    try {
      // Validate SMC JSON with type guard (runtime validation)
      console.log('Loading prediction demo with SMC data...');

      // Build prediction payload from SMC data
      const predictionPayload = buildPredictionPayload(smcDemoJson);
      console.log(
        'Built prediction payload:',
        JSON.stringify(predictionPayload, null, 2),
      );

      // Load mock candles first
      const mockCandles = generateMockData();
      const processedData = processKLineData(
        mockCandles,
        getTargetList(selectedMainIndicator, selectedSubIndicator),
        isDarkTheme,
        isMASelected,
        isBOLLSelected,
        isMACDSelected,
        isKDJSelected,
        isRSISelected,
        isWRSelected,
      );

      //kLineViewRef.current?.setData?.(processedData);

      // Set prediction overlay
      kLineViewRef.current?.setPrediction?.(predictionPayload);

      console.log('Prediction demo loaded successfully');
    } catch (error) {
      console.error('Error loading prediction demo:', error);
    }
  }, [
    selectedMainIndicator,
    selectedSubIndicator,
    selectedTimeType,
    isDarkTheme,
  ]);

  // Update StatusBar when theme changes
  useEffect(() => {
    StatusBar.setBarStyle(isDarkTheme ? 'light-content' : 'dark-content', true);
  }, [isDarkTheme]);

  // Reset draw flags after they're used
  useEffect(() => {
    if (drawReloadIndex !== DrawStateConstants.none) {
      const timer = setTimeout(() => {
        setDrawReloadIndex(DrawStateConstants.none);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [drawReloadIndex]);

  useEffect(() => {
    if (drawClearFlag) {
      const timer = setTimeout(() => {
        setDrawClearFlag(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [drawClearFlag]);

  // Indicator selection helpers
  const isMASelected = useMemo(
    () => selectedMainIndicator === 1,
    [selectedMainIndicator],
  );
  const isBOLLSelected = useMemo(
    () => selectedMainIndicator === 2,
    [selectedMainIndicator],
  );
  const isMACDSelected = useMemo(
    () => selectedSubIndicator === 3,
    [selectedSubIndicator],
  );
  const isKDJSelected = useMemo(
    () => selectedSubIndicator === 4,
    [selectedSubIndicator],
  );
  const isRSISelected = useMemo(
    () => selectedSubIndicator === 5,
    [selectedSubIndicator],
  );
  const isWRSelected = useMemo(
    () => selectedSubIndicator === 6,
    [selectedSubIndicator],
  );

  // Derive targetList from selected indicators
  const targetList = useMemo(() => {
    return getTargetList(selectedMainIndicator, selectedSubIndicator);
  }, [selectedMainIndicator, selectedSubIndicator]);

  // Process K-line data with indicators
  const processedKLineData = useMemo(() => {
    return processKLineData(
      klineData,
      targetList,
      isDarkTheme,
      isMASelected,
      isBOLLSelected,
      isMACDSelected,
      isKDJSelected,
      isRSISelected,
      isWRSelected,
    );
  }, [
    klineData,
    targetList,
    isDarkTheme,
    isMASelected,
    isBOLLSelected,
    isMACDSelected,
    isKDJSelected,
    isRSISelected,
    isWRSelected,
  ]);

  // Keep nativeDataRef in sync with processedKLineData
  useEffect(() => {
    nativeDataRef.current = processedKLineData;
  }, [processedKLineData]);

  const handleNativeAppend = useCallback(() => {
    const list = nativeDataRef.current;
    if (!list.length) {
      // If chart is empty (after reset), re-seed with mock data first
      const seed = processKLineData(
        generateMockData(),
        targetList,
        isDarkTheme,
        isMASelected,
        isBOLLSelected,
        isMACDSelected,
        isKDJSelected,
        isRSISelected,
        isWRSelected,
      );
      nativeDataRef.current = seed;
      kLineViewRef.current?.setData?.(seed as unknown as Candle[]);
      return;
    }

    const last = list[list.length - 1];
    const nextTime = last.time + 60 * 1000;
    const nextOpen = last.close;
    const nextClose = nextOpen * (1 + (Math.random() - 0.5) * 0.01);
    const nextHigh =
      Math.max(nextOpen, nextClose) * (1 + Math.random() * 0.005);
    const nextLow = Math.min(nextOpen, nextClose) * (1 - Math.random() * 0.005);
    const nextVolume = Math.max(
      1,
      Math.round((last.volume || last.vol || 1) * (0.9 + Math.random() * 0.2)),
    );

    const next: KLineModel = {
      ...last,
      time: nextTime,
      id: nextTime,
      open: nextOpen,
      high: nextHigh,
      low: nextLow,
      close: nextClose,
      volume: nextVolume,
      vol: nextVolume,
      dateString: formatTime(nextTime),
    };

    // Recompute indicators for the new dataset so MA/BOLL/MACD/etc. stay correct
    const processed = processKLineData(
      [...list, next],
      targetList,
      isDarkTheme,
      isMASelected,
      isBOLLSelected,
      isMACDSelected,
      isKDJSelected,
      isRSISelected,
      isWRSelected,
    );
    nativeDataRef.current = processed;
    const latest = processed[processed.length - 1] as unknown as Candle;
    kLineViewRef.current?.appendCandle?.(latest);
  }, [
    targetList,
    isDarkTheme,
    isMASelected,
    isBOLLSelected,
    isMACDSelected,
    isKDJSelected,
    isRSISelected,
    isWRSelected,
  ]);

  const handleNativeUpdateLast = useCallback(() => {
    const list = nativeDataRef.current;
    if (!list.length) return;

    const last = list[list.length - 1];
    // Use a larger delta so the update is visibly reflected on chart
    const nextClose = last.close * (1 + (Math.random() - 0.5) * 0.02);

    // Keep the same id/time; only update OHLC (tick update on current last candle)
    const updated: KLineModel = {
      ...last,
      close: nextClose,
      high: Math.max(last.high, nextClose),
      low: Math.min(last.low, nextClose),
    };

    // Recompute indicators with updated last candle
    const processed = processKLineData(
      [...list.slice(0, -1), updated],
      targetList,
      isDarkTheme,
      isMASelected,
      isBOLLSelected,
      isMACDSelected,
      isKDJSelected,
      isRSISelected,
      isWRSelected,
    );
    nativeDataRef.current = processed;
    const latest = processed[processed.length - 1] as unknown as Candle;

    if (!kLineViewRef.current?.updateLastCandle) {
      console.warn('RNKLineView ref not ready for updateLastCandle');
      return;
    }
    kLineViewRef.current.updateLastCandle(latest);
  }, [
    targetList,
    isDarkTheme,
    isMASelected,
    isBOLLSelected,
    isMACDSelected,
    isKDJSelected,
    isRSISelected,
    isWRSelected,
  ]);

  // Derive drawList from current draw tool and theme
  const drawList = useMemo(() => {
    const theme = ThemeManager.getCurrentTheme(isDarkTheme);
    return {
      shotBackgroundColor: toColorNumber(processColor(theme.backgroundColor)),
      drawType: selectedDrawTool,
      shouldReloadDrawItemIndex: drawReloadIndex,
      drawShouldContinue: drawShouldContinue,
      drawColor: toColorNumber(processColor(COLOR(1, 0.46, 0.05))),
      drawLineHeight: 2,
      drawDashWidth: 4,
      drawDashSpace: 4,
      drawIsLock: false,
      shouldFixDraw: false,
      shouldClearDraw: drawClearFlag,
    };
  }, [
    selectedDrawTool,
    drawShouldContinue,
    isDarkTheme,
    drawReloadIndex,
    drawClearFlag,
  ]);

  // Pack optionList for native component
  const optionList = useMemo(() => {
    return packOptionList(
      processedKLineData,
      targetList,
      isDarkTheme,
      selectedMainIndicator,
      selectedSubIndicator,
      selectedTimeType,
      drawList,
    );
  }, [
    processedKLineData,
    targetList,
    isDarkTheme,
    selectedMainIndicator,
    selectedSubIndicator,
    selectedTimeType,
    drawList,
  ]);

  // Serialize optionList to JSON string for native component
  const optionListString = useMemo(() => {
    return JSON.stringify(optionList);
  }, [optionList]);

  // Handlers
  const handleToggleTheme = useCallback(() => {
    setIsDarkTheme(prev => !prev);
  }, []);

  const handleSelectTimeType = useCallback((timeType: number) => {
    setSelectedTimeType(timeType);
    setShowTimeSelector(false);
    setKlineData(generateMockData());
    console.log('Switch timeframe:', TimeTypes[timeType].label);
  }, []);

  const handleSelectIndicator = useCallback(
    (type: 'main' | 'sub', indicator: number) => {
      if (type === 'main') {
        setSelectedMainIndicator(indicator);
      } else {
        setSelectedSubIndicator(indicator);
      }
      setShowIndicatorSelector(false);
    },
    [],
  );

  const handleSelectDrawTool = useCallback((tool: number) => {
    setSelectedDrawTool(tool);
    setShowDrawToolSelector(false);
    // Set the reload index flag to notify native component
    setDrawReloadIndex(
      tool === DrawTypeConstants.none
        ? DrawStateConstants.none
        : DrawStateConstants.showContext,
    );
  }, []);

  const handleClearDrawings = useCallback(() => {
    setSelectedDrawTool(DrawTypeConstants.none);
    // Set flags to notify native component to clear drawings
    setDrawReloadIndex(DrawStateConstants.none);
    setDrawClearFlag(true);
  }, []);

  const handleDrawItemDidTouch = useCallback((event: DrawItemTouchEvent) => {
    const { nativeEvent } = event;
    console.log('Draw item touched:', nativeEvent);
  }, []);

  const handleDrawItemComplete = useCallback(
    (event: DrawItemCompleteEvent) => {
      const { nativeEvent } = event;
      console.log('Draw item completed:', nativeEvent);

      // Handle after draw completes
      if (!drawShouldContinue) {
        setSelectedDrawTool(DrawTypeConstants.none);
      }
    },
    [drawShouldContinue],
  );

  const handleDrawPointComplete = useCallback(
    (event: DrawPointCompleteEvent) => {
      const { nativeEvent } = event;
      console.log('Draw point completed:', nativeEvent.pointCount);

      // You can show current drawing progress here
      const totalPoints = DrawToolHelper.count(selectedDrawTool);

      if (totalPoints > 0) {
        const progress = `${nativeEvent.pointCount}/${totalPoints}`;
        console.log(`Drawing progress: ${progress}`);
      }
    },
    [selectedDrawTool],
  );

  // Render helpers
  const theme = useMemo(
    () => ThemeManager.getCurrentTheme(isDarkTheme),
    [isDarkTheme],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.backgroundColor,
          paddingTop: isHorizontalScreen ? 10 : 50,
          paddingBottom: isHorizontalScreen ? 20 : 100,
        },
        toolbar: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: theme.headerColor,
          borderBottomWidth: 1,
          borderBottomColor: theme.gridColor,
        },
        title: {
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.textColor,
        },
        toolbarRight: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        themeLabel: {
          fontSize: 14,
          color: theme.textColor,
          marginRight: 8,
        },
        chartContainer: {
          flex: 1,
          margin: 8,
          borderRadius: 8,
          backgroundColor: theme.backgroundColor,
          borderWidth: 1,
          borderColor: theme.gridColor,
        },
        chart: {
          flex: 1,
          backgroundColor: 'transparent',
        },
        controlBarScroll: {
          flexGrow: 0, // avoid taking extra space; just wrap content
        },
        controlBar: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: theme.headerColor,
          borderTopWidth: 1,
          borderTopColor: theme.gridColor,
        },
        controlButton: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: theme.buttonColor,
        },
        activeButton: {
          backgroundColor: theme.increaseColor,
        },
        controlButtonText: {
          fontSize: 14,
          color: '#FFFFFF',
          fontWeight: '500',
        },
        activeButtonText: {
          color: '#FFFFFF',
        },
        realtimeBar: {
          flexDirection: 'row',
          alignItems: 'center',
          marginLeft: 12,
        },
        realtimeButton: {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: theme.buttonColor,
          marginLeft: 8,
        },
        realtimeButtonText: {
          fontSize: 12,
          color: '#FFFFFF',
          fontWeight: '600',
        },

        selectorOverlay: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        selectorModal: {
          width: screenWidth * 0.8,
          maxHeight: screenHeight * 0.6,
          backgroundColor: theme.backgroundColor,
          borderRadius: 12,
          padding: 16,
        },
        selectorTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.textColor,
          textAlign: 'center',
          marginBottom: 16,
        },
        selectorList: {
          maxHeight: screenHeight * 0.4,
        },
        selectorSectionTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.textColor,
          marginTop: 12,
          marginBottom: 8,
          paddingHorizontal: 12,
        },
        selectorItem: {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 8,
          marginVertical: 2,
        },
        selectedItem: {
          backgroundColor: theme.buttonColor,
        },
        selectorItemText: {
          fontSize: 16,
          color: theme.textColor,
        },
        selectedItemText: {
          color: '#FFFFFF',
          fontWeight: '500',
        },
        closeButton: {
          marginTop: 16,
          paddingVertical: 12,
          backgroundColor: theme.buttonColor,
          borderRadius: 8,
          alignItems: 'center',
        },
        closeButtonText: {
          fontSize: 16,
          color: '#FFFFFF',
          fontWeight: '500',
        },
        selectorContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          padding: 16,
        },
        toolbarButton: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: theme.buttonColor,
        },
        buttonText: {
          fontSize: 14,
          color: '#FFFFFF',
          fontWeight: '500',
        },
      }),
    [theme],
  );

  const renderToolbar = () => (
    <View style={styles.toolbar}>
      <Text style={styles.title}>K-line Chart</Text>
      <View style={styles.toolbarRight}>
        <Text style={styles.themeLabel}>{isDarkTheme ? 'Night' : 'Day'}</Text>
        <Switch
          value={isDarkTheme}
          onValueChange={handleToggleTheme}
          trackColor={{ false: '#E0E0E0', true: theme.buttonColor }}
          thumbColor={isDarkTheme ? '#FFFFFF' : '#F4F3F4'}
        />
      </View>
    </View>
  );

  const renderKLineChart = () => {
    const directRender = (
      <RNKLineView
        ref={handleKLineRef}
        style={styles.chart}
        optionList={optionListString}
        onDrawItemDidTouch={handleDrawItemDidTouch}
        onDrawItemComplete={handleDrawItemComplete}
        onDrawPointComplete={handleDrawPointComplete}
      />
    );
    if (
      (global as { nativeFabricUIManager?: unknown })?.nativeFabricUIManager &&
      Platform.OS === 'ios'
    ) {
      return directRender;
    }
    return (
      <View style={{ flex: 1 }} collapsable={false}>
        <View style={{ flex: 1 }} collapsable={false}>
          <View style={styles.chartContainer} collapsable={false}>
            {directRender}
          </View>
        </View>
      </View>
    );
  };

  const renderControlBar = () => (
    <ScrollView
      horizontal
      style={styles.controlBarScroll}
      contentContainerStyle={styles.controlBar}
    >
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setShowTimeSelector(true)}
      >
        <Text style={styles.controlButtonText}>
          {TimeTypes[selectedTimeType].label}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setShowIndicatorSelector(true)}
      >
        <Text style={styles.controlButtonText}>
          {IndicatorTypes.main[selectedMainIndicator]?.label || 'NONE'}/
          {IndicatorTypes.sub[selectedSubIndicator]?.label || 'NONE'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toolbarButton,
          selectedDrawTool !== DrawTypeConstants.none && styles.activeButton,
        ]}
        onPress={() => {
          setShowDrawToolSelector(!showDrawToolSelector);
          setShowIndicatorSelector(false);
          setShowTimeSelector(false);
        }}
      >
        <Text
          style={[
            styles.buttonText,
            selectedDrawTool !== DrawTypeConstants.none &&
              styles.activeButtonText,
          ]}
        >
          {selectedDrawTool !== DrawTypeConstants.none
            ? DrawToolHelper.name(selectedDrawTool)
            : 'Draw'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.controlButton}
        onPress={handleClearDrawings}
      >
        <Text style={styles.controlButtonText}>Clear</Text>
      </TouchableOpacity>

      {/* Phase 1: Imperative data updates */}
      <View style={styles.realtimeBar}>
        <TouchableOpacity
          style={styles.realtimeButton}
          onPress={handleNativeReset}
        >
          <Text style={styles.realtimeButtonText}>Reset Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.realtimeButton}
          onPress={handleNativeAppend}
        >
          <Text style={styles.realtimeButtonText}>Append</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.realtimeButton}
          onPress={handleNativeUpdateLast}
          disabled={!isKLineReady}
        >
          <Text style={styles.realtimeButtonText}>Update Last</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.realtimeButton, { backgroundColor: '#4CAF50' }]}
          onPress={handleLoadPredictionDemo}
          disabled={!isKLineReady}
        >
          <Text style={styles.realtimeButtonText}>Prediction</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSelectors = () => (
    <>
      {/* Time selector */}
      {showTimeSelector && (
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorModal}>
            <Text style={styles.selectorTitle}>Select timeframe</Text>
            <ScrollView style={styles.selectorList}>
              {Object.keys(TimeTypes).map(timeTypeKey => {
                const timeType = parseInt(timeTypeKey, 10);
                return (
                  <TouchableOpacity
                    key={timeType}
                    style={[
                      styles.selectorItem,
                      selectedTimeType === timeType && styles.selectedItem,
                    ]}
                    onPress={() => handleSelectTimeType(timeType)}
                  >
                    <Text
                      style={[
                        styles.selectorItemText,
                        selectedTimeType === timeType &&
                          styles.selectedItemText,
                      ]}
                    >
                      {TimeTypes[timeType].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTimeSelector(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Indicator selector */}
      {showIndicatorSelector && (
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorModal}>
            <Text style={styles.selectorTitle}>Select indicator</Text>
            <ScrollView style={styles.selectorList}>
              {Object.keys(IndicatorTypes).map(type => (
                <View key={type}>
                  <Text style={styles.selectorSectionTitle}>
                    {type === 'main' ? 'Main' : 'Sub'}
                  </Text>
                  {Object.keys(
                    IndicatorTypes[type as keyof typeof IndicatorTypes],
                  ).map(indicatorKey => {
                    const indicator = parseInt(indicatorKey, 10);
                    return (
                      <TouchableOpacity
                        key={indicator}
                        style={[
                          styles.selectorItem,
                          ((type === 'main' &&
                            selectedMainIndicator === indicator) ||
                            (type === 'sub' &&
                              selectedSubIndicator === indicator)) &&
                            styles.selectedItem,
                        ]}
                        onPress={() =>
                          handleSelectIndicator(
                            type as 'main' | 'sub',
                            indicator,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.selectorItemText,
                            ((type === 'main' &&
                              selectedMainIndicator === indicator) ||
                              (type === 'sub' &&
                                selectedSubIndicator === indicator)) &&
                              styles.selectedItemText,
                          ]}
                        >
                          {IndicatorTypes[type as keyof typeof IndicatorTypes][
                            indicator
                          ]?.label || 'NONE'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowIndicatorSelector(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Drawing tool selector */}
      {showDrawToolSelector && (
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorModal}>
            <Text style={styles.selectorTitle}>Select drawing tool</Text>
            <ScrollView style={styles.selectorList}>
              <View style={styles.selectorContainer}>
                {Object.keys(DrawToolTypes).map(toolKey => (
                  <TouchableOpacity
                    key={toolKey}
                    style={[
                      styles.selectorItem,
                      selectedDrawTool === parseInt(toolKey, 10) &&
                        styles.selectedItem,
                    ]}
                    onPress={() => handleSelectDrawTool(parseInt(toolKey, 10))}
                  >
                    <Text
                      style={[
                        styles.selectorItemText,
                        selectedDrawTool === parseInt(toolKey, 10) &&
                          styles.selectedItemText,
                      ]}
                    >
                      {DrawToolTypes[parseInt(toolKey, 10)].label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                  }}
                >
                  <Text style={styles.selectorItemText}>
                    Continuous drawing:{' '}
                  </Text>
                  <Switch
                    value={drawShouldContinue}
                    onValueChange={setDrawShouldContinue}
                  />
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDrawToolSelector(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {/* Top toolbar */}
      {renderToolbar()}

      {/* K-line Chart */}
      {renderKLineChart()}

      {/* Bottom control bar */}
      {renderControlBar()}

      {/* Selector modal */}
      {renderSelectors()}
    </View>
  );
};

export default KLineScreen;
