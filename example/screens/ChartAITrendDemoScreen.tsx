import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ChartAIData } from './Data/ChartAIDataType';
import { chart_data } from './Data/ChartAIData';
import ChartAITrendChart from './components/special/ChartAITrendChart';

const cloneSnapshot = (input: ChartAIData): ChartAIData =>
  JSON.parse(JSON.stringify(input)) as ChartAIData;

export default function ChartAITrendDemoScreen() {
  const [snapshot, setSnapshot] = useState<ChartAIData>(() =>
    cloneSnapshot(chart_data),
  );

  const candleCount = snapshot?.market_data?.candles?.length ?? 0;
  const handleRefreshSnapshot = () => {
    setSnapshot(prev => {
      const next = cloneSnapshot(prev);
      const candles = next.market_data?.candles;
      if (Array.isArray(candles) && candles.length > 0) {
        const last = candles[candles.length - 1];
        const lastClose = Number(last.close ?? 0);
        const bumped = Number((lastClose + 0.18).toFixed(2));
        last.close = bumped;
        last.high = Math.max(Number(last.high ?? bumped), bumped);
      }
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>ChartAI Trend Snapshot Demo</Text>
      <Text style={styles.subHeader}>Candles: {candleCount}</Text>
      <View style={styles.chartWrap}>
        <ChartAITrendChart data={snapshot} />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleRefreshSnapshot}>
        <Text style={styles.buttonText}>Simulate Server Snapshot</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    paddingBottom: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 10,
  },
  chartWrap: {
    flex: 1,
    minHeight: 420,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
