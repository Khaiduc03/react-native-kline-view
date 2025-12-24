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

export interface RNKLineViewProps extends ViewProps {
  optionList?: string;

  onDrawItemDidTouch?: (event: DrawItemTouchEvent) => void;
  onDrawItemComplete?: (event: DrawItemCompleteEvent) => void;
  onDrawPointComplete?: (event: DrawPointCompleteEvent) => void;
  onPredictionSelect?: (event: PredictionSelectEvent) => void;
}

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
}

declare const RNKLineView: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<RNKLineViewProps> & React.RefAttributes<RNKLineViewRef>
>;

export default RNKLineView;
