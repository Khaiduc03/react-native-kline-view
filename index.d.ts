import * as React from 'react';
import { ViewProps, NativeSyntheticEvent } from 'react-native';

export type RNKLineViewNativeEvent = NativeSyntheticEvent<any>;

// K-line model item (single candlestick with indicators)
export interface KLineModel {
  id: number;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
  dateString?: string;
  selectedItemList?: Array<{
    title: string;
    detail: string | number;
    color?: any;
  }>;
  // Optional indicator fields (MACD, KDJ, RSI, WR, MA, etc.)
  maList?: Array<{ title: string; value: number; index: number }>;
  maVolumeList?: Array<{ title: string; value: number; index: number }>;
  rsiList?: Array<{ title: string; value: number; index: number }>;
  wrList?: Array<{ title: string; value: number; index: number }>;
  // Additional indicator-specific fields are allowed but not strictly typed here
  [key: string]: any;
}

export interface TargetListConfig {
  maList: Array<{ title: string; selected: boolean; index: number }>;
  maVolumeList: Array<{ title: string; selected: boolean; index: number }>;
  rsiList: Array<{ title: string; selected: boolean; index: number }>;
  wrList: Array<{ title: string; selected: boolean; index: number }>;
  bollN: string;
  bollP: string;
  macdS: string;
  macdL: string;
  macdM: string;
  kdjN: string;
  kdjM1: string;
  kdjM2: string;
  [key: string]: any;
}

export interface ConfigListConfig {
  colorList: {
    increaseColor: any;
    decreaseColor: any;
  };
  targetColorList: any[];
  backgroundColor: any;
  textColor: any;
  gridColor: any;
  candleTextColor: any;
  minuteLineColor: any;
  minuteGradientColorList: any[];
  minuteGradientLocationList: number[];
  mainFlex: number;
  volumeFlex: number;
  paddingTop: number;
  paddingBottom: number;
  paddingRight: number;
  itemWidth: number;
  candleWidth: number;
  candleCornerRadius: number;
  minuteVolumeCandleColor: any;
  minuteVolumeCandleWidth: number;
  macdCandleWidth: number;
  headerTextFontSize: number;
  rightTextFontSize: number;
  candleTextFontSize: number;
  panelTextFontSize: number;
  panelMinWidth: number;
  fontFamily: string;
  panelBackgroundColor: any;
  panelBorderColor: any;
  panelGradientColorList?: any[];
  panelGradientLocationList?: number[];
  closePriceCenterBackgroundColor?: any;
  closePriceCenterBorderColor?: any;
  closePriceCenterTriangleColor?: any;
  closePriceCenterSeparatorColor?: any;
  closePriceRightBackgroundColor?: any;
  closePriceRightSeparatorColor?: any;
  closePriceRightLightLottieFloder?: string;
  closePriceRightLightLottieScale?: number;
  closePriceRightLightLottieSource?: string;
  [key: string]: any;
}

export interface DrawListConfig {
  drawType: number;
  shouldReloadDrawItemIndex: number;
  drawShouldContinue: boolean;
  shouldClearDraw?: boolean;
  shouldFixDraw?: boolean;
  shotBackgroundColor?: any;
  drawColor?: any;
  drawLineHeight?: number;
  drawDashWidth?: number;
  drawDashSpace?: number;
  drawIsLock?: boolean;
  [key: string]: any;
}

export interface OptionListObject {
  modelArray: KLineModel[];
  shouldScrollToEnd?: boolean;
  targetList: TargetListConfig;
  configList: ConfigListConfig;
  drawList: DrawListConfig;
  price?: number;
  volume?: number;
  primary?: number;
  second?: number;
  time?: number;
  useImperativeApi?: boolean;
  scrollPositionAdjustment?: number;
  [key: string]: any;
}

export interface RNKLineViewProps extends ViewProps {
  /**
   * Chart configuration and data.
   * You can pass either a JSON object (preferred) or a pre-stringified JSON string.
   * The library will stringify the object before sending it to the native view.
   */
  optionList?: OptionListObject | string;

  /**
   * Fired when a drawing item is touched.
   */
  onDrawItemDidTouch?: (event: RNKLineViewNativeEvent) => void;

  /**
   * Fired when user scrolls to the left edge (used to load more history).
   */
  onScrollLeft?: (event: RNKLineViewNativeEvent) => void;

  /**
   * Fired when user touches the chart area.
   */
  onChartTouch?: (event: RNKLineViewNativeEvent) => void;

  /**
   * Fired when a drawing item is completed.
   */
  onDrawItemComplete?: (event: RNKLineViewNativeEvent) => void;

  /**
   * Fired when a drawing point is completed.
   */
  onDrawPointComplete?: (event: RNKLineViewNativeEvent) => void;
}

export interface RNKLineViewRef {
  /**
   * Imperatively update the last candlestick in the series.
   * candlestick must match the model structure used in optionList.modelArray.
   */
  updateLastCandlestick(candlestick: any): void;

  /**
   * Append new candlesticks to the end of the series.
   */
  addCandlesticksAtTheEnd(candlesticks: any[]): void;

  /**
   * Prepend new candlesticks to the start of the series.
   */
  addCandlesticksAtTheStart(candlesticks: any[]): void;
}

declare const RNKLineView: React.ForwardRefExoticComponent<
  RNKLineViewProps & React.RefAttributes<RNKLineViewRef>
>;

export default RNKLineView;
