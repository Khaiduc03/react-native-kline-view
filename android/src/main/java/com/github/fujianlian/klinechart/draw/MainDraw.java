package com.github.fujianlian.klinechart.draw;

import android.content.Context;
import android.graphics.*;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.github.fujianlian.klinechart.*;
import com.github.fujianlian.klinechart.base.IChartDraw;
import com.github.fujianlian.klinechart.base.IValueFormatter;
import com.github.fujianlian.klinechart.entity.ICandle;
import com.github.fujianlian.klinechart.formatter.ValueFormatter;
import com.github.fujianlian.klinechart.utils.ViewUtil;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 主图的实现类
 * Created by tifezh on 2016/6/14.
 */
public class MainDraw implements IChartDraw<ICandle> {
    private static final String TAG = "RNKLineView.MainDraw";

    private float mCandleWidth = 0;
    private float mCandleLineWidth = 0;

    private Paint mLinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mRedPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mGreenPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint ma5Paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint ma10Paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint ma30Paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint primaryPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint superFillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint bollBandFillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint bollLabelTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint bollLabelBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint maLabelTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint maLabelBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint maGuidePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint srLabelTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint srLabelBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint srGuidePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint minuteGradientPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mSelectorTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mSelectorBackgroundPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Context mContext;

    private boolean mCandleSolid = true;

    private PrimaryStatus primaryStatus = PrimaryStatus.MA;
    private KLineChartView kChartView;

    private final int srResistanceColor = Color.parseColor("#EF4444");
    private final int srSupportColor = Color.parseColor("#14B8A6");

    public MainDraw(BaseKLineChartView view) {
        Context context = view.getContext();
        kChartView = (KLineChartView) view;
        mContext = context;


        mLinePaint.setColor(ContextCompat.getColor(context, R.color.chart_line));
        mLinePaint.setStrokeJoin(Paint.Join.ROUND);
        mLinePaint.setStrokeCap(Paint.Cap.ROUND);
        mLinePaint.setStyle(Paint.Style.STROKE);


        minuteGradientPaint.setStrokeJoin(Paint.Join.ROUND);
        minuteGradientPaint.setStrokeCap(Paint.Cap.ROUND);
        minuteGradientPaint.setStyle(Paint.Style.FILL);

        bollBandFillPaint.setStyle(Paint.Style.FILL);
        bollBandFillPaint.setAntiAlias(true);
        bollLabelTextPaint.setAntiAlias(true);
        bollLabelBgPaint.setStyle(Paint.Style.FILL);
        bollLabelBgPaint.setAntiAlias(true);
        maLabelTextPaint.setAntiAlias(true);
        maLabelBgPaint.setStyle(Paint.Style.FILL);
        maLabelBgPaint.setAntiAlias(true);
        maGuidePaint.setStyle(Paint.Style.STROKE);
        maGuidePaint.setAntiAlias(true);
        srLabelTextPaint.setAntiAlias(true);
        srLabelBgPaint.setStyle(Paint.Style.FILL);
        srLabelBgPaint.setAntiAlias(true);
        srGuidePaint.setStyle(Paint.Style.STROKE);
        srGuidePaint.setAntiAlias(true);
    }

    public void reloadColor(BaseKLineChartView view) {
        mRedPaint.setColor(view.configManager.increaseColor);
        mGreenPaint.setColor(view.configManager.decreaseColor);
        mLinePaint.setColor(view.configManager.minuteLineColor);
    }

    public void setPrimaryStatus(PrimaryStatus primaryStatus) {
        this.primaryStatus = primaryStatus;
    }

    public PrimaryStatus getPrimaryStatus() {
        return primaryStatus;
    }

    private boolean shouldDrawMA(@NonNull BaseKLineChartView view) {
        return !view.isMinute && view.configManager.showMainMA;
    }

    private boolean shouldDrawBOLL(@NonNull BaseKLineChartView view) {
        return !view.isMinute && view.configManager.showMainBOLL;
    }

    private boolean shouldDrawBollBandLabels(@NonNull BaseKLineChartView view) {
        return shouldDrawBOLL(view) && "band_labels".equals(view.configManager.bollStyle);
    }

    private boolean shouldDrawMaLineLabels(@NonNull BaseKLineChartView view) {
        return shouldDrawMA(view) && "line_labels".equals(view.configManager.maStyle);
    }

    private boolean shouldDrawSupportResistanceLabels(@NonNull BaseKLineChartView view) {
        if (view.isMinute) {
            return false;
        }
        if (!"line_labels".equals(view.configManager.srStyle)) {
            return false;
        }
        Float support = view.configManager.supportLevel;
        Float resistance = view.configManager.resistanceLevel;
        if (support == null || resistance == null) {
            return false;
        }
        if (Float.isNaN(support) || Float.isInfinite(support)) {
            return false;
        }
        if (Float.isNaN(resistance) || Float.isInfinite(resistance)) {
            return false;
        }
        return support < resistance;
    }

    private boolean isBollValueValid(float value) {
        return !Float.isNaN(value) && !Float.isInfinite(value) && value != 0f;
    }

    private int parsePeriod(@Nullable String value, int fallback) {
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

    private float drawIndicatorRow(
            @NonNull Canvas canvas,
            @NonNull List<String> texts,
            @NonNull List<Integer> colors,
            float x,
            float y
    ) {
        for (int i = 0; i < texts.size(); i++) {
            String text = texts.get(i);
            int color = i < colors.size() ? colors.get(i) : this.primaryPaint.getColor();
            this.primaryPaint.setColor(color);
            canvas.drawText(text, x, y, this.primaryPaint);
            x += this.primaryPaint.measureText(text);
        }
        return x;
    }


    public void drawMinuteMinute(float top, int startIndex, float bottom, int stopIndex, @NonNull Canvas canvas, @NonNull BaseKLineChartView view) {
        if (!view.isMinute) {
            return;
        }
        float r = mCandleWidth / 2;
        int[] minuteGradientColors = view.configManager.minuteGradientColorList;
        if (minuteGradientColors == null || minuteGradientColors.length == 0) {
            int fallbackColor = view.configManager.minuteLineColor;
            minuteGradientColors = new int[]{fallbackColor, fallbackColor};
        } else if (minuteGradientColors.length == 1) {
            int singleColor = minuteGradientColors[0];
            minuteGradientColors = new int[]{singleColor, singleColor};
        }
        float[] minuteGradientLocations = view.configManager.minuteGradientLocationList;
        if (minuteGradientLocations != null && minuteGradientLocations.length != minuteGradientColors.length) {
            minuteGradientLocations = null;
        }
        LinearGradient linearGradient = new LinearGradient(
                0,
                0,
                0,
                bottom - top,
                minuteGradientColors,
                minuteGradientLocations,
                Shader.TileMode.CLAMP
        );
//        minuteGradientPaint.setColor(Color.BLUE);
        minuteGradientPaint.setShader(linearGradient);

        Path path = new Path();
        for (int i = startIndex; i <= stopIndex; i++) {
            ICandle currentPoint = (ICandle) view.getItem(i);
            float currentX = view.getItemMiddleScrollX(i);
            float currentY = view.yFromValue(currentPoint.getClosePrice());
            ICandle lastPoint = i == 0 ? currentPoint : (ICandle) view.getItem(i - 1);

            float lastX = i == 0 ? currentX : view.getItemMiddleScrollX(i - 1);
            float lastY = view.yFromValue(lastPoint.getClosePrice());
            float centerX = (currentX - lastX) / 2 + lastX;
            float centerY = (currentY - lastY) / 2 + lastY;
            if (i == startIndex) {
                path.moveTo(lastX, lastY);
            }
            path.cubicTo(centerX, lastY, centerX, currentY, currentX, currentY);
        }
        Path gradientPath = new Path(path);
        gradientPath.lineTo(view.getItemMiddleScrollX(stopIndex), view.getMainBottom());
        gradientPath.lineTo(view.getItemMiddleScrollX(startIndex), view.getMainBottom());
//        gradientPath.lineTo(view.getX(startIndex), top);
        gradientPath.close();
        canvas.drawPath(gradientPath, minuteGradientPaint);
        canvas.drawPath(path, mLinePaint);

    }

    @Override
    public void drawTranslated(@Nullable ICandle lastPoint, @NonNull ICandle curPoint, float lastX, float curX, @NonNull Canvas canvas, @NonNull BaseKLineChartView view, int position) {
        if (view.isMinute) {
            return;
        }
        drawCandle(view, canvas, curX, curPoint.getHighPrice(), curPoint.getLowPrice(), curPoint.getOpenPrice(), curPoint.getClosePrice());
        if (shouldDrawMA(view)) {
            if (lastPoint == null) {
                // Need a previous candle to draw MA line segments.
            } else {
                KLineEntity lastItem = (KLineEntity) lastPoint;
                KLineEntity currentItem = (KLineEntity) curPoint;
                for (int i = 0; i < view.configManager.maList.size(); i ++) {
                    HTKLineTargetItem configItem = (HTKLineTargetItem) view.configManager.maList.get(i);
                    HTKLineTargetItem currentTargetItem = safeTargetItem(currentItem.maList, configItem.index, "drawTranslated.current");
                    HTKLineTargetItem lastTargetItem = safeTargetItem(lastItem.maList, configItem.index, "drawTranslated.last");
                    if (currentTargetItem == null || lastTargetItem == null) {
                        continue;
                    }
                    primaryPaint.setColor(safeTargetColor(view, configItem.index, 0));
                    view.drawMainLine(canvas, this.primaryPaint, lastX, lastTargetItem.value, curX, currentTargetItem.value);
                }
            }
        }
        if (shouldDrawBOLL(view) && lastPoint != null) {
            //画boll
            if (lastPoint.getMb() != 0) {
                primaryPaint.setColor(safeTargetColor(view, 0, 0));
                view.drawMainLine(canvas, primaryPaint, lastX, lastPoint.getMb(), curX, curPoint.getMb());
            }
            if (lastPoint.getUp() != 0) {
                primaryPaint.setColor(safeTargetColor(view, 1, 0));
                view.drawMainLine(canvas, primaryPaint, lastX, lastPoint.getUp(), curX, curPoint.getUp());
            }
            if (lastPoint.getDn() != 0) {
                primaryPaint.setColor(safeTargetColor(view, 2, 0));
                view.drawMainLine(canvas, primaryPaint, lastX, lastPoint.getDn(), curX, curPoint.getDn());
            }
        }

    }

    public void drawBackground(@Nullable ICandle lastPoint, @NonNull ICandle curPoint, float lastX, float curX, @NonNull Canvas canvas, @NonNull BaseKLineChartView view) {
        if (view.isMinute) {
            return;
        }
        if (lastPoint == null) {
            return;
        }
        drawBollBandFill(lastPoint, curPoint, lastX, curX, canvas, view);
        drawSuperFill(lastPoint, curPoint, lastX, curX, canvas, view);
    }

    private void drawBollBandFill(
            @NonNull ICandle lastPoint,
            @NonNull ICandle curPoint,
            float lastX,
            float curX,
            @NonNull Canvas canvas,
            @NonNull BaseKLineChartView view
    ) {
        if (!shouldDrawBollBandLabels(view)) {
            return;
        }
        float lastUp = lastPoint.getUp();
        float lastDn = lastPoint.getDn();
        float curUp = curPoint.getUp();
        float curDn = curPoint.getDn();
        if (!isBollValueValid(lastUp) || !isBollValueValid(lastDn)
                || !isBollValueValid(curUp) || !isBollValueValid(curDn)) {
            return;
        }

        float lastUpY = view.yFromValue(lastUp);
        float lastDnY = view.yFromValue(lastDn);
        float curUpY = view.yFromValue(curUp);
        float curDnY = view.yFromValue(curDn);

        float minY = Math.min(Math.min(lastUpY, lastDnY), Math.min(curUpY, curDnY));
        float maxY = Math.max(Math.max(lastUpY, lastDnY), Math.max(curUpY, curDnY));
        if (Math.abs(maxY - minY) < 0.5f) {
            return;
        }

        Path bandPath = new Path();
        bandPath.moveTo(lastX, lastUpY);
        bandPath.lineTo(curX, curUpY);
        bandPath.lineTo(curX, curDnY);
        bandPath.lineTo(lastX, lastDnY);
        bandPath.close();

        int upperColor = withAlpha(safeTargetColor(view, 1, view.configManager.textColor), 42);
        int lowerColor = withAlpha(safeTargetColor(view, 2, view.configManager.textColor), 14);
        Shader gradient = new LinearGradient(
                lastX, minY,
                lastX, maxY,
                upperColor,
                lowerColor,
                Shader.TileMode.CLAMP
        );
        bollBandFillPaint.setShader(gradient);
        canvas.drawPath(bandPath, bollBandFillPaint);
        bollBandFillPaint.setShader(null);
    }

    private HTKLineTargetItem resolveSuperItem(KLineEntity item, BaseKLineChartView view) {
        for (int i = 0; i < view.configManager.maList.size(); i++) {
            HTKLineTargetItem configItem = (HTKLineTargetItem) view.configManager.maList.get(i);
            if (!"super".equalsIgnoreCase(configItem.kind)) {
                continue;
            }
            HTKLineTargetItem target = safeTargetItem(item.maList, configItem.index, "resolveSuper");
            if (target != null) {
                return target;
            }
            target = safeTargetItem(item.maList, i, "resolveSuper.fallback");
            if (target != null) {
                return target;
            }
        }
        return null;
    }

    private int withAlpha(int color, int alpha) {
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color));
    }

    private void drawSuperFillSegment(
            Canvas canvas,
            float lastX,
            float curX,
            float lastCloseY,
            float curCloseY,
            float lastSuperY,
            float curSuperY,
            boolean isUp,
            BaseKLineChartView view
    ) {
        float minY = Math.min(Math.min(lastCloseY, curCloseY), Math.min(lastSuperY, curSuperY));
        float maxY = Math.max(Math.max(lastCloseY, curCloseY), Math.max(lastSuperY, curSuperY));
        if (Math.abs(maxY - minY) < 0.5f) {
            return;
        }

        int base = isUp ? view.configManager.increaseColor : view.configManager.decreaseColor;
        int strong = withAlpha(base, 56);
        int weak = withAlpha(base, 10);
        int startColor = isUp ? strong : weak;
        int endColor = isUp ? weak : strong;

        Path path = new Path();
        path.moveTo(lastX, lastCloseY);
        path.lineTo(curX, curCloseY);
        path.lineTo(curX, curSuperY);
        path.lineTo(lastX, lastSuperY);
        path.close();

        Shader gradient = new LinearGradient(
                lastX, minY,
                lastX, maxY,
                startColor,
                endColor,
                Shader.TileMode.CLAMP
        );
        superFillPaint.setShader(gradient);
        superFillPaint.setStyle(Paint.Style.FILL);
        canvas.drawPath(path, superFillPaint);
        superFillPaint.setShader(null);
    }

    private void drawSuperFill(
            @NonNull ICandle lastPoint,
            @NonNull ICandle curPoint,
            float lastX,
            float curX,
            @NonNull Canvas canvas,
            @NonNull BaseKLineChartView view
    ) {
        if (!shouldDrawMA(view)) {
            return;
        }
        KLineEntity lastItem = (KLineEntity) lastPoint;
        KLineEntity currentItem = (KLineEntity) curPoint;
        HTKLineTargetItem lastSuperItem = resolveSuperItem(lastItem, view);
        HTKLineTargetItem currentSuperItem = resolveSuperItem(currentItem, view);
        if (lastSuperItem == null || currentSuperItem == null) {
            return;
        }

        float lastClose = lastItem.getClosePrice();
        float currentClose = currentItem.getClosePrice();
        float lastSuper = lastSuperItem.value;
        float currentSuper = currentSuperItem.value;

        float d1 = lastClose - lastSuper;
        float d2 = currentClose - currentSuper;
        if (d1 == 0f && d2 == 0f) {
            return;
        }

        float lastCloseY = view.yFromValue(lastClose);
        float currentCloseY = view.yFromValue(currentClose);
        float lastSuperY = view.yFromValue(lastSuper);
        float currentSuperY = view.yFromValue(currentSuper);

        boolean sameSide = (d1 >= 0f && d2 >= 0f) || (d1 <= 0f && d2 <= 0f);
        if (sameSide) {
            drawSuperFillSegment(
                    canvas, lastX, curX, lastCloseY, currentCloseY, lastSuperY, currentSuperY, d2 >= 0f, view
            );
            return;
        }

        float denominator = d1 - d2;
        if (denominator == 0f) {
            drawSuperFillSegment(
                    canvas, lastX, curX, lastCloseY, currentCloseY, lastSuperY, currentSuperY, d2 >= 0f, view
            );
            return;
        }
        float t = d1 / denominator;
        t = Math.max(0f, Math.min(1f, t));
        float crossX = lastX + (curX - lastX) * t;
        float crossCloseY = lastCloseY + (currentCloseY - lastCloseY) * t;
        float crossSuperY = lastSuperY + (currentSuperY - lastSuperY) * t;

        drawSuperFillSegment(
                canvas,
                lastX,
                crossX,
                lastCloseY,
                crossCloseY,
                lastSuperY,
                crossSuperY,
                d1 >= 0f,
                view
        );
        drawSuperFillSegment(
                canvas,
                crossX,
                curX,
                crossCloseY,
                currentCloseY,
                crossSuperY,
                currentSuperY,
                d2 >= 0f,
                view
        );
    }

    @Override
    public void drawText(@NonNull Canvas canvas, @NonNull BaseKLineChartView view, int position, float x, float y) {
        KLineEntity point = (KLineEntity) view.getItem(position);
        String text = "";
        String space = "  ";
        if (view.isMinute) {

        } else {
            float rowY = y;
            float rowSpacing = Math.max(view.configManager.headerTextFontSize + 4f, 14f);
            if (shouldDrawMA(view)) {
                List<String> maTexts = new ArrayList<>();
                List<Integer> maColors = new ArrayList<>();
                List<String> emaTexts = new ArrayList<>();
                List<Integer> emaColors = new ArrayList<>();
                List<String> superTexts = new ArrayList<>();
                List<Integer> superColors = new ArrayList<>();
                for (int i = 0; i < view.configManager.maList.size(); i ++) {
                    HTKLineTargetItem configItem = (HTKLineTargetItem) view.configManager.maList.get(i);
                    HTKLineTargetItem targetItem = safeTargetItem(point.maList, configItem.index, "drawText");
                    if (targetItem == null) {
                        continue;
                    }
                    StringBuilder stringBuilder = new StringBuilder();
                    String lowerKind = targetItem.kind == null ? "ma" : targetItem.kind.toLowerCase();
                    String prefix = "ema".equals(lowerKind) ? "EMA" : ("super".equals(lowerKind) ? "SUPER" : "MA");
                    if ("super".equals(lowerKind)) {
                        stringBuilder.append("SUPERTREND(");
                        stringBuilder.append(targetItem.title);
                        stringBuilder.append(")");
                    } else {
                        stringBuilder.append(prefix);
                        stringBuilder.append(targetItem.title);
                    }
                    stringBuilder.append(":");
                    stringBuilder.append(view.formatValue(targetItem.value));
                    stringBuilder.append(space);
                    int color = safeTargetColor(view, configItem.index, 0);
                    if ("ema".equals(lowerKind)) {
                        emaTexts.add(stringBuilder.toString());
                        emaColors.add(color);
                    } else if ("super".equals(lowerKind)) {
                        superTexts.add(stringBuilder.toString());
                        superColors.add(color);
                    } else {
                        maTexts.add(stringBuilder.toString());
                        maColors.add(color);
                    }
                }
                if (!maTexts.isEmpty()) {
                    drawIndicatorRow(canvas, maTexts, maColors, x, rowY);
                    rowY += rowSpacing;
                }
                if (!emaTexts.isEmpty()) {
                    drawIndicatorRow(canvas, emaTexts, emaColors, x, rowY);
                    rowY += rowSpacing;
                }
                if (!superTexts.isEmpty()) {
                    drawIndicatorRow(canvas, superTexts, superColors, x, rowY);
                    rowY += rowSpacing;
                }
                drawMaRightLabels(canvas, view);
            }
            if (shouldDrawBOLL(view)) {
                List<String> bollTexts = new ArrayList<>();
                List<Integer> bollColors = new ArrayList<>();
                if (point.getMb() != 0) {
                    bollTexts.add("BOLL(" + view.configManager.bollN + "," + view.configManager.bollP + ")" + space);
                    bollColors.add(safeTargetColor(view, 0, 0));
                    bollTexts.add("MID:" + view.formatValue(point.getMb()) + space);
                    bollColors.add(safeTargetColor(view, 0, 0));
                    bollTexts.add("UPPER:" + view.formatValue(point.getUp()) + space);
                    bollColors.add(safeTargetColor(view, 1, 0));
                    bollTexts.add("LOWER:" + view.formatValue(point.getDn()) + space);
                    bollColors.add(safeTargetColor(view, 2, 0));
                }
                if (!bollTexts.isEmpty()) {
                    drawIndicatorRow(canvas, bollTexts, bollColors, x, rowY);
                }
                drawBollRightLabels(canvas, view);
            }
            drawSupportResistanceRightLabels(canvas, view);
        }
    }

    private void drawSupportResistanceRightLabels(@NonNull Canvas canvas, @NonNull BaseKLineChartView view) {
        if (!shouldDrawSupportResistanceLabels(view)) {
            return;
        }

        Float supportRaw = view.configManager.supportLevel;
        Float resistanceRaw = view.configManager.resistanceLevel;
        if (supportRaw == null || resistanceRaw == null) {
            return;
        }
        float support = supportRaw;
        float resistance = resistanceRaw;

        String[] titles = {"Resistance", "Support"};
        float[] values = {resistance, support};
        int[] bgColors = {srResistanceColor, srSupportColor};
        float[] yTargets = {view.yFromValue(resistance), view.yFromValue(support)};
        int[] order = {0, 1};
        if (yTargets[order[1]] < yTargets[order[0]]) {
            int tmp = order[0];
            order[0] = order[1];
            order[1] = tmp;
        }

        float fontSize = Math.max(ViewUtil.Dp2Px(mContext, 10f), view.configManager.rightTextFontSize);
        srLabelTextPaint.setTextSize(fontSize);
        srLabelTextPaint.setColor(Color.WHITE);
        Paint.FontMetrics fm = srLabelTextPaint.getFontMetrics();
        float textHeight = fm.descent - fm.ascent;
        float paddingX = ViewUtil.Dp2Px(mContext, 6f);
        float paddingY = ViewUtil.Dp2Px(mContext, 3f);
        float labelHeight = textHeight + paddingY * 2f;
        float gap = ViewUtil.Dp2Px(mContext, 4f);
        float minTop = ViewUtil.Dp2Px(mContext, 2f);
        float maxTop = view.getMainBottom() - labelHeight - ViewUtil.Dp2Px(mContext, 2f);
        if (maxTop < minTop) {
            return;
        }

        float[] topByIndex = new float[2];
        float previousBottom = minTop - gap;
        for (int orderedIndex : order) {
            float rawTop = yTargets[orderedIndex] - labelHeight / 2f;
            float top = Math.max(minTop, Math.min(maxTop, rawTop));
            if (top < previousBottom + gap) {
                top = previousBottom + gap;
            }
            top = Math.min(maxTop, top);
            topByIndex[orderedIndex] = top;
            previousBottom = top + labelHeight;
        }

        float rightInset = ViewUtil.Dp2Px(mContext, 6f);
        srGuidePaint.setStrokeWidth(ViewUtil.Dp2Px(mContext, 0.9f));
        srGuidePaint.setPathEffect(new DashPathEffect(new float[]{10f, 6f}, 0));
        for (int i = 0; i < values.length; i++) {
            String text = titles[i] + " " + view.formatValue(values[i]);
            float textWidth = srLabelTextPaint.measureText(text);
            float width = textWidth + paddingX * 2f;
            float left = view.getWidth() - rightInset - width;
            float top = topByIndex[i];
            float yValue = yTargets[i];
            int color = bgColors[i];

            srGuidePaint.setColor(withAlpha(color, 160));
            canvas.drawLine(0f, yValue, view.getWidth(), yValue, srGuidePaint);

            RectF rect = new RectF(left, top, left + width, top + labelHeight);
            srLabelBgPaint.setColor(color);
            canvas.drawRoundRect(rect, ViewUtil.Dp2Px(mContext, 3f), ViewUtil.Dp2Px(mContext, 3f), srLabelBgPaint);
            float textBaseline = top + paddingY - fm.ascent;
            canvas.drawText(text, left + paddingX, textBaseline, srLabelTextPaint);
        }
        srGuidePaint.setPathEffect(null);
    }

    private void drawMaRightLabels(@NonNull Canvas canvas, @NonNull BaseKLineChartView view) {
        if (!shouldDrawMaLineLabels(view)) {
            return;
        }
        int stopIndex = view.getVisibleStopIndex();
        if (stopIndex < 0 || stopIndex >= view.configManager.modelArray.size()) {
            return;
        }
        KLineEntity point = view.getItem(stopIndex);
        if (point.maList == null || point.maList.isEmpty()) {
            return;
        }

        List<String> titles = new ArrayList<>();
        List<Float> values = new ArrayList<>();
        List<Integer> colors = new ArrayList<>();
        List<Float> yTargets = new ArrayList<>();
        for (int i = 0; i < view.configManager.maList.size(); i++) {
            HTKLineTargetItem configItem = (HTKLineTargetItem) view.configManager.maList.get(i);
            if (configItem == null || configItem.kind == null || !"ema".equalsIgnoreCase(configItem.kind)) {
                continue;
            }
            HTKLineTargetItem targetItem = safeTargetItem(point.maList, configItem.index, "drawMaRightLabels");
            if (targetItem == null) {
                continue;
            }
            float value = targetItem.value;
            if (Float.isNaN(value) || Float.isInfinite(value) || value == 0f) {
                continue;
            }
            int period = parsePeriod(configItem.title, parsePeriod(targetItem.title, configItem.index));
            String title = "EMA " + (period > 0 ? period : configItem.title);
            titles.add(title);
            values.add(value);
            colors.add(safeTargetColor(view, configItem.index, 0));
            yTargets.add(view.yFromValue(value));
        }
        if (titles.isEmpty()) {
            return;
        }

        int count = titles.size();
        Integer[] order = new Integer[count];
        for (int i = 0; i < count; i++) {
            order[i] = i;
        }
        java.util.Arrays.sort(order, (a, b) -> Float.compare(yTargets.get(a), yTargets.get(b)));

        float fontSize = Math.max(ViewUtil.Dp2Px(mContext, 10f), view.configManager.rightTextFontSize);
        maLabelTextPaint.setTextSize(fontSize);
        maLabelTextPaint.setColor(Color.WHITE);
        Paint.FontMetrics fm = maLabelTextPaint.getFontMetrics();
        float textHeight = fm.descent - fm.ascent;
        float paddingX = ViewUtil.Dp2Px(mContext, 6f);
        float paddingY = ViewUtil.Dp2Px(mContext, 3f);
        float labelHeight = textHeight + paddingY * 2f;
        float gap = ViewUtil.Dp2Px(mContext, 4f);
        float minTop = ViewUtil.Dp2Px(mContext, 2f);
        float maxTop = view.getMainBottom() - labelHeight - ViewUtil.Dp2Px(mContext, 2f);
        if (maxTop < minTop) {
            return;
        }

        float[] topByIndex = new float[count];
        float previousBottom = minTop - gap;
        for (int orderedIndex : order) {
            float rawTop = yTargets.get(orderedIndex) - labelHeight / 2f;
            float top = Math.max(minTop, Math.min(maxTop, rawTop));
            if (top < previousBottom + gap) {
                top = previousBottom + gap;
            }
            top = Math.min(maxTop, top);
            topByIndex[orderedIndex] = top;
            previousBottom = top + labelHeight;
        }

        float rightInset = Math.max(view.configManager.paddingRight, ViewUtil.Dp2Px(mContext, 4f));
        maGuidePaint.setStrokeWidth(ViewUtil.Dp2Px(mContext, 0.8f));
        maGuidePaint.setPathEffect(new DashPathEffect(new float[]{8f, 6f}, 0));
        for (int i = 0; i < count; i++) {
            String valueText = view.formatValue(values.get(i));
            String text = titles.get(i) + " " + valueText;
            float textWidth = maLabelTextPaint.measureText(text);
            float width = textWidth + paddingX * 2f;
            float left = view.getWidth() - rightInset - width;
            float top = topByIndex[i];
            float yValue = yTargets.get(i);
            int color = colors.get(i);
            maGuidePaint.setColor(withAlpha(color, 120));
            float guideEnd = Math.max(0f, left - ViewUtil.Dp2Px(mContext, 4f));
            if (guideEnd > 0f) {
                canvas.drawLine(0f, yValue, guideEnd, yValue, maGuidePaint);
            }

            RectF rect = new RectF(left, top, left + width, top + labelHeight);
            maLabelBgPaint.setColor(color);
            canvas.drawRoundRect(rect, ViewUtil.Dp2Px(mContext, 3f), ViewUtil.Dp2Px(mContext, 3f), maLabelBgPaint);
            float textBaseline = top + paddingY - fm.ascent;
            canvas.drawText(text, left + paddingX, textBaseline, maLabelTextPaint);
        }
        maGuidePaint.setPathEffect(null);
    }

    private void drawBollRightLabels(@NonNull Canvas canvas, @NonNull BaseKLineChartView view) {
        if (!shouldDrawBollBandLabels(view)) {
            return;
        }
        int stopIndex = view.getVisibleStopIndex();
        if (stopIndex < 0 || stopIndex >= view.configManager.modelArray.size()) {
            return;
        }
        KLineEntity point = view.getItem(stopIndex);
        float upper = point.getUp();
        float base = point.getMb();
        float lower = point.getDn();
        if (!isBollValueValid(upper) || !isBollValueValid(base) || !isBollValueValid(lower)) {
            return;
        }

        String[] titles = {"Upper", "Base", "Lower"};
        float[] values = {upper, base, lower};
        int[] bgColors = {
                safeTargetColor(view, 1, view.configManager.increaseColor),
                safeTargetColor(view, 0, view.configManager.increaseColor),
                safeTargetColor(view, 2, view.configManager.decreaseColor),
        };
        float[] yTargets = {
                view.yFromValue(upper),
                view.yFromValue(base),
                view.yFromValue(lower),
        };
        int[] order = {0, 1, 2};
        for (int i = 0; i < order.length; i++) {
            for (int j = i + 1; j < order.length; j++) {
                if (yTargets[order[j]] < yTargets[order[i]]) {
                    int tmp = order[i];
                    order[i] = order[j];
                    order[j] = tmp;
                }
            }
        }

        float fontSize = Math.max(ViewUtil.Dp2Px(mContext, 10f), view.configManager.rightTextFontSize);
        bollLabelTextPaint.setTextSize(fontSize);
        bollLabelTextPaint.setColor(Color.WHITE);
        Paint.FontMetrics fm = bollLabelTextPaint.getFontMetrics();
        float textHeight = fm.descent - fm.ascent;
        float paddingX = ViewUtil.Dp2Px(mContext, 6f);
        float paddingY = ViewUtil.Dp2Px(mContext, 3f);
        float labelHeight = textHeight + paddingY * 2f;
        float gap = ViewUtil.Dp2Px(mContext, 4f);
        float minTop = ViewUtil.Dp2Px(mContext, 2f);
        float maxTop = view.getMainBottom() - labelHeight - ViewUtil.Dp2Px(mContext, 2f);
        if (maxTop < minTop) {
            return;
        }

        float[] topByIndex = new float[3];
        float previousBottom = minTop - gap;
        for (int orderedIndex : order) {
            float rawTop = yTargets[orderedIndex] - labelHeight / 2f;
            float top = Math.max(minTop, Math.min(maxTop, rawTop));
            if (top < previousBottom + gap) {
                top = previousBottom + gap;
            }
            top = Math.min(maxTop, top);
            topByIndex[orderedIndex] = top;
            previousBottom = top + labelHeight;
        }

        float rightInset = Math.max(view.configManager.paddingRight, ViewUtil.Dp2Px(mContext, 4f));
        for (int i = 0; i < values.length; i++) {
            String text = titles[i] + " " + view.formatValue(values[i]);
            float textWidth = bollLabelTextPaint.measureText(text);
            float width = textWidth + paddingX * 2f;
            float left = view.getWidth() - rightInset - width;
            float top = topByIndex[i];
            RectF rect = new RectF(left, top, left + width, top + labelHeight);
            bollLabelBgPaint.setColor(bgColors[i]);
            canvas.drawRoundRect(rect, ViewUtil.Dp2Px(mContext, 3f), ViewUtil.Dp2Px(mContext, 3f), bollLabelBgPaint);
            float textBaseline = top + paddingY - fm.ascent;
            canvas.drawText(text, left + paddingX, textBaseline, bollLabelTextPaint);
        }
    }

    public float findIsMaxValue(ICandle point, final boolean isMax) {
        final KLineEntity item = (KLineEntity) point;
        ArrayList<Float> valueList = new ArrayList<Float>(){{
            add(item.getHighPrice());
            add(item.getLowPrice());
        }};
        if (shouldDrawMA(kChartView)) {
            valueList.add(item.targetListISMax(item.maList, isMax));
        }
        if (shouldDrawBOLL(kChartView)) {
            valueList.add(item.getMb());
            valueList.add(item.getUp());
            valueList.add(item.getDn());
        }
        float max = Float.MIN_VALUE;
        float min = Float.MAX_VALUE;
        for (float value: valueList) {
            if (isMax) {
                max = Math.max(max, value);
            } else {
                min = Math.min(min, value);
            }
        }
        if (isMax) {
            return max;
        }
        return min;

    }

    @Override
    public float getMaxValue(final ICandle point) {
        return findIsMaxValue(point, true);
    }

    @Override
    public float getMinValue(ICandle point) {
        return findIsMaxValue(point, false);
    }

    @Override
    public IValueFormatter getValueFormatter() {
        return new ValueFormatter();
    }

    /**
     * 画Candle
     *
     * @param canvas
     * @param x      x轴坐标
     * @param high   最高价
     * @param low    最低价
     * @param open   开盘价
     * @param close  收盘价
     */
    private void drawCandle(BaseKLineChartView view, Canvas canvas, float x, float high, float low, float open, float close) {
        high = view.yFromValue(high);
        low = view.yFromValue(low);
        open = view.yFromValue(open);
        close = view.yFromValue(close);

        float bodyTop = Math.min(open, close);
        float bodyBottom = Math.max(open, close);
        // Keep tiny/doji candles visible by enforcing a minimum body height.
        final float minBodyPx = 1.5f;
        if (bodyBottom - bodyTop < minBodyPx) {
            float mid = (bodyTop + bodyBottom) / 2f;
            bodyTop = mid - (minBodyPx / 2f);
            bodyBottom = mid + (minBodyPx / 2f);
        }

        float r = mCandleWidth / 2;
        float lineR = mCandleLineWidth / 2;
        if (open > close) {
            //实心
            if (mCandleSolid) {
                canvas.drawRect(x - r, bodyTop, x + r, bodyBottom, mRedPaint);
                canvas.drawRect(x - lineR, high, x + lineR, low, mRedPaint);
            } else {
                mRedPaint.setStrokeWidth(mCandleLineWidth);
                canvas.drawLine(x, high, x, close, mRedPaint);
                canvas.drawLine(x, open, x, low, mRedPaint);
                canvas.drawLine(x - r + lineR, open, x - r + lineR, close, mRedPaint);
                canvas.drawLine(x + r - lineR, open, x + r - lineR, close, mRedPaint);
                mRedPaint.setStrokeWidth(mCandleLineWidth * view.getScaleX());
                canvas.drawLine(x - r, open, x + r, open, mRedPaint);
                canvas.drawLine(x - r, close, x + r, close, mRedPaint);
            }

        } else if (open < close) {
            canvas.drawRect(x - r, bodyTop, x + r, bodyBottom, mGreenPaint);
            canvas.drawRect(x - lineR, high, x + lineR, low, mGreenPaint);
        } else {
            canvas.drawRect(x - r, bodyTop, x + r, bodyBottom, mRedPaint);
            canvas.drawRect(x - lineR, high, x + lineR, low, mRedPaint);
        }
    }

    /**
     * draw选择器
     *
     * @param view
     * @param canvas
     */
    public void drawSelector(final BaseKLineChartView view, Canvas canvas) {
        if (view.isMinute) {
            return;
        }
        Paint.FontMetrics metrics = mSelectorTextPaint.getFontMetrics();
        float textHeight = metrics.descent - metrics.ascent;

        final int index = view.getSelectedIndex();
        float padding = ViewUtil.Dp2Px(mContext, 7);
        float lineHeight = ViewUtil.Dp2Px(mContext, 8);
        float margin = ViewUtil.Dp2Px(mContext, 5);
        float width = 0;
        float left;
        float top = margin + view.getTopPadding();
        final KLineEntity point = (KLineEntity) view.getItem(index);


        List<Map<String, Object>> itemList = point.selectedItemList;

        float height = padding * 2 + (textHeight + lineHeight) * itemList.size() - lineHeight;

        for (int i = 0; i < itemList.size(); i ++) {
            Map<String, Object> map = itemList.get(i);
            String leftString = (String) map.get("title");
            String rightString = (String) map.get("detail");
            width = Math.max(width, mSelectorTextPaint.measureText(leftString + rightString));
        }

        width += padding * 2;
        width = Math.max(width, view.configManager.panelMinWidth);

        float x = view.scrollXtoViewX(view.getItemMiddleScrollX(index));
        if (x > view.getChartWidth() / 2) {
            left = margin;
        } else {
            left = view.getChartWidth() - width - margin;
        }

        RectF r = new RectF(left, top, left + width, top + height);

        mSelectorBackgroundPaint.setStyle(Paint.Style.FILL);
        mSelectorBackgroundPaint.setColor(view.configManager.panelBackgroundColor);
        canvas.drawRoundRect(r, 5, 5, mSelectorBackgroundPaint);

        mSelectorBackgroundPaint.setStyle(Paint.Style.STROKE);
        mSelectorBackgroundPaint.setStrokeWidth(1);
        mSelectorBackgroundPaint.setColor(view.configManager.panelBorderColor);
        canvas.drawRoundRect(r, 5, 5, mSelectorBackgroundPaint);

        float y = top + padding + (textHeight - metrics.bottom - metrics.top) / 2;

        for (int i = 0; i < itemList.size(); i ++) {
            Map<String, Object> map = itemList.get(i);
            String leftString = (String) map.get("title");
            String rightString = (String) map.get("detail");
            mSelectorTextPaint.setTextSize(view.configManager.panelTextFontSize);

            int paintColor = view.configManager.candleTextColor;
            mSelectorTextPaint.setColor(paintColor);
            canvas.drawText(leftString, left + padding, y, mSelectorTextPaint);
            if (map.get("color") != null) {
                paintColor = new Integer(((Number) map.get("color")).intValue());
                mSelectorTextPaint.setColor(paintColor);
            }
            canvas.drawText(rightString, r.right - mSelectorTextPaint.measureText(rightString) - padding, y, mSelectorTextPaint);
            y += textHeight + lineHeight;
        }

    }

    private int safeTargetColor(BaseKLineChartView view, int index, int fallbackIndex) {
        int[] list = view.configManager.targetColorList;
        if (index >= 0 && index < list.length) {
            return list[index];
        }
        if (fallbackIndex >= 0 && fallbackIndex < list.length) {
            if (BuildConfig.DEBUG) {
                Log.d(TAG, "Invalid targetColor index=" + index + ", fallback=" + fallbackIndex + ", count=" + list.length);
            }
            return list[fallbackIndex];
        }
        return Color.BLACK;
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

    /**
     * 设置蜡烛宽度
     *
     * @param candleWidth
     */
    public void setCandleWidth(float candleWidth) {
        mCandleWidth = candleWidth;
    }

    /**
     * 设置蜡烛线宽度
     *
     * @param candleLineWidth
     */
    public void setCandleLineWidth(float candleLineWidth) {
        mCandleLineWidth = candleLineWidth;
    }

    /**
     * 设置ma5颜色
     *
     * @param color
     */
    public void setMa5Color(int color) {
        this.ma5Paint.setColor(color);
    }

    /**
     * 设置ma10颜色
     *
     * @param color
     */
    public void setMa10Color(int color) {
        this.ma10Paint.setColor(color);
    }

    /**
     * 设置ma30颜色
     *
     * @param color
     */
    public void setMa30Color(int color) {
        this.ma30Paint.setColor(color);
    }

    /**
     * 设置选择器文字颜色
     *
     * @param color
     */
    public void setSelectorTextColor(int color) {
        mSelectorTextPaint.setColor(color);
    }

    /**
     * 设置选择器文字大小
     *
     * @param textSize
     */
    public void setSelectorTextSize(float textSize) {
        mSelectorTextPaint.setTextSize(textSize);
    }

    /**
     * 设置选择器背景
     *
     * @param color
     */
    public void setSelectorBackgroundColor(int color) {
        mSelectorBackgroundPaint.setColor(color);
    }

    /**
     * 设置曲线宽度
     */
    public void setLineWidth(float width) {
        ma30Paint.setStrokeWidth(width);
        ma10Paint.setStrokeWidth(width);
        ma5Paint.setStrokeWidth(width);
        primaryPaint.setStrokeWidth(width);
        mLinePaint.setStrokeWidth(width);
    }

    /**
     * 设置文字大小
     */
    public void setTextSize(float textSize) {
        ma30Paint.setTextSize(textSize);
        ma10Paint.setTextSize(textSize);
        ma5Paint.setTextSize(textSize);
        primaryPaint.setTextSize(textSize);
    }

    public void setTextFontFamily(String fontFamily) {
        Typeface typeface = HTKLineConfigManager.findFont(mContext, fontFamily);
        mLinePaint.setTypeface(typeface);
        mRedPaint.setTypeface(typeface);
        mGreenPaint.setTypeface(typeface);
        ma5Paint.setTypeface(typeface);
        ma10Paint.setTypeface(typeface);
        ma30Paint.setTypeface(typeface);
        primaryPaint.setTypeface(typeface);

        minuteGradientPaint.setTypeface(typeface);

        mSelectorTextPaint.setTypeface(typeface);
        mSelectorBackgroundPaint.setTypeface(typeface);
    }

    /**
     * 蜡烛是否实心
     */
    public void setCandleSolid(boolean candleSolid) {
        mCandleSolid = candleSolid;
    }

}
