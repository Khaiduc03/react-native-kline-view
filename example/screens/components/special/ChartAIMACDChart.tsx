import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import RNKLineView, { type Candle } from 'react-native-kline-view';
import type { ChartAIData } from '../../Data/ChartAIDataType';
import ChartAICard from './ChartAICard';
import {
  buildChartAIInteraction,
  mapSnapshotToCandles,
  pickSeries,
  pickSeriesValueAligned,
  resolveChartWidths,
} from './chartAIShared';

export type ChartAIMACDChartProps = {
  data: ChartAIData;
  title?: string;
};

export function ChartAIMACDChart({ data, title }: ChartAIMACDChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const candles = useMemo(() => {
    const marketData = data?.market_data;
    const macdLineSeries = pickSeries(marketData, ['macd_line']);
    const macdSignalSeries = pickSeries(marketData, ['macd_signal']);
    const macdHistogramSeries = pickSeries(marketData, ['macd_histogram']);

    return mapSnapshotToCandles(data, {
      extraSelectedItems: ({ index, candleCount }) => {
        const dif = pickSeriesValueAligned(macdLineSeries, index, candleCount);
        const dea = pickSeriesValueAligned(macdSignalSeries, index, candleCount);
        const hist = pickSeriesValueAligned(macdHistogramSeries, index, candleCount);
        const selected = [] as { title: string; detail: string }[];
        if (typeof dif === 'number') {
          selected.push({ title: 'DIF: ', detail: dif.toFixed(4) });
        }
        if (typeof dea === 'number') {
          selected.push({ title: 'DEA: ', detail: dea.toFixed(4) });
        }
        if (typeof hist === 'number') {
          selected.push({ title: 'HIST: ', detail: hist.toFixed(4) });
        }
        return selected;
      },
      mapExtraFields: ({ index, candleCount }) => {
        const dif = pickSeriesValueAligned(macdLineSeries, index, candleCount);
        const dea = pickSeriesValueAligned(macdSignalSeries, index, candleCount);
        const hist = pickSeriesValueAligned(macdHistogramSeries, index, candleCount);
        const next: Partial<Candle> = {};
        if (typeof dif === 'number') {
          next.macdDif = dif;
        }
        if (typeof dea === 'number') {
          next.macdDea = dea;
        }
        if (typeof hist === 'number') {
          next.macdValue = hist;
        }
        return next;
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
        rightPriceArea: 120,
        minUsableWidth: 160,
        minItemWidth: 1,
        maxItemWidth: 8,
        candleRatio: 0.62,
        minCandleWidth: 0.8,
      }),
    [itemCount, screenWidth],
  );

  return (
    <ChartAICard title={title ?? `MACD - ${symbol}`}>
      <RNKLineView
        style={styles.chart}
        initialData={candles}
        mainIndicators={{
          ma: { enabled: false, periods: [5, 10, 20], style: 'default' },
          ema: { enabled: false, periods: [10, 30, 60] },
          super: { enabled: false, period: 10, multiplier: 3 },
          boll: { enabled: false, n: 20, p: 2, style: 'default' },
        }}
        subIndicators={{
          macd: {
            enabled: true,
            macdOnly: true,
            periods: [12, 26, 9],
            style: 'line_labels',
            lineLabels: {
              macd: 'MACD',
              signal: 'Signal',
              histogram: '',
            },
          },
        }}
        subCharts={[]}
        volume={{ enabled: false, maPeriods: [5, 10] }}
        interaction={buildChartAIInteraction()}
        format={{ price: 2, volume: 2, time: 1 }}
        theme={{
          candle: {
            upColor: '#14B8A6',
            downColor: '#EF4444',
          },
          subIndicator: {
            colors: ['#2563EB', '#F59E0B', '#0891B2'],
          },
          grid: { lineColor: '#DDE2EA' },
          axis: { textColor: '#111827' },
          panel: {
            backgroundColor: '#F8FAFC',
            borderColor: '#CBD5E1',
          },
        }}
        layout={{
          paddingTop: 12,
          paddingBottom: 20,
          paddingRight: 120,
          rightOffsetCandles: 0,
          itemWidth: widths.itemWidth,
          candleWidth: widths.candleWidth,
          mainFlex: 0.1,
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

export default ChartAIMACDChart;
