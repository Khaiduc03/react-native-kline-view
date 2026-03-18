import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import RNKLineView, { type Candle } from 'react-native-kline-view';
import ChartAICard from './ChartAICard';
import type { ChartAIData } from '../../Data/ChartAIDataType';
import {
  buildChartAIInteraction,
  mapSnapshotToCandles,
  pickSeries as pickChartAISeries,
  pickSeriesValueAligned,
  resolveChartWidths,
} from './chartAIShared';

export type ChartAIServerChartProps = {
  data: ChartAIData;
  title?: string;
};

const mapServerToCandles = (payload: ChartAIData): Candle[] => {
  const marketData = payload?.market_data;
  const bollMbSeries = pickChartAISeries(marketData, ['boll_mb', 'boll_mid']);
  const bollUpSeries = pickChartAISeries(marketData, ['boll_up', 'boll_upper']);
  const bollDnSeries = pickChartAISeries(marketData, ['boll_dn', 'boll_lower']);

  return mapSnapshotToCandles(payload, {
    mapExtraFields: ({ index, candleCount }) => {
      const bollMb = pickSeriesValueAligned(bollMbSeries, index, candleCount);
      const bollUp = pickSeriesValueAligned(bollUpSeries, index, candleCount);
      const bollDn = pickSeriesValueAligned(bollDnSeries, index, candleCount);
      const next: Partial<Candle> = {};
      if (typeof bollMb === 'number') {
        next.bollMb = bollMb;
      }
      if (typeof bollUp === 'number') {
        next.bollUp = bollUp;
      }
      if (typeof bollDn === 'number') {
        next.bollDn = bollDn;
      }
      return next;
    },
  });
};

export function ChartAIServerChart({ data, title }: ChartAIServerChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const candles = useMemo(() => mapServerToCandles(data), [data]);
  const symbol = data?.symbol || 'Asset';
  const itemCount = candles.length;
  const widths = useMemo(
    () =>
      resolveChartWidths({
        screenWidth,
        itemCount,
        rightPriceArea: 92,
        minUsableWidth: 160,
        minItemWidth: 0.9,
        maxItemWidth: 8,
        candleRatio: 0.62,
        minCandleWidth: 0.7,
      }),
    [itemCount, screenWidth],
  );

  return (
    <ChartAICard title={title ?? `Bollinger Bands - ${symbol}`}>
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
          interaction={buildChartAIInteraction(48, 0.64)}
          format={{ price: 2, volume: 2, time: 1 }}
          theme={{
            candle: {
              upColor: '#19B37A',
              downColor: '#EA4D68',
            },
            mainIndicator: {
              bollColors: ['#DFC987', '#67C8BC', '#B794DE'],
            },
            grid: { lineColor: '#E6EBF1' },
            axis: { textColor: '#475467' },
            panel: {
              backgroundColor: '#FFFFFF',
              borderColor: '#CBD5E1',
            },
          }}
          layout={{
            paddingTop: 24,
            paddingBottom: 24,
            paddingRight: 92,
            rightOffsetCandles: 2,
            itemWidth: widths.itemWidth,
            candleWidth: widths.candleWidth,
            mainFlex: 0.97,
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

export default ChartAIServerChart;
