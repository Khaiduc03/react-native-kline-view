import type { PredictionPayload } from 'react-native-kline-view';

type SmcOrderBlock = {
  type: 'bullish' | 'bearish';
  time: number;
  high: number;
  low: number;
  open: number;
  close: number;
  startIndex: number;
  endIndex: number | null;
  mitigated: boolean;
};

export type SmcDemo = {
  interval: string;
  timestamp: number; // ms
  currentPrice: number;
  smcData?: {
    orderBlocks?: SmcOrderBlock[];
  };
};

const intervalToMs = (interval: string): number => {
  // Supports: 1m, 5m, 15m, 1h, 4h, 1d, 1w
  const m = interval.match(/^([0-9]+)([mhdw])$/i);
  if (!m) return 60_000;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const base =
    unit === 'm'
      ? 60_000
      : unit === 'h'
        ? 3_600_000
        : unit === 'd'
          ? 86_400_000
          : 604_800_000;
  return n * base;
};

const uniq = <T,>(arr: T[]): T[] => Array.from(new Set(arr));

/**
 * Demo payload from SMC sample:
 * - Mean points: smooth drift around currentPrice
 * - Bands: widening cone (confidence decreases)
 * - Levels: derived from top order-block highs/lows
 */
export const buildPredictionPayloadFromSmcDemo = (
  input: SmcDemo,
  horizonCandles = 24
): PredictionPayload => {
  const intervalMs = intervalToMs(input.interval ?? '1h');
  const baseTimestampMs = input.timestamp;
  const base = input.currentPrice;

  const obs = input.smcData?.orderBlocks ?? [];
  const highs = obs.map((o) => o.high).sort((a, b) => b - a).slice(0, 3);
  const lows = obs.map((o) => o.low).sort((a, b) => a - b).slice(0, 3);

  const levels = uniq([...highs, ...lows]).map((price) => ({
    type: price >= base ? 'resistance' : 'support',
    price,
    label: 'OB',
  }));

  // Deterministic “trend” towards nearest level for nicer visuals
  const nearest = [...highs, ...lows].sort(
    (a, b) => Math.abs(a - base) - Math.abs(b - base)
  )[0];
  const target = nearest ?? base;
  const driftPerStep = (target - base) / Math.max(1, horizonCandles);

  const points: PredictionPayload['points'] = [];
  const bands: PredictionPayload['bands'] = [];
  const predictedCandles: PredictionPayload['predictedCandles'] = [];

  let prevClose = base;
  for (let i = 0; i <= horizonCandles; i += 1) {
    const wave = Math.sin(i / 2.5) * (base * 0.0006);
    const mean = base + driftPerStep * i + wave;
    points.push({ offset: i, price: mean });

    const widen = (base * 0.0012) * (1 + i / 6);
    const top = mean + widen;
    const bottom = mean - widen;
    const confidence = Math.max(0.25, 0.9 - i * 0.02);

    // Use 1-candle segments for smoother cone
    if (i < horizonCandles) {
      bands.push({
        fromOffset: i,
        toOffset: i,
        top,
        bottom,
        confidence,
      });
    }

    // Build a synthetic candle around mean
    const open = prevClose;
    const close = mean + Math.cos(i / 1.7) * (base * 0.0004);
    const high = Math.max(open, close) + widen * 0.35;
    const low = Math.min(open, close) - widen * 0.35;
    predictedCandles.push({ offset: i, open, high, low, close });
    prevClose = close;
  }

  return {
    baseTimestampMs,
    intervalMs,
    horizonCandles,
    points,
    bands,
    levels,
    predictedCandles,
    includeInScale: true,
  };
};
