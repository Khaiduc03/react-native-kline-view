import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import RNKLineView from 'react-native-kline-view';
import type {
  ChartThemeConfig,
  FormatConfig,
  InteractionConfig,
  LayoutConfig,
  MainIndicatorsConfig,
  SubIndicatorsConfig,
  VolumeConfig,
} from 'react-native-kline-view';
import type { ChartAIData } from '../../Data/ChartAIDataType';
import ChartAICard from './ChartAICard';
import {
  buildChartAIInteraction,
  buildSinglePeriodIndicator,
  mapSnapshotToCandles,
  pickSeries,
  pickSeriesValueAligned,
  resolveChartWidths,
} from './chartAIShared';

export type ChartAIRSIChartProps = {
  data: ChartAIData;
  title?: string;
};

export function ChartAIRSIChart({ data, title }: ChartAIRSIChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const candles = useMemo(() => {
    const marketData = data?.market_data;
    const rsi14Series = pickSeries(marketData, ['rsi14', 'rsi_14']);

    return mapSnapshotToCandles(data, {
      extraSelectedItems: ({ index, candleCount }) => {
        const rsi14 = pickSeriesValueAligned(rsi14Series, index, candleCount);
        return typeof rsi14 === 'number'
          ? [{ title: 'RSI14: ', detail: rsi14.toFixed(2) }]
          : [];
      },
      mapExtraFields: ({ index, candleCount }) => {
        const rsi14 = pickSeriesValueAligned(rsi14Series, index, candleCount);
        return {
          rsiList: buildSinglePeriodIndicator(rsi14, 14),
        };
      },
    });
  }, [data]);

  const symbol = data?.symbol || 'Asset';
  const itemCount = candles.length;
  const mainIndicators: MainIndicatorsConfig = {
    ma: { enabled: false, periods: [5, 10, 20], style: 'default' },
    ema: { enabled: false, periods: [10, 30, 60] },
    super: { enabled: false, period: 10, multiplier: 3 },
    boll: { enabled: false, n: 20, p: 2, style: 'default' },
  };
  const subIndicators: SubIndicatorsConfig = {
    rsi: {
      enabled: true,
      rsiOnly: true,
      periods: [14],
      style: 'line_labels',
      axisMode: 'fixed_0_100',
      levels: [
        {
          value: 70,
          label: '70',
          color: '#EF4444',
          dashed: true,
          showRightTag: true,
          showGuideLine: true,
        },
        {
          value: 50,
          label: '50',
          color: '#6B7280',
          dashed: true,
          showRightTag: false,
          showGuideLine: true,
        },
        {
          value: 30,
          label: '30',
          color: '#14B8A6',
          dashed: true,
          showRightTag: true,
          showGuideLine: true,
        },
      ],
      currentTag: {
        enabled: true,
        period: 14,
        label: 'RSI (14)',
        color: '#9333EA',
      },
    },
  };
  const volume: VolumeConfig = { enabled: false, maPeriods: [5, 10] };
  const interaction: InteractionConfig = buildChartAIInteraction();
  const format: FormatConfig = { price: 2, volume: 2, time: 1 };
  const theme: ChartThemeConfig = {
    candle: {
      upColor: '#16A34A',
      downColor: '#EF4444',
    },
    subIndicator: {
      colors: ['#9333EA', '#22C55E', '#F59E0B'],
    },
    grid: { lineColor: '#E2E8F0' },
    axis: { textColor: '#334155' },
    panel: {
      backgroundColor: '#FFFFFF',
      borderColor: '#94A3B8',
    },
  };
  const widths = useMemo(
    () =>
      resolveChartWidths({
        screenWidth,
        itemCount,
        rightPriceArea: 86,
        minUsableWidth: 160,
        minItemWidth: 0.9,
        maxItemWidth: 8,
        candleRatio: 0.58,
        minCandleWidth: 0.7,
      }),
    [itemCount, screenWidth],
  );
  const layout: LayoutConfig = {
    paddingTop: 16,
    paddingBottom: 24,
    paddingRight: 86,
    rightOffsetCandles: 0,
    itemWidth: widths.itemWidth,
    candleWidth: widths.candleWidth,
    mainFlex: 0.1,
  };

  return (
    <ChartAICard title={title ?? `RSI (14) - ${symbol}`}>
      <RNKLineView
        style={styles.chart}
        initialData={candles}
        mainIndicators={mainIndicators}
        subIndicators={subIndicators}
        subCharts={[]}
        volume={volume}
        interaction={interaction}
        format={format}
        theme={theme}
        layout={layout}
      />
    </ChartAICard>
  );
}

const styles = StyleSheet.create({
  chart: {
    flex: 1,
  },
});

export default ChartAIRSIChart;
