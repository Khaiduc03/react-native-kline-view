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

    private let commandAppendCandle = "appendCandle"

    override func view() -> UIView! {
        return HTKLineContainerView()
    }

    override class func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func constantsToExport() -> [AnyHashable : Any]! {
        return [
            "Commands": [
                commandAppendCandle: 0
            ]
        ]
    }

    @objc
    func appendCandle(_ reactTag: NSNumber, payload: NSDictionary) {
        let prefix = "[KLineView][appendCandle]"
        guard let bridge = bridge else {
            print("\(prefix) bridge unavailable, cannot append candle")
            return
        }
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] else {
                print("\(prefix) no view found for reactTag: \(reactTag)")
                return
            }
            guard let container = view as? HTKLineContainerView else {
                print("\(prefix) view for reactTag \(reactTag) is not HTKLineContainerView: \(type(of: view))")
                return
            }
            guard let payloadDict = payload as? [String: Any] else {
                print("\(prefix) Payload is not a dictionary / cannot be cast; actual: \(type(of: payload)) value: \(payload)")
                return
            }
            container.appendCandle(payloadDict)
        }
    }

}
