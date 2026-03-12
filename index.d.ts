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
  value?: number;
  period?: number;
  kind?: "ma" | "ema";
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
    };
  }
>;

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
  autoCompute?: boolean;
  computeMode?: "prefer_input" | "always";
  ema?: {
    enabled?: boolean;
    periods?: number[];
  };
  targetList?: IndicatorTargetList;
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
  shouldScrollToEnd: boolean;
  configList: JsonObject;
}>;

export type FormatConfig = Partial<{
  price: number;
  volume: number;
  time: number;
}>;

type RNKLineViewBaseProps = ViewProps & {
  /**
   * Candle list used by the simplified JS API.
   * Required when `optionList` is not provided.
   */
  candles?: Candle[];
  dataMode?: "prop" | "imperative";
  preset?: "simple" | "trading" | "binance";

  onDrawItemDidTouch?: (event: DrawItemTouchEvent) => void;
  onDrawItemComplete?: (event: DrawItemCompleteEvent) => void;
  onDrawPointComplete?: (event: DrawPointCompleteEvent) => void;
  onPredictionSelect?: (event: PredictionSelectEvent) => void;

  theme?: ThemeConfig;
  layout?: LayoutConfig;
  indicator?: IndicatorConfig;
  draw?: DrawConfig;
  prediction?: PredictionConfig;
  interaction?: InteractionConfig;
  format?: FormatConfig;
  advanced?: JsonObject;
};

type RNKLineViewPropsWithOptionList = RNKLineViewBaseProps & {
  /**
   * JSON string for optionList config.
   * Cursor style keys inside configList:
   * cursorStyleEnabled, cursorInnerRadiusPx, cursorOuterRadiusPx,
   * cursorInnerColor, cursorOuterColor, cursorOuterBlurRadiusPx,
   * cursorBorderWidthPx, cursorBorderColor,
   * cursorInnerBorderWidthPx, cursorInnerBorderColor.
   */
  optionList: string;
  candles?: Candle[];
};

type RNKLineViewPropsWithCandles = RNKLineViewBaseProps & {
  /**
   * Omit optionList to use simplified API.
   * In this mode, `candles` is required.
   */
  optionList?: undefined;
  dataMode?: "prop" | undefined;
  candles: Candle[];
};

type RNKLineViewPropsImperative = RNKLineViewBaseProps & {
  /**
   * In imperative mode, data is pushed via ref commands.
   * `candles` can be omitted and initialized later via `setData`.
   */
  optionList?: undefined;
  dataMode: "imperative";
  candles?: Candle[];
};

export type RNKLineViewProps =
  | RNKLineViewPropsWithOptionList
  | RNKLineViewPropsWithCandles
  | RNKLineViewPropsImperative;

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
   * Clear any selected prediction state (Entry/SL/TP).
   */
  unPredictionSelect: () => void;
}

declare const RNKLineView: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<RNKLineViewProps> & React.RefAttributes<RNKLineViewRef>
>;

export default RNKLineView;
