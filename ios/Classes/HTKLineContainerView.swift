//
//  HTKLineContainerView.swift
//  Base64
//
//  Created by hublot on 2020/8/26.
//

import UIKit

class HTKLineContainerView: UIView {
    
    var configManager = HTKLineConfigManager()
    
    @objc var onDrawItemDidTouch: RCTBubblingEventBlock?
    
    @objc var onDrawItemComplete: RCTBubblingEventBlock?
    
    @objc var onDrawPointComplete: RCTBubblingEventBlock?
    
    @objc var optionList: String? {
        didSet {
            guard let optionList = optionList else {
                return
            }
            
            RNKLineView.queue.async { [weak self] in
                do {
                    guard let optionListData = optionList.data(using: .utf8),
                          let optionListDict = try JSONSerialization.jsonObject(with: optionListData, options: .allowFragments) as? [String: Any] else {
                        return
                    }
                    self?.configManager.reloadOptionList(optionListDict)
                    DispatchQueue.main.async {
                        guard let self = self else { return }
                        self.reloadConfigManager(self.configManager)
                    }
                } catch {
                    print("Error parsing optionList: \(error)")
                }
            }
        }
    }

    lazy var klineView: HTKLineView = {
        let klineView = HTKLineView.init(CGRect.zero, configManager)
        return klineView
    }()
    
    lazy var shotView: HTShotView = {
        let shotView = HTShotView.init(frame: CGRect.zero)
        shotView.dimension = 100
        return shotView
    }()

    func setupChildViews() {
        klineView.frame = bounds
        let superShotView = reactSuperview()?.reactSuperview()?.reactSuperview()
        superShotView?.reactSuperview()?.addSubview(shotView)
        shotView.shotView = superShotView
        shotView.reactSetFrame(CGRect.init(x: 50, y: 50, width: shotView.dimension, height: shotView.dimension))
    }

    override var frame: CGRect {
        didSet {
	        setupChildViews()
        }
    }
    
    override func reactSetFrame(_ frame: CGRect) {
        super.reactSetFrame(frame)
        setupChildViews()
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        addSubview(klineView)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func appendCandle(_ payload: [String: Any]) {
        let prefix = "[KLineView][appendCandle]"
        let requiredFields = ["time", "open", "high", "low", "close", "volume"]

        RNKLineView.queue.async { [weak self] in
            guard let self = self else { return }

            guard self.configManager.modelArray.isEmpty == false else {
                print("\(prefix) data source not ready: modelArray is empty")
                return
            }

            var missingFields = [String]()
            for key in requiredFields where payload[key] == nil {
                missingFields.append(key)
            }
            if missingFields.isEmpty == false {
                print("\(prefix) missing required fields: \(missingFields)")
                return
            }

            func numberValue(_ value: Any?) -> Double? {
                switch value {
                case let number as NSNumber:
                    return number.doubleValue
                case let string as String:
                    return Double(string)
                default:
                    return nil
                }
            }

            var numeric = [String: Double]()
            for key in requiredFields {
                guard let value = payload[key] else { continue }
                guard let number = numberValue(value) else {
                    print("\(prefix) non-numeric field '\(key)' with value: \(value) (\(type(of: value)))")
                    return
                }
                numeric[key] = number
            }

            guard numeric.count == requiredFields.count else {
                print("\(prefix) unable to extract all numeric fields from payload: \(payload)")
                return
            }

            let open = numeric["open"]!
            let high = numeric["high"]!
            let low = numeric["low"]!
            let close = numeric["close"]!
            let volume = numeric["volume"]!
            let rawTime = numeric["time"]!
            var normalizedTime = rawTime

            if rawTime > 1_000_000_000_000 {
                normalizedTime = rawTime / 1000
                print("\(prefix) time appears in ms; normalized to seconds: \(normalizedTime)")
            } else {
                print("\(prefix) time treated as seconds: \(normalizedTime)")
            }

            let maxOpenClose = max(open, close)
            let minOpenClose = min(open, close)
            if high < maxOpenClose || low > minOpenClose || high < low {
                print("\(prefix) invalid candle values open:\(open) high:\(high) low:\(low) close:\(close) volume:\(volume) time:\(normalizedTime)")
                return
            }

            let model = HTKLineModel()
            model.id = CGFloat(normalizedTime)
            model.dateString = "\(Int(normalizedTime))"
            model.open = CGFloat(open)
            model.high = CGFloat(high)
            model.low = CGFloat(low)
            model.close = CGFloat(close)
            model.volume = CGFloat(volume)

            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                guard self.configManager.modelArray.isEmpty == false else {
                    print("\(prefix) data source not ready on main thread; skip append")
                    return
                }
                self.configManager.modelArray.append(model)
                self.reloadConfigManager(self.configManager)
            }
        }
    }
    
    func reloadConfigManager(_ configManager: HTKLineConfigManager) {
        
        configManager.onDrawItemDidTouch = { [weak self] (drawItem, drawItemIndex) in
            self?.configManager.shouldReloadDrawItemIndex = drawItemIndex
            guard let drawItem = drawItem, let colorList = drawItem.drawColor.cgColor.components else {
                self?.onDrawItemDidTouch?([
                    "shouldReloadDrawItemIndex": drawItemIndex,
                ])
                return
            }
            self?.onDrawItemDidTouch?([
                "shouldReloadDrawItemIndex": drawItemIndex,
                "drawColor": colorList,
                "drawLineHeight": drawItem.drawLineHeight,
                "drawDashWidth": drawItem.drawDashWidth,
                "drawDashSpace": drawItem.drawDashSpace,
                "drawIsLock": drawItem.drawIsLock
            ])
        }
        configManager.onDrawItemComplete = { [weak self] (drawItem, drawItemIndex) in
            self?.onDrawItemComplete?([AnyHashable: Any].init())
        }
        configManager.onDrawPointComplete = { [weak self] (drawItem, drawItemIndex) in
            guard let drawItem = drawItem else {
                return
            }
            self?.onDrawPointComplete?([
                "pointCount": drawItem.pointList.count
            ])
        }
        
        let reloadIndex = configManager.shouldReloadDrawItemIndex
        if reloadIndex >= 0, reloadIndex < klineView.drawContext.drawItemList.count {
            let drawItem = klineView.drawContext.drawItemList[reloadIndex]
            drawItem.drawColor = configManager.drawColor
            drawItem.drawLineHeight = configManager.drawLineHeight
            drawItem.drawDashWidth = configManager.drawDashWidth
            drawItem.drawDashSpace = configManager.drawDashSpace
            drawItem.drawIsLock = configManager.drawIsLock
            if (configManager.drawShouldTrash) {
                configManager.shouldReloadDrawItemIndex = HTDrawState.showPencil.rawValue
                klineView.drawContext.drawItemList.remove(at: reloadIndex)
                configManager.drawShouldTrash = false
            }
            klineView.drawContext.setNeedsDisplay()
        }
        
        klineView.reloadConfigManager(configManager)
        shotView.shotColor = configManager.shotBackgroundColor
        if configManager.shouldFixDraw {
            configManager.shouldFixDraw = false
            klineView.drawContext.fixDrawItemList()
        }
        if (configManager.shouldClearDraw) {
            configManager.drawType = .none
            configManager.shouldClearDraw = false
            klineView.drawContext.clearDrawItemList()
        }
    }
    
    private func convertLocation(_ location: CGPoint) -> CGPoint {
        var reloadLocation = location
        reloadLocation.x = max(min(reloadLocation.x, bounds.size.width), 0)
        reloadLocation.y = max(min(reloadLocation.y, bounds.size.height), 0)
//        reloadLocation.x += klineView.contentOffset.x
        reloadLocation = klineView.valuePointFromViewPoint(reloadLocation)
        return reloadLocation
    }
    
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let view = super.hitTest(point, with: event)
        if view == klineView {
            switch configManager.shouldReloadDrawItemIndex {
            case HTDrawState.none.rawValue:
                return view
            case HTDrawState.showPencil.rawValue:
                if configManager.drawType == .none {
                    if HTDrawItem.canResponseLocation(klineView.drawContext.drawItemList, convertLocation(point), klineView) != nil {
                        return self
                    } else {
                        return view
                    }
                } else {
                    return self
                }
            case HTDrawState.showContext.rawValue:
                return self
            default:
                return self
            }
        }
        return view
//        if view == drawView, configManager.enabledDraw == false {
//            return klineView
//        }
//        return view
    }
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        touchesGesture(touches, .began)
    }
    
    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        touchesGesture(touches, .changed)
    }
    
    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        touchesGesture(touches, .ended)
    }
    
    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        touchesEnded(touches, with: event)
    }
    
    func touchesGesture(_ touched: Set<UITouch>, _ state: UIGestureRecognizerState) {
        guard var location = touched.first?.location(in: self) else {
            shotView.shotPoint = nil
            return
        }
        var previousLocation = touched.first?.previousLocation(in: self) ?? location
        location = convertLocation(location)
        previousLocation = convertLocation(previousLocation)
        
        let translation = CGPoint.init(x: location.x - previousLocation.x, y: location.y - previousLocation.y)
        
        klineView.drawContext.touchesGesture(location, translation, state)
        shotView.shotPoint = state != .ended ? touched.first?.location(in: self) : nil
    }
    
}

