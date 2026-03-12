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
