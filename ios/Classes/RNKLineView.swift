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
        let uiManager = bridge.uiManager
        uiManager?.addUIBlock { [weak self] (_, viewRegistry) in
            guard let self = self else {
                print("🚨 [Pods RNKLineView] setData self deallocated for tag:", reactTag)
                return
            }

            let viewFromRegistry = viewRegistry?[reactTag] as? HTKLineContainerView
            let viewDirect = uiManager?.view(forReactTag: reactTag) as? HTKLineContainerView
            let view = viewFromRegistry ?? viewDirect

            if view == nil {
                if let existing = viewRegistry?[reactTag] {
                    print("🚨 [Pods RNKLineView] setData found view but wrong type: \(type(of: existing)) for tag:", reactTag)
                } else {
                    print("🚨 [Pods RNKLineView] setData no view for tag:", reactTag)
                }
                let registryKeys = viewRegistry?.keys.map { $0 } ?? []
                print("🚨 [Pods RNKLineView] setData viewRegistry keys:", registryKeys)
                return
            }

            let list = candles as? [[String: Any]] ?? []
            print("[RNKLineView][iOS] setData count:", list.count)
            view?.setData(list)
        }
    }

    // Called from JS: NativeModules.RNKLineView.appendCandle(reactTag, candle)
    @objc func appendCandle(_ reactTag: NSNumber, candle: NSDictionary) {
        let uiManager = bridge.uiManager
        uiManager?.addUIBlock { [weak self] (_, viewRegistry) in
            guard let self = self else {
                print("🚨 [Pods RNKLineView] appendCandle self deallocated for tag:", reactTag)
                return
            }

            let viewFromRegistry = viewRegistry?[reactTag] as? HTKLineContainerView
            let viewDirect = uiManager?.view(forReactTag: reactTag) as? HTKLineContainerView
            let view = viewFromRegistry ?? viewDirect

            if view == nil {
                if let existing = viewRegistry?[reactTag] {
                    print("🚨 [Pods RNKLineView] appendCandle found view but wrong type: \(type(of: existing)) for tag:", reactTag)
                } else {
                    print("🚨 [Pods RNKLineView] appendCandle no view for tag:", reactTag)
                }
                let registryKeys = viewRegistry?.keys.map { $0 } ?? []
                print("🚨 [Pods RNKLineView] appendCandle viewRegistry keys:", registryKeys)
                return
            }

            let dict = candle as? [String: Any] ?? [:]
            print("[RNKLineView][iOS] appendCandle keys:", Array(dict.keys))
            view?.appendCandle(dict)
        }
    }

    // Called from JS: NativeModules.RNKLineView.updateLastCandle(reactTag, candle)
    @objc func updateLastCandle(_ reactTag: NSNumber, candle: NSDictionary) {
        print("🚀 [Pods RNKLineView] updateLastCandle called, keys = \(Array(candle.allKeys))")
        let uiManager = bridge.uiManager
        uiManager?.addUIBlock { [weak self] (_, viewRegistry) in
            guard let self = self else {
                print("🚨 [Pods RNKLineView] updateLastCandle self deallocated for tag:", reactTag)
                return
            }

            // Try both registry and direct lookup (Fabric/Paper)
            let viewFromRegistry = viewRegistry?[reactTag] as? HTKLineContainerView
            let viewDirect = uiManager?.view(forReactTag: reactTag) as? HTKLineContainerView
            let view = viewFromRegistry ?? viewDirect

            if view == nil {
                if let existing = viewRegistry?[reactTag] {
                    print("🚨 [Pods RNKLineView] updateLastCandle found view but wrong type: \(type(of: existing)) for tag:", reactTag)
                } else {
                    print("🚨 [Pods RNKLineView] updateLastCandle no view for tag:", reactTag)
                }
                let registryKeys = viewRegistry?.keys.map { $0 } ?? []
                print("🚨 [Pods RNKLineView] updateLastCandle viewRegistry keys:", registryKeys)
                return
            }

            let dict = candle as? [String: Any] ?? [:]
            print("[RNKLineView][iOS] updateLastCandle keys:", Array(dict.keys))
            print("[Pods RNKLineView] updateLastCandle dispatch to container, tag:", reactTag)
            view?.updateLastCandle(dict)
        }
    }

    // Called from JS: NativeModules.RNKLineView.unPredictionSelect(reactTag, null)
    @objc func unPredictionSelect(_ reactTag: NSNumber, unused: Any?) {
        print("🚀 [Pods RNKLineView] unPredictionSelect called")
        let uiManager = bridge.uiManager
        uiManager?.addUIBlock { [weak self] (_, viewRegistry) in
            guard let self = self else { return }
            
            // Try both registry and direct lookup
            let viewFromRegistry = viewRegistry?[reactTag] as? HTKLineContainerView
            let viewDirect = uiManager?.view(forReactTag: reactTag) as? HTKLineContainerView
            let view = viewFromRegistry ?? viewDirect
            
            if let targetView = view {
                 targetView.unPredictionSelect()
            } else {
                 print("🚨 [Pods RNKLineView] unPredictionSelect view not found for tag:", reactTag)
            }
        }
    }

}
