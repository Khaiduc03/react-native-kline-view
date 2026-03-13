export interface ChartAIData {
  type?: string;
  symbol?: string;
  asset_type?: string;
  horizon?: string;
  regime?: string;
  bias?: string;
  confidence?: number;
  stop_loss?: number;
  position_size?: number;
  market_data?: MarketData;
}

export interface MarketData {
  candles?: Candle[];
  boll_mb?: number[];
  boll_up?: number[];
  boll_dn?: number[];
  boll_mid?: number[];
  boll_upper?: number[];
  boll_lower?: number[];
  ema20?: number[];
  ema50?: number[];
  ema200?: number[];
  rsi14?: number[];
  macd_line?: number[];
  macd_signal?: number[];
  macd_histogram?: number[];
  atr14?: number[];
  adx14?: number[];
  vwap?: null;
}

export interface Candle {
  time?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}
