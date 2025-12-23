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

export interface RNKLineViewProps extends ViewProps {
  optionList?: string;

  onDrawItemDidTouch?: (event: DrawItemTouchEvent) => void;
  onDrawItemComplete?: (event: DrawItemCompleteEvent) => void;
  onDrawPointComplete?: (event: DrawPointCompleteEvent) => void;
}

// ==================== Price Prediction Types ====================

export type PredictionBias = "bullish" | "bearish" | "neutral";
export type PredictionStrength = "strong" | "medium" | "weak";
export type PredictionConfidence = "high" | "medium" | "low";
export type PredictionLevelType =
  | "SL"
  | "TP1"
  | "TP2"
  | "TP3"
  | "ENTRY"
  | "SUP"
  | "RES";

export interface PredictionPoint {
  /** Offset from anchor (0 = current candle, 1+ = future) */
  offset: number;
  /** Price value at this offset */
  price: number;
}

export interface PredictionBand {
  /** Start offset */
  startOffset: number;
  /** End offset */
  endOffset: number;
  /** Bottom price of band */
  bottom: number;
  /** Top price of band */
  top: number;
}

export interface PredictionLevel {
  /** Level type (SL, TP1, TP2, etc.) */
  type: PredictionLevelType;
  /** Price value */
  price: number;
  /** Label text */
  label: string;
}

export interface PredictionTooltip {
  /** Question/reason text */
  question: string;
  /** Subtitle (bias, strength, etc.) */
  subtitle: string;
}

export interface PredictionPayload {
  /** Interval in milliseconds (e.g., 3600000 for 1h) */
  intervalMs: number;
  /** Number of future candles to predict */
  horizonCandles: number;
  /** Prediction bias direction */
  bias: PredictionBias;
  /** Prediction strength */
  strength: PredictionStrength;
  /** Mean line points (offset + price) */
  points: PredictionPoint[];
  /** Confidence cone bands */
  bands: PredictionBand[];
  /** Horizontal level lines */
  levels: PredictionLevel[];
  /** Tooltip configuration */
  tooltip: PredictionTooltip;
  /** Optional: predicted OHLCV candles */
  predictedCandles?: Array<{
    offset: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
}

// ==================== SMC Data Types ====================

export interface SMCOrderBlock {
  type: "bullish" | "bearish";
  time: number;
  high: number;
  low: number;
  open: number;
  close: number;
  startIndex: number;
  endIndex: number | null;
  mitigated: boolean;
}

export interface SMCStructureEvent {
  time: number;
  type: "BOS" | "CHoCH";
  direction: "bullish" | "bearish";
  level: number;
  fromIndex: number;
  toIndex: number;
  category: "swing" | "internal";
}

export interface SMCLiquidityZone {
  time: number;
  type: "EQH" | "EQL";
  level: number;
  fromIndex: number;
  toIndex: number;
  category: "swing" | "internal";
}

export interface SMCFairValueGap {
  type: "bullish" | "bearish";
  startTime: number;
  startIndex: number;
  topPrice: number;
  bottomPrice: number;
  mitigated: boolean;
  mitigatedIndex: number | null;
}

export interface SMCPremiumDiscount {
  fromIndex: number;
  toIndex: number;
  midpoint: number;
}

export interface SMCSwing {
  time: number;
  price: number;
  type: "high" | "low";
  index: number;
}

export interface SMCData {
  orderBlocks: SMCOrderBlock[];
  structureEvents: SMCStructureEvent[];
  liquidityZones: SMCLiquidityZone[];
  fairValueGaps: SMCFairValueGap[];
  premiumDiscount: SMCPremiumDiscount[];
  swingsInternal: SMCSwing[];
  swingsSwing: SMCSwing[];
}

export interface SMCMetadata {
  totalOrderBlocks: number;
  activeOrderBlocks: number;
  mitigatedOrderBlocks: number;
  totalStructureEvents: number;
  bosCount: number;
  chochCount: number;
  totalLiquidityZones: number;
  eqhCount: number;
  eqlCount: number;
  totalFairValueGaps: number;
  activeFvgCount: number;
  mitigatedFvgCount: number;
  currentTrend: "bullish" | "bearish" | "neutral";
  lastStructureType: "BOS" | "CHoCH" | string;
  priceInPremium: boolean;
  nearestSupport: number;
  nearestResistance: number;
}

export interface SMCEntryZone {
  type: "order_block" | "fvg" | "liquidity" | "structure";
  price: number;
  confidence: PredictionConfidence;
  reason: string;
}

export interface SMCTarget {
  level: number;
  type:
    | "liquidity_sweep"
    | "structure_high"
    | "structure_low"
    | "fibonacci"
    | string;
  reason: string;
}

export interface SMCTradingSignals {
  bias: PredictionBias;
  strength: PredictionStrength;
  entryZones: SMCEntryZone[];
  stopLoss: number;
  targets: SMCTarget[];
  riskRewardRatio: number;
}

export interface SMCResult {
  session_id: string;
  question_input: string;
  target_language: string;
  model_name: string;
  provider_type: string;
  collection_name: string;
  symbol: string;
  interval: string;
  mode: "swing" | "scalp" | "day" | string;
  timestamp: number;
  currentPrice: number;
  smcData: SMCData;
  metadata: SMCMetadata;
  tradingSignals: SMCTradingSignals;
}

// ==================== Type Guards ====================

export function isPredictionPayload(x: unknown): x is PredictionPayload {
  if (typeof x !== "object" || x === null) return false;
  const p = x as Record<string, unknown>;

  return (
    typeof p.intervalMs === "number" &&
    typeof p.horizonCandles === "number" &&
    (p.bias === "bullish" || p.bias === "bearish" || p.bias === "neutral") &&
    (p.strength === "strong" ||
      p.strength === "medium" ||
      p.strength === "weak") &&
    Array.isArray(p.points) &&
    Array.isArray(p.bands) &&
    Array.isArray(p.levels) &&
    typeof p.tooltip === "object" &&
    p.tooltip !== null
  );
}

export function isSMCResult(x: unknown): x is SMCResult {
  if (typeof x !== "object" || x === null) return false;
  const s = x as Record<string, unknown>;

  return (
    typeof s.symbol === "string" &&
    typeof s.interval === "string" &&
    typeof s.timestamp === "number" &&
    typeof s.currentPrice === "number" &&
    typeof s.smcData === "object" &&
    s.smcData !== null &&
    typeof s.metadata === "object" &&
    s.metadata !== null &&
    typeof s.tradingSignals === "object" &&
    s.tradingSignals !== null
  );
}

// ==================== View Ref Methods ====================

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
   * Set price prediction overlay (confidence cone + mean line + levels).
   * Prediction anchors at current last candle index and stays fixed when new candles append.
   */
  setPrediction: (payload: PredictionPayload) => void;

  /**
   * Clear the price prediction overlay.
   */
  clearPrediction: () => void;
}

declare const RNKLineView: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<RNKLineViewProps> & React.RefAttributes<RNKLineViewRef>
>;

export default RNKLineView;
