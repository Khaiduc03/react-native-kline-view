import React from "react";
import {
  requireNativeComponent,
  UIManager,
  findNodeHandle,
} from "react-native";

const COMPONENT_NAME = "RNKLineView";
const RNKLineView = requireNativeComponent(COMPONENT_NAME);

const getCommands = () => {
  const viewManagerConfig = UIManager.getViewManagerConfig
    ? UIManager.getViewManagerConfig(COMPONENT_NAME)
    : UIManager[COMPONENT_NAME];
  return viewManagerConfig?.Commands || {};
};

export const appendCandle = (ref, candle) => {
  const commandId = getCommands().appendCandle;
  if (commandId == null) {
    console.warn("[KLineView][appendCandle] command not available");
    return;
  }
  const node = findNodeHandle(ref?.current ?? ref);
  if (node == null) {
    console.warn("[KLineView][appendCandle] invalid ref, no nodeHandle");
    return;
  }
  UIManager.dispatchViewManagerCommand(node, commandId, [candle]);
};

export default RNKLineView;
