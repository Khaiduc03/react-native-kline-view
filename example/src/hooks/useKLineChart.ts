import { useState, useCallback, useEffect } from 'react';
import { processColor } from 'react-native';
import { AppState, KLineData, HTKLineItemModel } from '../types';
import {
  ThemeManager,
  DrawTypeConstants,
  DrawStateConstants,
} from '../constants';
import {
  generateMockData,
  calculateBOLL,
  calculateMACD,
  calculateKDJ,
  calculateRSI,
  calculateWR,
  formatTime,
  fixRound,
  FORMAT,
} from '../utils';

export const useKLineChart = () => {
  const [state, setState] = useState<AppState>({
    isDarkTheme: false,
    selectedTimeType: 2, // Corresponds to 1 minute
    selectedMainIndicator: 1, // Corresponds to MA
    selectedSubIndicator: 3, // Corresponds to MACD
    selectedDrawTool: DrawTypeConstants.none,
    showIndicatorSelector: false,
    showTimeSelector: false,
    showDrawToolSelector: false,
    klineData: generateMockData(),
    drawShouldContinue: true,
    optionList: null,
  });

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setState(prev => ({ ...prev, isDarkTheme: !prev.isDarkTheme }));
  }, []);

  // Select time period
  const selectTimeType = useCallback((timeType: number) => {
    setState(prev => ({
      ...prev,
      selectedTimeType: timeType,
      showTimeSelector: false,
    }));
  }, []);

  // Select indicator
  const selectIndicator = useCallback(
    (type: 'main' | 'sub', indicator: number) => {
      if (type === 'main') {
        setState(prev => ({ ...prev, selectedMainIndicator: indicator }));
      } else {
        setState(prev => ({ ...prev, selectedSubIndicator: indicator }));
      }
      setState(prev => ({ ...prev, showIndicatorSelector: false }));
    },
    [],
  );

  // Select drawing tool
  const selectDrawTool = useCallback((tool: number) => {
    setState(prev => ({
      ...prev,
      selectedDrawTool: tool,
      showDrawToolSelector: false,
    }));
  }, []);

  // Clear drawings
  const clearDrawings = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedDrawTool: DrawTypeConstants.none,
    }));
  }, []);

  // Toggle draw continue
  const toggleDrawContinue = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, drawShouldContinue: value }));
  }, []);

  // Show selectors
  const showTimeSelector = useCallback(() => {
    setState(prev => ({
      ...prev,
      showTimeSelector: true,
      showIndicatorSelector: false,
      showDrawToolSelector: false,
    }));
  }, []);

  const showIndicatorSelector = useCallback(() => {
    setState(prev => ({
      ...prev,
      showIndicatorSelector: true,
      showTimeSelector: false,
      showDrawToolSelector: false,
    }));
  }, []);

  const showDrawToolSelector = useCallback(() => {
    setState(prev => ({
      ...prev,
      showDrawToolSelector: !prev.showDrawToolSelector,
      showIndicatorSelector: false,
      showTimeSelector: false,
    }));
  }, []);

  // Close selectors
  const closeSelectors = useCallback(() => {
    setState(prev => ({
      ...prev,
      showTimeSelector: false,
      showIndicatorSelector: false,
      showDrawToolSelector: false,
    }));
  }, []);

  // Process K-line data, add technical indicator calculations
  const processKLineData = useCallback(
    (rawData: KLineData[]): KLineData[] => {
      // Mock symbol configuration
      const symbol = {
        price: 2, // Price precision
        volume: 0, // Volume precision
      };
      const priceCount = symbol.price;
      const volumeCount = symbol.volume;

      // Get target configuration
      const targetList = getTargetList();

      // Calculate all technical indicators
      let processedData = rawData.map(item => ({
        ...item,
        id: item.id,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        vol: item.volume,
        volume: item.volume,
      })) as any[];

      // Calculate technical indicators based on targetList configuration
      processedData = calculateIndicatorsFromTargetList(
        processedData as any,
        targetList,
      );

      return processedData.map((item, index) => {
        // Time formatting
        let time = formatTime(item.id, 'MM-DD HH:mm');

        // Calculate price change amount and percentage
        let appendValue = item.close - item.open;
        let appendPercent = (appendValue / item.open) * 100;
        let isAppend = appendValue >= 0;
        let prefixString = isAppend ? '+' : '-';
        let appendValueString =
          prefixString +
          fixRound(Math.abs(appendValue), priceCount, true, false);
        let appendPercentString =
          prefixString +
          fixRound(Math.abs(appendPercent), 2, true, false) +
          '%';

        // Color configuration
        const theme = ThemeManager.getCurrentTheme(state.isDarkTheme);
        let color = isAppend
          ? processColor(theme.increaseColor)
          : processColor(theme.decreaseColor);

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
          { title: FORMAT('Change%'), detail: appendPercentString, color },
          {
            title: FORMAT('Volume'),
            detail: fixRound(item.vol, volumeCount, true, false),
          },
        ];

        return item;
      });
    },
    [state.isDarkTheme],
  );

  // Get target list configuration
  const getTargetList = useCallback(() => {
    const maList: HTKLineItemModel[] = [
      { title: 'MA5', value: 5, selected: true, index: 0 },
      { title: 'MA10', value: 10, selected: true, index: 1 },
      { title: 'MA20', value: 20, selected: true, index: 2 },
    ];

    const maVolumeList: HTKLineItemModel[] = [
      { title: 'MA5', value: 5, selected: true, index: 0 },
      { title: 'MA10', value: 10, selected: true, index: 1 },
    ];

    const rsiList: HTKLineItemModel[] = [
      { title: 'RSI6', value: 6, selected: true, index: 0 },
      { title: 'RSI12', value: 12, selected: true, index: 1 },
      { title: 'RSI24', value: 24, selected: true, index: 2 },
    ];

    const wrList: HTKLineItemModel[] = [
      { title: 'WR6', value: 6, selected: true, index: 0 },
      { title: 'WR10', value: 10, selected: true, index: 1 },
    ];

    return {
      maList,
      maVolumeList,
      rsiList,
      wrList,
      bollN: '20',
      bollP: '2',
      macdS: '12',
      macdL: '26',
      macdM: '9',
      kdjN: '9',
      kdjM1: '3',
      kdjM2: '3',
    };
  }, []);

  // Calculate indicators from target list
  const calculateIndicatorsFromTargetList = useCallback(
    (data: KLineData[], targetList: any): KLineData[] => {
      let processedData = [...data];

      // Calculate BOLL
      if (state.selectedMainIndicator === 2) {
        processedData = calculateBOLL(
          processedData,
          parseInt(targetList.bollN),
          parseInt(targetList.bollP),
        );
      }

      // Calculate MACD
      if (state.selectedSubIndicator === 3) {
        processedData = calculateMACD(
          processedData,
          parseInt(targetList.macdS),
          parseInt(targetList.macdL),
          parseInt(targetList.macdM),
        );
      }

      // Calculate KDJ
      if (state.selectedSubIndicator === 4) {
        processedData = calculateKDJ(
          processedData,
          parseInt(targetList.kdjN),
          parseInt(targetList.kdjM1),
          parseInt(targetList.kdjM2),
        );
      }

      // Calculate RSI
      if (state.selectedSubIndicator === 5) {
        processedData = calculateRSI(processedData, 14);
      }

      // Calculate WR
      if (state.selectedSubIndicator === 6) {
        processedData = calculateWR(processedData, 14);
      }

      return processedData;
    },
    [state.selectedMainIndicator, state.selectedSubIndicator],
  );

  // Pack option list
  const packOptionList = useCallback(
    (processedData: KLineData[]) => {
      const theme = ThemeManager.getCurrentTheme(state.isDarkTheme);
      const targetList = getTargetList();

      return {
        modelArray: processedData,
        shouldScrollToEnd: true,
        targetList,
        configList: {
          itemWidth: 9,
          candleWidth: 7,
          paddingTop: 20,
          paddingBottom: 20,
          paddingRight: 20,
          mainFlex: 0.7,
          volumeFlex: 0.2,
          colorList: {
            increaseColor: processColor(theme.increaseColor),
            decreaseColor: processColor(theme.decreaseColor),
          },
          textColor: processColor(theme.textColor),
          backgroundColor: processColor(theme.backgroundColor),
          gridColor: processColor(theme.gridColor),
          candleTextColor: processColor(theme.increaseColor),
          minuteLineColor: processColor(theme.minuteLineColor),
          targetColorList: [
            processColor('#FF6B6B'),
            processColor('#4ECDC4'),
            processColor('#45B7D1'),
            processColor('#96CEB4'),
          ],
          fontFamily: 'Arial',
          headerTextFontSize: 12,
          rightTextFontSize: 10,
          candleTextFontSize: 10,
          panelTextFontSize: 10,
          panelMinWidth: 100,
        },
        drawList: {
          shouldReloadDrawItemIndex:
            state.selectedDrawTool === DrawTypeConstants.none
              ? DrawStateConstants.none
              : DrawStateConstants.showContext,
          drawShouldContinue: state.drawShouldContinue,
          drawType: state.selectedDrawTool,
          shouldFixDraw: false,
          drawColor: processColor('#FF9800'),
          drawLineHeight: 1,
          drawDashWidth: 5,
          drawDashSpace: 3,
          drawIsLock: false,
        },
        primary: state.selectedMainIndicator,
        second: state.selectedSubIndicator,
        time: state.selectedTimeType,
        price: 2,
        volume: 0,
      };
    },
    [state, getTargetList],
  );

  // Reload K-line data
  const reloadKLineData = useCallback(() => {
    const processedData = processKLineData(state.klineData);
    const optionList = packOptionList(processedData);
    setState(prev => ({ ...prev, optionList: JSON.stringify(optionList) }));
  }, [state.klineData, processKLineData, packOptionList]);

  // Event handlers
  const onDrawItemDidTouch = useCallback((event: any) => {
    console.log('Drawing item touched:', event.nativeEvent);
  }, []);

  const onDrawItemComplete = useCallback(
    (event: any) => {
      console.log('Drawing item completed:', event.nativeEvent);
      if (!state.drawShouldContinue) {
        selectDrawTool(DrawTypeConstants.none);
      }
    },
    [state.drawShouldContinue, selectDrawTool],
  );

  const onDrawPointComplete = useCallback((event: any) => {
    console.log('Drawing point completed:', event.nativeEvent.pointCount);
  }, []);

  // Reload data when theme or indicators change
  useEffect(() => {
    reloadKLineData();
  }, [
    state.isDarkTheme,
    state.selectedMainIndicator,
    state.selectedSubIndicator,
    reloadKLineData,
  ]);

  return {
    state,
    toggleTheme,
    selectTimeType,
    selectIndicator,
    selectDrawTool,
    clearDrawings,
    toggleDrawContinue,
    showTimeSelector,
    showIndicatorSelector,
    showDrawToolSelector,
    closeSelectors,
    onDrawItemDidTouch,
    onDrawItemComplete,
    onDrawPointComplete,
  };
};
