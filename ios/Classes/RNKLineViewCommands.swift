//
//  RNKLineViewCommands.swift
//  react-native-kline-view
//

import Foundation
import React

@objc(RNKLineViewCommands)
@objcMembers
class RNKLineViewCommands: NSObject, RCTBridgeModule {
    static func moduleName() -> String! {
        return "RNKLineViewCommands"
    }

    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc var bridge: RCTBridge!

    @objc func setData(_ reactTag: NSNumber, candles: NSArray) {
        bridge.uiManager.addUIBlock { (_, viewRegistry) in
            guard let view = viewRegistry?[reactTag] as? HTKLineContainerView else { return }
            let list = candles as? [[String: Any]] ?? []
            view.setData(list)
        }
    }

    @objc func appendCandle(_ reactTag: NSNumber, candle: NSDictionary) {
        bridge.uiManager.addUIBlock { (_, viewRegistry) in
            guard let view = viewRegistry?[reactTag] as? HTKLineContainerView else { return }
            let dict = candle as? [String: Any] ?? [:]
            view.appendCandle(dict)
        }
    }

    @objc func updateLastCandle(_ reactTag: NSNumber, candle: NSDictionary) {
        bridge.uiManager.addUIBlock { (_, viewRegistry) in
            guard let view = viewRegistry?[reactTag] as? HTKLineContainerView else { return }
            view.updateLastCandle(dict)
        }
    }

    @objc func unPredictionSelect(_ reactTag: NSNumber, _ unused: Any?) {
        bridge.uiManager.addUIBlock { (_, viewRegistry) in
            guard let view = viewRegistry?[reactTag] as? HTKLineContainerView else { return }
            view.unPredictionSelect()
        }
    }
}

