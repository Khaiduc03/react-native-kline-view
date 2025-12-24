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
  selectedItemList?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type DrawItemTouchEvent = NativeSyntheticEvent<Record<string, unknown>>;
export type DrawItemCompleteEvent = NativeSyntheticEvent<Record<string, unknown>>;
export type DrawPointCompleteEvent = NativeSyntheticEvent<Record<string, unknown>>;

export type PredictionPoint = {
  /** Offset in candles from anchor candle (0 = anchor candle) */
  offset: number;
  /** Predicted price at this offset */
  price: number;
};

export type PredictionBand = {
  /** Inclusive */
  fromOffset: number;
  /** Inclusive */
  toOffset: number;
  /** Upper bound price */
  top: number;
  /** Lower bound price */
  bottom: number;
  /** 0..1 (optional) */
  confidence?: number;
};

export type PredictionLevel = {
  /** Price level */
  price: number;
  /** Label for tooltip/legend */
  label?: string;
  /** e.g. "resistance" | "support" | "eq" (optional) */
  kind?: string;
};

export type PredictedCandle = {
  /** Offset in candles from anchor candle */
  offset: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type PredictionPayload = {
  /** Base candle timestamp (ms). Used only for tooltip datetime rendering. */
  baseTimestampMs: number;
  /** Candle interval (ms). Example: 1h = 3600000 */
  intervalMs: number;
  /** Number of future candles drawn */
  horizonCandles: number;

  /** Mean/expected price curve */
  points: PredictionPoint[];
  /** Confidence bands (e.g., 80% range) */
  bands?: PredictionBand[];
  /** Key horizontal levels */
  levels?: PredictionLevel[];
  /** Optional OHLC prediction for tooltip */
  predictedCandles?: PredictedCandle[];

  /** If true, include prediction min/max in auto-scale */
  includeInScale?: boolean;
};

export interface RNKLineViewProps extends ViewProps {
  optionList?: string;

  onDrawItemDidTouch?: (event: DrawItemTouchEvent) => void;
  onDrawItemComplete?: (event: DrawItemCompleteEvent) => void;
  onDrawPointComplete?: (event: DrawPointCompleteEvent) => void;
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

  /**
   * iOS-only (Phase 2): set price prediction overlay.
   */
  setPrediction?: (prediction: PredictionPayload) => void;

  /**
   * iOS-only (Phase 2): clear prediction overlay & tooltip.
   */
  clearPrediction?: () => void;
}

declare const RNKLineView: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<RNKLineViewProps> & React.RefAttributes<RNKLineViewRef>
>;

export default RNKLineView;
