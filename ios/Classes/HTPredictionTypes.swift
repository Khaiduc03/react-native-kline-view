//
//  HTPredictionTypes.swift
//  react-native-kline-view
//
//  Price prediction overlay types (iOS Phase 2).
//

import Foundation
import UIKit

struct HTPredictionPoint {
    let offset: Int
    let price: CGFloat
}

struct HTPredictionBand {
    let fromOffset: Int
    let toOffset: Int
    let top: CGFloat
    let bottom: CGFloat
    let confidence: CGFloat?

    func contains(offset: Int) -> Bool {
        return offset >= fromOffset && offset <= toOffset
    }
}

struct HTPredictionLevel {
    let price: CGFloat
    let label: String?
    let kind: String?
}

struct HTPredictedCandle {
    let offset: Int
    let open: CGFloat
    let high: CGFloat
    let low: CGFloat
    let close: CGFloat
    let volume: CGFloat?
}

struct HTPredictionState {
    let anchorIndex: Int
    let baseTimestampMs: Int64
    let intervalMs: Int64
    let horizonCandles: Int
    let includeInScale: Bool
    let points: [HTPredictionPoint]
    let bands: [HTPredictionBand]
    let levels: [HTPredictionLevel]
    let predictedCandles: [HTPredictedCandle]

    var predictedCandleByOffset: [Int: HTPredictedCandle] {
        var map: [Int: HTPredictedCandle] = [:]
        for c in predictedCandles {
            map[c.offset] = c
        }
        return map
    }
}

// MARK: - Parsing helpers

private func asInt(_ value: Any?) -> Int? {
    if let v = value as? Int { return v }
    if let v = value as? NSNumber { return v.intValue }
    if let v = value as? Double { return Int(v) }
    if let v = value as? String { return Int(v) }
    return nil
}

private func asInt64(_ value: Any?) -> Int64? {
    if let v = value as? Int64 { return v }
    if let v = value as? Int { return Int64(v) }
    if let v = value as? NSNumber { return v.int64Value }
    if let v = value as? Double { return Int64(v) }
    if let v = value as? String { return Int64(v) }
    return nil
}

private func asCGFloat(_ value: Any?) -> CGFloat? {
    if let v = value as? CGFloat { return v }
    if let v = value as? Double { return CGFloat(v) }
    if let v = value as? Float { return CGFloat(v) }
    if let v = value as? Int { return CGFloat(v) }
    if let v = value as? NSNumber { return CGFloat(truncating: v) }
    if let v = value as? String, let d = Double(v) { return CGFloat(d) }
    return nil
}

private func asBool(_ value: Any?) -> Bool? {
    if let v = value as? Bool { return v }
    if let v = value as? NSNumber { return v.boolValue }
    if let v = value as? String {
        if v.lowercased() == "true" { return true }
        if v.lowercased() == "false" { return false }
    }
    return nil
}

extension HTPredictionState {
    static func fromPayload(_ payload: [String: Any], anchorIndex: Int) -> HTPredictionState? {
        guard let baseTimestampMs = asInt64(payload["baseTimestampMs"]),
              let intervalMs = asInt64(payload["intervalMs"]),
              let horizonCandles = asInt(payload["horizonCandles"]) else {
            return nil
        }

        let includeInScale = asBool(payload["includeInScale"]) ?? true

        let points: [HTPredictionPoint] = (payload["points"] as? [[String: Any]] ?? []).compactMap { item in
            guard let offset = asInt(item["offset"]), let price = asCGFloat(item["price"]) else { return nil }
            return HTPredictionPoint(offset: offset, price: price)
        }

        let bands: [HTPredictionBand] = (payload["bands"] as? [[String: Any]] ?? []).compactMap { item in
            guard let fromOffset = asInt(item["fromOffset"]),
                  let toOffset = asInt(item["toOffset"]),
                  let top = asCGFloat(item["top"]),
                  let bottom = asCGFloat(item["bottom"]) else { return nil }
            let confidence = asCGFloat(item["confidence"])
            return HTPredictionBand(fromOffset: fromOffset, toOffset: toOffset, top: top, bottom: bottom, confidence: confidence)
        }

        let levels: [HTPredictionLevel] = (payload["levels"] as? [[String: Any]] ?? []).compactMap { item in
            guard let price = asCGFloat(item["price"]) else { return nil }
            let label = item["label"] as? String
            let kind = item["kind"] as? String
            return HTPredictionLevel(price: price, label: label, kind: kind)
        }

        let predictedCandles: [HTPredictedCandle] = (payload["predictedCandles"] as? [[String: Any]] ?? []).compactMap { item in
            guard let offset = asInt(item["offset"]),
                  let open = asCGFloat(item["open"]),
                  let high = asCGFloat(item["high"]),
                  let low = asCGFloat(item["low"]),
                  let close = asCGFloat(item["close"]) else { return nil }
            let volume = asCGFloat(item["volume"])
            return HTPredictedCandle(offset: offset, open: open, high: high, low: low, close: close, volume: volume)
        }

        return HTPredictionState(
            anchorIndex: anchorIndex,
            baseTimestampMs: baseTimestampMs,
            intervalMs: intervalMs,
            horizonCandles: horizonCandles,
            includeInScale: includeInScale,
            points: points,
            bands: bands,
            levels: levels,
            predictedCandles: predictedCandles
        )
    }
}
