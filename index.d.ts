import * as React from 'react';
import { ViewProps, NativeSyntheticEvent } from 'react-native';

type ExtraFields = Record<string, unknown>;

export type RNKLineViewNativeEvent = NativeSyntheticEvent<
  Record<string, unknown>
>;

// K-line model item (single candlestick with indicators)
export interface KLineModel extends ExtraFields {
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
    color?: number;
  }>;
  bollMb?: number;
  bollUp?: number;
  bollDn?: number;
  macdValue?: number;
  macdDea?: number;
  macdDif?: number;
  kdjK?: number;
  kdjD?: number;
  kdjJ?: number;
  // Optional indicator fields (MACD, KDJ, RSI, WR, MA, etc.)
  maList?: Array<{ title: string; value: number; index: number }>;
  maVolumeList?: Array<{ title: string; value: number; index: number }>;
  rsiList?: Array<{ title: string; value: number; index: number }>;
  wrList?: Array<{ title: string; value: number; index: number }>;
}

export interface TargetListConfig extends ExtraFields {
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
}

export interface ConfigListConfig extends ExtraFields {
  colorList: {
    increaseColor: number;
    decreaseColor: number;
  };
  targetColorList: number[];
  backgroundColor: number;
  textColor: number;
  gridColor: number;
  candleTextColor: number;
  minuteLineColor: number;
  minuteGradientColorList: number[];
  minuteGradientLocationList: number[];
  mainFlex: number;
  volumeFlex: number;
  paddingTop: number;
  paddingBottom: number;
  paddingRight: number;
  itemWidth: number;
  candleWidth: number;
  candleCornerRadius: number;
  minuteVolumeCandleColor: number;
  minuteVolumeCandleWidth: number;
  macdCandleWidth: number;
  headerTextFontSize: number;
  rightTextFontSize: number;
  candleTextFontSize: number;
  panelTextFontSize: number;
  panelMinWidth: number;
  fontFamily: string;
  panelBackgroundColor: number;
  panelBorderColor: number;
  panelGradientColorList?: number[];
  panelGradientLocationList?: number[];
  closePriceCenterBackgroundColor?: number;
  closePriceCenterBorderColor?: number;
  closePriceCenterTriangleColor?: number;
  closePriceCenterSeparatorColor?: number;
  closePriceRightBackgroundColor?: number;
  closePriceRightSeparatorColor?: number;
  closePriceRightLightLottieFloder?: string;
  closePriceRightLightLottieScale?: number;
  closePriceRightLightLottieSource?: string;
}

export interface DrawListConfig extends ExtraFields {
  drawType: number;
  shouldReloadDrawItemIndex: number;
  drawShouldContinue: boolean;
  shouldClearDraw?: boolean;
  shouldFixDraw?: boolean;
  shotBackgroundColor?: number;
  drawColor?: number;
  drawLineHeight?: number;
  drawDashWidth?: number;
  drawDashSpace?: number;
  drawIsLock?: boolean;
}

export interface OptionListObject extends ExtraFields {
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
  updateLastCandlestick(candlestick: KLineModel): void;

  /**
   * Append new candlesticks to the end of the series.
   */
  addCandlesticksAtTheEnd(candlesticks: KLineModel[]): void;

  /**
   * Prepend new candlesticks to the start of the series.
   */
  addCandlesticksAtTheStart(candlesticks: KLineModel[]): void;
}

declare const RNKLineView: React.ForwardRefExoticComponent<
  RNKLineViewProps & React.RefAttributes<RNKLineViewRef>
>;

export default RNKLineView;
