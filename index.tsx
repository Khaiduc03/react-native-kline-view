import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ForwardedRef,
} from 'react';
import {
  requireNativeComponent,
  UIManager,
  findNodeHandle,
  Platform,
} from 'react-native';
import type { RNKLineViewProps, RNKLineViewRef } from './index.d';

type OptionListInput = RNKLineViewProps['optionList'];
type NativeComponentProps = RNKLineViewProps;

const NativeRNKLineView =
  requireNativeComponent<NativeComponentProps>('RNKLineView');

const normalizeOptionList = (
  optionList: OptionListInput
): string | undefined => {
  if (!optionList) {
    return undefined;
  }
  if (typeof optionList === 'string') {
    return optionList;
  }
  try {
    return JSON.stringify(optionList);
  } catch (error) {
    console.warn('[RNKLineView] Failed to stringify optionList:', error);
    return undefined;
  }
};

const RNKLineView = forwardRef<RNKLineViewRef, RNKLineViewProps>(
  (props, ref: ForwardedRef<RNKLineViewRef>) => {
    const nativeRef = useRef<React.ComponentRef<
      typeof NativeRNKLineView
    > | null>(null);

    useImperativeHandle(ref, () => ({
      updateLastCandlestick: (candlestick) => {
        const nodeHandle = findNodeHandle(nativeRef.current);
        if (!nodeHandle) {
          console.warn('No nodeHandle found for RNKLineView');
          return;
        }

        if (Platform.OS === 'ios') {
          const command =
            UIManager.getViewManagerConfig('RNKLineView').Commands
              .updateLastCandlestick;
          UIManager.dispatchViewManagerCommand(nodeHandle, command, [
            candlestick,
          ]);
        } else {
          UIManager.dispatchViewManagerCommand(
            nodeHandle,
            'updateLastCandlestick',
            [candlestick]
          );
        }
      },
      addCandlesticksAtTheEnd: (candlesticks) => {
        const nodeHandle = findNodeHandle(nativeRef.current);
        if (!nodeHandle) {
          console.warn('No nodeHandle found for RNKLineView');
          return;
        }

        if (Platform.OS === 'ios') {
          const command =
            UIManager.getViewManagerConfig('RNKLineView').Commands
              .addCandlesticksAtTheEnd;
          UIManager.dispatchViewManagerCommand(nodeHandle, command, [
            candlesticks,
          ]);
        } else {
          UIManager.dispatchViewManagerCommand(
            nodeHandle,
            'addCandlesticksAtTheEnd',
            [candlesticks]
          );
        }
      },
      addCandlesticksAtTheStart: (candlesticks) => {
        const nodeHandle = findNodeHandle(nativeRef.current);
        if (!nodeHandle) {
          console.warn('No nodeHandle found for RNKLineView');
          return;
        }

        if (Platform.OS === 'ios') {
          const command =
            UIManager.getViewManagerConfig('RNKLineView').Commands
              .addCandlesticksAtTheStart;
          UIManager.dispatchViewManagerCommand(nodeHandle, command, [
            candlesticks,
          ]);
        } else {
          UIManager.dispatchViewManagerCommand(
            nodeHandle,
            'addCandlesticksAtTheStart',
            [candlesticks]
          );
        }
      },
    }));

    const { optionList, ...restProps } = props;
    const normalizedOptionList = normalizeOptionList(optionList);

    return (
      <NativeRNKLineView
        ref={nativeRef}
        {...restProps}
        optionList={normalizedOptionList}
      />
    );
  }
);

export default RNKLineView;
