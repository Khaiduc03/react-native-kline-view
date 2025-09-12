declare module 'react-native-kline-view' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  interface RNKLineViewProps {
    style?: ViewStyle;
    optionList?: string | null;
    onDrawItemDidTouch?: (event: any) => void;
    onDrawItemComplete?: (event: any) => void;
    onDrawPointComplete?: (event: any) => void;
  }

  export default class RNKLineView extends Component<RNKLineViewProps> {}
}
