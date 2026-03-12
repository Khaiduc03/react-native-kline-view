import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
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

function normalizeOneCandle(candle, previousId = 0) {
  const open = Number(
    Number.isFinite(candle?.open) ? candle.open : candle?.close ?? 0
  );
  const close = Number(
    Number.isFinite(candle?.close) ? candle.close : candle?.open ?? open
  );
  const highRaw = Number(
    Number.isFinite(candle?.high) ? candle.high : Math.max(open, close)
  );
  const lowRaw = Number(
    Number.isFinite(candle?.low) ? candle.low : Math.min(open, close)
  );
  const high = Math.max(highRaw, open, close);
  const low = Math.min(lowRaw, open, close);

  let nextId = Number.isFinite(candle?.id) ? Number(candle.id) : previousId + 60_000;
  if (nextId <= previousId) {
    nextId = previousId + 60_000;
  }

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
}

function normalizeCandles(candles) {
  let previousId = 0;
  return candles.map((candle) => {
    const next = normalizeOneCandle(candle, previousId);
    previousId = next.id;
    return next;
  });
}

function candlesSignature(candles) {
  if (!Array.isArray(candles) || candles.length === 0) {
    return "0:0:0:0";
  }
  const first = candles[0] ?? {};
  const last = candles[candles.length - 1] ?? {};
  return [
    candles.length,
    Number(first.id ?? 0),
    Number(last.id ?? 0),
    Number(last.close ?? 0),
  ].join(":");
}

const DEFAULT_TARGET_LIST = {
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
};

const DEFAULT_CONFIG_LIST = {
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

const DEFAULT_DRAW_LIST = {
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
};

const DEFAULT_INDICATOR_PERIODS = {
  ma: [5, 10, 20],
  ema: [10, 30, 60],
  maVolume: [5, 10],
  rsi: [6, 12, 24],
  wr: [14],
  bollN: 20,
  bollP: 2,
  macdS: 12,
  macdL: 26,
  macdM: 9,
  kdjN: 14,
  kdjM1: 1,
  kdjM2: 3,
};

const PRESET_OVERRIDES = {
  simple: {},
  trading: {
    indicator: {
      price: 2,
      volume: 2,
      time: 1,
      primary: 1,
      second: 3,
    },
  },
  binance: {
    indicator: {
      price: 2,
      volume: 3,
      time: 1,
      primary: 1,
      second: 3,
      ema: {
        enabled: true,
        periods: [10, 30, 60],
      },
    },
    indicatorColors: {
      ema: ["#f97316", "#06b6d4", "#8b5cf6"],
    },
    configList: {
      colorList: {
        increaseColor: toColorNumber("#16A34A", 0xff16a34a),
        decreaseColor: toColorNumber("#EF4444", 0xffef4444),
      },
      targetColorList: [
        toColorNumber("#eab308", 0xffeab308),
        toColorNumber("#22c55e", 0xff22c55e),
        toColorNumber("#a855f7", 0xffa855f7),
        toColorNumber("#38bdf8", 0xff38bdf8),
        toColorNumber("#f97316", 0xfff97316),
        toColorNumber("#6366f1", 0xff6366f1),
      ],
      minuteGradientColorList: [
        toColorNumber("rgba(37,99,235,0.25)", 0x402563eb),
        toColorNumber("rgba(37,99,235,0.10)", 0x1a2563eb),
        toColorNumber("rgba(37,99,235,0)", 0x002563eb),
      ],
      minuteGradientLocationList: [0, 0.6, 1],
      backgroundColor: toColorNumber("#ffffff", 0xffffffff),
      textColor: toColorNumber("#475467", 0xff475467),
      gridColor: toColorNumber("#e2e8f0", 0xffe2e8f0),
      candleTextColor: toColorNumber("#0f172a", 0xff0f172a),
      panelBackgroundColor: toColorNumber("#ffffff", 0xffffffff),
      panelBorderColor: toColorNumber("#cbd5e1", 0xffcbd5e1),
      panelGradientColorList: [toColorNumber("#ffffff", 0xffffffff)],
      panelGradientLocationList: [1],
      closePriceCenterBackgroundColor: toColorNumber("#ffffff", 0xffffffff),
      closePriceCenterBorderColor: toColorNumber("#94a3b8", 0xff94a3b8),
      closePriceCenterTriangleColor: toColorNumber("#94a3b8", 0xff94a3b8),
      closePriceCenterSeparatorColor: toColorNumber("#94a3b8", 0xff94a3b8),
      closePriceRightBackgroundColor: toColorNumber("#ffffff", 0xffffffff),
      closePriceRightSeparatorColor: toColorNumber("#94a3b8", 0xff94a3b8),
      closePriceRightLightLottieFloder: "",
      closePriceRightLightLottieScale: 0,
      closePriceRightLightLottieSource: "",
      mainFlex: 0.72,
      volumeFlex: 0.14,
      paddingTop: 26,
      paddingBottom: 20,
      paddingRight: 54,
      itemWidth: 11,
      candleWidth: 8,
      minuteVolumeCandleWidth: 2,
      macdCandleWidth: 3,
      headerTextFontSize: 11,
      rightTextFontSize: 10,
      candleTextFontSize: 10,
      panelTextFontSize: 10,
      panelMinWidth: 48,
      fontFamily: "",
      rightOffsetCandles: 0,
    },
  },
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, override) {
  if (override === undefined) return base;
  if (Array.isArray(base) || Array.isArray(override)) {
    return Array.isArray(override) ? override : base;
  }
  if (!isObject(base) || !isObject(override)) {
    return override;
  }

  const output = { ...base };
  Object.keys(override).forEach((key) => {
    output[key] = deepMerge(base[key], override[key]);
  });
  return output;
}

function toResolvedColor(value, fallback) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return toColorNumber(value, fallback);
  return fallback;
}

function normalizeConfigColors(configList) {
  const next = { ...configList };
  Object.keys(next).forEach((key) => {
    const value = next[key];
    if (key === "colorList" && isObject(value)) {
      next[key] = {
        ...value,
        increaseColor: toResolvedColor(
          value.increaseColor,
          DEFAULT_CONFIG_LIST.colorList.increaseColor
        ),
        decreaseColor: toResolvedColor(
          value.decreaseColor,
          DEFAULT_CONFIG_LIST.colorList.decreaseColor
        ),
      };
      return;
    }
    if (key.endsWith("ColorList") && Array.isArray(value)) {
      next[key] = value.map((item, index) =>
        toResolvedColor(item, value[index] ?? 0)
      );
      return;
    }
    if (key.endsWith("Color")) {
      next[key] = toResolvedColor(value, DEFAULT_CONFIG_LIST[key] ?? 0);
    }
  });
  return next;
}

function toPeriod(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function toIndex(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function uniqPositiveIntegers(list, fallback) {
  const values = Array.from(
    new Set(
      (Array.isArray(list) ? list : [])
        .map((value) => toPeriod(value, 0))
        .filter((value) => value > 0)
    )
  );
  return values.length > 0 ? values : fallback;
}

function listPeriodsFromItems(items, fallback) {
  if (!Array.isArray(items)) {
    return fallback;
  }
  return uniqPositiveIntegers(
    items.map((item) => (item && typeof item.title === "string" ? item.title : item?.period)),
    fallback
  );
}

function listPeriodsFromItemsByKind(items, fallback, kind) {
  if (!Array.isArray(items)) {
    return fallback;
  }
  const filtered = items.filter((item) => {
    const itemKind = String(item?.kind ?? "ma").toLowerCase();
    return kind === "ma" ? itemKind !== "ema" : itemKind === kind;
  });
  if (filtered.length === 0) {
    return fallback;
  }
  return uniqPositiveIntegers(
    filtered.map((item) =>
      item && typeof item.title === "string" ? item.title : item?.period
    ),
    fallback
  );
}

function buildTargetItemsFromPeriods(periods, selected = true) {
  return periods.map((period, index) => ({
    title: String(period),
    selected,
    index,
  }));
}

function extractIndicatorPeriods(targetList, indicatorConfig) {
  const emaEnabled = indicatorConfig?.ema?.enabled === true;
  const mainConfig = isObject(indicatorConfig?.main) ? indicatorConfig.main : null;
  const maEnabled =
    typeof mainConfig?.ma === "boolean"
      ? mainConfig.ma
      : indicatorConfig?.primary === 1;
  const maPeriods = maEnabled
    ? listPeriodsFromItemsByKind(
        targetList?.maList,
        DEFAULT_INDICATOR_PERIODS.ma,
        "ma"
      )
    : [];
  const emaPeriods = emaEnabled
    ? uniqPositiveIntegers(
        indicatorConfig?.ema?.periods,
        DEFAULT_INDICATOR_PERIODS.ema
      )
    : [];
  const maVolumePeriods = listPeriodsFromItems(
    targetList?.maVolumeList,
    DEFAULT_INDICATOR_PERIODS.maVolume
  );
  const rsiPeriods = listPeriodsFromItems(
    targetList?.rsiList,
    DEFAULT_INDICATOR_PERIODS.rsi
  );
  const wrPeriods = listPeriodsFromItems(
    targetList?.wrList,
    DEFAULT_INDICATOR_PERIODS.wr
  );

  return {
    maEnabled,
    emaEnabled,
    maPeriods,
    emaPeriods,
    mainLineDefs: [
      ...maPeriods.map((period) => ({ kind: "ma", period })),
      ...emaPeriods.map((period) => ({ kind: "ema", period })),
    ].map((item, index) => ({ ...item, index })),
    maVolumePeriods,
    rsiPeriods,
    wrPeriods,
    bollN: toPeriod(targetList?.bollN, DEFAULT_INDICATOR_PERIODS.bollN),
    bollP: Number.isFinite(Number(targetList?.bollP))
      ? Number(targetList?.bollP)
      : DEFAULT_INDICATOR_PERIODS.bollP,
    macdS: toPeriod(targetList?.macdS, DEFAULT_INDICATOR_PERIODS.macdS),
    macdL: toPeriod(targetList?.macdL, DEFAULT_INDICATOR_PERIODS.macdL),
    macdM: toPeriod(targetList?.macdM, DEFAULT_INDICATOR_PERIODS.macdM),
    kdjN: toPeriod(targetList?.kdjN, DEFAULT_INDICATOR_PERIODS.kdjN),
    kdjM1: toPeriod(targetList?.kdjM1, DEFAULT_INDICATOR_PERIODS.kdjM1),
    kdjM2: toPeriod(targetList?.kdjM2, DEFAULT_INDICATOR_PERIODS.kdjM2),
  };
}

function resolveTargetList(targetList, periods, autoCompute) {
  const base = deepMerge(DEFAULT_TARGET_LIST, targetList ?? {});
  const fallbackEnabled = autoCompute !== false;

  const selectedStateMap = new Map();
  if (Array.isArray(base.maList)) {
    base.maList.forEach((item) => {
      const period = toPeriod(item?.period ?? item?.title, 0);
      if (period <= 0) {
        return;
      }
      const kind = String(item?.kind ?? "ma").toLowerCase() === "ema" ? "ema" : "ma";
      selectedStateMap.set(`${kind}:${period}`, item?.selected !== false);
    });
  }

  if (fallbackEnabled) {
    base.maList = periods.mainLineDefs.map((item) => {
      const key = `${item.kind}:${item.period}`;
      return {
        title: String(item.period),
        period: item.period,
        kind: item.kind,
        selected: selectedStateMap.has(key) ? selectedStateMap.get(key) : true,
        index: item.index,
      };
    });
  }
  if (
    fallbackEnabled &&
    (!Array.isArray(base.maVolumeList) || base.maVolumeList.length === 0)
  ) {
    base.maVolumeList = buildTargetItemsFromPeriods(periods.maVolumePeriods, true);
  }
  if (fallbackEnabled && (!Array.isArray(base.rsiList) || base.rsiList.length === 0)) {
    base.rsiList = buildTargetItemsFromPeriods(periods.rsiPeriods, true);
  }
  if (fallbackEnabled && (!Array.isArray(base.wrList) || base.wrList.length === 0)) {
    base.wrList = buildTargetItemsFromPeriods(periods.wrPeriods, true);
  }

  base.bollN = String(periods.bollN);
  base.bollP = String(periods.bollP);
  base.macdS = String(periods.macdS);
  base.macdL = String(periods.macdL);
  base.macdM = String(periods.macdM);
  base.kdjN = String(periods.kdjN);
  base.kdjM1 = String(periods.kdjM1);
  base.kdjM2 = String(periods.kdjM2);
  return base;
}

function emaSeries(values, period) {
  const alpha = 2 / (period + 1);
  let previous = values[0] ?? 0;
  return values.map((value, index) => {
    if (index === 0) {
      previous = value;
      return value;
    }
    previous = value * alpha + previous * (1 - alpha);
    return previous;
  });
}

function smaAt(values, index, period) {
  if (period <= 1) {
    return values[index] ?? 0;
  }
  if (index + 1 < period) {
    return values[index] ?? 0;
  }
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) {
    sum += values[i] ?? 0;
  }
  return sum / period;
}

function stdevAt(values, index, period, mean) {
  if (index + 1 < period || period <= 1) {
    return 0;
  }
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) {
    const diff = (values[i] ?? 0) - mean;
    sum += diff * diff;
  }
  return Math.sqrt(sum / period);
}

function rsiSeries(closes, period) {
  const output = new Array(closes.length).fill(0);
  if (closes.length === 0) return output;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < closes.length; i += 1) {
    const change = (closes[i] ?? 0) - (closes[i - 1] ?? 0);
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    if (i < period) {
      output[i] = 0;
      continue;
    }
    if (avgLoss === 0) {
      output[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      output[i] = 100 - 100 / (1 + rs);
    }
  }
  return output;
}

function wrSeries(highs, lows, closes, period) {
  return closes.map((close, index) => {
    if (index + 1 < period) {
      return 0;
    }
    let highest = -Infinity;
    let lowest = Infinity;
    for (let i = index - period + 1; i <= index; i += 1) {
      highest = Math.max(highest, highs[i] ?? close);
      lowest = Math.min(lowest, lows[i] ?? close);
    }
    if (highest === lowest) {
      return 0;
    }
    return (-100 * (highest - close)) / (highest - lowest);
  });
}

function kdjSeries(highs, lows, closes, nPeriod, m1, m2) {
  const k = new Array(closes.length).fill(0);
  const d = new Array(closes.length).fill(0);
  const j = new Array(closes.length).fill(0);
  let prevK = 50;
  let prevD = 50;
  for (let index = 0; index < closes.length; index += 1) {
    const start = Math.max(0, index - nPeriod + 1);
    let highest = -Infinity;
    let lowest = Infinity;
    for (let i = start; i <= index; i += 1) {
      highest = Math.max(highest, highs[i] ?? closes[index] ?? 0);
      lowest = Math.min(lowest, lows[i] ?? closes[index] ?? 0);
    }
    const range = highest - lowest;
    const rsv = range === 0 ? 0 : (((closes[index] ?? 0) - lowest) / range) * 100;
    const currentK = ((m1 - 1) * prevK + rsv) / m1;
    const currentD = ((m2 - 1) * prevD + currentK) / m2;
    const currentJ = 3 * currentK - 2 * currentD;
    if (index < nPeriod - 1) {
      k[index] = 0;
      d[index] = 0;
      j[index] = 0;
    } else {
      k[index] = currentK;
      d[index] = currentD;
      j[index] = currentJ;
    }
    prevK = currentK;
    prevD = currentD;
  }
  return { k, d, j };
}

function shouldUseInputValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return true;
  if (typeof value === "number") return Number.isFinite(value);
  return false;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function targetItemKey(item, fallbackIndex = 0) {
  const period = toPeriod(item?.period ?? item?.title, 0);
  if (period > 0) {
    return `p:${period}`;
  }
  const index = toIndex(item?.index, -1);
  if (index >= 0) {
    return `i:${index}`;
  }
  if (typeof item?.title === "string" && item.title.length > 0) {
    return `t:${item.title}`;
  }
  return `f:${fallbackIndex}`;
}

function mainLineKey(item) {
  const kind = String(item?.kind ?? "ma").toLowerCase() === "ema" ? "ema" : "ma";
  const period = toPeriod(item?.period ?? item?.title, 0);
  if (period <= 0) {
    return null;
  }
  return `${kind}:${period}`;
}

function mergeMainLinePreferInput(inputList, computedList) {
  if (!Array.isArray(inputList) || inputList.length === 0) {
    return computedList;
  }
  const map = new Map();
  inputList.forEach((item) => {
    const key = mainLineKey(item);
    if (key) {
      map.set(key, item);
    }
  });
  return computedList.map((item) => {
    const key = mainLineKey(item);
    if (!key) {
      return item;
    }
    const existing = map.get(key);
    if (!existing) {
      return item;
    }
    const nextValue = isFiniteNumber(existing.value) ? existing.value : item.value;
    return {
      ...item,
      ...existing,
      value: nextValue,
      title: String(item.period),
      period: item.period,
      kind: item.kind,
      index: item.index,
    };
  });
}

function mergeTargetListPreferInput(inputList, computedList) {
  if (!Array.isArray(inputList) || inputList.length === 0) {
    return computedList;
  }
  const map = new Map();
  inputList.forEach((item, index) => {
    const key = targetItemKey(item, index);
    map.set(key, item);
  });
  return computedList.map((item, index) => {
    const key = targetItemKey(item, index);
    const existing = map.get(key);
    if (!existing) {
      return item;
    }
    const nextValue = isFiniteNumber(existing.value) ? existing.value : item.value;
    return {
      ...item,
      ...existing,
      value: nextValue,
      title: String(item.title),
      index: item.index,
    };
  });
}

function applyMainLineColors(configList, targetList, indicatorColors) {
  const next = { ...configList };
  const currentColors = Array.isArray(next.targetColorList)
    ? [...next.targetColorList]
    : [];
  const maColors = Array.isArray(indicatorColors?.ma) ? indicatorColors.ma : [];
  const emaColors = Array.isArray(indicatorColors?.ema) ? indicatorColors.ema : [];
  let maColorIndex = 0;
  let emaColorIndex = 0;
  (targetList?.maList ?? []).forEach((item) => {
    const index = toIndex(item?.index, -1);
    if (index < 0) {
      return;
    }
    const isEMA = String(item?.kind ?? "ma").toLowerCase() === "ema";
    const colorValue = isEMA ? emaColors[emaColorIndex++] : maColors[maColorIndex++];
    if (colorValue === undefined) {
      return;
    }
    currentColors[index] = toResolvedColor(colorValue, currentColors[index] ?? 0);
  });
  next.targetColorList = currentColors;
  return next;
}

function computeIndicators(candles, indicatorConfig, targetList) {
  const computeMode = indicatorConfig?.computeMode ?? "prefer_input";
  const preferInput = computeMode !== "always";
  const periods = extractIndicatorPeriods(targetList, indicatorConfig);
  const closes = candles.map((item) => Number(item.close ?? 0));
  const highs = candles.map((item) => Number(item.high ?? 0));
  const lows = candles.map((item) => Number(item.low ?? 0));
  const volumes = candles.map((item) => Number(item.vol ?? 0));

  const emaShort = emaSeries(closes, periods.macdS);
  const emaLong = emaSeries(closes, periods.macdL);
  const difSeries = closes.map((_, index) => emaShort[index] - emaLong[index]);
  const deaSeries = emaSeries(difSeries, periods.macdM);
  const macdSeries = difSeries.map((value, index) => (value - (deaSeries[index] ?? 0)) * 2);
  const kdj = kdjSeries(
    highs,
    lows,
    closes,
    periods.kdjN,
    periods.kdjM1,
    periods.kdjM2
  );
  const rsiMap = periods.rsiPeriods.map((period) => ({
    period,
    values: rsiSeries(closes, period),
  }));
  const wrMap = periods.wrPeriods.map((period) => ({
    period,
    values: wrSeries(highs, lows, closes, period),
  }));
  const emaMap = periods.emaPeriods.map((period) => ({
    period,
    values: emaSeries(closes, period),
  }));

  return candles.map((item, index) => {
    const maList = periods.mainLineDefs.map((line) => {
      const emaSeriesValue = emaMap.find((entry) => entry.period === line.period);
      const value =
        line.kind === "ema"
          ? emaSeriesValue?.values[index] ?? 0
          : smaAt(closes, index, line.period);
      return {
        title: String(line.period),
        period: line.period,
        kind: line.kind,
        value,
        selected: true,
        index: line.index,
      };
    });
    const maVolumeList = periods.maVolumePeriods.map((period, valueIndex) => ({
      title: String(period),
      value: smaAt(volumes, index, period),
      selected: true,
      index: valueIndex,
    }));
    const bollMb = smaAt(closes, index, periods.bollN);
    const bollStdev = stdevAt(closes, index, periods.bollN, bollMb);
    const bollUp = bollMb + periods.bollP * bollStdev;
    const bollDn = bollMb - periods.bollP * bollStdev;
    const rsiList = rsiMap.map((entry, valueIndex) => ({
      title: String(entry.period),
      value: entry.values[index] ?? 0,
      selected: true,
      index: valueIndex,
    }));
    const wrList = wrMap.map((entry, valueIndex) => ({
      title: String(entry.period),
      value: entry.values[index] ?? 0,
      selected: true,
      index: valueIndex,
    }));

    const nextItem = {
      ...item,
      maList: maList,
      maVolumeList: maVolumeList,
      bollMb:
        preferInput && shouldUseInputValue(item.bollMb) ? item.bollMb : bollMb,
      bollUp:
        preferInput && shouldUseInputValue(item.bollUp) ? item.bollUp : bollUp,
      bollDn:
        preferInput && shouldUseInputValue(item.bollDn) ? item.bollDn : bollDn,
      macdDif:
        preferInput && shouldUseInputValue(item.macdDif)
          ? item.macdDif
          : difSeries[index] ?? 0,
      macdDea:
        preferInput && shouldUseInputValue(item.macdDea)
          ? item.macdDea
          : deaSeries[index] ?? 0,
      macdValue:
        preferInput && shouldUseInputValue(item.macdValue)
          ? item.macdValue
          : macdSeries[index] ?? 0,
      kdjK:
        preferInput && shouldUseInputValue(item.kdjK)
          ? item.kdjK
          : kdj.k[index] ?? 0,
      kdjD:
        preferInput && shouldUseInputValue(item.kdjD)
          ? item.kdjD
          : kdj.d[index] ?? 0,
      kdjJ:
        preferInput && shouldUseInputValue(item.kdjJ)
          ? item.kdjJ
          : kdj.j[index] ?? 0,
      rsiList: rsiList,
      wrList: wrList,
    };
    if (preferInput) {
      nextItem.maList = mergeMainLinePreferInput(item.maList, maList);
      nextItem.maVolumeList = mergeTargetListPreferInput(
        item.maVolumeList,
        maVolumeList
      );
      nextItem.rsiList = mergeTargetListPreferInput(item.rsiList, rsiList);
      nextItem.wrList = mergeTargetListPreferInput(item.wrList, wrList);
    }
    return nextItem;
  });
}

function computeTailWindowSize(indicatorConfig, targetList) {
  const periods = extractIndicatorPeriods(targetList, indicatorConfig);
  const maxMainPeriod = Math.max(0, ...periods.mainLineDefs.map((item) => item.period));
  const maxRsi = Math.max(0, ...periods.rsiPeriods);
  const maxWr = Math.max(0, ...periods.wrPeriods);
  const maxPeriod = Math.max(
    periods.bollN,
    periods.macdL + periods.macdM,
    periods.kdjN,
    maxMainPeriod,
    maxRsi,
    maxWr,
    20
  );
  return Math.max(120, maxPeriod * 3 + 40);
}

function computeRuntimeCandles({
  rawCandles,
  currentComputed,
  indicatorConfig,
  targetList,
  autoCompute,
  forceFull = false,
}) {
  const normalizedRaw = Array.isArray(rawCandles) ? rawCandles : [];
  if (!autoCompute) {
    return normalizedRaw;
  }
  if (forceFull || normalizedRaw.length === 0 || !Array.isArray(currentComputed)) {
    return computeIndicators(normalizedRaw, indicatorConfig, targetList);
  }

  const tailSize = computeTailWindowSize(indicatorConfig, targetList);
  const start = Math.max(0, normalizedRaw.length - tailSize);
  if (start === 0 || currentComputed.length < start) {
    return computeIndicators(normalizedRaw, indicatorConfig, targetList);
  }

  const prefix = currentComputed.slice(0, start);
  const tailRaw = normalizedRaw.slice(start);
  const tailComputed = computeIndicators(tailRaw, indicatorConfig, targetList);
  return [...prefix, ...tailComputed];
}

function composeOptionList({
  candles,
  preserveModelArray,
  preset,
  theme,
  layout,
  indicator,
  draw,
  prediction,
  interaction,
  format,
  advanced,
}) {
  const presetConfig = PRESET_OVERRIDES[preset] ?? {};
  const resolvedIndicator = deepMerge(presetConfig.indicator ?? {}, indicator ?? {});
  const mainConfig = isObject(resolvedIndicator?.main) ? resolvedIndicator.main : null;
  const emaOverlayEnabled = resolvedIndicator?.ema?.enabled === true;
  const showMainMA =
    typeof mainConfig?.ma === "boolean"
      ? mainConfig.ma
      : resolvedIndicator?.primary === 1 || emaOverlayEnabled;
  const showMainMAResolved = showMainMA || emaOverlayEnabled;
  const showMainBOLL =
    typeof mainConfig?.boll === "boolean"
      ? mainConfig.boll
      : resolvedIndicator?.primary === 2;
  const resolvedPrimary = showMainMAResolved ? 1 : showMainBOLL ? 2 : -1;
  const autoCompute = resolvedIndicator?.autoCompute !== false;
  const periods = extractIndicatorPeriods(
    resolvedIndicator?.targetList ?? {},
    resolvedIndicator
  );
  const targetList = resolveTargetList(resolvedIndicator?.targetList, periods, autoCompute);
  let modelArray = [];
  if (preserveModelArray !== true) {
    modelArray = normalizeCandles(candles);
    if (autoCompute) {
      modelArray = computeIndicators(modelArray, resolvedIndicator, targetList);
    }
  }
  const themeIndicatorColors = theme?.indicatorColors ?? {};
  const presetIndicatorColors = presetConfig.indicatorColors ?? {};
  const themeConfigSafe = isObject(theme) ? { ...theme } : {};
  if (isObject(themeConfigSafe) && "indicatorColors" in themeConfigSafe) {
    delete themeConfigSafe.indicatorColors;
  }

  const baseConfigList = deepMerge(
    DEFAULT_CONFIG_LIST,
    deepMerge(
      deepMerge(
        deepMerge(presetConfig.configList ?? {}, themeConfigSafe ?? {}),
        layout ?? {}
      ),
      interaction?.configList ?? {}
    )
  );
  const configList = applyMainLineColors(
    normalizeConfigColors(baseConfigList),
    targetList,
    deepMerge(presetIndicatorColors, themeIndicatorColors)
  );
  const drawList = deepMerge(DEFAULT_DRAW_LIST, draw ?? {});

  const baseOptionList = {
    modelArray,
    preserveModelArray: preserveModelArray === true,
    shouldScrollToEnd: interaction?.shouldScrollToEnd ?? true,
    targetList,
    price: format?.price ?? resolvedIndicator?.price ?? 2,
    volume: format?.volume ?? resolvedIndicator?.volume ?? 2,
    primary: resolvedPrimary,
    showMainMA: showMainMAResolved,
    showMainBOLL,
    second: resolvedIndicator?.second ?? 0,
    time: format?.time ?? resolvedIndicator?.time ?? 1,
    configList,
    drawList,
    predictionList: prediction?.predictionList,
    predictionStartTime: prediction?.predictionStartTime,
    predictionEntry: prediction?.predictionEntry,
    predictionStopLoss: prediction?.predictionStopLoss,
    predictionBias: prediction?.predictionBias,
    predictionEntryZones: prediction?.predictionEntryZones,
    predictionMinCandles: prediction?.predictionMinCandles,
  };

  return deepMerge(baseOptionList, advanced ?? {});
}

function mapSubTypeToSecond(type) {
  switch (String(type ?? "").toLowerCase()) {
    case "macd":
      return 3;
    case "kdj":
      return 4;
    case "rsi":
      return 5;
    case "wr":
      return 6;
    default:
      return -1;
  }
}

function toLegacyPropsConfig({
  initialData,
  theme,
  mainIndicators,
  subCharts,
  volume,
  interaction,
}) {
  const enabledSub = (Array.isArray(subCharts) ? subCharts : []).filter(
    (item) => item && item.enabled !== false
  );
  const second = enabledSub.length > 0 ? mapSubTypeToSecond(enabledSub[0].type) : -1;

  const maEnabled = mainIndicators?.ma?.enabled !== false;
  const emaEnabled = mainIndicators?.ema?.enabled === true;
  const bollEnabled = mainIndicators?.boll?.enabled === true;
  const resolvedPrimary = maEnabled || emaEnabled ? 1 : bollEnabled ? 2 : -1;

  const translatedTheme = {
    colorList: {
      increaseColor: theme?.candle?.upColor,
      decreaseColor: theme?.candle?.downColor,
    },
    minuteVolumeCandleColor: theme?.volume?.barColor,
    gridColor: theme?.grid?.lineColor,
    textColor: theme?.axis?.textColor,
    panelBackgroundColor: theme?.panel?.backgroundColor,
    panelBorderColor: theme?.panel?.borderColor,
    targetColorList: theme?.subIndicator?.colors,
    indicatorColors: {
      ma: theme?.mainIndicator?.maColors,
      ema: theme?.mainIndicator?.emaColors,
    },
    cursorStyleEnabled:
      typeof theme?.crosshair?.enabled === "boolean"
        ? theme.crosshair.enabled
        : undefined,
    cursorInnerColor: theme?.crosshair?.innerColor,
    cursorOuterColor: theme?.crosshair?.outerColor,
    cursorInnerRadiusPx: theme?.crosshair?.innerRadius,
    cursorOuterRadiusPx: theme?.crosshair?.outerRadius,
  };

  return {
    candles: Array.isArray(initialData) ? initialData : [],
    theme: translatedTheme,
    indicator: {
      primary: resolvedPrimary,
      main: {
        ma: maEnabled,
        boll: bollEnabled,
      },
      second,
      ema: {
        enabled: emaEnabled,
        periods: Array.isArray(mainIndicators?.ema?.periods)
          ? mainIndicators.ema.periods
          : DEFAULT_INDICATOR_PERIODS.ema,
      },
      targetList: {
        maList: buildTargetItemsFromPeriods(
          Array.isArray(mainIndicators?.ma?.periods)
            ? mainIndicators.ma.periods
            : DEFAULT_INDICATOR_PERIODS.ma,
          true
        ),
        maVolumeList: buildTargetItemsFromPeriods(
          Array.isArray(volume?.maPeriods)
            ? volume.maPeriods
            : DEFAULT_INDICATOR_PERIODS.maVolume,
          true
        ),
        bollN: String(mainIndicators?.boll?.n ?? DEFAULT_INDICATOR_PERIODS.bollN),
        bollP: String(mainIndicators?.boll?.p ?? DEFAULT_INDICATOR_PERIODS.bollP),
      },
      autoCompute: true,
      computeMode: "prefer_input",
    },
    interaction: {
      shouldScrollToEnd: interaction?.autoFollow === true,
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
      manager.setData(nodeHandle, payload);
    } else if (commandName === "prependData") {
      if (typeof manager.prependData === "function") {
        manager.prependData(nodeHandle, payload);
      } else {
        console.warn(
          "[RNKLineView] iOS method prependData not found. Rebuild native project after pod install."
        );
      }
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
  const {
    initialData,
    candles,
    indicator,
    theme,
    mainIndicators,
    subCharts,
    volume,
    interaction,
    draw,
    prediction,
    format,
    layout,
    preset,
    optionList,
    onLoadMore,
    onError,
    ...restProps
  } = props;
  const nativeRef = useRef(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const onErrorRef = useRef(onError);
  onLoadMoreRef.current = onLoadMore;
  onErrorRef.current = onError;
  const dataCacheRef = useRef([]);
  const computedCacheRef = useRef([]);
  const lastComputeSignatureRef = useRef("");
  const lastPropsDataSignatureRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const emitError = useCallback((error) => {
    if (typeof onErrorRef.current !== "function") return;
    onErrorRef.current(error);
  }, []);
  const runtimeConfig = useMemo(() => {
    if (typeof optionList === "string" && optionList.trim().length > 0) {
      emitError({
        code: "E_DEPRECATED_OPTION_LIST",
        message: "optionList is removed in vNext. Use props-first config.",
        source: "js",
        fatal: false,
      });
    }
    const derivedMainIndicators =
      mainIndicators ??
      (indicator
        ? {
            ma: {
              enabled: indicator?.main?.ma !== false,
              periods: DEFAULT_INDICATOR_PERIODS.ma,
            },
            ema: {
              enabled: indicator?.ema?.enabled === true,
              periods: indicator?.ema?.periods ?? DEFAULT_INDICATOR_PERIODS.ema,
            },
            boll: {
              enabled: indicator?.main?.boll === true,
              n: Number(indicator?.targetList?.bollN ?? DEFAULT_INDICATOR_PERIODS.bollN),
              p: Number(indicator?.targetList?.bollP ?? DEFAULT_INDICATOR_PERIODS.bollP),
            },
          }
        : undefined);
    const legacy = toLegacyPropsConfig({
      initialData: [],
      theme,
      mainIndicators: derivedMainIndicators,
      subCharts,
      volume,
      interaction,
    });
    const presetConfig = PRESET_OVERRIDES[preset] ?? {};
    const resolvedIndicator = deepMerge(
      presetConfig.indicator ?? {},
      legacy.indicator ?? {}
    );
    const autoCompute = resolvedIndicator?.autoCompute !== false;
    const periods = extractIndicatorPeriods(
      resolvedIndicator?.targetList ?? {},
      resolvedIndicator
    );
    const targetList = resolveTargetList(
      resolvedIndicator?.targetList,
      periods,
      autoCompute
    );
    const computeSignature = JSON.stringify({
      indicator: resolvedIndicator,
      targetList,
      preset,
    });
    const resolvedConfig = composeOptionList({
      candles: dataCacheRef.current,
      preserveModelArray: true,
      preset,
      theme: legacy.theme,
      layout,
      indicator: legacy.indicator,
      draw,
      prediction,
      interaction: legacy.interaction,
      format,
      advanced: {
        loadMoreThreshold: interaction?.loadMoreThreshold ?? 48,
      },
    });
    return {
      autoCompute,
      resolvedIndicator,
      targetList,
      computeSignature,
      resolvedConfig,
    };
  }, [
    indicator,
    theme,
    mainIndicators,
    subCharts,
    volume,
    interaction,
    draw,
    format,
    layout,
    optionList,
    preset,
    prediction,
    emitError,
  ]);
  const computeCandlesForRuntime = useCallback(
    (rawCandles, forceFull = false) => {
      const nextComputed = computeRuntimeCandles({
        rawCandles,
        currentComputed: computedCacheRef.current,
        indicatorConfig: runtimeConfig.resolvedIndicator,
        targetList: runtimeConfig.targetList,
        autoCompute: runtimeConfig.autoCompute,
        forceFull,
      });
      computedCacheRef.current = nextComputed;
      return nextComputed;
    },
    [runtimeConfig]
  );

  const handleLoadMore = useCallback(
    async (event) => {
      if (loadingMoreRef.current) return;
      if (typeof onLoadMoreRef.current !== "function") return;
      loadingMoreRef.current = true;
      try {
        const payload = event?.nativeEvent ?? event ?? {};
        const candles = await onLoadMoreRef.current(payload);
        if (Array.isArray(candles) && candles.length > 0) {
          const normalized = normalizeCandles(candles);
          dataCacheRef.current = [...normalized, ...dataCacheRef.current];
          const computed = computeCandlesForRuntime(dataCacheRef.current, true);
          const prependItems = computed.slice(0, normalized.length);
          runCommand(nativeRef, "prependData", prependItems);
        }
      } catch (err) {
        emitError({
          code: "E_LOAD_MORE",
          message: err instanceof Error ? err.message : "Failed to load more candles",
          source: "data",
          fatal: false,
        });
      } finally {
        loadingMoreRef.current = false;
      }
    },
    [emitError, computeCandlesForRuntime]
  );

  useImperativeHandle(ref, () => ({
    setData: (nextCandles) => {
      const normalized = normalizeCandles(Array.isArray(nextCandles) ? nextCandles : []);
      dataCacheRef.current = normalized;
      lastPropsDataSignatureRef.current = candlesSignature(normalized);
      const computed = computeCandlesForRuntime(normalized, true);
      runCommand(nativeRef, "setData", computed);
    },
    appendCandle: (candle) => {
      const previousId =
        dataCacheRef.current.length > 0
          ? Number(dataCacheRef.current[dataCacheRef.current.length - 1]?.id ?? 0)
          : 0;
      const normalized = normalizeOneCandle(candle, previousId);
      dataCacheRef.current = [...dataCacheRef.current, normalized];
      lastPropsDataSignatureRef.current = candlesSignature(dataCacheRef.current);
      const computed = computeCandlesForRuntime(dataCacheRef.current, false);
      const appendItem = computed[computed.length - 1];
      if (appendItem) {
        runCommand(nativeRef, "appendCandle", appendItem);
      }
    },
    updateLastCandle: (candle) => {
      const previousId =
        dataCacheRef.current.length > 1
          ? Number(dataCacheRef.current[dataCacheRef.current.length - 2]?.id ?? 0)
          : 0;
      const normalized = normalizeOneCandle(candle, previousId);
      if (dataCacheRef.current.length === 0) {
        dataCacheRef.current = [normalized];
      } else {
        const next = [...dataCacheRef.current];
        next[next.length - 1] = normalized;
        dataCacheRef.current = next;
      }
      lastPropsDataSignatureRef.current = candlesSignature(dataCacheRef.current);
      const computed = computeCandlesForRuntime(dataCacheRef.current, false);
      const updateItem = computed[computed.length - 1];
      if (updateItem) {
        runCommand(nativeRef, "updateLastCandle", updateItem);
      }
    },
    prependData: (candles) => {
      const normalized = normalizeCandles(Array.isArray(candles) ? candles : []);
      if (normalized.length === 0) return;
      dataCacheRef.current = [...normalized, ...dataCacheRef.current];
      lastPropsDataSignatureRef.current = candlesSignature(dataCacheRef.current);
      const computed = computeCandlesForRuntime(dataCacheRef.current, true);
      const prependItems = computed.slice(0, normalized.length);
      runCommand(nativeRef, "prependData", prependItems);
    },
    unPredictionSelect: () => runCommand(nativeRef, "unPredictionSelect", null),
  }));

  useEffect(() => {
    const source = Array.isArray(initialData)
      ? initialData
      : Array.isArray(candles)
      ? candles
      : null;
    if (!Array.isArray(source)) return;

    const normalized = normalizeCandles(source);
    const nextSignature = candlesSignature(normalized);
    const prevSignature = lastPropsDataSignatureRef.current;

    if (prevSignature !== null && prevSignature === nextSignature) {
      return;
    }
    if (
      prevSignature !== null &&
      normalized.length === 0 &&
      dataCacheRef.current.length > 0
    ) {
      emitError({
        code: "E_DATA_CONFIG_CONFLICT",
        message:
          "Ignored empty prop-driven dataset to preserve current runtime data. Use setData([]) for explicit reset.",
        source: "js",
        fatal: false,
      });
      return;
    }

    dataCacheRef.current = normalized;
    lastPropsDataSignatureRef.current = nextSignature;
    const computed = computeCandlesForRuntime(normalized, true);
    runCommand(nativeRef, "setData", computed);
  }, [initialData, candles, emitError, computeCandlesForRuntime]);

  useEffect(() => {
    const signature = runtimeConfig.computeSignature;
    if (lastComputeSignatureRef.current === signature) {
      return;
    }
    lastComputeSignatureRef.current = signature;
    if (dataCacheRef.current.length === 0) {
      computedCacheRef.current = [];
      return;
    }
    const computed = computeCandlesForRuntime(dataCacheRef.current, true);
    runCommand(nativeRef, "setData", computed);
  }, [runtimeConfig.computeSignature, computeCandlesForRuntime]);

  useEffect(() => {
    const enabledCount = (Array.isArray(subCharts) ? subCharts : []).filter(
      (item) => item && item.enabled !== false
    ).length;
    if (enabledCount > 1) {
      emitError({
        code: "E_MULTI_SUB_CLAMPED",
        message:
          "Current native engine supports one sub pane. Using the first enabled sub chart.",
        source: "bridge",
        fatal: false,
      });
    }
  }, [subCharts, emitError]);

  return (
    <NativeRNKLineView
      ref={nativeRef}
      {...restProps}
      config={runtimeConfig.resolvedConfig}
      onLoadMore={handleLoadMore}
      onChartError={(event) => emitError(event?.nativeEvent ?? event)}
    />
  );
});

export default RNKLineView;
