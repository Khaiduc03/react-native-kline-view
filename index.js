import React, { forwardRef, useImperativeHandle, useRef } from "react";
import {
  requireNativeComponent,
  UIManager,
  findNodeHandle,
  Platform,
  NativeModules,
} from "react-native";

const COMPONENT_NAME = "RNKLineView";
const NativeRNKLineView = requireNativeComponent(COMPONENT_NAME);

/**
 * Dispatch a native view command:
 * - iOS: use NativeModules.RNKLineView methods directly
 * - Android: use UIManager.dispatchViewManagerCommand
 */
function runCommand(nativeRef, commandName, payload) {
  const nodeHandle = findNodeHandle(nativeRef.current);
  //console.log("runCommand", commandName, payload);
  if (!nodeHandle) return;

  // iOS: call NativeModules.RNKLineView methods directly
  if (Platform.OS === "ios") {
    const manager = NativeModules?.RNKLineView;
    if (!manager) {
      console.warn(
        "[RNKLineView] NativeModules.RNKLineView missing. Run `pod install` and rebuild iOS."
      );
      return;
    }

    if (typeof manager[commandName] !== "function") {
      console.warn(
        `[RNKLineView] iOS method ${commandName} not found on NativeModules.RNKLineView. Run 'pod install' and rebuild iOS.`
      );
      return;
    }

    if (commandName === "setData") {
      // setData expects an array of candles
      manager.setData(nodeHandle, payload);
    } else {
      // appendCandle / updateLastCandle take a single candle object
      manager[commandName](nodeHandle, payload);
    }
    return;
  }

  // Android (and fallback): use UIManager commands with string commandId
  const commandId = commandName;
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
    setData: (candles) => runCommand(nativeRef, "setData", candles),
    appendCandle: (candle) => runCommand(nativeRef, "appendCandle", candle),
    updateLastCandle: (candle) =>
      runCommand(nativeRef, "updateLastCandle", candle),
    unPredictionSelect: () => runCommand(nativeRef, "unPredictionSelect", null),
  }));

  return <NativeRNKLineView ref={nativeRef} {...props} />;
});

export default RNKLineView;
