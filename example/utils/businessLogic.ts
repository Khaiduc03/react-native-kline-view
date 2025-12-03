/**
 * Business Logic Functions
 * Core data processing and business logic for K-line chart application
 */

import { Platform, PixelRatio, processColor } from 'react-native';
import {
  calculateBOLL,
  calculateMACD,
  calculateKDJ,
  calculateMAWithConfig,
  calculateVolumeMAWithConfig,
  calculateRSIWithConfig,
  calculateWRWithConfig,
} from './indicators';
import { ThemeManager, COLOR } from './themes';
import { TimeTypes, DrawStateConstants, FORMAT } from './constants';
import { fixRound, formatTime, isHorizontalScreen } from './helpers';
import type {
  KLineModel,
  TargetListConfig,
  OptionListObject,
  DrawListConfig,
  ConfigListConfig,
} from 'react-native-kline-view';

type SelectedIndicators = {
  selectedMainIndicator: number;
  selectedSubIndicator: number;
  showVolumeChart: boolean;
};

type TargetListWithHelpers = TargetListConfig & {
  isMASelected: () => boolean;
  isBOLLSelected: () => boolean;
  isMACDSelected: () => boolean;
  isKDJSelected: () => boolean;
  isRSISelected: () => boolean;
  isWRSelected: () => boolean;
};

type InputKLinePoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  vol?: number;
  volume?: number;
};

type PackOptionListParams = {
  isDarkTheme: boolean;
  selectedTimeType: number;
  selectedMainIndicator: number;
  selectedSubIndicator: number;
  selectedDrawTool: number;
  showVolumeChart: boolean;
  candleCornerRadius: number;
  drawShouldContinue: boolean;
};

const pc = (value: Parameters<typeof processColor>[0]): number =>
  (processColor(value) ?? 0) as number;

export const getTargetList = (
  selectedIndicators: SelectedIndicators,
): TargetListWithHelpers => {
  const { selectedMainIndicator, selectedSubIndicator, showVolumeChart } =
    selectedIndicators;

  // Indicator judgment helper functions
  const isMASelected = () => selectedMainIndicator === 1;
  const isBOLLSelected = () => selectedMainIndicator === 2;
  const isMACDSelected = () => selectedSubIndicator === 3;
  const isKDJSelected = () => selectedSubIndicator === 4;
  const isRSISelected = () => selectedSubIndicator === 5;
  const isWRSelected = () => selectedSubIndicator === 6;

  const targetList: TargetListWithHelpers = {
    maList: [
      { title: '5', selected: isMASelected(), index: 0 },
      { title: '10', selected: isMASelected(), index: 1 },
      { title: '20', selected: isMASelected(), index: 2 },
    ],
    maVolumeList: [
      { title: '5', selected: showVolumeChart, index: 0 },
      { title: '10', selected: showVolumeChart, index: 1 },
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
      { title: '6', selected: isRSISelected(), index: 0 },
      { title: '12', selected: isRSISelected(), index: 1 },
      { title: '24', selected: isRSISelected(), index: 2 },
    ],
    wrList: [{ title: '14', selected: isWRSelected(), index: 0 }],
    // Helper functions for external use
    isMASelected,
    isBOLLSelected,
    isMACDSelected,
    isKDJSelected,
    isRSISelected,
    isWRSelected,
  };

  return targetList;
};

/**
 * Calculate technical indicators based on target configuration
 */
export const calculateIndicatorsFromTargetList = (
  data: KLineModel[],
  targetList: TargetListWithHelpers,
  showVolumeChart: boolean,
): KLineModel[] => {
  let processedData = [...data];

  // Calculate MA indicator
  const selectedMAPeriods = targetList.maList
    .filter(item => item.selected)
    .map(item => ({
      period: parseInt(item.title, 10),
      index: item.index,
    }));

  if (selectedMAPeriods.length > 0) {
    processedData = calculateMAWithConfig(processedData, selectedMAPeriods);
  }

  // Calculate volume MA indicator
  const selectedVolumeMAPeriods = targetList.maVolumeList
    .filter(item => item.selected)
    .map(item => ({
      period: parseInt(item.title, 10),
      index: item.index,
    }));

  if (selectedVolumeMAPeriods.length > 0 && showVolumeChart) {
    processedData = calculateVolumeMAWithConfig(
      processedData,
      selectedVolumeMAPeriods,
    );
  }

  // Calculate BOLL indicator
  if (targetList.isBOLLSelected()) {
    processedData = calculateBOLL(
      processedData,
      parseInt(targetList.bollN, 10),
      parseInt(targetList.bollP, 10),
    );
  }

  // Calculate MACD indicator
  if (targetList.isMACDSelected()) {
    processedData = calculateMACD(
      processedData,
      parseInt(targetList.macdS, 10),
      parseInt(targetList.macdL, 10),
      parseInt(targetList.macdM, 10),
    );
  }

  // Calculate KDJ indicator
  if (targetList.isKDJSelected()) {
    processedData = calculateKDJ(
      processedData,
      parseInt(targetList.kdjN, 10),
      parseInt(targetList.kdjM1, 10),
      parseInt(targetList.kdjM2, 10),
    );
  }

  // Calculate RSI indicator
  const selectedRSIPeriods = targetList.rsiList
    .filter(item => item.selected)
    .map(item => ({
      period: parseInt(item.title, 10),
      index: item.index,
    }));

  if (selectedRSIPeriods.length > 0) {
    processedData = calculateRSIWithConfig(processedData, selectedRSIPeriods);
  }

  // Calculate WR indicator
  const selectedWRPeriods = targetList.wrList
    .filter(item => item.selected)
    .map(item => ({
      period: parseInt(item.title, 10),
      index: item.index,
    }));

  if (selectedWRPeriods.length > 0) {
    processedData = calculateWRWithConfig(processedData, selectedWRPeriods);
  }

  return processedData;
};

/**
 * Add technical indicators to selected item list
 */
export const addIndicatorToSelectedList = (
  item: KLineModel,
  targetList: TargetListWithHelpers,
  priceCount: number,
) => {
  if (!item.selectedItemList) {
    item.selectedItemList = [];
  }
  const selectedList = item.selectedItemList;

  // Add MA indicator display
  if (targetList.isMASelected() && item.maList) {
    item.maList.forEach(ma => {
      if (ma && ma.value != null) {
        selectedList.push({
          title: `MA${ma.title}`,
          detail: fixRound(ma.value, priceCount, true, false),
        });
      }
    });
  }

  // Add BOLL indicator display
  if (targetList.isBOLLSelected() && item.bollMb != null) {
    selectedList.push(
      {
        title: 'BOLL-MB',
        detail: fixRound(item.bollMb, priceCount, true, false),
      },
      {
        title: 'BOLL-UP',
        detail: fixRound(item.bollUp, priceCount, true, false),
      },
      {
        title: 'BOLL-DN',
        detail: fixRound(item.bollDn, priceCount, true, false),
      },
    );
  }

  // Add MACD indicator display
  if (targetList.isMACDSelected() && item.macdValue != null) {
    selectedList.push(
      { title: 'MACD', detail: fixRound(item.macdValue, 4, true, false) },
      { title: 'DEA', detail: fixRound(item.macdDea, 4, true, false) },
      { title: 'DIF', detail: fixRound(item.macdDif, 4, true, false) },
    );
  }

  // Add KDJ indicator display
  if (targetList.isKDJSelected() && item.kdjK != null) {
    selectedList.push(
      { title: 'K', detail: fixRound(item.kdjK, 2, true, false) },
      { title: 'D', detail: fixRound(item.kdjD, 2, true, false) },
      { title: 'J', detail: fixRound(item.kdjJ, 2, true, false) },
    );
  }

  // Add RSI indicator display
  if (targetList.isRSISelected() && item.rsiList) {
    item.rsiList.forEach(rsi => {
      if (rsi && rsi.value != null) {
        selectedList.push({
          title: `RSI${rsi.title}`,
          detail: fixRound(rsi.value, 2, true, false),
        });
      }
    });
  }

  // Add WR indicator display
  if (targetList.isWRSelected() && item.wrList) {
    item.wrList.forEach(wr => {
      if (wr && wr.value != null) {
        selectedList.push({
          title: `WR${wr.title}`,
          detail: fixRound(wr.value, 2, true, false),
        });
      }
    });
  }
};

/**
 * Process K-line data, add technical indicator calculations
 */
export const processKLineData = (
  rawData: InputKLinePoint[],
  selectedIndicators: SelectedIndicators,
  isDarkTheme: boolean,
): KLineModel[] => {
  // Simulate symbol configuration
  const symbol = {
    price: 2, // Price precision
    volume: 0, // Volume precision
  };
  const priceCount = symbol.price;
  const volumeCount = symbol.volume;

  // Get target configuration
  const targetList = getTargetList(selectedIndicators);

  // Calculate all technical indicators
  let processedData: KLineModel[] = rawData.map(item => ({
    ...item,
    id: item.time,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    vol: item.vol ?? item.volume ?? 0, // Use vol field, fallback to volume for compatibility
  }));

  // Calculate technical indicators based on targetList configuration
  processedData = calculateIndicatorsFromTargetList(
    processedData,
    targetList,
    selectedIndicators.showVolumeChart,
  );

  return processedData.map(item => {
    // Time formatting
    const time = formatTime(item.id, 'MM-DD HH:mm');

    // Calculate price change amount and percentage
    const appendValue = item.close - item.open;
    const appendPercent = (appendValue / item.open) * 100;
    const isAppend = appendValue >= 0;
    const prefixString = isAppend ? '+' : '-';
    const appendValueString =
      prefixString + fixRound(Math.abs(appendValue), priceCount, true, false);
    const appendPercentString =
      prefixString + fixRound(Math.abs(appendPercent), 2, true, false) + '%';

    // Color configuration
    const theme = ThemeManager.getCurrentTheme(isDarkTheme);
    const color = isAppend ? pc(theme.increaseColor) : pc(theme.decreaseColor);

    // Add formatted fields
    item.dateString = `${time}`;
    item.selectedItemList = [
      { title: FORMAT('Time'), detail: `${time}` },
      {
        title: FORMAT('Open'),
        detail: fixRound(item.open, priceCount, true, false),
      },
      {
        title: FORMAT('High'),
        detail: fixRound(item.high, priceCount, true, false),
      },
      {
        title: FORMAT('Low'),
        detail: fixRound(item.low, priceCount, true, false),
      },
      {
        title: FORMAT('Close'),
        detail: fixRound(item.close, priceCount, true, false),
      },
      { title: FORMAT('Change'), detail: appendValueString, color },
      { title: FORMAT('Change %'), detail: appendPercentString, color },
      {
        title: FORMAT('Volume'),
        detail: fixRound(item.vol, volumeCount, true, false),
      },
    ];

    // Add technical indicator display info to selectedItemList
    addIndicatorToSelectedList(item, targetList, priceCount);

    return item;
  });
};

/**
 * Pack option list for chart configuration
 */
export const packOptionList = (
  modelArray: KLineModel[],
  appState: PackOptionListParams,
  shouldScrollToEnd = true,
  useImperativeApi = false,
): OptionListObject => {
  const {
    isDarkTheme,
    selectedTimeType,
    selectedMainIndicator,
    selectedSubIndicator,
    selectedDrawTool,
    showVolumeChart,
    candleCornerRadius,
    drawShouldContinue,
  } = appState;

  const theme = ThemeManager.getCurrentTheme(isDarkTheme);

  // Basic configuration
  const pixelRatio = Platform.select({
    android: PixelRatio.get(),
    ios: 1,
  }) as number;

  const configList: ConfigListConfig = {
    colorList: {
      increaseColor: pc(theme.increaseColor),
      decreaseColor: pc(theme.decreaseColor),
    },
    targetColorList: [
      pc(COLOR(0.96, 0.86, 0.58)),
      pc(COLOR(0.38, 0.82, 0.75)),
      pc(COLOR(0.8, 0.57, 1)),
      pc(COLOR(1, 0.23, 0.24)),
      pc(COLOR(0.44, 0.82, 0.03)),
      pc(COLOR(0.44, 0.13, 1)),
    ],
    minuteLineColor: pc(theme.minuteLineColor),
    minuteGradientColorList: [
      pc(COLOR(0.094117647, 0.341176471, 0.831372549, 0.149019608)), // 15% transparent blue
      pc(COLOR(0.266666667, 0.501960784, 0.97254902, 0.149019608)), // 26% transparent blue
      pc(COLOR(0.074509804, 0.121568627, 0.188235294, 0)), // Fully transparent
      pc(COLOR(0.074509804, 0.121568627, 0.188235294, 0)), // Fully transparent
    ],
    minuteGradientLocationList: [0, 0.3, 0.6, 1],
    backgroundColor: pc(theme.backgroundColor),
    textColor: pc(theme.detailColor),
    gridColor: pc(theme.gridColor),
    candleTextColor: pc(theme.titleColor),
    panelBackgroundColor: pc(
      isDarkTheme ? COLOR(0.03, 0.09, 0.14, 0.9) : COLOR(1, 1, 1, 0.95),
    ), // 95% transparency
    panelBorderColor: pc(theme.detailColor),
    panelTextColor: pc(theme.titleColor),
    selectedPointContainerColor: pc('transparent'),
    selectedPointContentColor: pc(isDarkTheme ? theme.titleColor : 'white'),
    closePriceCenterBackgroundColor: pc(theme.backgroundColor9703),
    closePriceCenterBorderColor: pc(theme.textColor7724),
    closePriceCenterTriangleColor: pc(theme.textColor7724),
    closePriceCenterSeparatorColor: pc(theme.detailColor),
    closePriceRightBackgroundColor: pc(theme.backgroundColor),
    closePriceRightSeparatorColor: pc(theme.backgroundColorBlue),
    closePriceRightLightLottieFloder: 'images',
    closePriceRightLightLottieScale: 0.4,
    panelGradientColorList: isDarkTheme
      ? [
          pc(COLOR(0.0588235, 0.101961, 0.160784, 0.2)),
          pc(COLOR(0.811765, 0.827451, 0.913725, 0.101961)),
          pc(COLOR(0.811765, 0.827451, 0.913725, 0.2)),
          pc(COLOR(0.811765, 0.827451, 0.913725, 0.101961)),
          pc(COLOR(0.0784314, 0.141176, 0.223529, 0.2)),
        ]
      : [
          pc(COLOR(1, 1, 1, 0)),
          pc(COLOR(0.54902, 0.623529, 0.678431, 0.101961)),
          pc(COLOR(0.54902, 0.623529, 0.678431, 0.25098)),
          pc(COLOR(0.54902, 0.623529, 0.678431, 0.101961)),
          pc(COLOR(1, 1, 1, 0)),
        ],
    panelGradientLocationList: [0, 0.25, 0.5, 0.75, 1],
    mainFlex: showVolumeChart
      ? selectedSubIndicator === 0
        ? isHorizontalScreen
          ? 0.75
          : 0.85
        : 0.6
      : selectedSubIndicator === 0
      ? 1.0
      : 0.75,
    volumeFlex: showVolumeChart ? (isHorizontalScreen ? 0.25 : 0.15) : 0,
    paddingTop: 20 * (pixelRatio ?? 1),
    paddingBottom: 20 * (pixelRatio ?? 1),
    paddingRight: 50 * (pixelRatio ?? 1),
    itemWidth: 8 * (pixelRatio ?? 1),
    candleWidth: 6 * (pixelRatio ?? 1),
    candleCornerRadius: candleCornerRadius * (pixelRatio ?? 1),
    minuteVolumeCandleColor: pc(
      showVolumeChart
        ? COLOR(0.0941176, 0.509804, 0.831373, 0.501961)
        : 'transparent',
    ),
    minuteVolumeCandleWidth: showVolumeChart ? 2 * (pixelRatio ?? 1) : 0,
    macdCandleWidth: 1 * (pixelRatio ?? 1),
    headerTextFontSize: 10 * (pixelRatio ?? 1),
    rightTextFontSize: 10 * (pixelRatio ?? 1),
    candleTextFontSize: 10 * (pixelRatio ?? 1),
    panelTextFontSize: 10 * (pixelRatio ?? 1),
    panelMinWidth: 130 * (pixelRatio ?? 1),
    fontFamily:
      Platform.select({
        ios: 'DINPro-Medium',
        android: '',
      }) ?? '',
    closePriceRightLightLottieSource: '',
  };

  // Use unified target configuration
  const targetList = getTargetList({
    selectedMainIndicator,
    selectedSubIndicator,
    showVolumeChart,
  });

  const drawList: DrawListConfig = {
    shotBackgroundColor: pc(theme.backgroundColor),
    // Basic drawing configuration
    drawType: selectedDrawTool,
    shouldReloadDrawItemIndex: DrawStateConstants.none,
    drawShouldContinue: drawShouldContinue,
    drawColor: pc(COLOR(1, 0.46, 0.05)),
    drawLineHeight: 2,
    drawDashWidth: 4,
    drawDashSpace: 4,
    drawIsLock: false,
    shouldFixDraw: false,
    shouldClearDraw: false,
  };

  return {
    modelArray,
    shouldScrollToEnd,
    targetList,
    price: 2, // Price precision
    volume: 0, // Volume precision
    primary: selectedMainIndicator,
    second: selectedSubIndicator,
    time: TimeTypes[selectedTimeType].value,
    configList,
    drawList,
    useImperativeApi,
  };
};
