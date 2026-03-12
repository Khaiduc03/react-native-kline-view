import * as React from "react";
import type { NativeSyntheticEvent, ViewProps } from "react-native";

export type Candle = {
  id: number;
  dateString: string;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;

  // Optional fields (indicators / info panel / etc.)
  selectedItemList?: Array<Record<string, any>>;
  [key: string]: any;
};

export type DrawItemTouchEvent = NativeSyntheticEvent<Record<string, any>>;
export type DrawItemCompleteEvent = NativeSyntheticEvent<Record<string, any>>;
export type DrawPointCompleteEvent = NativeSyntheticEvent<Record<string, any>>;
export type PredictionSelectEvent = NativeSyntheticEvent<Record<string, any>>;

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
