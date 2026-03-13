//
//  HTMainDraw.swift
//  HTKLineView
//
//  Created by hublot on 2020/3/17.
//  Copyright © 2020 hublot. All rights reserved.
//

import UIKit

class HTMainDraw: NSObject, HTKLineDrawProtocol {

    private func shouldDrawMA(_ configManager: HTKLineConfigManager) -> Bool {
        if configManager.isMinute { return false }
        return configManager.showMainMA
    }

    private func shouldDrawBOLL(_ configManager: HTKLineConfigManager) -> Bool {
        if configManager.isMinute { return false }
        return configManager.showMainBOLL
    }

    private func shouldDrawBollBandLabels(_ configManager: HTKLineConfigManager) -> Bool {
        return shouldDrawBOLL(configManager) && configManager.bollStyle == "band_labels"
    }

    private func shouldDrawMaLineLabels(_ configManager: HTKLineConfigManager) -> Bool {
        return shouldDrawMA(configManager) && configManager.maStyle == "line_labels"
    }

    private func shouldDrawSupportResistanceLabels(_ configManager: HTKLineConfigManager) -> Bool {
        if configManager.isMinute { return false }
        if configManager.srStyle != "line_labels" { return false }
        guard let support = configManager.supportLevel, let resistance = configManager.resistanceLevel else {
            return false
        }
        if !support.isFinite || support.isNaN { return false }
        if !resistance.isFinite || resistance.isNaN { return false }
        return support < resistance
    }

    private func isBollValueValid(_ value: CGFloat) -> Bool {
        return value.isFinite && !value.isNaN && value != 0
    }

    private func parsePeriod(_ value: String, fallback: Int) -> Int {
        let digits = value.filter { $0.isNumber }
        guard !digits.isEmpty, let parsed = Int(digits) else {
            return fallback
        }
        return parsed
    }

    private func pointY(
        _ value: CGFloat,
        _ maxValue: CGFloat,
        _ minValue: CGFloat,
        _ baseY: CGFloat,
        _ height: CGFloat
    ) -> CGFloat {
        let scale = (maxValue - minValue) / height
        if scale == 0 { return baseY + height / 2 }
        return baseY + (maxValue - value) / scale
    }

    private func xForIndex(_ index: Int, _ configManager: HTKLineConfigManager) -> CGFloat {
        let itemWidth = configManager.itemWidth
        let width = configManager.lineWidth
        let paddingHorizontal = (itemWidth - width) / 2.0
        return CGFloat(index) * itemWidth + paddingHorizontal
    }

    private func resolveSuperItem(
        _ model: HTKLineModel,
        _ configManager: HTKLineConfigManager
    ) -> HTKLineItemModel? {
        for (configIndex, itemModel) in configManager.maList.enumerated() {
            if itemModel.kind.lowercased() != "super" { continue }
            let dataIndex = itemModel.index
            return safeElement(model.maList, at: dataIndex) ?? safeElement(model.maList, at: configIndex)
        }
        return nil
    }

    private func drawSuperFillSegment(
        _ lastX: CGFloat,
        _ currentX: CGFloat,
        _ lastCloseY: CGFloat,
        _ currentCloseY: CGFloat,
        _ lastSuperY: CGFloat,
        _ currentSuperY: CGFloat,
        _ isUp: Bool,
        _ context: CGContext,
        _ configManager: HTKLineConfigManager
    ) {
        let baseColor = isUp ? configManager.increaseColor : configManager.decreaseColor
        let strong = baseColor.withAlphaComponent(0.22).cgColor
        let weak = baseColor.withAlphaComponent(0.04).cgColor

        let path = UIBezierPath()
        path.move(to: CGPoint(x: lastX, y: lastCloseY))
        path.addLine(to: CGPoint(x: currentX, y: currentCloseY))
        path.addLine(to: CGPoint(x: currentX, y: currentSuperY))
        path.addLine(to: CGPoint(x: lastX, y: lastSuperY))
        path.close()

        let minY = min(min(lastCloseY, currentCloseY), min(lastSuperY, currentSuperY))
        let maxY = max(max(lastCloseY, currentCloseY), max(lastSuperY, currentSuperY))
        if abs(maxY - minY) < 0.5 { return }

        guard let gradient = CGGradient(
            colorsSpace: CGColorSpaceCreateDeviceRGB(),
            colors: isUp ? [strong, weak] as CFArray : [weak, strong] as CFArray,
            locations: [0.0, 1.0]
        ) else {
            return
        }

        context.saveGState()
        context.addPath(path.cgPath)
        context.clip()
        context.drawLinearGradient(
            gradient,
            start: CGPoint(x: lastX, y: minY),
            end: CGPoint(x: lastX, y: maxY),
            options: []
        )
        context.restoreGState()
    }

    func drawSuperFill(
        _ model: HTKLineModel,
        _ lastModel: HTKLineModel,
        _ maxValue: CGFloat,
        _ minValue: CGFloat,
        _ baseY: CGFloat,
        _ height: CGFloat,
        _ index: Int,
        _ lastIndex: Int,
        _ context: CGContext,
        _ configManager: HTKLineConfigManager
    ) {
        if !shouldDrawMA(configManager) { return }
        if index == lastIndex { return }
        guard
            let currentSuper = resolveSuperItem(model, configManager),
            let lastSuper = resolveSuperItem(lastModel, configManager)
        else {
            return
        }

        let currentClose = model.close
        let previousClose = lastModel.close
        let currentSuperValue = currentSuper.value
        let previousSuperValue = lastSuper.value

        let currentX = xForIndex(index, configManager)
        let previousX = xForIndex(lastIndex, configManager)
        let currentCloseY = pointY(currentClose, maxValue, minValue, baseY, height)
        let previousCloseY = pointY(previousClose, maxValue, minValue, baseY, height)
        let currentSuperY = pointY(currentSuperValue, maxValue, minValue, baseY, height)
        let previousSuperY = pointY(previousSuperValue, maxValue, minValue, baseY, height)

        let d1 = previousClose - previousSuperValue
        let d2 = currentClose - currentSuperValue

        if d1 == 0 && d2 == 0 { return }
        if (d1 >= 0 && d2 >= 0) || (d1 <= 0 && d2 <= 0) {
            drawSuperFillSegment(
                previousX,
                currentX,
                previousCloseY,
                currentCloseY,
                previousSuperY,
                currentSuperY,
                d2 >= 0,
                context,
                configManager
            )
            return
        }

        let denominator = d1 - d2
        if denominator == 0 {
            drawSuperFillSegment(
                previousX,
                currentX,
                previousCloseY,
                currentCloseY,
                previousSuperY,
                currentSuperY,
                d2 >= 0,
                context,
                configManager
            )
            return
        }

        let t = max(CGFloat(0), min(CGFloat(1), d1 / denominator))
        let crossX = previousX + (currentX - previousX) * t
        let crossCloseY = previousCloseY + (currentCloseY - previousCloseY) * t
        let crossSuperY = previousSuperY + (currentSuperY - previousSuperY) * t

        drawSuperFillSegment(
            previousX,
            crossX,
            previousCloseY,
            crossCloseY,
            previousSuperY,
            crossSuperY,
            d1 >= 0,
            context,
            configManager
        )
        drawSuperFillSegment(
            crossX,
            currentX,
            crossCloseY,
            currentCloseY,
            crossSuperY,
            currentSuperY,
            d2 >= 0,
            context,
            configManager
        )
    }

    private func drawIndicatorRow(
        _ entries: [(title: String, color: UIColor)],
        _ baseX: CGFloat,
        _ baseY: CGFloat,
        _ font: UIFont,
        _ context: CGContext,
        _ configManager: HTKLineConfigManager
    ) {
        var x = baseX
        for entry in entries {
            x += drawText(
                title: entry.title,
                point: CGPoint(x: x, y: baseY),
                color: entry.color,
                font: font,
                context: context,
                configManager: configManager
            )
            x += 5
        }
    }

    func minMaxRange(_ visibleModelArray: [HTKLineModel], _ configManager: HTKLineConfigManager) -> Range<CGFloat> {
        var maxValue = CGFloat.leastNormalMagnitude
        var minValue = CGFloat.greatestFiniteMagnitude

        for model in visibleModelArray {
            var valueList = [model.high, model.low]
            if shouldDrawMA(configManager) {
                valueList.append(contentsOf: model.maList.map({ (item) -> CGFloat in
                    return item.value
                }))
            }
            if shouldDrawBOLL(configManager) {
                valueList.append(contentsOf: [model.bollMb, model.bollUp, model.bollDn])
            }
            maxValue = max(maxValue, valueList.max() ?? 0)
            minValue = min(minValue, valueList.min() ?? 0)
        }
        return Range<CGFloat>.init(uncheckedBounds: (lower: minValue, upper: maxValue))
    }

    func drawCandle(_ model: HTKLineModel, _ index: Int, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        let color = model.increment ? configManager.increaseColor : configManager.decreaseColor
        let findValue: (Bool) -> CGFloat = { (isHighValue: Bool) in
            var findCloseValue = model.increment
            if (!isHighValue) {
                findCloseValue = !findCloseValue
            }
            return findCloseValue ? model.close : model.open
        }
        if (configManager.isMinute) {

        } else {
            // Keep doji bodies visibly thick enough in UI (logical points, not physical pixel).
            let minBodyHeightPx: CGFloat = 1.5
            drawCandle(high: findValue(true), low: findValue(false), maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, width: configManager.candleWidth, color: color, verticalAlignBottom: false, minBodyHeightPx: minBodyHeightPx, context: context, configManager: configManager)
            drawCandle(high: model.high, low: model.low, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, width: configManager.candleLineWidth, color: color, verticalAlignBottom: false, context: context, configManager: configManager)
        }
    }

    func drawGradient(_ visibleModelArray: [HTKLineModel], _ maxValue: CGFloat, _ minValue: CGFloat, _ baseX: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        let colorList = configManager.packGradientColorList(configManager.minuteGradientColorList)
        let locationList = configManager.minuteGradientLocationList
        if let gradient = CGGradient.init(colorSpace: CGColorSpaceCreateDeviceRGB(), colorComponents: colorList, locations: locationList, count: locationList.count) {
            var bezierPath = UIBezierPath.init()
            for (i, model) in visibleModelArray.enumerated() {
                let lastIndex = i == 0 ? i : i - 1
                let lastModel = visibleModelArray[lastIndex]
                bezierPath = createLinePath(value: model.close, lastValue: lastModel.close, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: i, lastIndex: lastIndex, isBezier: true, existPath: bezierPath, context: context, configManager: configManager)
            }
            bezierPath.addLine(to: CGPoint.init(x: bezierPath.currentPoint.x, y: baseY + height))
            bezierPath.addLine(to: CGPoint.init(x: configManager.itemWidth / 2, y: baseY + height))
            bezierPath.close()
            context.addPath(bezierPath.cgPath)
            context.clip()
            context.drawLinearGradient(gradient, start: CGPoint.init(x: 0, y: baseY), end: CGPoint.init(x: 0, y: height + baseY), options: .drawsBeforeStartLocation)
            context.resetClip()
        }
    }

    func drawLine(_ model: HTKLineModel, _ lastModel: HTKLineModel, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ index: Int, _ lastIndex: Int, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        if (configManager.isMinute) {
            drawLine(value: model.close, lastValue: lastModel.close, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, lastIndex: lastIndex, color: configManager.minuteLineColor, isBezier: true, context: context, configManager: configManager)
        } else {
            if shouldDrawMA(configManager) {
                for (configIndex, itemModel) in configManager.maList.enumerated() {
                    let dataIndex = itemModel.index
                    guard
                        let currentItem = safeElement(model.maList, at: dataIndex) ?? safeElement(model.maList, at: configIndex),
                        let lastItem = safeElement(lastModel.maList, at: dataIndex) ?? safeElement(lastModel.maList, at: configIndex)
                    else {
                        debugInvalidIndex(owner: "HTMainDraw.drawLine.maList", index: dataIndex, count: model.maList.count)
                        continue
                    }
                    let color = safeTargetColor(configManager, at: dataIndex, fallback: configManager.textColor)
                    drawLine(value: currentItem.value, lastValue: lastItem.value, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, lastIndex: lastIndex, color: color, isBezier: false, context: context, configManager: configManager)
                }
            }
            if shouldDrawBOLL(configManager) {
                drawBollBandFill(
                    model,
                    lastModel,
                    maxValue,
                    minValue,
                    baseY,
                    height,
                    index,
                    lastIndex,
                    context,
                    configManager
                )
                let itemList = [
                    ["value": model.bollMb, "lastValue": lastModel.bollMb, "color": safeTargetColor(configManager, at: 0, fallback: configManager.textColor)],
                    ["value": model.bollUp, "lastValue": lastModel.bollUp, "color": safeTargetColor(configManager, at: 1, fallback: configManager.textColor)],
                    ["value": model.bollDn, "lastValue": lastModel.bollDn, "color": safeTargetColor(configManager, at: 2, fallback: configManager.textColor)],
                ]
                for item in itemList {
                    drawLine(value: item["value"] as? CGFloat ?? 0, lastValue: item["lastValue"] as? CGFloat ?? 0, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, lastIndex: lastIndex, color: item["color"] as? UIColor ?? UIColor.orange, isBezier: false, context: context, configManager: configManager)
                }
            }
        }
    }

    private func drawBollBandFill(
        _ model: HTKLineModel,
        _ lastModel: HTKLineModel,
        _ maxValue: CGFloat,
        _ minValue: CGFloat,
        _ baseY: CGFloat,
        _ height: CGFloat,
        _ index: Int,
        _ lastIndex: Int,
        _ context: CGContext,
        _ configManager: HTKLineConfigManager
    ) {
        if !shouldDrawBollBandLabels(configManager) { return }
        if index == lastIndex { return }

        let currentUp = model.bollUp
        let currentDn = model.bollDn
        let previousUp = lastModel.bollUp
        let previousDn = lastModel.bollDn
        if !isBollValueValid(currentUp) || !isBollValueValid(currentDn)
            || !isBollValueValid(previousUp) || !isBollValueValid(previousDn) {
            return
        }

        let currentX = xForIndex(index, configManager)
        let previousX = xForIndex(lastIndex, configManager)
        let currentUpY = pointY(currentUp, maxValue, minValue, baseY, height)
        let currentDnY = pointY(currentDn, maxValue, minValue, baseY, height)
        let previousUpY = pointY(previousUp, maxValue, minValue, baseY, height)
        let previousDnY = pointY(previousDn, maxValue, minValue, baseY, height)

        let minY = min(min(currentUpY, currentDnY), min(previousUpY, previousDnY))
        let maxY = max(max(currentUpY, currentDnY), max(previousUpY, previousDnY))
        if abs(maxY - minY) < 0.5 { return }

        let path = UIBezierPath()
        path.move(to: CGPoint(x: previousX, y: previousUpY))
        path.addLine(to: CGPoint(x: currentX, y: currentUpY))
        path.addLine(to: CGPoint(x: currentX, y: currentDnY))
        path.addLine(to: CGPoint(x: previousX, y: previousDnY))
        path.close()

        let upper = safeTargetColor(configManager, at: 1, fallback: configManager.textColor).withAlphaComponent(0.16).cgColor
        let lower = safeTargetColor(configManager, at: 2, fallback: configManager.textColor).withAlphaComponent(0.06).cgColor
        guard let gradient = CGGradient(
            colorsSpace: CGColorSpaceCreateDeviceRGB(),
            colors: [upper, lower] as CFArray,
            locations: [0.0, 1.0]
        ) else {
            return
        }

        context.saveGState()
        context.addPath(path.cgPath)
        context.clip()
        context.drawLinearGradient(
            gradient,
            start: CGPoint(x: previousX, y: minY),
            end: CGPoint(x: previousX, y: maxY),
            options: []
        )
        context.restoreGState()
    }

    func drawBollRightLabels(
        _ model: HTKLineModel,
        _ allWidth: CGFloat,
        _ maxValue: CGFloat,
        _ minValue: CGFloat,
        _ baseY: CGFloat,
        _ height: CGFloat,
        _ context: CGContext,
        _ configManager: HTKLineConfigManager
    ) {
        if !shouldDrawBollBandLabels(configManager) { return }
        let upper = model.bollUp
        let base = model.bollMb
        let lower = model.bollDn
        if !isBollValueValid(upper) || !isBollValueValid(base) || !isBollValueValid(lower) {
            return
        }

        let titles = ["Upper", "Base", "Lower"]
        let values = [upper, base, lower]
        let bgColors = [
            safeTargetColor(configManager, at: 1, fallback: configManager.increaseColor),
            safeTargetColor(configManager, at: 0, fallback: configManager.increaseColor),
            safeTargetColor(configManager, at: 2, fallback: configManager.decreaseColor),
        ]
        var yTargets = [
            pointY(upper, maxValue, minValue, baseY, height),
            pointY(base, maxValue, minValue, baseY, height),
            pointY(lower, maxValue, minValue, baseY, height),
        ]
        var order = [0, 1, 2]
        order.sort { yTargets[$0] < yTargets[$1] }

        let font = configManager.createFont(max(configManager.rightTextFontSize, 10))
        let textAttributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: UIColor.white,
        ]
        let paddingX: CGFloat = 6
        let paddingY: CGFloat = 3
        let lineHeight = textHeight(font: font)
        let labelHeight = lineHeight + paddingY * 2
        let gap: CGFloat = 4
        let minTop: CGFloat = 2
        let maxTop = max(minTop, baseY + height - labelHeight - 2)

        var topByIndex = [CGFloat](repeating: minTop, count: 3)
        var previousBottom = minTop - gap
        for idx in order {
            var top = max(minTop, min(maxTop, yTargets[idx] - labelHeight / 2))
            if top < previousBottom + gap {
                top = previousBottom + gap
            }
            top = min(maxTop, top)
            topByIndex[idx] = top
            previousBottom = top + labelHeight
        }

        let rightInset: CGFloat = 4
        for i in 0..<values.count {
            let text = "\(titles[i]) \(configManager.precision(values[i], configManager.price))"
            let size = (text as NSString).size(withAttributes: textAttributes)
            let width = size.width + paddingX * 2
            let left = allWidth - rightInset - width
            let top = topByIndex[i]
            let rect = CGRect(x: left, y: top, width: width, height: labelHeight)

            context.setFillColor(bgColors[i].cgColor)
            let path = UIBezierPath(roundedRect: rect, cornerRadius: 3)
            context.addPath(path.cgPath)
            context.fillPath()
            (text as NSString).draw(
                at: CGPoint(x: left + paddingX, y: top + paddingY),
                withAttributes: textAttributes
            )
        }
    }

    func drawMaRightLabels(
        _ model: HTKLineModel,
        _ allWidth: CGFloat,
        _ maxValue: CGFloat,
        _ minValue: CGFloat,
        _ baseY: CGFloat,
        _ height: CGFloat,
        _ context: CGContext,
        _ configManager: HTKLineConfigManager
    ) {
        if !shouldDrawMaLineLabels(configManager) { return }

        var titles = [String]()
        var values = [CGFloat]()
        var colors = [UIColor]()
        var yTargets = [CGFloat]()

        for (configIndex, itemModel) in configManager.maList.enumerated() {
            if itemModel.kind.lowercased() != "ema" { continue }
            let dataIndex = itemModel.index
            guard let item = safeElement(model.maList, at: dataIndex) ?? safeElement(model.maList, at: configIndex) else {
                continue
            }
            if !item.value.isFinite || item.value.isNaN || item.value == 0 { continue }
            let fallbackPeriod = dataIndex > 0 ? dataIndex : configIndex
            let period = parsePeriod(itemModel.title, fallback: parsePeriod(item.title, fallback: fallbackPeriod))
            let title = period > 0 ? "EMA \(period)" : "EMA \(itemModel.title)"
            titles.append(title)
            values.append(item.value)
            colors.append(safeTargetColor(configManager, at: dataIndex, fallback: configManager.textColor))
            yTargets.append(pointY(item.value, maxValue, minValue, baseY, height))
        }
        if titles.isEmpty { return }

        let font = configManager.createFont(max(configManager.rightTextFontSize, 10))
        let textAttributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: UIColor.white,
        ]
        let paddingX: CGFloat = 6
        let paddingY: CGFloat = 3
        let lineHeight = textHeight(font: font)
        let labelHeight = lineHeight + paddingY * 2
        let gap: CGFloat = 4
        let minTop: CGFloat = 2
        let maxTop = max(minTop, baseY + height - labelHeight - 2)

        var order = Array(0..<titles.count)
        order.sort { yTargets[$0] < yTargets[$1] }
        var topByIndex = [CGFloat](repeating: minTop, count: titles.count)
        var previousBottom = minTop - gap
        for idx in order {
            var top = max(minTop, min(maxTop, yTargets[idx] - labelHeight / 2))
            if top < previousBottom + gap {
                top = previousBottom + gap
            }
            top = min(maxTop, top)
            topByIndex[idx] = top
            previousBottom = top + labelHeight
        }

        let rightInset: CGFloat = 4
        for i in 0..<titles.count {
            let text = "\(titles[i]) \(configManager.precision(values[i], configManager.price))"
            let size = (text as NSString).size(withAttributes: textAttributes)
            let width = size.width + paddingX * 2
            let left = allWidth - rightInset - width
            let top = topByIndex[i]
            let rect = CGRect(x: left, y: top, width: width, height: labelHeight)

            context.saveGState()
            context.setStrokeColor(colors[i].withAlphaComponent(0.45).cgColor)
            context.setLineWidth(0.8)
            context.setLineDash(phase: 0, lengths: [6, 5])
            let lineEnd = max(0, left - 4)
            context.move(to: CGPoint(x: 0, y: yTargets[i]))
            context.addLine(to: CGPoint(x: lineEnd, y: yTargets[i]))
            context.strokePath()
            context.restoreGState()

            context.setFillColor(colors[i].cgColor)
            let path = UIBezierPath(roundedRect: rect, cornerRadius: 3)
            context.addPath(path.cgPath)
            context.fillPath()
            (text as NSString).draw(
                at: CGPoint(x: left + paddingX, y: top + paddingY),
                withAttributes: textAttributes
            )
        }
    }

    func drawSupportResistanceRightLabels(
        _ allWidth: CGFloat,
        _ maxValue: CGFloat,
        _ minValue: CGFloat,
        _ baseY: CGFloat,
        _ height: CGFloat,
        _ context: CGContext,
        _ configManager: HTKLineConfigManager
    ) {
        if !shouldDrawSupportResistanceLabels(configManager) { return }
        guard
            let support = configManager.supportLevel,
            let resistance = configManager.resistanceLevel
        else {
            return
        }

        let titles = ["Resistance", "Support"]
        let values = [resistance, support]
        let colors = [
            UIColor(red: 239 / 255, green: 68 / 255, blue: 68 / 255, alpha: 1),
            UIColor(red: 20 / 255, green: 184 / 255, blue: 166 / 255, alpha: 1),
        ]
        var yTargets = [
            pointY(resistance, maxValue, minValue, baseY, height),
            pointY(support, maxValue, minValue, baseY, height),
        ]
        var order = [0, 1]
        order.sort { yTargets[$0] < yTargets[$1] }

        let font = configManager.createFont(max(configManager.rightTextFontSize, 10))
        let textAttributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: UIColor.white,
        ]
        let paddingX: CGFloat = 6
        let paddingY: CGFloat = 3
        let lineHeight = textHeight(font: font)
        let labelHeight = lineHeight + paddingY * 2
        let gap: CGFloat = 4
        let minTop: CGFloat = 2
        let maxTop = max(minTop, baseY + height - labelHeight - 2)

        var topByIndex = [CGFloat](repeating: minTop, count: titles.count)
        var previousBottom = minTop - gap
        for idx in order {
            var top = max(minTop, min(maxTop, yTargets[idx] - labelHeight / 2))
            if top < previousBottom + gap {
                top = previousBottom + gap
            }
            top = min(maxTop, top)
            topByIndex[idx] = top
            previousBottom = top + labelHeight
        }

        let rightInset: CGFloat = 4
        for i in 0..<titles.count {
            let text = "\(titles[i]) \(configManager.precision(values[i], configManager.price))"
            let size = (text as NSString).size(withAttributes: textAttributes)
            let width = size.width + paddingX * 2
            let left = allWidth - rightInset - width
            let top = topByIndex[i]
            let rect = CGRect(x: left, y: top, width: width, height: labelHeight)

            context.saveGState()
            context.setStrokeColor(colors[i].withAlphaComponent(0.6).cgColor)
            context.setLineWidth(0.9)
            context.setLineDash(phase: 0, lengths: [8, 6])
            context.move(to: CGPoint(x: 0, y: yTargets[i]))
            context.addLine(to: CGPoint(x: allWidth, y: yTargets[i]))
            context.strokePath()
            context.restoreGState()

            context.setFillColor(colors[i].cgColor)
            let path = UIBezierPath(roundedRect: rect, cornerRadius: 3)
            context.addPath(path.cgPath)
            context.fillPath()
            (text as NSString).draw(
                at: CGPoint(x: left + paddingX, y: top + paddingY),
                withAttributes: textAttributes
            )
        }
    }

    func drawText(_ model: HTKLineModel, _ baseX: CGFloat, _ baseY: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        if (configManager.isMinute) {

        } else {
            let font = configManager.createFont(configManager.headerTextFontSize)
            let rowSpacing = max(configManager.headerTextFontSize + 4, 14)
            var rowY = baseY
            if shouldDrawMA(configManager) {
                var maEntries = [(title: String, color: UIColor)]()
                var emaEntries = [(title: String, color: UIColor)]()
                var superEntries = [(title: String, color: UIColor)]()
                for (configIndex, itemModel) in configManager.maList.enumerated() {
                    let dataIndex = itemModel.index
                    guard let item = safeElement(model.maList, at: dataIndex) ?? safeElement(model.maList, at: configIndex) else {
                        debugInvalidIndex(owner: "HTMainDraw.drawText.maList", index: dataIndex, count: model.maList.count)
                        continue
                    }
                    let rawKind = item.kind.lowercased()
                    let kind = rawKind == "ema" ? "ema" : (rawKind == "super" ? "super" : "ma")
                    let prefix = kind == "ema" ? "EMA" : (kind == "super" ? "SUPER" : "MA")
                    let title = kind == "super"
                        ? String(format: "SUPERTREND(%@):%@", item.title, configManager.precision(item.value, configManager.price))
                        : String(format: "%@%@:%@", prefix, item.title, configManager.precision(item.value, configManager.price))
                    let color = safeTargetColor(configManager, at: dataIndex, fallback: configManager.textColor)
                    if kind == "ema" {
                        emaEntries.append((title: title, color: color))
                    } else if kind == "super" {
                        superEntries.append((title: title, color: color))
                    } else {
                        maEntries.append((title: title, color: color))
                    }
                }
                if !maEntries.isEmpty {
                    drawIndicatorRow(maEntries, baseX, rowY, font, context, configManager)
                    rowY += rowSpacing
                }
                if !emaEntries.isEmpty {
                    drawIndicatorRow(emaEntries, baseX, rowY, font, context, configManager)
                    rowY += rowSpacing
                }
                if !superEntries.isEmpty {
                    drawIndicatorRow(superEntries, baseX, rowY, font, context, configManager)
                    rowY += rowSpacing
                }
            }
            if shouldDrawBOLL(configManager) {
                let entries: [(title: String, color: UIColor)] = [
                    (title: String(format: "BOLL(%@,%@)", configManager.bollN, configManager.bollP), color: safeTargetColor(configManager, at: 0, fallback: configManager.textColor)),
                    (title: String(format: "MID:%@", configManager.precision(model.bollMb, configManager.price)), color: safeTargetColor(configManager, at: 0, fallback: configManager.textColor)),
                    (title: String(format: "UPPER:%@", configManager.precision(model.bollUp, configManager.price)), color: safeTargetColor(configManager, at: 1, fallback: configManager.textColor)),
                    (title: String(format: "LOWER:%@", configManager.precision(model.bollDn, configManager.price)), color: safeTargetColor(configManager, at: 2, fallback: configManager.textColor)),
                ]
                drawIndicatorRow(entries, baseX, rowY, font, context, configManager)
            }
        }
    }

    func drawValue(_ maxValue: CGFloat, _ minValue: CGFloat, _ baseX: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        drawValue(maxValue, minValue, baseX, baseY, height, 4, configManager.price, context, configManager)
    }

}
