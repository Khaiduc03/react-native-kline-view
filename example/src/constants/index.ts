import { processColor } from 'react-native';
import { TimeType, IndicatorType, DrawToolType, Theme } from '../types';

// Screen dimensions
export const { width: screenWidth, height: screenHeight } = require('react-native').Dimensions.get('window');
export const isHorizontalScreen = screenWidth > screenHeight;

// Time period constants
export const TimeConstants = {
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
  minuteHour: -1, // Minute chart
};

// Time period types - using constant values
export const TimeTypes: Record<number, TimeType> = {
  1: { label: 'Minute', value: TimeConstants.minuteHour },
  2: { label: '1min', value: TimeConstants.oneMinute },
  3: { label: '3min', value: TimeConstants.threeMinute },
  4: { label: '5min', value: TimeConstants.fiveMinute },
  5: { label: '15min', value: TimeConstants.fifteenMinute },
  6: { label: '30min', value: TimeConstants.thirtyMinute },
  7: { label: '1hour', value: TimeConstants.oneHour },
  8: { label: '4hour', value: TimeConstants.fourHour },
  9: { label: '6hour', value: TimeConstants.sixHour },
  10: { label: '1day', value: TimeConstants.oneDay },
  11: { label: '1week', value: TimeConstants.oneWeek },
  12: { label: '1month', value: TimeConstants.oneMonth },
};

// Indicator types - sub-chart indicator indices changed to 3-6
export const IndicatorTypes: Record<string, Record<number, IndicatorType>> = {
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
export const DrawTypeConstants = {
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
export const DrawStateConstants = {
  none: -3,
  showPencil: -2,
  showContext: -1,
};

// Drawing tool types - using numeric constants
export const DrawToolTypes: Record<number, DrawToolType> = {
  [DrawTypeConstants.none]: { label: 'Close Drawing', value: DrawTypeConstants.none },
  [DrawTypeConstants.line]: { label: 'Line', value: DrawTypeConstants.line },
  [DrawTypeConstants.horizontalLine]: { label: 'Horizontal Line', value: DrawTypeConstants.horizontalLine },
  [DrawTypeConstants.verticalLine]: { label: 'Vertical Line', value: DrawTypeConstants.verticalLine },
  [DrawTypeConstants.halfLine]: { label: 'Ray', value: DrawTypeConstants.halfLine },
  [DrawTypeConstants.parallelLine]: { label: 'Parallel Channel', value: DrawTypeConstants.parallelLine },
  [DrawTypeConstants.rectangle]: { label: 'Rectangle', value: DrawTypeConstants.rectangle },
  [DrawTypeConstants.parallelogram]: { label: 'Parallelogram', value: DrawTypeConstants.parallelogram },
};

// Theme configuration
export class ThemeManager {
  static themes: Record<string, Theme> = {
    light: {
      // Basic colors
      backgroundColor: 'white',
      titleColor: '#14171A',
      detailColor: '#8B95A1',
      textColor7724: '#C4C9D0',
      
      // Special background colors
      headerColor: '#F7F9FA',
      tabBarBackgroundColor: 'white',
      backgroundColor9103: '#E8EBED',
      backgroundColor9703: '#F7F9FA',
      backgroundColor9113: '#E8EBED',
      backgroundColor9709: '#F7F9FA',
      backgroundColor9603: '#F5F7FA',
      backgroundColor9411: '#F0F2F5',
      backgroundColor9607: '#F5F7FA',
      backgroundColor9609: 'white',
      backgroundColor9509: '#F2F4F7',
      
      // Functional colors
      backgroundColorBlue: '#0066CC',
      buttonColor: '#0066CC',
      borderColor: '#E8EBED',
      backgroundOpacity: 'rgba(0, 0, 0, 0.5)',
      
      // K-line related colors
      increaseColor: '#00C853', // Rising color: green
      decreaseColor: '#FF1744', // Falling color: red
      minuteLineColor: '#0066CC',
      
      // Grid and borders
      gridColor: '#E8EBED',
      separatorColor: '#E8EBED',
      
      // Text colors
      textColor: '#14171A',
    },
    dark: {
      // Basic colors
      backgroundColor: '#121212',
      titleColor: '#CFD3D6',
      detailColor: '#6D7B8A',
      textColor7724: '#3D4852',
      
      // Special background colors
      headerColor: '#1A1D21',
      tabBarBackgroundColor: '#1A1D21',
      backgroundColor9103: '#0A0D11',
      backgroundColor9703: '#0A0D11',
      backgroundColor9113: '#212832',
      backgroundColor9709: '#1A1D21',
      backgroundColor9603: '#0A0D11',
      backgroundColor9411: '#1C2128',
      backgroundColor9607: '#132028',
      backgroundColor9609: '#1A1F28',
      backgroundColor9509: '#1A1D21',
      
      // Functional colors
      backgroundColorBlue: '#2196F3',
      buttonColor: '#2196F3',
      borderColor: '#212832',
      backgroundOpacity: 'rgba(0, 0, 0, 0.8)',
      
      // K-line related colors
      increaseColor: '#00FF87', // Rising color: bright green
      decreaseColor: '#FF6B6B', // Falling color: bright red
      minuteLineColor: '#2196F3',
      
      // Grid and borders
      gridColor: '#212832',
      separatorColor: '#212832',
      
      // Text colors
      textColor: '#CFD3D6',
    },
  };

  static getCurrentTheme(isDark: boolean): Theme {
    return this.themes[isDark ? 'dark' : 'light'];
  }
}
