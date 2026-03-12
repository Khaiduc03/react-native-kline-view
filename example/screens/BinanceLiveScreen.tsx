import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  processColor,
} from 'react-native';
import RNKLineView, { type DrawItemTouchEvent } from 'react-native-kline-view';
import type { Candle, RNKLineViewRef } from 'react-native-kline-view';
import {
  buildBinanceWsUrl,
  fetchBinanceKLineData,
  normalizeBinanceInterval,
  parseBinanceWsKlineUpdate,
  type BinanceInterval,
  type KLineRawPoint,
} from './BinanceService';
import { BinanceControlSummary } from './components/binance/BinanceControlSummary';
import { BinanceControlsModal } from './components/binance/BinanceControlsModal';

const SYMBOL_OPTIONS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
const INTERVAL_OPTIONS: BinanceInterval[] = [
  '1m',
  '5m',
  '15m',
  '1h',
  '4h',
  '1d',
];
const EMPTY_CANDLES: Candle[] = [];
const SUB_INDICATOR_LABEL: Record<number, string> = {
  [-1]: 'None',
  3: 'MACD',
  4: 'KDJ',
  5: 'RSI',
};

const toColorNumber = (color: string, fallback: number): number => {
  const value = processColor(color);
  return typeof value === 'number' ? value : fallback;
};

const formatDateString = (time: number): string => {
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hh}:${mm}`;
};

const smaAt = (values: number[], index: number, period: number): number => {
  if (period <= 1 || index + 1 < period) return values[index] ?? 0;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) {
    sum += values[i] ?? 0;
  }
  return sum / period;
};

const stdevAt = (
  values: number[],
  index: number,
  period: number,
  mean: number,
): number => {
  if (period <= 1 || index + 1 < period) return 0;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) {
    const diff = (values[i] ?? 0) - mean;
    sum += diff * diff;
  }
  return Math.sqrt(sum / period);
};

const emaSeries = (values: number[], period: number): number[] => {
  const alpha = 2 / (period + 1);
  let previous = values[0] ?? 0;
  return values.map((value, index) => {
    if (index === 0) {
      previous = value;
      return value;
    }
    previous = value * alpha + previous * (1 - alpha);
    return previous;
  });
};

const kdjSeries = (
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
  kSmooth = 3,
  dSmooth = 3,
): { k: number[]; d: number[]; j: number[] } => {
  const rsv: number[] = [];
  const k: number[] = [];
  const d: number[] = [];
  const j: number[] = [];
  let previousK = 50;
  let previousD = 50;

  closes.forEach((close, index) => {
    const start = Math.max(0, index - period + 1);
    let highestHigh = highs[start] ?? close;
    let lowestLow = lows[start] ?? close;
    for (let i = start + 1; i <= index; i += 1) {
      const high = highs[i] ?? close;
      const low = lows[i] ?? close;
      if (high > highestHigh) highestHigh = high;
      if (low < lowestLow) lowestLow = low;
    }

    const denominator = highestHigh - lowestLow;
    const currentRsv =
      denominator === 0 ? 50 : ((close - lowestLow) / denominator) * 100;
    rsv.push(currentRsv);

    const currentK = ((kSmooth - 1) * previousK + currentRsv) / kSmooth;
    const currentD = ((dSmooth - 1) * previousD + currentK) / dSmooth;
    const currentJ = 3 * currentK - 2 * currentD;

    k.push(currentK);
    d.push(currentD);
    j.push(currentJ);
    previousK = currentK;
    previousD = currentD;
  });

  return { k, d, j };
};

const rsiSeries = (closes: number[], period: number): number[] => {
  if (period <= 1) {
    return closes.map(() => 0);
  }
  const result: number[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  closes.forEach((close, index) => {
    if (index === 0) {
      result.push(0);
      return;
    }
    const change = close - (closes[index - 1] ?? close);
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    if (index <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (index === period) {
        avgGain /= period;
        avgLoss /= period;
        const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
        result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rs));
      } else {
        result.push(0);
      }
      return;
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rs));
  });

  return result;
};

const buildCandle = (item: KLineRawPoint): Candle => ({
  id: item.time,
  dateString: formatDateString(item.time),
  open: item.open,
  high: item.high,
  low: item.low,
  close: item.close,
  vol: item.volume,
  selectedItemList: [
    { title: 'O: ', detail: item.open.toFixed(2) },
    { title: 'H: ', detail: item.high.toFixed(2) },
    { title: 'L: ', detail: item.low.toFixed(2) },
    { title: 'C: ', detail: item.close.toFixed(2) },
    { title: 'VOL: ', detail: item.volume.toFixed(2) },
  ],
});

const buildCandlesWithIndicators = (rawCandles: KLineRawPoint[]): Candle[] => {
  const closes = rawCandles.map(item => item.close);
  const highs = rawCandles.map(item => item.high);
  const lows = rawCandles.map(item => item.low);
  const volumes = rawCandles.map(item => item.volume);

  const maPeriods = [5, 10, 20];
  const emaPeriods = [10, 30, 60];
  const maLineDefs = [
    ...maPeriods.map(period => ({ kind: 'ma' as const, period })),
    ...emaPeriods.map(period => ({ kind: 'ema' as const, period })),
  ];
  const emaMaps = emaPeriods.map(period => ({
    period,
    values: emaSeries(closes, period),
  }));

  const ema12 = emaSeries(closes, 12);
  const ema26 = emaSeries(closes, 26);
  const difSeries = closes.map(
    (_, index) => (ema12[index] ?? 0) - (ema26[index] ?? 0),
  );
  const deaSeries = emaSeries(difSeries, 9);
  const macdSeries = difSeries.map(
    (value, index) => (value - (deaSeries[index] ?? 0)) * 2,
  );
  const kdj = kdjSeries(highs, lows, closes, 14, 3, 3);
  const rsi6 = rsiSeries(closes, 6);
  const rsi12 = rsiSeries(closes, 12);
  const rsi24 = rsiSeries(closes, 24);

  return rawCandles.map((item, index) => {
    const maList = maLineDefs.map((line, valueIndex) => {
      const value =
        line.kind === 'ema'
          ? emaMaps.find(entry => entry.period === line.period)?.values[
              index
            ] ?? 0
          : smaAt(closes, index, line.period);
      return {
        title: String(line.period),
        period: line.period,
        kind: line.kind,
        value,
        selected: true,
        index: valueIndex,
      };
    });

    const maVolumeList = [5, 10].map((period, valueIndex) => ({
      title: String(period),
      value: smaAt(volumes, index, period),
      selected: true,
      index: valueIndex,
    }));

    const bollMb = smaAt(closes, index, 20);
    const bollStd = stdevAt(closes, index, 20, bollMb);

    return {
      ...buildCandle(item),
      maList,
      maVolumeList,
      bollMb,
      bollUp: bollMb + 2 * bollStd,
      bollDn: bollMb - 2 * bollStd,
      macdDif: difSeries[index] ?? 0,
      macdDea: deaSeries[index] ?? 0,
      macdValue: macdSeries[index] ?? 0,
      kdjK: kdj.k[index] ?? 0,
      kdjD: kdj.d[index] ?? 0,
      kdjJ: kdj.j[index] ?? 0,
      rsiList: [
        { title: '6', selected: true, index: 0, value: rsi6[index] ?? 0 },
        { title: '12', selected: true, index: 1, value: rsi12[index] ?? 0 },
        { title: '24', selected: true, index: 2, value: rsi24[index] ?? 0 },
      ],
    };
  });
};

export default function BinanceLiveScreen() {
  const klineRef = useRef<RNKLineViewRef | null>(null);
  const rawCandlesRef = useRef<KLineRawPoint[]>([]);
  const candlesRef = useRef<Candle[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectRef = useRef<(() => void) | null>(null);
  const sessionRef = useRef(0);

  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState<BinanceInterval>('1m');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  const [mainMAEnabled, setMainMAEnabled] = useState(true);
  const [mainBOLLEnabled, setMainBOLLEnabled] = useState(false);
  const [second, setSecond] = useState<-1 | 3 | 4 | 5>(3);
  const [emaEnabled, setEmaEnabled] = useState(true);
  const [controlsModalVisible, setControlsModalVisible] = useState(false);
  const [drawType, setDrawType] = useState(0);
  const [shouldReloadDrawItemIndex, setShouldReloadDrawItemIndex] =
    useState(-3);
  const [drawColor, setDrawColor] = useState(
    toColorNumber('#2563EB', 0xff2563eb),
  );
  const [drawLineHeight] = useState(1);
  const [drawDashWidth] = useState(0);
  const [drawDashSpace] = useState(0);
  const [drawIsLock, setDrawIsLock] = useState(false);
  const [clearDrawNonce, setClearDrawNonce] = useState(0);

  const mainIndicatorsConfig = useMemo(
    () => ({
      ma: { enabled: mainMAEnabled, periods: [5, 10, 20] },
      ema: { enabled: emaEnabled, periods: [10, 30, 60] },
      boll: { enabled: mainBOLLEnabled, n: 20, p: 2 },
    }),
    [emaEnabled, mainBOLLEnabled, mainMAEnabled],
  );

  const subChartsConfig = useMemo(
    () => [
      { type: 'macd' as const, enabled: second === 3 },
      { type: 'kdj' as const, enabled: second === 4 },
      { type: 'rsi' as const, enabled: second === 5 },
    ],
    [second],
  );

  const rebuildChartData = (
    inputRaw: KLineRawPoint[],
    opts?: { emitSetData?: boolean },
  ): Candle[] => {
    const nextCandles = buildCandlesWithIndicators(inputRaw);
    candlesRef.current = nextCandles;
    if (opts?.emitSetData !== false) {
      klineRef.current?.setData(nextCandles);
    }
    return nextCandles;
  };

  const themeConfig = useMemo(
    () => ({
      indicatorColors: {
        ma: ['#eab308', '#22c55e', '#a855f7'],
        ema: ['#f97316', '#06b6d4', '#8b5cf6'],
      },
    }),
    [],
  );

  const drawConfig = useMemo(
    () => ({
      shotBackgroundColor: toColorNumber('rgba(0,0,0,0)', 0x00000000),
      drawType,
      shouldReloadDrawItemIndex,
      drawShouldContinue: false,
      drawColor,
      drawLineHeight,
      drawDashWidth,
      drawDashSpace,
      drawIsLock,
      shouldFixDraw: false,
      shouldClearDraw: clearDrawNonce > 0,
    }),
    [
      clearDrawNonce,
      drawColor,
      drawDashSpace,
      drawDashWidth,
      drawIsLock,
      drawLineHeight,
      drawType,
      shouldReloadDrawItemIndex,
    ],
  );

  const statusText = useMemo(() => {
    if (loading) return 'Loading';
    if (error) return 'Error';
    if (isReconnecting) return 'Reconnecting';
    if (isConnected) return 'Live';
    return 'Idle';
  }, [error, isConnected, isReconnecting, loading]);

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const closeSocket = () => {
    const socket = wsRef.current;
    wsRef.current = null;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    }
  };

  useEffect(() => {
    const normalizedInterval = normalizeBinanceInterval(interval);
    let active = true;
    const sessionId = ++sessionRef.current;

    clearReconnectTimer();
    closeSocket();
    rawCandlesRef.current = [];
    candlesRef.current = [];
    klineRef.current?.setData([]);
    setLoading(true);
    setError(null);
    setIsConnected(false);
    setIsReconnecting(false);
    setLastPrice(null);

    const connectWebSocket = (attempt: number) => {
      if (!active || sessionId !== sessionRef.current) return;

      const wsUrl = buildBinanceWsUrl(symbol, normalizedInterval);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (
          !active ||
          sessionId !== sessionRef.current ||
          wsRef.current !== ws
        ) {
          ws.close();
          return;
        }
        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
      };

      ws.onmessage = event => {
        if (!active || sessionId !== sessionRef.current) return;
        const update = parseBinanceWsKlineUpdate(event.data);
        if (!update) return;

        const currentRaw = rawCandlesRef.current;
        const currentCandles = candlesRef.current;
        let updateKind: 'set' | 'append' | 'update' = 'set';
        const rawCandle = update.candle;
        setLastPrice(rawCandle.close);

        if (currentRaw.length === 0) {
          rawCandlesRef.current = [rawCandle];
          updateKind = 'set';
        } else {
          const lastRaw = currentRaw[currentRaw.length - 1];
          if (rawCandle.time > lastRaw.time) {
            rawCandlesRef.current = [...currentRaw, rawCandle];
            updateKind = 'append';
          } else if (rawCandle.time === lastRaw.time) {
            const nextRaw = [...currentRaw];
            nextRaw[nextRaw.length - 1] = rawCandle;
            rawCandlesRef.current = nextRaw;
            updateKind = 'update';
          } else {
            const index = currentRaw.findIndex(
              item => item.time === rawCandle.time,
            );
            if (index === -1) {
              return;
            }
            const nextRaw = [...currentRaw];
            nextRaw[index] = rawCandle;
            rawCandlesRef.current = nextRaw;
            updateKind = index === nextRaw.length - 1 ? 'update' : 'set';
          }
        }

        const nextCandles = rebuildChartData(rawCandlesRef.current, {
          emitSetData: updateKind === 'set',
        });

        if (updateKind === 'append') {
          const appendItem = nextCandles[nextCandles.length - 1];
          if (appendItem) {
            klineRef.current?.appendCandle(appendItem);
          }
        } else if (updateKind === 'update') {
          const updateItem = nextCandles[nextCandles.length - 1];
          if (updateItem) {
            klineRef.current?.updateLastCandle(updateItem);
          } else if (currentCandles.length > 0) {
            klineRef.current?.setData(nextCandles);
          }
        }
      };

      ws.onerror = () => {
        if (!active || sessionId !== sessionRef.current) return;
        setError('WebSocket error');
      };

      ws.onclose = () => {
        if (!active || sessionId !== sessionRef.current || wsRef.current !== ws)
          return;

        wsRef.current = null;
        setIsConnected(false);
        const nextAttempt = attempt + 1;
        const retryDelay = Math.min(10000, 1000 * Math.pow(2, attempt));
        setIsReconnecting(true);
        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(
          () => connectWebSocket(nextAttempt),
          retryDelay,
        );
      };
    };

    reconnectRef.current = () => {
      clearReconnectTimer();
      closeSocket();
      setIsConnected(false);
      setIsReconnecting(false);
      setError(null);
      connectWebSocket(0);
    };

    const bootstrap = async () => {
      try {
        const raw = await fetchBinanceKLineData(
          symbol,
          normalizedInterval,
          300,
        );
        if (!active || sessionId !== sessionRef.current) return;
        rawCandlesRef.current = raw;
        const historyCandles = rebuildChartData(raw, { emitSetData: true });
        setLastPrice(
          historyCandles.length > 0
            ? historyCandles[historyCandles.length - 1].close
            : null,
        );
        if (historyCandles.length === 0) {
          setError('No data from Binance');
          return;
        }
        connectWebSocket(0);
      } catch (fetchError) {
        if (!active || sessionId !== sessionRef.current) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Failed to load Binance data',
        );
      } finally {
        if (active && sessionId === sessionRef.current) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
      reconnectRef.current = null;
      clearReconnectTimer();
      closeSocket();
      setIsConnected(false);
      setIsReconnecting(false);
    };
  }, [interval, symbol]);

  const onDrawItemDidTouch = (event: DrawItemTouchEvent) => {
    const payload = event?.nativeEvent ?? event;
    if (!payload) return;
    if (typeof payload.shouldReloadDrawItemIndex === 'number') {
      setShouldReloadDrawItemIndex(payload.shouldReloadDrawItemIndex);
    }
    if (typeof payload.drawType === 'number') {
      setDrawType(payload.drawType);
    }
    if (typeof payload.drawIsLock === 'boolean') {
      setDrawIsLock(payload.drawIsLock);
    }
  };

  const triggerClearDraw = () => {
    setClearDrawNonce(value => value + 1);
    setShouldReloadDrawItemIndex(-2);
    setDrawType(0);
  };

  useEffect(() => {
    if (clearDrawNonce <= 0) {
      return;
    }
    const timer = setTimeout(() => setClearDrawNonce(0), 0);
    return () => clearTimeout(timer);
  }, [clearDrawNonce]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Binance Live</Text>
      <Text style={styles.subTitle}>
        REST history + realtime WebSocket kline stream
      </Text>

      <BinanceControlSummary
        symbol={symbol}
        interval={interval}
        mainLabels={
          [
            mainMAEnabled ? 'MA' : null,
            mainBOLLEnabled ? 'BOLL' : null,
            emaEnabled ? 'EMA' : null,
          ].filter(Boolean) as string[]
        }
        subLabel={SUB_INDICATOR_LABEL[second] ?? 'None'}
        drawLabel={
          drawType === 0
            ? 'None'
            : drawType === 1
            ? 'Line'
            : drawType === 2
            ? 'HLine'
            : 'Rect'
        }
        onOpenControls={() => setControlsModalVisible(true)}
      />

      <View style={styles.statusRow}>
        <View style={styles.statusBadge}>
          {loading ? <ActivityIndicator size="small" color="#1d4ed8" /> : null}
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
        <Text style={styles.lastPriceText}>
          {lastPrice !== null ? `Last: ${lastPrice.toFixed(2)}` : 'Last: --'}
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.chartContainer}>
        <RNKLineView
          ref={klineRef}
          style={styles.chart}
          initialData={EMPTY_CANDLES}
          preset="binance"
          mainIndicators={mainIndicatorsConfig}
          subCharts={subChartsConfig}
          volume={{ enabled: true, maPeriods: [5, 10] }}
          theme={themeConfig}
          draw={drawConfig}
          interaction={{ autoFollow: false, loadMoreThreshold: 48 }}
          onLoadMore={async () => []}
          onDrawItemDidTouch={onDrawItemDidTouch}
        />
      </View>

      <TouchableOpacity
        style={styles.reconnectButton}
        onPress={() => reconnectRef.current?.()}
      >
        <Text style={styles.reconnectButtonText}>Reconnect</Text>
      </TouchableOpacity>

      <BinanceControlsModal
        visible={controlsModalVisible}
        symbolOptions={SYMBOL_OPTIONS}
        intervalOptions={INTERVAL_OPTIONS}
        symbol={symbol}
        interval={interval}
        mainMAEnabled={mainMAEnabled}
        mainBOLLEnabled={mainBOLLEnabled}
        emaEnabled={emaEnabled}
        second={second}
        drawType={drawType}
        onClose={() => setControlsModalVisible(false)}
        onSelectSymbol={setSymbol}
        onSelectInterval={item => setInterval(item as BinanceInterval)}
        onToggleMA={() => setMainMAEnabled(value => !value)}
        onToggleBOLL={() => setMainBOLLEnabled(value => !value)}
        onToggleEMA={() => setEmaEnabled(value => !value)}
        onClearMain={() => {
          setMainMAEnabled(false);
          setMainBOLLEnabled(false);
          setEmaEnabled(false);
        }}
        onSelectSub={setSecond}
        onSelectDrawType={setDrawType}
        onClearDraw={triggerClearDraw}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  subTitle: {
    color: '#475569',
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  statusText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
  },
  lastPriceText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    marginBottom: 8,
  },
  chartContainer: {
    flex: 1,
    minHeight: 500,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  chart: {
    flex: 1,
  },
  reconnectButton: {
    marginTop: 12,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reconnectButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
