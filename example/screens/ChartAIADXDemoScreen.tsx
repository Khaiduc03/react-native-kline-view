import React, { useState } from 'react';
import type { ChartAIData } from './Data/ChartAIDataType';
import { chart_data } from './Data/ChartAIData';
import {
  bumpLatestSnapshotCandle,
  cloneChartAISnapshot,
} from './Data/chartAISnapshotUtils';
import ChartAISnapshotDemoLayout from './components/special/ChartAISnapshotDemoLayout';
import ChartAIADXChart from './components/special/ChartAIADXChart';

export default function ChartAIADXDemoScreen() {
  const [snapshot, setSnapshot] = useState<ChartAIData>(() =>
    cloneChartAISnapshot(chart_data),
  );

  const candleCount = snapshot?.market_data?.candles?.length ?? 0;
  const handleRefreshSnapshot = () => {
    setSnapshot(prev => bumpLatestSnapshotCandle(prev, 0.1));
  };

  return (
    <ChartAISnapshotDemoLayout
      title="ChartAI ADX Snapshot Demo"
      candleCount={candleCount}
      onRefreshSnapshot={handleRefreshSnapshot}
    >
      <ChartAIADXChart data={snapshot} />
    </ChartAISnapshotDemoLayout>
  );
}
