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
    
    @objc var onPredictionSelect: RCTBubblingEventBlock?
    @objc var onLoadMore: RCTBubblingEventBlock?
    @objc var onChartError: RCTBubblingEventBlock?
    
    @objc var config: NSDictionary? {
        didSet {
            guard let config = config as? [String: Any] else {
                return
            }
            
            RNKLineView.queue.async { [weak self] in
                self?.configManager.reloadOptionList(config)
                
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    let isEmpty = self.configManager.predictionList.isEmpty
                    if !isEmpty {
                        self.klineView.startPredictionAnimation()
                    }
                    self.reloadConfigManager(self.configManager)
                }
            }
        }
    }


    // ----- Imperative API (Phase 1) -----
    // These methods update only the data set (modelArray) without rebuilding the full optionList JSON.
    func setData(_ candles: [[String: Any]]) {
        RNKLineView.queue.async { [weak self] in
            guard let self = self else { return }
            let models = HTKLineModel.packModelArray(candles)
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.configManager.modelArray = models
                self.configManager.shouldScrollToEnd = false
                self.reloadConfigManager(self.configManager)
            }
        }
    }

    func appendCandle(_ candle: [String: Any]) {
        RNKLineView.queue.async { [weak self] in
            guard let self = self else { return }
            let model = HTKLineModel.packModel(candle)
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.configManager.modelArray.append(model)
                self.configManager.shouldScrollToEnd = false
                self.reloadConfigManager(self.configManager)
            }
        }
    }

    func prependData(_ candles: [[String: Any]]) {
        RNKLineView.queue.async { [weak self] in
            guard let self = self else { return }
            let models = HTKLineModel.packModelArray(candles)
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                if models.isEmpty {
                    return
                }
                let previousModels = self.configManager.modelArray
                let oldOffset = self.klineView.contentOffset.x
                let oldItemWidth = self.configManager.itemWidth
                let oldVisibleStart = self.klineView.visibleRange.lowerBound
                let safeVisibleStart = max(0, min(oldVisibleStart, max(previousModels.count - 1, 0)))
                let anchorId = previousModels.isEmpty ? nil : previousModels[safeVisibleStart].id
                let anchorScreenX = anchorId == nil
                    ? nil
                    : ((CGFloat(safeVisibleStart) + 0.5) * oldItemWidth - oldOffset)

                let previousSelectedIndex = self.klineView.selectedIndex
                let selectedId: Int? = {
                    if previousSelectedIndex < 0 || previousSelectedIndex >= previousModels.count {
                        return nil
                    }
                    return previousModels[previousSelectedIndex].id
                }()

                self.configManager.modelArray.insert(contentsOf: models, at: 0)
                self.configManager.shouldScrollToEnd = false
                self.reloadConfigManager(self.configManager)

                if let anchorId = anchorId, let oldAnchorScreenX = anchorScreenX {
                    if let newAnchorIndex = self.configManager.modelArray.firstIndex(where: { $0.id == anchorId }) {
                        let newItemWidth = self.configManager.itemWidth
                        let newAnchorCenter = (CGFloat(newAnchorIndex) + 0.5) * newItemWidth
                        self.klineView.reloadContentOffset(newAnchorCenter - oldAnchorScreenX)
                    } else {
                        let fallbackDelta = CGFloat(models.count) * self.configManager.itemWidth
                        self.klineView.reloadContentOffset(oldOffset + fallbackDelta)
                        self.onChartError?([
                            "code": "E_PREPEND_ANCHOR_MISS",
                            "message": "Anchor candle missing after prependData on iOS.",
                            "source": "ios",
                            "fatal": false,
                        ])
                    }
                } else {
                    let fallbackDelta = CGFloat(models.count) * self.configManager.itemWidth
                    self.klineView.reloadContentOffset(oldOffset + fallbackDelta)
                }

                if let selectedId = selectedId,
                   self.klineView.selectedIndex >= 0,
                   let newSelectedIndex = self.configManager.modelArray.firstIndex(where: { $0.id == selectedId }) {
                    self.klineView.selectedIndex = newSelectedIndex
                    self.klineView.setNeedsDisplay()
                } else if self.klineView.selectedIndex >= 0 {
                    self.klineView.selectedIndex += models.count
                    self.klineView.setNeedsDisplay()
                }
            }
        }
    }

    func updateLastCandle(_ candle: [String: Any]) {
        print("[RNKLineView][iOS] updateLastCandle payload keys:", Array(candle.keys))
        RNKLineView.queue.async { [weak self] in
            guard let self = self else { return }
            let model = HTKLineModel.packModel(candle)
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                let beforeCount = self.configManager.modelArray.count
                if self.configManager.modelArray.isEmpty {
                    self.configManager.modelArray.append(model)
                } else {
                    self.configManager.modelArray[self.configManager.modelArray.count - 1] = model
                }
                let afterCount = self.configManager.modelArray.count
                print("[RNKLineView][iOS] updateLastCandle beforeCount:", beforeCount, "afterCount:", afterCount, "lastId:", model.id)
                self.configManager.shouldScrollToEnd = false
                self.reloadConfigManager(self.configManager)
            }
        }
    }

    func unPredictionSelect() {
        RNKLineView.queue.async { [weak self] in
             DispatchQueue.main.async { [weak self] in
                 self?.klineView.unPredictionSelect()
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
    
    func reloadConfigManager(_ configManager: HTKLineConfigManager) {
        
        // Bind Prediction Selection
        klineView.onPredictionSelect = { [weak self] (details) in
             // If details is nil/empty, we can send empty dict to signal deselect
             let payload = details ?? [:]
             self?.onPredictionSelect?(payload)
        }
        klineView.onReachLeftThreshold = { [weak self] payload in
            self?.onLoadMore?(payload)
        }
        
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
                klineView.drawContext.removeDrawItem(at: reloadIndex)
                configManager.drawShouldTrash = false
            }
            klineView.drawContext.setNeedsDisplay()
        } else if reloadIndex > HTDrawState.showContext.rawValue {
            configManager.shouldReloadDrawItemIndex = HTDrawState.showPencil.rawValue
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

    private func emitError(code: String, message: String, fatal: Bool) {
        onChartError?([
            "code": code,
            "message": message,
            "source": "ios",
            "fatal": fatal,
        ])
    }
    
}
