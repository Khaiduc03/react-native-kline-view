import type { ChartAIData } from './ChartAIDataType';

export const cloneChartAISnapshot = (input: ChartAIData): ChartAIData =>
  JSON.parse(JSON.stringify(input)) as ChartAIData;

export const bumpLatestSnapshotCandle = (
  snapshot: ChartAIData,
  closeDelta: number,
): ChartAIData => {
  const next = cloneChartAISnapshot(snapshot);
  const candles = next.market_data?.candles;
  if (!Array.isArray(candles) || candles.length === 0) {
    return next;
  }

  const last = candles[candles.length - 1];
  const lastClose = Number(last.close ?? 0);
  const nextClose = Number((lastClose + closeDelta).toFixed(2));
  const currentHigh = Number(last.high ?? nextClose);

  last.close = nextClose;
  last.high = Math.max(currentHigh, nextClose);
  return next;
};
