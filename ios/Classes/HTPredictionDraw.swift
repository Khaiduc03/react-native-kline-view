//
//  HTPredictionDraw.swift
//  react-native-kline-view
//
//  Price Prediction Drawing (Confidence Cone + Mean Line + Levels)
//  Draws prediction overlay UNDER candles
//

import UIKit

class HTPredictionDraw {
    
    /// Draw prediction overlay on the chart
    /// Called from main draw cycle BEFORE candles are drawn
    static func drawPrediction(
        in context: CGContext,
        container: HTKLineContainerView,
        chartView: HTKLineView,
        baseY: CGFloat,
        height: CGFloat,
        configManager: HTKLineConfigManager
    ) {
        guard let predictionData = container.predictionData,
              container.predictionAnchorIndex >= 0 else {
            return // No prediction to draw
        }
        
        context.saveGState()
        
        // Extract prediction components
        if let bands = predictionData["bands"] as? [[String: Any]], !bands.isEmpty {
            drawConfidenceCone(context: context, chartView: chartView, bands: bands,
                             anchorIndex: container.predictionAnchorIndex,
                             baseY: baseY, height: height, configManager: configManager,
                             predictionData: predictionData)
        }
        
        if let points = predictionData["points"] as? [[String: Any]], !points.isEmpty {
            drawMeanLine(context: context, chartView: chartView, points: points,
                        anchorIndex: container.predictionAnchorIndex,
                        baseY: baseY, height: height, configManager: configManager,
                        predictionData: predictionData)
        }
        
        // DISABLED: Horizontal level lines make the chart too cluttered
        // Only show prediction trend lines and confidence zones
        /*
        if let levels = predictionData["levels"] as? [[String: Any]], !levels.isEmpty {
            drawLevels(context: context, chartView: chartView, levels: levels,
                      baseY: baseY, height: height, configManager: configManager,
                      predictionData: predictionData)
        }
        */
        
        context.restoreGState()
    }
    
    /// Calculate comprehensive min/max that includes ALL prediction data
    private static func calculatePredictionMinMax(
        predictionData: [String: Any],
        candleMin: CGFloat,
        candleMax: CGFloat
    ) -> (min: CGFloat, max: CGFloat) {
        var allPrices: [CGFloat] = [candleMin, candleMax]
        
        // Add all level prices
        if let levels = predictionData["levels"] as? [[String: Any]] {
            for level in levels {
                if let price = level["price"] as? CGFloat {
                    allPrices.append(price)
                }
            }
        }
        
        // Add all point prices (prediction line endpoints)
        if let points = predictionData["points"] as? [[String: Any]] {
            for point in points {
                if let price = point["price"] as? CGFloat {
                    allPrices.append(price)
                }
            }
        }
        
        // Get absolute min/max from all prices
        let minPrice = allPrices.min() ?? candleMin
        let maxPrice = allPrices.max() ?? candleMax
        
        // Add 5% buffer on both sides for visual spacing
        let range = maxPrice - minPrice
        let buffer = range * 0.05
        
        return (min: minPrice - buffer, max: maxPrice + buffer)
    }
    
    /// Draw confidence cone bands (semi-transparent filled areas)
    private static func drawConfidenceCone(
        context: CGContext,
        chartView: HTKLineView,
        bands: [[String: Any]],
        anchorIndex: Int,
        baseY: CGFloat,
        height: CGFloat,
        configManager: HTKLineConfigManager,
        predictionData: [String: Any]
    ) {
        // Get bias from prediction data to determine color
        let container = chartView.superview as? HTKLineContainerView
        let bias = container?.predictionData?["bias"] as? String ?? "neutral"
        let isBullish = bias == "bullish"
        
        // Set color based on bias: green for bullish, red for bearish
        let fillColor: UIColor
        if isBullish {
            fillColor = UIColor(red: 0.30, green: 0.69, blue: 0.31, alpha: 0.15) // Light green
        } else {
            fillColor = UIColor(red: 1.0, green: 0.27, blue: 0.27, alpha: 0.15) // Light red
        }
        
        // Calculate comprehensive min/max including ALL prediction data
        let candleMaxValue = configManager.modelArray.map { $0.high }.max() ?? 0
        let candleMinValue = configManager.modelArray.map { $0.low }.min() ?? 0
        let (minValue, maxValue) = calculatePredictionMinMax(
            predictionData: predictionData,
            candleMin: candleMinValue,
            candleMax: candleMaxValue
        )
        
        for band in bands {
            guard let startOffset = band["startOffset"] as? Int,
                  let endOffset = band["endOffset"] as? Int,
                  let bottom = band["bottom"] as? CGFloat,
                  let top = band["top"] as? CGFloat else {
                continue
            }
            
            // Map virtual indices to actual candle indices
            let startIndex = anchorIndex + startOffset
            let endIndex = anchorIndex + endOffset
            
            // Get screen coordinates
            let startX = chartView.getItemMiddleScrollX(startIndex, configManager)
            let endX = chartView.getItemMiddleScrollX(endIndex, configManager)
            
            let bottomY = chartView.yFromValue(bottom, maxValue: maxValue, minValue: minValue,
                                              baseY: baseY, height: height)
            let topY = chartView.yFromValue(top, maxValue: maxValue, minValue: minValue,
                                           baseY: baseY, height: height)
            
            // Draw filled rectangle for this band segment
            context.setFillColor(fillColor.cgColor)
            context.fill(CGRect(x: startX, y: topY, width: endX - startX, height: bottomY - topY))
        }
    }
    
    /// Draw dashed mean line through prediction points - DUAL SCENARIOS
    private static func drawMeanLine(
        context: CGContext,
        chartView: HTKLineView,
        points: [[String: Any]],
        anchorIndex: Int,
        baseY: CGFloat,
        height: CGFloat,
        configManager: HTKLineConfigManager,
        predictionData: [String: Any]
    ) {
        // Calculate comprehensive min/max including ALL prediction data
        let candleMaxValue = configManager.modelArray.map { $0.high }.max() ?? 0
        let candleMinValue = configManager.modelArray.map { $0.low }.min() ?? 0
        let (minValue, maxValue) = calculatePredictionMinMax(
            predictionData: predictionData,
            candleMin: candleMinValue,
            candleMax: candleMaxValue
        )
        
        // Get prediction starting price
        guard let firstPoint = points.first,
              let startPrice = firstPoint["price"] as? CGFloat else {
            return
        }
        
        // Create upside (bullish) path - GREEN
        let bullishPath = UIBezierPath()
        let bullishColor = UIColor(red: 0.30, green: 0.69, blue: 0.31, alpha: 1.0) // #4CAF50
        
        var firstBullishPoint = true
        var currentPrice = startPrice
        
        // Draw upward trending line (bullish scenario)
        for i in 0...6 {
            let offset = Int(Double(i) * 4.0) // offsets: 0, 4, 8, 12, 16, 20, 24
            let index = anchorIndex + offset
            
            // Calculate progressively higher prices
            let priceIncrease = currentPrice * CGFloat(0.015 * Double(i)) // 1.5% increase per segment
            let price = startPrice + priceIncrease
            
            let x = chartView.getItemMiddleScrollX(index, configManager)
            let y = chartView.yFromValue(price, maxValue: maxValue, minValue: minValue,
                                        baseY: baseY, height: height)
            
            if firstBullishPoint {
                bullishPath.move(to: CGPoint(x: x, y: y))
                firstBullishPoint = false
            } else {
                bullishPath.addLine(to: CGPoint(x: x, y: y))
            }
        }
        
        // Draw bullish path
        context.setStrokeColor(bullishColor.cgColor)
        context.setLineWidth(2.5)
        context.setLineDash(phase: 0, lengths: [8, 4])
        context.addPath(bullishPath.cgPath)
        context.strokePath()
        
        // Create downside (bearish) path - RED
        let bearishPath = UIBezierPath()
        let bearishColor = UIColor(red: 1.0, green: 0.27, blue: 0.27, alpha: 1.0) // #FF4545
        
        var firstBearishPoint = true
        
        // Draw downward trending line (bearish scenario)
        for i in 0...6 {
            let offset = Int(Double(i) * 4.0) // offsets: 0, 4, 8, 12, 16, 20, 24
            let index = anchorIndex + offset
            
            // Calculate progressively lower prices
            let priceDecrease = currentPrice * CGFloat(0.015 * Double(i)) // 1.5% decrease per segment
            let price = startPrice - priceDecrease
            
            let x = chartView.getItemMiddleScrollX(index, configManager)
            let y = chartView.yFromValue(price, maxValue: maxValue, minValue: minValue,
                                        baseY: baseY, height: height)
            
            if firstBearishPoint {
                bearishPath.move(to: CGPoint(x: x, y: y))
                firstBearishPoint = false
            } else {
                bearishPath.addLine(to: CGPoint(x: x, y: y))
            }
        }
        
        // Draw bearish path
        context.setStrokeColor(bearishColor.cgColor)
        context.setLineWidth(2.5)
        context.setLineDash(phase: 0, lengths: [8, 4])
        context.addPath(bearishPath.cgPath)
        context.strokePath()
        
        // Reset line dash
        context.setLineDash(phase: 0, lengths: [])
        
        // Note: Price labels are drawn separately on Y-axis in drawValue()
    }
    
    /// Draw price labels at prediction endpoints with colored backgrounds
    private static func drawPriceLabels(
        context: CGContext,
        chartView: HTKLineView,
        anchorIndex: Int,
        startPrice: CGFloat,
        maxValue: CGFloat,
        minValue: CGFloat,
        baseY: CGFloat,
        height: CGFloat,
        configManager: HTKLineConfigManager
    ) {
        let font = UIFont.boldSystemFont(ofSize: 12)
        let endOffset = 24 // Final candle offset
        let endIndex = anchorIndex + endOffset
        let chartWidth = chartView.bounds.width
        
        // Bullish end price (green)
        let bullishEndPrice = startPrice + (startPrice * 0.09) // +9%
        let bullishY = chartView.yFromValue(bullishEndPrice, maxValue: maxValue, minValue: minValue,
                                           baseY: baseY, height: height)
        let bullishPriceText = String(format: "%.2f", bullishEndPrice)
        let bullishColor = UIColor(red: 0.30, green: 0.69, blue: 0.31, alpha: 1.0) // #4CAF50
        
        // Draw bullish label with background
        drawPriceLabelWithBackground(
            context: context,
            text: bullishPriceText,
            y: bullishY,
            chartWidth: chartWidth,
            backgroundColor: bullishColor,
            font: font
        )
        
        // Bearish end price (red)
        let bearishEndPrice = startPrice - (startPrice * 0.09) // -9%
        let bearishY = chartView.yFromValue(bearishEndPrice, maxValue: maxValue, minValue: minValue,
                                           baseY: baseY, height: height)
        let bearishPriceText = String(format: "%.2f", bearishEndPrice)
        let bearishColor = UIColor(red: 1.0, green: 0.27, blue: 0.27, alpha: 1.0) // #FF4545
        
        // Draw bearish label with background
        drawPriceLabelWithBackground(
            context: context,
            text: bearishPriceText,
            y: bearishY,
            chartWidth: chartWidth,
            backgroundColor: bearishColor,
            font: font
        )
    }
    
    /// Helper to draw a price label with colored rounded background
    private static func drawPriceLabelWithBackground(
        context: CGContext,
        text: String,
        y: CGFloat,
        chartWidth: CGFloat,
        backgroundColor: UIColor,
        font: UIFont
    ) {
        let textAttributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: UIColor.white
        ]
        let textSize = (text as NSString).size(withAttributes: textAttributes)
        
        // Create background rect with padding
        let padding: CGFloat = 6
        let rectWidth = textSize.width + padding * 2
        let rectHeight = textSize.height + padding * 2
        let rectX = chartWidth - rectWidth - 4 // 4px from right edge
        let rectY = y - rectHeight / 2
        
        let backgroundRect = CGRect(x: rectX, y: rectY, width: rectWidth, height: rectHeight)
        let cornerRadius: CGFloat = 4
        
        // Draw rounded rectangle background
        let path = UIBezierPath(roundedRect: backgroundRect, cornerRadius: cornerRadius)
        context.setFillColor(backgroundColor.cgColor)
        context.addPath(path.cgPath)
        context.fillPath()
        
        // Draw text centered in the box
        let textX = rectX + padding
        let textY = rectY + padding
        (text as NSString).draw(at: CGPoint(x: textX, y: textY), withAttributes: textAttributes)
    }
    
    /// Draw horizontal level lines (SL, TP1, TP2, ENTRY, etc.)
    private static func drawLevels(
        context: CGContext,
        chartView: HTKLineView,
        levels: [[String: Any]],
        baseY: CGFloat,
        height: CGFloat,
        configManager: HTKLineConfigManager,
        predictionData: [String: Any]
    ) {
        let chartWidth = chartView.bounds.width
        
        // Calculate comprehensive min/max including ALL prediction data
        let candleMaxValue = configManager.modelArray.map { $0.high }.max() ?? 0
        let candleMinValue = configManager.modelArray.map { $0.low }.min() ?? 0
        let (minValue, maxValue) = calculatePredictionMinMax(
            predictionData: predictionData,
            candleMin: candleMinValue,
            candleMax: candleMaxValue
        )
        
        for level in levels {
            guard let type = level["type"] as? String,
                  let price = level["price"] as? CGFloat else {
                continue
            }
            
            let label = level["label"] as? String ?? ""
            let y = chartView.yFromValue(price, maxValue: maxValue, minValue: minValue,
                                        baseY: baseY, height: height)
            
            // Get color based on level type
            let color = getLevelColor(type: type)
            
            // Draw horizontal line
            context.setStrokeColor(color.cgColor)
            context.setLineWidth(1.5)
            context.setLineDash(phase: 0, lengths: [8, 4])
            context.move(to: CGPoint(x: 0, y: y))
            context.addLine(to: CGPoint(x: chartWidth, y: y))
            context.strokePath()
            context.setLineDash(phase: 0, lengths: []) // Reset dash
            
            // Draw label on the right side
            if !label.isEmpty {
                let font = UIFont.systemFont(ofSize: 12)
                let attributes: [NSAttributedString.Key: Any] = [
                    .font: font,
                    .foregroundColor: color
                ]
                let textSize = (label as NSString).size(withAttributes: attributes)
                let textPoint = CGPoint(x: chartWidth - textSize.width - 10, y: y - textSize.height - 5)
                (label as NSString).draw(at: textPoint, withAttributes: attributes)
            }
        }
    }
    
    /// Get color for level type
    private static func getLevelColor(type: String) -> UIColor {
        switch type {
        case "SL":
            return UIColor(red: 1.0, green: 0.27, blue: 0.27, alpha: 1.0) // Red for stop loss
        case "TP1", "TP2", "TP3":
            return UIColor(red: 0.30, green: 0.69, blue: 0.31, alpha: 1.0) // Green for take profit
        case "ENTRY":
            return UIColor(red: 1.0, green: 0.76, blue: 0.03, alpha: 1.0) // Amber for entry
        case "SUP":
            return UIColor(red: 0.13, green: 0.59, blue: 0.95, alpha: 1.0) // Blue for support
        case "RES":
            return UIColor(red: 1.0, green: 0.60, blue: 0.0, alpha: 1.0) // Orange for resistance
        default:
            return UIColor.gray
        }
    }
}

// MARK: - Helper Extensions

extension HTKLineView {
    /// Get middle scroll X coordinate for an item index
    func getItemMiddleScrollX(_ index: Int, _ configManager: HTKLineConfigManager) -> CGFloat {
        return CGFloat(index) * configManager.itemWidth + configManager.itemWidth / 2.0
    }
    
    /// Convert price value to Y coordinate
    func yFromValue(_ value: CGFloat, maxValue: CGFloat, minValue: CGFloat,
                   baseY: CGFloat, height: CGFloat) -> CGFloat {
        let range = maxValue - minValue
        guard range > 0 else { return baseY + height / 2 }
        return baseY + (maxValue - value) / range * height
    }
}
