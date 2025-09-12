import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import CustomKLineChart from './CustomKLineChart';
import {
  CustomHeader,
  CustomFooter,
  CustomLeftPanel,
  CustomRightPanel,
  CustomOverlay,
  CustomBackground,
  CustomLoading,
  CustomError,
} from './CustomComponents';
import { useCustomKLineChart } from '../hooks/useCustomKLineChart';
import { ThemeManager } from '../constants';

interface CustomKLineExampleProps {
  optionList: string | null;
  isDarkTheme: boolean;
}

const CustomKLineExample: React.FC<CustomKLineExampleProps> = ({
  optionList,
  isDarkTheme,
}) => {
  const { state, actions, chartControls, chartRef } = useCustomKLineChart();
  const theme = ThemeManager.getCurrentTheme(isDarkTheme);

  // Handle custom component actions
  const handleMenuPress = () => {
    actions.toggleLeftPanel();
  };

  const handleSettingsPress = () => {
    actions.setOverlayContent(
      <CustomOverlay
        onClose={() => actions.setOverlayContent(null)}
        theme={theme}
      />,
    );
    actions.toggleOverlay();
  };

  const handleRefresh = () => {
    actions.refreshChart();
  };

  const handleFullscreen = () => {
    actions.toggleHeader();
    actions.toggleFooter();
  };

  const handleShare = () => {
    console.log('Sharing chart...');
  };

  const handleZoomIn = () => {
    chartControls.zoomIn();
  };

  const handleZoomOut = () => {
    chartControls.zoomOut();
  };

  const handleReset = () => {
    chartControls.resetTransform();
  };

  const handleToggleMA = () => {
    console.log('Toggle MA');
  };

  const handleToggleMACD = () => {
    console.log('Toggle MACD');
  };

  const handleToggleVolume = () => {
    console.log('Toggle Volume');
  };

  const handleRetry = () => {
    actions.setError(false);
    actions.setLoading(true);
    setTimeout(() => {
      actions.setLoading(false);
    }, 1000);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <CustomKLineChart
        ref={chartRef}
        optionList={optionList}
        // Custom styling
        containerStyle={styles.chartContainer}
        chartStyle={styles.chart}
        // Custom behavior
        enableGestures={true}
        enableZoom={true}
        enableScroll={true}
        enableDrawing={true}
        // Custom overlay
        showOverlay={state.showOverlay}
        overlayContent={state.overlayContent}
        // Custom loading
        isLoading={state.isLoading}
        loadingComponent={<CustomLoading theme={theme} />}
        // Custom error
        hasError={state.hasError}
        errorComponent={<CustomError onRetry={handleRetry} theme={theme} />}
        // Custom header
        showHeader={state.showHeader}
        headerComponent={
          <CustomHeader
            title="Custom K-Line Chart"
            onMenuPress={handleMenuPress}
            onSettingsPress={handleSettingsPress}
            theme={theme}
          />
        }
        // Custom footer
        showFooter={state.showFooter}
        footerComponent={
          <CustomFooter
            onRefresh={handleRefresh}
            onFullscreen={handleFullscreen}
            onShare={handleShare}
            theme={theme}
          />
        }
        // Custom side panels
        showLeftPanel={state.showLeftPanel}
        leftPanelComponent={
          <CustomLeftPanel
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
            theme={theme}
          />
        }
        showRightPanel={state.showRightPanel}
        rightPanelComponent={
          <CustomRightPanel
            onToggleMA={handleToggleMA}
            onToggleMACD={handleToggleMACD}
            onToggleVolume={handleToggleVolume}
            theme={theme}
          />
        }
        // Custom background
        backgroundComponent={<CustomBackground theme={theme} />}
        // Custom events
        onChartPress={actions.onChartPress}
        onChartLongPress={actions.onChartLongPress}
        onChartPan={actions.onChartPan}
        onChartZoom={actions.onChartZoom}
        onDrawItemDidTouch={actions.onDrawItemDidTouch}
        onDrawItemComplete={actions.onDrawItemComplete}
        onDrawPointComplete={actions.onDrawPointComplete}
      />

      {/* Control buttons for demo */}
      <View style={styles.controlButtons}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.buttonColor }]}
          onPress={() => actions.setLoading(!state.isLoading)}
        >
          <Text style={[styles.controlButtonText, { color: theme.textColor }]}>
            {state.isLoading ? 'Stop Loading' : 'Start Loading'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.buttonColor }]}
          onPress={() => actions.setError(!state.hasError)}
        >
          <Text style={[styles.controlButtonText, { color: theme.textColor }]}>
            {state.hasError ? 'Hide Error' : 'Show Error'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.buttonColor }]}
          onPress={() => actions.toggleHeader()}
        >
          <Text style={[styles.controlButtonText, { color: theme.textColor }]}>
            {state.showHeader ? 'Hide Header' : 'Show Header'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.buttonColor }]}
          onPress={() => actions.toggleFooter()}
        >
          <Text style={[styles.controlButtonText, { color: theme.textColor }]}>
            {state.showFooter ? 'Hide Footer' : 'Show Footer'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.buttonColor }]}
          onPress={() => actions.toggleLeftPanel()}
        >
          <Text style={[styles.controlButtonText, { color: theme.textColor }]}>
            {state.showLeftPanel ? 'Hide Left Panel' : 'Show Left Panel'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.buttonColor }]}
          onPress={() => actions.toggleRightPanel()}
        >
          <Text style={[styles.controlButtonText, { color: theme.textColor }]}>
            {state.showRightPanel ? 'Hide Right Panel' : 'Show Right Panel'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chartContainer: {
    flex: 1,
  },
  chart: {
    flex: 1,
  },
  controlButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CustomKLineExample;
