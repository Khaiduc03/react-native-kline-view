# Home Screens Guide

This document explains every demo route exposed from the Home screen in the example app.

- Home entry: `example/screens/HomeScreen.tsx`
- Navigator: `example/navigation/RootNavigator.tsx`

## Quick Catalog

| Route | Screen | Primary Use Case | Data Source |
| --- | --- | --- | --- |
| `SimpleKLineDemo` | `SimpleKLineScreen` | Smallest props-first integration with imperative update of the latest candle | Local mock window (`MockData.ts`) |
| `BinanceLiveDemo` | `BinanceLiveScreen` | Full live trading flow: REST bootstrap + WS realtime + draw tools + load more | Binance REST + WebSocket |
| `KLineDemo` | `KLineScreen` | Advanced all-in-one playground for option-rich chart behavior | Local + Binance helper utilities |
| `ChartAIDemo` | `ChartAIDemoScreen` | Snapshot chart from server-style payload with refresh simulation | `ChartAIData.ts` snapshot |
| `ChartAITrendDemo` | `ChartAITrendDemoScreen` | Trend-only chart using EMA overlays | Snapshot + `ema50/ema200` series |
| `ChartAIMACDDemo` | `ChartAIMACDDemoScreen` | MACD-only pane with line labels/tags | Snapshot + MACD series |
| `ChartAIADXDemo` | `ChartAIADXDemoScreen` | ADX/ATR trend strength view (rendered through RSI-only axis mode) | Snapshot + `adx14/atr14` series |
| `ChartAISupportResistanceDemo` | `ChartAISupportResistanceDemoScreen` | Support/resistance level overlays from server or auto-detection | Snapshot + inferred levels |
| `ChartAIRSIDemo` | `ChartAIRSIDemoScreen` | RSI-only pane with fixed 0-100 axis and level tags | Snapshot + RSI series |

## Screen-by-Screen

### 1) `SimpleKLineDemo`

- File: `example/screens/SimpleKLineScreen.tsx`
- Goal:
  - Show the smallest production-style setup for teams that only need `initialData` and typed configs.
- Input data:
  - Builds a 120-candle window from `example/screens/MockData.ts`.
- Key RNKLineView APIs demonstrated:
  - `initialData`
  - `mainIndicators`
  - `subCharts`
  - `volume`
  - `interaction`
  - `format`
  - imperative ref API: `updateLastCandle`
- Why use this screen:
  - Best first copy-paste template for apps that are not yet streaming from a backend.

### 2) `BinanceLiveDemo`

- File: `example/screens/BinanceLiveScreen.tsx`
- Goal:
  - End-to-end live chart integration with exchange data and interactive tooling.
- Input data:
  - `fetchBinanceKLineData` for initial/backfill candles.
  - `parseBinanceWsKlineUpdate` from WebSocket stream for realtime updates.
- Key RNKLineView APIs demonstrated:
  - `setData`, `appendCandle`, `updateLastCandle`, `prependData`
  - `draw` controls (`drawType`, lock, clear)
  - `onDrawItemDidTouch`, `onDrawItemComplete`, `onDrawPointComplete`
  - `onLoadMore`
  - dynamic `mainIndicators`, `subCharts`, `theme`, `advanced` updates
- Why use this screen:
  - Primary reference for production crypto/stock apps with live market feeds.

### 3) `KLineDemo`

- File: `example/screens/KLineScreen.tsx`
- Goal:
  - Advanced playground exposing most chart features and interactions in one place.
- Input data:
  - Mixed local data and optional service-driven updates.
- Key RNKLineView APIs demonstrated:
  - broad `indicator/targetList` usage
  - drawing system + prediction interactions
  - event payload handling
  - theme/layout tuning
- Why use this screen:
  - Deep reference when building custom product behavior beyond the simple presets.

### 4) `ChartAIDemo`

- File: `example/screens/ChartAIDemoScreen.tsx`
- Goal:
  - Render one server-like snapshot payload and simulate refresh without websocket complexity.
- Input data:
  - `example/screens/Data/ChartAIData.ts`
  - refresh mutation via `chartAISnapshotUtils.ts`
- Key RNKLineView APIs demonstrated:
  - `initialData` from transformed payload
  - server snapshot mapping pattern (map once, render directly)
- Why use this screen:
  - Template for backend-driven “analysis snapshot” products.

### 5) `ChartAITrendDemo`

- File: `example/screens/ChartAITrendDemoScreen.tsx`
- Core chart: `example/screens/components/special/ChartAITrendChart.tsx`
- Goal:
  - Trend-focused chart with EMA 50/200 overlays and minimal noise.
- Input data:
  - Snapshot candles + optional `ema50/ema200` arrays.
- Key RNKLineView APIs demonstrated:
  - `mainIndicators.ema`
  - per-indicator color tuning through `theme.mainIndicator.emaColors`
- Why use this screen:
  - Strong baseline for trend-following strategies and dashboard-style trend cards.

### 6) `ChartAIMACDDemo`

- File: `example/screens/ChartAIMACDDemoScreen.tsx`
- Core chart: `example/screens/components/special/ChartAIMACDChart.tsx`
- Goal:
  - Dedicated MACD-only panel with line labels and right tags.
- Input data:
  - Snapshot candles + `macd_line`, `macd_signal`, `macd_histogram`.
- Key RNKLineView APIs demonstrated:
  - `subIndicators.macd.enabled`
  - `subIndicators.macd.macdOnly`
  - `subIndicators.macd.style = "line_labels"`
  - `subIndicators.macd.lineLabels` customization
- Why use this screen:
  - Reference implementation for MACD-only analytics cards or indicator-focused modules.

### 7) `ChartAIADXDemo`

- File: `example/screens/ChartAIADXDemoScreen.tsx`
- Core chart: `example/screens/components/special/ChartAIADXChart.tsx`
- Goal:
  - Show ADX/ATR trend strength while reusing RSI-only rendering pipeline for a bounded indicator panel.
- Input data:
  - Snapshot candles + `adx14` and `atr14`.
- Key RNKLineView APIs demonstrated:
  - `subIndicators.rsi.rsiOnly` as a generic single-line indicator pane strategy
  - custom levels/currentTag for threshold interpretation
- Why use this screen:
  - Practical pattern for rendering non-native indicators by mapping into supported pane structures.

### 8) `ChartAISupportResistanceDemo`

- File: `example/screens/ChartAISupportResistanceDemoScreen.tsx`
- Core chart: `example/screens/components/special/ChartAISupportResistanceChart.tsx`
- Goal:
  - Overlay support/resistance labels from server levels with automatic fallback detection.
- Input data:
  - Server-provided support/resistance fields when available.
  - Fallback pivot-based level detection from recent candles.
- Key RNKLineView APIs demonstrated:
  - `mainIndicators.sr.enabled/style/supportLevel/resistanceLevel`
  - label-style overlays on main chart
- Why use this screen:
  - Template for signal-oriented chart overlays without introducing extra sub panes.

### 9) `ChartAIRSIDemo`

- File: `example/screens/ChartAIRSIDemoScreen.tsx`
- Core chart: `example/screens/components/special/ChartAIRSIChart.tsx`
- Goal:
  - RSI-only indicator chart with canonical 30/50/70 levels and current tag.
- Input data:
  - Snapshot candles + `rsi14`/`rsi_14` series.
- Key RNKLineView APIs demonstrated:
  - `subIndicators.rsi.rsiOnly`
  - `subIndicators.rsi.axisMode = "fixed_0_100"`
  - `subIndicators.rsi.levels` and `currentTag`
- Why use this screen:
  - Reference setup for oscillators and momentum indicator cards.

## Suggested Learning Order

1. `SimpleKLineDemo` for props-first basics.
2. `ChartAIDemo` for server snapshot mapping.
3. `ChartAIRSIDemo` and `ChartAIMACDDemo` for indicator-only panes.
4. `ChartAISupportResistanceDemo` for main-chart overlays.
5. `BinanceLiveDemo` for realtime production flow.
6. `KLineDemo` for advanced/full customization.

## Notes for Integrators

- `subCharts` is suitable when you want the built-in standard child panes.
- `subIndicators` is preferred for higher-level typed control and indicator-specific options.
- For realtime feeds, avoid full `setData` on every tick; use `appendCandle` / `updateLastCandle` incrementally.
- Keep your payload mapping in one helper layer (like `chartAIShared.ts`) to avoid feature drift across screens.
