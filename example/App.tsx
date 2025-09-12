import React, { Component } from 'react';
import { View, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { ThemeManager } from './src/constants';
import { useKLineChart } from './src/hooks/useKLineChart';
import {
  KLineChart,
  Toolbar,
  ControlBar,
  TimeSelector,
  IndicatorSelector,
  DrawToolSelector,
} from './src/components';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isHorizontalScreen = screenWidth > screenHeight;

const App: React.FC = () => {
  const {
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
  } = useKLineChart();

  const theme = ThemeManager.getCurrentTheme(state.isDarkTheme);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Top toolbar */}
      <Toolbar isDarkTheme={state.isDarkTheme} onToggleTheme={toggleTheme} />

      {/* K-line chart */}
      <KLineChart
        optionList={state.optionList}
        onDrawItemDidTouch={onDrawItemDidTouch}
        onDrawItemComplete={onDrawItemComplete}
        onDrawPointComplete={onDrawPointComplete}
      />

      {/* Bottom control bar */}
      <ControlBar
        selectedTimeType={state.selectedTimeType}
        selectedMainIndicator={state.selectedMainIndicator}
        selectedSubIndicator={state.selectedSubIndicator}
        selectedDrawTool={state.selectedDrawTool}
        onTimeTypePress={showTimeSelector}
        onIndicatorPress={showIndicatorSelector}
        onDrawToolPress={showDrawToolSelector}
        onClearDrawings={clearDrawings}
        theme={theme}
      />

      {/* Selector popups */}
      <TimeSelector
        visible={state.showTimeSelector}
        onClose={closeSelectors}
        selectedTimeType={state.selectedTimeType}
        onSelectTimeType={selectTimeType}
        theme={theme}
      />

      <IndicatorSelector
        visible={state.showIndicatorSelector}
        onClose={closeSelectors}
        selectedMainIndicator={state.selectedMainIndicator}
        selectedSubIndicator={state.selectedSubIndicator}
        onSelectIndicator={selectIndicator}
        theme={theme}
      />

      <DrawToolSelector
        visible={state.showDrawToolSelector}
        onClose={closeSelectors}
        selectedDrawTool={state.selectedDrawTool}
        drawShouldContinue={state.drawShouldContinue}
        onSelectDrawTool={selectDrawTool}
        onToggleDrawContinue={toggleDrawContinue}
        theme={theme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: isHorizontalScreen ? 10 : 50,
    paddingBottom: isHorizontalScreen ? 20 : 100,
  },
});

export default App;
