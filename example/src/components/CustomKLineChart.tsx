import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import RNKLineView from 'react-native-kline-view';
import { KLineChartProps } from '../types';
import CustomPanView from './CustomPanView';
import { usePanData } from '../hooks/usePanData';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Custom ref interface
export interface CustomKLineChartRef {
  scrollToEnd: () => void;
  scrollToIndex: (index: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  clearDrawings: () => void;
  getChartData: () => any;
  refreshChart: () => void;
}

const CustomKLineChart = forwardRef<CustomKLineChartRef, KLineChartProps>(
  (
    {
      optionList,
      onDrawItemDidTouch,
      onDrawItemComplete,
      onDrawPointComplete,
      // Custom styling
      containerStyle,
      chartStyle,
      // Custom behavior
      enableGestures = true,
      enableZoom = true,
      enableScroll = true,
      enableDrawing = true,
      // Custom overlay
      showOverlay = false,
      overlayContent,
      // Custom loading
      isLoading = false,
      loadingComponent,
      // Custom error
      // Pan view customization
      enablePanView = true,
      panViewTheme = 'light',
      hasError = false,
      errorComponent,
      // Custom header
      showHeader = false,
      headerComponent,
      // Custom footer
      showFooter = false,
      footerComponent,
      // Custom side panels
      showLeftPanel = false,
      leftPanelComponent,
      showRightPanel = false,
      rightPanelComponent,
      // Custom background
      backgroundComponent,
      // Custom events
      onChartPress,
      onChartLongPress,
      onChartPan,
      onChartZoom,
    },
    ref,
  ) => {
    const chartRef = useRef<any>(null);
    const {
      panData,
      panPosition,
      isPanVisible,
      showPan,
      hidePan,
      processKLineData,
    } = usePanData();
    const panRef = useRef(new Animated.ValueXY()).current;
    const scaleRef = useRef(new Animated.Value(1)).current;
    const lastScaleRef = useRef(1);
    const lastPanRef = useRef({ x: 0, y: 0 });

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      scrollToEnd: () => {
        // Implementation for scrolling to end
        console.log('Scrolling to end');
      },
      scrollToIndex: (index: number) => {
        // Implementation for scrolling to specific index
        console.log('Scrolling to index:', index);
      },
      zoomIn: () => {
        const newScale = Math.min(lastScaleRef.current * 1.2, 3);
        lastScaleRef.current = newScale;
        Animated.spring(scaleRef, {
          toValue: newScale,
          useNativeDriver: true,
        }).start();
        onChartZoom?.({ scale: newScale, type: 'zoomIn' });
      },
      zoomOut: () => {
        const newScale = Math.max(lastScaleRef.current / 1.2, 0.5);
        lastScaleRef.current = newScale;
        Animated.spring(scaleRef, {
          toValue: newScale,
          useNativeDriver: true,
        }).start();
        onChartZoom?.({ scale: newScale, type: 'zoomOut' });
      },
      resetZoom: () => {
        lastScaleRef.current = 1;
        Animated.parallel([
          Animated.spring(scaleRef, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(panRef, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }),
        ]).start();
        onChartZoom?.({ scale: 1, type: 'reset' });
      },
      clearDrawings: () => {
        // Implementation for clearing drawings
        console.log('Clearing drawings');
      },
      getChartData: () => {
        // Implementation for getting chart data
        return optionList ? JSON.parse(optionList) : null;
      },
      refreshChart: () => {
        // Implementation for refreshing chart
        console.log('Refreshing chart');
      },
    }));

    // Pan responder for custom gestures
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => enableGestures,
      onMoveShouldSetPanResponder: () => enableGestures,
      onPanResponderGrant: () => {
        lastPanRef.current = {
          x: (panRef.x as any)._value,
          y: (panRef.y as any)._value,
        };
      },
      onPanResponderMove: (evt, gestureState) => {
        if (enableScroll) {
          panRef.setValue({
            x: lastPanRef.current.x + gestureState.dx,
            y: lastPanRef.current.y + gestureState.dy,
          });
          onChartPan?.(gestureState);

          // Handle pan view
          if (enablePanView && optionList) {
            try {
              const data = JSON.parse(optionList);
              if (data.modelArray && data.modelArray.length > 0) {
                // Calculate which data point is closest to the touch position
                const touchX = evt.nativeEvent.locationX;
                const itemWidth = data.configList?.itemWidth || 9;
                const dataIndex = Math.floor(touchX / itemWidth);

                if (dataIndex >= 0 && dataIndex < data.modelArray.length) {
                  const klineData = data.modelArray[dataIndex];
                  const processedData = processKLineData(klineData);
                  showPan(processedData, {
                    x: touchX,
                    y: evt.nativeEvent.locationY,
                  });
                }
              }
            } catch (error) {
              console.error('Error parsing optionList for pan view:', error);
            }
          }
        }
      },
      onPanResponderRelease: () => {
        // Handle pan release
        if (enablePanView) {
          hidePan();
        }
      },
    });

    // Handle chart press
    const handleChartPress = (event: any) => {
      onChartPress?.(event);
    };

    // Handle chart long press
    const handleChartLongPress = (event: any) => {
      onChartLongPress?.(event);
    };

    // Render loading component
    const renderLoading = () => {
      if (loadingComponent) {
        return loadingComponent;
      }
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading chart...</Text>
        </View>
      );
    };

    // Render error component
    const renderError = () => {
      if (errorComponent) {
        return errorComponent;
      }
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading chart</Text>
          <TouchableOpacity style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    };

    // Render header
    const renderHeader = () => {
      if (!showHeader) return null;
      return <View style={styles.headerContainer}>{headerComponent}</View>;
    };

    // Render footer
    const renderFooter = () => {
      if (!showFooter) return null;
      return <View style={styles.footerContainer}>{footerComponent}</View>;
    };

    // Render side panels
    const renderLeftPanel = () => {
      if (!showLeftPanel) return null;
      return (
        <View style={styles.leftPanelContainer}>{leftPanelComponent}</View>
      );
    };

    const renderRightPanel = () => {
      if (!showRightPanel) return null;
      return (
        <View style={styles.rightPanelContainer}>{rightPanelComponent}</View>
      );
    };

    // Render overlay
    const renderOverlay = () => {
      if (!showOverlay) return null;
      return <View style={styles.overlayContainer}>{overlayContent}</View>;
    };

    // Render background
    const renderBackground = () => {
      if (!backgroundComponent) return null;
      return (
        <View style={styles.backgroundContainer}>{backgroundComponent}</View>
      );
    };

    // Main chart component
    const renderChart = () => {
      if (isLoading) {
        return renderLoading();
      }

      if (hasError) {
        return renderError();
      }

      const chartComponent = (
        <RNKLineView
          ref={chartRef}
          style={chartStyle || styles.chart}
          optionList={optionList}
          onDrawItemDidTouch={onDrawItemDidTouch}
          onDrawItemComplete={onDrawItemComplete}
          onDrawPointComplete={onDrawPointComplete}
        />
      );

      // Check if using new architecture on iOS
      if (
        (global as any)?.nativeFabricUIManager &&
        require('react-native').Platform.OS === 'ios'
      ) {
        return chartComponent;
      }

      return (
        <View style={{ flex: 1 }} collapsable={false}>
          <View style={{ flex: 1 }} collapsable={false}>
            <View style={styles.chartContainer} collapsable={false}>
              {chartComponent}
            </View>
          </View>
        </View>
      );
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {renderBackground()}

        <View style={styles.contentContainer}>
          {renderHeader()}

          <View style={styles.chartRow}>
            {renderLeftPanel()}

            <Animated.View
              style={[
                styles.chartWrapper,
                {
                  transform: [
                    { translateX: panRef.x },
                    { translateY: panRef.y },
                    { scale: scaleRef },
                  ],
                },
              ]}
              {...(enableGestures ? panResponder.panHandlers : {})}
            >
              <TouchableOpacity
                style={styles.chartTouchable}
                onPress={handleChartPress}
                onLongPress={handleChartLongPress}
                activeOpacity={1}
              >
                {renderChart()}
              </TouchableOpacity>
            </Animated.View>

            {renderRightPanel()}
          </View>

          {renderFooter()}
        </View>

        {renderOverlay()}

        {/* Custom Pan View */}
        {enablePanView && (
          <CustomPanView
            data={panData}
            visible={isPanVisible}
            position={panPosition}
            theme={panViewTheme}
          />
        )}
      </View>
    );
  },
);

CustomKLineChart.displayName = 'CustomKLineChart';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
  },
  chartRow: {
    flex: 1,
    flexDirection: 'row',
  },
  chartWrapper: {
    flex: 1,
  },
  chartTouchable: {
    flex: 1,
  },
  chart: {
    flex: 1,
  },
  chartContainer: {
    flex: 1,
  },
  headerContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  footerContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  leftPanelContainer: {
    width: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
  },
  rightPanelContainer: {
    width: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.1)',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  errorText: {
    fontSize: 16,
    color: '#FF5722',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CustomKLineChart;
