import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import RNKLineView, { type Candle } from 'react-native-kline-view';
import type { ChartAIData, MarketData } from '../../Data/ChartAIDataType';

export type ChartAIServerChartProps = {
  data: ChartAIData;
  title?: string;
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toDateString = (unixSeconds: number): string => {
  const date = new Date(unixSeconds * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const pickSeries = (
  marketData: MarketData | undefined,
  keys: string[],
): number[] | undefined => {
  for (const key of keys) {
    const value = (marketData as Record<string, unknown> | undefined)?.[key];
    if (
      Array.isArray(value) &&
      value.every(item => typeof item === 'number' && Number.isFinite(item))
    ) {
      return value as number[];
    }
  }
  return undefined;
};

const pickSeriesValue = (
  series: number[] | undefined,
  index: number,
): number | undefined => {
  if (!Array.isArray(series) || index < 0 || index >= series.length) {
    return undefined;
  }
  const next = Number(series[index]);
  return Number.isFinite(next) ? next : undefined;
};

const mapServerToCandles = (payload: ChartAIData): Candle[] => {
  const marketData = payload?.market_data;
  const sourceCandles = marketData?.candles;
  const raw = Array.isArray(sourceCandles) ? sourceCandles : [];
  if (raw.length === 0) {
    return [];
  }

  const source = raw;
  const bollMbSeries = pickSeries(marketData, ['boll_mb', 'boll_mid']);
  const bollUpSeries = pickSeries(marketData, ['boll_up', 'boll_upper']);
  const bollDnSeries = pickSeries(marketData, ['boll_dn', 'boll_lower']);
  const sourceStartIndex = raw.length - source.length;

  return source
    .map((item, index) => {
      const timeSeconds = toFiniteNumber(item?.time, 0);
      if (timeSeconds <= 0) {
        return null;
      }

      const globalIndex = sourceStartIndex + index;
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
      };

      const bollMb = pickSeriesValue(bollMbSeries, globalIndex);
      const bollUp = pickSeriesValue(bollUpSeries, globalIndex);
      const bollDn = pickSeriesValue(bollDnSeries, globalIndex);
      if (typeof bollMb === 'number') {
        next.bollMb = bollMb;
      }
      if (typeof bollUp === 'number') {
        next.bollUp = bollUp;
      }
      if (typeof bollDn === 'number') {
        next.bollDn = bollDn;
      }

      next.selectedItemList = [
        { title: 'O: ', detail: open.toFixed(2) },
        { title: 'H: ', detail: high.toFixed(2) },
        { title: 'L: ', detail: low.toFixed(2) },
        { title: 'C: ', detail: close.toFixed(2) },
      ];
      return next;
    })
    .filter((item): item is Candle => item !== null);
};

export function ChartAIServerChart({ data, title }: ChartAIServerChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const candles = useMemo(() => mapServerToCandles(data), [data]);
  const symbol = data?.symbol || 'Asset';
  const itemCount = Math.max(candles.length, 1);
  const fitItemWidth = useMemo(() => {
    const horizontalPadding = 24; // demo screen side padding
    const chartBorder = 2; // container border width
    const rightPriceArea = 92;
    const usableWidth = Math.max(
      160,
      screenWidth - horizontalPadding - chartBorder - rightPriceArea,
    );
    const raw = usableWidth / itemCount;
    return Math.max(0.9, Math.min(8, raw));
  }, [itemCount, screenWidth]);
  const fitCandleWidth = Math.max(0.7, fitItemWidth * 0.62);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title ?? `Bollinger Bands - ${symbol}`}</Text>
      <View style={styles.chartBox}>
        <RNKLineView
          style={styles.chart}
          initialData={candles}
          mainIndicators={{
            ma: { enabled: false, periods: [5, 10, 20] },
            ema: { enabled: false, periods: [10, 30, 60] },
            super: { enabled: false, period: 10, multiplier: 3 },
            boll: { enabled: true, n: 20, p: 2, style: 'band_labels' },
          }}
          subCharts={[]}
          volume={{ enabled: false, maPeriods: [5, 10] }}
          interaction={{ autoFollow: false, loadMoreThreshold: 48 }}
          format={{ price: 2, volume: 2, time: 1 }}
          theme={{
            candle: {
              upColor: '#16A34A',
              downColor: '#DC2626',
            },
            mainIndicator: {
              bollColors: ['#16A34A', '#16A34A', '#DC2626'],
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
            paddingRight: 92,
            rightOffsetCandles: 2,
            itemWidth: fitItemWidth,
            candleWidth: fitCandleWidth,
            mainFlex: 0.97,
            volumeFlex: 0.01,
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

export default ChartAIServerChart;
