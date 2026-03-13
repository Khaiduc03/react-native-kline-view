import * as React from "react";
import type { NativeSyntheticEvent, ViewProps } from "react-native";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

export type JsonObject = {
  [key: string]: JsonValue;
};

export type SelectedItem = {
  title: string;
  detail: string;
  color?: number;
};

export type IndicatorItem = {
  title: string;
  /**
   * Optional when passing partial server-computed indicators.
   * If missing and `indicator.autoCompute !== false`, library computes fallback value.
   */
  value?: number;
  period?: number;
  multiplier?: number;
  kind?: "ma" | "ema" | "super";
  selected?: boolean;
  index?: number;
};

export type Candle = {
  id: number;
  dateString: string;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
  selectedItemList?: SelectedItem[];
  /**
   * Optional/partial precomputed indicator fields (from server/client).
   * Missing items/values are auto-filled when `indicator.autoCompute !== false`.
   */
  maList?: IndicatorItem[];
  maVolumeList?: IndicatorItem[];
  rsiList?: IndicatorItem[];
  wrList?: IndicatorItem[];
  bollMb?: number;
  bollUp?: number;
  bollDn?: number;
  macdDif?: number;
  macdDea?: number;
  macdValue?: number;
  kdjK?: number;
  kdjD?: number;
  kdjJ?: number;
  [key: string]: JsonValue | undefined;
};

export type DrawItemTouchPayload = {
  shouldReloadDrawItemIndex?: number;
  drawType?: number;
  drawLineHeight?: number;
  drawDashWidth?: number;
  drawDashSpace?: number;
  drawIsLock?: boolean;
  drawColor?: number[] | number;
};

export type DrawItemCompletePayload = JsonObject;

export type DrawPointCompletePayload = {
  pointCount?: number;
};

export type PredictionSelectPayload = {
  type?: "entry" | "sl" | "tp" | string;
  price?: number;
  index?: number;
  [key: string]: JsonValue | undefined;
};

export type DrawItemTouchEvent = NativeSyntheticEvent<DrawItemTouchPayload>;
export type DrawItemCompleteEvent = NativeSyntheticEvent<DrawItemCompletePayload>;
export type DrawPointCompleteEvent = NativeSyntheticEvent<DrawPointCompletePayload>;
export type PredictionSelectEvent = NativeSyntheticEvent<PredictionSelectPayload>;

export type LoadMoreContext = {
  earliestId: number;
  visibleRange: { from: number; to: number };
  firstVisibleId?: number;
};

export type LoadMoreResult = Candle[] | { candles: Candle[]; hasMore?: boolean };

export type CursorStyleConfig = {
  cursorStyleEnabled?: boolean;
  cursorInnerRadiusPx?: number;
  cursorOuterRadiusPx?: number;
  cursorInnerColor?: number;
  cursorOuterColor?: number;
  cursorOuterBlurRadiusPx?: number;
  cursorBorderWidthPx?: number;
  cursorBorderColor?: number;
  cursorInnerBorderWidthPx?: number;
  cursorInnerBorderColor?: number;
};

export type ColorValue = number | string;

export type IndicatorTargetList = {
  maList?: IndicatorItem[];
  maVolumeList?: IndicatorItem[];
  bollN?: string;
  bollP?: string;
  macdS?: string;
  macdL?: string;
  macdM?: string;
  kdjN?: string;
  kdjM1?: string;
  kdjM2?: string;
  rsiList?: IndicatorItem[];
  wrList?: IndicatorItem[];
};

export type ThemeConfig = Partial<
  CursorStyleConfig & {
    colorList: {
      increaseColor?: ColorValue;
      decreaseColor?: ColorValue;
    };
    targetColorList: ColorValue[];
    minuteGradientColorList: ColorValue[];
    panelGradientColorList: ColorValue[];
    minuteLineColor: ColorValue;
    backgroundColor: ColorValue;
    textColor: ColorValue;
    gridColor: ColorValue;
    candleTextColor: ColorValue;
    panelBackgroundColor: ColorValue;
    panelBorderColor: ColorValue;
    panelTextColor: ColorValue;
    selectedPointContainerColor: ColorValue;
    selectedPointContentColor: ColorValue;
    closePriceCenterBackgroundColor: ColorValue;
    closePriceCenterBorderColor: ColorValue;
    closePriceCenterTriangleColor: ColorValue;
    closePriceCenterSeparatorColor: ColorValue;
    closePriceRightBackgroundColor: ColorValue;
    closePriceRightSeparatorColor: ColorValue;
    indicatorColors: {
      ma?: ColorValue[];
      ema?: ColorValue[];
      super?: ColorValue[];
    };
  }
>;

export type ChartThemeConfig = Partial<{
  candle: {
    upColor?: ColorValue;
    downColor?: ColorValue;
    wickUpColor?: ColorValue;
    wickDownColor?: ColorValue;
  };
  mainIndicator: {
    maColors?: ColorValue[];
    emaColors?: ColorValue[];
    superColors?: ColorValue[];
    bollColors?: ColorValue[];
  };
  subIndicator: {
    colors?: ColorValue[];
  };
  volume: {
    barColor?: ColorValue;
  };
  grid: {
    lineColor?: ColorValue;
  };
  axis: {
    textColor?: ColorValue;
  };
  panel: {
    backgroundColor?: ColorValue;
    borderColor?: ColorValue;
  };
  crosshair: {
    enabled?: boolean;
    innerColor?: ColorValue;
    outerColor?: ColorValue;
    innerRadius?: number;
    outerRadius?: number;
  };
}>;

export type LayoutConfig = Partial<{
  mainFlex: number;
  volumeFlex: number;
  paddingTop: number;
  paddingBottom: number;
  paddingRight: number;
  itemWidth: number;
  candleWidth: number;
  minuteVolumeCandleWidth: number;
  macdCandleWidth: number;
  headerTextFontSize: number;
  rightTextFontSize: number;
  candleTextFontSize: number;
  panelTextFontSize: number;
  panelMinWidth: number;
  rightOffsetCandles: number;
  fontFamily: string;
}>;

export type IndicatorConfig = {
  primary?: number;
  main?: {
    ma?: boolean;
    boll?: boolean;
  };
  second?: number;
  time?: number;
  price?: number;
  volume?: number;
  /** Default true in props-first flow. */
  autoCompute?: boolean;
  computeMode?: "prefer_input" | "always";
  ema?: {
    enabled?: boolean;
    periods?: number[];
  };
  super?: {
    enabled?: boolean;
    period?: number;
    multiplier?: number;
  };
  targetList?: IndicatorTargetList;
};

export type MainIndicatorsConfig = {
  ma?: {
    enabled: boolean;
    periods: number[];
  };
  ema?: {
    enabled: boolean;
    periods: number[];
  };
  super?: {
    enabled: boolean;
    period?: number;
    multiplier?: number;
  };
  boll?: {
    enabled: boolean;
    n?: number;
    p?: number;
    style?: "default" | "band_labels";
  };
};

export type SubChartConfig = {
  type: "macd" | "kdj" | "rsi" | "wr";
  enabled: boolean;
  heightRatio?: number;
  params?: JsonObject;
};

export type VolumeConfig = {
  enabled: boolean;
  maPeriods?: number[];
};

export type DrawConfig = Partial<{
  shotBackgroundColor: ColorValue;
  drawType: number;
  shouldReloadDrawItemIndex: number;
  drawShouldContinue: boolean;
  drawColor: ColorValue;
  drawLineHeight: number;
  drawDashWidth: number;
  drawDashSpace: number;
  drawIsLock: boolean;
  shouldFixDraw: boolean;
  shouldClearDraw: boolean;
}>;

export type PredictionTarget = {
  value: number;
  [key: string]: JsonValue | undefined;
};

export type PredictionConfig = Partial<{
  predictionList: PredictionTarget[];
  predictionStartTime: number;
  predictionEntry: number;
  predictionStopLoss: number;
  predictionBias: string;
  predictionEntryZones: JsonValue[];
  predictionMinCandles: number;
}>;

export type InteractionConfig = Partial<{
  shouldScrollToEnd: boolean; // legacy internal
  autoFollow: boolean;
  loadMoreThreshold: number;
  configList: JsonObject;
}>;

export type FormatConfig = Partial<{
  price: number;
  volume: number;
  time: number;
}>;

type RNKLineViewBaseProps = ViewProps & {
  /** Base candles for init/reset. Indicator values can be omitted; wrapper computes from config. */
  initialData?: Candle[];
  /** @deprecated Use `initialData` */
  candles?: Candle[];
  /** @deprecated Removed in vNext, kept for migration warnings at runtime */
  optionList?: string;
  /** @deprecated Legacy simplified indicator config */
  indicator?: IndicatorConfig;
  /** @deprecated Legacy mode flag */
  dataMode?: "prop" | "imperative";
  preset?: "simple" | "trading" | "binance";

  onDrawItemDidTouch?: (event: DrawItemTouchEvent) => void;
  onDrawItemComplete?: (event: DrawItemCompleteEvent) => void;
  onDrawPointComplete?: (event: DrawPointCompleteEvent) => void;
  onPredictionSelect?: (event: PredictionSelectEvent) => void;
  onLoadMore?: (ctx: LoadMoreContext) => Promise<LoadMoreResult>;
  onError?: (error: {
    code: string;
    message: string;
    source: "js" | "bridge" | "ios" | "android" | "data";
    fatal: boolean;
  }) => void;

  theme?: ChartThemeConfig;
  layout?: LayoutConfig;
  mainIndicators?: MainIndicatorsConfig;
  subCharts?: SubChartConfig[];
  volume?: VolumeConfig;
  draw?: DrawConfig;
  prediction?: PredictionConfig;
  interaction?: InteractionConfig;
  format?: FormatConfig;
};

export type RNKLineViewProps = RNKLineViewBaseProps;

export interface RNKLineViewRef {
  /**
   * Replace the whole dataset (reset all candles).
   */
  setData: (candles: Candle[]) => void;

  /**
   * Append one candle to the end.
   */
  appendCandle: (candle: Candle) => void;

  /**
   * Replace the last candle (or append if the dataset is empty).
   */
  updateLastCandle: (candle: Candle) => void;
  /**
   * Insert candles at the start for load-more without snapping viewport.
   */
  prependData: (candles: Candle[]) => void;
  /**
   * Clear any selected prediction state (Entry/SL/TP).
   */
  unPredictionSelect: () => void;
}

declare const RNKLineView: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<RNKLineViewProps> & React.RefAttributes<RNKLineViewRef>
>;

export default RNKLineView;
