import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import RNKLineView, { type IndicatorItem } from 'react-native-kline-view';
import type { ChartAIData } from '../../Data/ChartAIDataType';
import ChartAICard from './ChartAICard';
import {
  buildChartAIInteraction,
  mapSnapshotToCandles,
  pickSeries,
  pickSeriesValueAligned,
  resolveChartWidths,
} from './chartAIShared';

export type ChartAITrendChartProps = {
  data: ChartAIData;
  title?: string;
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

export function ChartAITrendChart({ data, title }: ChartAITrendChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const candles = useMemo(() => {
    const marketData = data?.market_data;
    const ema50Series = pickSeries(marketData, ['ema50', 'ema_50']);
    const ema200Series = pickSeries(marketData, ['ema200', 'ema_200']);

    return mapSnapshotToCandles(data, {
      includeVolumeInSelected: true,
      mapExtraFields: ({ index, candleCount }) => {
        const ema50 = pickSeriesValueAligned(ema50Series, index, candleCount);
        const ema200 = pickSeriesValueAligned(ema200Series, index, candleCount);
        return {
          maList: buildEmaMaList(ema50, ema200),
        };
      },
    });
  }, [data]);

  const symbol = data?.symbol || 'Asset';
  const itemCount = candles.length;
  const widths = useMemo(
    () =>
      resolveChartWidths({
        screenWidth,
        itemCount,
        rightPriceArea: 124,
        minUsableWidth: 180,
        minItemWidth: 2.8,
        maxItemWidth: 11,
        candleRatio: 0.66,
        minCandleWidth: 1.8,
      }),
    [itemCount, screenWidth],
  );

  return (
    <ChartAICard title={title ?? `Trend Analysis (EMA 50/200) - ${symbol}`}>
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
        interaction={buildChartAIInteraction()}
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
          itemWidth: widths.itemWidth,
          candleWidth: widths.candleWidth,
        }}
      />
    </ChartAICard>
  );
}

const styles = StyleSheet.create({
  chart: {
    flex: 1,
  },
});

export default ChartAITrendChart;
