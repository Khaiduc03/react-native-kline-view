//
//  HTKLineView.swift
//  HTKLineView
//
//  Created by hublot on 2020/3/17.
//  Copyright © 2020 hublot. All rights reserved.
//

import UIKit
import Lottie

class HTKLineView: UIScrollView {

    var configManager: HTKLineConfigManager

    lazy var drawContext: HTDrawContext = {
        let drawContext = HTDrawContext.init(self, configManager)
        return drawContext
    }()

    var visibleRange = 0...0
    var selectedIndex = -1
    // Lưu vị trí chạm cuối cùng (theo view) để Y của crosshair tự do
    var selectedLocation: CGPoint?
    var scale: CGFloat = 1

    let mainDraw = HTMainDraw.init()
    let volumeDraw = HTVolumeDraw.init()
    let macdDraw = HTMacdDraw.init()
    let kdjDraw = HTKdjDraw.init()
    let rsiDraw = HTRsiDraw.init()
    let wrDraw = HTWrDraw.init()

    var childDraw: HTKLineDrawProtocol?

    var animationView = LottieAnimationView()
    var lastLoadAnimationSource = ""

    // 计算属性
    var visibleModelArray = [HTKLineModel]()
    var volumeRange: ClosedRange<CGFloat> = 0...0
    var allWidth: CGFloat = 0
    var allHeight: CGFloat = 0
    var mainMinMaxRange = Range<CGFloat>.init(uncheckedBounds: (lower: 0, upper: 0))
    var textHeight: CGFloat  = 0
    var mainBaseY: CGFloat  = 0
    var mainHeight: CGFloat  = 0
    var volumeMinMaxRange = Range<CGFloat>.init(uncheckedBounds: (lower: 0, upper: 0))
    var volumeBaseY: CGFloat  = 0
    var volumeHeight: CGFloat  = 0
    var childMinMaxRange = Range<CGFloat>.init(uncheckedBounds: (lower: 0, upper: 0))
    var childBaseY: CGFloat  = 0
    var childHeight: CGFloat  = 0

    // === Grid spacing target (ô to, thưa) ===
    private let GRID_MIN_V_SPACING_PX: CGFloat = 84   // dọc: 96–128 để ô to hơn
    private let GRID_MIN_H_SPACING_PX: CGFloat = 64   // ngang: 56–72 là vừa mắt
    private let PRICE_TICK_COUNT: Int = 6
    private let PRICE_LABEL_VERTICAL_OFFSET: CGFloat = 8

    private var priceGridLevels: [CGFloat] = []

    // MARK: - Helpers cho lưới
    @inline(__always)
    private func hairlineWidth() -> CGFloat {
        // 1px "thật" theo mật độ màn hình (giữ line mảnh & sắc)
        return 1.0 / UIScreen.main.scale
    }

    @inline(__always)
    private func alignToPixel(_ v: CGFloat) -> CGFloat {
        // Canh vào ranh giới pixel để không mờ/béo do anti-alias
        let s = UIScreen.main.scale
        return (floor(v * s) + 0.5) / s
    }

    /// Chọn bước nến "đẹp": 1,2,3,5 × 10^k sao cho step*itemWidth >= minSpacing
    private func niceCandleStep(itemWidth: CGFloat, minSpacing: CGFloat) -> Int {
        guard itemWidth > 0 else { return 1 }
        let raw = max(1, Int(ceil(minSpacing / itemWidth))) // số nến tối thiểu để đạt spacing yêu cầu
        var mag = 1
        var r = raw
        while r > 5 {
            r = (r + 9) / 10
            mag *= 10
        }
        for b in [1, 2, 3, 5] where b >= r { return b * mag }
        return 5 * mag
    }

    /// Chọn bước giá "đẹp": 1, 2, 5 × 10^k
    private func nicePriceStep(minValue: CGFloat,
                               maxValue: CGFloat,
                               targetLines: Int) -> CGFloat {
        let range = maxValue - minValue
        guard range > 0, targetLines > 0 else { return 1 }

        let roughStep = range / CGFloat(targetLines)
        let mag = pow(10.0, floor(log10(roughStep)))
        let norm = roughStep / mag

        let niceNorm: CGFloat
        if norm < 1.5 {
            niceNorm = 1
        } else if norm < 3 {
            niceNorm = 2
        } else if norm < 7 {
            niceNorm = 5
        } else {
            niceNorm = 10
        }

        return niceNorm * mag
    }

    // MARK: - Init

    init(_ frame: CGRect, _ configManager: HTKLineConfigManager) {
        self.configManager = configManager
        super.init(frame: frame)
        delegate = self
        bounces = false
        showsHorizontalScrollIndicator = false
        showsVerticalScrollIndicator = false
        backgroundColor = UIColor.clear

        addGestureRecognizer(UILongPressGestureRecognizer.init(target: self, action: #selector(longPressSelector)))
        addGestureRecognizer(UITapGestureRecognizer.init(target: self, action: #selector(tapSelector)))
        addGestureRecognizer(UIPinchGestureRecognizer.init(target: self, action: #selector(pinchSelector)))
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func reloadConfigManager(_ configManager: HTKLineConfigManager) {

        switch configManager.childType {
        case .none:
            childDraw = nil
        case .macd:
            childDraw = macdDraw
        case .kdj:
            childDraw = kdjDraw
        case .rsi:
            childDraw = rsiDraw
        case .wr:
            childDraw = wrDraw
        }

        let isEnd = contentOffset.x + 1 + bounds.size.width >= contentSize.width
        reloadContentSize()

        if (configManager.shouldScrollToEnd || isEnd) {
            let toEndContentOffset = contentSize.width - bounds.size.width
            let distance = abs(contentOffset.x - toEndContentOffset)
            let animated = distance <= configManager.itemWidth
            reloadContentOffset(toEndContentOffset, animated)
        }

        scrollViewDidScroll(self)

        guard lastLoadAnimationSource != configManager.closePriceRightLightLottieSource else {
            return
        }

        lastLoadAnimationSource = configManager.closePriceRightLightLottieSource

        DispatchQueue.global().async { [weak self] in
            guard let this = self,
                  let data = this.configManager.closePriceRightLightLottieSource.data(using: String.Encoding.utf8),
                  let animation = try? JSONDecoder().decode(LottieAnimation.self, from: data) else {
                return
            }
            DispatchQueue.main.async {
                this.animationView.animation = animation
                this.animationView.loopMode = .loop
                this.animationView.play()
                var size = animation.size
                let scale = this.configManager.closePriceRightLightLottieScale
                size.width *= scale
                size.height *= scale
                this.animationView.frame.size = size
                this.animationView.isHidden = true
                this.addSubview(this.animationView)
                this.setNeedsDisplay()
            }
        }
    }

    func reloadContentSize() {
        configManager.reloadScrollViewScale(scale)
        let rightOffset = CGFloat(configManager.rightOffsetCandles)
        let contentWidth = configManager.itemWidth * (CGFloat(configManager.modelArray.count) + rightOffset) + configManager.paddingRight
        contentSize = CGSize.init(width: contentWidth, height: frame.size.height)
    }

    func reloadContentOffset(_ contentOffsetX: CGFloat, _ animated: Bool = false) {
        let offsetX = max(0, min(contentOffsetX, contentSize.width - bounds.size.width))
        setContentOffset(CGPoint.init(x: offsetX, y: 0), animated: animated)
    }

    func contextTranslate(_ context: CGContext, _ x: CGFloat, _ block: (CGContext) -> Void) {
        context.saveGState()
        context.translateBy(x: x, y: 0)
        block(context)
        context.restoreGState()
    }

    override func draw(_ rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext(), configManager.modelArray.count > 0 else {
            return
        }

        calculateBaseHeight()
        contextTranslate(context, CGFloat(visibleRange.lowerBound) * configManager.itemWidth, { context in
            drawCandle(context)
        })

        contextTranslate(context, contentOffset.x, { context in
            // context.setFillColor(UIColor.red.withAlphaComponent(0.1).cgColor)
            // context.fill(CGRect.init(x: 0, y: mainBaseY, width: allWidth, height: mainHeight))

            drawGrid(context)
            drawText(context)
            drawValue(context)

            drawHighLow(context)
            drawTime(context)
            drawPrediction(context)
            drawClosePrice(context)
            drawSelectedLine(context)
            drawSelectedBoard(context)
            drawSelectedTime(context)

            drawContext.draw(contentOffset.x)
        })
    }

    func calculateBaseHeight() {
        self.visibleModelArray = configManager.modelArray.count > 0 ? Array(configManager.modelArray[visibleRange]) : configManager.modelArray
        self.volumeRange = configManager.mainFlex...configManager.mainFlex + configManager.volumeFlex

        self.allHeight = self.bounds.size.height - configManager.paddingBottom
        self.allWidth = self.bounds.size.width

        var mainMinMax = mainDraw.minMaxRange(visibleModelArray, configManager)
        // Include prediction targets in min/max range
        for prediction in configManager.predictionList {
            if let value = prediction["value"] as? CGFloat {
                mainMinMax = min(mainMinMax.lowerBound, value)..<max(mainMinMax.upperBound, value)
            }
        }
        self.mainMinMaxRange = mainMinMax

        self.textHeight = mainDraw.textHeight(font: UIFont.systemFont(ofSize: 11)) / 2
        self.mainBaseY = configManager.paddingTop - textHeight
        self.mainHeight = allHeight * volumeRange.lowerBound - mainBaseY - textHeight

        self.volumeMinMaxRange = volumeDraw.minMaxRange(visibleModelArray, configManager)
        self.volumeBaseY = allHeight * volumeRange.lowerBound + configManager.headerHeight + textHeight
        self.volumeHeight = allHeight * (volumeRange.upperBound - volumeRange.lowerBound) - configManager.headerHeight - textHeight

        self.childMinMaxRange = childDraw?.minMaxRange(visibleModelArray, configManager) ?? Range<CGFloat>.init(uncheckedBounds: (lower: 0, upper: 0))
        self.childBaseY = allHeight * volumeRange.upperBound + configManager.headerHeight + textHeight
        self.childHeight = allHeight * (1 - volumeRange.upperBound) - configManager.headerHeight - textHeight
    }

    func yFromValue(_ value: CGFloat) -> CGFloat {
        let scale = (mainMinMaxRange.upperBound - mainMinMaxRange.lowerBound) / mainHeight
        var y = mainBaseY + mainHeight * 0.5
        if (scale != 0) {
            y = mainBaseY + (mainMinMaxRange.upperBound - value) / scale
        }
        return y
    }

    func valueFromY(_ y: CGFloat) -> CGFloat {
        let scale = (mainMinMaxRange.upperBound - mainMinMaxRange.lowerBound) / mainHeight
        var value = scale * mainHeight * 0.5
        if (scale != 0) {
            value = mainMinMaxRange.upperBound - (y - mainBaseY) * scale
        }
        return value
    }

    func xFromValue(_ value: CGFloat) -> CGFloat {
        guard let firstItem = configManager.modelArray.first, let lastItem = configManager.modelArray.last else {
            return 0
        }
        let scale = (lastItem.id - firstItem.id) / (configManager.itemWidth * CGFloat(configManager.modelArray.count - 1))
        let x = (value - firstItem.id) / scale + configManager.itemWidth / 2.0 - contentOffset.x
        return x
    }

    func valueFromX(_ x: CGFloat) -> CGFloat {
        guard let firstItem = configManager.modelArray.first, let lastItem = configManager.modelArray.last else {
            return 0
        }
        let scale = (lastItem.id - firstItem.id) / (configManager.itemWidth * CGFloat(configManager.modelArray.count - 1))
        let value = scale * (x + contentOffset.x - configManager.itemWidth / 2.0) + firstItem.id
        return value
    }

    // MARK: - Lưới (đã chỉnh: ô to, thưa, ổn định)
    func drawGrid(_ context: CGContext) {
        guard configManager.gridEnabled else { return }

        let baseColor = configManager.gridColor
        let minPrice = mainMinMaxRange.lowerBound
        let maxPrice = mainMinMaxRange.upperBound
        let range = maxPrice - minPrice
        guard range > 0, PRICE_TICK_COUNT >= 2 else { return }

        priceGridLevels.removeAll(keepingCapacity: true)

        let levelsCount = max(2, PRICE_TICK_COUNT)
        let step = range / CGFloat(levelsCount - 1)

        let gridLineWidth = max(hairlineWidth(), configManager.gridLineWidth * 1.2)
        context.setLineWidth(gridLineWidth)
        context.setStrokeColor(baseColor.withAlphaComponent(1.0).cgColor)

        for i in 0..<levelsCount {
            let value = minPrice + CGFloat(i) * step
            priceGridLevels.append(value)

            let y = alignToPixel(yFromValue(value))
            context.move(to: CGPoint(x: 0, y: y))
            context.addLine(to: CGPoint(x: allWidth, y: y))
            context.strokePath()
        }

        // --- Lưới dọc: bám nhãn thời gian (giống drawTime)
        let timeStep = niceCandleStep(itemWidth: configManager.itemWidth,
                                      minSpacing: GRID_MIN_V_SPACING_PX)
        if timeStep > 0, !visibleModelArray.isEmpty {
            let firstIndex = (visibleRange.lowerBound / timeStep) * timeStep
            context.setStrokeColor(baseColor.withAlphaComponent(1.0).cgColor)
            context.setLineWidth(gridLineWidth)

            var i = firstIndex
            while i <= visibleRange.upperBound {
                let xCenter = (CGFloat(i) + 0.5) * configManager.itemWidth - contentOffset.x
                let x = alignToPixel(xCenter)
                let startY = mainBaseY
                let endY = childBaseY + childHeight
                context.move(to: CGPoint(x: x, y: startY))
                context.addLine(to: CGPoint(x: x, y: endY))
                context.strokePath()
                i += timeStep
            }
        }
    }

    func drawCandle(_ context: CGContext) {
        if (configManager.isMinute) {
            mainDraw.drawGradient(visibleModelArray, mainMinMaxRange.upperBound, mainMinMaxRange.lowerBound, allWidth, mainBaseY, mainHeight, context, configManager)
        }

        for (i, model) in visibleModelArray.enumerated() {
            mainDraw.drawCandle(model, i, mainMinMaxRange.upperBound, mainMinMaxRange.lowerBound, mainBaseY, mainHeight, context, configManager)
            volumeDraw.drawCandle(model, i, volumeMinMaxRange.upperBound, volumeMinMaxRange.lowerBound, volumeBaseY, volumeHeight, context, configManager)
            childDraw?.drawCandle(model, i, childMinMaxRange.upperBound, childMinMaxRange.lowerBound, childBaseY, childHeight, context, configManager)

            let lastIndex = i == 0 ? i : i - 1
            let lastModel = visibleModelArray[lastIndex]
            mainDraw.drawLine(model, lastModel, mainMinMaxRange.upperBound, mainMinMaxRange.lowerBound, mainBaseY, mainHeight, i, lastIndex, context, configManager)
            volumeDraw.drawLine(model, lastModel, volumeMinMaxRange.upperBound, volumeMinMaxRange.lowerBound, volumeBaseY, volumeHeight, i, lastIndex, context, configManager)
            childDraw?.drawLine(model, lastModel, childMinMaxRange.upperBound, childMinMaxRange.lowerBound, childBaseY, childHeight, i, lastIndex, context, configManager)
        }
    }

    func drawText(_ context: CGContext) {
        var model = visibleModelArray.last
        if visibleRange.contains(selectedIndex) {
            model = visibleModelArray[selectedIndex - visibleRange.lowerBound]
        }
        if let model = model {
            let baseX: CGFloat = 5
            mainDraw.drawText(model, baseX, 10, context, configManager)
            volumeDraw.drawText(model, baseX, volumeBaseY - configManager.headerHeight, context, configManager)
            childDraw?.drawText(model, baseX, childBaseY - configManager.headerHeight, context, configManager)
        }
    }

    func drawValue(_ context: CGContext) {
        let baseX = self.allWidth
        if !priceGridLevels.isEmpty, mainHeight > 0 {
            let font = configManager.createFont(configManager.rightTextFontSize)
            let color = configManager.textColor

            for value in priceGridLevels {
                let y = alignToPixel(yFromValue(value))
                let title = configManager.precision(value, configManager.price)
                let width = mainDraw.textWidth(title: title, font: font)
                let height = mainDraw.textHeight(font: font)

                // Right-aligned, small padding
                let x = baseX - width - 4
                let textY = y - height / 2 - PRICE_LABEL_VERTICAL_OFFSET

                mainDraw.drawText(title: title,
                                  point: CGPoint(x: x, y: textY),
                                  color: color,
                                  font: font,
                                  context: context,
                                  configManager: configManager)
            }
        } else {
            mainDraw.drawValue(mainMinMaxRange.upperBound, mainMinMaxRange.lowerBound, baseX, mainBaseY, mainHeight, context, configManager)
        }
        volumeDraw.drawValue(volumeMinMaxRange.upperBound, volumeMinMaxRange.lowerBound, baseX, volumeBaseY, volumeHeight, context, configManager)
        childDraw?.drawValue(childMinMaxRange.upperBound, childMinMaxRange.lowerBound, baseX, childBaseY, childHeight, context, configManager)
    }

    // MARK: - Time labels (đã chỉnh để khớp vạch dọc & thưa)
    func drawTime(_ context: CGContext) {
        // Tự tính step theo itemWidth để nhãn bám đúng vạch dọc
        let step = niceCandleStep(itemWidth: configManager.itemWidth,
                                  minSpacing: GRID_MIN_V_SPACING_PX)
        guard !visibleModelArray.isEmpty else { return }

        let font = configManager.createFont(configManager.candleTextFontSize)

        // Vạch dọc đầu tiên khớp theo "step"
        let firstIndex = (visibleRange.lowerBound / step) * step
        var i = firstIndex

        while i <= visibleRange.upperBound {
            let local = i - visibleRange.lowerBound
            if local >= 0 && local < visibleModelArray.count {
                let item = visibleModelArray[local]
                let title = item.dateString
                let w = mainDraw.textWidth(title: title, font: font)
                let h = mainDraw.textHeight(font: font)

                // canh giữa nhãn dưới vạch dọc
                let xCenter = (CGFloat(i) + 0.5) * configManager.itemWidth - contentOffset.x
                let x = alignToPixel(xCenter - w / 2.0)
                let y = childBaseY + childHeight + (configManager.paddingBottom - h) / 2.0

                mainDraw.drawText(title: title,
                                  point: CGPoint(x: x, y: y),
                                  color: configManager.textColor,
                                  font: font,
                                  context: context,
                                  configManager: configManager)
            }
            i += step
        }
    }

    func drawHighLow(_ context: CGContext) {
        guard !configManager.isMinute else {
            return
        }
        var highIndex = 0
        var lowIndex = 0
        for (i, model) in visibleModelArray.enumerated() {
            if (model.high > visibleModelArray[highIndex].high) {
                highIndex = i
            }
            if (model.low < visibleModelArray[lowIndex].low) {
                lowIndex = i
            }
        }

        let drawValue: (Int, CGFloat) -> Void = { [weak self] (index, value) in
            guard let this = self else { return }

            var title = this.configManager.precision(value, this.configManager.price)
            let font = this.configManager.createFont(this.configManager.candleTextFontSize)
            let lineString = "--"
            let offset = CGFloat(index + this.visibleRange.lowerBound) * this.configManager.itemWidth - this.contentOffset.x
            let halfWidth = this.allWidth / 2
            var x = offset + this.configManager.itemWidth / 2

            var y = this.yFromValue(value)
            if (offset < halfWidth) {
                title = lineString + title
            } else {
                title = title + lineString
                x -= this.mainDraw.textWidth(title: title, font: font)
            }
            y -= this.mainDraw.textHeight(font: font) / 2
            y -= 1
            this.mainDraw.drawText(title: title, point: CGPoint.init(x: x, y: y), color: this.configManager.candleTextColor, font: font, context: context, configManager: this.configManager)
        }
        drawValue(highIndex, visibleModelArray[highIndex].high)
        drawValue(lowIndex, visibleModelArray[lowIndex].low)
    }

    // MARK: - Prediction / Live Analyst
    func drawPrediction(_ context: CGContext) {
        guard let lastModel = configManager.modelArray.last,
              !configManager.predictionList.isEmpty else {
            return
        }

        let count = configManager.modelArray.count
        
        var targetIndex = count - 1
        if let startTime = configManager.predictionStartTime {
            // Find index matching startTime
            for i in (0..<count).reversed() {
                if configManager.modelArray[i].id <= startTime {
                    targetIndex = i
                    break
                }
            }
        }
        
        let targetModel = configManager.modelArray[targetIndex]
        
        // Determine active range and hit status
        let startPrice = targetModel.close
        var hitIndex: Int?
        var winningPredictionIndex: Int?
        
        scanLoop: for i in (targetIndex + 1)..<count {
            let candle = configManager.modelArray[i]
            for (pIndex, prediction) in configManager.predictionList.enumerated() {
                if let val = prediction["value"] as? CGFloat {
                    // Check for target hit:
                    if (val > startPrice && candle.high >= val) ||
                        (val < startPrice && candle.low <= val) {
                        hitIndex = i
                        winningPredictionIndex = pIndex
                        break scanLoop
                    }
                }
            }
        }

        // Calculate Background Extension (Always min 10 or follows data)
        let currentDataLen = (count - 1) - targetIndex
        let bgExtension = max(currentDataLen, 10)

        // X positions
        let startX = CGFloat(targetIndex) * configManager.itemWidth + configManager.itemWidth / 2 - contentOffset.x
        let startY = yFromValue(startPrice)
        let bgEndX = startX + CGFloat(bgExtension) * configManager.itemWidth
        
        // Draw gradient background (using bgEndX)
        let bgRect = CGRect(x: startX, y: mainBaseY, width: bgEndX - startX, height: mainHeight)
        
        context.saveGState()
        context.clip(to: bgRect)
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        // Blueish gradient
        let startColor = UIColor(red: 0.0, green: 0.5, blue: 1.0, alpha: 0.15).cgColor
        let endColor = UIColor(red: 0.0, green: 0.5, blue: 1.0, alpha: 0.02).cgColor
        let colors = [startColor, endColor] as CFArray
        let locations: [CGFloat] = [0.0, 1.0]
        if let gradient = CGGradient(colorsSpace: colorSpace, colors: colors, locations: locations) {
            context.drawLinearGradient(gradient, start: CGPoint(x: startX, y: mainBaseY), end: CGPoint(x: startX, y: mainBaseY + mainHeight), options: [])
        }
        context.restoreGState()

        for (pIndex, prediction) in configManager.predictionList.enumerated() {
            // Winner takes all: If a target was hit, only show that target
            if let winner = winningPredictionIndex, winner != pIndex {
                continue
            }

            guard let value = prediction["value"] as? CGFloat,
                  let colorInt = prediction["color"] as? Int,
                  let color = RCTConvert.uiColor(colorInt) else {
                continue
            }

            let targetY = yFromValue(value)
            
            // DNA of the line: Ends at Hit or Background End
            let lineEndX: CGFloat
            if let hit = hitIndex {
                let hitExtension = hit - targetIndex
                lineEndX = startX + CGFloat(hitExtension) * configManager.itemWidth
            } else {
                lineEndX = bgEndX
            }

            // 1. Draw dashed line from start
            context.saveGState()
            context.setStrokeColor(color.cgColor)
            context.setLineWidth(1.5)
            context.setLineDash(phase: 0, lengths: [6, 4])
            context.move(to: CGPoint(x: startX, y: startY))
            context.addLine(to: CGPoint(x: lineEndX, y: targetY))
            context.strokePath()
            context.restoreGState()

            // Draw dot if hit (Winner only, implied by loop check)
            if hitIndex != nil {
                context.saveGState()
                context.setFillColor(color.cgColor)
                let dotRadius: CGFloat = 3.0
                let dotRect = CGRect(x: lineEndX - dotRadius, y: targetY - dotRadius, width: dotRadius * 2, height: dotRadius * 2)
                context.fillEllipse(in: dotRect)
                context.restoreGState()
            }

            // 2. Draw colored price label at the END of the line (lineEndX)
            let labelText = configManager.precision(value, configManager.price)
            let font = configManager.createFont(configManager.rightTextFontSize)
            let attributes: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: UIColor.white
            ]
            let labelSize = (labelText as NSString).size(withAttributes: attributes)
            let paddingX: CGFloat = 4
            let paddingY: CGFloat = 2
            let labelWidth = labelSize.width + paddingX * 2
            let labelHeight = labelSize.height + paddingY * 2

            // Attach label to the end of the line
            let labelX = lineEndX + 2
            let labelY = targetY - labelHeight / 2

            let labelRect = CGRect(x: labelX, y: labelY, width: labelWidth, height: labelHeight)

            // Draw background
            context.saveGState()
            context.setFillColor(color.cgColor)
            let path = UIBezierPath(roundedRect: labelRect, cornerRadius: 3)
            context.addPath(path.cgPath)
            context.fillPath()
            context.restoreGState()

            // Draw text
            (labelText as NSString).draw(
                at: CGPoint(x: labelX + paddingX, y: labelY + paddingY),
                withAttributes: attributes
            )
        }
    }

    func drawClosePrice(_ context: CGContext) {
        guard let lastModel = configManager.modelArray.last else {
            return
        }
        let offset = CGFloat(visibleRange.upperBound) * configManager.itemWidth - contentOffset.x
        let valueWidth = mainDraw.textWidth(title: configManager.precision(lastModel.close, configManager.price), font: configManager.createFont(configManager.rightTextFontSize))
        let showCenter = offset > allWidth - valueWidth - configManager.itemWidth
        animationView.isHidden = true
        if (showCenter) {
            drawClosePriceCenter(context, lastModel)
        } else {
            drawClosePriceRight(context, lastModel, offset)
        }
    }

    func drawClosePriceCenter(_ context: CGContext, _ lastModel: HTKLineModel) {
        let title = configManager.precision(lastModel.close, configManager.price)
        let font = configManager.createFont(configManager.candleTextFontSize)
        let width = mainDraw.textWidth(title: title, font: font)
        let height = mainDraw.textHeight(font: font)
        let paddingHorizontal: CGFloat = 7
        let paddingVertical: CGFloat = 5
        let triangleWidth: CGFloat = 5
        let triangleHeight: CGFloat = 7
        let triangleMarginLeft: CGFloat = 3
        let x = allWidth - configManager.paddingRight
        let rectHeight = height + paddingVertical * 2
        let y = max(mainBaseY - textHeight + rectHeight / 2, min(mainBaseY + mainHeight + textHeight - rectHeight / 2, yFromValue(lastModel.close)))
        let rectWidth = paddingHorizontal + width + triangleMarginLeft + triangleWidth + paddingHorizontal
        let rect = CGRect.init(x: x - rectWidth / 2, y: y - height / 2 - paddingVertical, width: rectWidth, height: rectHeight)

        context.saveGState()
        context.setLineDash(phase: 0, lengths: [4, 4])
        context.setStrokeColor(configManager.closePriceCenterSeparatorColor.cgColor)
        context.setLineWidth(configManager.lineWidth / 2)
        context.addLines(between: [CGPoint.init(x: 0, y: y), CGPoint.init(x: allWidth, y: y)])
        context.strokePath()
        context.restoreGState()

        let rectPath = UIBezierPath.init(roundedRect: rect, cornerRadius: rect.size.height / 2)
        context.setFillColor(configManager.closePriceCenterBackgroundColor.cgColor)
        context.addPath(rectPath.cgPath)
        context.fillPath()
        context.setStrokeColor(configManager.closePriceCenterBorderColor.cgColor)
        context.addPath(rectPath.cgPath)
        context.strokePath()
        mainDraw.drawText(title: title, point: CGPoint.init(x: rect.minX + paddingHorizontal, y: rect.minY + paddingVertical), color: configManager.textColor, font: font, context: context, configManager: configManager)

        let trianglePath = UIBezierPath.init()
        trianglePath.move(to: CGPoint.init(x: rect.maxX - paddingHorizontal, y: y))
        trianglePath.addLine(to: CGPoint.init(x: rect.maxX - paddingHorizontal - triangleWidth, y: y + triangleHeight / 2))
        trianglePath.addLine(to: CGPoint.init(x: rect.maxX - paddingHorizontal - triangleWidth, y: y - triangleHeight / 2))
        trianglePath.close()
        context.setFillColor(configManager.closePriceCenterTriangleColor.cgColor)
        context.addPath(trianglePath.cgPath)
        context.fillPath()
    }

    func drawClosePriceRight(_ context: CGContext, _ lastModel: HTKLineModel, _ offset: CGFloat) {
        let y = yFromValue(lastModel.close)
        context.saveGState()
        context.setLineDash(phase: 0, lengths: [4, 4])
        context.setStrokeColor(configManager.closePriceRightSeparatorColor.cgColor)
        context.setLineWidth(configManager.lineWidth / 2)
        let x = offset + configManager.itemWidth / 2
        context.addLines(between: [CGPoint.init(x: x, y: y), CGPoint.init(x: allWidth, y: y)])
        context.strokePath()
        context.restoreGState()

        let title = configManager.precision(lastModel.close, configManager.price)
        let font = configManager.createFont(configManager.rightTextFontSize)
        let color = configManager.closePriceRightSeparatorColor
        let width = mainDraw.textWidth(title: title, font: font)
        let height = mainDraw.textHeight(font: font)

        let rect = CGRect.init(x: allWidth - width, y: y - height / 2, width: width, height: height)
        context.setFillColor(configManager.closePriceRightBackgroundColor.cgColor)
        context.fill(rect)
        mainDraw.drawText(title: title, point: rect.origin, color: color, font: font, context: context, configManager: configManager)

        if (configManager.isMinute) {
            animationView.isHidden = false
            UIView.animate(withDuration: 0.15) {
                self.animationView.center = CGPoint.init(x: x + self.configManager.itemWidth / 2 + self.contentOffset.x, y: y)
            }
        }
    }

    func drawSelectedLine(_ context: CGContext) {
        guard visibleRange.contains(selectedIndex),
              let loc = selectedLocation else {
            return
        }

        // X bám tâm nến (snap)
        let x = (CGFloat(selectedIndex) + 0.5) * configManager.itemWidth - contentOffset.x

        // Y tự do theo tay, giới hạn trong vùng main chart
        var y = loc.y
        let minY = mainBaseY
        let maxY = mainBaseY + mainHeight
        y = max(minY, min(y, maxY))

        // Giá tại vị trí Y của cursor (dùng cho label)
        let value = valueFromY(y)

        // === 1) Crosshair lines: ngang + dọc, mỏng và đứt đoạn ===
        context.saveGState()
        context.setStrokeColor(configManager.candleTextColor.cgColor)
        context.setLineWidth(configManager.lineWidth / 2)
        // line đứt đoạn (dashed): [độ dài nét, độ dài khoảng trống]
        context.setLineDash(phase: 0, lengths: [4, 4])

        // Ngang: full width
        context.move(to: CGPoint(x: 0, y: y))
        context.addLine(to: CGPoint(x: allWidth, y: y))
        context.strokePath()

        // Dọc: từ mainBaseY xuống hết vùng child chart
        let startY = mainBaseY
        let endY = childBaseY + childHeight
        context.move(to: CGPoint(x: x, y: startY))
        context.addLine(to: CGPoint(x: x, y: endY))
        context.strokePath()

        context.restoreGState() // reset dash để các phần vẽ khác không bị đứt đoạn

        // === 2) Vẽ 2 vòng tròn ở điểm giao (giữ như cũ) ===
        context.addArc(center: CGPoint(x: x, y: y),
                       radius: configManager.candleWidth * 2 / 2,
                       startAngle: 0,
                       endAngle: CGFloat(Double.pi * 2),
                       clockwise: true)
        context.setFillColor(configManager.selectedPointContainerColor.cgColor)
        context.fillPath()

        context.addArc(center: CGPoint(x: x, y: y),
                       radius: configManager.candleWidth / 1.5 / 2,
                       startAngle: 0,
                       endAngle: CGFloat(Double.pi * 2),
                       clockwise: true)
        context.setFillColor(configManager.selectedPointContentColor.cgColor)
        context.fillPath()

        // === 3) ĐÃ BỎ gradient bar dọc: không còn addRect + clip + drawLinearGradient ===

        // === 4) Label giá bên trái/phải (giữ logic cũ, chỉ dùng value + y mới) ===
        let offset = CGFloat(selectedIndex) * configManager.itemWidth - contentOffset.x
        let halfWidth = allWidth / 2
        let leftAlign = offset < halfWidth

        let title = configManager.precision(value, configManager.price)
        let paddingVertical: CGFloat = 3
        let paddingHorizontal: CGFloat = 3
        let triangleWidth: CGFloat = 5
        let font = configManager.createFont(configManager.candleTextFontSize)
        let width = mainDraw.textWidth(title: title, font: font)
        let height = mainDraw.textHeight(font: font)
        let startX = leftAlign ? 0 : allWidth - width - paddingHorizontal * 2
        let rect = CGRect(x: startX,
                          y: y - height / 2 - paddingVertical,
                          width: width + paddingHorizontal * 2,
                          height: height + paddingVertical * 2)

        let bezierPath = UIBezierPath()
        if leftAlign {
            bezierPath.move(to: CGPoint(x: rect.maxX, y: rect.minY))
            bezierPath.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
            bezierPath.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
            bezierPath.move(to: CGPoint(x: rect.maxX, y: rect.minY))
            bezierPath.addLine(to: CGPoint(x: rect.maxX + triangleWidth, y: y))
            bezierPath.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            bezierPath.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        } else {
            bezierPath.move(to: CGPoint(x: rect.minX, y: rect.minY))
            bezierPath.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
            bezierPath.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            bezierPath.move(to: CGPoint(x: rect.minX, y: rect.minY))
            bezierPath.addLine(to: CGPoint(x: rect.minX - triangleWidth, y: y))
            bezierPath.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
            bezierPath.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        }

        context.setFillColor(configManager.panelBackgroundColor.cgColor)
        context.setLineWidth(configManager.lineWidth / 2)
        context.setStrokeColor(configManager.candleTextColor.cgColor)
        context.addPath(bezierPath.cgPath)
        context.fillPath()
        context.addPath(bezierPath.cgPath)
        context.strokePath()

        mainDraw.drawText(title: title,
                          point: CGPoint(x: startX + paddingHorizontal, y: y - height / 2),
                          color: configManager.candleTextColor,
                          font: font,
                          context: context,
                          configManager: configManager)
    }

    func drawSelectedBoard(_ context: CGContext) {
        guard visibleRange.contains(selectedIndex) else { return }
        guard !configManager.isMinute else { return }
        let itemList = visibleModelArray[selectedIndex - visibleRange.lowerBound].selectedItemList

        let font = configManager.createFont(configManager.panelTextFontSize)
        let color = configManager.candleTextColor
        let offset = CGFloat(selectedIndex) * configManager.itemWidth - contentOffset.x
        let halfWidth = allWidth / 2
        let leftAlign = offset > halfWidth
        let margin: CGFloat = 5
        let padding: CGFloat = 7
        let lineSpace: CGFloat = 8
        let y = mainBaseY - textHeight + configManager.lineWidth
        var textY = y + padding
        var width = configManager.panelMinWidth
        for item in itemList {
            let title = item["title"] as? String ?? ""
            let detail = item["detail"] as? String ?? ""
            let text = String(format: "%@%@", title, detail)
            let textWidth = mainDraw.textWidth(title: text, font: font)
            let detailHeight = mainDraw.textHeight(font: font)
            width = max(width, textWidth + 20)
            textY += detailHeight
            textY += lineSpace
        }
        let x = leftAlign ? margin : allWidth - width - margin
        context.setFillColor(configManager.panelBackgroundColor.cgColor)
        context.setLineWidth(configManager.lineWidth / 2.0)
        context.setStrokeColor(configManager.panelBorderColor.cgColor)
        let rect = CGRect.init(x: x, y: y, width: width, height: textY - lineSpace + padding - y)
        let bezierPath  = UIBezierPath.init(roundedRect: rect, cornerRadius: 5)
        context.addPath(bezierPath.cgPath)
        context.fillPath()
        context.addPath(bezierPath.cgPath)
        context.strokePath()
        textY = y + padding
        for item in itemList {
            let title = item["title"] as? String ?? ""
            let detail = item["detail"] as? String ?? ""
            let detailColor = item["color"] as? UIColor ?? color
            mainDraw.drawText(title: title, point: CGPoint.init(x: x + padding, y: textY), color: color, font: font, context: context, configManager: configManager)
            let detailWidth = mainDraw.textWidth(title: detail, font: font)
            let detailHeight = mainDraw.textHeight(font: font)
            mainDraw.drawText(title: detail, point: CGPoint.init(x: x + width - padding - detailWidth, y: textY), color: detailColor, font: font, context: context, configManager: configManager)
            textY += detailHeight
            textY += lineSpace
        }
    }

    func drawSelectedTime(_ context: CGContext) {
        guard visibleRange.contains(selectedIndex) else { return }
        let value = visibleModelArray[selectedIndex - visibleRange.lowerBound].dateString
        let color = configManager.candleTextColor
        let x = (CGFloat(selectedIndex) + 0.5) * configManager.itemWidth - contentOffset.x
        let font = configManager.createFont(configManager.candleTextFontSize)
        let title = value
        let width = mainDraw.textWidth(title: title, font: font)
        let padding: CGFloat = 5
        let height = mainDraw.textHeight(font: font)
        let y = childBaseY + childHeight
        context.setFillColor(configManager.panelBackgroundColor.cgColor)
        context.setLineWidth(configManager.lineWidth / 2.0)
        context.setStrokeColor(color.cgColor)
        let rect = CGRect.init(x: x - width / 2 - padding, y: y, width: width + padding * 2, height: configManager.paddingBottom - configManager.lineWidth)
        context.fill(rect)
        context.stroke(rect)
        mainDraw.drawText(title: title, point: CGPoint.init(x: x - width / 2.0, y: y + (configManager.paddingBottom - height) / 2), color: color, font: font, context: context, configManager: configManager)
    }

    func valuePointFromViewPoint(_ point: CGPoint) -> CGPoint {
        return CGPoint.init(x: valueFromX(point.x), y: valueFromY(point.y))
    }

    func viewPointFromValuePoint(_ point: CGPoint) -> CGPoint {
        return CGPoint.init(x: xFromValue(point.x), y: yFromValue(point.y))
    }
}

extension HTKLineView: UIScrollViewDelegate {

    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        let contentOffsetX = scrollView.contentOffset.x
        var visibleStartIndex = Int(floor(contentOffsetX / configManager.itemWidth))
        var visibleEndIndex = Int(ceil((contentOffsetX + scrollView.bounds.size.width) / configManager.itemWidth))
        visibleStartIndex = min(max(0, visibleStartIndex), configManager.modelArray.count - 1)
        visibleEndIndex = min(max(0, visibleEndIndex), configManager.modelArray.count - 1)
        visibleRange = visibleStartIndex...visibleEndIndex
        self.setNeedsDisplay()
    }

    func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
        selectedIndex = -1
        selectedLocation = nil
        self.setNeedsDisplay()
    }

    @objc
    func longPressSelector(_ gesture: UILongPressGestureRecognizer) {
        let point = gesture.location(in: self)
        selectedLocation = point

        var index = Int(floor(point.x / configManager.itemWidth))
        index = max(0, min(index, configManager.modelArray.count - 1))
        selectedIndex = index

        self.setNeedsDisplay()
    }

    @objc
    func tapSelector(_ gesture: UITapGestureRecognizer) {
        selectedIndex = -1
        selectedLocation = nil
        self.setNeedsDisplay()
    }

    @objc
    func pinchSelector(_ gesture: UIPinchGestureRecognizer) {
        switch gesture.state {
        case .changed:
            scale += (gesture.scale - 1) / 10
        default:
            break
        }
        scale = max(0.3, min(scale, 3))

        let width = bounds.size.width
        let halfWidth = width / 2
        let offsetScale = (contentOffset.x + halfWidth) / (contentSize.width - configManager.paddingRight)

        reloadContentSize()
        let contentOffsetX = max(0, min((contentSize.width - configManager.paddingRight) * offsetScale - halfWidth, contentSize.width - width))
        reloadContentOffset(contentOffsetX)
        scrollViewDidScroll(self)
    }
}
