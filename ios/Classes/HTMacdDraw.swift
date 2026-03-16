//
//  HTMacdDraw.swift
//  HTKLineView
//
//  Created by hublot on 2020/3/17.
//  Copyright © 2020 hublot. All rights reserved.
//

import UIKit

class HTMacdDraw: NSObject, HTKLineDrawProtocol {
    private struct LabelSpec {
        var y: CGFloat
        let text: String
        let color: UIColor
    }

    func minMaxRange(_ visibleModelArray: [HTKLineModel], _ configManager: HTKLineConfigManager) -> Range<CGFloat> {
        var maxValue = CGFloat.leastNormalMagnitude
        var minValue = CGFloat.greatestFiniteMagnitude

        for model in visibleModelArray {
            let valueList = [model.macdValue, model.macdDif, model.macdDea]
            maxValue = max(maxValue, valueList.max() ?? 0)
            minValue = min(minValue, valueList.min() ?? 0)
        }
        return Range<CGFloat>.init(uncheckedBounds: (lower: minValue, upper: maxValue))
    }

    func drawCandle(_ model: HTKLineModel, _ index: Int, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        let color = model.macdValue > 0 ? configManager.increaseColor : configManager.decreaseColor
        let valueList = [model.macdValue, 0]
        let high = valueList.max() ?? 0
        let low = valueList.min() ?? 0
        drawCandle(high: high, low: low, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, width: configManager.macdCandleWidth, color: color, verticalAlignBottom: false, context: context, configManager: configManager)
    }

    func drawLine(_ model: HTKLineModel, _ lastModel: HTKLineModel, _ maxValue: CGFloat, _ minValue: CGFloat, _ baseY: CGFloat, _ height: CGFloat, _ index: Int, _ lastIndex: Int, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        let itemList = [
            ["value": model.macdDif, "lastValue": lastModel.macdDif, "color": safeTargetColor(configManager, at: 0, fallback: configManager.textColor)],
            ["value": model.macdDea, "lastValue": lastModel.macdDea, "color": safeTargetColor(configManager, at: 1, fallback: configManager.textColor)],
        ]
        for item in itemList {
            drawLine(value: item["value"] as? CGFloat ?? 0, lastValue: item["lastValue"] as? CGFloat ?? 0, maxValue: maxValue, minValue: minValue, baseY: baseY, height: height, index: index, lastIndex: lastIndex, color: item["color"] as? UIColor ?? UIColor.orange, isBezier: false, context: context, configManager: configManager)
        }
    }

    func drawText(_ model: HTKLineModel, _ baseX: CGFloat, _ baseY: CGFloat, _ context: CGContext, _ configManager: HTKLineConfigManager) {
        var x = baseX
        let itemList = [
            ["title": String(format: "MACD(%@,%@,%@)", configManager.macdS, configManager.macdL, configManager.macdM), "color": configManager.textColor],
            ["title": String(format: "MACD:%@", configManager.precision(model.macdValue, -1)), "color": safeTargetColor(configManager, at: 5, fallback: configManager.textColor)],
            ["title": String(format: "DIF:%@", configManager.precision(model.macdDif, -1)), "color": safeTargetColor(configManager, at: 0, fallback: configManager.textColor)],
            ["title": String(format: "DEA:%@", configManager.precision(model.macdDea, -1)), "color": safeTargetColor(configManager, at: 1, fallback: configManager.textColor)],
        ]
        let font = configManager.createFont(configManager.headerTextFontSize)
        for item in itemList {
            x += drawText(title: item["title"] as? String ?? "", point: CGPoint.init(x: x, y: baseY), color: item["color"] as? UIColor ?? UIColor.orange, font: font, context: context, configManager: configManager)
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

        var labels = [LabelSpec]()
        let macdLabel = resolveLineLabel(configManager, key: "macd", fallback: "MACD")
        let signalLabel = resolveLineLabel(configManager, key: "signal", fallback: "Signal")
        let histogramLabel = resolveLineLabel(configManager, key: "histogram", fallback: "Histogram")
        let histogramColor = model.macdValue >= 0 ? configManager.increaseColor : configManager.decreaseColor

        addOverlay(
            &labels,
            model.macdDif,
            macdLabel,
            safeTargetColor(configManager, at: 0, fallback: configManager.textColor),
            allWidth,
            maxValue,
            minValue,
            baseY,
            height,
            context,
            configManager
        )
        addOverlay(
            &labels,
            model.macdDea,
            signalLabel,
            safeTargetColor(configManager, at: 1, fallback: configManager.textColor),
            allWidth,
            maxValue,
            minValue,
            baseY,
            height,
            context,
            configManager
        )
        addOverlay(
            &labels,
            model.macdValue,
            histogramLabel,
            histogramColor,
            allWidth,
            maxValue,
            minValue,
            baseY,
            height,
            context,
            configManager
        )

        if labels.isEmpty {
            return
        }

        drawRightLabels(labels, allWidth, baseY, height, context, configManager)
    }

    private func shouldDrawLineLabels(_ configManager: HTKLineConfigManager) -> Bool {
        return configManager.childType == .macd && configManager.macdStyle == "line_labels"
    }

    private func addOverlay(
        _ labels: inout [LabelSpec],
        _ value: CGFloat,
        _ name: String,
        _ color: UIColor,
        _ allWidth: CGFloat,
        _ maxValue: CGFloat,
        _ minValue: CGFloat,
        _ baseY: CGFloat,
        _ height: CGFloat,
        _ context: CGContext,
        _ configManager: HTKLineConfigManager
    ) {
        if !value.isFinite || value.isNaN {
            return
        }
        let y = clampY(pointY(value, maxValue, minValue, baseY, height), baseY, height)
        context.saveGState()
        context.setStrokeColor(color.withAlphaComponent(0.58).cgColor)
        context.setLineWidth(0.9)
        context.setLineDash(phase: 0, lengths: [8, 6])
        context.move(to: CGPoint(x: 0, y: y))
        context.addLine(to: CGPoint(x: allWidth, y: y))
        context.strokePath()
        context.restoreGState()

        let valueText = configManager.precision(value, configManager.price)
        labels.append(
            LabelSpec(
                y: y,
                text: formatOverlayText(name: name, valueText: valueText),
                color: color
            )
        )
    }

    private func formatOverlayText(name: String, valueText: String) -> String {
        let normalized = name.trimmingCharacters(in: .whitespacesAndNewlines)
        if normalized.isEmpty {
            return valueText
        }
        return "\(normalized) \(valueText)"
    }

    private func resolveLineLabel(
        _ configManager: HTKLineConfigManager,
        key: String,
        fallback: String
    ) -> String {
        guard let labels = configManager.macdLineLabels else {
            return fallback
        }
        if let value = labels[key] as? String {
            return value
        }
        return fallback
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
}
