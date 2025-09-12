import React from 'react';
import { View, StyleSheet } from 'react-native';
import RNKLineView from 'react-native-kline-view';
import { KLineChartProps } from '../types';

const KLineChart: React.FC<KLineChartProps> = ({
  optionList,
  onDrawItemDidTouch,
  onDrawItemComplete,
  onDrawPointComplete,
}) => {
  const directRender = (
    <RNKLineView
      style={styles.chart}
      optionList={optionList}
      onDrawItemDidTouch={onDrawItemDidTouch}
      onDrawItemComplete={onDrawItemComplete}
      onDrawPointComplete={onDrawPointComplete}
    />
  );

  // Check if using new architecture on iOS
  if (
    (global as any)?.nativeFabricUIManager &&
    require('react-native').Platform.OS === 'ios'
  ) {
    return directRender;
  }

  return (
    <View style={{ flex: 1 }} collapsable={false}>
      <View style={{ flex: 1 }} collapsable={false}>
        <View style={styles.chartContainer} collapsable={false}>
          {directRender}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chart: {
    flex: 1,
  },
  chartContainer: {
    flex: 1,
  },
});

export default KLineChart;
