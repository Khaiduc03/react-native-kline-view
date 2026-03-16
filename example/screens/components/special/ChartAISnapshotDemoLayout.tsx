import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ChartAISnapshotDemoLayoutProps = {
  title: string;
  candleCount: number;
  onRefreshSnapshot: () => void;
  children: React.ReactNode;
  refreshLabel?: string;
};

export default function ChartAISnapshotDemoLayout({
  title,
  candleCount,
  onRefreshSnapshot,
  children,
  refreshLabel = 'Simulate Server Snapshot',
}: ChartAISnapshotDemoLayoutProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>
      <Text style={styles.subHeader}>Candles: {candleCount}</Text>
      <View style={styles.chartWrap}>{children}</View>
      <TouchableOpacity style={styles.button} onPress={onRefreshSnapshot}>
        <Text style={styles.buttonText}>{refreshLabel}</Text>
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
