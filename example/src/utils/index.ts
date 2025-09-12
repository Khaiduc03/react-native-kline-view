import { processColor } from 'react-native';
import { KLineData, HTKLineItemModel } from '../types';

// Helper function: convert RGB values from 0-1 range to 0-255 range
export const COLOR = (r: number, g: number, b: number, a: number = 1): string => {
  if (a === 1) {
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  } else {
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
  }
};

// Helper functions
export const fixRound = (
  value: number | null | undefined,
  precision: number,
  showSign: boolean = false,
  showGrouping: boolean = false
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }

  let result = Number(value).toFixed(precision);

  if (showGrouping) {
    // Add thousands separator
    result = result.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  if (showSign && value > 0) {
    result = '+' + result;
  }

  return result;
};

// FORMAT helper function
export const FORMAT = (text: string): string => text;

// Time formatting function, replaces moment
export const formatTime = (timestamp: number, format: string = 'MM-DD HH:mm'): string => {
  const date = new Date(timestamp);

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Support common formatting patterns
  return format
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// Technical indicator calculation functions
export const calculateBOLL = (data: KLineData[], n: number = 20, p: number = 2): KLineData[] => {
  return data.map((item, index) => {
    if (index < n - 1) {
      return {
        ...item,
        bollMb: item.close,
        bollUp: item.close,
        bollDn: item.close,
      };
    }

    // Calculate MA
    let sum = 0;
    for (let i = index - n + 1; i <= index; i++) {
      sum += data[i].close;
    }
    const ma = sum / n;

    // Calculate standard deviation
    let variance = 0;
    for (let i = index - n + 1; i <= index; i++) {
      variance += Math.pow(data[i].close - ma, 2);
    }
    const std = Math.sqrt(variance / (n - 1));

    return {
      ...item,
      bollMb: ma,
      bollUp: ma + p * std,
      bollDn: ma - p * std,
    };
  });
};

export const calculateMACD = (data: KLineData[], s: number = 12, l: number = 26, m: number = 9): KLineData[] => {
  let ema12 = data[0].close;
  let ema26 = data[0].close;
  let dea = 0;

  return data.map((item, index) => {
    if (index === 0) {
      return {
        ...item,
        macdValue: 0,
        macdDea: 0,
        macdDif: 0,
      };
    }

    // Calculate EMA
    ema12 = (2 * item.close + (s - 1) * ema12) / (s + 1);
    ema26 = (2 * item.close + (l - 1) * ema26) / (l + 1);

    const dif = ema12 - ema26;
    dea = (2 * dif + (m - 1) * dea) / (m + 1);
    const macd = 2 * (dif - dea);

    return {
      ...item,
      macdValue: macd,
      macdDea: dea,
      macdDif: dif,
    };
  });
};

export const calculateKDJ = (data: KLineData[], n: number = 9, m1: number = 3, m2: number = 3): KLineData[] => {
  let k = 50;
  let d = 50;

  return data.map((item, index) => {
    if (index === 0) {
      return {
        ...item,
        kdjK: k,
        kdjD: d,
        kdjJ: 3 * k - 2 * d,
      };
    }

    // Find highest and lowest prices within n periods
    const startIndex = Math.max(0, index - n + 1);
    let highest = -Infinity;
    let lowest = Infinity;

    for (let i = startIndex; i <= index; i++) {
      highest = Math.max(highest, data[i].high);
      lowest = Math.min(lowest, data[i].low);
    }

    const rsv = highest === lowest ? 50 : ((item.close - lowest) / (highest - lowest)) * 100;
    k = (rsv + (m1 - 1) * k) / m1;
    d = (k + (m1 - 1) * d) / m1;
    const j = m2 * k - 2 * d;

    return {
      ...item,
      kdjK: k,
      kdjD: d,
      kdjJ: j,
    };
  });
};

export const calculateRSI = (data: KLineData[], n: number = 14): KLineData[] => {
  let rsiABSEma = 0;
  let rsiMaxEma = 0;

  return data.map((item, index) => {
    if (index === 0) {
      return {
        ...item,
        rsi: 0,
      };
    }

    const Rmax = Math.max(0, item.close - data[index - 1].close);
    const RAbs = Math.abs(item.close - data[index - 1].close);

    rsiMaxEma = (Rmax + (n - 1) * rsiMaxEma) / n;
    rsiABSEma = (RAbs + (n - 1) * rsiABSEma) / n;
    const rsi = (rsiMaxEma / rsiABSEma) * 100;

    return {
      ...item,
      rsi: isNaN(rsi) ? 0 : rsi,
    };
  });
};

export const calculateWR = (data: KLineData[], n: number = 14): KLineData[] => {
  return data.map((item, index) => {
    if (index < n - 1) {
      return {
        ...item,
        wr: -10,
      };
    }

    const startIndex = Math.max(0, index - n + 1);
    let highest = -Infinity;
    let lowest = Infinity;

    for (let i = startIndex; i <= index; i++) {
      highest = Math.max(highest, data[i].high);
      lowest = Math.min(lowest, data[i].low);
    }

    const wr = -100 * (highest - item.close) / (highest - lowest);
    return {
      ...item,
      wr: isNaN(wr) ? 0 : wr,
    };
  });
};

// Drawing tool helper methods
export const DrawToolHelper = {
  name: (type: number): string => {
    switch (type) {
      case 1:
        return FORMAT('Line');
      case 2:
        return FORMAT('Horizontal Line');
      case 3:
        return FORMAT('Vertical Line');
      case 4:
        return FORMAT('Ray');
      case 5:
        return FORMAT('Parallel Channel');
      case 101:
        return FORMAT('Rectangle');
      case 102:
        return FORMAT('Parallelogram');
    }
    return '';
  },

  count: (type: number): number => {
    if (type === 1 || type === 2 || type === 3 || type === 4 || type === 101) {
      return 2;
    }
    if (type === 5 || type === 102) {
      return 3;
    }
    return 0;
  },
};

// Generate mock K-line data
export const generateMockData = (): KLineData[] => {
  const data: KLineData[] = [];
  let lastClose = 50000;
  const now = Date.now();

  for (let i = 0; i < 200; i++) {
    const time = now - (200 - i) * 15 * 60 * 1000; // 15 minute intervals

    // Next open equals previous close to ensure continuity
    const open = lastClose;

    // Generate reasonable high and low prices
    const volatility = 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * open * volatility;
    const close = Math.max(open + change, open * 0.95); // Maximum decline 5%

    // Ensure high >= max(open, close), low <= min(open, close)
    const maxPrice = Math.max(open, close);
    const minPrice = Math.min(open, close);
    const high = maxPrice + Math.random() * open * 0.01; // Maximum 1% higher
    const low = minPrice - Math.random() * open * 0.01; // Maximum 1% lower
    const volume = (0.5 + Math.random()) * 1000000; // Volume from 500k to 1.5M

    data.push({
      id: time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(2)),
      dateString: formatTime(time),
    });

    lastClose = close;
  }

  return data;
};
