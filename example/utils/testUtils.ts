import { formatTime } from './helpers';

export const testUpdateLastCandlestick = (
  klineData: any[],
  _showVolumeChart: boolean,
  updateLastCandlestickCallback: (candle: any) => void,
) => {
  if (!updateLastCandlestickCallback || klineData.length === 0) {
    console.warn('No callback or data available');
    return;
  }

  const lastCandle = klineData[klineData.length - 1];

  // Generate new price data (simulate real-time updates)
  const basePrice = lastCandle.close;
  const priceVariation = (Math.random() - 0.5) * basePrice * 0.01; // ±1% variation

  const newClose = Math.max(0.01, basePrice + priceVariation);
  const newHigh =
    Math.max(lastCandle.high, newClose + Math.random() * basePrice * 0.002);
  const newLow =
    Math.min(lastCandle.low, newClose - Math.random() * basePrice * 0.002);
  const newVolume = Math.round(
    lastCandle.vol * (0.8 + Math.random() * 0.4),
  ); // ±20% volume variation

  // Create updated candlestick with preserved indicators
  const updatedCandle = {
    time: lastCandle.time,
    open: lastCandle.open, // Keep original open
    high: newHigh,
    low: newLow,
    close: newClose,
    vol: newVolume,
    id: lastCandle.id,
    dateString: lastCandle.dateString,
    // Preserve existing indicators
    maList: lastCandle.maList || [],
    maVolumeList: lastCandle.maVolumeList || [],
    rsiList: lastCandle.rsiList || [],
    wrList: lastCandle.wrList || [],
    selectedItemList: lastCandle.selectedItemList || [],
    bollMb: newClose * (1 + Math.random() * 0.06 - 0.03),
    bollUp: newClose * (1 + Math.random() * 0.06 - 0.03),
    bollDn: newClose * (1 + Math.random() * 0.06 - 0.03),
    kdjK: 50 + Math.random() * 10 - 5,
    kdjD: 50 + Math.random() * 10 - 5,
    kdjJ: 50 + Math.random() * 10 - 5,
    macdValue: 123 + Math.random() * 100 - 50,
    macdDea: 123 + Math.random() * 100 - 50,
    macdDif: 123 + Math.random() * 100 - 50,
  };

  console.log('Updating last candlestick:', {
    oldClose: lastCandle.close,
    newClose: newClose,
    volume: newVolume,
  });

  updateLastCandlestickCallback(updatedCandle);
};

export const testAddCandlesticksAtTheEnd = (
  klineData: any[],
  showVolumeChart: boolean,
  addCandlesticksAtTheEndCallback: (candles: any[]) => void,
) => {
  if (!addCandlesticksAtTheEndCallback || klineData.length === 0) {
    console.warn('No callback or data available');
    return;
  }

  const lastCandle = klineData[klineData.length - 1];
  const numberOfNewCandles = 1;

  const newCandlesticks: any[] = [];
  for (let i = 1; i <= numberOfNewCandles; i++) {
    const timeIncrement = 60000 * i;
    const basePrice = lastCandle.close;
    const priceVariation = (Math.random() - 0.5) * basePrice * 0.02;

    const open = Math.max(
      0.01,
      basePrice + (Math.random() - 0.5) * basePrice * 0.01,
    );
    const close = Math.max(0.01, basePrice + priceVariation);
    const high =
      Math.max(open, close) + Math.random() * basePrice * 0.005;
    const low =
      Math.min(open, close) - Math.random() * basePrice * 0.005;
    const volume = Math.round(
      lastCandle.vol * (0.5 + Math.random()),
    );

    const tempAllData = [...klineData];
    const currentIndex = tempAllData.length + i - 1;

    let ma5 = close;
    if (currentIndex >= 4) {
      let sum = close;
      for (
        let j = Math.max(0, tempAllData.length - 4 + i - 1);
        j < tempAllData.length;
        j++
      ) {
        sum += tempAllData[j].close;
      }
      ma5 = sum / 5;
    }

    let ma10 = close;
    if (currentIndex >= 9) {
      let sum = close;
      for (
        let j = Math.max(0, tempAllData.length - 9 + i - 1);
        j < tempAllData.length;
        j++
      ) {
        sum += tempAllData[j].close;
      }
      ma10 = sum / 10;
    }

    let ma20 = close;
    if (currentIndex >= 19) {
      let sum = close;
      for (
        let j = Math.max(0, tempAllData.length - 19 + i - 1);
        j < tempAllData.length;
        j++
      ) {
        sum += tempAllData[j].close;
      }
      ma20 = sum / 20;
    }

    const getSafeVolume = (item: any) => {
      const vol = item.vol || item.volume;
      return isNaN(vol) || !isFinite(vol) ? 100000 : vol;
    };

    let volumeMa5 = volume;
    if (currentIndex >= 4) {
      let sum = volume;
      for (
        let j = Math.max(0, tempAllData.length - 4 + i - 1);
        j < tempAllData.length;
        j++
      ) {
        sum += getSafeVolume(tempAllData[j]);
      }
      volumeMa5 = sum / 5;
    }

    let volumeMa10 = volume;
    if (currentIndex >= 9) {
      let sum = volume;
      for (
        let j = Math.max(0, tempAllData.length - 9 + i - 1);
        j < tempAllData.length;
        j++
      ) {
        sum += getSafeVolume(tempAllData[j]);
      }
      volumeMa10 = sum / 10;
    }

    const safeValue = (val: any, fallback = 0) =>
      isNaN(val) || !isFinite(val) ? fallback : val;

    const newCandle = {
      time: lastCandle.time + timeIncrement,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      vol: safeValue(volume, 100000),
      id: lastCandle.time + timeIncrement,
      dateString: formatTime(
        lastCandle.time + timeIncrement,
        'MM-DD HH:mm',
      ),
      maList: [
        {
          title: '5',
          value: safeValue(ma5, close),
          selected: true,
          index: 0,
        },
        {
          title: '10',
          value: safeValue(ma10, close),
          selected: true,
          index: 1,
        },
        {
          title: '20',
          value: safeValue(ma20, close),
          selected: true,
          index: 2,
        },
      ],
      maVolumeList: [
        {
          title: '5',
          value: safeValue(volumeMa5, 100000),
          selected: showVolumeChart,
          index: 0,
        },
        {
          title: '10',
          value: safeValue(volumeMa10, 100000),
          selected: showVolumeChart,
          index: 1,
        },
      ],
      rsiList: lastCandle.rsiList || [],
      wrList: lastCandle.wrList || [],
      selectedItemList: lastCandle.selectedItemList || [],
      bollMb: close * (1 + Math.random() * 0.06 - 0.03),
      bollUp: close * (1 + Math.random() * 0.06 - 0.03),
      bollDn: close * (1 + Math.random() * 0.06 - 0.03),
      kdjK: 50 + Math.random() * 10 - 5,
      kdjD: 50 + Math.random() * 10 - 5,
      kdjJ: 50 + Math.random() * 10 - 5,
      macdValue: 123 + Math.random() * 100 - 50,
      macdDea: 123 + Math.random() * 100 - 50,
      macdDif: 123 + Math.random() * 100 - 50,
    };

    newCandlesticks.push(newCandle);
  }

  console.log('Adding', numberOfNewCandles, 'new candlesticks at the end');
  addCandlesticksAtTheEndCallback(newCandlesticks);
};

export const testAddCandlesticksAtTheStart = (
  klineData: any[],
  showVolumeChart: boolean,
  firstCandleTime: number,
  addCandlesticksAtTheStartCallback: (candles: any[]) => void,
) => {
  if (!addCandlesticksAtTheStartCallback || klineData.length === 0) {
    console.warn('No callback or data available');
    return;
  }

  const firstCandle = klineData[0];
  const numberOfNewCandles = 200;

  const newCandlesticks: any[] = [];
  const tempAllData = [...klineData];

  for (let i = 0; i < numberOfNewCandles; i++) {
    const minutesBack = numberOfNewCandles - i;
    const timestamp = firstCandleTime - minutesBack * 60 * 1000;

    const basePrice = firstCandle.open;
    const priceVariation1 =
      (Math.random() - 0.5) * basePrice * 0.02;
    const priceVariation2 =
      (Math.random() - 0.5) * basePrice * 0.02;
    const open = Math.max(0.01, basePrice + priceVariation1);
    const close = Math.max(0.01, basePrice + priceVariation2);
    const high =
      Math.max(open, close) + Math.random() * basePrice * 0.005;
    const low =
      Math.min(open, close) - Math.random() * basePrice * 0.005;
    const volume = Math.round(
      firstCandle.vol * (0.5 + Math.random()),
    );

    const currentIndex = numberOfNewCandles - 1 - i;

    const getSafeVolume = (item: any) => {
      const vol = item.vol || item.volume;
      return isNaN(vol) || !isFinite(vol) ? 100000 : vol;
    };

    let volumeMa5 = volume;
    let volumeMa10 = volume;
    let ma5 = close;
    let ma10 = close;
    let ma20 = close;

    const safeValue = (val: any, fallback = 0) =>
      isNaN(val) || !isFinite(val) ? fallback : val;

    const newCandle = {
      time: timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)) - 200,
      vol: safeValue(volume, 100000),
      id: timestamp,
      dateString: formatTime(timestamp, 'MM-DD HH:mm'),
      maList: [
        {
          title: '5',
          value: safeValue(ma5, close),
          selected: true,
          index: 0,
        },
        {
          title: '10',
          value: safeValue(ma10, close),
          selected: true,
          index: 1,
        },
        {
          title: '20',
          value: safeValue(ma20, close),
          selected: true,
          index: 2,
        },
      ],
      maVolumeList: [
        {
          title: '5',
          value: safeValue(volumeMa5, 100000),
          selected: showVolumeChart,
          index: 0,
        },
        {
          title: '10',
          value: safeValue(volumeMa10, 100000),
          selected: showVolumeChart,
          index: 1,
        },
      ],
      rsiList: firstCandle.rsiList || [],
      wrList: firstCandle.wrList || [],
      selectedItemList: firstCandle.selectedItemList || [],
      bollMb: close * (1 + Math.random() * 0.06 - 0.03),
      bollUp: close * (1 + Math.random() * 0.06 - 0.03),
      bollDn: close * (1 + Math.random() * 0.06 - 0.03),
      kdjK: 50 + Math.random() * 10 - 5,
      kdjD: 50 + Math.random() * 10 - 5,
      kdjJ: 50 + Math.random() * 10 - 5,
      macdValue: 123 + Math.random() * 100 - 50,
      macdDea: 123 + Math.random() * 100 - 50,
      macdDif: 123 + Math.random() * 100 - 50,
    };

    newCandlesticks.push(newCandle);
  }

  console.log('Adding', numberOfNewCandles, 'new candlesticks at the start:');
  console.log('First historical candle (oldest):', newCandlesticks[0]);
  console.log(
    'Last historical candle (newest):',
    newCandlesticks[newCandlesticks.length - 1],
  );
  console.log('Previous first candle:', firstCandle);
  console.log('Timestamp comparison:');
  console.log(
    '  Historical oldest:',
    new Date(newCandlesticks[0].time).toLocaleString(),
  );
  console.log(
    '  Historical newest:',
    new Date(
      newCandlesticks[newCandlesticks.length - 1].time,
    ).toLocaleString(),
  );
  console.log(
    '  Previous first:',
    new Date(firstCandle.time).toLocaleString(),
  );

  addCandlesticksAtTheStartCallback(newCandlesticks);
};


