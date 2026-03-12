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
  value: number;
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

type RNKLineViewBaseProps = ViewProps & {
  /**
   * Candle list used by the simplified JS API.
   * Required when `optionList` is not provided.
   */
  candles?: Candle[];

  onDrawItemDidTouch?: (event: DrawItemTouchEvent) => void;
  onDrawItemComplete?: (event: DrawItemCompleteEvent) => void;
  onDrawPointComplete?: (event: DrawPointCompleteEvent) => void;
  onPredictionSelect?: (event: PredictionSelectEvent) => void;
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
  candles: Candle[];
};

export type RNKLineViewProps =
  | RNKLineViewPropsWithOptionList
  | RNKLineViewPropsWithCandles;

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
