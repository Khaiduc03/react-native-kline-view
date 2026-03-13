import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import RNKLineView, { type Candle, type IndicatorItem } from 'react-native-kline-view';
import type { ChartAIData, MarketData } from '../../Data/ChartAIDataType';

export type ChartAITrendChartProps = {
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

const buildEmaMaList = (
  ema50: number | undefined,
  ema200: number | undefined,
): IndicatorItem[] | undefined => {
  const list: IndicatorItem[] = [];
  if (typeof ema50 === 'number') {
    list.push({
      title: '50',
      period: 50,
      kind: 'ema',
      value: ema50,
      selected: true,
      index: 0,
    });
  }
  if (typeof ema200 === 'number') {
    list.push({
      title: '200',
      period: 200,
      kind: 'ema',
      value: ema200,
      selected: true,
      index: 1,
    });
  }
  return list.length > 0 ? list : undefined;
};

const mapServerToCandles = (payload: ChartAIData): Candle[] => {
  const marketData = payload?.market_data;
  const sourceCandles = marketData?.candles;
  const raw = Array.isArray(sourceCandles) ? sourceCandles : [];
  if (raw.length === 0) {
    return [];
  }

  const ema50Series = pickSeries(marketData, ['ema50', 'ema_50']);
  const ema200Series = pickSeries(marketData, ['ema200', 'ema_200']);

  return raw
    .map((item, index) => {
      const timeSeconds = toFiniteNumber(item?.time, 0);
      if (timeSeconds <= 0) {
        return null;
      }

      const open = toFiniteNumber(item?.open, 0);
      const high = toFiniteNumber(item?.high, open);
      const low = toFiniteNumber(item?.low, open);
      const close = toFiniteNumber(item?.close, open);
      const vol = toFiniteNumber(item?.volume, 0);
      const ema50 = pickSeriesValue(ema50Series, index);
      const ema200 = pickSeriesValue(ema200Series, index);

      const next: Candle = {
        id: timeSeconds * 1000,
        dateString: toDateString(timeSeconds),
        open,
        high,
        low,
        close,
        vol,
        maList: buildEmaMaList(ema50, ema200),
        selectedItemList: [
          { title: 'O: ', detail: open.toFixed(2) },
          { title: 'H: ', detail: high.toFixed(2) },
          { title: 'L: ', detail: low.toFixed(2) },
          { title: 'C: ', detail: close.toFixed(2) },
          { title: 'VOL: ', detail: vol.toFixed(2) },
        ],
      };
      return next;
    })
    .filter((item): item is Candle => item !== null);
};

export function ChartAITrendChart({ data, title }: ChartAITrendChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const candles = useMemo(() => mapServerToCandles(data), [data]);
  const symbol = data?.symbol || 'Asset';
  const itemCount = Math.max(candles.length, 1);
  const fitItemWidth = useMemo(() => {
    const horizontalPadding = 24;
    const chartBorder = 2;
    const rightPriceArea = 124;
    const usableWidth = Math.max(
      180,
      screenWidth - horizontalPadding - chartBorder - rightPriceArea,
    );
    const raw = usableWidth / itemCount;
    return Math.max(2.8, Math.min(11, raw));
  }, [itemCount, screenWidth]);
  const fitCandleWidth = Math.max(1.8, fitItemWidth * 0.66);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {title ?? `Trend Analysis (EMA 50/200) - ${symbol}`}
      </Text>
      <View style={styles.chartBox}>
        <RNKLineView
          style={styles.chart}
          initialData={candles}
          mainIndicators={{
            ma: { enabled: false, periods: [5, 10, 20], style: 'line_labels' },
            ema: { enabled: true, periods: [50, 200] },
            super: { enabled: false, period: 10, multiplier: 3 },
            boll: { enabled: false, n: 20, p: 2 },
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
              emaColors: ['#1D7DF2', '#8E24AA'],
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
            paddingRight: 124,
            rightOffsetCandles: 2,
            itemWidth: fitItemWidth,
            candleWidth: fitCandleWidth,
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

export default ChartAITrendChart;
