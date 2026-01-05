//
//  HTKLineswift
//  HTKLineView
//
//  Created by hublot on 2020/4/2.
//  Copyright © 2020 hublot. All rights reserved.
//

import UIKit

enum HTKLineMainType: Int {

    case none = -1

    case ma = 1

    case boll = 2

}

enum HTKLineChildType: Int {

    case none = -1

    case macd = 3

    case kdj = 4

    case rsi = 5

    case wr = 6

}

enum HTKLineDrawType: Int {

    case none = 0

    case line = 1

    case horizontalLine = 2

    case verticalLine = 3

    case halfLine = 4

    case parallelLine = 5

    case rectangle = 6

    case parallelogram = 7

}

enum HTDrawState: Int {

    case none = -3

    case showPencil = -2

    case showContext = -1

}

typealias HTKLineDrawItemBlock = (HTDrawItem?, Int) -> Void

class HTKLineConfigManager: NSObject {

    var modelArray = [HTKLineModel]()

    var shouldScrollToEnd = true

    var maList = [HTKLineItemModel]()

    var maVolumeList = [HTKLineItemModel]()

    var rsiList = [HTKLineItemModel]()

    var wrList = [HTKLineItemModel]()

    var bollN = ""

    var bollP = ""

    var macdS = ""

    var macdL = ""

    var macdM = ""

    var kdjN = ""

    var kdjM1 = ""

    var kdjM2 = ""


    var price: Int = 4

    var volume: Int = 4

    var primary: Int = 0

    var second: Int = 0

    var mainType: HTKLineMainType {
        get {
            return HTKLineMainType(rawValue: self.primary) ?? HTKLineMainType.none
        }
    }

    var childType: HTKLineChildType {
        get {
            return HTKLineChildType(rawValue: second) ?? HTKLineChildType.none
        }
    }



    var itemWidth: CGFloat = 9

    var _itemWidth: CGFloat = 9

    var candleWidth: CGFloat = 7

    var _candleWidth: CGFloat = 7

    var minuteVolumeCandleWidth: CGFloat = 0

    var _minuteVolumeCandleWidth: CGFloat = 0

    var macdCandleWidth: CGFloat = 0

    var _macdCandleWidth: CGFloat = 0

    func reloadScrollViewScale(_ scale: CGFloat) {
        itemWidth = _itemWidth * scale
        candleWidth = _candleWidth * scale
        minuteVolumeCandleWidth = _minuteVolumeCandleWidth * scale
        macdCandleWidth = _macdCandleWidth * scale
    }

    /// Format số theo đúng logic: tiny numbers, large numbers, standard numbers
    func precision(_ value: CGFloat, _ precision: Int) -> String {
        return formatPrice(value, 4, precision)
    }

    func formatPrice(_ value: CGFloat, _ minZeros: Int = 4, _ significantDigits: Int = 4) -> String {
        // Handle zero
        if value == 0 { return "0.00" }

        let absValue = abs(value)
        
        // Very small numbers (< 1)
        if absValue < 1 && absValue > 0 {
            let formatted = formatTinyNumber(absValue, minZeros, significantDigits)
            return value < 0 ? "-$\(formatted)" : "\(formatted)"
        }
        
        // Large numbers (>= 1M)
        if absValue >= 1_000_000 {
            // Using NumberFormatter for compact notation
            let formatter = NumberFormatter()
            formatter.numberStyle = .currency // We want compact, but Apple's compact is simplified in .scientific or custom.
            // Actually, for "1.25M" style, .scientific is not it.
            // On iOS 14+, NumberFormatter has specific compact support, but let's stick to a manual robust approach or standard one if reliable.
            // To match "en-US" "compact" from JS:
            
            // Manual Compact Implementation to ensure cross-version compatibility for "M", "B", etc.
            // Or use ByteCountFormatter? No, that's bytes.
            
            let num = Double(absValue)
            let sign = value < 0 ? "-" : ""
            
            let units = ["", "K", "M", "B", "T", "P", "E"]
            var mag = 0
            var temp = num
            while temp >= 1000 && mag < units.count - 1 {
                temp /= 1000
                mag += 1
            }
            
            let formattedNum = String(format: "%.2f", temp)
            return "\(sign)$\(formattedNum)\(units[mag])"
        }
        
        // Standard numbers
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = value > 100 ? 2 : significantDigits
        formatter.locale = Locale(identifier: "en_US")
        
        if let string = formatter.string(from: NSNumber(value: Double(absValue))) {
            return value < 0 ? "-$\(string)" : "\(string)"
        }
        
        return String(format: "%.2f", value)
    }

    func formatTinyNumber(_ value: CGFloat, _ minZeros: Int, _ significantDigits: Int) -> String {
        // Convert to decimal string with high precision to avoid scientific notation
        let str = String(format: "%.20f", value)
        
        // Match pattern: 0.0+ followed by significant digits
        // Regex: ^0\.(\d+)
        guard let decimalSeparatorRange = str.range(of: ".") else {
            return String(format: "%.\(significantDigits)f", value)
        }
        
        let allDigits = String(str[decimalSeparatorRange.upperBound...])
        
        // Find leading zeros
        var zeroCount = 0
        for char in allDigits {
            if char == "0" {
                zeroCount += 1
            } else {
                break
            }
        }
        
        let zeros = String(repeating: "0", count: zeroCount)
        var significant = String(allDigits.dropFirst(zeroCount))
        
        // Round significant digits
        if significant.count > significantDigits {
             let index = significant.index(significant.startIndex, offsetBy: significantDigits + 1)
             let toRoundStr = significant.prefix(upTo: index)
             if let toRound = Int(String(toRoundStr)) {
                 let rounded = Int(round(Double(toRound) / 10.0))
                 significant = String(rounded)
                 // Pad start if rounding reduced digits (e.g. 05 -> 5, need 05? No, standard integer math)
                 // Actually padStart is to ensure we keep the length correct if we want fixed length.
                 // JS logic: significant = rounded.toString().padStart(significantDigits, "0")
                 while significant.count < significantDigits {
                     significant = "0" + significant
                 }
             }
        } else {
             // If fewer digits than significant, pad with 0? usually we just take what is there or pad.
             // But for tiny numbers often we have trailing noise or just ends.
             // JS logic didn't explicitly pad end, it handled length > significantDigits.
        }
        
        // Only use subscript if zero count meets threshold
        if zeroCount < minZeros {
            return "0.\(zeros)\(significant)"
        }
        
        // Subscript mapping
        let subscriptDigits: [Character: String] = [
            "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
            "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉"
        ]
        
        let subscriptCount = String(zeroCount).compactMap { subscriptDigits[$0] }.joined()
        
        return "0.0\(subscriptCount)\(significant)"
    }


    var candleLineWidth: CGFloat = 1

    var lineWidth: CGFloat = 1

    var paddingTop: CGFloat = 0

    var paddingRight: CGFloat = 0

    var paddingBottom: CGFloat = 0

    var mainFlex: CGFloat = 0

    var volumeFlex: CGFloat = 0

    var headerHeight: CGFloat = 20

    var increaseColor = UIColor.red

    var decreaseColor = UIColor.green

    var minuteLineColor = UIColor.blue

    var minuteVolumeCandleColor = UIColor.blue

    var targetColorList = [UIColor]()

    var minuteGradientColorList = [UIColor]()

    var minuteGradientLocationList = [CGFloat]()

    var fontFamily = ""

    var textColor = UIColor.white

    var headerTextFontSize: CGFloat = 10

    var rightTextFontSize: CGFloat = 10

    var candleTextFontSize: CGFloat = 10

    var candleTextColor = UIColor.orange

    var panelGradientColorList = [UIColor]()

    var panelGradientLocationList = [CGFloat]()

    var panelBackgroundColor = UIColor.orange

    var panelBorderColor = UIColor.orange

    // Crosshair center colors (black by default to be visible on light bg)
    var selectedPointContainerColor = UIColor.black

    var selectedPointContentColor = UIColor.black

    var panelMinWidth: CGFloat = 0

    var panelTextFontSize: CGFloat = 10

    var closePriceCenterSeparatorColor = UIColor.orange

    var closePriceCenterBackgroundColor = UIColor.orange

    var closePriceCenterBorderColor = UIColor.orange

    var closePriceCenterTriangleColor = UIColor.orange

    var closePriceRightSeparatorColor = UIColor.orange

    var closePriceRightBackgroundColor = UIColor.orange

    var closePriceRightLightLottieFloder = ""

    var closePriceRightLightLottieScale: CGFloat = 0.4

    var closePriceRightLightLottieSource = ""

    // Prediction / Live Analyst
    var rightOffsetCandles: Int = 0
    var predictionList = [[String: Any]]()
    var predictionEntryZones = [[String: Any]]()
    var predictionStartTime: Double? = nil
    var predictionEntry: Double? = nil
    var predictionStopLoss: Double? = nil
    var predictionBias: String? = nil
    var predictionMinCandles: Int = 20 // Minimum candles width for prediction zone

    // grid draw
    // Đậm rõ: màu đen, nét 1.2pt để dễ thấy
    var gridColor = UIColor.black

    // Mặc định 1.2pt để line rõ ràng trên light mode
    var gridLineWidth: CGFloat = 1.2

    var gridHorizontalLineCount: Int = 4

    var gridVerticalLineCount: Int = 4

    var gridEnabled: Bool = true


    // shot draw
    var shotBackgroundColor = UIColor.orange

    var drawShouldContinue = false

    var drawType = HTDrawType.none

    var shouldFixDraw = false

    var shouldClearDraw = false

    var drawColor = UIColor.orange

    var drawLineHeight: CGFloat = 0.5

    var drawDashWidth: CGFloat = 1

    var drawDashSpace: CGFloat = 1

    var drawIsLock = false

    var onDrawItemDidTouch: HTKLineDrawItemBlock?

    var onDrawItemComplete: HTKLineDrawItemBlock?

    var onDrawPointComplete: HTKLineDrawItemBlock?

    // -3 表示没有弹起任何弹窗, -2 表示弹起了画笔弹窗没有弹起 context 弹窗, -1 表示弹起了弹窗, 弹窗表示的是全局配置, 其他表示正常的 index
    var shouldReloadDrawItemIndex = -3

    var drawShouldTrash = false








    func createFont(_ size: CGFloat) -> UIFont {
        let font = UIFont(name: fontFamily, size: size)
        return font ?? UIFont.systemFont(ofSize: size)
    }



    var time = 1

    var isMinute: Bool {
        get {
            time == -1
        }
    }

    static func packColorList(_ value: Any?) -> [UIColor] {
        var colorList = [UIColor]()
        guard let itemList = value as? [Int] else {
            return colorList
        }
        for item in itemList {
            if let color = RCTConvert.uiColor(item) {
                colorList.append(color)
            }
        }
        return colorList
    }

    func packGradientColorList(_ valueList: [UIColor]) -> [CGFloat] {
        var colorList = [CGFloat]()
        let range = 0..<4
        var pointList = Array<UnsafeMutablePointer<CGFloat>>()
        for _ in range {
            let point = UnsafeMutablePointer<CGFloat>.allocate(capacity: 1)
            pointList.append(point)
        }
        for color in valueList {
            color.getRed(pointList[0], green: pointList[1], blue: pointList[2], alpha: pointList[3])
            for i in range {
                colorList.append(pointList[i].pointee)
            }
        }
        for i in range {
            pointList[i].deallocate()
        }
        return colorList
    }

    func reloadOptionList(_ optionList: [String: Any]) {
        if let modelList = optionList["modelArray"] as? [[String: Any]] {
            modelArray = HTKLineModel.packModelArray(modelList)
        }


        if let targetList = optionList["targetList"] as? [String: Any] {
            maList = HTKLineItemModel.packModelArray(targetList["maList"] as? [[String: Any]] ?? [])
            maVolumeList = HTKLineItemModel.packModelArray(targetList["maVolumeList"] as? [[String: Any]] ?? [])
            rsiList = HTKLineItemModel.packModelArray(targetList["rsiList"] as? [[String: Any]] ?? [])
            wrList = HTKLineItemModel.packModelArray(targetList["wrList"] as? [[String: Any]] ?? [])
            bollN = targetList["bollN"] as? String ?? ""
            bollP = targetList["bollP"] as? String ?? ""
            macdS = targetList["macdS"] as? String ?? ""
            macdL = targetList["macdL"] as? String ?? ""
            macdM = targetList["macdM"] as? String ?? ""
            kdjN = targetList["kdjN"] as? String ?? ""
            kdjM1 = targetList["kdjM1"] as? String ?? ""
            kdjM2 = targetList["kdjM2"] as? String ?? ""
        }

        if let drawList = optionList["drawList"] as? [String: Any] {
            self.shouldScrollToEnd = false
            if let shotBackgroundColorValue = drawList["shotBackgroundColor"] as? Int {
                self.shotBackgroundColor = RCTConvert.uiColor(shotBackgroundColorValue)
            }
            if let drawTypeValue = drawList["drawType"] as? Int, let drawType = HTDrawType.init(rawValue: drawTypeValue) {
                self.drawType = drawType
            }
            if let drawShouldContinue = drawList["drawShouldContinue"] as? Bool {
                self.drawShouldContinue = drawShouldContinue
            }
            if let shouldFixDraw = drawList["shouldFixDraw"] as? Bool {
                self.shouldFixDraw = shouldFixDraw
            }
            if let shouldClearDraw = drawList["shouldClearDraw"] as? Bool {
                self.shouldClearDraw = shouldClearDraw
            }
            if let drawColorValue = drawList["drawColor"] as? Int, let drawColor = RCTConvert.uiColor(drawColorValue) {
                self.drawColor = drawColor
            }
            if let drawLineHeight = drawList["drawLineHeight"] as? CGFloat {
                self.drawLineHeight = drawLineHeight
            }
            if let drawDashWidth = drawList["drawDashWidth"] as? CGFloat {
                self.drawDashWidth = drawDashWidth
            }
            if let drawDashSpace = drawList["drawDashSpace"] as? CGFloat {
                self.drawDashSpace = drawDashSpace
            }
            if let shouldReloadDrawItemIndex = drawList["shouldReloadDrawItemIndex"] as? Int {
                self.shouldReloadDrawItemIndex = shouldReloadDrawItemIndex
            }
            if let drawIsLock = drawList["drawIsLock"] as? Bool {
                self.drawIsLock = drawIsLock
            }
            if let drawShouldTrash = drawList["drawShouldTrash"] as? Bool {
                self.drawShouldTrash = drawShouldTrash
            }

        }

        if let shouldScrollToEnd = optionList["shouldScrollToEnd"] as? Bool {
            self.shouldScrollToEnd = shouldScrollToEnd
        }
        if shouldReloadDrawItemIndex >= HTDrawState.showPencil.rawValue {
            self.shouldScrollToEnd = false
        }



        guard let configList = optionList["configList"] as? [String: Any] else {
            return
        }
        primary = optionList["primary"] as? Int ?? -1
        second = optionList["second"] as? Int ?? -1
        time = optionList["time"] as? Int ?? -1
        price = optionList["price"] as? Int ?? -1
        volume = optionList["volume"] as? Int ?? -1

        _itemWidth = configList["itemWidth"] as? CGFloat ?? 0
        _candleWidth = configList["candleWidth"] as? CGFloat ?? 0
        _minuteVolumeCandleWidth = configList["minuteVolumeCandleWidth"] as? CGFloat ?? 0
        _macdCandleWidth = configList["macdCandleWidth"] as? CGFloat ?? 0
        reloadScrollViewScale(1)
        paddingTop = configList["paddingTop"] as? CGFloat ?? 0
        paddingRight = configList["paddingRight"] as? CGFloat ?? 0
        paddingBottom = configList["paddingBottom"] as? CGFloat ?? 0
        mainFlex = configList["mainFlex"] as? CGFloat ?? 0
        volumeFlex = configList["volumeFlex"] as? CGFloat ?? 0

        let colorList = configList["colorList"] as? [String: Any] ?? [String: Any]()
        increaseColor = RCTConvert.uiColor(colorList["increaseColor"])
        decreaseColor = RCTConvert.uiColor(colorList["decreaseColor"])
        minuteLineColor = RCTConvert.uiColor(configList["minuteLineColor"])
        targetColorList = type(of: self).packColorList(configList["targetColorList"])
        minuteGradientColorList = type(of: self).packColorList(configList["minuteGradientColorList"])
        minuteGradientLocationList = configList["minuteGradientLocationList"] as? [CGFloat] ?? [CGFloat]()
        minuteVolumeCandleColor = RCTConvert.uiColor(configList["minuteVolumeCandleColor"])
        fontFamily = configList["fontFamily"] as? String ?? ""
        textColor = RCTConvert.uiColor(configList["textColor"])
        headerTextFontSize = configList["headerTextFontSize"] as? CGFloat ?? 0
        rightTextFontSize = configList["rightTextFontSize"] as? CGFloat ?? 0
        candleTextFontSize = configList["candleTextFontSize"] as? CGFloat ?? 0
        candleTextColor = RCTConvert.uiColor(configList["candleTextColor"])
        panelGradientColorList = type(of: self).packColorList(configList["panelGradientColorList"])
        panelGradientLocationList = configList["panelGradientLocationList"] as? [CGFloat] ?? [CGFloat]()
        panelBackgroundColor = RCTConvert.uiColor(configList["panelBackgroundColor"])
        panelBorderColor = RCTConvert.uiColor(configList["panelBorderColor"])
        selectedPointContainerColor = RCTConvert.uiColor(configList["selectedPointContainerColor"])
        selectedPointContentColor = RCTConvert.uiColor(configList["selectedPointContentColor"])
        panelMinWidth = configList["panelMinWidth"] as? CGFloat ?? 0
        panelTextFontSize = configList["panelTextFontSize"] as? CGFloat ?? 0
        closePriceCenterSeparatorColor = RCTConvert.uiColor(configList["closePriceCenterSeparatorColor"])
        closePriceCenterBackgroundColor = RCTConvert.uiColor(configList["closePriceCenterBackgroundColor"])

        // Grid configuration
        if let gridColorValue = configList["gridColor"] as? Int {
            gridColor = RCTConvert.uiColor(gridColorValue)
        }
        gridLineWidth = configList["gridLineWidth"] as? CGFloat ?? 0.5
        gridHorizontalLineCount = configList["gridHorizontalLineCount"] as? Int ?? 4
        gridVerticalLineCount = configList["gridVerticalLineCount"] as? Int ?? 4
        gridEnabled = configList["gridEnabled"] as? Bool ?? true
        closePriceCenterBorderColor = RCTConvert.uiColor(configList["closePriceCenterBorderColor"])
        closePriceCenterTriangleColor = RCTConvert.uiColor(configList["closePriceCenterTriangleColor"])
        closePriceRightSeparatorColor = RCTConvert.uiColor(configList["closePriceRightSeparatorColor"])
        closePriceRightBackgroundColor = RCTConvert.uiColor(configList["closePriceRightBackgroundColor"])
        closePriceRightLightLottieFloder = configList["closePriceRightLightLottieFloder"] as? String ?? ""
        closePriceRightLightLottieScale = configList["closePriceRightLightLottieScale"] as? CGFloat ?? 0
        closePriceRightLightLottieSource = configList["closePriceRightLightLottieSource"] as? String ?? ""

        // Prediction / Live Analyst
        rightOffsetCandles = configList["rightOffsetCandles"] as? Int ?? 0
        if let predictions = optionList["predictionList"] as? [[String: Any]] {
            predictionList = predictions
        } else {
            predictionList = []
        }
        
        if let startTime = optionList["predictionStartTime"] as? Double {
            predictionStartTime = startTime
        } else {
            predictionStartTime = nil
        }
        
        predictionEntry = optionList["predictionEntry"] as? Double
        predictionStopLoss = optionList["predictionStopLoss"] as? Double
        predictionBias = optionList["predictionBias"] as? String
        
        if let entryZones = optionList["predictionEntryZones"] as? [[String: Any]] {
            predictionEntryZones = entryZones
        } else {
            predictionEntryZones = []
        }
        
        predictionMinCandles = optionList["predictionMinCandles"] as? Int ?? 20
    }

}
