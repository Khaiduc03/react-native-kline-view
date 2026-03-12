import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNKLineView, {
  type Candle,
  type RNKLineViewRef,
} from 'react-native-kline-view';
import {
  buildBinanceWsUrl,
  fetchBinanceKLineData,
  normalizeBinanceInterval,
  parseBinanceWsKlineUpdate,
  type BinanceInterval,
  type KLineRawPoint,
} from './BinanceService';

const SYMBOL_OPTIONS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
const INTERVAL_OPTIONS: BinanceInterval[] = [
  '1m',
  '5m',
  '15m',
  '1h',
  '4h',
  '1d',
];

const formatDateString = (time: number): string => {
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hh}:${mm}`;
};

const mapRawToCandle = (point: KLineRawPoint): Candle => ({
  id: point.time,
  dateString: formatDateString(point.time),
  open: point.open,
  high: point.high,
  low: point.low,
  close: point.close,
  vol: point.volume,
});

export default function BinanceLiveScreen() {
  const klineRef = useRef<RNKLineViewRef>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectRef = useRef<(() => void) | null>(null);
  const sessionRef = useRef(0);
  const lastOpenTimeRef = useRef<number | null>(null);

  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState<BinanceInterval>('1m');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  const statusText = useMemo(() => {
    if (loading) {
      return 'Loading';
    }
    if (error) {
      return 'Error';
    }
    if (isReconnecting) {
      return 'Reconnecting';
    }
    if (isConnected) {
      return 'Live';
    }
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
    lastOpenTimeRef.current = null;

    const connectWebSocket = (attempt: number) => {
      if (!active || sessionId !== sessionRef.current) {
        return;
      }

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
        if (!active || sessionId !== sessionRef.current) {
          return;
        }
        const update = parseBinanceWsKlineUpdate(event.data);
        if (!update) {
          return;
        }

        const candle = mapRawToCandle(update.candle);
        setLastPrice(candle.close);

        const lastOpenTime = lastOpenTimeRef.current;
        if (lastOpenTime === null) {
          lastOpenTimeRef.current = candle.id;
          klineRef.current?.updateLastCandle(candle);
          return;
        }

        if (candle.id > lastOpenTime) {
          lastOpenTimeRef.current = candle.id;
          klineRef.current?.appendCandle(candle);
        } else if (candle.id === lastOpenTime) {
          klineRef.current?.updateLastCandle(candle);
        } else {
          // Out-of-order tick from socket; ignore old candle.
        }
      };

      ws.onerror = () => {
        if (!active || sessionId !== sessionRef.current) {
          return;
        }
        setError('WebSocket error');
      };

      ws.onclose = () => {
        if (
          !active ||
          sessionId !== sessionRef.current ||
          wsRef.current !== ws
        ) {
          return;
        }
        wsRef.current = null;
        setIsConnected(false);

        const nextAttempt = attempt + 1;
        const retryDelay = Math.min(10000, 1000 * Math.pow(2, attempt));
        setIsReconnecting(true);
        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket(nextAttempt);
        }, retryDelay);
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
        const rawData = await fetchBinanceKLineData(
          symbol,
          normalizedInterval,
          300,
        );
        if (!active || sessionId !== sessionRef.current) {
          return;
        }

        const nextCandles = rawData.map(mapRawToCandle);
        setCandles(nextCandles);
        lastOpenTimeRef.current =
          nextCandles.length > 0 ? nextCandles[nextCandles.length - 1].id : null;
        setLastPrice(
          nextCandles.length > 0
            ? nextCandles[nextCandles.length - 1].close
            : null,
        );

        if (nextCandles.length === 0) {
          setError('No data from Binance');
          return;
        }

        connectWebSocket(0);
      } catch (fetchError) {
        if (!active || sessionId !== sessionRef.current) {
          return;
        }
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Binance Live</Text>
      <Text style={styles.subTitle}>
        REST history + realtime WebSocket kline stream
      </Text>

      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>Symbol</Text>
        <View style={styles.row}>
          {SYMBOL_OPTIONS.map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, symbol === item && styles.chipActive]}
              onPress={() => setSymbol(item)}
            >
              <Text
                style={[
                  styles.chipText,
                  symbol === item && styles.chipTextActive,
                ]}
              >
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
              <Text
                style={[
                  styles.chipText,
                  interval === item && styles.chipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
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
        <RNKLineView ref={klineRef} style={styles.chart} candles={candles} />
      </View>

      <TouchableOpacity
        style={styles.reconnectButton}
        onPress={() => reconnectRef.current?.()}
      >
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
