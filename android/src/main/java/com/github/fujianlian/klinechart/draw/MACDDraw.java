package com.github.fujianlian.klinechart.draw;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.github.fujianlian.klinechart.HTKLineConfigManager;
import com.github.fujianlian.klinechart.BaseKLineChartView;
import com.github.fujianlian.klinechart.KLineEntity;
import com.github.fujianlian.klinechart.base.IChartDraw;
import com.github.fujianlian.klinechart.base.IValueFormatter;
import com.github.fujianlian.klinechart.entity.IMACD;
import com.github.fujianlian.klinechart.formatter.ValueFormatter;
import com.github.fujianlian.klinechart.utils.ViewUtil;

import java.util.ArrayList;
import java.util.List;


/**
 * macd实现类
 * Created by tifezh on 2016/6/19.
 */

public class MACDDraw implements IChartDraw<IMACD> {

    private Context mContext = null;

    private Paint mRedPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mGreenPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mDIFPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mDEAPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mMACDPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint primaryPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint levelGuidePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint labelTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint labelBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private static class LabelSpec {
        float y;
        String text;
        int color;
    }

    /**
     * macd 中柱子的宽度
     */
    private float mMACDWidth = 0;

    public MACDDraw(BaseKLineChartView view) {
        mContext = view.getContext();
        levelGuidePaint.setStyle(Paint.Style.STROKE);
        labelTextPaint.setColor(Color.WHITE);
        labelBgPaint.setStyle(Paint.Style.FILL);
    }

    public void reloadColor(BaseKLineChartView view) {
        mRedPaint.setColor(view.configManager.increaseColor);
        mGreenPaint.setColor(view.configManager.decreaseColor);
        // Some screens provide only 3 sub-indicator colors, so all lookups must be bounds-safe.
        mMACDPaint.setColor(safeTargetColor(view, 5));
        mDIFPaint.setColor(safeTargetColor(view, 0));
        mDEAPaint.setColor(safeTargetColor(view, 1));
    }

    @Override
    public void drawTranslated(@Nullable IMACD lastPoint, @NonNull IMACD curPoint, float lastX, float curX, @NonNull Canvas canvas, @NonNull BaseKLineChartView view, int position) {
        drawMACD(canvas, view, curX, curPoint.getMacd());
        view.drawChildLine(canvas, mDIFPaint, lastX, lastPoint.getDif(), curX, curPoint.getDif());
        view.drawChildLine(canvas, mDEAPaint, lastX, lastPoint.getDea(), curX, curPoint.getDea());
    }

    @Override
    public void drawText(@NonNull Canvas canvas, @NonNull BaseKLineChartView view, int position, float x, float y) {
        IMACD point = (IMACD) view.getItem(position);
        String text = String.format("MACD(%s,%s,%s)  ", new Object[]{view.configManager.macdS, view.configManager.macdL, view.configManager.macdM});
        canvas.drawText(text, x, y, view.getTextPaint());
        x += view.getTextPaint().measureText(text);
        StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.append("MACD:");
        stringBuilder.append(view.formatValue(point.getMacd()));
        String str = "  ";
        stringBuilder.append(str);
        text = stringBuilder.toString();

        canvas.drawText(text, x, y, this.mMACDPaint);
        x += this.mMACDPaint.measureText(text);
        stringBuilder = new StringBuilder();
        stringBuilder.append("DIF:");
        stringBuilder.append(view.formatValue(point.getDif()));
        stringBuilder.append(str);
        text = stringBuilder.toString();
        canvas.drawText(text, x, y, this.mDIFPaint);
        x += this.mDIFPaint.measureText(text);
        stringBuilder = new StringBuilder();
        stringBuilder.append("DEA:");
        stringBuilder.append(view.formatValue(point.getDea()));
        canvas.drawText(stringBuilder.toString(),  x, y, this.mDEAPaint);
    }

    @Override
    public float getMaxValue(IMACD point) {
        return Math.max(point.getMacd(), Math.max(point.getDea(), point.getDif()));
    }

    @Override
    public float getMinValue(IMACD point) {
        return Math.min(point.getMacd(), Math.min(point.getDea(), point.getDif()));
    }

    @Override
    public IValueFormatter getValueFormatter() {
        return new ValueFormatter();
    }

    public void drawLevelOverlays(@NonNull Canvas canvas, @NonNull BaseKLineChartView view) {
        if (!"line_labels".equals(view.configManager.macdStyle)) {
            return;
        }
        if (view.configManager.secondStatus != SecondStatus.MACD) {
            return;
        }
        Rect childRect = view.getChildRect();
        if (childRect == null || childRect.height() <= 0) {
            return;
        }
        int stopIndex = view.getVisibleStopIndex();
        if (stopIndex < 0 || stopIndex >= view.configManager.modelArray.size()) {
            return;
        }
        KLineEntity point = view.getItem(stopIndex);
        List<LabelSpec> labels = new ArrayList<>();
        String macdLabel = resolveLineLabel(view.configManager.macdLineLabels, "macd", "MACD");
        String signalLabel = resolveLineLabel(view.configManager.macdLineLabels, "signal", "Signal");
        String histogramLabel = resolveLineLabel(view.configManager.macdLineLabels, "histogram", "Histogram");

        addOverlay(labels, canvas, view, point.dif, macdLabel, safeTargetColor(view, 0), true);
        addOverlay(labels, canvas, view, point.dea, signalLabel, safeTargetColor(view, 1), true);
        int histogramColor = point.macd >= 0 ? view.configManager.increaseColor : view.configManager.decreaseColor;
        addOverlay(labels, canvas, view, point.macd, histogramLabel, histogramColor, true);

        if (labels.isEmpty()) {
            return;
        }
        drawRightLabels(canvas, view, labels);
    }

    /**
     * 画macd
     *
     * @param canvas
     * @param x
     * @param macd
     */
    private void drawMACD(Canvas canvas, BaseKLineChartView view, float x, float macd) {
        float macdy = view.getChildY(macd);
        float candleWidth = view.configManager.macdCandleWidth;
        float r = candleWidth / 2;
        float zeroy = view.getChildY(0);
        if (macd > 0) {
            //               left   top   right  bottom
            canvas.drawRect(x - r, macdy, x + r, zeroy, mRedPaint);
        } else {
            canvas.drawRect(x - r, zeroy, x + r, macdy, mGreenPaint);
        }
    }

    /**
     * 设置DIF颜色
     */
    public void setDIFColor(int color) {
        this.mDIFPaint.setColor(color);
    }

    /**
     * 设置DEA颜色
     */
    public void setDEAColor(int color) {
        this.mDEAPaint.setColor(color);
    }

    /**
     * 设置MACD颜色
     */
    public void setMACDColor(int color) {
        this.mMACDPaint.setColor(color);
    }

    /**
     * 设置MACD的宽度
     *
     * @param MACDWidth
     */
    public void setMACDWidth(float MACDWidth) {
        mMACDWidth = MACDWidth;
    }

    /**
     * 设置曲线宽度
     */
    public void setLineWidth(float width) {
        mDEAPaint.setStrokeWidth(width);
        mDIFPaint.setStrokeWidth(width);
        mMACDPaint.setStrokeWidth(width);
    }

    /**
     * 设置文字大小
     */
    public void setTextSize(float textSize) {
        mDEAPaint.setTextSize(textSize);
        mDIFPaint.setTextSize(textSize);
        mMACDPaint.setTextSize(textSize);
    }

    public void setTextFontFamily(String fontFamily) {
        Typeface typeface = HTKLineConfigManager.findFont(mContext, fontFamily);
        mRedPaint.setTypeface(typeface);
        mGreenPaint.setTypeface(typeface);
        mDIFPaint.setTypeface(typeface);
        mDEAPaint.setTypeface(typeface);
        mMACDPaint.setTypeface(typeface);
        primaryPaint.setTypeface(typeface);
    }

    private void addOverlay(
            @NonNull List<LabelSpec> labels,
            @NonNull Canvas canvas,
            @NonNull BaseKLineChartView view,
            float value,
            @NonNull String name,
            int color,
            boolean dashed
    ) {
        if (Float.isNaN(value) || Float.isInfinite(value)) {
            return;
        }
        float y = clampToChild(view, view.getChildY(value));
        levelGuidePaint.setColor(withAlpha(color, 150));
        levelGuidePaint.setStrokeWidth(ViewUtil.Dp2Px(mContext, 0.9f));
        if (dashed) {
            levelGuidePaint.setPathEffect(new DashPathEffect(new float[]{10f, 6f}, 0));
        } else {
            levelGuidePaint.setPathEffect(null);
        }
        canvas.drawLine(0f, y, view.getWidth(), y, levelGuidePaint);
        levelGuidePaint.setPathEffect(null);

        LabelSpec label = new LabelSpec();
        label.y = y;
        label.color = color;
        label.text = formatOverlayText(name, view.formatValue(value));
        labels.add(label);
    }

    private String formatOverlayText(@NonNull String name, @NonNull String valueText) {
        String normalized = name.trim();
        if (normalized.isEmpty()) {
            return valueText;
        }
        return normalized + " " + valueText;
    }

    private String resolveLineLabel(
            @Nullable java.util.Map<String, Object> labels,
            @NonNull String key,
            @NonNull String fallback
    ) {
        if (labels == null) {
            return fallback;
        }
        Object value = labels.get(key);
        if (value instanceof String) {
            return (String) value;
        }
        return fallback;
    }

    private void drawRightLabels(
            @NonNull Canvas canvas,
            @NonNull BaseKLineChartView view,
            @NonNull List<LabelSpec> labels
    ) {
        int count = labels.size();
        Integer[] order = new Integer[count];
        for (int i = 0; i < count; i++) {
            order[i] = i;
        }
        java.util.Arrays.sort(order, (a, b) -> Float.compare(labels.get(a).y, labels.get(b).y));

        float fontSize = Math.max(ViewUtil.Dp2Px(mContext, 10f), view.configManager.rightTextFontSize);
        labelTextPaint.setTextSize(fontSize);
        Paint.FontMetrics fm = labelTextPaint.getFontMetrics();
        float textHeight = fm.descent - fm.ascent;
        float paddingX = ViewUtil.Dp2Px(mContext, 6f);
        float paddingY = ViewUtil.Dp2Px(mContext, 3f);
        float labelHeight = textHeight + paddingY * 2f;
        float gap = ViewUtil.Dp2Px(mContext, 4f);

        Rect childRect = view.getChildRect();
        if (childRect == null) {
            return;
        }
        float minTop = childRect.top + ViewUtil.Dp2Px(mContext, 2f);
        float maxTop = childRect.bottom - labelHeight - ViewUtil.Dp2Px(mContext, 2f);
        if (maxTop < minTop) {
            return;
        }

        float[] topByIndex = new float[count];
        float previousBottom = minTop - gap;
        for (int orderedIndex : order) {
            float rawTop = labels.get(orderedIndex).y - labelHeight / 2f;
            float top = Math.max(minTop, Math.min(maxTop, rawTop));
            if (top < previousBottom + gap) {
                top = previousBottom + gap;
            }
            top = Math.min(maxTop, top);
            topByIndex[orderedIndex] = top;
            previousBottom = top + labelHeight;
        }

        float rightInset = ViewUtil.Dp2Px(mContext, 4f);
        for (int i = 0; i < count; i++) {
            LabelSpec label = labels.get(i);
            float textWidth = labelTextPaint.measureText(label.text);
            float width = textWidth + paddingX * 2f;
            float left = view.getWidth() - rightInset - width;
            float top = topByIndex[i];
            RectF rect = new RectF(left, top, left + width, top + labelHeight);
            labelBgPaint.setColor(label.color);
            canvas.drawRoundRect(rect, ViewUtil.Dp2Px(mContext, 3f), ViewUtil.Dp2Px(mContext, 3f), labelBgPaint);
            float textBaseline = top + paddingY - fm.ascent;
            canvas.drawText(label.text, left + paddingX, textBaseline, labelTextPaint);
        }
    }

    private float clampToChild(@NonNull BaseKLineChartView view, float value) {
        Rect child = view.getChildRect();
        if (child == null) {
            return value;
        }
        return Math.max(child.top, Math.min(child.bottom, value));
    }

    private int safeTargetColor(BaseKLineChartView view, int index) {
        int[] list = view.configManager.targetColorList;
        if (index >= 0 && index < list.length) {
            return list[index];
        }
        return view.configManager.textColor;
    }

    private int withAlpha(int color, int alpha) {
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color));
    }

}
