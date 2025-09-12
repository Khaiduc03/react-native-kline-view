// K-line data types
export interface KLineData {
  id: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dateString: string;
  selectedItemList?: Array<{
    title: string;
    detail: string;
    color?: any;
  }>;
  maList?: HTKLineItemModel[];
  maVolumeList?: HTKLineItemModel[];
  rsiList?: HTKLineItemModel[];
  wrList?: HTKLineItemModel[];
  bollMb?: number;
  bollUp?: number;
  bollDn?: number;
  macdValue?: number;
  macdDea?: number;
  macdDif?: number;
  kdjK?: number;
  kdjD?: number;
  kdjJ?: number;
}

export interface HTKLineItemModel {
  value: number;
  title: string;
  selected: boolean;
  index: number;
}

// Theme types
export interface Theme {
  backgroundColor: string;
  titleColor: string;
  detailColor: string;
  textColor7724: string;
  headerColor: string;
  tabBarBackgroundColor: string;
  backgroundColor9103: string;
  backgroundColor9703: string;
  backgroundColor9113: string;
  backgroundColor9709: string;
  backgroundColor9603: string;
  backgroundColor9411: string;
  backgroundColor9607: string;
  backgroundColor9609: string;
  backgroundColor9509: string;
  backgroundColorBlue: string;
  buttonColor: string;
  borderColor: string;
  backgroundOpacity: string;
  increaseColor: string;
  decreaseColor: string;
  minuteLineColor: string;
  gridColor: string;
  separatorColor: string;
  textColor: string;
}

// Time period types
export interface TimeType {
  label: string;
  value: number;
}

// Indicator types
export interface IndicatorType {
  label: string;
  value: string;
}

// Drawing tool types
export interface DrawToolType {
  label: string;
  value: number;
}

// Component props types
export interface KLineChartProps {
  optionList: string | null;
  onDrawItemDidTouch?: (event: any) => void;
  onDrawItemComplete?: (event: any) => void;
  onDrawPointComplete?: (event: any) => void;
}

export interface ToolbarProps {
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}

export interface ControlBarProps {
  selectedTimeType: number;
  selectedMainIndicator: number;
  selectedSubIndicator: number;
  selectedDrawTool: number;
  onTimeTypePress: () => void;
  onIndicatorPress: () => void;
  onDrawToolPress: () => void;
  onClearDrawings: () => void;
  theme: Theme;
}

export interface SelectorProps {
  visible: boolean;
  onClose: () => void;
  theme: Theme;
}

export interface TimeSelectorProps extends SelectorProps {
  selectedTimeType: number;
  onSelectTimeType: (timeType: number) => void;
}

export interface IndicatorSelectorProps extends SelectorProps {
  selectedMainIndicator: number;
  selectedSubIndicator: number;
  onSelectIndicator: (type: 'main' | 'sub', indicator: number) => void;
}

export interface DrawToolSelectorProps extends SelectorProps {
  selectedDrawTool: number;
  drawShouldContinue: boolean;
  onSelectDrawTool: (tool: number) => void;
  onToggleDrawContinue: (value: boolean) => void;
}

// App state type
export interface AppState {
  isDarkTheme: boolean;
  selectedTimeType: number;
  selectedMainIndicator: number;
  selectedSubIndicator: number;
  selectedDrawTool: number;
  showIndicatorSelector: boolean;
  showTimeSelector: boolean;
  showDrawToolSelector: boolean;
  klineData: KLineData[];
  drawShouldContinue: boolean;
  optionList: string | null;
}
