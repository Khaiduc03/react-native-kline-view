package com.github.fujianlian.klinechart.formatter;

import android.os.Build;
import com.github.fujianlian.klinechart.base.IValueFormatter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.NumberFormat;

/**
 * Value格式化类
 * Created by tifezh on 2016/6/21.
 */

public class ValueFormatter implements IValueFormatter {

    public static Integer priceRightLength = 4;

    public static Integer volumeRightLength = 4;

    @Override
    public String format(float value) {
        return this._format(value, true, true);
    }

    public String formatVolume(float value) {
        return this._format(value, false, true);
    }

    public static String format(float value, int rightLength, boolean fillzero) {
    	// NumberFormat format = NumberFormat.getInstance();
     //    format.setGroupingUsed(false);
     //    format.setRoundingMode(RoundingMode.DOWN);
     //    format.setMaximumFractionDigits(rightLength);
     //    if (fillzero) {
     //    	format.setMinimumFractionDigits(rightLength);
     //    }
     //    return format.format(value);


        String numberString = String.valueOf(value);
        numberString = new BigDecimal(numberString).toPlainString();
        int dotIndex = numberString.indexOf(".");
        if (dotIndex == -1) {
            numberString = numberString + ".";
            dotIndex = numberString.length() - 1;
        }
        int reloadLength = dotIndex + 1 + rightLength;
        if (numberString.length() < reloadLength) {
            numberString += String.format("%0" + (reloadLength - numberString.length()) + "d", 0);
        }
        numberString = numberString.substring(0, rightLength > 0 ? reloadLength : reloadLength - 1);
        return numberString;
    }

    public String _format(float value, boolean isPrice, boolean fillzero) {
        // Price logic: custom logic for tiny/large numbers
        if (isPrice) {
            return formatPrice(value);
        }

        // Volume (and others): legacy logic
        Integer rightLength = this.volumeRightLength; // Fixed: was using class field directly in mixed context? No, just standard logic
        return format(value, rightLength, fillzero);
    }

    private String formatPrice(float value) {
        if (value == 0) {
            return "0.00";
        }

        float absValue = Math.abs(value);

        // 1. Tiny numbers (< 1)
        if (absValue < 1 && absValue > 0) {
            String formatted = formatTinyNumber(absValue, 4, 4); // Default minZeros=4, sigDigits=4 from requirements
            return value < 0 ? "-$" + formatted : "$" + formatted;
        }

        // 2. Large numbers (>= 1,000,000)
        if (absValue >= 1000000) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                android.icu.text.CompactDecimalFormat compactDecimalFormat =
                        android.icu.text.CompactDecimalFormat.getInstance(
                                java.util.Locale.US,
                                android.icu.text.CompactDecimalFormat.CompactStyle.SHORT
                        );
                compactDecimalFormat.setMaximumFractionDigits(2);
                compactDecimalFormat.setMinimumFractionDigits(2);
                return compactDecimalFormat.format(value);
            } else {
                // Fallback for extremely old devices if sdk < 24 (though project min is 24)
                return String.format(java.util.Locale.US, "%.2fM", value / 1000000);
            }
        }

        // 3. Standard numbers
        int significantDigits = 4;
        NumberFormat format = NumberFormat.getInstance(java.util.Locale.US);
        format.setMinimumFractionDigits(2);
        format.setMaximumFractionDigits(value > 100 ? 2 : significantDigits);
        format.setGroupingUsed(true); // Add commas

        String priceString = format.format(Math.abs(value));
        return value < 0 ? "-$" + priceString : "$" + priceString;
    }

    private String formatTinyNumber(float value, int minZeros, int significantDigits) {
        // Convert to plain string to avoid scientific notation
        BigDecimal bd = new BigDecimal(String.valueOf(value));
        String str = bd.toPlainString();

        // Match pattern: 0.0+ followed by digits
        if (!str.contains(".")) {
             return String.format(java.util.Locale.US, "%." + significantDigits + "f", value);
        }

        int dotIndex = str.indexOf(".");
        String allDigits = str.substring(dotIndex + 1);

        // Count zeros
        int zeroCount = 0;
        for (int i = 0; i < allDigits.length(); i++) {
            if (allDigits.charAt(i) == '0') {
                zeroCount++;
            } else {
                break;
            }
        }

        String zeros = allDigits.substring(0, zeroCount);
        String significant = allDigits.substring(zeroCount);

        // Round significant digits
        if (significant.length() > significantDigits) {
            String toRoundStr = significant.substring(0, significantDigits + 1);
             long toRound = Long.parseLong(toRoundStr);
             long rounded = Math.round(toRound / 10.0);
             significant = String.valueOf(rounded);
             // Pad start if needed?
             while (significant.length() < significantDigits) {
                 significant = "0" + significant;
             }
        }

        // Check threshold
        if (zeroCount < minZeros) {
            return "0." + zeros + significant;
        }

        // Subscript mapping
        String[] subscripts = {"₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"};
        StringBuilder subscriptCount = new StringBuilder();
        String countStr = String.valueOf(zeroCount);
        for (int i = 0; i < countStr.length(); i++) {
            int digit = Character.getNumericValue(countStr.charAt(i));
            if (digit >= 0 && digit <= 9) {
                subscriptCount.append(subscripts[digit]);
            }
        }

        return "0.0" + subscriptCount.toString() + significant;
    }

}
