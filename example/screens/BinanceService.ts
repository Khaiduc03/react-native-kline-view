export interface KLineRawPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type BinanceInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

const SUPPORTED_INTERVALS: BinanceInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

// Binance K-line response format:
// [
//   1499040000000,      // Open time
//   "0.01634790",       // Open
//   "0.80000000",       // High
//   "0.01575800",       // Low
//   "0.01577100",       // Close
//   "148976.11427815",  // Volume
//   ...
// ]
type BinanceResponseItem = [
  number, // Open time
  string, // Open
  string, // High
  string, // Low
  string, // Close
  string, // Volume
  number, // Close time
  string, // Quote asset volume
  number, // Number of trades
  string, // Taker buy base asset volume
  string, // Taker buy quote asset volume
  string, // Ignore
];

interface BinanceWsKlinePayload {
  k?: {
    t?: number; // Open time
    o?: string; // Open
    h?: string; // High
    l?: string; // Low
    c?: string; // Close
    v?: string; // Volume
    x?: boolean; // Is this kline closed?
  };
}

export interface BinanceWsKlineUpdate {
  candle: KLineRawPoint;
  isClosed: boolean;
}

export const normalizeBinanceInterval = (interval: string): BinanceInterval => {
  if (SUPPORTED_INTERVALS.includes(interval as BinanceInterval)) {
    return interval as BinanceInterval;
  }
  return '1m';
};

export const buildBinanceWsUrl = (symbol: string, interval: string): string => {
  const normalizedInterval = normalizeBinanceInterval(interval);
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${normalizedInterval}`;
};

export const parseBinanceWsKlineUpdate = (
  payload: string,
): BinanceWsKlineUpdate | null => {
  try {
    const parsed: BinanceWsKlinePayload = JSON.parse(payload);
    if (!parsed.k) {
      return null;
    }

    const openTime = parsed.k.t;
    const open = parsed.k.o;
    const high = parsed.k.h;
    const low = parsed.k.l;
    const close = parsed.k.c;
    const volume = parsed.k.v;
    const isClosed = parsed.k.x;

    if (
      typeof openTime !== 'number' ||
      typeof open !== 'string' ||
      typeof high !== 'string' ||
      typeof low !== 'string' ||
      typeof close !== 'string' ||
      typeof volume !== 'string' ||
      typeof isClosed !== 'boolean'
    ) {
      return null;
    }

    return {
      candle: {
        time: openTime,
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: parseFloat(volume),
      },
      isClosed,
    };
  } catch {
    return null;
  }
};

export const fetchBinanceKLineData = async (
  symbol: string,
  interval: string,
  limit: number = 200,
): Promise<KLineRawPoint[]> => {
  try {
    const normalizedInterval = normalizeBinanceInterval(interval);
    const normalizedLimit = Math.max(10, Math.min(1000, limit));
    const normalizedSymbol = symbol.toUpperCase();
    const url = `https://api.binance.com/api/v3/klines?symbol=${normalizedSymbol}&interval=${normalizedInterval}&limit=${normalizedLimit}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data: BinanceResponseItem[] = await response.json();

    return data.map(item => ({
      time: item[0],
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5]),
    }));
  } catch (error) {
    console.error('Failed to fetch Binance data:', error);
    return [];
  }
};
