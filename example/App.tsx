/**
 * K-line Chart Example Application
 * Supports indicators, finger drawing, theme switching and other features
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  NativeSyntheticEvent,
} from 'react-native';
import RNKLineView, { RNKLineViewRef } from 'react-native-kline-view';
import type { OptionListObject, KLineModel } from 'react-native-kline-view';
import { ThemeManager } from './utils/themes';
import {
  TimeTypes,
  DrawTypeConstants,
  DrawStateConstants,
  DrawToolHelper,
} from './utils/constants';
import { isHorizontalScreen } from './utils/helpers';
import Toolbar from './components/Toolbar';
import ControlBar from './components/ControlBar';
import Selectors from './components/Selectors';
import { processKLineData, packOptionList } from './utils/businessLogic';

import {
  testUpdateLastCandlestick,
  testAddCandlesticksAtTheEnd,
  testAddCandlesticksAtTheStart,
} from './utils/testUtils';

type KlinePoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
  id?: number;
  dateString?: string;
  [key: string]: unknown;
};

type DrawNativeEvent = {
  x?: number;
  y?: number;
  isOnClosePriceLabel?: boolean;
  pointCount?: number;
  closePriceFrame?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  [key: string]: unknown;
};

type DrawEvent = NativeSyntheticEvent<DrawNativeEvent>;

type BinanceKlineTuple = [
  number,
  string,
  string,
  string,
  string,
  string,
  ...unknown[],
];

type OptionListPatch = Partial<OptionListObject> & {
  drawList?: Partial<OptionListObject['drawList']>;
};

const isFullOptionList = (
  value: OptionListObject | OptionListPatch,
): value is OptionListObject => {
  return (
    Array.isArray((value as OptionListObject).modelArray) &&
    typeof (value as OptionListObject).configList === 'object'
  );
};

const mapBinanceKlinesToKlineData = (rawData: unknown): KlinePoint[] => {
  if (!Array.isArray(rawData)) return [];

  return rawData.map(kline => {
    const [openTime, open, high, low, close, volume] =
      kline as BinanceKlineTuple;
    return {
      time: Number(openTime),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      vol: Number(volume),
    };
  });
};

const App: React.FC = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [selectedTimeType, setSelectedTimeType] = useState(2); // Corresponds to 1 minute
  const [selectedMainIndicator, setSelectedMainIndicator] = useState(1); // Corresponds to MA (1=MA, 2=BOLL)
  const [selectedSubIndicator, setSelectedSubIndicator] = useState(4); // Corresponds to KDJ (3=MACD, 4=KDJ, 5=RSI, 6=WR)
  const [selectedDrawTool, setSelectedDrawTool] = useState<number>(
    DrawTypeConstants.none,
  );
  const [showIndicatorSelector, setShowIndicatorSelector] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [showDrawToolSelector, setShowDrawToolSelector] = useState(false);
  const [klineData, setKlineData] = useState<KlinePoint[]>([]);
  const [drawShouldContinue, setDrawShouldContinue] = useState(true);
  const [optionList, setOptionList] = useState<string | undefined>(undefined);
  const [showVolumeChart, setShowVolumeChart] = useState(true);
  const [candleCornerRadius, setCandleCornerRadius] = useState(0);
  const firstCandleTimeRef = useRef<number | null>(null);
  const initialLoadRef = useRef(false);

  const kLineViewRef = useRef<RNKLineViewRef | null>(null);
  const optionListRef = useRef<OptionListObject | null>(null);

  const updateStatusBar = useCallback(() => {
    StatusBar.setBarStyle(isDarkTheme ? 'light-content' : 'dark-content', true);
  }, [isDarkTheme]);

  useEffect(() => {
    updateStatusBar();
  }, [updateStatusBar]);

  useEffect(() => {
    const fetchKlines = async () => {
      try {
        // map selectedTimeType → interval Binance
        const timeToInterval = {
          1: '1m',
          2: '1m',
          3: '3m',
          4: '5m',
          5: '15m',
          6: '30m',
          7: '1h',
          8: '4h',
          9: '6h',
          10: '1d',
          11: '1w',
          12: '1M',
        };
        const interval = timeToInterval[selectedTimeType] || '1m';

        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=500`,
        );
        if (!res.ok) {
          console.warn('Binance klines error', res.status);
          return;
        }
        const raw = await res.json();
        const mapped = mapBinanceKlinesToKlineData(raw);

        if (mapped.length > 0) {
          setKlineData(mapped);
          firstCandleTimeRef.current = mapped[0].time;
          initialLoadRef.current = false;
        }
      } catch (e) {
        console.warn('Failed to load BTC klines', e);
      }
    };

    fetchKlines();
  }, [selectedTimeType]);

  useEffect(() => {
    updateStatusBar();
    if (klineData.length > 0 && initialLoadRef.current) {
      // Initialize loading K-line data
      setTimeout(() => reloadKLineData(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showVolumeChart,
    selectedMainIndicator,
    selectedSubIndicator,
    klineData,
    updateStatusBar,
  ]);

  useEffect(() => {
    updateStatusBar();
  }, [isDarkTheme, updateStatusBar]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setIsDarkTheme(prev => {
      // Reload data after theme switch to apply new colors
      setTimeout(() => reloadKLineData(), 0);
      return !prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Select time period
  const selectTimeType = useCallback((timeType: number) => {
    setSelectedTimeType(timeType);
    setShowTimeSelector(false);
    // Reset initial data loaded flag and regenerate data
    initialLoadRef.current = false;
    // Clear current data; it will be reloaded from Binance in effect
    setKlineData([]);
    console.log('Switch time period:', TimeTypes[timeType]?.label ?? 'Unknown');
  }, []);

  // Select indicator
  const selectIndicator = useCallback(
    (type: 'main' | 'sub', indicator: number) => {
      if (type === 'main') {
        setSelectedMainIndicator(indicator);
      } else {
        setSelectedSubIndicator(indicator);
      }
      setShowIndicatorSelector(false);
      setTimeout(() => reloadKLineData(), 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Set optionList property
  const setOptionListValue = useCallback(
    (nextOptionList: OptionListObject | OptionListPatch) => {
      if (isFullOptionList(nextOptionList)) {
        optionListRef.current = nextOptionList;
      } else if (optionListRef.current) {
        optionListRef.current = {
          ...optionListRef.current,
          ...nextOptionList,
          drawList: nextOptionList.drawList
            ? { ...optionListRef.current.drawList, ...nextOptionList.drawList }
            : optionListRef.current.drawList,
        };
      } else {
        // Without a base option list we cannot apply a patch safely.
        return;
      }

      setOptionList(JSON.stringify(optionListRef.current));
    },
    [],
  );

  // Select drawing tool
  const selectDrawTool = useCallback(
    (tool: number) => {
      setSelectedDrawTool(tool);
      setShowDrawToolSelector(false);
      setOptionListValue({
        drawList: {
          shouldReloadDrawItemIndex:
            tool === DrawTypeConstants.none
              ? DrawStateConstants.none
              : DrawStateConstants.showContext,
          drawShouldContinue: drawShouldContinue,
          drawType: tool,
          shouldFixDraw: false,
        },
      });
    },
    [drawShouldContinue, setOptionListValue],
  );

  // Clear drawings
  const clearDrawings = useCallback(() => {
    setSelectedDrawTool(DrawTypeConstants.none);
    setOptionListValue({
      drawList: {
        shouldReloadDrawItemIndex: DrawStateConstants.none,
        drawType: DrawTypeConstants.none,
        drawShouldContinue,
        shouldClearDraw: true,
      },
    });
  }, [drawShouldContinue, setOptionListValue]);

  // Reload K-line data
  function reloadKLineData(shouldScrollToEnd = true) {
    if (!kLineViewRef.current) {
      setTimeout(() => reloadKLineData(shouldScrollToEnd), 100);
      return;
    }

    const processedData = processKLineData(
      klineData,
      {
        selectedMainIndicator,
        selectedSubIndicator,
        showVolumeChart,
      },
      isDarkTheme,
    );
    const newOptionList = packOptionList(
      processedData,
      {
        isDarkTheme,
        selectedTimeType,
        selectedMainIndicator,
        selectedSubIndicator,
        selectedDrawTool,
        showVolumeChart,
        candleCornerRadius,
        drawShouldContinue,
      },
      shouldScrollToEnd,
      false,
    );
    setOptionListValue(newOptionList);
  }

  // Load data exactly once after fetch completes
  useEffect(() => {
    if (klineData.length > 0 && !initialLoadRef.current) {
      initialLoadRef.current = true;
      reloadKLineData(true);
    }
  }, [klineData]);

  // Reload K-line data and adjust scroll position to maintain current view
  // Helper kept for future use: adjust scroll position when prepending data
  // Currently not used in this example app.
  // function reloadKLineDataWithScrollAdjustment(addedDataCount: number) { ... }

  // Drawing item touch event
  const onDrawItemDidTouch = useCallback((event: DrawEvent) => {
    const { nativeEvent } = event;
    console.log('Drawing item touched:', nativeEvent);
  }, []);

  // Chart touch event
  const onChartTouch = useCallback(
    (event: DrawEvent) => {
      const { nativeEvent } = event;
      console.log('Chart touched:', nativeEvent);

      if (nativeEvent.isOnClosePriceLabel) {
        console.log('🎯 Touched close price label! Scroll to latest position');
        scrollToPresent();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Scroll to latest position
  function scrollToPresent() {
    reloadKLineData(true);
  }

  // Drawing item complete event
  const onDrawItemComplete = useCallback(
    (event: DrawEvent) => {
      const { nativeEvent } = event;
      console.log('Drawing item complete:', nativeEvent);

      // Processing after drawing completion
      if (!drawShouldContinue) {
        selectDrawTool(DrawTypeConstants.none);
      }
    },
    [drawShouldContinue, selectDrawTool],
  );

  // Drawing point complete event
  const onDrawPointComplete = useCallback(
    (event: DrawEvent) => {
      const { nativeEvent } = event;
      console.log('Drawing point complete:', nativeEvent.pointCount);

      // Can display current drawing progress here
      const currentTool = selectedDrawTool;
      const totalPoints = DrawToolHelper.count(currentTool);

      if (totalPoints > 0) {
        const progress = `${nativeEvent.pointCount}/${totalPoints}`;
        console.log(`Drawing progress: ${progress}`);
      }
    },
    [selectedDrawTool],
  );

  const handleTestAddCandlesticksAtTheStart = useCallback(() => {
    console.log('handleTestAddCandlesticksAtTheStart called');
    testAddCandlesticksAtTheStart(
      klineData,
      showVolumeChart,
      firstCandleTimeRef.current ?? klineData[0]?.time ?? Date.now(),
      (candlesticks: KLineModel[]) => {
        kLineViewRef.current?.addCandlesticksAtTheStart(candlesticks);
        firstCandleTimeRef.current =
          (candlesticks[0]?.time as number | undefined) ?? null;
      },
    );
  }, [klineData, showVolumeChart]);

  // Handle new data loading triggered by left swipe
  const handleScrollLeft = useCallback(
    (_event: DrawEvent) => {
      console.log('Loading 200 new historical candlesticks at start');
      handleTestAddCandlesticksAtTheStart();
    },
    [handleTestAddCandlesticksAtTheStart],
  );

  // Wrapper functions for test utilities
  const handleTestUpdateLastCandlestick = useCallback(() => {
    testUpdateLastCandlestick(klineData, showVolumeChart, candlestick => {
      kLineViewRef.current?.updateLastCandlestick(candlestick);
    });
  }, [klineData, showVolumeChart]);

  const handleTestAddCandlesticksAtTheEnd = useCallback(() => {
    testAddCandlesticksAtTheEnd(
      klineData,
      showVolumeChart,
      (candlesticks: KLineModel[]) => {
        kLineViewRef.current?.addCandlesticksAtTheEnd(candlesticks);
      },
    );
  }, [klineData, showVolumeChart]);

  const renderKLineChart = useCallback(
    (styles: ReturnType<typeof getStyles>) => {
      const directRender = (
        <RNKLineView
          ref={kLineViewRef}
          style={styles.chart}
          optionList={optionList}
          onDrawItemDidTouch={onDrawItemDidTouch}
          onScrollLeft={handleScrollLeft}
          onChartTouch={onChartTouch}
          onDrawItemComplete={onDrawItemComplete}
          onDrawPointComplete={onDrawPointComplete}
        />
      );

      return (
        <View style={styles.container}>
          <View style={styles.chartContainer} collapsable={false}>
            {directRender}
          </View>
        </View>
      );
    },
    [
      optionList,
      onDrawItemDidTouch,
      handleScrollLeft,
      onChartTouch,
      onDrawItemComplete,
      onDrawPointComplete,
    ],
  );

  const getStyles = useCallback(theme => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.backgroundColor,
        paddingTop: isHorizontalScreen ? 10 : 50,
        paddingBottom: isHorizontalScreen ? 20 : 100,
      },
      chartContainer: {
        flex: 1,
        margin: 8,
        borderRadius: 8,
        backgroundColor: theme.backgroundColor,
        borderWidth: 1,
        borderColor: theme.gridColor,
      },
      chart: {
        flex: 1,
        backgroundColor: 'transparent',
      },
    });
  }, []);

  const theme = ThemeManager.getCurrentTheme(isDarkTheme);
  const styles = getStyles(theme);
  console.log('App.js render', Platform.OS);

  return (
    <View style={styles.container}>
      {/* Top toolbar */}
      <Toolbar
        theme={theme}
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleTheme}
        onTestUpdate={handleTestUpdateLastCandlestick}
        onTestAddCandles={handleTestAddCandlesticksAtTheEnd}
        onTestAddCandlesAtStart={handleTestAddCandlesticksAtTheStart}
      />

      {/* K-line chart */}
      {renderKLineChart(styles)}

      {/* Bottom control bar */}
      <ControlBar
        theme={theme}
        selectedTimeType={selectedTimeType}
        selectedMainIndicator={selectedMainIndicator}
        selectedSubIndicator={selectedSubIndicator}
        selectedDrawTool={selectedDrawTool}
        showVolumeChart={showVolumeChart}
        candleCornerRadius={candleCornerRadius}
        onShowTimeSelector={() => setShowTimeSelector(true)}
        onShowIndicatorSelector={() => setShowIndicatorSelector(true)}
        onToggleDrawToolSelector={() => {
          setShowDrawToolSelector(!showDrawToolSelector);
          setShowIndicatorSelector(false);
          setShowTimeSelector(false);
        }}
        onClearDrawings={clearDrawings}
        onToggleVolume={() => {
          setShowVolumeChart(!showVolumeChart);
          setTimeout(() => reloadKLineData(), 0);
        }}
        onToggleRounded={() => {
          setCandleCornerRadius(candleCornerRadius > 0 ? 0 : 1);
          setTimeout(() => reloadKLineData(), 0);
        }}
      />

      {/* Selector popup */}
      <Selectors
        theme={theme}
        showTimeSelector={showTimeSelector}
        showIndicatorSelector={showIndicatorSelector}
        showDrawToolSelector={showDrawToolSelector}
        selectedTimeType={selectedTimeType}
        selectedMainIndicator={selectedMainIndicator}
        selectedSubIndicator={selectedSubIndicator}
        selectedDrawTool={selectedDrawTool}
        drawShouldContinue={drawShouldContinue}
        onSelectTimeType={selectTimeType}
        onSelectIndicator={selectIndicator}
        onSelectDrawTool={selectDrawTool}
        onCloseTimeSelector={() => setShowTimeSelector(false)}
        onCloseIndicatorSelector={() => setShowIndicatorSelector(false)}
        onToggleDrawShouldContinue={value => setDrawShouldContinue(value)}
      />
    </View>
  );
};

export default App;
