// ---------------- Types ----------------

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface OrderBlock {
  type: "bullish" | "bearish";
  time: number;
  high: number;
  low: number;
  open: number;
  close: number;
  // Optional flag to indicate user-selected OB (for AI analysis)
  isSelected?: boolean;
}

export interface SwingPoint {
  time: number;
  price: number;
  type: "high" | "low";
  index: number;
}

export interface MarketStructureEvent {
  time: number;
  type: "CHoCH" | "BOS";
  direction: "bullish" | "bearish";
  level: number;
  fromIndex: number;
  toIndex: number;
  category: "internal" | "swing";
  pivotIndex: number;
  pivotType: "high" | "low";
}

export interface LiquidityZone {
  time: number;
  type: "EQH" | "EQL";
  level: number;
  fromIndex: number;
  toIndex: number;
  category: "internal" | "swing";
}

export interface PremiumDiscountZone {
  type: "premium" | "equilibrium" | "discount";
  top: number;
  bottom: number;
  fromIndex: number;
  toIndex: number;
}

export interface FairValueGap {
  type: "bullish" | "bearish";
  startTime: number;
  startIndex: number;
  topPrice: number;
  bottomPrice: number;
  mitigated: boolean;
  mitigatedIndex: number | null;
}

export interface MitigatedOrderBlock extends OrderBlock {
  startIndex: number;
  endIndex: number | null;
  mitigated: boolean;
}

export interface TradingSignal {
  bias: "bullish" | "bearish" | "neutral";
  strength: "strong" | "moderate" | "weak";
  entryZones: Array<{
    type: "order_block" | "fvg" | "liquidity" | "discount" | "premium";
    price: number;
    confidence: "high" | "medium" | "low";
    reason: string;
  }>;
  stopLoss: number | null;
  targets: Array<{
    level: number;
    type: "liquidity_sweep" | "structure_high" | "structure_low" | "fvg_fill";
    reason: string;
  }>;
  riskRewardRatio: number | null;
  currentTrend: "bullish" | "bearish" | "consolidation";
  priceInPremium: boolean;
  nearestSupport: number | null;
  nearestResistance: number | null;
}

export interface SMCResult {
  orderBlocks: MitigatedOrderBlock[];
  swingsInternal: SwingPoint[];
  swingsSwing: SwingPoint[];
  swings: SwingPoint[];
  structureEvents: MarketStructureEvent[];
  liquidityZones: LiquidityZone[];
  premiumDiscount: PremiumDiscountZone[];
  fairValueGaps: FairValueGap[];
  tradingSignal?: TradingSignal;
}

// ---------------- Utils ----------------

function avgTrueRangeApprox(candles: Candle[], period: number): number {
  if (candles.length < period) {
    return (
      candles.reduce((acc, c) => acc + (c.high - c.low), 0) / candles.length
    );
  }
  const n = Math.min(period, candles.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = candles.length - n; i < candles.length; i++) {
    sum += candles[i].high - candles[i].low;
  }
  return sum / n;
}

// ---------------- Swings ----------------

export function detectSwingsLux(candles: Candle[], size: number): SwingPoint[] {
  const swings: SwingPoint[] = [];
  if (candles.length < 2 * size + 1) return swings;

  for (let i = size; i < candles.length - size; i++) {
    const c = candles[i];

    const prevHighs = candles.slice(i - size, i).map((x) => x.high);
    const nextHighs = candles.slice(i + 1, i + size + 1).map((x) => x.high);
    const prevLows = candles.slice(i - size, i).map((x) => x.low);
    const nextLows = candles.slice(i + 1, i + size + 1).map((x) => x.low);

    const isHigh =
      c.high > Math.max(...prevHighs) && c.high > Math.max(...nextHighs);
    const isLow =
      c.low < Math.min(...prevLows) && c.low < Math.min(...nextLows);

    if (isHigh) {
      swings.push({ index: i, time: c.time, price: c.high, type: "high" });
    } else if (isLow) {
      swings.push({ index: i, time: c.time, price: c.low, type: "low" });
    }
  }
  return swings;
}

// ---------------- Structure ----------------

export function detectMarketStructureLux(
  swings: SwingPoint[],
  candles: Candle[],
  bosMinDistance: number
): MarketStructureEvent[] {
  const events: MarketStructureEvent[] = [];
  if (swings.length < 2) return events;

  let bias: "bullish" | "bearish" = "bullish";

  for (let i = 1; i < swings.length; i++) {
    const prev = swings[i - 1];
    const curr = swings[i];
    const distance = curr.index - prev.index;

    if (
      curr.type === "high" &&
      candles[curr.index].close > prev.price &&
      distance >= bosMinDistance
    ) {
      const type = bias === "bearish" ? "CHoCH" : "BOS";
      events.push({
        time: curr.time,
        type,
        direction: "bullish",
        level: curr.price,
        fromIndex: prev.index,
        toIndex: curr.index,
        category: "swing",
        pivotIndex: prev.index,
        pivotType: prev.type,
      });
      bias = "bullish";
    }

    if (
      curr.type === "low" &&
      candles[curr.index].close < prev.price &&
      distance >= bosMinDistance
    ) {
      const type = bias === "bullish" ? "CHoCH" : "BOS";
      events.push({
        time: curr.time,
        type,
        direction: "bearish",
        level: curr.price,
        fromIndex: prev.index,
        toIndex: curr.index,
        category: "swing",
        pivotIndex: prev.index,
        pivotType: prev.type,
      });
      bias = "bearish";
    }
  }
  return events;
}

// ---------------- Order Blocks ----------------

export function createOrderBlocksFromStructure(
  candles: Candle[],
  structureEvents: MarketStructureEvent[],
  category: "internal" | "swing"
): OrderBlock[] {
  const orderBlocks: OrderBlock[] = [];

  for (const event of structureEvents) {
    if (event.category !== category) continue;

    const { pivotIndex, direction, time } = event;
    const endIndex = candles.findIndex((c) => c.time === time);
    if (endIndex === -1 || endIndex <= pivotIndex) continue;

    const segment = candles.slice(pivotIndex, endIndex + 1);

    if (direction === "bullish") {
      const minLowCandle = segment.reduce(
        (min, c) => (c.low < min.low ? c : min),
        segment[0]
      );
      orderBlocks.push({
        type: "bullish",
        time: minLowCandle.time,
        high: minLowCandle.high,
        low: minLowCandle.low,
        open: minLowCandle.open,
        close: minLowCandle.close,
      });
    } else {
      const maxHighCandle = segment.reduce(
        (max, c) => (c.high > max.high ? c : max),
        segment[0]
      );
      orderBlocks.push({
        type: "bearish",
        time: maxHighCandle.time,
        high: maxHighCandle.high,
        low: maxHighCandle.low,
        open: maxHighCandle.open,
        close: maxHighCandle.close,
      });
    }
  }

  return orderBlocks;
}

// ---------------- Fair Value Gaps ----------------

export function detectFairValueGapsLux(candles: Candle[]): FairValueGap[] {
  const gaps: FairValueGap[] = [];
  if (candles.length < 3) return gaps;

  let cumAbsDelta = 0;
  for (let i = 1; i < candles.length; i++) {
    const open = candles[i - 1].open;
    const close = candles[i - 1].close;
    const deltaPct = open !== 0 ? Math.abs((close - open) / open) : 0;
    cumAbsDelta += deltaPct;
  }
  const threshold = (cumAbsDelta / (candles.length - 1)) * 2;

  for (let i = 2; i < candles.length; i++) {
    const last2 = candles[i - 2];
    const last = candles[i - 1];
    const curr = candles[i];

    const lastDeltaPct =
      last.open !== 0 ? Math.abs((last.close - last.open) / last.open) : 0;

    // Bullish FVG
    if (
      curr.low > last2.high &&
      last.close > last2.high &&
      lastDeltaPct >= threshold
    ) {
      gaps.push({
        type: "bullish",
        startTime: last.time,
        startIndex: i - 1,
        topPrice: curr.low,
        bottomPrice: last2.high,
        mitigated: false,
        mitigatedIndex: null,
      });
    }

    // Bearish FVG
    if (
      curr.high < last2.low &&
      last.close < last2.low &&
      lastDeltaPct >= threshold
    ) {
      gaps.push({
        type: "bearish",
        startTime: last.time,
        startIndex: i - 1,
        topPrice: last2.low,
        bottomPrice: curr.high,
        mitigated: false,
        mitigatedIndex: null,
      });
    }
  }

  return gaps;
}

// ---------------- FVG Mitigation ----------------

export function markMitigatedFVGs(
  candles: Candle[],
  fvgList: FairValueGap[]
): FairValueGap[] {
  return fvgList.map((fvg) => {
    let mitigated = false;
    let mitigatedIndex: number | null = null;

    for (let i = fvg.startIndex + 1; i < candles.length; i++) {
      const c = candles[i];
      if (fvg.type === "bullish") {
        if (c.low <= fvg.topPrice && c.high >= fvg.bottomPrice) {
          mitigated = true;
          mitigatedIndex = i;
          break;
        }
      } else if (fvg.type === "bearish") {
        if (c.high >= fvg.bottomPrice && c.low <= fvg.topPrice) {
          mitigated = true;
          mitigatedIndex = i;
          break;
        }
      }
    }

    return { ...fvg, mitigated, mitigatedIndex };
  });
}

// ---------------- Liquidity ----------------

export function detectLiquidityZonesLux(
  swings: SwingPoint[],
  candles: Candle[],
  threshold: number = 0.1
): LiquidityZone[] {
  const zones: LiquidityZone[] = [];
  if (swings.length < 2) return zones;

  const atr = avgTrueRangeApprox(candles, 200);

  for (let i = 1; i < swings.length; i++) {
    const prev = swings[i - 1];
    const curr = swings[i];
    const delta = Math.abs(prev.price - curr.price);

    if (
      prev.type === "high" &&
      curr.type === "high" &&
      delta < atr * threshold
    ) {
      zones.push({
        time: curr.time,
        type: "EQH",
        level: Math.max(prev.price, curr.price),
        fromIndex: prev.index,
        toIndex: curr.index,
        category: "swing",
      });
    }
    if (prev.type === "low" && curr.type === "low" && delta < atr * threshold) {
      zones.push({
        time: curr.time,
        type: "EQL",
        level: Math.min(prev.price, curr.price),
        fromIndex: prev.index,
        toIndex: curr.index,
        category: "swing",
      });
    }
  }
  return zones;
}

// ---------------- Premium/Discount ----------------

export function computePremiumDiscountLux(
  swings: SwingPoint[]
): PremiumDiscountZone[] {
  if (swings.length === 0) return [];

  const highs = swings.filter((s) => s.type === "high").map((s) => s.price);
  const lows = swings.filter((s) => s.type === "low").map((s) => s.price);

  if (highs.length === 0 || lows.length === 0) return [];

  const top = Math.max(...highs);
  const bottom = Math.min(...lows);

  const fromIndex = Math.min(...swings.map((s) => s.index));
  const toIndex = Math.max(...swings.map((s) => s.index));

  return [
    {
      type: "premium",
      top: top,
      bottom: 0.95 * top + 0.05 * bottom,
      fromIndex,
      toIndex,
    },
    {
      type: "equilibrium",
      top: 0.525 * top + 0.475 * bottom,
      bottom: 0.525 * bottom + 0.475 * top,
      fromIndex,
      toIndex,
    },
    {
      type: "discount",
      top: 0.95 * bottom + 0.05 * top,
      bottom: bottom,
      fromIndex,
      toIndex,
    },
  ];
}

// ---------------- OB Mitigation ----------------

export function extendUntilMitigatedLux(
  candles: Candle[],
  orderBlocks: OrderBlock[],
  mitigationSource: "close" | "highlow" = "close"
): MitigatedOrderBlock[] {
  const extended: MitigatedOrderBlock[] = [];

  for (const ob of orderBlocks) {
    const startIndex = candles.findIndex((c) => c.time === ob.time);
    let endIndex: number | null = null;

    for (let i = startIndex + 1; i < candles.length; i++) {
      const c = candles[i];
      const source =
        mitigationSource === "close"
          ? c.close
          : ob.type === "bearish"
          ? c.high
          : c.low;

      if (
        (ob.type === "bearish" && source > ob.high) ||
        (ob.type === "bullish" && source < ob.low)
      ) {
        endIndex = i;
        break;
      }
    }

    extended.push({
      ...ob,
      startIndex,
      endIndex,
      mitigated: endIndex !== null,
    });
  }

  return extended;
}

// ---------------- Mode Selection ----------------

function determineMode(
  interval?: string,
  forcedMode?: "auto" | "internal" | "swing" | "both"
): "internal" | "swing" | "both" {
  if (forcedMode && forcedMode !== "auto") return forcedMode;
  if (!interval) return "swing";

  const intervalLower = interval.toLowerCase();
  let minutes = 0;
  if (intervalLower.includes("m")) minutes = parseInt(intervalLower);
  else if (intervalLower.includes("h")) minutes = parseInt(intervalLower) * 60;
  else if (intervalLower.includes("d"))
    minutes = parseInt(intervalLower) * 1440;
  else if (intervalLower.includes("w"))
    minutes = parseInt(intervalLower) * 10080;

  return minutes <= 5 ? "internal" : "swing";
}

function getBiasStrategy(
  interval?: string
): "useLastStructure" | "useCurrentTrend" {
  if (!interval) return "useCurrentTrend";

  const intervalLower = interval.toLowerCase();
  let minutes = 0;
  if (intervalLower.includes("m")) minutes = parseInt(intervalLower);
  else if (intervalLower.includes("h")) minutes = parseInt(intervalLower) * 60;
  else if (intervalLower.includes("d"))
    minutes = parseInt(intervalLower) * 1440;
  else if (intervalLower.includes("w"))
    minutes = parseInt(intervalLower) * 10080;

  // Khung lớn (≥ 1h): tin vào lastStructure (đảo chiều rõ)
  // Khung nhỏ (< 1h): tin vào currentTrend (tránh fakeout)
  return minutes >= 60 ? "useLastStructure" : "useCurrentTrend";
}

// ---------------- Trading Signal ----------------

export function generateTradingSignalsLux(
  candles: Candle[],
  smcResult: Omit<SMCResult, "tradingSignal">,
  interval?: string
): TradingSignal {
  if (candles.length === 0) {
    return {
      bias: "neutral",
      strength: "weak",
      entryZones: [],
      stopLoss: null,
      targets: [],
      riskRewardRatio: null,
      currentTrend: "consolidation",
      priceInPremium: false,
      nearestSupport: null,
      nearestResistance: null,
    };
  }

  candles.sort((a, b) => a.time - b.time);
  const currentPrice = candles[candles.length - 1].close;
  const {
    orderBlocks,
    structureEvents,
    liquidityZones,
    fairValueGaps,
    swings,
  } = smcResult;

  // --- Xác định xu hướng ---
  const recentStructures = structureEvents.slice(-3);
  let bullishCount = 0,
    bearishCount = 0;
  recentStructures.forEach((e) =>
    e.direction === "bullish" ? bullishCount++ : bearishCount++
  );
  const currentTrend =
    bullishCount > bearishCount
      ? "bullish"
      : bearishCount > bullishCount
      ? "bearish"
      : "consolidation";

  const lastStructure = structureEvents[structureEvents.length - 1];
  // --- Xác định BIAS THÔNG MINH THEO INTERVAL ---
  const biasStrategy = getBiasStrategy(interval);
  let bias: "bullish" | "bearish" | "neutral" = "neutral";

  if (biasStrategy === "useLastStructure") {
    bias = lastStructure?.direction || "neutral";
  } else {
    bias =
      currentTrend === "bullish"
        ? "bullish"
        : currentTrend === "bearish"
        ? "bearish"
        : "neutral";
  }

  const recentBOS = recentStructures.filter((e) => e.type === "BOS").length;
  const strength =
    recentBOS >= 2 ? "strong" : recentBOS === 1 ? "moderate" : "weak";

  // --- Hỗ trợ/kháng cự gần nhất ---
  const swingHighs = swings
    .filter((s) => s.type === "high")
    .map((s) => s.price);
  const swingLows = swings.filter((s) => s.type === "low").map((s) => s.price);
  const nearestResistance =
    swingHighs.length > 0
      ? Math.min(...swingHighs.filter((h) => h > currentPrice))
      : null;
  const nearestSupport =
    swingLows.length > 0
      ? Math.max(...swingLows.filter((l) => l < currentPrice))
      : null;

  // --- Premium/Discount ---
  let priceInPremium = false;
  if (swings.length > 0) {
    const top = Math.max(
      ...swings.filter((s) => s.type === "high").map((s) => s.price)
    );
    const bottom = Math.min(
      ...swings.filter((s) => s.type === "low").map((s) => s.price)
    );
    const midpoint = (top + bottom) / 2;
    priceInPremium = currentPrice > midpoint;
  }

  // --- Entry Zones ---
  const entryZones: Array<{
    type: "order_block" | "fvg" | "liquidity" | "discount" | "premium";
    price: number;
    confidence: "high" | "medium" | "low";
    reason: string;
  }> = [];

  // → Order Blocks
  const activeOBs = orderBlocks.filter((ob) => !ob.mitigated);
  activeOBs.slice(-2).forEach((ob) => {
    if (
      (bias === "bullish" && ob.type === "bullish") ||
      (bias === "bearish" && ob.type === "bearish")
    ) {
      entryZones.push({
        type: "order_block",
        price: ob.type === "bullish" ? ob.low : ob.high,
        confidence: "high",
        reason: `Unmitigated ${ob.type} OB + ${
          lastStructure?.type || "structure"
        }`,
      });
    }
  });

  // → Fair Value Gaps
  const activeFVGs = fairValueGaps.filter((fvg) => !fvg.mitigated);
  const recentFVGs = [...activeFVGs].sort(
    (a, b) => b.startIndex - a.startIndex
  );

  recentFVGs.slice(0, 2).forEach((fvg) => {
    if (
      (bias === "bullish" && fvg.type === "bullish") ||
      (bias === "bearish" && fvg.type === "bearish")
    ) {
      const inFavorableZone =
        (bias === "bullish" && !priceInPremium) ||
        (bias === "bearish" && priceInPremium);

      entryZones.push({
        type: "fvg",
        price: fvg.bottomPrice,
        confidence: inFavorableZone ? "high" : "medium",
        reason: `${fvg.type} FVG ${
          inFavorableZone ? "(favorable zone)" : "(standard)"
        }`,
      });
    }
  });

  // --- Stop Loss ---
  let stopLoss: number | null = null;
  if (entryZones.length > 0) {
    const entryPrice = entryZones[0].price;
    const buffer = Math.abs(entryPrice * 0.01);

    if (bias === "bullish") {
      stopLoss =
        nearestSupport && nearestSupport < entryPrice
          ? nearestSupport - buffer
          : entryPrice - buffer;
    } else if (bias === "bearish") {
      stopLoss =
        nearestResistance && nearestResistance > entryPrice
          ? nearestResistance + buffer
          : entryPrice + buffer;
    }
  }

  // --- Targets ---
  const targets: Array<{
    level: number;
    type: "liquidity_sweep" | "structure_high" | "structure_low" | "fvg_fill";
    reason: string;
  }> = [];

  // Liquidity sweeps
  liquidityZones.slice(-2).forEach((liq) => {
    if (
      (bias === "bullish" && liq.type === "EQH") ||
      (bias === "bearish" && liq.type === "EQL")
    ) {
      targets.push({
        level: liq.level,
        type: "liquidity_sweep" as const,
        reason: `${liq.type} liquidity target`,
      });
    }
  });

  // Swing structure targets
  if (bias === "bullish" && nearestResistance) {
    targets.push({
      level: nearestResistance,
      type: "structure_high" as const,
      reason: "Previous swing high",
    });
  } else if (bias === "bearish" && nearestSupport) {
    targets.push({
      level: nearestSupport,
      type: "structure_low" as const,
      reason: "Previous swing low",
    });
  }

  // --- Risk-Reward Ratio ---
  let riskRewardRatio: number | null = null;
  if (entryZones.length > 0 && stopLoss !== null && targets.length > 0) {
    const avgEntry =
      entryZones.reduce((sum, e) => sum + e.price, 0) / entryZones.length;
    const avgTarget =
      targets.reduce((sum, t) => sum + t.level, 0) / targets.length;
    const risk = Math.abs(avgEntry - stopLoss);
    const reward = Math.abs(avgTarget - avgEntry);
    riskRewardRatio = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : null;
  }

  return {
    bias,
    strength,
    entryZones,
    stopLoss,
    targets,
    riskRewardRatio,
    currentTrend,
    priceInPremium,
    nearestSupport,
    nearestResistance,
  };
}

// ---------------- Public API ----------------

export interface SMCConfig {
  obLimit?: number;
  internalSwingSize?: number;
  swingSwingSize?: number;
  bosMinDistance?: number;
  fvgMaxCount?: number;
  mitigationSource?: "close" | "highlow";
  interval?: string;
  mode?: "auto" | "internal" | "swing" | "both";
  generateSignals?: boolean;
}

export function runSMCStrategyLux(
  candles: Candle[],
  config: SMCConfig = {}
): SMCResult {
  const {
    obLimit = 5,
    internalSwingSize = 3,
    swingSwingSize = 5,
    bosMinDistance = 1,
    fvgMaxCount = 20,
    mitigationSource = "close",
    interval,
    mode = "both",
    generateSignals = false,
  } = config;
  candles.sort((a, b) => a.time - b.time);
  const activeMode = determineMode(interval, mode);
  const useInternal = activeMode === "internal" || activeMode === "both";
  const useSwing = activeMode === "swing" || activeMode === "both";

  // 1. Detect swings
  const swingsInternal = useInternal
    ? detectSwingsLux(candles, internalSwingSize)
    : [];
  const swingsSwing = useSwing ? detectSwingsLux(candles, swingSwingSize) : [];
  const activeSwings = [...swingsInternal, ...swingsSwing];

  // 2. Detect structure
  const structureInternal = useInternal
    ? detectMarketStructureLux(swingsInternal, candles, bosMinDistance)
    : [];
  const structureSwing = useSwing
    ? detectMarketStructureLux(swingsSwing, candles, bosMinDistance)
    : [];
  const structureEvents = [...structureInternal, ...structureSwing];

  // 3. Create Order Blocks
  const internalOB = createOrderBlocksFromStructure(
    candles,
    structureInternal,
    "internal"
  );
  const swingOB = createOrderBlocksFromStructure(
    candles,
    structureSwing,
    "swing"
  );
  const allOB = [...internalOB, ...swingOB];

  // 4. Mitigate Order Blocks
  const extendedOB = extendUntilMitigatedLux(candles, allOB, mitigationSource);
  const activeOB = extendedOB.filter((ob) => !ob.mitigated).slice(-obLimit);

  // 5. Liquidity Zones
  const eqInternal = useInternal
    ? detectLiquidityZonesLux(swingsInternal, candles)
    : [];
  const eqSwing = useSwing ? detectLiquidityZonesLux(swingsSwing, candles) : [];
  const liquidityZones = [...eqInternal, ...eqSwing];

  // 6. Premium/Discount
  const premiumDiscount =
    activeSwings.length > 0 ? computePremiumDiscountLux(activeSwings) : [];

  // 7. Fair Value Gaps + MITIGATION
  const allFVGs = detectFairValueGapsLux(candles);
  const mitigatedFVGs = markMitigatedFVGs(candles, allFVGs);
  const fairValueGaps = mitigatedFVGs.slice(-fvgMaxCount);

  // 8. Signal generation
  let tradingSignal: TradingSignal | undefined = undefined;
  if (generateSignals) {
    const smcData = {
      orderBlocks: activeOB,
      swingsInternal,
      swingsSwing,
      swings: activeSwings,
      structureEvents,
      liquidityZones,
      premiumDiscount,
      fairValueGaps,
    };
    tradingSignal = generateTradingSignalsLux(candles, smcData, interval);
  }

  return {
    orderBlocks: activeOB,
    swingsInternal,
    swingsSwing,
    swings: activeSwings,
    structureEvents,
    liquidityZones,
    premiumDiscount,
    fairValueGaps,
    tradingSignal,
  };
}
