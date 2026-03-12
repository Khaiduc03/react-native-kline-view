import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RNKLineView, {
  type Candle,
  type RNKLineViewRef,
} from 'react-native-kline-view';
import { chart_data } from './MockData';

type RawCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function buildSeedCandles(): Candle[] {
  const source = (chart_data?.market_data?.candles ?? []) as RawCandle[];
  if (!Array.isArray(source) || source.length === 0) {
    return [];
  }

  const windowSize = 120;
  const start = Math.max(0, source.length - windowSize);
  const windowed = source.slice(start);

  return windowed.map((item, index) => {
    const id = Number(item.time) * 1000 + index;
    const date = new Date(Number(item.time) * 1000);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return {
      id,
      dateString: `${month}-${day}`,
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      vol: Number(item.volume ?? 0),
    };
  });
}

export default function SimpleKLineScreen() {
  const klineRef = useRef<RNKLineViewRef>(null);
  const seedCandles = useMemo(() => buildSeedCandles(), []);
  const [lastClose, setLastClose] = useState(
    seedCandles[seedCandles.length - 1]?.close ?? 0,
  );

  const handleUpdateLast = () => {
    const next = Number((lastClose + 0.8).toFixed(2));
    const last = seedCandles[seedCandles.length - 1];
    if (!last) {
      return;
    }
    klineRef.current?.updateLastCandle({
      ...last,
      close: next,
      high: Math.max(last.high, next),
      low: Math.min(last.low, next),
    });
    setLastClose(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Usage</Text>
      <Text style={styles.subTitle}>
        Chỉ truyền `candles`. Không cần tự tạo `optionList`.
      </Text>

      <View style={styles.chartContainer}>
        <RNKLineView
          ref={klineRef}
          style={styles.chart}
          candles={seedCandles}
          indicator={{ primary: 1, second: 3, time: 1 }}
          format={{ price: 2, volume: 2, time: 1 }}
          theme={{
            colorList: {
              increaseColor: '#1E9E69',
              decreaseColor: '#F04438',
            },
          }}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleUpdateLast}>
        <Text style={styles.buttonText}>Update Last Candle</Text>
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
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 10,
  },
  chartContainer: {
    flex: 1,
    minHeight: 420,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  chart: {
    flex: 1,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
