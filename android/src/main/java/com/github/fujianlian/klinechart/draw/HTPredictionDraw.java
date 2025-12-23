package com.github.fujianlian.klinechart.draw;

import android.graphics.*;
import androidx.annotation.NonNull;
import com.github.fujianlian.klinechart.BaseKLineChartView;
import com.github.fujianlian.klinechart.container.HTKLineContainerView;

import java.util.List;
import java.util.Map;

/**
 * Price Prediction Drawing (Confidence Cone + Mean Line + Levels)
 * Draws prediction overlay UNDER candles
 */
public class HTPredictionDraw {

    private static final String TAG = "HTPredictionDraw";

    // Paint objects for drawing
    private static final Paint conePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private static final Paint meanLinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private static final Paint levelLinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private static final Paint levelTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    static {
        // Configure cone paint (semi-transparent fill)
        conePaint.setStyle(Paint.Style.FILL);
        conePaint.setColor(Color.parseColor("#3018A0FB")); // 18% opacity blue
        
        // Configure mean line paint (dashed line)
        meanLinePaint.setStyle(Paint.Style.STROKE);
        meanLinePaint.setStrokeWidth(2f);
        meanLinePaint.setColor(Color.parseColor("#FF18A0FB")); // Solid blue
        meanLinePaint.setPathEffect(new DashPathEffect(new float[]{10f, 5f}, 0));
        
        // Configure level line paint
        levelLinePaint.setStyle(Paint.Style.STROKE);
        levelLinePaint.setStrokeWidth(1.5f);
        levelLinePaint.setPathEffect(new DashPathEffect(new float[]{8f, 4f}, 0));
        
        // Configure level text paint
        levelTextPaint.setStyle(Paint.Style.FILL);
        levelTextPaint.setTextSize(24f);
        levelTextPaint.setColor(Color.WHITE);
    }

    /**
     * Draw prediction overlay on the chart
     * Called from main draw cycle BEFORE candles are drawn
     */
    public static void drawPrediction(@NonNull Canvas canvas, @NonNull HTKLineContainerView container, @NonNull BaseKLineChartView view) {
        Map predictionData = container.getPredictionData();
        int anchorIndex = container.getPredictionAnchorIndex();
        
        if (predictionData == null || anchorIndex < 0) {
            return; // No prediction to draw
        }

        try {
            // Extract prediction components
            List<Map> bands = (List<Map>) predictionData.get("bands");
            List<Map> points = (List<Map>) predictionData.get("points");
            List<Map> levels = (List<Map>) predictionData.get("levels");
            
            if (bands != null && !bands.isEmpty()) {
                drawConfidenceCone(canvas, view, bands, anchorIndex);
            }
            
            if (points != null && !points.isEmpty()) {
                drawMeanLine(canvas, view, points, anchorIndex);
            }
            
            if (levels != null && !levels.isEmpty()) {
                drawLevels(canvas, view, levels);
            }
            
        } catch (Exception e) {
            android.util.Log.e(TAG, "Error drawing prediction", e);
        }
    }

    /**
     * Draw confidence cone bands (semi-transparent filled areas)
     */
    private static void drawConfidenceCone(@NonNull Canvas canvas, @NonNull BaseKLineChartView view, 
                                           @NonNull List<Map> bands, int anchorIndex) {
        for (Map band : bands) {
            Number startOffsetNum = (Number) band.get("startOffset");
            Number endOffsetNum = (Number) band.get("endOffset");
            Number bottomNum = (Number) band.get("bottom");
            Number topNum = (Number) band.get("top");
            
            if (startOffsetNum == null || endOffsetNum == null || bottomNum == null || topNum == null) {
                continue;
            }
            
            int startOffset = startOffsetNum.intValue();
            int endOffset = endOffsetNum.intValue();
            float bottom = bottomNum.floatValue();
            float top = topNum.floatValue();
            
            // Map virtual indices to actual candle indices
            int startIndex = anchorIndex + startOffset;
            int endIndex = anchorIndex + endOffset;
            
            // Get screen coordinates
            float startX = view.getItemMiddleScrollX(startIndex);
            float endX = view.getItemMiddleScrollX(endIndex);
            float bottomY = view.yFromValue(bottom);
            float topY = view.yFromValue(top);
            
            // Draw filled rectangle for this band segment
            Path path = new Path();
            path.moveTo(startX, bottomY);
            path.lineTo(startX, topY);
            path.lineTo(endX, topY);
            path.lineTo(endX, bottomY);
            path.close();
            
            canvas.drawPath(path, conePaint);
        }
    }

    /**
     * Draw dashed mean line through prediction points
     */
    private static void drawMeanLine(@NonNull Canvas canvas, @NonNull BaseKLineChartView view,
                                     @NonNull List<Map> points, int anchorIndex) {
        Path path = new Path();
        boolean firstPoint = true;
        
        for (Map point : points) {
            Number offsetNum = (Number) point.get("offset");
            Number priceNum = (Number) point.get("price");
            
            if (offsetNum == null || priceNum == null) {
                continue;
            }
            
            int offset = offsetNum.intValue();
            float price = priceNum.floatValue();
            
            // Map virtual index to actual candle index
            int index = anchorIndex + offset;
            
            // Get screen coordinates
            float x = view.getItemMiddleScrollX(index);
            float y = view.yFromValue(price);
            
            if (firstPoint) {
                path.moveTo(x, y);
                firstPoint = false;
            } else {
                path.lineTo(x, y);
            }
        }
        
        canvas.drawPath(path, meanLinePaint);
    }

    /**
     * Draw horizontal level lines (SL, TP1, TP2, ENTRY, etc.)
     */
    private static void drawLevels(@NonNull Canvas canvas, @NonNull BaseKLineChartView view,
                                   @NonNull List<Map> levels) {
        float chartWidth = view.getChartWidth();
        
        for (Map level : levels) {
            String type = (String) level.get("type");
            Number priceNum = (Number) level.get("price");
            String label = (String) level.get("label");
            
            if (priceNum == null) {
                continue;
            }
            
            float price = priceNum.floatValue();
            float y = view.yFromValue(price);
            
            // Set color based on level type
            int color = getLevelColor(type);
            levelLinePaint.setColor(color);
            levelTextPaint.setColor(color);
            
            // Draw horizontal line across chart
            canvas.drawLine(0, y, chartWidth, y, levelLinePaint);
            
            // Draw label on the right side
            if (label != null && !label.isEmpty()) {
                float textWidth = levelTextPaint.measureText(label);
                canvas.drawText(label, chartWidth - textWidth - 10, y - 5, levelTextPaint);
            }
        }
    }

    /**
     * Get color for level type
     */
    private static int getLevelColor(String type) {
        if (type == null) return Color.GRAY;
        
        switch (type) {
            case "SL":
                return Color.parseColor("#FFFF4444"); // Red for stop loss
            case "TP1":
            case "TP2":
            case "TP3":
                return Color.parseColor("#FF4CAF50"); // Green for take profit
            case "ENTRY":
                return Color.parseColor("#FFFFC107"); // Amber for entry
            case "SUP":
                return Color.parseColor("#FF2196F3"); // Blue for support
            case "RES":
                return Color.parseColor("#FFFF9800"); // Orange for resistance
            default:
                return Color.GRAY;
        }
    }

    /**
     * Calculate min/max price bounds including prediction
     * Used for Y-axis rescaling
     */
    public static float[] getPredictionBounds(Map predictionData) {
        if (predictionData == null) {
            return null;
        }
        
        float min = Float.MAX_VALUE;
        float max = Float.MIN_VALUE;
        
        try {
            // Check bands
            List<Map> bands = (List<Map>) predictionData.get("bands");
            if (bands != null) {
                for (Map band : bands) {
                    Number bottom = (Number) band.get("bottom");
                    Number top = (Number) band.get("top");
                    if (bottom != null) min = Math.min(min, bottom.floatValue());
                    if (top != null) max = Math.max(max, top.floatValue());
                }
            }
            
            // Check points
            List<Map> points = (List<Map>) predictionData.get("points");
            if (points != null) {
                for (Map point : points) {
                    Number price = (Number) point.get("price");
                    if (price != null) {
                        float p = price.floatValue();
                        min = Math.min(min, p);
                        max = Math.max(max, p);
                    }
                }
            }
            
            // Check levels
            List<Map> levels = (List<Map>) predictionData.get("levels");
            if (levels != null) {
                for (Map level : levels) {
                    Number price = (Number) level.get("price");
                    if (price != null) {
                        float p = price.floatValue();
                        min = Math.min(min, p);
                        max = Math.max(max, p);
                    }
                }
            }
            
            if (min < Float.MAX_VALUE && max > Float.MIN_VALUE) {
                return new float[]{min, max};
            }
        } catch (Exception e) {
            android.util.Log.e(TAG, "Error calculating prediction bounds", e);
        }
        
        return null;
    }
}
