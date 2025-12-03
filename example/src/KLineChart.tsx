import React, { useMemo } from 'react';
import {
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import RNKLineView, {
  OptionListObject,
  RNKLineViewNativeEvent,
  RNKLineViewRef,
} from 'react-native-kline-view';
import { Theme, ThemeManager } from './theme';
import {
  DrawStateConstants,
  DrawToolHelper,
  DrawTypeConstants,
  DrawTypeValue,
  MainIndicatorKey,
  SubIndicatorKey,
} from './constants';
import {
  ControlBar,
  DrawToolSelector,
  IndicatorSelector,
  TimeSelector,
  Toolbar,
} from './KLineComponents';
import {
  generateMockData,
  packOptionList,
  processKLineData,
  RawKLineItem,
} from './klineLogic';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isHorizontalScreen = screenWidth > screenHeight;

export interface AppState {
  isDarkTheme: boolean;
  selectedTimeType: number;
  selectedMainIndicator: number;
  selectedSubIndicator: number;
  selectedDrawTool: DrawTypeValue;
  showIndicatorSelector: boolean;
  showTimeSelector: boolean;
  showDrawToolSelector: boolean;
  klineData: RawKLineItem[];
  drawShouldContinue: boolean;
  optionList: string | null;
}

export type { RawKLineItem };

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      paddingTop: isHorizontalScreen ? 10 : 50,
      paddingBottom: isHorizontalScreen ? 20 : 100,
    },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.headerColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.gridColor,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    toolbarRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeLabel: {
      fontSize: 14,
      color: theme.textColor,
      marginRight: 8,
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
    controlBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.headerColor,
      borderTopWidth: 1,
      borderTopColor: theme.gridColor,
    },
    controlButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.buttonColor,
    },
    activeButton: {
      backgroundColor: theme.increaseColor,
    },
    controlButtonText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    activeButtonText: {
      color: '#FFFFFF',
    },
    selectorOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectorModal: {
      width: screenWidth * 0.8,
      maxHeight: screenHeight * 0.6,
      backgroundColor: theme.backgroundColor,
      borderRadius: 12,
      padding: 16,
    },
    selectorTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: 16,
    },
    selectorList: {
      maxHeight: screenHeight * 0.4,
    },
    selectorSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 12,
    },
    selectorItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginVertical: 2,
    },
    selectedItem: {
      backgroundColor: theme.buttonColor,
    },
    selectorItemText: {
      fontSize: 16,
      color: theme.textColor,
    },
    selectedItemText: {
      color: '#FFFFFF',
      fontWeight: '500',
    },
    closeButton: {
      marginTop: 16,
      paddingVertical: 12,
      backgroundColor: theme.buttonColor,
      borderRadius: 8,
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    selectorContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
    },
    toolbarButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.buttonColor,
    },
    buttonText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '500',
    },
  });

export const KLineChartScreen: React.FC = () => {
  const [state, setState] = React.useState<AppState>(() => ({
    isDarkTheme: false,
    selectedTimeType: 2,
    selectedMainIndicator: 1,
    selectedSubIndicator: isHorizontalScreen ? 0 : 3,
    selectedDrawTool: DrawTypeConstants.none,
    showIndicatorSelector: false,
    showTimeSelector: false,
    showDrawToolSelector: false,
    klineData: generateMockData(),
    drawShouldContinue: true,
    optionList: null,
  }));

  const theme = useMemo(
    () => ThemeManager.getCurrentTheme(state.isDarkTheme),
    [state.isDarkTheme],
  );
  const styles = useMemo(() => createStyles(theme), [theme]);
  const kLineViewRef = React.useRef<RNKLineViewRef | null>(null);

  React.useEffect(() => {
    StatusBar.setBarStyle(
      state.isDarkTheme ? 'light-content' : 'dark-content',
      true,
    );
  }, [state.isDarkTheme]);

  React.useEffect(() => {
    reloadKLineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.isDarkTheme,
    state.selectedMainIndicator,
    state.selectedSubIndicator,
  ]);

  const setOptionListState = (
    option: OptionListObject | { drawList: OptionListObject['drawList'] },
  ): void => {
    setState(prev => ({
      ...prev,
      optionList: JSON.stringify({
        ...(prev.optionList ? JSON.parse(prev.optionList) : {}),
        ...option,
      }),
    }));
  };

  function reloadKLineData(): void {
    const view = kLineViewRef.current;
    if (!view) {
      setTimeout(reloadKLineData, 100);
      return;
    }
    const processed = processKLineData(state.klineData, state);
    const optionList = packOptionList(processed, state, theme);
    setOptionListState(optionList);
  }

  const handleToggleTheme = (): void => {
    setState(prev => ({ ...prev, isDarkTheme: !prev.isDarkTheme }));
  };

  const handleSelectTimeType = (timeType: number): void => {
    setState(prev => ({
      ...prev,
      selectedTimeType: timeType,
      showTimeSelector: false,
      klineData: generateMockData(),
    }));
  };

  const handleSelectIndicator = (
    type: 'main' | 'sub',
    indicator: number,
  ): void => {
    setState(prev => ({
      ...prev,
      selectedMainIndicator:
        type === 'main'
          ? (indicator as MainIndicatorKey)
          : prev.selectedMainIndicator,
      selectedSubIndicator:
        type === 'sub'
          ? (indicator as SubIndicatorKey)
          : prev.selectedSubIndicator,
      showIndicatorSelector: false,
    }));
  };

  const handleSelectDrawTool = (tool: DrawTypeValue): void => {
    setState(prev => ({
      ...prev,
      selectedDrawTool: tool,
      showDrawToolSelector: false,
    }));

    setOptionListState({
      drawList: {
        shouldReloadDrawItemIndex:
          tool === DrawTypeConstants.none
            ? DrawStateConstants.none
            : DrawStateConstants.showContext,
        drawShouldContinue: state.drawShouldContinue,
        drawType: tool,
        shouldFixDraw: false,
      },
    });
  };

  const handleClearDrawings = (): void => {
    setState(prev => ({
      ...prev,
      selectedDrawTool: DrawTypeConstants.none,
    }));
    setOptionListState({
      drawList: {
        shouldReloadDrawItemIndex: DrawStateConstants.none,
        shouldClearDraw: true,
        drawType: DrawTypeConstants.none,
        drawShouldContinue: state.drawShouldContinue,
      },
    });
  };

  const handleDrawItemDidTouch = (event: RNKLineViewNativeEvent): void => {
    console.log('绘图项被触摸:', event.nativeEvent);
  };

  const handleDrawItemComplete = (event: RNKLineViewNativeEvent): void => {
    console.log('绘图项完成:', event.nativeEvent);
    if (!state.drawShouldContinue) {
      handleSelectDrawTool(DrawTypeConstants.none);
    }
  };

  const handleDrawPointComplete = (event: RNKLineViewNativeEvent): void => {
    const { nativeEvent } = event;
    const pointCount = (nativeEvent.pointCount as number) ?? 0;

    console.log('绘图点完成:', pointCount);
    const totalPoints = DrawToolHelper.count(state.selectedDrawTool);
    if (totalPoints > 0) {
      const progress = `${pointCount}/${totalPoints}`;

      console.log(`绘图进度: ${progress}`);
    }
  };

  const directChart = (
    <RNKLineView
      ref={kLineViewRef}
      style={styles.chart}
      optionList={state.optionList ?? undefined}
      onDrawItemDidTouch={handleDrawItemDidTouch}
      onDrawItemComplete={handleDrawItemComplete}
      onDrawPointComplete={handleDrawPointComplete}
    />
  );

  const chart =
    (global as unknown as { nativeFabricUIManager?: unknown })
      ?.nativeFabricUIManager && Platform.OS === 'ios' ? (
      directChart
    ) : (
      <View style={{ flex: 1 }} collapsable={false}>
        <View style={{ flex: 1 }} collapsable={false}>
          <View style={styles.chartContainer} collapsable={false}>
            {directChart}
          </View>
        </View>
      </View>
    );

  return (
    <View style={styles.container}>
      <Toolbar
        styles={styles}
        theme={theme}
        isDarkTheme={state.isDarkTheme}
        onToggleTheme={handleToggleTheme}
      />
      {chart}
      <ControlBar
        styles={styles}
        selectedTimeType={state.selectedTimeType}
        selectedMainIndicator={state.selectedMainIndicator}
        selectedSubIndicator={state.selectedSubIndicator}
        selectedDrawTool={state.selectedDrawTool}
        onShowTimeSelector={() =>
          setState(prev => ({ ...prev, showTimeSelector: true }))
        }
        onShowIndicatorSelector={() =>
          setState(prev => ({ ...prev, showIndicatorSelector: true }))
        }
        onToggleDrawToolSelector={() =>
          setState(prev => ({
            ...prev,
            showDrawToolSelector: !prev.showDrawToolSelector,
            showIndicatorSelector: false,
            showTimeSelector: false,
          }))
        }
        onClearDrawings={handleClearDrawings}
      />
      <TimeSelector
        styles={styles}
        visible={state.showTimeSelector}
        selectedTimeType={state.selectedTimeType}
        onSelect={handleSelectTimeType}
        onClose={() => setState(prev => ({ ...prev, showTimeSelector: false }))}
      />
      <IndicatorSelector
        styles={styles}
        visible={state.showIndicatorSelector}
        selectedMainIndicator={state.selectedMainIndicator}
        selectedSubIndicator={state.selectedSubIndicator}
        onSelect={handleSelectIndicator}
        onClose={() =>
          setState(prev => ({ ...prev, showIndicatorSelector: false }))
        }
      />
      <DrawToolSelector
        styles={styles}
        visible={state.showDrawToolSelector}
        selectedDrawTool={state.selectedDrawTool}
        drawShouldContinue={state.drawShouldContinue}
        onSelectTool={handleSelectDrawTool}
        onToggleDrawContinue={value =>
          setState(prev => ({ ...prev, drawShouldContinue: value }))
        }
      />
    </View>
  );
};
