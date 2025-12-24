//
//  HTTradingSignalModel.swift
//  RNKLineView
//
//  Created for Trading Signal Visualization
//

import UIKit

/// Trading signal bias direction
enum HTSignalBias: String {
    case bullish = "bullish"
    case bearish = "bearish"
    case neutral = "neutral"
}

/// Signal strength level
enum HTSignalStrength: String {
    case strong = "strong"
    case moderate = "moderate"
    case weak = "weak"
}

/// Entry zone type
enum HTEntryZoneType: String {
    case orderBlock = "order_block"
    case fvg = "fvg"
    case liquidity = "liquidity"
    case discount = "discount"
    case premium = "premium"
}

/// Target type
enum HTTargetType: String {
    case liquiditySweep = "liquidity_sweep"
    case structureHigh = "structure_high"
    case structureLow = "structure_low"
    case fvgFill = "fvg_fill"
}

/// Entry zone model
struct HTEntryZone {
    let type: HTEntryZoneType
    let price: CGFloat
    let confidence: String
    let reason: String
    
    init?(dict: [String: Any]) {
        guard let typeStr = dict["type"] as? String,
              let type = HTEntryZoneType(rawValue: typeStr),
              let price = dict["price"] as? Double else {
            return nil
        }
        self.type = type
        self.price = CGFloat(price)
        self.confidence = dict["confidence"] as? String ?? "medium"
        self.reason = dict["reason"] as? String ?? ""
    }
}

/// Target level model
struct HTTargetLevel {
    let level: CGFloat
    let type: HTTargetType
    let reason: String
    
    init?(dict: [String: Any]) {
        guard let level = dict["level"] as? Double,
              let typeStr = dict["type"] as? String,
              let type = HTTargetType(rawValue: typeStr) else {
            return nil
        }
        self.level = CGFloat(level)
        self.type = type
        self.reason = dict["reason"] as? String ?? ""
    }
}

/// Main trading signal model
class HTTradingSignalModel: NSObject {
    var bias: HTSignalBias = .neutral
    var strength: HTSignalStrength = .moderate
    var entryZones: [HTEntryZone] = []
    var stopLoss: CGFloat?
    var targets: [HTTargetLevel] = []
    var riskRewardRatio: CGFloat?
    var currentTrend: String = "neutral"
    var priceInPremium: Bool = false
    var nearestSupport: CGFloat?
    var nearestResistance: CGFloat?
    
    /// Current price for prediction line drawing
    var currentPrice: CGFloat?
    
    /// Parse from dictionary (React Native JSON)
    static func parse(from dict: [String: Any]?) -> HTTradingSignalModel? {
        guard let dict = dict else { return nil }
        
        let model = HTTradingSignalModel()
        
        // Parse bias
        if let biasStr = dict["bias"] as? String,
           let bias = HTSignalBias(rawValue: biasStr) {
            model.bias = bias
        }
        
        // Parse strength
        if let strengthStr = dict["strength"] as? String,
           let strength = HTSignalStrength(rawValue: strengthStr) {
            model.strength = strength
        }
        
        // Parse entry zones
        if let entryZonesArr = dict["entryZones"] as? [[String: Any]] {
            model.entryZones = entryZonesArr.compactMap { HTEntryZone(dict: $0) }
        }
        
        // Parse stop loss
        if let stopLoss = dict["stopLoss"] as? Double {
            model.stopLoss = CGFloat(stopLoss)
        }
        
        // Parse targets
        if let targetsArr = dict["targets"] as? [[String: Any]] {
            model.targets = targetsArr.compactMap { HTTargetLevel(dict: $0) }
        }
        
        // Parse risk reward ratio
        if let rrRatio = dict["riskRewardRatio"] as? Double {
            model.riskRewardRatio = CGFloat(rrRatio)
        }
        
        // Parse current trend
        model.currentTrend = dict["currentTrend"] as? String ?? "neutral"
        
        // Parse price in premium
        model.priceInPremium = dict["priceInPremium"] as? Bool ?? false
        
        // Parse nearest support/resistance
        if let support = dict["nearestSupport"] as? Double {
            model.nearestSupport = CGFloat(support)
        }
        if let resistance = dict["nearestResistance"] as? Double {
            model.nearestResistance = CGFloat(resistance)
        }
        
        // Parse current price
        if let currentPrice = dict["currentPrice"] as? Double {
            model.currentPrice = CGFloat(currentPrice)
        }
        
        return model
    }
    
    /// Check if the signal has valid data to draw
    var hasValidData: Bool {
        return !targets.isEmpty || nearestSupport != nil || nearestResistance != nil || stopLoss != nil
    }
    
    /// Get the main color based on bias
    var biasColor: UIColor {
        switch bias {
        case .bullish:
            return UIColor(red: 0.0, green: 0.8, blue: 0.4, alpha: 1.0) // Green
        case .bearish:
            return UIColor(red: 0.9, green: 0.2, blue: 0.2, alpha: 1.0) // Red
        case .neutral:
            return UIColor(red: 0.6, green: 0.6, blue: 0.6, alpha: 1.0) // Gray
        }
    }
    
    /// Get color for bullish elements
    static var bullishColor: UIColor {
        return UIColor(red: 0.0, green: 0.8, blue: 0.4, alpha: 1.0)
    }
    
    /// Get color for bearish elements
    static var bearishColor: UIColor {
        return UIColor(red: 0.9, green: 0.2, blue: 0.2, alpha: 1.0)
    }
}
