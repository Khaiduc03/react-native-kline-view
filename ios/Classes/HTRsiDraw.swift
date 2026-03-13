//
//  HTRsiDraw.swift
//  HTKLineView
//
//  Created by hublot on 2020/3/17.
//  Copyright © 2020 hublot. All rights reserved.
//

import UIKit

class HTRsiDraw: NSObject, HTKLineDrawProtocol {
    private let axisFixed = "fixed_0_100"
    private let axisIncludeLevels = "adaptive_include_levels"

    private struct RsiLevelSpec {
        let value: CGFloat
        let label: String
        let color: UIColor
        let dashed: Bool
        let showRightTag: Bool
        let showGuideLine: Bool
    }

    private struct LabelSpec {
        var y: CGFloat
        let text: String
        let color: UIColor
    }

    func minMaxRange(_ visibleModelArray: [HTKLineModel], _ configManager: HTKLineConfigManager) -> Range<CGFloat> {
        if configManager.rsiAxisMode == axisFixed {
            return 0..<100
        }

        var maxValue = CGFloat.leastNormalMagnitude
        var minValue = CGFloat.greatestFiniteMagnitude
        for model in visibleModelArray {
            let valueList = model.rsiList.map { item in item.value }.filter { $0.isFinite && !$0.isNaN }
            if let localMax = valueList.max() {
                maxValue = max(maxValue, localMax)
            }
            if let localMin = valueList.min() {
                minValue = min(minValue, localMin)
            }
        }

        if configManager.rsiAxisMode == axisIncludeLevels {
            for level in resolveLevels(configManager) {
                maxValue = max(maxValue, level.value)
                minValue = min(minValue, level.value)
            }
        }

        if !maxValue.isFinite || !minValue.isFinite || maxValue == CGFloat.leastNormalMagnitude || minValue == CGFloat.greatestFiniteMagnitude {
            return 0..<100
        }
        if maxValue == minValue {
            let pad = max(abs(maxValue) * 0.05, 1)
            return (minValue - pad)..<(maxValue + pad)
        }
        return minValue..<maxValue
    }

    func drawCandle(_ model: HTKLineModel, _ index: Int, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
    }

    func drawLine(_ model: HTKLineModel, _ lastModel: HTKLineModel, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ index: Int, _ lastIndex: Int, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        for itemModel in configManager.rsiList {
            let dataIndex = itemModel.index
            guard
                let currentItem = safeElement(model.rsiList, at: dataIndex),
                let lastItem = safeElement(lastModel.rsiList, at: dataIndex)
            else {
                debugInvalidIndex(owner: "HTRsiDraw.drawLine.rsiList", index: dataIndex, count: model.rsiList.count)
                continue
            }
            let color = safeTargetColor(configManager, at: dataIndex, fallback: configManager.textColor)
            drawLine(value: currentItem.value, lastValue: lastItem.value, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, lastIndex: lastIndex, color: color, isBezier: false, context: context, configManager: configManager)
        }
    }

    func drawText(_ model: HTKLineModel, _ baseX: CGFloat, _ baseY: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        var x = baseX
        let font = configManager.createFont(configManager.headerTextFontSize)
        for itemModel in configManager.rsiList {
            let dataIndex = itemModel.index
            guard let item = safeElement(model.rsiList, at: dataIndex) else {
                debugInvalidIndex(owner: "HTRsiDraw.drawText.rsiList", index: dataIndex, count: model.rsiList.count)
                continue
            }
            let title = String(format: "RSI(%@):%@", item.title, configManager.precision(item.value, -1))
            let color = safeTargetColor(configManager, at: dataIndex, fallback: configManager.textColor)
            x += drawText(title: title, point: CGPoint(x: x, y: baseY), color: color, font: font, context: context, configManager: configManager)
            x += 5
        }
    }

    func drawValue(_ maxValue: CGFloat, _ minValue: CGFloat, _ baseX: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        drawValue(maxValue, minValue, baseX, baseY, height, 0, -1, context, configManager)
    }

    func drawLevelOverlays(
        _ model: HTKLineModel,
        _ allWidth: CGFloat,
        _ maxValue: CGFloat,
        _ minValue: CGFloat,
        _ baseY: CGFloat,
        _ height: CGFloat,
        _ context: CGContext,
        _ configManager: HTKLineConfigManager
    ) {
        if !shouldDrawLineLabels(configManager) || height <= 0 {
            return
        }

        let levels = resolveLevels(configManager)
        for level in levels where level.showGuideLine {
            let y = clampY(pointY(level.value, maxValue, minValue, baseY, height), baseY, height)
            context.saveGState()
            context.setStrokeColor(level.color.withAlphaComponent(0.58).cgColor)
            context.setLineWidth(0.9)
            if level.dashed {
                context.setLineDash(phase: 0, lengths: [8, 6])
            } else {
                context.setLineDash(phase: 0, lengths: [])
            }
            context.move(to: CGPoint(x: 0, y: y))
            context.addLine(to: CGPoint(x: allWidth, y: y))
            context.strokePath()
            context.restoreGState()
        }

        var labels = [LabelSpec]()
        for level in levels where level.showRightTag {
            let y = clampY(pointY(level.value, maxValue, minValue, baseY, height), baseY, height)
            let text = "\(level.label) \(configManager.precision(level.value, configManager.price))"
            labels.append(LabelSpec(y: y, text: text, color: level.color))
        }

        if let current = resolveCurrentLabel(
            model,
            maxValue,
            minValue,
            baseY,
            height,
            configManager
        ) {
            labels.append(current)
            context.saveGState()
            context.setStrokeColor(current.color.withAlphaComponent(0.58).cgColor)
            context.setLineWidth(0.9)
            context.setLineDash(phase: 0, lengths: [8, 6])
            context.move(to: CGPoint(x: 0, y: current.y))
            context.addLine(to: CGPoint(x: allWidth, y: current.y))
            context.strokePath()
            context.restoreGState()
        }

        if labels.isEmpty {
            return
        }
        drawRightLabels(labels, allWidth, baseY, height, context, configManager)
    }

    private func shouldDrawLineLabels(_ configManager: HTKLineConfigManager) -> Bool {
        return configManager.childType == .rsi && configManager.rsiStyle == "line_labels"
    }

    private func resolveLevels(_ configManager: HTKLineConfigManager) -> [RsiLevelSpec] {
        var levels = [RsiLevelSpec]()
        for item in configManager.rsiLevels {
            guard let value = number(item["value"]), value.isFinite, !value.isNaN else {
                continue
            }
            let rawLabel = (item["label"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
            let label = (rawLabel?.isEmpty == false) ? rawLabel! : defaultLevelLabel(value)
            let color = colorValue(item["color"], fallback: defaultLevelColor(value))
            let spec = RsiLevelSpec(
                value: value,
                label: label,
                color: color,
                dashed: boolValue(item["dashed"], fallback: true),
                showRightTag: boolValue(item["showRightTag"], fallback: true),
                showGuideLine: boolValue(item["showGuideLine"], fallback: true)
            )
            levels.append(spec)
        }
        return levels
    }

    private func resolveCurrentLabel(
        _ model: HTKLineModel,
        _ maxValue: CGFloat,
        _ minValue: CGFloat,
        _ baseY: CGFloat,
        _ height: CGFloat,
        _ configManager: HTKLineConfigManager
    ) -> LabelSpec? {
        guard let currentTag = configManager.rsiCurrentTag else {
            return nil
        }
        if !boolValue(currentTag["enabled"], fallback: false) {
            return nil
        }

        let periodFromConfig = intValue(currentTag["period"])
        var targetItem: HTKLineItemModel? = nil
        if let period = periodFromConfig, period > 0 {
            targetItem = model.rsiList.first(where: { parsePeriod($0.title, fallback: -1) == period })
        }
        if targetItem == nil {
            targetItem = model.rsiList.first
        }
        guard let item = targetItem, item.value.isFinite, !item.value.isNaN else {
            return nil
        }

        let resolvedPeriod = periodFromConfig ?? parsePeriod(item.title, fallback: 14)
        let defaultLabel = "RSI (\(resolvedPeriod))"
        let rawLabel = (currentTag["label"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let label = (rawLabel?.isEmpty == false) ? rawLabel! : defaultLabel
        let color = colorValue(
            currentTag["color"],
            fallback: safeTargetColor(configManager, at: 0, fallback: UIColor(red: 156 / 255, green: 39 / 255, blue: 176 / 255, alpha: 1))
        )
        let y = clampY(pointY(item.value, maxValue, minValue, baseY, height), baseY, height)
        return LabelSpec(
            y: y,
            text: "\(label) \(configManager.precision(item.value, configManager.price))",
            color: color
        )
    }

    private func drawRightLabels(
        _ labels: [LabelSpec],
        _ allWidth: CGFloat,
        _ baseY: CGFloat,
        _ height: CGFloat,
        _ context: CGContext,
        _ configManager: HTKLineConfigManager
    ) {
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
        let minTop = baseY + 2
        let maxTop = max(minTop, baseY + height - labelHeight - 2)

        var ordered = Array(0..<labels.count)
        ordered.sort { labels[$0].y < labels[$1].y }
        var topByIndex = [CGFloat](repeating: minTop, count: labels.count)
        var previousBottom = minTop - gap
        for idx in ordered {
            var top = max(minTop, min(maxTop, labels[idx].y - labelHeight / 2))
            if top < previousBottom + gap {
                top = previousBottom + gap
            }
            top = min(maxTop, top)
            topByIndex[idx] = top
            previousBottom = top + labelHeight
        }

        let rightInset: CGFloat = 4
        for i in 0..<labels.count {
            let text = labels[i].text
            let textSize = (text as NSString).size(withAttributes: textAttributes)
            let width = textSize.width + paddingX * 2
            let left = allWidth - rightInset - width
            let top = topByIndex[i]
            let rect = CGRect(x: left, y: top, width: width, height: labelHeight)

            context.setFillColor(labels[i].color.cgColor)
            let path = UIBezierPath(roundedRect: rect, cornerRadius: 3)
            context.addPath(path.cgPath)
            context.fillPath()
            (text as NSString).draw(at: CGPoint(x: left + paddingX, y: top + paddingY), withAttributes: textAttributes)
        }
    }

    private func pointY(_ value: CGFloat, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat) -> CGFloat {
        let scale = (maxValue - minValue) / height
        if scale == 0 {
            return baseY + height / 2
        }
        return baseY + (maxValue - value) / scale
    }

    private func clampY(_ y: CGFloat, _ baseY: CGFloat, _ height: CGFloat) -> CGFloat {
        return min(max(baseY, y), baseY + height)
    }

    private func number(_ value: Any?) -> CGFloat? {
        if let number = value as? NSNumber {
            return CGFloat(number.doubleValue)
        }
        if let doubleValue = value as? Double {
            return CGFloat(doubleValue)
        }
        if let floatValue = value as? CGFloat {
            return floatValue
        }
        if let intValue = value as? Int {
            return CGFloat(intValue)
        }
        return nil
    }

    private func intValue(_ value: Any?) -> Int? {
        if let number = value as? NSNumber {
            return number.intValue
        }
        if let intValue = value as? Int {
            return intValue
        }
        if let stringValue = value as? String {
            return Int(stringValue)
        }
        return nil
    }

    private func boolValue(_ value: Any?, fallback: Bool) -> Bool {
        if let boolValue = value as? Bool {
            return boolValue
        }
        if let numberValue = value as? NSNumber {
            return numberValue.intValue != 0
        }
        return fallback
    }

    private func colorValue(_ value: Any?, fallback: UIColor) -> UIColor {
        if let color = value as? UIColor {
            return color
        }
        if let converted = RCTConvert.uiColor(value) {
            return converted
        }
        return fallback
    }

    private func parsePeriod(_ title: String, fallback: Int) -> Int {
        let digits = title.filter { $0.isNumber }
        if digits.isEmpty {
            return fallback
        }
        return Int(digits) ?? fallback
    }

    private func defaultLevelColor(_ value: CGFloat) -> UIColor {
        if value >= 70 {
            return UIColor(red: 239 / 255, green: 68 / 255, blue: 68 / 255, alpha: 1)
        }
        if value <= 30 {
            return UIColor(red: 20 / 255, green: 184 / 255, blue: 166 / 255, alpha: 1)
        }
        return UIColor(red: 107 / 255, green: 114 / 255, blue: 128 / 255, alpha: 1)
    }

    private func defaultLevelLabel(_ value: CGFloat) -> String {
        if value.rounded() == value {
            return String(Int(value))
        }
        return String(format: "%.2f", value)
    }
}
