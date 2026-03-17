package com.github.fujianlian.klinechart.draw;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.github.fujianlian.klinechart.BaseKLineChartView;
import com.github.fujianlian.klinechart.BuildConfig;
import com.github.fujianlian.klinechart.HTKLineConfigManager;
import com.github.fujianlian.klinechart.HTKLineTargetItem;
import com.github.fujianlian.klinechart.KLineEntity;
import com.github.fujianlian.klinechart.base.IChartDraw;
import com.github.fujianlian.klinechart.base.IValueFormatter;
import com.github.fujianlian.klinechart.entity.IRSI;
import com.github.fujianlian.klinechart.formatter.ValueFormatter;
import com.github.fujianlian.klinechart.utils.ViewUtil;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * RSI draw implementation.
 */
public class RSIDraw implements IChartDraw<IRSI> {
    private static final String TAG = "RNKLineView.RSIDraw";
    private static final String RSI_AXIS_FIXED = "fixed_0_100";
    private static final String RSI_AXIS_INCLUDE_LEVELS = "adaptive_include_levels";

    private final Context mContext;
    private final BaseKLineChartView mView;

    private final Paint mRSI1Paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint mRSI2Paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint mRSI3Paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint primaryPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private final Paint levelGuidePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint labelTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint labelBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private static class RsiLevelSpec {
        float value;
        String label;
        int color;
        boolean dashed;
        boolean showRightTag;
        boolean showGuideLine;
    }

    private static class LabelSpec {
        float y;
        String text;
        int color;
    }

    public RSIDraw(BaseKLineChartView view) {
        mContext = view.getContext();
        mView = view;
        levelGuidePaint.setStyle(Paint.Style.STROKE);
        labelTextPaint.setColor(Color.WHITE);
        labelBgPaint.setStyle(Paint.Style.FILL);
    }

    @Override
    public void drawTranslated(
            @Nullable IRSI lastPoint,
            @NonNull IRSI curPoint,
            float lastX,
            float curX,
            @NonNull Canvas canvas,
            @NonNull BaseKLineChartView view,
            int position
    ) {
        if (lastPoint == null) {
            return;
        }
        KLineEntity lastItem = (KLineEntity) lastPoint;
        KLineEntity currentItem = (KLineEntity) curPoint;
        for (int i = 0; i < view.configManager.rsiList.size(); i++) {
            HTKLineTargetItem configItem = (HTKLineTargetItem) view.configManager.rsiList.get(i);
            HTKLineTargetItem currentTargetItem = safeTargetItem(currentItem.rsiList, configItem.index, "drawTranslated.current");
            HTKLineTargetItem lastTargetItem = safeTargetItem(lastItem.rsiList, configItem.index, "drawTranslated.last");
            if (currentTargetItem == null || lastTargetItem == null) {
                continue;
            }
            primaryPaint.setColor(safeTargetColor(view, configItem.index));
            view.drawChildLine(canvas, primaryPaint, lastX, lastTargetItem.value, curX, currentTargetItem.value);
        }
    }

    @Override
    public void drawText(@NonNull Canvas canvas, @NonNull BaseKLineChartView view, int position, float x, float y) {
        KLineEntity point = (KLineEntity) view.getItem(position);
        for (int i = 0; i < view.configManager.rsiList.size(); i++) {
            HTKLineTargetItem configItem = (HTKLineTargetItem) view.configManager.rsiList.get(i);
            HTKLineTargetItem targetItem = safeTargetItem(point.rsiList, configItem.index, "drawText");
            if (targetItem == null) {
                continue;
            }
            this.primaryPaint.setColor(safeTargetColor(view, configItem.index));
            String text = "RSI(" + targetItem.title + "):" + view.formatValue(targetItem.value) + "  ";
            canvas.drawText(text, x, y, this.primaryPaint);
            x += this.primaryPaint.measureText(text);
        }
    }

    public void drawLevelOverlays(@NonNull Canvas canvas, @NonNull BaseKLineChartView view) {
        if (!shouldDrawLineLabels(view)) {
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
        List<RsiLevelSpec> levels = resolveLevelSpecs(view);
        drawLevelGuideLines(canvas, view, levels);

        List<LabelSpec> labels = new ArrayList<>();
        for (RsiLevelSpec level : levels) {
            if (!level.showRightTag) {
                continue;
            }
            LabelSpec label = new LabelSpec();
            label.y = clampToChild(view, view.getChildY(level.value));
            label.color = level.color;
            label.text = level.label + " " + view.formatValue(level.value);
            labels.add(label);
        }

        LabelSpec current = resolveCurrentTagLabel(view, point);
        if (current != null) {
            labels.add(current);
            levelGuidePaint.setColor(withAlpha(current.color, 150));
            levelGuidePaint.setStrokeWidth(ViewUtil.Dp2Px(mContext, 0.9f));
            levelGuidePaint.setPathEffect(new DashPathEffect(new float[]{8f, 6f}, 0));
            canvas.drawLine(0f, current.y, view.getWidth(), current.y, levelGuidePaint);
            levelGuidePaint.setPathEffect(null);
        }
        if (labels.isEmpty()) {
            return;
        }
        drawRightLabels(canvas, view, labels);
    }

    @Override
    public float getMaxValue(IRSI point) {
        String axisMode = mView.configManager.rsiAxisMode;
        if (RSI_AXIS_FIXED.equals(axisMode)) {
            return 100f;
        }
        KLineEntity item = (KLineEntity) point;
        float max = item.targetListISMax(item.rsiList, true);
        if (RSI_AXIS_INCLUDE_LEVELS.equals(axisMode)) {
            max = Math.max(max, configuredLevelExtreme(true));
        }
        return max;
    }

    @Override
    public float getMinValue(IRSI point) {
        String axisMode = mView.configManager.rsiAxisMode;
        if (RSI_AXIS_FIXED.equals(axisMode)) {
            return 0f;
        }
        KLineEntity item = (KLineEntity) point;
        float min = item.targetListISMax(item.rsiList, false);
        if (RSI_AXIS_INCLUDE_LEVELS.equals(axisMode)) {
            min = Math.min(min, configuredLevelExtreme(false));
        }
        return min;
    }

    @Override
    public IValueFormatter getValueFormatter() {
        return new ValueFormatter();
    }

    public void setRSI1Color(int color) {
        mRSI1Paint.setColor(color);
    }

    public void setRSI2Color(int color) {
        mRSI2Paint.setColor(color);
    }

    public void setRSI3Color(int color) {
        mRSI3Paint.setColor(color);
    }

    public void setLineWidth(float width) {
        mRSI1Paint.setStrokeWidth(width);
        mRSI2Paint.setStrokeWidth(width);
        mRSI3Paint.setStrokeWidth(width);
        primaryPaint.setStrokeWidth(width);
    }

    public void setTextSize(float textSize) {
        mRSI2Paint.setTextSize(textSize);
        mRSI3Paint.setTextSize(textSize);
        mRSI1Paint.setTextSize(textSize);
        primaryPaint.setTextSize(textSize);
    }

    public void setTextFontFamily(String fontFamily) {
        Typeface typeface = HTKLineConfigManager.findFont(mContext, fontFamily);
        mRSI2Paint.setTypeface(typeface);
        mRSI1Paint.setTypeface(typeface);
        mRSI3Paint.setTypeface(typeface);
        primaryPaint.setTypeface(typeface);
    }

    private boolean shouldDrawLineLabels(@NonNull BaseKLineChartView view) {
        if (view.configManager.secondStatus != SecondStatus.RSI) {
            return false;
        }
        return "line_labels".equals(view.configManager.rsiStyle);
    }

    private float configuredLevelExtreme(boolean isMax) {
        float max = Float.MIN_VALUE;
        float min = Float.MAX_VALUE;
        for (RsiLevelSpec level : resolveLevelSpecs(mView)) {
            max = Math.max(max, level.value);
            min = Math.min(min, level.value);
        }
        if (isMax) {
            return max == Float.MIN_VALUE ? 100f : max;
        }
        return min == Float.MAX_VALUE ? 0f : min;
    }

    private List<RsiLevelSpec> resolveLevelSpecs(@NonNull BaseKLineChartView view) {
        List<RsiLevelSpec> output = new ArrayList<>();
        List<Map<String, Object>> raw = view.configManager.rsiLevels;
        if (raw == null) {
            return output;
        }
        for (Map<String, Object> level : raw) {
            if (level == null) {
                continue;
            }
            Object valueObj = level.get("value");
            if (!(valueObj instanceof Number)) {
                continue;
            }
            float value = ((Number) valueObj).floatValue();
            if (Float.isNaN(value) || Float.isInfinite(value)) {
                continue;
            }
            RsiLevelSpec spec = new RsiLevelSpec();
            spec.value = value;
            Object labelObj = level.get("label");
            spec.label = labelObj instanceof String && ((String) labelObj).trim().length() > 0
                    ? ((String) labelObj).trim()
                    : defaultLevelLabel(value);
            Object colorObj = level.get("color");
            spec.color = colorObj instanceof Number
                    ? ((Number) colorObj).intValue()
                    : defaultLevelColor(value);
            spec.dashed = readBoolean(level, "dashed", true);
            spec.showRightTag = readBoolean(level, "showRightTag", true);
            spec.showGuideLine = readBoolean(level, "showGuideLine", true);
            output.add(spec);
        }
        return output;
    }

    private void drawLevelGuideLines(
            @NonNull Canvas canvas,
            @NonNull BaseKLineChartView view,
            @NonNull List<RsiLevelSpec> levels
    ) {
        for (RsiLevelSpec level : levels) {
            if (!level.showGuideLine) {
                continue;
            }
            float y = clampToChild(view, view.getChildY(level.value));
            levelGuidePaint.setColor(withAlpha(level.color, 150));
            levelGuidePaint.setStrokeWidth(ViewUtil.Dp2Px(mContext, 0.9f));
            if (level.dashed) {
                levelGuidePaint.setPathEffect(new DashPathEffect(new float[]{10f, 6f}, 0));
            } else {
                levelGuidePaint.setPathEffect(null);
            }
            canvas.drawLine(0f, y, view.getWidth(), y, levelGuidePaint);
            levelGuidePaint.setPathEffect(null);
        }
    }

    private LabelSpec resolveCurrentTagLabel(@NonNull BaseKLineChartView view, @NonNull KLineEntity point) {
        Map<String, Object> raw = view.configManager.rsiCurrentTag;
        if (raw == null || !readBoolean(raw, "enabled", false)) {
            return null;
        }
        int configuredPeriod = toInt(raw.get("period"), -1);
        HTKLineTargetItem found = null;
        if (point.rsiList != null) {
            if (configuredPeriod > 0) {
                for (HTKLineTargetItem item : point.rsiList) {
                    int period = parsePeriod(item == null ? null : item.title, -1);
                    if (period == configuredPeriod) {
                        found = item;
                        break;
                    }
                }
            }
            if (found == null && !point.rsiList.isEmpty()) {
                found = point.rsiList.get(0);
            }
        }
        if (found == null) {
            return null;
        }
        float value = found.value;
        if (Float.isNaN(value) || Float.isInfinite(value)) {
            return null;
        }
        LabelSpec label = new LabelSpec();
        label.y = clampToChild(view, view.getChildY(value));
        Object colorObj = raw.get("color");
        label.color = colorObj instanceof Number
                ? ((Number) colorObj).intValue()
                : safeTargetColor(view, 0);
        Object labelObj = raw.get("label");
        String labelTitle = labelObj instanceof String && ((String) labelObj).trim().length() > 0
                ? ((String) labelObj).trim()
                : "RSI (" + (configuredPeriod > 0 ? configuredPeriod : parsePeriod(found.title, 14)) + ")";
        label.text = labelTitle + " " + view.formatValue(value);
        return label;
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
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "Invalid targetColor index=" + index + ", count=" + list.length);
        }
        return view.configManager.textColor;
    }

    private HTKLineTargetItem safeTargetItem(List<HTKLineTargetItem> list, int index, String owner) {
        if (list == null) {
            if (BuildConfig.DEBUG) {
                Log.d(TAG, owner + ": list null");
            }
            return null;
        }
        if (index >= 0 && index < list.size()) {
            return list.get(index);
        }
        if (BuildConfig.DEBUG) {
            Log.d(TAG, owner + ": skip invalid index=" + index + ", count=" + list.size());
        }
        return null;
    }

    private boolean readBoolean(Map<String, Object> map, String key, boolean fallback) {
        Object value = map.get(key);
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue() != 0;
        }
        return fallback;
    }

    private int parsePeriod(String value, int fallback) {
        if (value == null) {
            return fallback;
        }
        String digits = value.replaceAll("[^0-9]", "");
        if (digits.length() == 0) {
            return fallback;
        }
        try {
            return Integer.parseInt(digits);
        } catch (Throwable ignore) {
            return fallback;
        }
    }

    private int toInt(Object value, int fallback) {
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return fallback;
    }

    private int withAlpha(int color, int alpha) {
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color));
    }

    private int defaultLevelColor(float value) {
        if (value >= 70f) {
            return Color.parseColor("#EF4444");
        }
        if (value <= 30f) {
            return Color.parseColor("#14B8A6");
        }
        return Color.parseColor("#6B7280");
    }

    private String defaultLevelLabel(float value) {
        if (value == Math.rint(value)) {
            return String.valueOf((int) value);
        }
        return String.format(java.util.Locale.US, "%.2f", value);
    }
}
