import { useState, useCallback } from 'react';

interface PanData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  macd?: number;
  dif?: number;
  dea?: number;
}

interface PanPosition {
  x: number;
  y: number;
}

export const usePanData = () => {
  const [panData, setPanData] = useState<PanData | null>(null);
  const [panPosition, setPanPosition] = useState<PanPosition>({ x: 0, y: 0 });
  const [isPanVisible, setIsPanVisible] = useState(false);

  const updatePanData = useCallback((data: PanData | null) => {
    setPanData(data);
  }, []);

  const updatePanPosition = useCallback((position: PanPosition) => {
    setPanPosition(position);
  }, []);

  const showPan = useCallback((data: PanData, position: PanPosition) => {
    setPanData(data);
    setPanPosition(position);
    setIsPanVisible(true);
  }, []);

  const hidePan = useCallback(() => {
    setIsPanVisible(false);
    setPanData(null);
  }, []);

  const processKLineData = useCallback((rawData: any): PanData => {
    // Calculate change and change percent
    const change = rawData.close - rawData.open;
    const changePercent = (change / rawData.open) * 100;

    return {
      time: rawData.dateString || rawData.time || '',
      open: rawData.open || 0,
      high: rawData.high || 0,
      low: rawData.low || 0,
      close: rawData.close || 0,
      change,
      changePercent,
      volume: rawData.volume || rawData.vol || 0,
      ma5: rawData.ma5 || rawData.maList?.[0]?.value,
      ma10: rawData.ma10 || rawData.maList?.[1]?.value,
      ma20: rawData.ma20 || rawData.maList?.[2]?.value,
      macd: rawData.macd || rawData.macdValue,
      dif: rawData.dif || rawData.macdDif,
      dea: rawData.dea || rawData.macdDea,
    };
  }, []);

  return {
    panData,
    panPosition,
    isPanVisible,
    updatePanData,
    updatePanPosition,
    showPan,
    hidePan,
    processKLineData,
  };
};
