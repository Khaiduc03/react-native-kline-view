import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  requireNativeComponent,
  UIManager,
  findNodeHandle,
  Platform,
  NativeModules,
} from 'react-native';

const COMPONENT_NAME = 'RNKLineView';
const NativeRNKLineView = requireNativeComponent(COMPONENT_NAME);

/**
 * Dispatch a native view command on Android, or call the iOS ViewManager method directly.
 */
function runCommand(nativeRef, commandName, payload) {
  const nodeHandle = findNodeHandle(nativeRef.current);
  if (!nodeHandle) return;

  // iOS: call ViewManager exported methods (RNKLineView)
  if (Platform.OS === 'ios') {
    const manager = NativeModules?.RNKLineView;
    if (manager && typeof manager[commandName] === 'function') {
      // setData signature: (reactTag, candlesArray)
      if (commandName === 'setData') {
        manager.setData(nodeHandle, payload);
      } else {
        manager[commandName](nodeHandle, payload);
      }
      return;
    }
  }

  // Android (and fallback): use UIManager commands
  const config = UIManager.getViewManagerConfig(COMPONENT_NAME);

  // In the New Architecture (Fabric), commandId is typically a string.
  // In the Legacy architecture (Paper), commandId is usually a number from config.Commands.
  const isFabric = !!global?.nativeFabricUIManager;
  const commandId = (isFabric || !config?.Commands) ? commandName : (config.Commands[commandName] ?? commandName);
  UIManager.dispatchViewManagerCommand(nodeHandle, commandId, [payload]);
}

/**
 * RNKLineView with an imperative API:
 * - setData(candles): replace all candles
 * - appendCandle(candle): append one candle
 * - updateLastCandle(candle): replace the last candle (or append if empty)
 */
const RNKLineView = forwardRef((props, ref) => {
  const nativeRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setData: (candles) => runCommand(nativeRef, 'setData', candles),
    appendCandle: (candle) => runCommand(nativeRef, 'appendCandle', candle),
    updateLastCandle: (candle) => runCommand(nativeRef, 'updateLastCandle', candle),
  }));

  return <NativeRNKLineView ref={nativeRef} {...props} />;
});

export default RNKLineView;
