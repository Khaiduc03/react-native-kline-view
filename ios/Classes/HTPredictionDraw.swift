//
//  HTPredictionDraw.swift
//  react-native-kline-view
//
//  Draw prediction overlay under candles.
//

import UIKit

final class HTPredictionDraw {
    func minMaxRange(_ state: HTPredictionState) -> Range<CGFloat>? {
        var minV: CGFloat?
        var maxV: CGFloat?

        func consume(_ v: CGFloat) {
            if minV == nil || v < minV! { minV = v }
            if maxV == nil || v > maxV! { maxV = v }
        }

        for p in state.points {
            consume(p.price)
        }
        for b in state.bands {
            consume(b.top)
            consume(b.bottom)
        }
        for c in state.predictedCandles {
            consume(c.high)
            consume(c.low)
        }

        guard let lo = minV, let hi = maxV, hi > lo else { return nil }
        return lo..<hi
    }

    func draw(
        _ context: CGContext,
        state: HTPredictionState,
        visibleLowerBoundIndex: Int,
        mainMinMaxRange: Range<CGFloat>,
        mainBaseY: CGFloat,
        mainHeight: CGFloat,
        configManager: HTKLineConfigManager
    ) {
        guard mainHeight > 0 else { return }
        let scale = (mainMinMaxRange.upperBound - mainMinMaxRange.lowerBound) / mainHeight
        guard scale != 0 else { return }

        func y(_ price: CGFloat) -> CGFloat {
            return mainBaseY + (mainMinMaxRange.upperBound - price) / scale
        }

        let itemWidth = configManager.itemWidth

        // --- Bands (filled polygons) ---
        if !state.bands.isEmpty {
            for band in state.bands {
                let x0 = CGFloat((state.anchorIndex + band.fromOffset) - visibleLowerBoundIndex) * itemWidth
                let x1 = CGFloat((state.anchorIndex + band.toOffset + 1) - visibleLowerBoundIndex) * itemWidth

                let topY = y(band.top)
                let bottomY = y(band.bottom)
                let rect = CGRect(x: min(x0, x1), y: min(topY, bottomY), width: abs(x1 - x0), height: abs(bottomY - topY))

                let alphaBase: CGFloat = 0.12
                let confidence = band.confidence ?? 0.8
                let alpha = max(0.06, min(0.25, alphaBase + confidence * 0.12))

                context.saveGState()
                context.setFillColor(configManager.gridColor.withAlphaComponent(alpha).cgColor)
                context.fill(rect)
                context.restoreGState()
            }
        }

        // --- Mean line (dashed) ---
        if state.points.count >= 2 {
            let sorted = state.points.sorted { $0.offset < $1.offset }
            let path = UIBezierPath()
            for (i, p) in sorted.enumerated() {
                let x = CGFloat((state.anchorIndex + p.offset) - visibleLowerBoundIndex) * itemWidth + itemWidth / 2
                let point = CGPoint(x: x, y: y(p.price))
                if i == 0 {
                    path.move(to: point)
                } else {
                    path.addLine(to: point)
                }
            }

            context.saveGState()
            context.addPath(path.cgPath)
            context.setStrokeColor(configManager.textColor.withAlphaComponent(0.9).cgColor)
            context.setLineWidth(max(1, configManager.lineWidth))
            context.setLineDash(phase: 0, lengths: [6, 4])
            context.strokePath()
            context.restoreGState()
        }

        // --- Levels (thin dashed horizontals across prediction horizon) ---
        if !state.levels.isEmpty {
            let xStart = CGFloat(state.anchorIndex - visibleLowerBoundIndex) * itemWidth
            let xEnd = CGFloat((state.anchorIndex + max(1, state.horizonCandles)) - visibleLowerBoundIndex) * itemWidth

            context.saveGState()
            context.setStrokeColor(configManager.gridColor.withAlphaComponent(0.85).cgColor)
            context.setLineWidth(max(0.75, configManager.gridLineWidth))
            context.setLineDash(phase: 0, lengths: [3, 3])

            for lvl in state.levels {
                let yy = y(lvl.price)
                context.move(to: CGPoint(x: xStart, y: yy))
                context.addLine(to: CGPoint(x: xEnd, y: yy))
                context.strokePath()
            }
            context.restoreGState()
        }
    }
}
