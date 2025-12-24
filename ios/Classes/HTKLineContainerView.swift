//
//  HTKLineContainerView.swift
//  Base64
//
//  Created by hublot on 2020/8/26.
//

import UIKit

class HTKLineContainerView: UIView {
    
    var configManager = HTKLineConfigManager()

    // Tooltip overlay (card)
    private var predictionOverlayView: UIView?
    private var predictionCardView: HTPredictionTooltipView?
    
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

    // ----- Price Prediction overlay (Phase 2 - iOS only) -----
    func setPrediction(_ payload: [String: Any]) {
        let anchorIndex = max(0, configManager.modelArray.count - 1)
        guard let state = HTPredictionState.fromPayload(payload, anchorIndex: anchorIndex) else {
            print("[RNKLineView][iOS] setPrediction invalid payload keys:", Array(payload.keys))
            return
        }

        // Make sure there is enough blank space on the right for horizon candles.
        configManager.rightOffsetCandles = max(configManager.rightOffsetCandles, state.horizonCandles + 3)

        klineView.setPredictionState(state)
        reloadConfigManager(configManager)
    }

    func clearPrediction() {
        hidePredictionTooltip()
        klineView.clearPredictionState()
        reloadConfigManager(configManager)
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

        // Prediction interactions (tooltip is hosted by this container)
        klineView.onPredictionTap = { [weak self] offset, pointInKLineView in
            guard let self = self else { return }
            let pointInContainer = self.convert(pointInKLineView, from: self.klineView)
            self.showPredictionTooltip(offset: offset, at: pointInContainer)
        }
        klineView.onInteractionBegan = { [weak self] in
            self?.hidePredictionTooltip()
        }
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
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

    // MARK: - Prediction tooltip

    private func hidePredictionTooltip() {
        predictionOverlayView?.removeFromSuperview()
        predictionOverlayView = nil
        predictionCardView = nil
    }

    private func showPredictionTooltip(offset: Int, at anchor: CGPoint) {
        guard let state = klineView.predictionState else { return }

        // Build content
        let candle = state.predictedCandleByOffset[offset]
        let band = state.bands.first(where: { $0.contains(offset: offset) })
        let mean = state.points.first(where: { $0.offset == offset })?.price

        let tsMs = state.baseTimestampMs + state.intervalMs * Int64(offset)
        let date = Date(timeIntervalSince1970: TimeInterval(tsMs) / 1000.0)
        let df = DateFormatter()
        df.dateFormat = "MM-dd HH:mm"
        let dateText = df.string(from: date)

        let title = "Prediction"
        var lines: [String] = []
        lines.append("t: \(dateText) (+\(offset))")
        if let candle = candle {
            lines.append(String(format: "O: %.2f  H: %.2f", candle.open, candle.high))
            lines.append(String(format: "L: %.2f  C: %.2f", candle.low, candle.close))
        } else if let mean = mean {
            lines.append(String(format: "Mean: %.2f", mean))
        }
        if let band = band {
            lines.append(String(format: "Band: %.2f - %.2f", band.bottom, band.top))
            if let c = band.confidence {
                lines.append(String(format: "Conf: %.0f%%", c * 100))
            }
        }

        // Recreate overlay
        hidePredictionTooltip()
        let overlay = UIView(frame: bounds)
        overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        overlay.backgroundColor = UIColor.clear
        overlay.isUserInteractionEnabled = true

        let dismissTap = UITapGestureRecognizer(target: self, action: #selector(onOverlayTapped(_:)))
        dismissTap.cancelsTouchesInView = false
        dismissTap.delegate = self
        overlay.addGestureRecognizer(dismissTap)

        let card = HTPredictionTooltipView(title: title, lines: lines)
        card.translatesAutoresizingMaskIntoConstraints = false

        overlay.addSubview(card)
        addSubview(overlay)
        bringSubview(overlay)

        // Position card near anchor
        let maxWidth: CGFloat = 240
        let estimatedHeight = card.estimatedHeight(width: maxWidth)
        let padding: CGFloat = 10
        var x = anchor.x + 10
        var y = anchor.y - estimatedHeight - 10
        if x + maxWidth + padding > bounds.width {
            x = max(padding, bounds.width - maxWidth - padding)
        }
        if y < padding {
            y = min(bounds.height - estimatedHeight - padding, anchor.y + 10)
        }

        NSLayoutConstraint.activate([
            card.leadingAnchor.constraint(equalTo: overlay.leadingAnchor, constant: x),
            card.topAnchor.constraint(equalTo: overlay.topAnchor, constant: y),
            card.widthAnchor.constraint(equalToConstant: maxWidth),
            card.heightAnchor.constraint(equalToConstant: estimatedHeight)
        ])

        predictionOverlayView = overlay
        predictionCardView = card
    }

    @objc private func onOverlayTapped(_ gesture: UITapGestureRecognizer) {
        hidePredictionTooltip()
    }
    
}

// MARK: - UIGestureRecognizerDelegate

extension HTKLineContainerView: UIGestureRecognizerDelegate {
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        // Only dismiss when tapping outside the card
        if let card = predictionCardView {
            let v = touch.view
            if let v = v, v.isDescendant(of: card) {
                return false
            }
        }
        return true
    }
}

// MARK: - Tooltip view

private final class HTPredictionTooltipView: UIView {
    private let titleLabel = UILabel()
    private let stack = UIStackView()

    init(title: String, lines: [String]) {
        super.init(frame: .zero)
        layer.cornerRadius = 12
        layer.masksToBounds = true

        backgroundColor = UIColor.black.withAlphaComponent(0.75)

        titleLabel.font = UIFont.boldSystemFont(ofSize: 14)
        titleLabel.textColor = .white
        titleLabel.text = title

        stack.axis = .vertical
        stack.spacing = 4
        stack.alignment = .leading

        addSubview(titleLabel)
        addSubview(stack)

        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        stack.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: topAnchor, constant: 10),
            titleLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 10),
            titleLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10),

            stack.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 10),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -10)
        ])

        for line in lines {
            let lbl = UILabel()
            lbl.font = UIFont.systemFont(ofSize: 12)
            lbl.textColor = .white
            lbl.numberOfLines = 1
            lbl.text = line
            stack.addArrangedSubview(lbl)
        }
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func estimatedHeight(width: CGFloat) -> CGFloat {
        // Very lightweight estimate based on line count
        let titleH: CGFloat = 18
        let lineH: CGFloat = 16
        let count = CGFloat(stack.arrangedSubviews.count)
        return 10 + titleH + 8 + (count * lineH) + 10
    }
}

