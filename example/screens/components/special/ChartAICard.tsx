import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ChartAICardProps = {
  title: string;
  children: React.ReactNode;
  minHeight?: number;
};

export default function ChartAICard({
  title,
  children,
  minHeight = 360,
}: ChartAICardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.chartBox, { minHeight }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe4ef',
    overflow: 'hidden',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  chartBox: {
    flex: 1,
  },
});
