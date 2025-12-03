import { PixelRatio, Platform, processColor } from 'react-native';
import { KLineModel, OptionListObject } from 'react-native-kline-view';
import { Theme, ThemeManager, COLOR } from './theme';
import { DrawStateConstants, TimeTypes } from './constants';
import { fixRound, formatTime } from './utils';
import type { AppState } from './KLineChart';

export interface RawKLineItem {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorConfigItem {
  title: string;
  selected: boolean;
  index: number;
}

export interface IndicatorTargetList extends Record<string, unknown> {
  maList: IndicatorConfigItem[];
  maVolumeList: IndicatorConfigItem[];
  bollN: string;
  bollP: string;
  macdS: string;
  macdL: string;
  macdM: string;
  kdjN: string;
  kdjM1: string;
  kdjM2: string;
  rsiList: IndicatorConfigItem[];
  wrList: IndicatorConfigItem[];
}

export function generateMockData(): RawKLineItem[] {
  const data: RawKLineItem[] = [];
  let lastClose = 50000;
  const now = Date.now();
  for (let i = 0; i < 200; i += 1) {
    const time = now - (200 - i) * 15 * 60 * 1000;
    const open = lastClose;
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * open * volatility;
    const close = Math.max(open + change, open * 0.95);
    const maxPrice = Math.max(open, close);
    const minPrice = Math.min(open, close);
    const high = maxPrice + Math.random() * open * 0.01;
    const low = minPrice - Math.random() * open * 0.01;
    const volume = (0.5 + Math.random()) * 1000000;
    data.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Number(volume.toFixed(2)),
    });
    lastClose = close;
  }
  return data;
}

function isMASelected(selectedMainIndicator: number): boolean {
  return selectedMainIndicator === 1;
}

function isBOLLSelected(selectedMainIndicator: number): boolean {
  return selectedMainIndicator === 2;
}

function isMACDSelected(selectedSubIndicator: number): boolean {
  return selectedSubIndicator === 3;
}

function isKDJSelected(selectedSubIndicator: number): boolean {
  return selectedSubIndicator === 4;
}

function isRSISelected(selectedSubIndicator: number): boolean {
  return selectedSubIndicator === 5;
}

function isWRSelected(selectedSubIndicator: number): boolean {
  return selectedSubIndicator === 6;
}

export function getTargetList(
  selectedMainIndicator: number,
  selectedSubIndicator: number,
): IndicatorTargetList {
  return {
    maList: [
      { title: '5', selected: isMASelected(selectedMainIndicator), index: 0 },
      { title: '10', selected: isMASelected(selectedMainIndicator), index: 1 },
      { title: '20', selected: isMASelected(selectedMainIndicator), index: 2 },
    ],
    maVolumeList: [
      { title: '5', selected: true, index: 0 },
      { title: '10', selected: true, index: 1 },
    ],
    bollN: '20',
    bollP: '2',
    macdS: '12',
    macdL: '26',
    macdM: '9',
    kdjN: '9',
    kdjM1: '3',
    kdjM2: '3',
    rsiList: [
      { title: '6', selected: isRSISelected(selectedSubIndicator), index: 0 },
      { title: '12', selected: isRSISelected(selectedSubIndicator), index: 1 },
      { title: '24', selected: isRSISelected(selectedSubIndicator), index: 2 },
    ],
    wrList: [
      { title: '14', selected: isWRSelected(selectedSubIndicator), index: 0 },
    ],
  };
}

function calculateBOLL(
  data: KLineModel[],
  n: number = 20,
  p: number = 2,
): KLineModel[] {
  return data.map((item, index) => {
    if (index < n - 1) {
      return {
        ...item,
        bollMb: item.close,
        bollUp: item.close,
        bollDn: item.close,
      };
    }
    let sum = 0;
    for (let i = index - n + 1; i <= index; i += 1) {
      sum += data[i].close;
    }
    const ma = sum / n;
    let variance = 0;
    for (let i = index - n + 1; i <= index; i += 1) {
      variance += (data[i].close - ma) ** 2;
    }
    const std = Math.sqrt(variance / (n - 1));
    return {
      ...item,
      bollMb: ma,
      bollUp: ma + p * std,
      bollDn: ma - p * std,
    };
  });
}

function calculateMACD(
  data: KLineModel[],
  s: number = 12,
  l: number = 26,
  m: number = 9,
): KLineModel[] {
  if (data.length === 0) {
    return data;
  }
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
}

function calculateKDJ(
  data: KLineModel[],
  n: number = 9,
  m1: number = 3,
  m2: number = 3,
): KLineModel[] {
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
    const startIndex = Math.max(0, index - n + 1);
    let highest = -Infinity;
    let lowest = Infinity;
    for (let i = startIndex; i <= index; i += 1) {
      highest = Math.max(highest, data[i].high);
      lowest = Math.min(lowest, data[i].low);
    }
    const rsv =
      highest === lowest
        ? 50
        : ((item.close - lowest) / (highest - lowest)) * 100;
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
}

function calculateMAWithConfig(
  data: KLineModel[],
  periodConfigs: Array<{ period: number; index: number }>,
): KLineModel[] {
  return data.map((item, index) => {
    const maList: Array<{ value: number; title: string; index: number }> =
      new Array(3);
    periodConfigs.forEach(config => {
      if (index < config.period - 1) {
        maList[config.index] = {
          value: item.close,
          title: `${config.period}`,
          index: config.index,
        };
      } else {
        let sum = 0;
        for (let i = index - config.period + 1; i <= index; i += 1) {
          sum += data[i].close;
        }
        maList[config.index] = {
          value: sum / config.period,
          title: `${config.period}`,
          index: config.index,
        };
      }
    });
    return { ...item, maList };
  });
}

function calculateVolumeMAWithConfig(
  data: KLineModel[],
  periodConfigs: Array<{ period: number; index: number }>,
): KLineModel[] {
  return data.map((item, index) => {
    const maVolumeList: Array<{ value: number; title: string; index: number }> =
      new Array(2);
    periodConfigs.forEach(config => {
      if (index < config.period - 1) {
        maVolumeList[config.index] = {
          value: item.vol,
          title: `${config.period}`,
          index: config.index,
        };
      } else {
        let sum = 0;
        for (let i = index - config.period + 1; i <= index; i += 1) {
          sum += data[i].vol;
        }
        maVolumeList[config.index] = {
          value: sum / config.period,
          title: `${config.period}`,
          index: config.index,
        };
      }
    });
    return { ...item, maVolumeList };
  });
}

function calculateRSIWithConfig(
  data: KLineModel[],
  periodConfigs: Array<{ period: number; index: number }>,
): KLineModel[] {
  return data.map((item, index) => {
    const rsiList: Array<{ value: number; index: number; title: string }> =
      new Array(3);
    if (index === 0) {
      periodConfigs.forEach(config => {
        rsiList[config.index] = {
          value: 50,
          index: config.index,
          title: `${config.period}`,
        };
      });
      return { ...item, rsiList };
    }
    periodConfigs.forEach(config => {
      if (index < config.period) {
        rsiList[config.index] = {
          value: 50,
          index: config.index,
          title: `${config.period}`,
        };
        return;
      }
      let gains = 0;
      let losses = 0;
      for (let i = index - config.period + 1; i <= index; i += 1) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) {
          gains += change;
        } else {
          losses += Math.abs(change);
        }
      }
      const avgGain = gains / config.period;
      const avgLoss = losses / config.period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      rsiList[config.index] = {
        value: rsi,
        index: config.index,
        title: `${config.period}`,
      };
    });
    return { ...item, rsiList };
  });
}

function calculateWRWithConfig(
  data: KLineModel[],
  periodConfigs: Array<{ period: number; index: number }>,
): KLineModel[] {
  return data.map((item, index) => {
    const wrList: Array<{ value: number; index: number; title: string }> =
      new Array(1);
    periodConfigs.forEach(config => {
      if (index < config.period - 1) {
        wrList[config.index] = {
          value: -50,
          index: config.index,
          title: `${config.period}`,
        };
        return;
      }
      let highest = -Infinity;
      let lowest = Infinity;
      for (let i = index - config.period + 1; i <= index; i += 1) {
        highest = Math.max(highest, data[i].high);
        lowest = Math.min(lowest, data[i].low);
      }
      const wr =
        highest === lowest
          ? -50
          : -((highest - item.close) / (highest - lowest)) * 100;
      wrList[config.index] = {
        value: wr,
        index: config.index,
        title: `${config.period}`,
      };
    });
    return { ...item, wrList };
  });
}

function addIndicatorToSelectedList(
  item: KLineModel,
  selectedMainIndicator: number,
  selectedSubIndicator: number,
): void {
  if (!item.selectedItemList) {
    item.selectedItemList = [];
  }
  const priceCount = 2;

  if (isMASelected(selectedMainIndicator) && item.maList) {
    item.maList.forEach(maItem => {
      if (maItem && maItem.title) {
        item.selectedItemList?.push({
          title: `MA${maItem.title}`,
          detail: fixRound(maItem.value, priceCount, false, false),
        });
      }
    });
  }

  if (isBOLLSelected(selectedMainIndicator) && item.bollMb !== undefined) {
    item.selectedItemList.push(
      {
        title: 'BOLL上',
        detail: fixRound(item.bollUp ?? 0, priceCount, false, false),
      },
      {
        title: 'BOLL中',
        detail: fixRound(item.bollMb, priceCount, false, false),
      },
      {
        title: 'BOLL下',
        detail: fixRound(item.bollDn ?? 0, priceCount, false, false),
      },
    );
  }

  if (isMACDSelected(selectedSubIndicator) && item.macdDif !== undefined) {
    item.selectedItemList.push(
      { title: 'DIF', detail: fixRound(item.macdDif, 4, false, false) },
      { title: 'DEA', detail: fixRound(item.macdDea ?? 0, 4, false, false) },
      { title: 'MACD', detail: fixRound(item.macdValue ?? 0, 4, false, false) },
    );
  }

  if (isKDJSelected(selectedSubIndicator) && item.kdjK !== undefined) {
    item.selectedItemList.push(
      { title: 'K', detail: fixRound(item.kdjK, 2, false, false) },
      { title: 'D', detail: fixRound(item.kdjD ?? 0, 2, false, false) },
      { title: 'J', detail: fixRound(item.kdjJ ?? 0, 2, false, false) },
    );
  }

  if (isRSISelected(selectedSubIndicator) && item.rsiList) {
    item.rsiList.forEach(rsiItem => {
      if (rsiItem && rsiItem.title) {
        item.selectedItemList?.push({
          title: `RSI${rsiItem.title}`,
          detail: fixRound(rsiItem.value, 2, false, false),
        });
      }
    });
  }

  if (isWRSelected(selectedSubIndicator) && item.wrList) {
    item.wrList.forEach(wrItem => {
      if (wrItem && wrItem.title) {
        item.selectedItemList?.push({
          title: `WR${wrItem.title}`,
          detail: fixRound(wrItem.value, 2, false, false),
        });
      }
    });
  }
}

export function processKLineData(
  rawData: RawKLineItem[],
  state: AppState,
): KLineModel[] {
  const priceCount = 2;
  const volumeCount = 0;
  const targetList = getTargetList(
    state.selectedMainIndicator,
    state.selectedSubIndicator,
  );

  let processedData: KLineModel[] = rawData.map(item => ({
    id: item.time,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    vol: item.volume,
  }));

  const selectedMAPeriods = targetList.maList
    .filter(item => item.selected)
    .map(item => ({ period: parseInt(item.title, 10), index: item.index }));
  if (selectedMAPeriods.length > 0) {
    processedData = calculateMAWithConfig(processedData, selectedMAPeriods);
  }

  const selectedVolumeMAPeriods = targetList.maVolumeList
    .filter(item => item.selected)
    .map(item => ({ period: parseInt(item.title, 10), index: item.index }));
  if (selectedVolumeMAPeriods.length > 0) {
    processedData = calculateVolumeMAWithConfig(
      processedData,
      selectedVolumeMAPeriods,
    );
  }

  if (isBOLLSelected(state.selectedMainIndicator)) {
    processedData = calculateBOLL(
      processedData,
      parseInt(targetList.bollN, 10),
      parseInt(targetList.bollP, 10),
    );
  }

  if (isMACDSelected(state.selectedSubIndicator)) {
    processedData = calculateMACD(
      processedData,
      parseInt(targetList.macdS, 10),
      parseInt(targetList.macdL, 10),
      parseInt(targetList.macdM, 10),
    );
  }

  if (isKDJSelected(state.selectedSubIndicator)) {
    processedData = calculateKDJ(
      processedData,
      parseInt(targetList.kdjN, 10),
      parseInt(targetList.kdjM1, 10),
      parseInt(targetList.kdjM2, 10),
    );
  }

  const selectedRSIPeriods = targetList.rsiList
    .filter(item => item.selected)
    .map(item => ({ period: parseInt(item.title, 10), index: item.index }));
  if (selectedRSIPeriods.length > 0) {
    processedData = calculateRSIWithConfig(processedData, selectedRSIPeriods);
  }

  const selectedWRPeriods = targetList.wrList
    .filter(item => item.selected)
    .map(item => ({ period: parseInt(item.title, 10), index: item.index }));
  if (selectedWRPeriods.length > 0) {
    processedData = calculateWRWithConfig(processedData, selectedWRPeriods);
  }

  return processedData.map(item => {
    const time = formatTime(item.id, 'MM-DD HH:mm');
    const appendValue = item.close - item.open;
    const appendPercent = (appendValue / item.open) * 100;
    const isAppend = appendValue >= 0;
    const prefixString = isAppend ? '+' : '-';
    const appendValueString = `${prefixString}${fixRound(
      Math.abs(appendValue),
      priceCount,
      true,
      false,
    )}`;
    const appendPercentString = `${prefixString}${fixRound(
      Math.abs(appendPercent),
      2,
      true,
      false,
    )}%`;
    const currentTheme = ThemeManager.getCurrentTheme(state.isDarkTheme);
    const color = (
      isAppend
        ? processColor(currentTheme.increaseColor)
        : processColor(currentTheme.decreaseColor)
    ) as number;

    const selectedItemList: KLineModel['selectedItemList'] = [
      { title: '时间', detail: `${time}` },
      {
        title: '开',
        detail: fixRound(item.open, priceCount, true, false),
      },
      {
        title: '高',
        detail: fixRound(item.high, priceCount, true, false),
      },
      {
        title: '低',
        detail: fixRound(item.low, priceCount, true, false),
      },
      {
        title: '收',
        detail: fixRound(item.close, priceCount, true, false),
      },
      { title: '涨跌额', detail: appendValueString, color },
      { title: '涨跌幅', detail: appendPercentString, color },
      {
        title: '成交量',
        detail: fixRound(item.vol, volumeCount, true, false),
      },
    ];

    const extended: KLineModel = {
      ...item,
      dateString: time,
      selectedItemList,
    };

    addIndicatorToSelectedList(
      extended,
      state.selectedMainIndicator,
      state.selectedSubIndicator,
    );

    return extended;
  });
}

export function packOptionList(
  modelArray: KLineModel[],
  state: AppState,
  theme: Theme,
): OptionListObject {
  const isHorizontalScreen = false; // actual ratio is handled in component; here we just keep logic consistent

  const pixelRatio = Platform.select({
    android: PixelRatio.get(),
    ios: 1,
    default: 1,
  }) as number;

  const configList: OptionListObject['configList'] = {
    colorList: {
      increaseColor: processColor(theme.increaseColor) as number,
      decreaseColor: processColor(theme.decreaseColor) as number,
    },
    targetColorList: [
      processColor(COLOR(0.96, 0.86, 0.58)) as number,
      processColor(COLOR(0.38, 0.82, 0.75)) as number,
      processColor(COLOR(0.8, 0.57, 1)) as number,
      processColor(COLOR(1, 0.23, 0.24)) as number,
      processColor(COLOR(0.44, 0.82, 0.03)) as number,
      processColor(COLOR(0.44, 0.13, 1)) as number,
    ],
    minuteLineColor: processColor(theme.minuteLineColor) as number,
    minuteGradientColorList: [
      processColor(
        COLOR(0.094117647, 0.341176471, 0.831372549, 0.149019608),
      ) as number,
      processColor(
        COLOR(0.266666667, 0.501960784, 0.97254902, 0.149019608),
      ) as number,
      processColor(COLOR(0.074509804, 0.121568627, 0.188235294, 0)) as number,
      processColor(COLOR(0.074509804, 0.121568627, 0.188235294, 0)) as number,
    ],
    minuteGradientLocationList: [0, 0.3, 0.6, 1],
    backgroundColor: processColor(theme.backgroundColor) as number,
    textColor: processColor(theme.detailColor) as number,
    gridColor: processColor(theme.gridColor) as number,
    candleTextColor: processColor(theme.titleColor) as number,
    panelBackgroundColor: processColor(
      state.isDarkTheme ? COLOR(0.03, 0.09, 0.14, 0.9) : COLOR(1, 1, 1, 0.95),
    ) as number,
    panelBorderColor: processColor(theme.detailColor) as number,
    panelMinWidth: 130 * pixelRatio,
    mainFlex:
      state.selectedSubIndicator === 0
        ? isHorizontalScreen
          ? 0.75
          : 0.85
        : 0.6,
    volumeFlex: isHorizontalScreen ? 0.25 : 0.15,
    paddingTop: 20 * pixelRatio,
    paddingBottom: 20 * pixelRatio,
    paddingRight: 50 * pixelRatio,
    itemWidth: 8 * pixelRatio,
    candleWidth: 6 * pixelRatio,
    candleCornerRadius: 0,
    minuteVolumeCandleColor: processColor(
      COLOR(0.0941176, 0.509804, 0.831373, 0.501961),
    ) as number,
    minuteVolumeCandleWidth: 2 * pixelRatio,
    macdCandleWidth: 1 * pixelRatio,
    headerTextFontSize: 10 * pixelRatio,
    rightTextFontSize: 10 * pixelRatio,
    candleTextFontSize: 10 * pixelRatio,
    panelTextFontSize: 10 * pixelRatio,
    fontFamily: Platform.select({
      ios: 'DINPro-Medium',
      android: '',
      default: '',
    }) as string,
    panelGradientColorList: state.isDarkTheme
      ? [
          processColor(COLOR(0.0588235, 0.101961, 0.160784, 0.2)) as number,
          processColor(COLOR(0.811765, 0.827451, 0.913725, 0.101961)) as number,
          processColor(COLOR(0.811765, 0.827451, 0.913725, 0.2)) as number,
          processColor(COLOR(0.811765, 0.827451, 0.913725, 0.101961)) as number,
          processColor(COLOR(0.0784314, 0.141176, 0.223529, 0.2)) as number,
        ]
      : [
          processColor(COLOR(1, 1, 1, 0)) as number,
          processColor(COLOR(0.54902, 0.623529, 0.678431, 0.101961)) as number,
          processColor(COLOR(0.54902, 0.623529, 0.678431, 0.25098)) as number,
          processColor(COLOR(0.54902, 0.623529, 0.678431, 0.101961)) as number,
          processColor(COLOR(1, 1, 1, 0)) as number,
        ],
    panelGradientLocationList: [0, 0.25, 0.5, 0.75, 1],
    closePriceCenterBackgroundColor: processColor(
      theme.backgroundColor9703,
    ) as number,
    closePriceCenterBorderColor: processColor(theme.textColor7724) as number,
    closePriceCenterTriangleColor: processColor(theme.textColor7724) as number,
    closePriceCenterSeparatorColor: processColor(theme.detailColor) as number,
    closePriceRightBackgroundColor: processColor(
      theme.backgroundColor,
    ) as number,
    closePriceRightSeparatorColor: processColor(
      theme.backgroundColorBlue,
    ) as number,
    closePriceRightLightLottieFloder: 'images',
    closePriceRightLightLottieScale: 0.4,
    closePriceRightLightLottieSource: '',
  };

  const targetList = getTargetList(
    state.selectedMainIndicator,
    state.selectedSubIndicator,
  );

  const drawList: OptionListObject['drawList'] = {
    shotBackgroundColor: processColor(theme.backgroundColor) as number,
    drawType: state.selectedDrawTool,
    shouldReloadDrawItemIndex: DrawStateConstants.none,
    drawShouldContinue: state.drawShouldContinue,
    drawColor: processColor(COLOR(1, 0.46, 0.05)) as number,
    drawLineHeight: 2,
    drawDashWidth: 4,
    drawDashSpace: 4,
    drawIsLock: false,
    shouldFixDraw: false,
    shouldClearDraw: false,
  };

  return {
    modelArray,
    shouldScrollToEnd: true,
    targetList,
    price: 2,
    volume: 0,
    primary: state.selectedMainIndicator,
    second: state.selectedSubIndicator,
    time: TimeTypes[state.selectedTimeType].value,
    configList,
    drawList,
  };
}
