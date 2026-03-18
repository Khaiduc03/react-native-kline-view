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

export type ChartAIADXChartProps = {
  data: ChartAIData;
  title?: string;
};

export function ChartAIADXChart({ data, title }: ChartAIADXChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const candles = useMemo(() => {
    const marketData = data?.market_data;
    const adxSeries = pickSeries(marketData, ['adx14', 'adx_14']);
    const atrSeries = pickSeries(marketData, ['atr14', 'atr_14']);

    return mapSnapshotToCandles(data, {
      extraSelectedItems: ({ index, candleCount }) => {
        const adx14 = pickSeriesValueAligned(adxSeries, index, candleCount);
        const atr14 = pickSeriesValueAligned(atrSeries, index, candleCount);
        const selected = [] as { title: string; detail: string }[];
        if (typeof adx14 === 'number') {
          selected.push({ title: 'ADX14: ', detail: adx14.toFixed(2) });
        }
        if (typeof atr14 === 'number') {
          selected.push({ title: 'ATR14: ', detail: atr14.toFixed(2) });
        }
        return selected;
      },
      mapExtraFields: ({ index, candleCount }) => {
        const adx14 = pickSeriesValueAligned(adxSeries, index, candleCount);
        return {
          rsiList: buildSinglePeriodIndicator(adx14, 14),
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
          value: 20,
          label: '20',
          color: '#64748B',
          dashed: true,
          showRightTag: false,
          showGuideLine: true,
        },
        {
          value: 25,
          label: '25',
          color: '#EA580C',
          dashed: true,
          showRightTag: true,
          showGuideLine: true,
        },
        {
          value: 40,
          label: '40',
          color: '#B91C1C',
          dashed: true,
          showRightTag: true,
          showGuideLine: true,
        },
      ],
      currentTag: {
        enabled: true,
        period: 14,
        label: 'ADX (14)',
        color: '#0EA5E9',
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
      colors: ['#0EA5E9', '#22C55E', '#F59E0B'],
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
        rightPriceArea: 92,
        minUsableWidth: 160,
        minItemWidth: 1,
        maxItemWidth: 8,
        candleRatio: 0.58,
        minCandleWidth: 0.8,
      }),
    [itemCount, screenWidth],
  );
  const layout: LayoutConfig = {
    paddingTop: 16,
    paddingBottom: 24,
    paddingRight: 92,
    rightOffsetCandles: 0,
    itemWidth: widths.itemWidth,
    candleWidth: widths.candleWidth,
    mainFlex: 0.1,
  };

  return (
    <ChartAICard title={title ?? `Trend Strength (ADX14) - ${symbol}`}>
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

export default ChartAIADXChart;
