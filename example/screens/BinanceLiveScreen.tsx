import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  processColor,
} from 'react-native';
import RNKLineView, { type DrawItemTouchEvent } from 'react-native-kline-view';
import {
  buildBinanceWsUrl,
  fetchBinanceKLineData,
  normalizeBinanceInterval,
  parseBinanceWsKlineUpdate,
  type BinanceInterval,
  type KLineRawPoint,
} from './BinanceService';

const SYMBOL_OPTIONS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
const INTERVAL_OPTIONS: BinanceInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

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

const ema = (values: number[], period: number): number[] => {
  const out: number[] = [];
  if (values.length === 0) {
    return out;
  }
  const alpha = 2 / (period + 1);
  let prev = values[0];
  out.push(prev);
  for (let i = 1; i < values.length; i += 1) {
    prev = values[i] * alpha + prev * (1 - alpha);
    out.push(prev);
  }
  return out;
};

const smaAt = (values: number[], endIndex: number, period: number): number => {
  if (endIndex + 1 < period) {
    return values[endIndex];
  }
  let sum = 0;
  for (let i = endIndex - period + 1; i <= endIndex; i += 1) {
    sum += values[i];
  }
  return sum / period;
};

const stdevAt = (values: number[], endIndex: number, period: number, mean: number): number => {
  if (endIndex + 1 < period) {
    return 0;
  }
  let sum = 0;
  for (let i = endIndex - period + 1; i <= endIndex; i += 1) {
    const diff = values[i] - mean;
    sum += diff * diff;
  }
  return Math.sqrt(sum / period);
};

const buildModelArray = (rawCandles: KLineRawPoint[]) => {
  const closeList = rawCandles.map(item => item.close);
  const volumeList = rawCandles.map(item => item.volume);
  const ema12 = ema(closeList, 12);
  const ema26 = ema(closeList, 26);
  const dif = closeList.map((_, i) => ema12[i] - ema26[i]);
  const dea = ema(dif, 9);
  const macd = dif.map((value, i) => (value - dea[i]) * 2);

  return rawCandles.map((item, index) => {
    const ma5 = smaAt(closeList, index, 5);
    const ma10 = smaAt(closeList, index, 10);
    const ma20 = smaAt(closeList, index, 20);
    const maVol5 = smaAt(volumeList, index, 5);
    const maVol10 = smaAt(volumeList, index, 10);
    const bollMb = smaAt(closeList, index, 20);
    const stdev = stdevAt(closeList, index, 20, bollMb);
    const bollUp = bollMb + 2 * stdev;
    const bollDn = bollMb - 2 * stdev;

    return {
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
      maList: [
        { title: '5', value: ma5, selected: true, index: 0 },
        { title: '10', value: ma10, selected: true, index: 1 },
        { title: '20', value: ma20, selected: true, index: 2 },
      ],
      maVolumeList: [
        { title: '5', value: maVol5, selected: true, index: 0 },
        { title: '10', value: maVol10, selected: true, index: 1 },
      ],
      bollMb,
      bollUp,
      bollDn,
      macdDif: dif[index] ?? 0,
      macdDea: dea[index] ?? 0,
      macdValue: macd[index] ?? 0,
      kdjK: 0,
      kdjD: 0,
      kdjJ: 0,
      rsiList: [],
      wrList: [],
    };
  });
};

export default function BinanceLiveScreen() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectRef = useRef<(() => void) | null>(null);
  const sessionRef = useRef(0);

  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState<BinanceInterval>('1m');
  const [rawCandles, setRawCandles] = useState<KLineRawPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  const [primary, setPrimary] = useState<-1 | 1 | 2>(1);
  const [second, setSecond] = useState<-1 | 3>(3);
  const [drawType, setDrawType] = useState(0);
  const [shouldReloadDrawItemIndex, setShouldReloadDrawItemIndex] = useState(-3);
  const [drawColor, setDrawColor] = useState(toColorNumber('#2563EB', 0xff2563eb));
  const [drawLineHeight] = useState(1);
  const [drawDashWidth] = useState(0);
  const [drawDashSpace] = useState(0);
  const [drawIsLock, setDrawIsLock] = useState(false);
  const [clearDrawNonce, setClearDrawNonce] = useState(0);

  const modelArray = useMemo(() => buildModelArray(rawCandles), [rawCandles]);

  const optionList = useMemo(() => {
    const shouldClearDraw = clearDrawNonce > 0;
    return {
      modelArray,
      shouldScrollToEnd: true,
      targetList: {
        maList: [
          { title: '5', selected: true, index: 0 },
          { title: '10', selected: true, index: 1 },
          { title: '20', selected: true, index: 2 },
        ],
        maVolumeList: [
          { title: '5', selected: true, index: 0 },
          { title: '10', selected: true, index: 1 },
        ],
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
      price: 2,
      volume: 3,
      primary,
      second,
      time: 1,
      configList: {
        colorList: {
          increaseColor: toColorNumber('#16A34A', 0xff16a34a),
          decreaseColor: toColorNumber('#EF4444', 0xffef4444),
        },
        targetColorList: [
          toColorNumber('#eab308', 0xffeab308),
          toColorNumber('#22c55e', 0xff22c55e),
          toColorNumber('#a855f7', 0xffa855f7),
          toColorNumber('#38bdf8', 0xff38bdf8),
          toColorNumber('#f97316', 0xfff97316),
          toColorNumber('#6366f1', 0xff6366f1),
        ],
        minuteLineColor: toColorNumber('#2563eb', 0xff2563eb),
        minuteGradientColorList: [
          toColorNumber('rgba(37,99,235,0.25)', 0x402563eb),
          toColorNumber('rgba(37,99,235,0.10)', 0x1a2563eb),
          toColorNumber('rgba(37,99,235,0)', 0x002563eb),
        ],
        minuteGradientLocationList: [0, 0.6, 1],
        backgroundColor: toColorNumber('#ffffff', 0xffffffff),
        textColor: toColorNumber('#475467', 0xff475467),
        gridColor: toColorNumber('#e2e8f0', 0xffe2e8f0),
        candleTextColor: toColorNumber('#0f172a', 0xff0f172a),
        panelBackgroundColor: toColorNumber('#ffffff', 0xffffffff),
        panelBorderColor: toColorNumber('#cbd5e1', 0xffcbd5e1),
        selectedPointContainerColor: toColorNumber('#000000', 0xff000000),
        selectedPointContentColor: toColorNumber('#000000', 0xff000000),
        cursorStyleEnabled: true,
        cursorInnerRadiusPx: 3,
        cursorOuterRadiusPx: 8,
        cursorInnerColor: toColorNumber('#FF783E', 0xffff783e),
        cursorOuterColor: toColorNumber('rgba(48,48,48,0.07)', 0x12303030),
        cursorOuterBlurRadiusPx: 0,
        cursorBorderWidthPx: 0,
        cursorBorderColor: toColorNumber('#1F2937', 0xff1f2937),
        cursorInnerBorderWidthPx: 0.5,
        cursorInnerBorderColor: toColorNumber('#F8FAFC', 0xfff8fafc),
        closePriceCenterBackgroundColor: toColorNumber('#ffffff', 0xffffffff),
        closePriceCenterBorderColor: toColorNumber('#94a3b8', 0xff94a3b8),
        closePriceCenterTriangleColor: toColorNumber('#94a3b8', 0xff94a3b8),
        closePriceCenterSeparatorColor: toColorNumber('#94a3b8', 0xff94a3b8),
        closePriceRightBackgroundColor: toColorNumber('#ffffff', 0xffffffff),
        closePriceRightSeparatorColor: toColorNumber('#94a3b8', 0xff94a3b8),
        closePriceRightLightLottieFloder: '',
        closePriceRightLightLottieScale: 0,
        closePriceRightLightLottieSource: '',
        panelGradientColorList: [toColorNumber('#ffffff', 0xffffffff)],
        panelGradientLocationList: [1],
        mainFlex: 0.72,
        volumeFlex: 0.14,
        paddingTop: 26,
        paddingBottom: 20,
        paddingRight: 54,
        itemWidth: 11,
        candleWidth: 8,
        minuteVolumeCandleColor: toColorNumber('#2563eb', 0xff2563eb),
        minuteVolumeCandleWidth: 2,
        macdCandleWidth: 3,
        headerTextFontSize: 11,
        rightTextFontSize: 10,
        candleTextFontSize: 10,
        panelTextFontSize: 10,
        panelMinWidth: 48,
        fontFamily: '',
        rightOffsetCandles: 0,
      },
      drawList: {
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
        shouldClearDraw,
      },
    };
  }, [
    clearDrawNonce,
    drawColor,
    drawDashSpace,
    drawDashWidth,
    drawIsLock,
    drawLineHeight,
    drawType,
    modelArray,
    primary,
    second,
    shouldReloadDrawItemIndex,
  ]);

  const optionListString = useMemo(() => JSON.stringify(optionList), [optionList]);

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
    setLoading(true);
    setError(null);
    setIsConnected(false);
    setIsReconnecting(false);

    const connectWebSocket = (attempt: number) => {
      if (!active || sessionId !== sessionRef.current) return;

      const wsUrl = buildBinanceWsUrl(symbol, normalizedInterval);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active || sessionId !== sessionRef.current || wsRef.current !== ws) {
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

        setLastPrice(update.candle.close);
        setRawCandles(prev => {
          if (prev.length === 0) {
            return [update.candle];
          }

          const last = prev[prev.length - 1];
          if (update.candle.time > last.time) {
            return [...prev, update.candle];
          }
          if (update.candle.time === last.time) {
            const next = [...prev];
            next[next.length - 1] = update.candle;
            return next;
          }

          const index = prev.findIndex(item => item.time === update.candle.time);
          if (index === -1) {
            return prev;
          }
          const next = [...prev];
          next[index] = update.candle;
          return next;
        });
      };

      ws.onerror = () => {
        if (!active || sessionId !== sessionRef.current) return;
        setError('WebSocket error');
      };

      ws.onclose = () => {
        if (!active || sessionId !== sessionRef.current || wsRef.current !== ws) return;

        wsRef.current = null;
        setIsConnected(false);
        const nextAttempt = attempt + 1;
        const retryDelay = Math.min(10000, 1000 * Math.pow(2, attempt));
        setIsReconnecting(true);
        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(() => connectWebSocket(nextAttempt), retryDelay);
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
        const raw = await fetchBinanceKLineData(symbol, normalizedInterval, 300);
        if (!active || sessionId !== sessionRef.current) return;

        setRawCandles(raw);
        setLastPrice(raw.length > 0 ? raw[raw.length - 1].close : null);
        if (raw.length === 0) {
          setError('No data from Binance');
          return;
        }
        connectWebSocket(0);
      } catch (fetchError) {
        if (!active || sessionId !== sessionRef.current) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load Binance data');
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Binance Live</Text>
      <Text style={styles.subTitle}>REST history + realtime WebSocket kline stream</Text>

      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>Symbol</Text>
        <View style={styles.row}>
          {SYMBOL_OPTIONS.map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, symbol === item && styles.chipActive]}
              onPress={() => setSymbol(item)}
            >
              <Text style={[styles.chipText, symbol === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.pickerLabel}>Interval</Text>
        <View style={styles.row}>
          {INTERVAL_OPTIONS.map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, interval === item && styles.chipActive]}
              onPress={() => setInterval(item)}
            >
              <Text style={[styles.chipText, interval === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.pickerLabel}>Indicator</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.chip, primary === -1 && styles.chipActive]}
            onPress={() => setPrimary(-1)}
          >
            <Text style={[styles.chipText, primary === -1 && styles.chipTextActive]}>No Main</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, primary === 1 && styles.chipActive]}
            onPress={() => setPrimary(1)}
          >
            <Text style={[styles.chipText, primary === 1 && styles.chipTextActive]}>MA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, primary === 2 && styles.chipActive]}
            onPress={() => setPrimary(2)}
          >
            <Text style={[styles.chipText, primary === 2 && styles.chipTextActive]}>BOLL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, second === -1 && styles.chipActive]}
            onPress={() => setSecond(-1)}
          >
            <Text style={[styles.chipText, second === -1 && styles.chipTextActive]}>No Sub</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, second === 3 && styles.chipActive]}
            onPress={() => setSecond(3)}
          >
            <Text style={[styles.chipText, second === 3 && styles.chipTextActive]}>MACD</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.pickerLabel}>Draw</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.chip, drawType === 0 && styles.chipActive]}
            onPress={() => setDrawType(0)}
          >
            <Text style={[styles.chipText, drawType === 0 && styles.chipTextActive]}>None</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, drawType === 1 && styles.chipActive]}
            onPress={() => setDrawType(1)}
          >
            <Text style={[styles.chipText, drawType === 1 && styles.chipTextActive]}>Line</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, drawType === 2 && styles.chipActive]}
            onPress={() => setDrawType(2)}
          >
            <Text style={[styles.chipText, drawType === 2 && styles.chipTextActive]}>HLine</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, drawType === 6 && styles.chipActive]}
            onPress={() => setDrawType(6)}
          >
            <Text style={[styles.chipText, drawType === 6 && styles.chipTextActive]}>Rect</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, styles.clearChip]} onPress={triggerClearDraw}>
            <Text style={styles.clearChipText}>Clear Draw</Text>
          </TouchableOpacity>
        </View>
      </View>

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
          style={styles.chart}
          optionList={optionListString}
          onDrawItemDidTouch={onDrawItemDidTouch}
        />
      </View>

      <TouchableOpacity style={styles.reconnectButton} onPress={() => reconnectRef.current?.()}>
        <Text style={styles.reconnectButtonText}>Reconnect</Text>
      </TouchableOpacity>
    </View>
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
  pickerSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe4f0',
    padding: 12,
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  chipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  clearChip: {
    borderColor: '#ef4444',
    backgroundColor: '#fff1f2',
  },
  clearChipText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
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
    minHeight: 380,
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
