import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
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

const buildCandles = (rawCandles: KLineRawPoint[]) =>
  rawCandles.map(item => ({
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
  }));

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

  const [mainMAEnabled, setMainMAEnabled] = useState(true);
  const [mainBOLLEnabled, setMainBOLLEnabled] = useState(false);
  const [second, setSecond] = useState<-1 | 3>(3);
  const [emaEnabled, setEmaEnabled] = useState(true);
  const [controlsModalVisible, setControlsModalVisible] = useState(false);
  const [drawType, setDrawType] = useState(0);
  const [shouldReloadDrawItemIndex, setShouldReloadDrawItemIndex] = useState(-3);
  const [drawColor, setDrawColor] = useState(toColorNumber('#2563EB', 0xff2563eb));
  const [drawLineHeight] = useState(1);
  const [drawDashWidth] = useState(0);
  const [drawDashSpace] = useState(0);
  const [drawIsLock, setDrawIsLock] = useState(false);
  const [clearDrawNonce, setClearDrawNonce] = useState(0);

  const candles = useMemo(() => buildCandles(rawCandles), [rawCandles]);

  const primary = useMemo(() => {
    if (mainMAEnabled) return 1;
    if (mainBOLLEnabled) return 2;
    return -1;
  }, [mainBOLLEnabled, mainMAEnabled]);

  const indicatorConfig = useMemo(
    () => ({
      primary,
      main: {
        ma: mainMAEnabled,
        boll: mainBOLLEnabled,
      },
      second,
      time: 1,
      price: 2,
      volume: 3,
      autoCompute: true,
      computeMode: 'prefer_input' as const,
      ema: {
        enabled: emaEnabled,
        periods: [10, 30, 60],
      },
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
    }),
    [emaEnabled, mainBOLLEnabled, mainMAEnabled, primary, second],
  );

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

  useEffect(() => {
    if (clearDrawNonce <= 0) {
      return;
    }
    const timer = setTimeout(() => setClearDrawNonce(0), 0);
    return () => clearTimeout(timer);
  }, [clearDrawNonce]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Binance Live</Text>
      <Text style={styles.subTitle}>REST history + realtime WebSocket kline stream</Text>

      <View style={styles.pickerSection}>
        <Text style={styles.controlsSummaryText}>
          {symbol} · {interval} · Main{' '}
          {[
            mainMAEnabled ? 'MA' : null,
            mainBOLLEnabled ? 'BOLL' : null,
            emaEnabled ? 'EMA' : null,
          ]
            .filter(Boolean)
            .join('+') || 'None'}
        </Text>
        <Text style={styles.controlsSummaryText}>
          Sub {second === -1 ? 'None' : 'MACD'} · Draw{' '}
          {drawType === 0 ? 'None' : drawType === 1 ? 'Line' : drawType === 2 ? 'HLine' : 'Rect'}
        </Text>
        <TouchableOpacity
          style={styles.indicatorButton}
          onPress={() => setControlsModalVisible(true)}
        >
          <Text style={styles.indicatorButtonText}>Open Controls</Text>
          <Text style={styles.indicatorSummaryText}>Symbol, Interval, Indicator, Draw</Text>
        </TouchableOpacity>
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
          candles={candles}
          preset="binance"
          indicator={indicatorConfig}
          theme={themeConfig}
          draw={drawConfig}
          interaction={{ shouldScrollToEnd: true }}
          onDrawItemDidTouch={onDrawItemDidTouch}
        />
      </View>

      <TouchableOpacity style={styles.reconnectButton} onPress={() => reconnectRef.current?.()}>
        <Text style={styles.reconnectButtonText}>Reconnect</Text>
      </TouchableOpacity>

      <Modal
        visible={controlsModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setControlsModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setControlsModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Chart Controls</Text>

            <Text style={styles.modalSectionLabel}>Symbol</Text>
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

            <Text style={styles.modalSectionLabel}>Interval</Text>
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

            <Text style={styles.modalSectionLabel}>Main</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.chip, mainMAEnabled && styles.chipActive]}
                onPress={() => setMainMAEnabled(value => !value)}
              >
                <Text style={[styles.chipText, mainMAEnabled && styles.chipTextActive]}>
                  MA
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, mainBOLLEnabled && styles.chipActive]}
                onPress={() => setMainBOLLEnabled(value => !value)}
              >
                <Text style={[styles.chipText, mainBOLLEnabled && styles.chipTextActive]}>
                  BOLL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, emaEnabled && styles.chipActive]}
                onPress={() => setEmaEnabled(value => !value)}
              >
                <Text style={[styles.chipText, emaEnabled && styles.chipTextActive]}>
                  EMA
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, styles.clearChip]}
                onPress={() => {
                  setMainMAEnabled(false);
                  setMainBOLLEnabled(false);
                  setEmaEnabled(false);
                }}
              >
                <Text style={styles.clearChipText}>Clear Main</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionLabel}>Sub</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.chip, second === -1 && styles.chipActive]}
                onPress={() => setSecond(-1)}
              >
                <Text style={[styles.chipText, second === -1 && styles.chipTextActive]}>
                  No Sub
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, second === 3 && styles.chipActive]}
                onPress={() => setSecond(3)}
              >
                <Text style={[styles.chipText, second === 3 && styles.chipTextActive]}>
                  MACD
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionLabel}>Draw</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.chip, drawType === 0 && styles.chipActive]}
                onPress={() => setDrawType(0)}
              >
                <Text style={[styles.chipText, drawType === 0 && styles.chipTextActive]}>
                  None
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, drawType === 1 && styles.chipActive]}
                onPress={() => setDrawType(1)}
              >
                <Text style={[styles.chipText, drawType === 1 && styles.chipTextActive]}>
                  Line
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, drawType === 2 && styles.chipActive]}
                onPress={() => setDrawType(2)}
              >
                <Text style={[styles.chipText, drawType === 2 && styles.chipTextActive]}>
                  HLine
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, drawType === 6 && styles.chipActive]}
                onPress={() => setDrawType(6)}
              >
                <Text style={[styles.chipText, drawType === 6 && styles.chipTextActive]}>
                  Rect
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chip, styles.clearChip]} onPress={triggerClearDraw}>
                <Text style={styles.clearChipText}>Clear Draw</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setControlsModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  indicatorButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  indicatorButtonText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  indicatorSummaryText: {
    marginTop: 4,
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  controlsSummaryText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe4f0',
    padding: 14,
  },
  modalTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 10,
  },
  modalSectionLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
