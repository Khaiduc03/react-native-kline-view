import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import RNKLineView, { type Candle } from 'react-native-kline-view';
import type { ChartAIData } from '../../Data/ChartAIDataType';

export type ChartAISupportResistanceChartProps = {
  data: ChartAIData;
  title?: string;
};

type ResolvedLevel = {
  support: number;
  resistance: number;
};

type PartialLevel = {
  support?: number;
  resistance?: number;
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toFiniteOptionalNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const toDateString = (unixSeconds: number): string => {
  const date = new Date(unixSeconds * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const mapServerToCandles = (payload: ChartAIData): Candle[] => {
  const sourceCandles = payload?.market_data?.candles;
  const raw = Array.isArray(sourceCandles) ? sourceCandles : [];
  if (raw.length === 0) {
    return [];
  }

  return raw
    .map(item => {
      const timeSeconds = toFiniteNumber(item?.time, 0);
      if (timeSeconds <= 0) {
        return null;
      }

      const open = toFiniteNumber(item?.open, 0);
      const high = toFiniteNumber(item?.high, open);
      const low = toFiniteNumber(item?.low, open);
      const close = toFiniteNumber(item?.close, open);
      const vol = toFiniteNumber(item?.volume, 0);

      const next: Candle = {
        id: timeSeconds * 1000,
        dateString: toDateString(timeSeconds),
        open,
        high,
        low,
        close,
        vol,
        selectedItemList: [
          { title: 'O: ', detail: open.toFixed(2) },
          { title: 'H: ', detail: high.toFixed(2) },
          { title: 'L: ', detail: low.toFixed(2) },
          { title: 'C: ', detail: close.toFixed(2) },
        ],
      };
      return next;
    })
    .filter((item): item is Candle => item !== null);
};

const resolveServerLevels = (payload: ChartAIData): PartialLevel => {
  const marketData = payload?.market_data;
  const support = toFiniteOptionalNumber(marketData?.support ?? marketData?.support_level);
  const resistance = toFiniteOptionalNumber(
    marketData?.resistance ?? marketData?.resistance_level,
  );
  return {
    support: typeof support === 'number' ? support : undefined,
    resistance: typeof resistance === 'number' ? resistance : undefined,
  };
};

const detectAutoLevels = (candles: Candle[]): ResolvedLevel | undefined => {
  const candleCount = candles.length;
  if (candleCount === 0) {
    return undefined;
  }

  const lookback = Math.min(120, candleCount);
  const startIndex = candleCount - lookback;
  const window = 2;
  const lastClose = toFiniteOptionalNumber(candles[candleCount - 1]?.close);
  if (typeof lastClose !== 'number') {
    return undefined;
  }

  const isPivotHigh = (index: number): boolean => {
    const center = toFiniteOptionalNumber(candles[index]?.high);
    if (typeof center !== 'number') {
      return false;
    }
    for (let offset = 1; offset <= window; offset += 1) {
      const left = toFiniteOptionalNumber(candles[index - offset]?.high);
      const right = toFiniteOptionalNumber(candles[index + offset]?.high);
      if (typeof left !== 'number' || typeof right !== 'number') {
        return false;
      }
      if (center <= left || center <= right) {
        return false;
      }
    }
    return true;
  };

  const isPivotLow = (index: number): boolean => {
    const center = toFiniteOptionalNumber(candles[index]?.low);
    if (typeof center !== 'number') {
      return false;
    }
    for (let offset = 1; offset <= window; offset += 1) {
      const left = toFiniteOptionalNumber(candles[index - offset]?.low);
      const right = toFiniteOptionalNumber(candles[index + offset]?.low);
      if (typeof left !== 'number' || typeof right !== 'number') {
        return false;
      }
      if (center >= left || center >= right) {
        return false;
      }
    }
    return true;
  };

  let resistance: number | undefined;
  let support: number | undefined;
  const firstPivot = startIndex + window;
  const lastPivot = candleCount - 1 - window;

  for (let index = lastPivot; index >= firstPivot; index -= 1) {
    if (typeof resistance !== 'number' && isPivotHigh(index)) {
      const high = toFiniteOptionalNumber(candles[index]?.high);
      if (typeof high === 'number' && high > lastClose) {
        resistance = high;
      }
    }
    if (typeof support !== 'number' && isPivotLow(index)) {
      const low = toFiniteOptionalNumber(candles[index]?.low);
      if (typeof low === 'number' && low < lastClose) {
        support = low;
      }
    }
    if (typeof support === 'number' && typeof resistance === 'number') {
      break;
    }
  }

  if (typeof resistance !== 'number') {
    for (let i = startIndex; i < candleCount; i += 1) {
      const high = toFiniteOptionalNumber(candles[i]?.high);
      if (typeof high !== 'number') {
        continue;
      }
      if (typeof resistance !== 'number' || high > resistance) {
        resistance = high;
      }
    }
  }

  if (typeof support !== 'number') {
    for (let i = startIndex; i < candleCount; i += 1) {
      const low = toFiniteOptionalNumber(candles[i]?.low);
      if (typeof low !== 'number') {
        continue;
      }
      if (typeof support !== 'number' || low < support) {
        support = low;
      }
    }
  }

  if (typeof support !== 'number' || typeof resistance !== 'number') {
    return undefined;
  }
  if (support >= resistance) {
    return undefined;
  }
  return { support, resistance };
};

const resolveLevels = (payload: ChartAIData, candles: Candle[]): ResolvedLevel | undefined => {
  const server = resolveServerLevels(payload);
  const autoDetected = detectAutoLevels(candles);
  const support = server.support ?? autoDetected?.support;
  const resistance = server.resistance ?? autoDetected?.resistance;
  if (typeof support !== 'number' || typeof resistance !== 'number') {
    return undefined;
  }
  if (support >= resistance) {
    return undefined;
  }
  return { support, resistance };
};

export function ChartAISupportResistanceChart({
  data,
  title,
}: ChartAISupportResistanceChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const candles = useMemo(() => mapServerToCandles(data), [data]);
  const levels = useMemo(() => resolveLevels(data, candles), [candles, data]);
  const symbol = data?.symbol || 'Asset';
  const itemCount = Math.max(candles.length, 1);
  const fitItemWidth = useMemo(() => {
    const horizontalPadding = 24;
    const chartBorder = 2;
    const rightPriceArea = 88;
    const usableWidth = Math.max(
      180,
      screenWidth - horizontalPadding - chartBorder - rightPriceArea,
    );
    const raw = usableWidth / itemCount;
    return Math.max(2.2, Math.min(10, raw));
  }, [itemCount, screenWidth]);
  const fitCandleWidth = Math.max(1, fitItemWidth * 0.66);
  const hasLevels =
    typeof levels?.support === 'number' && typeof levels?.resistance === 'number';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {title ?? `Support & Resistance - ${symbol}`}
      </Text>
      <View style={styles.chartBox}>
        <RNKLineView
          style={styles.chart}
          initialData={candles}
          mainIndicators={{
            ma: { enabled: false, periods: [5, 10, 20], style: 'default' },
            ema: { enabled: false, periods: [10, 30, 60] },
            super: { enabled: false, period: 10, multiplier: 3 },
            boll: { enabled: false, n: 20, p: 2, style: 'default' },
            sr: {
              enabled: hasLevels,
              style: 'line_labels',
              supportLevel: levels?.support,
              resistanceLevel: levels?.resistance,
            },
          }}
          subCharts={[]}
          volume={{ enabled: false, maPeriods: [5, 10] }}
          interaction={{ autoFollow: false, loadMoreThreshold: 48 }}
          format={{ price: 2, volume: 2, time: 1 }}
          theme={{
            candle: {
              upColor: '#16A34A',
              downColor: '#EF4444',
            },
            grid: { lineColor: '#E2E8F0' },
            axis: { textColor: '#334155' },
            panel: {
              backgroundColor: '#FFFFFF',
              borderColor: '#94A3B8',
            },
          }}
          layout={{
            paddingTop: 24,
            paddingBottom: 24,
            paddingRight: 88,
            rightOffsetCandles: 0,
            itemWidth: fitItemWidth,
            candleWidth: fitCandleWidth,
            mainFlex: 0.97,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe4ef',
    overflow: 'hidden',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  chartBox: {
    flex: 1,
    minHeight: 360,
  },
  chart: {
    flex: 1,
  },
});

export default ChartAISupportResistanceChart;
