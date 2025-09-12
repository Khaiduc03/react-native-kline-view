import React, { Component, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { ThemeManager } from './src/constants';
import { useKLineChart } from './src/hooks/useKLineChart';
import {
  KLineChart,
  CustomKLineChart,
  CustomKLineExample,
  Toolbar,
  ControlBar,
  TimeSelector,
  IndicatorSelector,
  DrawToolSelector,
} from './src/components';
import PanViewExample from './src/components/PanViewExample';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isHorizontalScreen = screenWidth > screenHeight;

const App: React.FC = () => {
  const [useCustomView, setUseCustomView] = useState(false);
  const [showPanViewExample, setShowPanViewExample] = useState(false);

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
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      {/* Top toolbar */}
      <Toolbar isDarkTheme={state.isDarkTheme} onToggleTheme={toggleTheme} />

      {/* Toggle between normal and custom view */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !useCustomView && styles.activeToggleButton,
            { backgroundColor: !useCustomView ? theme.buttonColor : '#F5F5F5' },
          ]}
          onPress={() => {
            setUseCustomView(false);
            setShowPanViewExample(false);
          }}
        >
          <Text
            style={[
              styles.toggleButtonText,
              { color: !useCustomView ? '#FFFFFF' : theme.textColor },
            ]}
          >
            Normal View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            useCustomView && styles.activeToggleButton,
            { backgroundColor: useCustomView ? theme.buttonColor : '#F5F5F5' },
          ]}
          onPress={() => {
            setUseCustomView(true);
            setShowPanViewExample(false);
          }}
        >
          <Text
            style={[
              styles.toggleButtonText,
              { color: useCustomView ? '#FFFFFF' : theme.textColor },
            ]}
          >
            Custom View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            showPanViewExample && styles.activeToggleButton,
            {
              backgroundColor: showPanViewExample
                ? theme.buttonColor
                : '#F5F5F5',
            },
          ]}
          onPress={() => {
            setShowPanViewExample(true);
            setUseCustomView(false);
          }}
        >
          <Text
            style={[
              styles.toggleButtonText,
              { color: showPanViewExample ? '#FFFFFF' : theme.textColor },
            ]}
          >
            Pan View Demo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional rendering based on view type */}
      {showPanViewExample ? (
        <PanViewExample />
      ) : useCustomView ? (
        <CustomKLineExample
          optionList={state.optionList}
          isDarkTheme={state.isDarkTheme}
        />
      ) : (
        <>
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
        </>
      )}

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
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggleButton: {
    // Active state styling handled by backgroundColor
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default App;
