import React, { useState } from 'react';
import type { ChartAIData } from './Data/ChartAIDataType';
import { chart_data } from './Data/ChartAIData';
import {
  bumpLatestSnapshotCandle,
  cloneChartAISnapshot,
} from './Data/chartAISnapshotUtils';
import ChartAISnapshotDemoLayout from './components/special/ChartAISnapshotDemoLayout';
import ChartAIRSIChart from './components/special/ChartAIRSIChart';

export default function ChartAIRSIDemoScreen() {
  const [snapshot, setSnapshot] = useState<ChartAIData>(() =>
    cloneChartAISnapshot(chart_data),
  );

  const candleCount = snapshot?.market_data?.candles?.length ?? 0;
  const handleRefreshSnapshot = () => {
    setSnapshot(prev => bumpLatestSnapshotCandle(prev, 0.12));
  };

  return (
    <ChartAISnapshotDemoLayout
      title="ChartAI RSI Snapshot Demo"
      candleCount={candleCount}
      onRefreshSnapshot={handleRefreshSnapshot}
    >
      <ChartAIRSIChart data={snapshot} />
    </ChartAISnapshotDemoLayout>
  );
}
