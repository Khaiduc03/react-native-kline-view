//
//  HTSignalDraw.swift
//  RNKLineView
//
//  Created for Trading Signal Visualization - Live Analyst Feature
//  Draws prediction zones, targets, support/resistance with Y-axis price boxes
//

import UIKit

class HTSignalDraw: NSObject {
    
    // MARK: - Constants
    private let PRICE_BOX_PADDING_H: CGFloat = 8
    private let PRICE_BOX_PADDING_V: CGFloat = 4
    private let PRICE_BOX_CORNER_RADIUS: CGFloat = 4
    private let PRICE_BOX_MIN_SPACING: CGFloat = 24
    private let PREDICTION_LINE_DASH: [CGFloat] = [6, 4]
    private let TRIANGLE_SIZE: CGFloat = 6
    
    // MARK: - Drawing State
    private var drawnPriceBoxes: [CGRect] = []
    
    // MARK: - Main Draw Method
    func draw(_ context: CGContext,
              _ klineView: HTKLineView,
              _ signal: HTTradingSignalModel?,
              _ configManager: HTKLineConfigManager) {
        
        guard let signal = signal, signal.hasValidData else { return }
        
        // Reset drawn boxes for collision detection
        drawnPriceBoxes.removeAll()
        
        // Get current price from last candle if not provided
        let currentPrice = signal.currentPrice ?? configManager.modelArray.last?.close ?? 0
        guard currentPrice > 0 else { return }
        
        // Calculate right edge for prediction zone
        let lastCandleX = CGFloat(configManager.modelArray.count) * configManager.itemWidth - klineView.contentOffset.x
        let predictionStartX = lastCandleX + configManager.itemWidth / 2
        let predictionEndX = klineView.allWidth - configManager.paddingRight
        
        // Draw prediction zone (shaded area to the right)
        drawPredictionZone(context, klineView, signal, currentPrice, predictionStartX, predictionEndX, configManager)
        
        // Draw target lines with dashed style
        drawTargetLines(context, klineView, signal, currentPrice, predictionStartX, predictionEndX, configManager)
        
        // Draw support/resistance levels
        drawSupportResistance(context, klineView, signal, predictionStartX, predictionEndX, configManager)
        
        // Draw Y-axis price boxes (must be last to overlay everything)
        drawPriceBoxes(context, klineView, signal, currentPrice, configManager)
    }
    
    // MARK: - Prediction Zone
    private func drawPredictionZone(_ context: CGContext,
                                     _ klineView: HTKLineView,
                                     _ signal: HTTradingSignalModel,
                                     _ currentPrice: CGFloat,
                                     _ startX: CGFloat,
                                     _ endX: CGFloat,
                                     _ configManager: HTKLineConfigManager) {
        
        guard startX < endX else { return }
        
        // Get primary target for prediction direction
        guard let primaryTarget = signal.targets.first else { return }
        
        let currentY = klineView.yFromValue(currentPrice)
        let targetY = klineView.yFromValue(primaryTarget.level)
        
        // Determine zone colors based on direction
        let isBullish = primaryTarget.level > currentPrice
        let zoneColor = isBullish ? HTTradingSignalModel.bullishColor : HTTradingSignalModel.bearishColor
        
        // Draw semi-transparent prediction zone
        let topY = min(currentY, targetY)
        let bottomY = max(currentY, targetY)
        let zoneHeight = bottomY - topY
        
        if zoneHeight > 0 {
            context.saveGState()
            
            // Fill zone with gradient
            let zoneRect = CGRect(x: startX, y: topY, width: endX - startX, height: zoneHeight)
            context.setFillColor(zoneColor.withAlphaComponent(0.08).cgColor)
            context.fill(zoneRect)
            
            // Draw zone border lines (dashed)
            context.setStrokeColor(zoneColor.withAlphaComponent(0.4).cgColor)
            context.setLineWidth(1.0)
            context.setLineDash(phase: 0, lengths: PREDICTION_LINE_DASH)
            
            // Top border
            context.move(to: CGPoint(x: startX, y: topY))
            context.addLine(to: CGPoint(x: endX, y: topY))
            context.strokePath()
            
            // Bottom border
            context.move(to: CGPoint(x: startX, y: bottomY))
            context.addLine(to: CGPoint(x: endX, y: bottomY))
            context.strokePath()
            
            context.restoreGState()
        }
        
        // Draw prediction arrow/line from current price to target
        drawPredictionArrow(context, klineView, currentPrice, primaryTarget.level, startX, endX, zoneColor)
    }
    
    // MARK: - Prediction Arrow
    private func drawPredictionArrow(_ context: CGContext,
                                      _ klineView: HTKLineView,
                                      _ fromPrice: CGFloat,
                                      _ toPrice: CGFloat,
                                      _ startX: CGFloat,
                                      _ endX: CGFloat,
                                      _ color: UIColor) {
        
        let fromY = klineView.yFromValue(fromPrice)
        let toY = klineView.yFromValue(toPrice)
        
        context.saveGState()
        
        // Draw dashed line from current to target
        context.setStrokeColor(color.withAlphaComponent(0.8).cgColor)
        context.setLineWidth(1.5)
        context.setLineDash(phase: 0, lengths: PREDICTION_LINE_DASH)
        
        context.move(to: CGPoint(x: startX, y: fromY))
        context.addLine(to: CGPoint(x: endX - 10, y: toY))
        context.strokePath()
        
        // Draw arrow head at the end
        context.setLineDash(phase: 0, lengths: [])
        context.setFillColor(color.withAlphaComponent(0.8).cgColor)
        
        let arrowX = endX - 10
        let arrowY = toY
        let arrowSize: CGFloat = 6
        
        let arrowPath = UIBezierPath()
        if toPrice < fromPrice {
            // Arrow pointing down
            arrowPath.move(to: CGPoint(x: arrowX, y: arrowY + arrowSize))
            arrowPath.addLine(to: CGPoint(x: arrowX - arrowSize/2, y: arrowY))
            arrowPath.addLine(to: CGPoint(x: arrowX + arrowSize/2, y: arrowY))
        } else {
            // Arrow pointing up
            arrowPath.move(to: CGPoint(x: arrowX, y: arrowY - arrowSize))
            arrowPath.addLine(to: CGPoint(x: arrowX - arrowSize/2, y: arrowY))
            arrowPath.addLine(to: CGPoint(x: arrowX + arrowSize/2, y: arrowY))
        }
        arrowPath.close()
        
        context.addPath(arrowPath.cgPath)
        context.fillPath()
        
        context.restoreGState()
    }
    
    // MARK: - Target Lines
    private func drawTargetLines(_ context: CGContext,
                                  _ klineView: HTKLineView,
                                  _ signal: HTTradingSignalModel,
                                  _ currentPrice: CGFloat,
                                  _ startX: CGFloat,
                                  _ endX: CGFloat,
                                  _ configManager: HTKLineConfigManager) {
        
        for (index, target) in signal.targets.enumerated() {
            let y = klineView.yFromValue(target.level)
            
            // Skip if outside visible area
            guard y >= klineView.mainBaseY && y <= klineView.mainBaseY + klineView.mainHeight else {
                continue
            }
            
            // Determine color based on target type and direction
            let isBullish = target.level > currentPrice
            let color = isBullish ? HTTradingSignalModel.bullishColor : HTTradingSignalModel.bearishColor
            
            // Adjust alpha based on target priority (first target is most prominent)
            let alpha: CGFloat = max(0.4, 0.8 - CGFloat(index) * 0.15)
            
            context.saveGState()
            
            // Draw horizontal dashed line
            context.setStrokeColor(color.withAlphaComponent(alpha).cgColor)
            context.setLineWidth(1.0)
            context.setLineDash(phase: 0, lengths: PREDICTION_LINE_DASH)
            
            context.move(to: CGPoint(x: 0, y: y))
            context.addLine(to: CGPoint(x: klineView.allWidth - configManager.paddingRight, y: y))
            context.strokePath()
            
            // Draw small label for target type (optional - can be disabled for cleaner look)
            if index == 0 {
                drawTargetLabel(context, target, startX + 5, y, color.withAlphaComponent(alpha), configManager)
            }
            
            context.restoreGState()
        }
    }
    
    // MARK: - Target Label
    private func drawTargetLabel(_ context: CGContext,
                                  _ target: HTTargetLevel,
                                  _ x: CGFloat,
                                  _ y: CGFloat,
                                  _ color: UIColor,
                                  _ configManager: HTKLineConfigManager) {
        
        let font = configManager.createFont(9)
        let label = "TP"
        
        let attributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: color
        ]
        
        let size = (label as NSString).size(withAttributes: attributes)
        let labelRect = CGRect(x: x, y: y - size.height - 2, width: size.width, height: size.height)
        
        (label as NSString).draw(in: labelRect, withAttributes: attributes)
    }
    
    // MARK: - Support/Resistance Lines
    private func drawSupportResistance(_ context: CGContext,
                                        _ klineView: HTKLineView,
                                        _ signal: HTTradingSignalModel,
                                        _ startX: CGFloat,
                                        _ endX: CGFloat,
                                        _ configManager: HTKLineConfigManager) {
        
        // Draw support level
        if let support = signal.nearestSupport {
            let y = klineView.yFromValue(support)
            if y >= klineView.mainBaseY && y <= klineView.mainBaseY + klineView.mainHeight {
                drawSupportResistanceLine(context, klineView, y, HTTradingSignalModel.bullishColor, "S", configManager)
            }
        }
        
        // Draw resistance level
        if let resistance = signal.nearestResistance {
            let y = klineView.yFromValue(resistance)
            if y >= klineView.mainBaseY && y <= klineView.mainBaseY + klineView.mainHeight {
                drawSupportResistanceLine(context, klineView, y, HTTradingSignalModel.bearishColor, "R", configManager)
            }
        }
        
        // Draw stop loss if available
        if let stopLoss = signal.stopLoss {
            let y = klineView.yFromValue(stopLoss)
            if y >= klineView.mainBaseY && y <= klineView.mainBaseY + klineView.mainHeight {
                drawStopLossLine(context, klineView, y, configManager)
            }
        }
    }
    
    // MARK: - Support/Resistance Line
    private func drawSupportResistanceLine(_ context: CGContext,
                                            _ klineView: HTKLineView,
                                            _ y: CGFloat,
                                            _ color: UIColor,
                                            _ label: String,
                                            _ configManager: HTKLineConfigManager) {
        
        context.saveGState()
        
        // Draw dotted line
        context.setStrokeColor(color.withAlphaComponent(0.5).cgColor)
        context.setLineWidth(1.0)
        context.setLineDash(phase: 0, lengths: [2, 2])
        
        context.move(to: CGPoint(x: 0, y: y))
        context.addLine(to: CGPoint(x: klineView.allWidth - configManager.paddingRight, y: y))
        context.strokePath()
        
        context.restoreGState()
    }
    
    // MARK: - Stop Loss Line
    private func drawStopLossLine(_ context: CGContext,
                                   _ klineView: HTKLineView,
                                   _ y: CGFloat,
                                   _ configManager: HTKLineConfigManager) {
        
        let color = UIColor(red: 1.0, green: 0.3, blue: 0.3, alpha: 1.0) // Bright red for SL
        
        context.saveGState()
        
        // Draw solid line for stop loss (more prominent)
        context.setStrokeColor(color.withAlphaComponent(0.7).cgColor)
        context.setLineWidth(1.5)
        context.setLineDash(phase: 0, lengths: [4, 2])
        
        context.move(to: CGPoint(x: 0, y: y))
        context.addLine(to: CGPoint(x: klineView.allWidth - configManager.paddingRight, y: y))
        context.strokePath()
        
        context.restoreGState()
    }
    
    // MARK: - Y-Axis Price Boxes
    private func drawPriceBoxes(_ context: CGContext,
                                 _ klineView: HTKLineView,
                                 _ signal: HTTradingSignalModel,
                                 _ currentPrice: CGFloat,
                                 _ configManager: HTKLineConfigManager) {
        
        let rightEdge = klineView.allWidth
        
        // Collect all price levels to draw
        var priceLevels: [(price: CGFloat, color: UIColor, isPrimary: Bool)] = []
        
        // Add targets
        for (index, target) in signal.targets.enumerated() {
            let isBullish = target.level > currentPrice
            let color = isBullish ? HTTradingSignalModel.bullishColor : HTTradingSignalModel.bearishColor
            priceLevels.append((target.level, color, index == 0))
        }
        
        // Add support/resistance
        if let support = signal.nearestSupport {
            priceLevels.append((support, HTTradingSignalModel.bullishColor, false))
        }
        if let resistance = signal.nearestResistance {
            priceLevels.append((resistance, HTTradingSignalModel.bearishColor, false))
        }
        
        // Sort by Y position (top to bottom)
        priceLevels.sort { klineView.yFromValue($0.price) < klineView.yFromValue($1.price) }
        
        // Draw each price box with collision avoidance
        for priceLevel in priceLevels {
            drawPriceBox(context, klineView, priceLevel.price, priceLevel.color, priceLevel.isPrimary, rightEdge, configManager)
        }
    }
    
    // MARK: - Single Price Box
    private func drawPriceBox(_ context: CGContext,
                               _ klineView: HTKLineView,
                               _ price: CGFloat,
                               _ color: UIColor,
                               _ isPrimary: Bool,
                               _ rightEdge: CGFloat,
                               _ configManager: HTKLineConfigManager) {
        
        var y = klineView.yFromValue(price)
        
        // Skip if outside main chart area
        guard y >= klineView.mainBaseY - 20 && y <= klineView.mainBaseY + klineView.mainHeight + 20 else {
            return
        }
        
        let font = configManager.createFont(isPrimary ? 11 : 10)
        let priceText = configManager.precision(price, configManager.price)
        
        // Calculate text size
        let attributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: UIColor.white
        ]
        let textSize = (priceText as NSString).size(withAttributes: attributes)
        
        // Calculate box dimensions
        let boxWidth = textSize.width + PRICE_BOX_PADDING_H * 2
        let boxHeight = textSize.height + PRICE_BOX_PADDING_V * 2
        
        // Position box at right edge
        let boxX = rightEdge - boxWidth
        var boxY = y - boxHeight / 2
        
        // Collision avoidance - adjust Y if overlapping with existing boxes
        var proposedRect = CGRect(x: boxX, y: boxY, width: boxWidth, height: boxHeight)
        for existingBox in drawnPriceBoxes {
            if proposedRect.intersects(existingBox.insetBy(dx: 0, dy: -PRICE_BOX_MIN_SPACING / 2)) {
                // Move down
                boxY = existingBox.maxY + PRICE_BOX_MIN_SPACING / 2
                proposedRect = CGRect(x: boxX, y: boxY, width: boxWidth, height: boxHeight)
            }
        }
        
        // Clamp to visible area
        boxY = max(klineView.mainBaseY, min(boxY, klineView.mainBaseY + klineView.mainHeight - boxHeight))
        let boxRect = CGRect(x: boxX, y: boxY, width: boxWidth, height: boxHeight)
        
        // Record for collision detection
        drawnPriceBoxes.append(boxRect)
        
        context.saveGState()
        
        // Draw box background
        let boxPath = UIBezierPath(roundedRect: boxRect, cornerRadius: PRICE_BOX_CORNER_RADIUS)
        context.setFillColor(color.cgColor)
        context.addPath(boxPath.cgPath)
        context.fillPath()
        
        // Draw small triangle pointer on left side
        let triangleHeight: CGFloat = 6
        let triangleWidth: CGFloat = 4
        let triangleCenterY = y // Point to actual price level
        
        // Only draw triangle if it's within reasonable distance
        if abs(triangleCenterY - (boxY + boxHeight / 2)) < boxHeight {
            let trianglePath = UIBezierPath()
            trianglePath.move(to: CGPoint(x: boxX, y: boxY + boxHeight / 2 - triangleHeight / 2))
            trianglePath.addLine(to: CGPoint(x: boxX - triangleWidth, y: boxY + boxHeight / 2))
            trianglePath.addLine(to: CGPoint(x: boxX, y: boxY + boxHeight / 2 + triangleHeight / 2))
            trianglePath.close()
            
            context.setFillColor(color.cgColor)
            context.addPath(trianglePath.cgPath)
            context.fillPath()
        }
        
        // Draw connecting line from triangle to actual price Y
        let lineY = klineView.yFromValue(price)
        if abs(lineY - (boxY + boxHeight / 2)) > 2 {
            context.setStrokeColor(color.withAlphaComponent(0.5).cgColor)
            context.setLineWidth(0.5)
            context.setLineDash(phase: 0, lengths: [])
            context.move(to: CGPoint(x: boxX - triangleWidth, y: boxY + boxHeight / 2))
            context.addLine(to: CGPoint(x: boxX - triangleWidth - 10, y: lineY))
            context.strokePath()
        }
        
        // Draw price text
        let textX = boxX + PRICE_BOX_PADDING_H
        let textY = boxY + PRICE_BOX_PADDING_V
        
        (priceText as NSString).draw(at: CGPoint(x: textX, y: textY), withAttributes: attributes)
        
        // Draw percentage change if primary target
        if isPrimary, let currentPrice = configManager.modelArray.last?.close, currentPrice > 0 {
            let percentChange = ((price - currentPrice) / currentPrice) * 100
            let percentText = String(format: "%+.2f%%", percentChange)
            
            let smallFont = configManager.createFont(8)
            let percentAttributes: [NSAttributedString.Key: Any] = [
                .font: smallFont,
                .foregroundColor: UIColor.white.withAlphaComponent(0.8)
            ]
            let percentSize = (percentText as NSString).size(withAttributes: percentAttributes)
            
            // Draw below price
            let percentY = boxY + boxHeight + 2
            if percentY + percentSize.height < klineView.mainBaseY + klineView.mainHeight {
                let percentX = rightEdge - percentSize.width - PRICE_BOX_PADDING_H
                (percentText as NSString).draw(at: CGPoint(x: percentX, y: percentY), withAttributes: percentAttributes)
            }
        }
        
        context.restoreGState()
    }
    
    // MARK: - Utility
    private func alignToPixel(_ v: CGFloat) -> CGFloat {
        let s = UIScreen.main.scale
        return (floor(v * s) + 0.5) / s
    }
}
