import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  symbol: string;
  interval: string;
  mainLabels: string[];
  subLabel: string;
  drawLabel: string;
  onOpenControls: () => void;
};

export function BinanceControlSummary({
  symbol,
  interval,
  mainLabels,
  subLabel,
  drawLabel,
  onOpenControls,
}: Props) {
  return (
    <View style={styles.pickerSection}>
      <Text style={styles.controlsSummaryText}>
        {symbol} · {interval} · Main {mainLabels.join('+') || 'None'}
      </Text>
      <Text style={styles.controlsSummaryText}>
        Sub {subLabel} · Draw {drawLabel}
      </Text>
      <TouchableOpacity style={styles.indicatorButton} onPress={onOpenControls}>
        <Text style={styles.indicatorButtonText}>Open Controls</Text>
        <Text style={styles.indicatorSummaryText}>
          Symbol, Interval, Indicator, Draw
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe4f0',
    padding: 12,
    marginBottom: 10,
  },
  controlsSummaryText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
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
});
