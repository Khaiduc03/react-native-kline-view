export const FORMAT = (text: string): string => text;

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
  minuteHour: -1,
} as const;

export type TimeConstantValue =
  (typeof TimeConstants)[keyof typeof TimeConstants];

export interface TimeTypeItem {
  label: string;
  value: TimeConstantValue;
}

export const TimeTypes: Record<number, TimeTypeItem> = {
  1: { label: '分时', value: TimeConstants.minuteHour },
  2: { label: '1分钟', value: TimeConstants.oneMinute },
  3: { label: '3分钟', value: TimeConstants.threeMinute },
  4: { label: '5分钟', value: TimeConstants.fiveMinute },
  5: { label: '15分钟', value: TimeConstants.fifteenMinute },
  6: { label: '30分钟', value: TimeConstants.thirtyMinute },
  7: { label: '1小时', value: TimeConstants.oneHour },
  8: { label: '4小时', value: TimeConstants.fourHour },
  9: { label: '6小时', value: TimeConstants.sixHour },
  10: { label: '1天', value: TimeConstants.oneDay },
  11: { label: '1周', value: TimeConstants.oneWeek },
  12: { label: '1月', value: TimeConstants.oneMonth },
};

export type MainIndicatorKey = 0 | 1 | 2;
export type SubIndicatorKey = 0 | 3 | 4 | 5 | 6;

export interface IndicatorTypeItem {
  label: string;
  value: 'ma' | 'boll' | 'none' | 'macd' | 'kdj' | 'rsi' | 'wr';
}

export interface IndicatorTypesMap {
  main: Record<MainIndicatorKey, IndicatorTypeItem>;
  sub: Record<SubIndicatorKey, IndicatorTypeItem>;
}

export const IndicatorTypes: IndicatorTypesMap = {
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
} as const;

export type DrawTypeValue =
  (typeof DrawTypeConstants)[keyof typeof DrawTypeConstants];

export const DrawStateConstants = {
  none: -3,
  showPencil: -2,
  showContext: -1,
} as const;

export interface DrawToolItem {
  label: string;
  value: DrawTypeValue;
}

export const DrawToolTypes: Record<number, DrawToolItem> = {
  [DrawTypeConstants.none]: {
    label: '关闭绘图',
    value: DrawTypeConstants.none,
  },
  [DrawTypeConstants.line]: { label: '线段', value: DrawTypeConstants.line },
  [DrawTypeConstants.horizontalLine]: {
    label: '水平线',
    value: DrawTypeConstants.horizontalLine,
  },
  [DrawTypeConstants.verticalLine]: {
    label: '垂直线',
    value: DrawTypeConstants.verticalLine,
  },
  [DrawTypeConstants.halfLine]: {
    label: '射线',
    value: DrawTypeConstants.halfLine,
  },
  [DrawTypeConstants.parallelLine]: {
    label: '平行通道',
    value: DrawTypeConstants.parallelLine,
  },
  [DrawTypeConstants.rectangle]: {
    label: '矩形',
    value: DrawTypeConstants.rectangle,
  },
  [DrawTypeConstants.parallelogram]: {
    label: '平行四边形',
    value: DrawTypeConstants.parallelogram,
  },
};

export const DrawToolHelper = {
  name(type: DrawTypeValue): string {
    switch (type) {
      case DrawTypeConstants.line:
        return FORMAT('线段');
      case DrawTypeConstants.horizontalLine:
        return FORMAT('水平线');
      case DrawTypeConstants.verticalLine:
        return FORMAT('垂直线');
      case DrawTypeConstants.halfLine:
        return FORMAT('射线');
      case DrawTypeConstants.parallelLine:
        return FORMAT('平行通道');
      case DrawTypeConstants.rectangle:
        return FORMAT('矩形');
      case DrawTypeConstants.parallelogram:
        return FORMAT('平行四边形');
      default:
        return '';
    }
  },

  count(type: DrawTypeValue): number {
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
