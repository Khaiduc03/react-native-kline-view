import type {
  Candle,
  IndicatorItem,
  InteractionConfig,
  SelectedItem,
} from 'react-native-kline-view';
import type { ChartAIData, MarketData } from '../../Data/ChartAIDataType';

type NumericSeries = Array<number | string | null | undefined>;

export type SnapshotCandleContext = {
  index: number;
  candleCount: number;
  timeSeconds: number;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
};

type SnapshotMapOptions = {
  includeVolumeInSelected?: boolean;
  extraSelectedItems?: (context: SnapshotCandleContext) => SelectedItem[];
  mapExtraFields?: (context: SnapshotCandleContext) => Partial<Candle> | undefined;
};

type WidthOptions = {
  screenWidth: number;
  itemCount: number;
  rightPriceArea: number;
  minUsableWidth: number;
  minItemWidth: number;
  maxItemWidth: number;
  candleRatio: number;
  minCandleWidth: number;
  horizontalPadding?: number;
  chartBorder?: number;
};

export const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

export const toFiniteOptionalNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

export const toDateString = (unixSeconds: number): string => {
  const date = new Date(unixSeconds * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

export const pickSeries = (
  marketData: MarketData | undefined,
  keys: string[],
): NumericSeries | undefined => {
  for (const key of keys) {
    const value = (marketData as Record<string, unknown> | undefined)?.[key];
    if (Array.isArray(value) && value.length > 0) {
      return value as NumericSeries;
    }
  }
  return undefined;
};

export const pickSeriesValueAligned = (
  series: NumericSeries | undefined,
  index: number,
  candleCount: number,
): number | undefined => {
  if (!Array.isArray(series) || series.length === 0 || candleCount <= 0) {
    return undefined;
  }

  const seriesCount = series.length;
  const alignedIndex =
    seriesCount === candleCount
      ? index
      : seriesCount < candleCount
      ? index - (candleCount - seriesCount)
      : index + (seriesCount - candleCount);

  if (alignedIndex < 0 || alignedIndex >= seriesCount) {
    return undefined;
  }

  return toFiniteOptionalNumber(series[alignedIndex]);
};

export const buildSinglePeriodIndicator = (
  value: number | undefined,
  period: number,
): IndicatorItem[] | undefined => {
  if (typeof value !== 'number') {
    return undefined;
  }
  return [
    {
      title: String(period),
      period,
      value,
      selected: true,
      index: 0,
    },
  ];
};

const createSelectedItems = (
  context: SnapshotCandleContext,
  includeVolume: boolean,
): SelectedItem[] => {
  const selected: SelectedItem[] = [
    { title: 'O: ', detail: context.open.toFixed(2) },
    { title: 'H: ', detail: context.high.toFixed(2) },
    { title: 'L: ', detail: context.low.toFixed(2) },
    { title: 'C: ', detail: context.close.toFixed(2) },
  ];
  if (includeVolume) {
    selected.push({ title: 'VOL: ', detail: context.vol.toFixed(2) });
  }
  return selected;
};

export const mapSnapshotToCandles = (
  payload: ChartAIData,
  options: SnapshotMapOptions = {},
): Candle[] => {
  const sourceCandles = payload?.market_data?.candles;
  const raw = Array.isArray(sourceCandles) ? sourceCandles : [];
  if (raw.length === 0) {
    return [];
  }

  const includeVolume = options.includeVolumeInSelected === true;

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

      const context: SnapshotCandleContext = {
        index,
        candleCount: raw.length,
        timeSeconds,
        open,
        high,
        low,
        close,
        vol,
      };

      const selected = createSelectedItems(context, includeVolume);
      const extraSelected = options.extraSelectedItems?.(context) ?? [];

      const next: Candle = {
        id: timeSeconds * 1000,
        dateString: toDateString(timeSeconds),
        open,
        high,
        low,
        close,
        vol,
        selectedItemList: [...selected, ...extraSelected],
      };

      const extraFields = options.mapExtraFields?.(context);
      if (extraFields) {
        Object.assign(next, extraFields);
      }

      return next;
    })
    .filter((item): item is Candle => item !== null);
};

export const resolveChartWidths = ({
  screenWidth,
  itemCount,
  rightPriceArea,
  minUsableWidth,
  minItemWidth,
  maxItemWidth,
  candleRatio,
  minCandleWidth,
  horizontalPadding = 24,
  chartBorder = 2,
}: WidthOptions): { itemWidth: number; candleWidth: number } => {
  const safeItemCount = Math.max(itemCount, 1);
  const usableWidth = Math.max(
    minUsableWidth,
    screenWidth - horizontalPadding - chartBorder - rightPriceArea,
  );
  const raw = usableWidth / safeItemCount;
  const itemWidth = Math.max(minItemWidth, Math.min(maxItemWidth, raw));
  const candleWidth = Math.max(minCandleWidth, itemWidth * candleRatio);
  return { itemWidth, candleWidth };
};

export const CHART_AI_INITIAL_SCALE = 0.72;

export const buildChartAIInteraction = (
  loadMoreThreshold = 48,
): InteractionConfig => ({
  autoFollow: false,
  loadMoreThreshold,
  configList: {
    initialScale: CHART_AI_INITIAL_SCALE,
  },
});
