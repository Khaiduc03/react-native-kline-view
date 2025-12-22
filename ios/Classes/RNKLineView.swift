//
//  HTKLineViewManager.swift
//  Base64
//
//  Created by hublot on 2020/4/3.
//

import UIKit

@objc(RNKLineView)
@objcMembers
class RNKLineView: RCTViewManager {

    static let queue = DispatchQueue.init(label: "com.hublot.klinedata")

    override func view() -> UIView! {
        return HTKLineContainerView()
    }

    override class func requiresMainQueueSetup() -> Bool {
        return true
    }





    // ----- Imperative commands (Phase 1) -----
    // Called from JS: NativeModules.RNKLineView.setData(reactTag, candles)
    @objc func setData(_ reactTag: NSNumber, candles: NSArray) {
        bridge.uiManager.addUIBlock { (_, viewRegistry) in
            guard let view = viewRegistry?[reactTag] as? HTKLineContainerView else { return }
            let list = candles as? [[String: Any]] ?? []
            view.setData(list)
        }
    }

    // Called from JS: NativeModules.RNKLineView.appendCandle(reactTag, candle)
    @objc func appendCandle(_ reactTag: NSNumber, candle: NSDictionary) {
        bridge.uiManager.addUIBlock { (_, viewRegistry) in
            guard let view = viewRegistry?[reactTag] as? HTKLineContainerView else { return }
            let dict = candle as? [String: Any] ?? [:]
            view.appendCandle(dict)
        }
    }

    // Called from JS: NativeModules.RNKLineView.updateLastCandle(reactTag, candle)
    @objc func updateLastCandle(_ reactTag: NSNumber, candle: NSDictionary) {
        bridge.uiManager.addUIBlock { (_, viewRegistry) in
            guard let view = viewRegistry?[reactTag] as? HTKLineContainerView else { return }
            let dict = candle as? [String: Any] ?? [:]
            view.updateLastCandle(dict)
        }
    }

}
