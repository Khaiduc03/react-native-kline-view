import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  requireNativeComponent,
  UIManager,
  findNodeHandle,
  Platform,
} from 'react-native';

const NativeRNKLineView = requireNativeComponent('RNKLineView');

const RNKLineView = forwardRef((props, ref) => {
  const nativeRef = useRef(null);

  const normalizeOptionList = (optionList) => {
    if (!optionList) {
      return undefined;
    }
    if (typeof optionList === 'string') {
      return optionList;
    }
    try {
      return JSON.stringify(optionList);
    } catch (e) {
      console.warn('[RNKLineView] Failed to stringify optionList:', e);
      return undefined;
    }
  };

  useImperativeHandle(ref, () => ({
    updateLastCandlestick: (candlestick) => {
      const nodeHandle = findNodeHandle(nativeRef.current);
      if (nodeHandle) {
        if (Platform.OS === 'ios') {
          UIManager.dispatchViewManagerCommand(
            nodeHandle,
            UIManager.getViewManagerConfig('RNKLineView').Commands
              .updateLastCandlestick,
            [candlestick]
          );
        } else {
          UIManager.dispatchViewManagerCommand(
            nodeHandle,
            'updateLastCandlestick',
            [candlestick]
          );
        }
      } else {
        console.warn('No nodeHandle found for RNKLineView');
      }
    },
    addCandlesticksAtTheEnd: (candlesticks) => {
      const nodeHandle = findNodeHandle(nativeRef.current);
      if (nodeHandle) {
        if (Platform.OS === 'ios') {
          UIManager.dispatchViewManagerCommand(
            nodeHandle,
            UIManager.getViewManagerConfig('RNKLineView').Commands
              .addCandlesticksAtTheEnd,
            [candlesticks]
          );
        } else {
          UIManager.dispatchViewManagerCommand(
            nodeHandle,
            'addCandlesticksAtTheEnd',
            [candlesticks]
          );
        }
      } else {
        console.warn('No nodeHandle found for RNKLineView');
      }
    },
    addCandlesticksAtTheStart: (candlesticks) => {
      const nodeHandle = findNodeHandle(nativeRef.current);
      if (nodeHandle) {
        if (Platform.OS === 'ios') {
          UIManager.dispatchViewManagerCommand(
            nodeHandle,
            UIManager.getViewManagerConfig('RNKLineView').Commands
              .addCandlesticksAtTheStart,
            [candlesticks]
          );
        } else {
          UIManager.dispatchViewManagerCommand(
            nodeHandle,
            'addCandlesticksAtTheStart',
            [candlesticks]
          );
        }
      } else {
        console.warn('No nodeHandle found for RNKLineView');
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
});

export default RNKLineView;
