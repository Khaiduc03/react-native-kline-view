# React Native KLine Example Screens Migration Guide

Cookbook-style guide to copy demo screens from this repo into another React Native app with minimal changes.

## 1) App-level wiring (do this first)

### Install package

```bash
yarn add react-native-kline-view
# or
npm i react-native-kline-view
```

### Import pattern

```tsx
import RNKLineView, {
  type Candle,
  type RNKLineViewRef,
  type MainIndicatorsConfig,
  type SubIndicatorsConfig,
  type LayoutConfig,
  type InteractionConfig,
  type FormatConfig,
  type ChartThemeConfig,
  type DrawItemTouchEvent,
  type DrawItemCompleteEvent,
  type DrawPointCompleteEvent,
  type PredictionSelectEvent,
} from 'react-native-kline-view';
```

### Navigation route registration pattern (from `HomeScreen` + `RootNavigator`)

```tsx
export type RootStackParamList = {
  Home: undefined;
  SimpleKLineDemo: undefined;
  BinanceLiveDemo: undefined;
  KLineDemo: undefined;
  ChartAIDemo: undefined;
  ChartAITrendDemo: undefined;
  ChartAISupportResistanceDemo: undefined;
  ChartAIRSIDemo: undefined;
  ChartAIMACDDemo: undefined;
  ChartAIADXDemo: undefined;
};
```

Register each screen with `createNativeStackNavigator`, and add launcher buttons from your home screen (same pattern as `example/screens/HomeScreen.tsx`).

### Realtime ref methods (important)

Use `RNKLineViewRef` methods exactly as exposed in `index.d.ts`:

- `setData(candles)` for full reset
- `appendCandle(candle)` for a newly closed candle at a newer timestamp
- `updateLastCandle(candle)` for tick updates to current open candle
- `unPredictionSelect()` to clear Entry/SL/TP selection

## 2) Migration tracks and copy order

### Track A: Simple

Copy order:
1. `example/screens/SimpleKLineScreen.tsx`
2. Your local candle source (or adapt `example/screens/MockData.ts`)
3. Register `SimpleKLineDemo` route

### Track B: Live streaming (Binance)

Copy order:
1. `example/screens/BinanceService.ts`
2. `example/screens/components/binance/BinanceControlSummary.tsx`
3. `example/screens/components/binance/BinanceControlsModal.tsx`
4. `example/screens/BinanceLiveScreen.tsx`
5. Register `BinanceLiveDemo` route

### Track C: ChartAI snapshot family

Copy order:
1. `example/screens/Data/ChartAIDataType.ts`
2. `example/screens/components/special/chartAIShared.ts`
3. `example/screens/components/special/ChartAISnapshotDemoLayout.tsx`
4. Core chart component(s):
   - `ServerSpecialChart.tsx`
   - `ChartAITrendChart.tsx`
   - `ChartAIMACDChart.tsx`
   - `ChartAIADXChart.tsx`
   - `ChartAISupportResistanceChart.tsx`
   - `ChartAIRSIChart.tsx`
5. Demo wrappers:
   - `ChartAIDemoScreen.tsx`
   - `ChartAITrendDemoScreen.tsx`
   - `ChartAIMACDDemoScreen.tsx`
   - `ChartAIADXDemoScreen.tsx`
   - `ChartAISupportResistanceDemoScreen.tsx`
   - `ChartAIRSIDemoScreen.tsx`
6. Register corresponding routes

### Track D: Advanced legacy options

Copy order:
1. `example/screens/KLineScreen.tsx`
2. Optional strategy helper: `example/screens/smc-strategy.ts`
3. Optional market fetch helper: `example/screens/BinanceService.ts`
4. Register `KLineDemo` route

## 3) Migration matrix

| Screen | Required helpers | Realtime method usage | Indicator mode | Difficulty |
|---|---|---|---|---|
| `SimpleKLineScreen` | local candle source (`MockData` optional) | `updateLastCandle` | Props-first (`mainIndicators`, `subCharts`, `volume`) | Low |
| `BinanceLiveScreen` | `BinanceService`, Binance controls components | `setData` + `appendCandle` + `updateLastCandle` | Props-first, dynamic + draw tools | Medium |
| `ChartAIDemoScreen` | `ChartAISnapshotDemoLayout`, `ServerSpecialChart`, `chartAIShared` | mostly snapshot reset (state refresh) | Props-first, BOLL (`band_labels`) | Low |
| `ChartAITrendDemoScreen` | layout + `ChartAITrendChart` + shared | mostly snapshot reset | Props-first, EMA 50/200 | Low |
| `ChartAIMACDDemoScreen` | layout + `ChartAIMACDChart` + shared | mostly snapshot reset | Props-first, `subIndicators.macd` (MACD-only) | Medium |
| `ChartAIADXDemoScreen` | layout + `ChartAIADXChart` + shared | mostly snapshot reset | Props-first, RSI pane reused as ADX visual | Medium |
| `ChartAISupportResistanceDemoScreen` | layout + `ChartAISupportResistanceChart` + shared | mostly snapshot reset | Props-first, SR overlay in `mainIndicators.sr` | Medium |
| `ChartAIRSIDemoScreen` | layout + `ChartAIRSIChart` + shared | mostly snapshot reset | Props-first, RSI-only with custom levels | Medium |
| `KLineScreen` | optional `smc-strategy`, optional `BinanceService` | mixed (legacy + imperative updates) | Legacy `optionList` flow + draw/prediction events | High |

## 4) Screen cookbook

## `SimpleKLineScreen`

### When to use
- You need the fastest path: render candles with basic indicators and one update button.
- Good for MVP and onboarding teammates.

### Files to copy
- `example/screens/SimpleKLineScreen.tsx`
- Optional source data: `example/screens/MockData.ts`

### Required data shape
Use `Candle[]`:

```ts
type Candle = {
  id: number;
  dateString: string;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
  selectedItemList?: { title: string; detail: string; color?: number }[];
};
```

### Minimal integration snippet

```tsx
const ref = useRef<RNKLineViewRef>(null);

<RNKLineView
  ref={ref}
  style={{ flex: 1 }}
  initialData={seedCandles}
  mainIndicators={{
    ma: { enabled: true, periods: [5, 10, 20] },
    ema: { enabled: true, periods: [10, 30, 60] },
    boll: { enabled: false, n: 20, p: 2 },
  }}
  subCharts={[{ type: 'macd', enabled: true }]}
  volume={{ enabled: true, maPeriods: [5, 10] }}
  interaction={{ autoFollow: true, loadMoreThreshold: 48 }}
  format={{ price: 2, volume: 2, time: 1 }}
/>

ref.current?.updateLastCandle(nextCandle);
```

### Customization points
- Change indicator periods in `mainIndicators`/`subCharts`.
- Switch color palette via `theme`.
- Tune density via `layout.itemWidth` and `layout.candleWidth`.

### Common pitfalls
- Reusing duplicate `id` values causes visual jumps.
- Missing `vol` can break volume pane behavior.

## `BinanceLiveScreen`

### When to use
- You need REST bootstrap + live WebSocket candles.
- You need drawing interactions and load-more pagination.

### Files to copy
- `example/screens/BinanceLiveScreen.tsx`
- `example/screens/BinanceService.ts`
- `example/screens/components/binance/BinanceControlSummary.tsx`
- `example/screens/components/binance/BinanceControlsModal.tsx`

### Required data shape
- Internal transport shape from Binance service:

```ts
type KLineRawPoint = {
  time: number; // ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
```

- Convert each raw point to `Candle` before pushing into chart.

### Minimal integration snippet

```tsx
const ref = useRef<RNKLineViewRef | null>(null);

// bootstrap history
ref.current?.setData(historyCandles);

// websocket updates
if (raw.time > lastRaw.time) {
  ref.current?.appendCandle(buildCandle(raw));
} else if (raw.time === lastRaw.time) {
  ref.current?.updateLastCandle(buildCandle(raw));
} else {
  ref.current?.setData(fullCandles); // out-of-order recovery
}

<RNKLineView
  ref={ref}
  initialData={[]}
  preset="binance"
  mainIndicators={mainIndicatorsConfig}
  subCharts={subChartsConfig}
  volume={{ enabled: true, maPeriods: [5, 10] }}
  draw={drawConfig}
  interaction={{ autoFollow: false, loadMoreThreshold: 48 }}
  onLoadMore={handleLoadMore}
  onDrawItemDidTouch={(e: DrawItemTouchEvent) => {
    const payload = e.nativeEvent;
    // sync selected draw tool state
  }}
/>
```

### Customization points
- Swap Binance API to your exchange in `BinanceService.ts`.
- Toggle MA/BOLL/EMA/SUPER in `mainIndicatorsConfig`.
- Add or remove drawing tools by changing `draw.drawType` flow.

### Common pitfalls
- Using `appendCandle` for same timestamp updates (should be `updateLastCandle`).
- Forgetting reconnection/session guards causes stale socket data races.
- Not filtering load-more duplicates creates repeated candles.

## `ChartAIDemoScreen` (BOLL snapshot)

### When to use
- You receive server snapshots and want BOLL overlays with no streaming complexity.

### Files to copy
- `example/screens/ChartAIDemoScreen.tsx`
- `example/screens/components/special/ServerSpecialChart.tsx`
- `example/screens/components/special/ChartAISnapshotDemoLayout.tsx`
- `example/screens/components/special/chartAIShared.ts`
- `example/screens/Data/ChartAIDataType.ts`

### Required data shape
`ChartAIData.market_data.candles[]` with optional BOLL arrays (`boll_mb`, `boll_up`, `boll_dn` or alias keys).

### Minimal integration snippet

```tsx
<ChartAISnapshotDemoLayout
  title="ChartAI Snapshot Demo"
  candleCount={snapshot.market_data?.candles?.length ?? 0}
  onRefreshSnapshot={reloadSnapshot}
>
  <ChartAIServerChart data={snapshot} />
</ChartAISnapshotDemoLayout>
```

### Customization points
- Change BOLL line colors in `theme.mainIndicator.bollColors`.
- Use `layout.paddingRight` to make right-side labels readable.

### Common pitfalls
- Series length not aligned with candle length; use `pickSeriesValueAligned` pattern.

## `ChartAITrendDemoScreen` (EMA 50/200)

### When to use
- You want trend view with EMA50/EMA200 overlays from snapshot data.

### Files to copy
- `example/screens/ChartAITrendDemoScreen.tsx`
- `example/screens/components/special/ChartAITrendChart.tsx`
- `chartAIShared.ts`, `ChartAISnapshotDemoLayout.tsx`, `ChartAIDataType.ts`

### Required data shape
- Snapshot candles + EMA arrays (`ema50/ema_50`, `ema200/ema_200`).

### Minimal integration snippet

```tsx
<RNKLineView
  initialData={candles}
  mainIndicators={{
    ma: { enabled: false, periods: [5, 10, 20], style: 'line_labels' },
    ema: { enabled: true, periods: [50, 200] },
    super: { enabled: false, period: 10, multiplier: 3 },
    boll: { enabled: false, n: 20, p: 2 },
  }}
  volume={{ enabled: false, maPeriods: [5, 10] }}
/>
```

### Customization points
- Update EMA periods and colors.
- Adjust `rightPriceArea`/`paddingRight` for large-price instruments.

### Common pitfalls
- Forgetting to map EMA values into `maList` indicator items when using server-provided lines.

## `ChartAIMACDDemoScreen` (MACD-only pane)

### When to use
- You want MACD as dedicated sub-indicator visualization from snapshot.

### Files to copy
- `example/screens/ChartAIMACDDemoScreen.tsx`
- `example/screens/components/special/ChartAIMACDChart.tsx`
- `chartAIShared.ts`, `ChartAISnapshotDemoLayout.tsx`, `ChartAIDataType.ts`

### Required data shape
- Snapshot candles + MACD arrays (`macd_line`, `macd_signal`, `macd_histogram`).

### Minimal integration snippet

```tsx
<RNKLineView
  initialData={candles}
  mainIndicators={{
    ma: { enabled: false, periods: [5, 10, 20] },
    ema: { enabled: false, periods: [10, 30, 60] },
    super: { enabled: false, period: 10, multiplier: 3 },
    boll: { enabled: false, n: 20, p: 2 },
  }}
  subIndicators={{
    macd: {
      enabled: true,
      macdOnly: true,
      periods: [12, 26, 9],
      style: 'line_labels',
    },
  }}
  volume={{ enabled: false, maPeriods: [5, 10] }}
/>
```

### Customization points
- Set MACD labels with `lineLabels`.
- Tune sub-indicator palette via `theme.subIndicator.colors`.

### Common pitfalls
- Populating `macdDif/macdDea/macdValue` incorrectly (wrong sign/order).

## `ChartAIADXDemoScreen` (ADX14 via RSI pane)

### When to use
- You need ADX14 trend-strength view and optional ATR tag using existing RSI sub-pane.

### Files to copy
- `example/screens/ChartAIADXDemoScreen.tsx`
- `example/screens/components/special/ChartAIADXChart.tsx`
- `chartAIShared.ts`, `ChartAISnapshotDemoLayout.tsx`, `ChartAIDataType.ts`

### Required data shape
- Snapshot candles + ADX array (`adx14` or `adx_14`), optional ATR array (`atr14` or `atr_14`).

### Minimal integration snippet

```tsx
<RNKLineView
  initialData={candles}
  subIndicators={{
    rsi: {
      enabled: true,
      rsiOnly: true,
      periods: [14],
      style: 'line_labels',
      axisMode: 'fixed_0_100',
      currentTag: { enabled: true, period: 14, label: 'ADX (14)' },
    },
  }}
  volume={{ enabled: false, maPeriods: [5, 10] }}
/>
```

### Customization points
- Change ADX levels (20/25/40 etc.) in `levels`.
- Add ATR text to `selectedItemList` as auxiliary info.

### Common pitfalls
- Forgetting this is a visual reuse of RSI pane; semantics are ADX, not RSI.

## `ChartAISupportResistanceDemoScreen`

### When to use
- You need support/resistance overlays from server levels, with auto-detect fallback.

### Files to copy
- `example/screens/ChartAISupportResistanceDemoScreen.tsx`
- `example/screens/components/special/ChartAISupportResistanceChart.tsx`
- `chartAIShared.ts`, `ChartAISnapshotDemoLayout.tsx`, `ChartAIDataType.ts`

### Required data shape
- Snapshot candles.
- Optional server levels: `support`/`resistance` or `support_level`/`resistance_level`.

### Minimal integration snippet

```tsx
<RNKLineView
  initialData={candles}
  mainIndicators={{
    ma: { enabled: false, periods: [5, 10, 20] },
    ema: { enabled: false, periods: [10, 30, 60] },
    super: { enabled: false, period: 10, multiplier: 3 },
    boll: { enabled: false, n: 20, p: 2 },
    sr: {
      enabled: hasLevels,
      style: 'line_labels',
      supportLevel: levels?.support,
      resistanceLevel: levels?.resistance,
    },
  }}
  volume={{ enabled: false, maPeriods: [5, 10] }}
/>
```

### Customization points
- Disable auto-detect and force server levels for deterministic output.
- Tune pivot detection window/lookup range if using local detection.

### Common pitfalls
- Accepting invalid levels (`support >= resistance`) should be rejected.

## `ChartAIRSIDemoScreen` (RSI14)

### When to use
- You need RSI-only pane with fixed levels and current-value tag.

### Files to copy
- `example/screens/ChartAIRSIDemoScreen.tsx`
- `example/screens/components/special/ChartAIRSIChart.tsx`
- `chartAIShared.ts`, `ChartAISnapshotDemoLayout.tsx`, `ChartAIDataType.ts`

### Required data shape
- Snapshot candles + RSI array (`rsi14` or `rsi_14`).

### Minimal integration snippet

```tsx
<RNKLineView
  initialData={candles}
  mainIndicators={{
    ma: { enabled: false, periods: [5, 10, 20] },
    ema: { enabled: false, periods: [10, 30, 60] },
    super: { enabled: false, period: 10, multiplier: 3 },
    boll: { enabled: false, n: 20, p: 2 },
  }}
  subIndicators={{
    rsi: {
      enabled: true,
      rsiOnly: true,
      periods: [14],
      style: 'line_labels',
      axisMode: 'fixed_0_100',
      currentTag: { enabled: true, period: 14, label: 'RSI (14)' },
    },
  }}
  volume={{ enabled: false, maPeriods: [5, 10] }}
/>
```

### Customization points
- Change level lines (70/50/30) and colors.
- Use adaptive axis mode if your strategy requires dynamic scaling.

### Common pitfalls
- Passing RSI arrays with wrong alignment to candles.

## `KLineScreen` (advanced legacy options)

### When to use
- You need full drawing/prediction workflows in legacy-style configuration.
- You need compatibility with older `optionList`-based setup.

### Files to copy
- `example/screens/KLineScreen.tsx`
- Optional: `example/screens/smc-strategy.ts`
- Optional: `example/screens/BinanceService.ts`

### Required data shape
- Legacy payload packed into `optionList` JSON string (contains model array, indicators, config, draw, prediction fields).
- Event callbacks use `DrawItemTouchEvent`, `DrawItemCompleteEvent`, `DrawPointCompleteEvent`, `PredictionSelectEvent`.

### Minimal integration snippet

```tsx
const optionList = JSON.stringify({
  modelArray: candles,
  shouldScrollToEnd: true,
  targetList: {
    maList: [],
    maVolumeList: [],
    bollN: '20',
    bollP: '2',
    macdS: '12',
    macdL: '26',
    macdM: '9',
    kdjN: '14',
    kdjM1: '1',
    kdjM2: '3',
    rsiList: [],
    wrList: [],
  },
});

<RNKLineView
  initialData={candles}
  optionList={optionList}
  onDrawItemDidTouch={(e: DrawItemTouchEvent) => {}}
  onDrawItemComplete={(e: DrawItemCompleteEvent) => {}}
  onDrawPointComplete={(e: DrawPointCompleteEvent) => {}}
  onPredictionSelect={(e: PredictionSelectEvent) => {}}
/>
```

### Customization points
- Extend `optionList` with draw/prediction parameters for trading workflows.
- Add strategy injection (SMC or your own) before constructing `optionList`.

### Common pitfalls
- Mixing props-first indicator config with heavy legacy `optionList` in conflicting ways.
- Moving this screen without copying helper enums/constants from the same file.

## 5) Parity and safety checklist

- Candle `id` must be strictly monotonic for append/update flows.
- Preserve `selectedItemList` formatting (`O/H/L/C/VOL`) so tooltip/header stays consistent.
- Do not mix legacy `optionList` and props-first config unless you intentionally control precedence.
- In live mode:
  - same timestamp => `updateLastCandle`
  - newer timestamp => `appendCandle`
  - out-of-order history repair => `setData`
- Keep indicator series aligned with candle count (`pickSeriesValueAligned` pattern).
- Keep load-more dedupe logic when prepending historical candles.

## 6) Verification checklist before shipping migration

- Each copied screen builds with correct imports and route registration.
- All snippets use public API names from `index.d.ts`.
- Shared modules (`BinanceService`, `chartAIShared`, layout/components) are copied before screens that depend on them.
- No native iOS/Android bridge edits are required for these usage patterns.
