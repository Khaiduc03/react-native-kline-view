import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import {
  requireNativeComponent,
  UIManager,
  findNodeHandle,
  Platform,
  NativeModules,
  processColor,
} from "react-native";

const COMPONENT_NAME = "RNKLineView";
const NativeRNKLineView = requireNativeComponent(COMPONENT_NAME);

function toColorNumber(color, fallback) {
  const value = processColor(color);
  return typeof value === "number" ? value : fallback;
}

function normalizeCandles(candles) {
  let previousId = 0;
  return candles.map((candle, index) => ({
    ...(() => {
      const open = Number(
        Number.isFinite(candle?.open) ? candle.open : candle?.close ?? 0
      );
      const close = Number(
        Number.isFinite(candle?.close) ? candle.close : candle?.open ?? open
      );
      const highRaw = Number(
        Number.isFinite(candle?.high)
          ? candle.high
          : Math.max(open, close)
      );
      const lowRaw = Number(
        Number.isFinite(candle?.low)
          ? candle.low
          : Math.min(open, close)
      );
      const high = Math.max(highRaw, open, close);
      const low = Math.min(lowRaw, open, close);

      let nextId = Number.isFinite(candle?.id) ? Number(candle.id) : previousId + 60_000;
      if (nextId <= previousId) {
        nextId = previousId + 60_000;
      }
      previousId = nextId;

      const volume = Number(
        Number.isFinite(candle?.vol)
          ? candle.vol
          : Number.isFinite(candle?.volume)
          ? candle.volume
          : 0
      );

      const selectedItemList = Array.isArray(candle?.selectedItemList)
        ? candle.selectedItemList
        : [
            { title: "O:", detail: open.toFixed(2) },
            { title: "H:", detail: high.toFixed(2) },
            { title: "L:", detail: low.toFixed(2) },
            { title: "C:", detail: close.toFixed(2) },
            { title: "VOL:", detail: volume.toFixed(2) },
          ];

      return {
        ...candle,
        id: nextId,
        dateString:
          typeof candle?.dateString === "string" && candle.dateString.length > 0
            ? candle.dateString
            : String(nextId),
        open,
        high,
        low,
        close,
        vol: volume,
        selectedItemList,
      };
    })(),
  }));
}

function buildOptionListFromCandles(candles) {
  const configList = {
    colorList: {
      increaseColor: toColorNumber("#1E9E69", 0xff1e9e69),
      decreaseColor: toColorNumber("#F04438", 0xfff04438),
    },
    targetColorList: [
      toColorNumber("#F59E0B", 0xfff59e0b),
      toColorNumber("#10B981", 0xff10b981),
      toColorNumber("#3B82F6", 0xff3b82f6),
      toColorNumber("#F97316", 0xfff97316),
      toColorNumber("#8B5CF6", 0xff8b5cf6),
      toColorNumber("#06B6D4", 0xff06b6d4),
      toColorNumber("#EC4899", 0xffec4899),
      toColorNumber("#22C55E", 0xff22c55e),
      toColorNumber("#EF4444", 0xffef4444),
    ],
    minuteLineColor: toColorNumber("#2563EB", 0xff2563eb),
    minuteGradientColorList: [
      toColorNumber("rgba(37,99,235,0.25)", 0x402563eb),
      toColorNumber("rgba(37,99,235,0.12)", 0x1f2563eb),
      toColorNumber("rgba(37,99,235,0)", 0x002563eb),
    ],
    minuteGradientLocationList: [0, 0.6, 1],
    backgroundColor: toColorNumber("#FFFFFF", 0xffffffff),
    textColor: toColorNumber("#475467", 0xff475467),
    gridColor: toColorNumber("#EAECF0", 0xffeaecf0),
    candleTextColor: toColorNumber("#101828", 0xff101828),
    panelBackgroundColor: toColorNumber("#FFFFFF", 0xffffffff),
    panelBorderColor: toColorNumber("#D0D5DD", 0xffd0d5dd),
    selectedPointContainerColor: toColorNumber("#000000", 0xff000000),
    selectedPointContentColor: toColorNumber("#000000", 0xff000000),
    cursorStyleEnabled: true,
    cursorInnerRadiusPx: 3,
    cursorOuterRadiusPx: 8,
    cursorInnerColor: toColorNumber("#FF783E", 0xffff783e),
    cursorOuterColor: toColorNumber("rgba(48,48,48,0.07)", 0x12303030),
    cursorOuterBlurRadiusPx: 0,
    cursorBorderWidthPx: 0,
    cursorBorderColor: toColorNumber("#1F2937", 0xff1f2937),
    cursorInnerBorderWidthPx: 0.5,
    cursorInnerBorderColor: toColorNumber("#F8FAFC", 0xfff8fafc),
    closePriceCenterBackgroundColor: toColorNumber("#FFFFFF", 0xffffffff),
    closePriceCenterBorderColor: toColorNumber("#98A2B3", 0xff98a2b3),
    closePriceCenterTriangleColor: toColorNumber("#98A2B3", 0xff98a2b3),
    closePriceCenterSeparatorColor: toColorNumber("#98A2B3", 0xff98a2b3),
    closePriceRightBackgroundColor: toColorNumber("#FFFFFF", 0xffffffff),
    closePriceRightSeparatorColor: toColorNumber("#98A2B3", 0xff98a2b3),
    closePriceRightLightLottieFloder: "",
    closePriceRightLightLottieScale: 0,
    closePriceRightLightLottieSource: "",
    panelGradientColorList: [toColorNumber("#FFFFFF", 0xffffffff)],
    panelGradientLocationList: [1],
    mainFlex: 0.72,
    volumeFlex: 0.2,
    paddingTop: 26,
    paddingBottom: 20,
    paddingRight: 54,
    itemWidth: 11,
    candleWidth: 8,
    minuteVolumeCandleColor: toColorNumber("#2563EB", 0xff2563eb),
    minuteVolumeCandleWidth: 2,
    macdCandleWidth: 3,
    headerTextFontSize: 11,
    rightTextFontSize: 10,
    candleTextFontSize: 10,
    panelTextFontSize: 10,
    panelMinWidth: 48,
    fontFamily: "",
    rightOffsetCandles: 0,
  };

  return {
    modelArray: normalizeCandles(candles),
    shouldScrollToEnd: true,
    targetList: {
      maList: [],
      maVolumeList: [],
      bollN: "20",
      bollP: "2",
      macdS: "12",
      macdL: "26",
      macdM: "9",
      kdjN: "14",
      kdjM1: "1",
      kdjM2: "3",
      rsiList: [],
      wrList: [],
    },
    price: 2,
    volume: 2,
    primary: 0,
    second: 0,
    time: 1,
    configList,
    drawList: {
      shotBackgroundColor: toColorNumber("rgba(0,0,0,0)", 0x00000000),
      drawType: 0,
      shouldReloadDrawItemIndex: 0,
      drawShouldContinue: false,
      drawColor: toColorNumber("#2563EB", 0xff2563eb),
      drawLineHeight: 1,
      drawDashWidth: 1,
      drawDashSpace: 1,
      drawIsLock: false,
      shouldFixDraw: false,
      shouldClearDraw: false,
    },
  };
}

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
  const { optionList, candles, ...restProps } = props;
  const nativeRef = useRef(null);
  const resolvedOptionList = useMemo(() => {
    if (typeof optionList === "string" && optionList.trim().length > 0) {
      return optionList;
    }

    if (Array.isArray(candles)) {
      return JSON.stringify(buildOptionListFromCandles(candles));
    }

    if (__DEV__) {
      console.warn(
        "[RNKLineView] Missing required candles when optionList is not provided. Pass optionList or candles."
      );
    }
    return null;
  }, [candles, optionList]);

  useImperativeHandle(ref, () => ({
    setData: (candles) => runCommand(nativeRef, "setData", candles),
    appendCandle: (candle) => runCommand(nativeRef, "appendCandle", candle),
    updateLastCandle: (candle) =>
      runCommand(nativeRef, "updateLastCandle", candle),
    unPredictionSelect: () => runCommand(nativeRef, "unPredictionSelect", null),
  }));

  if (!resolvedOptionList) {
    return null;
  }

  return (
    <NativeRNKLineView
      ref={nativeRef}
      {...restProps}
      optionList={resolvedOptionList}
    />
  );
});

export default RNKLineView;
