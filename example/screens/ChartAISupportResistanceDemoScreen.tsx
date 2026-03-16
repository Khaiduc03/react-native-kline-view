import React, { useState } from 'react';
import type { ChartAIData } from './Data/ChartAIDataType';
import { chart_data } from './Data/ChartAIData';
import {
  bumpLatestSnapshotCandle,
  cloneChartAISnapshot,
} from './Data/chartAISnapshotUtils';
import ChartAISnapshotDemoLayout from './components/special/ChartAISnapshotDemoLayout';
import ChartAISupportResistanceChart from './components/special/ChartAISupportResistanceChart';

export default function ChartAISupportResistanceDemoScreen() {
  const [snapshot, setSnapshot] = useState<ChartAIData>(() =>
    cloneChartAISnapshot(chart_data),
  );

  const candleCount = snapshot?.market_data?.candles?.length ?? 0;
  const handleRefreshSnapshot = () => {
    setSnapshot(prev => bumpLatestSnapshotCandle(prev, 0.18));
  };

  return (
    <ChartAISnapshotDemoLayout
      title="ChartAI Support/Resistance Demo"
      candleCount={candleCount}
      onRefreshSnapshot={handleRefreshSnapshot}
    >
      <ChartAISupportResistanceChart data={snapshot} />
    </ChartAISnapshotDemoLayout>
  );
}
