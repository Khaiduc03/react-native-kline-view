import { useState, useCallback, useRef, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';
import { CustomKLineChartRef } from '../components/CustomKLineChart';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface CustomChartState {
  // Chart state
  isLoading: boolean;
  hasError: boolean;
  isRefreshing: boolean;

  // Gesture state
  isPanning: boolean;
  isZooming: boolean;
  currentScale: number;
  currentPan: { x: number; y: number };

  // UI state
  showOverlay: boolean;
  showHeader: boolean;
  showFooter: boolean;
  showLeftPanel: boolean;
  showRightPanel: boolean;

  // Chart data state
  chartData: any;
  selectedIndex: number;
  visibleRange: { start: number; end: number };

  // Custom components state
  overlayContent: React.ReactNode | null;
  headerContent: React.ReactNode | null;
  footerContent: React.ReactNode | null;
  leftPanelContent: React.ReactNode | null;
  rightPanelContent: React.ReactNode | null;
  backgroundContent: React.ReactNode | null;
}

export interface CustomChartActions {
  // Chart actions
  setLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  refreshChart: () => void;

  // Gesture actions
  setPanning: (panning: boolean) => void;
  setZooming: (zooming: boolean) => void;
  setScale: (scale: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetTransform: () => void;

  // UI actions
  toggleOverlay: () => void;
  setOverlayContent: (content: React.ReactNode | null) => void;
  toggleHeader: () => void;
  setHeaderContent: (content: React.ReactNode | null) => void;
  toggleFooter: () => void;
  setFooterContent: (content: React.ReactNode | null) => void;
  toggleLeftPanel: () => void;
  setLeftPanelContent: (content: React.ReactNode | null) => void;
  toggleRightPanel: () => void;
  setRightPanelContent: (content: React.ReactNode | null) => void;
  setBackgroundContent: (content: React.ReactNode | null) => void;

  // Chart data actions
  setChartData: (data: any) => void;
  setSelectedIndex: (index: number) => void;
  setVisibleRange: (range: { start: number; end: number }) => void;

  // Event handlers
  onChartPress: (event: any) => void;
  onChartLongPress: (event: any) => void;
  onChartPan: (event: any) => void;
  onChartZoom: (event: any) => void;
  onDrawItemDidTouch: (event: any) => void;
  onDrawItemComplete: (event: any) => void;
  onDrawPointComplete: (event: any) => void;
}

export const useCustomKLineChart = () => {
  const chartRef = useRef<CustomKLineChartRef>(null);

  const [state, setState] = useState<CustomChartState>({
    // Chart state
    isLoading: false,
    hasError: false,
    isRefreshing: false,

    // Gesture state
    isPanning: false,
    isZooming: false,
    currentScale: 1,
    currentPan: { x: 0, y: 0 },

    // UI state
    showOverlay: false,
    showHeader: false,
    showFooter: false,
    showLeftPanel: false,
    showRightPanel: false,

    // Chart data state
    chartData: null,
    selectedIndex: 0,
    visibleRange: { start: 0, end: 100 },

    // Custom components state
    overlayContent: null,
    headerContent: null,
    footerContent: null,
    leftPanelContent: null,
    rightPanelContent: null,
    backgroundContent: null,
  });

  // Chart actions
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: boolean) => {
    setState(prev => ({ ...prev, hasError: error }));
  }, []);

  const setRefreshing = useCallback((refreshing: boolean) => {
    setState(prev => ({ ...prev, isRefreshing: refreshing }));
  }, []);

  const refreshChart = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
      chartRef.current?.refreshChart();
    }, 1000);
  }, [setRefreshing]);

  // Gesture actions
  const setPanning = useCallback((panning: boolean) => {
    setState(prev => ({ ...prev, isPanning: panning }));
  }, []);

  const setZooming = useCallback((zooming: boolean) => {
    setState(prev => ({ ...prev, isZooming: zooming }));
  }, []);

  const setScale = useCallback((scale: number) => {
    setState(prev => ({ ...prev, currentScale: scale }));
  }, []);

  const setPan = useCallback((pan: { x: number; y: number }) => {
    setState(prev => ({ ...prev, currentPan: pan }));
  }, []);

  const resetTransform = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentScale: 1,
      currentPan: { x: 0, y: 0 },
    }));
    chartRef.current?.resetZoom();
  }, []);

  // UI actions
  const toggleOverlay = useCallback(() => {
    setState(prev => ({ ...prev, showOverlay: !prev.showOverlay }));
  }, []);

  const setOverlayContent = useCallback((content: React.ReactNode | null) => {
    setState(prev => ({ ...prev, overlayContent: content }));
  }, []);

  const toggleHeader = useCallback(() => {
    setState(prev => ({ ...prev, showHeader: !prev.showHeader }));
  }, []);

  const setHeaderContent = useCallback((content: React.ReactNode | null) => {
    setState(prev => ({ ...prev, headerContent: content }));
  }, []);

  const toggleFooter = useCallback(() => {
    setState(prev => ({ ...prev, showFooter: !prev.showFooter }));
  }, []);

  const setFooterContent = useCallback((content: React.ReactNode | null) => {
    setState(prev => ({ ...prev, footerContent: content }));
  }, []);

  const toggleLeftPanel = useCallback(() => {
    setState(prev => ({ ...prev, showLeftPanel: !prev.showLeftPanel }));
  }, []);

  const setLeftPanelContent = useCallback((content: React.ReactNode | null) => {
    setState(prev => ({ ...prev, leftPanelContent: content }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setState(prev => ({ ...prev, showRightPanel: !prev.showRightPanel }));
  }, []);

  const setRightPanelContent = useCallback(
    (content: React.ReactNode | null) => {
      setState(prev => ({ ...prev, rightPanelContent: content }));
    },
    [],
  );

  const setBackgroundContent = useCallback(
    (content: React.ReactNode | null) => {
      setState(prev => ({ ...prev, backgroundContent: content }));
    },
    [],
  );

  // Chart data actions
  const setChartData = useCallback((data: any) => {
    setState(prev => ({ ...prev, chartData: data }));
  }, []);

  const setSelectedIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, selectedIndex: index }));
  }, []);

  const setVisibleRange = useCallback(
    (range: { start: number; end: number }) => {
      setState(prev => ({ ...prev, visibleRange: range }));
    },
    [],
  );

  // Event handlers
  const onChartPress = useCallback((event: any) => {
    console.log('Chart pressed:', event);
    // Handle chart press logic
  }, []);

  const onChartLongPress = useCallback((event: any) => {
    console.log('Chart long pressed:', event);
    // Handle chart long press logic
  }, []);

  const onChartPan = useCallback(
    (event: any) => {
      setPanning(true);
      setPan({ x: event.dx, y: event.dy });
      console.log('Chart panned:', event);
    },
    [setPanning, setPan],
  );

  const onChartZoom = useCallback(
    (event: any) => {
      setZooming(true);
      setScale(event.scale);
      console.log('Chart zoomed:', event);
    },
    [setZooming, setScale],
  );

  const onDrawItemDidTouch = useCallback((event: any) => {
    console.log('Draw item touched:', event);
  }, []);

  const onDrawItemComplete = useCallback((event: any) => {
    console.log('Draw item completed:', event);
  }, []);

  const onDrawPointComplete = useCallback((event: any) => {
    console.log('Draw point completed:', event);
  }, []);

  // Chart control methods
  const scrollToEnd = useCallback(() => {
    chartRef.current?.scrollToEnd();
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      chartRef.current?.scrollToIndex(index);
      setSelectedIndex(index);
    },
    [setSelectedIndex],
  );

  const zoomIn = useCallback(() => {
    chartRef.current?.zoomIn();
  }, []);

  const zoomOut = useCallback(() => {
    chartRef.current?.zoomOut();
  }, []);

  const clearDrawings = useCallback(() => {
    chartRef.current?.clearDrawings();
  }, []);

  const getChartData = useCallback(() => {
    return chartRef.current?.getChartData();
  }, []);

  // Actions object
  const actions: CustomChartActions = {
    // Chart actions
    setLoading,
    setError,
    setRefreshing,
    refreshChart,

    // Gesture actions
    setPanning,
    setZooming,
    setScale,
    setPan,
    resetTransform,

    // UI actions
    toggleOverlay,
    setOverlayContent,
    toggleHeader,
    setHeaderContent,
    toggleFooter,
    setFooterContent,
    toggleLeftPanel,
    setLeftPanelContent,
    toggleRightPanel,
    setRightPanelContent,
    setBackgroundContent,

    // Chart data actions
    setChartData,
    setSelectedIndex,
    setVisibleRange,

    // Event handlers
    onChartPress,
    onChartLongPress,
    onChartPan,
    onChartZoom,
    onDrawItemDidTouch,
    onDrawItemComplete,
    onDrawPointComplete,
  };

  // Chart control methods
  const chartControls = {
    scrollToEnd,
    scrollToIndex,
    zoomIn,
    zoomOut,
    clearDrawings,
    getChartData,
    resetTransform,
  };

  return {
    state,
    actions,
    chartControls,
    chartRef,
  };
};
