package com.github.fujianlian.klinechart;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.*;
import android.graphics.drawable.Drawable;
import androidx.core.view.GestureDetectorCompat;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;

import com.airbnb.lottie.*;
import com.github.fujianlian.klinechart.base.IChartDraw;
import com.github.fujianlian.klinechart.base.IDateTimeFormatter;
import com.github.fujianlian.klinechart.base.IValueFormatter;
import com.github.fujianlian.klinechart.container.HTDrawContext;
import com.github.fujianlian.klinechart.container.HTPoint;
import com.github.fujianlian.klinechart.draw.MainDraw;
import com.github.fujianlian.klinechart.draw.PrimaryStatus;
import com.github.fujianlian.klinechart.entity.IKLine;
import com.github.fujianlian.klinechart.formatter.TimeFormatter;
import com.github.fujianlian.klinechart.formatter.ValueFormatter;
import com.github.fujianlian.klinechart.utils.ViewUtil;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * k线图
 * Created by tian on 2016/5/3.
 */
public abstract class BaseKLineChartView extends ScrollAndScaleView implements Drawable.Callback {

    public HTKLineConfigManager configManager;

    public HTDrawContext drawContext;



    private int mChildDrawPosition = -1;

    private int mWidth = 0;

    private int mTopPadding;

    private int mChildPadding;

    private int mBottomPadding;

    private float mMainScaleY = 1;

    private float mVolScaleY = 1;

    private float mChildScaleY = 1;

    private float mDataLen = 0;

    private float mMainMaxValue = Float.MAX_VALUE;

    private float mMainMinValue = Float.MIN_VALUE;

    private float mMainHighMaxValue = 0;

    private float mMainLowMinValue = 0;

    private int mMainMaxIndex = 0;

    private int mMainMinIndex = 0;

    private Float mVolMaxValue = Float.MAX_VALUE;

    private Float mVolMinValue = Float.MIN_VALUE;

    private Float mChildMaxValue = Float.MAX_VALUE;

    private Float mChildMinValue = Float.MIN_VALUE;

    private int mStartIndex = 0;

    private int mStopIndex = 0;

    private float mPointWidth = 6;

    private int mGridRows = 4;

    private int mGridColumns = 4;

    private Paint mGridPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mMaxMinPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mBackgroundPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mSelectedXLinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mSelectedYLinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mSelectPointPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mSelectCenterPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mSelectCenterBackgroundPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mSelectorFramePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mClosePriceLinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mClosePricePointPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mClosePriceTrianglePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Paint mClosePriceRightTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    // Prediction paints
    private Paint mPredictionLinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mPredictionLabelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mPredictionGradientPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    // Prediction selection state
    protected String mSelectedPredictionType = null;
    protected Integer mSelectedPredictionIndex = null;
    public OnPredictionSelectListener mOnPredictionSelectListener = null;

    public interface OnPredictionSelectListener {
        void onPredictionSelect(java.util.Map<String, Object> payload);
    }

    private LottieDrawable lottieDrawable = new LottieDrawable();

    private String lastLoadLottieSource = "";

    private static final int PRICE_TICK_COUNT = 6;
    private static final float GRID_MIN_V_SPACING_DP = 84f;
    private final List<Float> priceGridLevels = new ArrayList<>();

    private int mSelectedIndex;

    private IChartDraw mMainDraw;
    private MainDraw mainDraw;
    private IChartDraw mVolDraw;

    public Boolean isMinute = false;

    private Boolean isWR = false;
    private Boolean isShowChild = false;

    //当前点的个数
    private int mItemCount;
    private IChartDraw mChildDraw;
    private List<IChartDraw> mChildDraws = new ArrayList<>();

    private IValueFormatter mValueFormatter;
    private IDateTimeFormatter mDateTimeFormatter;

    private ValueAnimator mAnimator;

    private long mAnimationDuration = 500;

    private float mOverScrollRange = 0;

    private OnSelectedChangedListener mOnSelectedChangedListener = null;

    private Rect mMainRect;

    private Rect mVolRect;

    private Rect mChildRect;

    private float mLineWidth;

    public BaseKLineChartView(Context context, HTKLineConfigManager configManager) {
        super(context);
        this.configManager = configManager;
        init();
    }

    private void init() {
        setWillNotDraw(false);
        drawContext = new HTDrawContext(this, configManager);




        mDetector = new GestureDetectorCompat(getContext(), this);
        mScaleDetector = new ScaleGestureDetector(getContext(), this);
//        mTopPadding = (int) getResources().getDimension(R.dimen.chart_top_padding);
//        mChildPadding = (int) getResources().getDimension(R.dimen.child_top_padding);
//        mBottomPadding = (int) getResources().getDimension(R.dimen.chart_bottom_padding);


        mAnimator = ValueAnimator.ofFloat(0f, 1f);
        mAnimator.setDuration(mAnimationDuration);
        mAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(ValueAnimator animation) {
                // invalidate();
            }
        });

        mSelectorFramePaint.setStrokeWidth(ViewUtil.Dp2Px(getContext(), 0.6f));
        mSelectorFramePaint.setStyle(Paint.Style.STROKE);
        mSelectorFramePaint.setColor(Color.WHITE);

        mClosePriceLinePaint.setStyle(Paint.Style.STROKE);
        mClosePriceLinePaint.setAntiAlias(true);
        mClosePriceLinePaint.setStrokeWidth(ViewUtil.Dp2Px(getContext(), 0.7f));
        mClosePriceLinePaint.setPathEffect(new DashPathEffect(new float[]{8, 8}, 0));

        mClosePricePointPaint.setStrokeWidth(1);

        mClosePriceTrianglePaint.setStyle(Paint.Style.FILL);

        // Prediction paint setup
        mPredictionLinePaint.setStyle(Paint.Style.STROKE);
        mPredictionLinePaint.setAntiAlias(true);
        mPredictionLinePaint.setStrokeWidth(ViewUtil.Dp2Px(getContext(), 1.5f));
        mPredictionLinePaint.setPathEffect(new DashPathEffect(new float[]{12, 8}, 0));

        mPredictionLabelPaint.setAntiAlias(true);
        mPredictionLabelPaint.setTextSize(ViewUtil.Dp2Px(getContext(), 10f));

        mPredictionGradientPaint.setStyle(Paint.Style.FILL);
        mPredictionGradientPaint.setAntiAlias(true);

    }

    @Override
    public void invalidateDrawable(Drawable drawable) {
        super.invalidateDrawable(drawable);
        if (isMinute) {
            this.invalidate();
        }
    }

    private void initLottieView() {
    	String jsonString = configManager.closePriceRightLightLottieSource;
    	if (lastLoadLottieSource == jsonString) {
    		return;
    	}
    	lastLoadLottieSource = jsonString;
        lottieDrawable.setCallback(this);
        
        final float scale = configManager.closePriceRightLightLottieScale;
        if (jsonString.length() > 0) {
            lottieDrawable.setImagesAssetsFolder(configManager.closePriceRightLightLottieFloder);
            LottieCompositionFactory.fromJsonString(jsonString, null).addListener(new LottieListener<LottieComposition>() {
                @Override
                public void onResult(LottieComposition composition) {
                    lottieDrawable.setComposition(composition);
                    lottieDrawable.setRepeatCount(Integer.MAX_VALUE);
                    lottieDrawable.setScale(scale);
                    lottieDrawable.playAnimation();
                }
            });
        }
    }


    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        this.mWidth = w;
        notifyChanged();
    }


    private void initRect() {
        mTopPadding = (int) configManager.paddingTop;
        mChildPadding = 50;
        mBottomPadding = (int) configManager.paddingBottom;
        Paint.FontMetrics fm = mTextPaint.getFontMetrics();
        int textHeight = (int)((fm.descent - fm.ascent) / 2.0);


        int allHeight = this.getHeight() - mBottomPadding;
        int mMainHeight = (int) (allHeight * configManager.mainFlex);
        int mVolHeight = (int) (allHeight * configManager.volumeFlex);
        int mChildHeight = (int) (allHeight * (1 - configManager.mainFlex - configManager.volumeFlex));
        mMainRect = new Rect(0, mTopPadding - textHeight, mWidth, mMainHeight - textHeight);
        mVolRect = new Rect(0, mMainRect.bottom + textHeight + mChildPadding, mWidth, mMainRect.bottom + textHeight + mVolHeight);
        mChildRect = new Rect(0, mVolRect.bottom + mChildPadding, mWidth, mVolRect.bottom + mChildHeight);
        if (!isShowChild) {
            mChildRect.top = mVolRect.bottom;
            mChildRect.bottom = mVolRect.bottom;
        }
        
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
//        canvas.drawColor(mBackgroundPaint.getColor());

        if (mWidth == 0 || mMainRect.height() == 0) {
            return;
        }
        calculateValue();
        canvas.save();
        canvas.scale(1, 1);
        drawGird(canvas);
        if (mItemCount > 0) {
            drawK(canvas);
            drawText(canvas);
            drawMaxAndMin(canvas);
            drawValue(canvas, isLongPress ? mSelectedIndex : mStopIndex);
            drawClosePriceLine(canvas);
            drawPrediction(canvas);
            drawSelector(canvas);
        }
        canvas.restore();


//        Path path = new Path();
//        path.addRect(0, mMainRect.top, getMaxScrollX() + getWidth(), mMainRect.bottom, Path.Direction.CW);
//        canvas.clipPath(path);
        drawContext.onDraw(canvas);
    }

    public float yFromValue(float value) {
        if (mItemCount <= 0) {
            return value;
        }
    	float distance = (mMainMaxValue - value) * mMainScaleY;
    	if (mMainMaxValue == mMainMinValue && value == mMainMinValue) {
    		distance = mMainRect.height() * 0.5f;
    	}
        return distance + mMainRect.top;
    }

    public float valueFromY(float y) {
        if (mItemCount <= 0) {
            return y;
        }
        float value = mMainMaxValue - ((y - mMainRect.top) / mMainScaleY);
        if (mMainMaxValue == mMainMinValue && value == mMainMinValue) {
            value = mMainMinValue;
        }
        return value;
    }

    public float xFromValue(float value) {
        if (mItemCount < 2) {
            return value;
        }
        KLineEntity firstItem = getItem(0);
        KLineEntity lastItem = getItem(mItemCount - 1);
        float scale = (lastItem.id - firstItem.id) / (configManager.itemWidth * (mItemCount - 1));
        float x = (value - firstItem.id) / scale + configManager.itemWidth / 2.0f - mScrollX;
        return x;
    }

    public float valueFromX(float x) {
        if (mItemCount < 2) {
            return x;
        }
        KLineEntity firstItem = getItem(0);
        KLineEntity lastItem = getItem(mItemCount - 1);
        float scale = (lastItem.id - firstItem.id) / (configManager.itemWidth * (mItemCount - 1));
        float value = scale * (x + mScrollX - configManager.itemWidth / 2.0f) + firstItem.id;
        return value;
    }

    public HTPoint valuePointFromViewPoint(HTPoint point) {
        return new HTPoint(valueFromX(point.x), valueFromY(point.y));
    }

    public HTPoint viewPointFromValuePoint(HTPoint point) {
        return new HTPoint(xFromValue(point.x), yFromValue(point.y));
    }

    public float getMainBottom() {
        return mMainRect.bottom;
    }

    public float getVolY(float value) {
        return (mVolMaxValue - value) * mVolScaleY + mVolRect.top;
    }

    public float getChildY(float value) {
        return (mChildMaxValue - value) * mChildScaleY + mChildRect.top;
    }

    /**
     * 解决text居中的问题
     */
    public float fixTextY(float y) {
        Paint.FontMetrics fontMetrics = mTextPaint.getFontMetrics();
        return y + fontMetrics.descent - fontMetrics.ascent;
    }

    /**
     * 解决text居中的问题
     */
    public float fixTextY1(float y) {
        Paint.FontMetrics fontMetrics = mTextPaint.getFontMetrics();
        return (y + (fontMetrics.descent - fontMetrics.ascent) / 2 - fontMetrics.descent);
    }

    /**
     * 画表格
     *
     * @param canvas
     */
    private void drawGird(Canvas canvas) {
        if (mWidth == 0 || mMainRect == null || mVolRect == null || mItemCount <= 0) {
            return;
        }

        // Horizontal price grid
        priceGridLevels.clear();
        float minPrice = mMainMinValue;
        float maxPrice = mMainMaxValue;
        float range = maxPrice - minPrice;
        if (range > 0 && PRICE_TICK_COUNT >= 2) {
            int levelsCount = Math.max(2, PRICE_TICK_COUNT);
            float step = range / (levelsCount - 1);
            for (int i = 0; i < levelsCount; i++) {
                float value = minPrice + step * i;
                priceGridLevels.add(value);
                float y = yFromValue(value);
                canvas.drawLine(0, y, mWidth, y, mGridPaint);
            }
        }

        // Separators main/vol/child
        canvas.drawLine(0, mVolRect.bottom, mWidth, mVolRect.bottom, mGridPaint);
        if (mChildDraw != null && mChildRect != null) {
            canvas.drawLine(0, mChildRect.bottom, mWidth, mChildRect.bottom, mGridPaint);
        }

        // Vertical time grid
        float itemWidthPx = mPointWidth * mScaleX;
        float minSpacingPx = dp2px(GRID_MIN_V_SPACING_DP);
        int step = niceCandleStep(itemWidthPx, minSpacingPx);
        if (step < 1) step = 1;
        int firstIndex = (mStartIndex / step) * step;

        int baseColor = mGridPaint.getColor();
        int alpha = Math.round(Color.alpha(baseColor) * 0.7f);
        int verticalColor = Color.argb(alpha, Color.red(baseColor), Color.green(baseColor), Color.blue(baseColor));
        Paint verticalPaint = new Paint(mGridPaint);
        verticalPaint.setColor(verticalColor);

        int bottom = mChildRect != null ? mChildRect.bottom : mVolRect.bottom;

        for (int i = firstIndex; i <= mStopIndex; i += step) {
            float centerScrollX = getItemMiddleScrollX(i);
            float x = scrollXtoViewX(centerScrollX);
            canvas.drawLine(x, mMainRect.top, x, bottom, verticalPaint);
        }
    }

    private void drawClosePriceLine(Canvas canvas) {
        if (mItemCount <= 0) {
            return;
        }
        float paddingRight = this.configManager.paddingRight;
        IKLine point = (IKLine) getItem(mItemCount - 1);
        float price = point.getClosePrice();
        String text = mainDraw.getValueFormatter().format(price);
        float width = calculateWidth(text);
        Paint.FontMetrics fm = mTextPaint.getFontMetrics();
        float height = fm.descent - fm.ascent;
        float y = yFromValue(price);
        float x = scrollXtoViewX(getItemMiddleScrollX(mItemCount - 1) + mPointWidth * 0.5f);



        if (x > mWidth - width) {
            mClosePriceLinePaint.setColor(configManager.closePriceCenterSeparatorColor);
            mClosePriceTrianglePaint.setColor(configManager.closePriceCenterTriangleColor);
            float paddingX = 20;
            float paddingY = 14;
            y = Math.max(mMainRect.top + height / 2 + paddingY, y);
            y = Math.min(getMainBottom() - height / 2 - paddingY, y);

            float triangleWidth = 14;
            float triangleHeight = 20;
            float triangleMarginLeft = 10;
            float containerWidth = paddingX * 2 + width + triangleWidth + triangleMarginLeft;

            float marginRight = paddingRight - containerWidth / 2;
            float textX = mWidth - paddingRight - containerWidth / 2 + paddingX;

            RectF rect = new RectF(textX - paddingX, y - height / 2 - paddingY, mWidth - marginRight, y + height / 2 + paddingY);
            canvas.drawLine(0, y, mWidth, y, mClosePriceLinePaint);
            float radius = (paddingY * 2 + height) / 2;
            mClosePricePointPaint.setColor(configManager.closePriceCenterBackgroundColor);
            mClosePricePointPaint.setStyle(Paint.Style.FILL);
            canvas.drawRoundRect(rect,radius,radius, mClosePricePointPaint);
            mClosePricePointPaint.setColor(configManager.closePriceCenterBorderColor);
            mClosePricePointPaint.setStyle(Paint.Style.STROKE);
            canvas.drawRoundRect(rect,radius,radius, mClosePricePointPaint);
            canvas.drawText(text, textX, fixTextY1(y), mTextPaint);
            Path path = new Path();
            float triangleMarginTop = (rect.bottom - rect.top - triangleHeight) / 2;
            path.moveTo(rect.right - paddingX - triangleWidth, triangleMarginTop + rect.top);
            path.lineTo(rect.right - paddingX - triangleWidth, rect.bottom - triangleMarginTop);
            path.lineTo(rect.right - paddingX, (rect.bottom - rect.top) / 2 + rect.top);
            path.close();
            canvas.drawPath(path, mClosePriceTrianglePaint);
        } else {
            mClosePriceLinePaint.setColor(configManager.closePriceRightSeparatorColor);
            mClosePricePointPaint.setColor(configManager.closePriceRightBackgroundColor);
            mClosePricePointPaint.setStyle(Paint.Style.FILL);
            mClosePriceRightTextPaint.setColor(configManager.closePriceRightSeparatorColor);

            canvas.drawLine(x, y, mWidth, y, mClosePriceLinePaint);
            canvas.drawRect(mWidth - width, y - height / 2, mWidth, y + height / 2, mClosePricePointPaint);
            canvas.drawText(text, mWidth - width, fixTextY1(y), mClosePriceRightTextPaint);

            if (isMinute) {
                int lottieWidth = lottieDrawable.getIntrinsicWidth();
                int lottieHeight = lottieDrawable.getIntrinsicHeight();
                canvas.save();
                canvas.translate((int)x - lottieWidth / 2, (int)y - lottieHeight / 2);
                lottieDrawable.draw(canvas);
                canvas.restore();
            }

        }

    }

    /**
     * Draw prediction visualization (Entry, SL, TP lines with gradients)
     */
    private void drawPrediction(Canvas canvas) {
        if (configManager.predictionEntry == null || configManager.predictionStartTime == null) {
            return;
        }
        if (configManager.modelArray.isEmpty()) {
            return;
        }

        // Find target index by predictionStartTime
        int targetIndex = -1;
        long startTime = configManager.predictionStartTime.longValue();
        for (int i = 0; i < configManager.modelArray.size(); i++) {
            KLineEntity entity = configManager.modelArray.get(i);
            if (entity.id >= startTime) {
                targetIndex = i;
                break;
            }
        }
        if (targetIndex < 0) {
            targetIndex = configManager.modelArray.size() - 1;
        }

        int count = configManager.modelArray.size();
        float entryPrice = configManager.predictionEntry.floatValue();
        float entryY = yFromValue(entryPrice);

        // Calculate background extension
        int bgExtension = Math.max(count - 1 - targetIndex, 10);
        float startX = scrollXtoViewX(getItemMiddleScrollX(targetIndex));
        float endX = startX + bgExtension * mPointWidth * mScaleX;
        float paddingRight = configManager.paddingRight;
        float rightBound = mWidth - paddingRight;

        // Clamp endX
        endX = Math.min(endX, rightBound);

        // --- Draw Gradient Zones ---
        String bias = configManager.predictionBias;

        // SL Zone (Red Gradient)
        if (configManager.predictionStopLoss != null) {
            float slPrice = configManager.predictionStopLoss.floatValue();
            float slY = yFromValue(slPrice);
            float top = Math.min(entryY, slY);
            float bottom = Math.max(entryY, slY);

            int startColor = Color.argb(50, 230, 50, 50);
            int endColor = Color.argb(10, 230, 50, 50);
            LinearGradient gradient = new LinearGradient(startX, entryY, startX, slY,
                    startColor, endColor, Shader.TileMode.CLAMP);
            mPredictionGradientPaint.setShader(gradient);
            canvas.drawRect(startX, top, endX, bottom, mPredictionGradientPaint);
        }

        // TP Zone (Green Gradient)
        if (!configManager.predictionList.isEmpty()) {
            float extremeTarget = entryPrice;
            for (java.util.Map<String, Object> prediction : configManager.predictionList) {
                Object valObj = prediction.get("value");
                if (valObj instanceof Number) {
                    float val = ((Number) valObj).floatValue();
                    if (bias != null && bias.equalsIgnoreCase("bullish")) {
                        extremeTarget = Math.max(extremeTarget, val);
                    } else if (bias != null && bias.equalsIgnoreCase("bearish")) {
                        extremeTarget = Math.min(extremeTarget, val);
                    } else {
                        // Default: furthest from entry
                        if (Math.abs(val - entryPrice) > Math.abs(extremeTarget - entryPrice)) {
                            extremeTarget = val;
                        }
                    }
                }
            }
            float targetY = yFromValue(extremeTarget);
            float top = Math.min(entryY, targetY);
            float bottom = Math.max(entryY, targetY);

            int startColor = Color.argb(50, 76, 175, 80);
            int endColor = Color.argb(10, 76, 175, 80);
            LinearGradient gradient = new LinearGradient(startX, entryY, startX, targetY,
                    startColor, endColor, Shader.TileMode.CLAMP);
            mPredictionGradientPaint.setShader(gradient);
            canvas.drawRect(startX, top, endX, bottom, mPredictionGradientPaint);
        }

        // --- Draw Entry Line (Yellow) ---
        boolean isEntrySelected = "entry".equals(mSelectedPredictionType);
        int entryColor = Color.rgb(255, 204, 0); // Gold/Yellow
        mPredictionLinePaint.setColor(entryColor);
        mPredictionLinePaint.setStrokeWidth(ViewUtil.Dp2Px(getContext(), isEntrySelected ? 3f : 1.5f));
        canvas.drawLine(startX, entryY, endX, entryY, mPredictionLinePaint);
        drawPredictionLabel(canvas, "Entry", entryPrice, endX, entryY, entryColor, Color.BLACK);

        // --- Draw SL Line (Red) ---
        if (configManager.predictionStopLoss != null) {
            float slPrice = configManager.predictionStopLoss.floatValue();
            float slY = yFromValue(slPrice);
            boolean isSlSelected = "sl".equals(mSelectedPredictionType);
            int slColor = Color.rgb(244, 67, 54); // Red
            mPredictionLinePaint.setColor(slColor);
            mPredictionLinePaint.setStrokeWidth(ViewUtil.Dp2Px(getContext(), isSlSelected ? 3f : 1.5f));
            canvas.drawLine(startX, slY, endX, slY, mPredictionLinePaint);
            drawPredictionLabel(canvas, "SL", slPrice, endX, slY, slColor, Color.WHITE);
        }

        // --- Draw TP Lines (Green) ---
        for (int i = 0; i < configManager.predictionList.size(); i++) {
            java.util.Map<String, Object> prediction = configManager.predictionList.get(i);
            Object valObj = prediction.get("value");
            Object colorObj = prediction.get("color");

            if (!(valObj instanceof Number)) continue;

            float tpPrice = ((Number) valObj).floatValue();
            float tpY = yFromValue(tpPrice);
            int tpColor = Color.rgb(76, 175, 80); // Default green
            if (colorObj instanceof Number) {
                tpColor = ((Number) colorObj).intValue();
            }

            boolean isTpSelected = "tp".equals(mSelectedPredictionType) && mSelectedPredictionIndex != null && mSelectedPredictionIndex == i;
            mPredictionLinePaint.setColor(tpColor);
            mPredictionLinePaint.setStrokeWidth(ViewUtil.Dp2Px(getContext(), isTpSelected ? 3f : 1.5f));

            // Draw diagonal line from entry to target
            canvas.drawLine(startX, entryY, endX, tpY, mPredictionLinePaint);
            drawPredictionLabel(canvas, "TP", tpPrice, endX, tpY, tpColor, Color.WHITE);
        }

        // Draw bias label
        if (bias != null) {
            String labelText = bias.equalsIgnoreCase("bullish") ? "LONG" : "SHORT";
            int labelColor = bias.equalsIgnoreCase("bullish") ? Color.rgb(76, 175, 80) : Color.rgb(244, 67, 54);
            mPredictionLabelPaint.setColor(labelColor);
            mPredictionLabelPaint.setTextSize(ViewUtil.Dp2Px(getContext(), 12f));
            canvas.drawText(labelText, startX + 10, mMainRect.top + 20, mPredictionLabelPaint);
        }
    }

    private void drawPredictionLabel(Canvas canvas, String prefix, float price, float x, float y, int bgColor, int textColor) {
        String text = prefix + " " + formatValue(price);
        float textWidth = mPredictionLabelPaint.measureText(text);
        float paddingX = ViewUtil.Dp2Px(getContext(), 4f);
        float paddingY = ViewUtil.Dp2Px(getContext(), 2f);
        Paint.FontMetrics fm = mPredictionLabelPaint.getFontMetrics();
        float textHeight = fm.descent - fm.ascent;

        float labelX = x + ViewUtil.Dp2Px(getContext(), 2f);
        float labelY = y - textHeight / 2;
        float labelRight = labelX + textWidth + paddingX * 2;
        float labelBottom = labelY + textHeight + paddingY * 2;

        // Background
        mPredictionGradientPaint.setShader(null);
        mPredictionGradientPaint.setColor(bgColor);
        RectF rect = new RectF(labelX, labelY, labelRight, labelBottom);
        canvas.drawRoundRect(rect, ViewUtil.Dp2Px(getContext(), 3f), ViewUtil.Dp2Px(getContext(), 3f), mPredictionGradientPaint);

        // Text
        mPredictionLabelPaint.setColor(textColor);
        canvas.drawText(text, labelX + paddingX, labelY + paddingY + textHeight - fm.descent, mPredictionLabelPaint);
    }


    /**
     * 画k线图
     *
     * @param canvas
     */
    private void drawK(Canvas canvas) {
        //保存之前的平移，缩放
        canvas.save();
        canvas.translate(-mScrollX * mScaleX, 0);
        canvas.scale(mScaleX, 1);
        mainDraw.drawMinuteMinute(mTopPadding, mStartIndex, getMainBottom(), mStopIndex, canvas, this);
        for (int i = mStartIndex; i <= mStopIndex; i++) {
            if (i < 0 || i >= configManager.modelArray.size()) {
                continue;
            }
            Object currentPoint = getItem(i);
            float currentPointX = getItemMiddleScrollX(i);
            Object lastPoint = i == 0 ? currentPoint : getItem(i - 1);
            float lastX = i == 0 ? currentPointX : getItemMiddleScrollX(i - 1);
            if (mMainDraw != null) {
                mMainDraw.drawTranslated(lastPoint, currentPoint, lastX, currentPointX, canvas, this, i);
            }
            if (mVolDraw != null) {
                mVolDraw.drawTranslated(lastPoint, currentPoint, lastX, currentPointX, canvas, this, i);
            }
            if (mChildDraw != null) {
                mChildDraw.drawTranslated(lastPoint, currentPoint, lastX, currentPointX, canvas, this, i);
            }
        }

        //还原 平移缩放
        canvas.restore();
    }

    /**
     * 计算文本长度
     *
     * @return
     */
    private int calculateWidth(String text) {
        Rect rect = new Rect();
        mTextPaint.getTextBounds(text, 0, text.length(), rect);
        return rect.width() + 5;
    }

    /**
     * 计算文本长度
     *
     * @return
     */
    private Rect calculateMaxMin(String text) {
        Rect rect = new Rect();
        mMaxMinPaint.getTextBounds(text, 0, text.length(), rect);
        return rect;
    }

    /**
     * 画文字
     *
     * @param canvas
     */
    private void drawText(Canvas canvas) {
        Paint.FontMetrics fm = mTextPaint.getFontMetrics();
        float textHeight = fm.descent - fm.ascent;
        float baseLine = (textHeight - fm.bottom - fm.top) / 2;
        //--------------画上方k线图的值-------------
        if (mMainDraw != null) {
            if (!priceGridLevels.isEmpty()) {
                for (Float v : priceGridLevels) {
                    if (v == null) continue;
                    String text = formatValue(v);
                    float textWidth = calculateWidth(text);
                    float y = yFromValue(v);
                    float labelY = y - textHeight / 2f;
                    canvas.drawText(text, mWidth - textWidth, fixTextY1(labelY), mTextPaint);
                }
            }
        }
        //--------------画中间子图的值-------------
        if (mVolDraw != null) {
            IValueFormatter formatter = mVolDraw.getValueFormatter();
            if (formatter instanceof ValueFormatter) {
                ValueFormatter valueFormatter = (ValueFormatter)formatter;
                String formatValue = valueFormatter.formatVolume(mVolMaxValue);
                canvas.drawText(formatValue,
                        mWidth - calculateWidth(formatValue), mVolRect.top + baseLine, mTextPaint);
            }
            /*canvas.drawText(mVolDraw.getValueFormatter().format(mVolMinValue),
                    mWidth - calculateWidth(formatValue(mVolMinValue)), mVolRect.bottom, mTextPaint);*/
        }
        //--------------画下方子图的值-------------
        if (mChildDraw != null) {
            IValueFormatter formatter = mChildDraw.getValueFormatter();
            if (formatter instanceof ValueFormatter) {
                ValueFormatter valueFormatter = (ValueFormatter)formatter;
                String formatValue = valueFormatter.format(mChildMaxValue);
                canvas.drawText(formatValue,
                        mWidth - calculateWidth(formatValue), mVolRect.bottom + baseLine, mTextPaint);
            }
            /*canvas.drawText(mChildDraw.getValueFormatter().format(mChildMinValue),
                    mWidth - calculateWidth(formatValue(mChildMinValue)), mChildRect.bottom, mTextPaint);*/
        }
        //--------------画时间---------------------
        float y = fixTextY1((float) (mChildRect.bottom + mBottomPadding / 2.0));
        if (mItemCount > 0) {
            float itemWidthPx = mPointWidth * mScaleX;
            float minSpacingPx = dp2px(GRID_MIN_V_SPACING_DP);
            int step = niceCandleStep(itemWidthPx, minSpacingPx);
            if (step < 1) step = 1;
            int firstIndex = (mStartIndex / step) * step;
            for (int i = firstIndex; i <= mStopIndex; i += step) {
                KLineEntity entity = getItem(i);
                String text = entity.Date;
                float centerScrollX = getItemMiddleScrollX(i);
                float x = scrollXtoViewX(centerScrollX);
                canvas.drawText(text, x - mTextPaint.measureText(text) / 2f, y, mTextPaint);
            }
        }

    }

    private void drawSelector(Canvas canvas) {
        if (!isLongPress) {
            return;
        }
        Paint.FontMetrics fm = mTextPaint.getFontMetrics();
        float textHeight = fm.descent - fm.ascent;
        float baseLine = (textHeight - fm.bottom - fm.top) / 2;

        mSelectPointPaint.setColor(configManager.panelBackgroundColor);
        // 画Y值
        IKLine point = (IKLine) getItem(mSelectedIndex);
        float w1 = ViewUtil.Dp2Px(getContext(), 5);
        float w2 = ViewUtil.Dp2Px(getContext(), 3);
        float r = textHeight / 2 + w2;
        float triangleWidth = 10;
        float y = yFromValue(point.getClosePrice());
        float x;
        float startX;
        float endX;
        String text = formatValue(point.getClosePrice());
        float textWidth = mTextPaint.measureText(text);
        if (scrollXtoViewX(getItemMiddleScrollX(mSelectedIndex)) < getChartWidth() / 2) {
            x = 1;
            startX = textWidth + 2 * w1 + w2 + triangleWidth;
            endX = mWidth;
            Path path = new Path();
            path.moveTo(x, y - r);
            path.lineTo(x, y + r);
            path.lineTo(textWidth + 2 * w1, y + r);
            path.lineTo(startX, y);
            path.lineTo(textWidth + 2 * w1, y - r);
            path.close();
            canvas.drawPath(path, mSelectPointPaint);
            canvas.drawPath(path, mSelectorFramePaint);
            canvas.drawText(text, x + w1, fixTextY1(y), mMaxMinPaint);
        } else {
            x = mWidth - textWidth - 1 - 2 * w1 - w2 - triangleWidth;
            startX = 0;
            endX = x;

            Path path = new Path();
            path.moveTo(x, y);
            path.lineTo(x + w2 + triangleWidth, y + r);
            path.lineTo(mWidth - 2, y + r);
            path.lineTo(mWidth - 2, y - r);
            path.lineTo(x + w2 + triangleWidth, y - r);
            path.close();

            canvas.drawPath(path, mSelectPointPaint);
            canvas.drawPath(path, mSelectorFramePaint);
            canvas.drawText(text, x + w1 + w2, fixTextY1(y), mMaxMinPaint);
        }

        // k线图横线
        canvas.drawLine(startX, y,  endX, y, mSelectedXLinePaint);


        // k线图竖线
        mSelectedXLinePaint.setStrokeWidth(1.5f);
        mSelectedXLinePaint.setColor(configManager.candleTextColor);

        // 柱状图竖线
        LinearGradient linearGradient = new LinearGradient(
            0,
            0,
            0,
            mChildRect.bottom - mMainRect.top,
            configManager.panelGradientColorList,
            configManager.panelGradientLocationList,
            Shader.TileMode.CLAMP
        );
        mSelectedYLinePaint.setShader(linearGradient);

        float pointX = scrollXtoViewX(getItemMiddleScrollX(mSelectedIndex));
        mSelectedYLinePaint.setStrokeWidth(mScaleX * configManager.candleWidth);
        canvas.drawLine(pointX, 0, pointX, mChildRect.bottom, mSelectedYLinePaint);



        mSelectCenterPaint.setColor(configManager.selectedPointContentColor);
        mSelectCenterBackgroundPaint.setColor(configManager.selectedPointContainerColor);
        float radiusX = 6 * this.mScaleX;
        float radiusY = 6 * this.mScaleX;
        RectF rect = new RectF(pointX - radiusX, y - radiusY, pointX + radiusX, y + radiusY);
        radiusX *= 3;
        radiusY *= 3;
        RectF backgroundRect = new RectF(pointX - radiusX, y - radiusY, pointX + radiusX, y + radiusY);
        if (pointX > startX && pointX < endX) {
            canvas.drawOval(backgroundRect, mSelectCenterBackgroundPaint);
            canvas.drawOval(rect, mSelectCenterPaint);
        }



        // 画X值
        String date = getItem(mSelectedIndex).Date;
        textWidth = mMaxMinPaint.measureText(date);
        r = textHeight / 2;
        x = scrollXtoViewX(getItemMiddleScrollX(mSelectedIndex));
        y = mChildRect.bottom;

        if (x < textWidth + 2 * w1) {
            x = 1 + textWidth / 2 + w1;
        } else if (mWidth - x < textWidth + 2 * w1) {
            x = mWidth - 1 - textWidth / 2 - w1;
        }

        canvas.drawRect(x - textWidth / 2 - w1, y, x + textWidth / 2 + w1, y + mBottomPadding, mSelectPointPaint);
        canvas.drawRect(x - textWidth / 2 - w1, y, x + textWidth / 2 + w1, y + mBottomPadding, mSelectorFramePaint);
        canvas.drawText(date, x - textWidth / 2, fixTextY1(y + (mBottomPadding / 2)), mMaxMinPaint);
        mainDraw.drawSelector(this, canvas);
    }

    private void drawMaxMinValue(Canvas canvas, float value, float x, float y) {
        IValueFormatter formatter = this.getValueFormatter();
        String valueString = formatter.format(value);
        int height = calculateMaxMin(valueString).height();
        y += height / 2;
        String lineString = "---";
        if (x < getWidth() / 2) {
            valueString = lineString + valueString;
        } else {
            valueString = valueString + lineString;
            float width = mMaxMinPaint.measureText(valueString);
            x -= width;
        }
        canvas.drawText(valueString, x, y, mMaxMinPaint);
    }

    /**
     * 画文字
     *
     * @param canvas
     */
    private void drawMaxAndMin(Canvas canvas) {
        if (!isMinute) {
            //绘制最大值和最小值
            float x = scrollXtoViewX(getItemMiddleScrollX(mMainMinIndex));
            float y = yFromValue(mMainLowMinValue);
            drawMaxMinValue(canvas, mMainLowMinValue, x, y);

            x = scrollXtoViewX(getItemMiddleScrollX(mMainMaxIndex));
            y = yFromValue(mMainHighMaxValue);
            drawMaxMinValue(canvas, mMainHighMaxValue, x, y);

        }
    }

    /**
     * 画值
     *
     * @param canvas
     * @param position 显示某个点的值
     */
    private void drawValue(Canvas canvas, int position) {
        Paint.FontMetrics fm = mTextPaint.getFontMetrics();
        float textHeight = fm.descent - fm.ascent;
        float baseLine = (textHeight - fm.bottom - fm.top) / 2;
        float x = 10;
        if (position >= 0 && position < mItemCount) {
            if (mMainDraw != null) {
                float y = textHeight + 15;
                mMainDraw.drawText(canvas, this, position, x, y);
            }
            if (mVolDraw != null) {
                float y = mVolRect.top - mChildPadding + textHeight;
                mVolDraw.drawText(canvas, this, position, x, y);
            }
            if (mChildDraw != null) {
                float y = mVolRect.bottom + textHeight;
                mChildDraw.drawText(canvas, this, position, x, y);
            }
        }
    }

    public int dp2px(float dp) {
        final float scale = getContext().getResources().getDisplayMetrics().density;
        return (int) (dp * scale + 0.5f);
    }

    public int sp2px(float spValue) {
        final float fontScale = getContext().getResources().getDisplayMetrics().scaledDensity;
        return (int) (spValue * fontScale + 0.5f);
    }

    private int niceCandleStep(float itemWidthPx, float minSpacingPx) {
        if (itemWidthPx <= 0f) return 1;
        int raw = (int) Math.ceil(minSpacingPx / itemWidthPx);
        if (raw < 1) raw = 1;

        int mag = 1;
        int r = raw;
        while (r > 5) {
            r = (r + 9) / 10;
            mag *= 10;
        }

        int[] bases = {1, 2, 3, 5};
        for (int b : bases) {
            if (b >= r) return b * mag;
        }
        return 5 * mag;
    }

    /**
     * 格式化值
     */
    public String formatValue(float value) {
        if (getValueFormatter() == null) {
            setValueFormatter(new ValueFormatter());
        }
        return getValueFormatter().format(value);
    }

    /**
     * 重新计算并刷新线条
     */
    public void notifyChanged() {
        mItemCount = configManager.modelArray.size();
        mDataLen = mItemCount * mPointWidth;
        if (isShowChild && mChildDrawPosition == -1) {
            mChildDraw = mChildDraws.get(0);
            mChildDrawPosition = 0;
        }
        if (mItemCount != 0) {
            mDataLen = mItemCount * mPointWidth;
            checkAndFixScrollX();
        }
        if (mSelectedIndex >= mItemCount) {
            isLongPress = false;
        }
        initRect();
        initLottieView();
        invalidate();
    }

    /**
     * MA/BOLL切换及隐藏
     *
     * @param primaryStatus MA/BOLL/NONE
     */
    public void changeMainDrawType(PrimaryStatus primaryStatus) {
        if (mainDraw != null && mainDraw.getPrimaryStatus() != primaryStatus) {
            mainDraw.setPrimaryStatus(primaryStatus);
            // invalidate();
        }
    }

    private void calculateSelectedX(float x) {
        mSelectedIndex = indexFromScrollX(viewXToScrollX(x));
        if (mSelectedIndex < mStartIndex) {
            mSelectedIndex = mStartIndex;
        }
        if (mSelectedIndex > mStopIndex) {
            mSelectedIndex = mStopIndex;
        }
    }

    @Override
    public void onLongPress(MotionEvent e) {
        super.onLongPress(e);
        int lastIndex = mSelectedIndex;
        calculateSelectedX(e.getX());
        if (lastIndex != mSelectedIndex) {
            onSelectedChanged(this, getItem(mSelectedIndex), mSelectedIndex);
        }
        invalidate();
    }

    @Override
    protected void onScrollChanged(int l, int t, int oldl, int oldt) {
        super.onScrollChanged(l, t, oldl, oldt);
        if (mSelectedPredictionType != null) {
            mSelectedPredictionType = null;
            mSelectedPredictionIndex = null;
            if (mOnPredictionSelectListener != null) {
                mOnPredictionSelectListener.onPredictionSelect(new java.util.HashMap<>());
            }
        }
    }

    @Override
    protected void onScaleChanged(float scale, float oldScale) {
        checkAndFixScrollX();
        super.onScaleChanged(scale, oldScale);
    }

    /**
     * 计算当前的显示区域
     */
    private void calculateValue() {
        if (!isLongPress()) {
            mSelectedIndex = -1;
        }
        mMainMaxValue = Float.MIN_VALUE;
        mMainMinValue = Float.MAX_VALUE;
        mVolMaxValue = Float.MIN_VALUE;
        mVolMinValue = Float.MAX_VALUE;
        mChildMaxValue = Float.MIN_VALUE;
        mChildMinValue = Float.MAX_VALUE;
        mStartIndex = Math.min(Math.max(0, indexFromScrollX(viewXToScrollX(0))), mItemCount - 1);
        mStopIndex = Math.max(0, Math.min(indexFromScrollX(viewXToScrollX(mWidth)), mItemCount - 1));
        mMainMaxIndex = mStartIndex;
        mMainMinIndex = mStartIndex;
        mMainHighMaxValue = Float.MIN_VALUE;
        mMainLowMinValue = Float.MAX_VALUE;
        for (int i = mStartIndex; i <= mStopIndex; i++) {
            if (i < 0 || i >= configManager.modelArray.size()) {
                continue;
            }
            IKLine point = (IKLine) getItem(i);
            if (mMainDraw != null) {
                mMainMaxValue = Math.max(mMainMaxValue, mMainDraw.getMaxValue(point));
                mMainMinValue = Math.min(mMainMinValue, mMainDraw.getMinValue(point));
                if (mMainHighMaxValue != Math.max(mMainHighMaxValue, point.getHighPrice())) {
                    mMainHighMaxValue = point.getHighPrice();
                    mMainMaxIndex = i;
                }
                if (mMainLowMinValue != Math.min(mMainLowMinValue, point.getLowPrice())) {
                    mMainLowMinValue = point.getLowPrice();
                    mMainMinIndex = i;
                }
            }
            if (mVolDraw != null) {
                mVolMaxValue = Math.max(mVolMaxValue, mVolDraw.getMaxValue(point));
                mVolMinValue = Math.min(mVolMinValue, mVolDraw.getMinValue(point));
                // 成交量最小应该是 0 或者比最小成交量大一点点
                mVolMinValue = mVolMinValue - (mVolMaxValue - mVolMinValue) / 10.0f;
                mVolMinValue = Math.max(0, mVolMinValue);
            }
            if (mChildDraw != null) {
                mChildMaxValue = Math.max(mChildMaxValue, mChildDraw.getMaxValue(point));
                mChildMinValue = Math.min(mChildMinValue, mChildDraw.getMinValue(point));
            }
        }
//        if (mItemCount > 0) {
//            int i = mItemCount - 1;
//            IKLine point = (IKLine)getItem(i);
//            mMainMaxValue = Math.max(mMainMaxValue, mMainDraw.getMaxValue(point));
//            mMainMinValue = Math.min(mMainMinValue, mMainDraw.getMinValue(point));
//            if (mMainHighMaxValue != Math.max(mMainHighMaxValue, point.getHighPrice())) {
//                mMainHighMaxValue = point.getHighPrice();
//                mMainMaxIndex = i;
//            }
//            if (mMainLowMinValue != Math.min(mMainLowMinValue, point.getLowPrice())) {
//                mMainLowMinValue = point.getLowPrice();
//                mMainMinIndex = i;
//            }
//        }

        if (mMainMaxValue != mMainMinValue) {
//            float padding = (mMainMaxValue - mMainMinValue) * 0.05f;
//            padding = 0;
//            mMainMaxValue += padding;
//            mMainMinValue -= padding;
        } else {
            //当最大值和最小值都相等的时候 分别增大最大值和 减小最小值
//            mMainMaxValue += Math.abs(mMainMaxValue * 0.05f);
//            mMainMinValue -= Math.abs(mMainMinValue * 0.05f);
//            if (mMainMaxValue == 0) {
//                mMainMaxValue = 1;
//            }
        }

        if (Math.abs(mVolMaxValue) < 0.01) {
            mVolMaxValue = 15.00f;
        }

        // big number replace
//        if (Math.abs(mChildMaxValue) < 0.01 && Math.abs(mChildMinValue) < 0.01) {
//            mChildMaxValue = 1f;
//        } else
            if (mChildMaxValue.equals(mChildMinValue)) {
            //当最大值和最小值都相等的时候 分别增大最大值和 减小最小值
            mChildMaxValue += Math.abs(mChildMaxValue * 0.05f);
            mChildMinValue -= Math.abs(mChildMinValue * 0.05f);
            if (mChildMaxValue == 0) {
                mChildMaxValue = 1f;
            }
        }

        if (isWR) {
            mChildMaxValue = 0f;
            if (Math.abs(mChildMinValue) < 0.01)
                mChildMinValue = -10.00f;
        }

        // Expand Y-axis range to include prediction elements (Entry, SL, TPs)
        if (configManager.predictionEntry != null) {
            float entry = configManager.predictionEntry.floatValue();
            mMainMaxValue = Math.max(mMainMaxValue, entry);
            mMainMinValue = Math.min(mMainMinValue, entry);

            if (configManager.predictionStopLoss != null) {
                float sl = configManager.predictionStopLoss.floatValue();
                mMainMaxValue = Math.max(mMainMaxValue, sl);
                mMainMinValue = Math.min(mMainMinValue, sl);
            }

            for (java.util.Map<String, Object> prediction : configManager.predictionList) {
                Object valObj = prediction.get("value");
                if (valObj instanceof Number) {
                    float tp = ((Number) valObj).floatValue();
                    mMainMaxValue = Math.max(mMainMaxValue, tp);
                    mMainMinValue = Math.min(mMainMinValue, tp);
                }
            }

            // Add padding (5%) for better visibility
            float range = mMainMaxValue - mMainMinValue;
            if (range > 0) {
                float padding = range * 0.05f;
                mMainMaxValue += padding;
                mMainMinValue -= padding;
            }
        }

        mMainScaleY = mMainRect.height() * 1f / (mMainMaxValue - mMainMinValue);
        mVolScaleY = mVolRect.height() * 1f / (mVolMaxValue - mVolMinValue);
        if (mChildRect != null)
            mChildScaleY = mChildRect.height() * 1f / (mChildMaxValue - mChildMinValue);
        if (mAnimator.isRunning()) {
            float value = (float) mAnimator.getAnimatedValue();
            mStopIndex = mStartIndex + Math.round(value * (mStopIndex - mStartIndex));
        }
    }

    @Override
    public int getMinScrollX() {
//        return (int) -(mOverScrollRange / mScaleX);
        return 0;
    }

    public int getMaxScrollX() {
        float offsetWidth = configManager.rightOffsetCandles * mPointWidth;
        int contentWidth = (int) Math.max(((mDataLen + offsetWidth) - (mWidth - configManager.paddingRight) / mScaleX), 0);
        return contentWidth;
    }

    /**
     * 在主区域画线
     *
     * @param startX    开始点的横坐标
     * @param stopX     开始点的值
     * @param stopX     结束点的横坐标
     * @param stopValue 结束点的值
     */
    public void drawMainLine(Canvas canvas, Paint paint, float startX, float startValue, float stopX, float stopValue) {
        canvas.drawLine(startX, yFromValue(startValue), stopX, yFromValue(stopValue), paint);
    }

    /**
     * 在子区域画线
     *
     * @param startX     开始点的横坐标
     * @param startValue 开始点的值
     * @param stopX      结束点的横坐标
     * @param stopValue  结束点的值
     */
    public void drawChildLine(Canvas canvas, Paint paint, float startX, float startValue, float stopX, float stopValue) {
        canvas.drawLine(startX, getChildY(startValue), stopX, getChildY(stopValue), paint);
    }

    /**
     * 在子区域画线
     *
     * @param startX     开始点的横坐标
     * @param startValue 开始点的值
     * @param stopX      结束点的横坐标
     * @param stopValue  结束点的值
     */
    public void drawVolLine(Canvas canvas, Paint paint, float startX, float startValue, float stopX, float stopValue) {
        canvas.drawLine(startX, getVolY(startValue), stopX, getVolY(stopValue), paint);
    }

    /**
     * 根据索引获取实体
     *
     * @param position 索引值
     * @return
     */
    public KLineEntity getItem(int position) {
    	return configManager.modelArray.get(position);
    }

    /**
     * 根据索引索取x坐标
     *
     * @param position 索引值
     * @return
     */
    public float getItemMiddleScrollX(int position) {
        return position * mPointWidth + mPointWidth * 0.5f;
    }


    /**
     * 设置当前子图
     *
     * @param position
     */
    public void setChildDraw(int position) {
        if (mChildDrawPosition != position) {
            if (!isShowChild) {
                isShowChild = true;
                // initRect();
            }
            mChildDraw = mChildDraws.get(position);
            mChildDrawPosition = position;
            isWR = position == 5;
            // invalidate();
        }
    }

    /**
     * 隐藏子图
     */
    public void hideChildDraw() {
        mChildDrawPosition = -1;
        isShowChild = false;
        mChildDraw = null;
        // initRect();
        // invalidate();
    }

    /**
     * 给子区域添加画图方法
     *
     * @param childDraw IChartDraw
     */
    public void addChildDraw(IChartDraw childDraw) {
        mChildDraws.add(childDraw);
    }

    /**
     * 获取ValueFormatter
     *
     * @return
     */
    public IValueFormatter getValueFormatter() {
        return mValueFormatter;
    }

    /**
     * 设置ValueFormatter
     *
     * @param valueFormatter value格式化器
     */
    public void setValueFormatter(IValueFormatter valueFormatter) {
        this.mValueFormatter = valueFormatter;
    }

    /**
     * 获取DatetimeFormatter
     *
     * @return 时间格式化器
     */
    public IDateTimeFormatter getDateTimeFormatter() {
        return mDateTimeFormatter;
    }

    /**
     * 设置dateTimeFormatter
     *
     * @param dateTimeFormatter 时间格式化器
     */
    public void setDateTimeFormatter(IDateTimeFormatter dateTimeFormatter) {
        mDateTimeFormatter = dateTimeFormatter;
    }

    /**
     * 格式化时间
     *
     * @param date
     */
    public String formatDateTime(Date date) {
        if (getDateTimeFormatter() == null) {
            setDateTimeFormatter(new TimeFormatter());
        }
        return getDateTimeFormatter().format(date);
    }

    /**
     * 获取主区域的 IChartDraw
     *
     * @return IChartDraw
     */
    public IChartDraw getMainDraw() {
        return mMainDraw;
    }

    /**
     * 设置主区域的 IChartDraw
     *
     * @param mainDraw IChartDraw
     */
    public void setMainDraw(IChartDraw mainDraw) {
        mMainDraw = mainDraw;
        this.mainDraw = (MainDraw) mMainDraw;
    }

    public IChartDraw getVolDraw() {
        return mVolDraw;
    }

    public void setVolDraw(IChartDraw mVolDraw) {
        this.mVolDraw = mVolDraw;
    }

    /**
     * 二分查找当前值的index
     *
     * @return
     */
    public int indexFromScrollX(float scrollX) {
        return Math.max(0, Math.min((int)Math.floor(scrollX / mPointWidth), mItemCount - 1));
    }

    /**
     * 开始动画
     */
    public void startAnimation() {
        if (mAnimator != null) {
            mAnimator.start();
        }
    }

    /**
     * 设置动画时间
     */
    public void setAnimationDuration(long duration) {
        if (mAnimator != null) {
            mAnimator.setDuration(duration);
        }
    }

    /**
     * 设置表格行数
     */
    public void setGridRows(int gridRows) {
        if (gridRows < 1) {
            gridRows = 1;
        }
        mGridRows = gridRows;
    }

    /**
     * 设置表格列数
     */
    public void setGridColumns(int gridColumns) {
        if (gridColumns < 1) {
            gridColumns = 1;
        }
        mGridColumns = gridColumns;
    }

    /**
     * view中的x转化为scrollX
     *
     * @param x
     * @return
     */
    public float viewXToScrollX(float x) {
        return mScrollX +  x / mScaleX;
    }

    /**
     * scrollX转化为view中的x
     *
     * @param viewx
     * @return
     */
    public float scrollXtoViewX(float viewx) {
        return (viewx - mScrollX) * mScaleX;
    }

    /**
     * 获取上方padding
     */
    public float getTopPadding() {
        return mTopPadding;
    }

    /**
     * 获取上方padding
     */
    public float getChildPadding() {
        return mChildPadding;
    }

    /**
     * 获取子试图上方padding
     */
    public float getmChildScaleYPadding() {
        return mChildPadding;
    }

    /**
     * 获取图的宽度
     *
     * @return
     */
    public int getChartWidth() {
        return mWidth;
    }

    public int getScrollOffset() {
        return mScrollX;
    }

    /**
     * 是否长按
     */
    public boolean isLongPress() {
        return isLongPress;
    }

    /**
     * 获取选择索引
     */
    public int getSelectedIndex() {
        return mSelectedIndex;
    }

    public Rect getChildRect() {
        return mChildRect;
    }

    public Rect getVolRect() {
        return mVolRect;
    }

    /**
     * 设置选择监听
     */
    public void setOnSelectedChangedListener(OnSelectedChangedListener l) {
        this.mOnSelectedChangedListener = l;
    }

    public void onSelectedChanged(BaseKLineChartView view, Object point, int index) {
        if (this.mOnSelectedChangedListener != null) {
            mOnSelectedChangedListener.onSelectedChanged(view, point, index);
        }
    }

    /**
     * 数据是否充满屏幕
     *
     * @return
     */
    public boolean isFullScreen() {
        return mDataLen >= mWidth / mScaleX;
    }

    /**
     * 设置超出右方后可滑动的范围
     */
    public void setOverScrollRange(float overScrollRange) {
        if (overScrollRange < 0) {
            overScrollRange = 0;
        }
        mOverScrollRange = overScrollRange;
    }

    /**
     * 设置上方padding
     *
     * @param topPadding
     */
    public void setTopPadding(int topPadding) {
        mTopPadding = topPadding;
    }

    /**
     * 设置下方padding
     *
     * @param bottomPadding
     */
    public void setBottomPadding(int bottomPadding) {
        mBottomPadding = bottomPadding;
    }

    /**
     * 设置表格线宽度
     */
    public void setGridLineWidth(float width) {
        mGridPaint.setStrokeWidth(width);
    }

    /**
     * 设置表格线颜色
     */
    public void setGridLineColor(int color) {
        mGridPaint.setColor(color);
    }

    /**
     * 设置选择器横线宽度
     */
    public void setSelectedXLineWidth(float width) {
        mSelectedXLinePaint.setStrokeWidth(width);
    }

    /**
     * 设置选择器横线颜色
     */
    public void setSelectedXLineColor(int color) {
        mSelectedXLinePaint.setColor(color);
    }

    /**
     * 设置选择器竖线宽度
     */
    public void setSelectedYLineWidth(float width) {
        mSelectedYLinePaint.setStrokeWidth(width);
    }

    /**
     * 设置选择器竖线颜色
     */
    public void setSelectedYLineColor(int color) {
        mSelectedYLinePaint.setColor(color);
    }

    /**
     * 设置文字颜色
     */
    public void setTextColor(int color) {
        mTextPaint.setColor(color);
    }

    public void setTextFontFamily(String fontFamily) {
        Typeface typeface = HTKLineConfigManager.findFont(getContext(), fontFamily);
        mGridPaint.setTypeface(typeface);

        mTextPaint.setTypeface(typeface);

        mMaxMinPaint.setTypeface(typeface);

        mBackgroundPaint.setTypeface(typeface);

        mSelectedXLinePaint.setTypeface(typeface);

        mSelectedYLinePaint.setTypeface(typeface);

        mSelectPointPaint.setTypeface(typeface);

        mSelectCenterPaint.setTypeface(typeface);

        mSelectCenterBackgroundPaint.setTypeface(typeface);

        mSelectorFramePaint.setTypeface(typeface);

        mClosePriceLinePaint.setTypeface(typeface);

        mClosePricePointPaint.setTypeface(typeface);

        mClosePriceTrianglePaint.setTypeface(typeface);

        mClosePriceRightTextPaint.setTypeface(typeface);
    }

    /**
     * 设置文字大小
     */
    public void setTextSize(float textSize) {
        mTextPaint.setTextSize(textSize);
        mClosePriceRightTextPaint.setTextSize(textSize);
    }

    /**
     * 设置最大值/最小值文字颜色
     */
    public void setMTextColor(int color) {
        mMaxMinPaint.setColor(color);
        mSelectedXLinePaint.setColor(color);
        mSelectorFramePaint.setColor(color);
    }

    /**
     * 设置最大值/最小值文字大小
     */
    public void setMTextSize(float textSize) {
        mMaxMinPaint.setTextSize(textSize);
    }

    /**
     * 设置背景颜色
     */
    public void setBackgroundColor(int color) {
        mBackgroundPaint.setColor(color);
    }

    /**
     * 设置选中point 值显示背景
     */
    public void setSelectPointColor(int color) {
        mSelectPointPaint.setColor(color);
    }

    /**
     * 选中点变化时的监听
     */
    public interface OnSelectedChangedListener {
        /**
         * 当选点中变化时
         *
         * @param view  当前view
         * @param point 选中的点
         * @param index 选中点的索引
         */
        void onSelectedChanged(BaseKLineChartView view, Object point, int index);
    }

    /**
     * 获取文字大小
     */
    public float getTextSize() {
        return mTextPaint.getTextSize();
    }

    /**
     * 获取曲线宽度
     */
    public float getLineWidth() {
        return mLineWidth;
    }

    /**
     * 设置曲线的宽度
     */
    public void setLineWidth(float lineWidth) {
        mLineWidth = lineWidth;
    }

    /**
     * 设置每个点的宽度
     */
    public void setPointWidth(float pointWidth) {
        mPointWidth = pointWidth;
    }

    public Paint getGridPaint() {
        return mGridPaint;
    }

    public Paint getTextPaint() {
        return mTextPaint;
    }

    public Paint getBackgroundPaint() {
        return mBackgroundPaint;
    }

    /**
     * Override to handle tap on prediction lines
     */
    @Override
    public boolean onSingleTapUp(MotionEvent e) {
        // Check if prediction is active
        if (configManager.predictionEntry == null) {
            // Clear selection if any
            if (mSelectedPredictionType != null) {
                mSelectedPredictionType = null;
                mSelectedPredictionIndex = null;
                if (mOnPredictionSelectListener != null) {
                    mOnPredictionSelectListener.onPredictionSelect(new java.util.HashMap<>());
                }
                invalidate();
            }
            return super.onSingleTapUp(e);
        }

        float tapY = e.getY();
        float hitThreshold = dp2px(30); // 30dp hit zone

        // Build candidates
        java.util.List<Object[]> candidates = new java.util.ArrayList<>();

        // Entry
        float entryY = yFromValue(configManager.predictionEntry.floatValue());
        float entryDist = Math.abs(tapY - entryY);
        if (entryDist < hitThreshold) {
            candidates.add(new Object[]{"entry", configManager.predictionEntry.floatValue(), null, entryDist});
        }

        // SL
        if (configManager.predictionStopLoss != null) {
            float slY = yFromValue(configManager.predictionStopLoss.floatValue());
            float slDist = Math.abs(tapY - slY);
            if (slDist < hitThreshold) {
                candidates.add(new Object[]{"sl", configManager.predictionStopLoss.floatValue(), null, slDist});
            }
        }

        // TPs
        for (int i = 0; i < configManager.predictionList.size(); i++) {
            java.util.Map<String, Object> prediction = configManager.predictionList.get(i);
            Object valObj = prediction.get("value");
            if (valObj instanceof Number) {
                float tpPrice = ((Number) valObj).floatValue();
                float tpY = yFromValue(tpPrice);
                float tpDist = Math.abs(tapY - tpY);
                if (tpDist < hitThreshold) {
                    candidates.add(new Object[]{"tp", tpPrice, i, tpDist});
                }
            }
        }

        // Find closest
        if (!candidates.isEmpty()) {
            Object[] best = candidates.get(0);
            for (Object[] candidate : candidates) {
                if ((Float) candidate[3] < (Float) best[3]) {
                    best = candidate;
                }
            }

            mSelectedPredictionType = (String) best[0];
            mSelectedPredictionIndex = (Integer) best[2];

            // Build payload
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("type", best[0]);
            payload.put("price", best[1]);
            if (best[2] != null) {
                payload.put("index", best[2]);
            }

            // Enrich with metadata for TP
            if ("tp".equals(best[0]) && best[2] != null) {
                int idx = (Integer) best[2];
                if (idx < configManager.predictionList.size()) {
                    java.util.Map<String, Object> target = configManager.predictionList.get(idx);
                    for (java.util.Map.Entry<String, Object> entry : target.entrySet()) {
                        if (!"value".equals(entry.getKey()) && !"price".equals(entry.getKey())) {
                            payload.put(entry.getKey(), entry.getValue());
                        }
                    }
                }
            }

            // Invoke callback
            if (mOnPredictionSelectListener != null) {
                mOnPredictionSelectListener.onPredictionSelect(payload);
            }

            invalidate();
            return true;
        } else {
            // Deselect if tapped elsewhere
            if (mSelectedPredictionType != null) {
                mSelectedPredictionType = null;
                mSelectedPredictionIndex = null;
                if (mOnPredictionSelectListener != null) {
                    mOnPredictionSelectListener.onPredictionSelect(new java.util.HashMap<>());
                }
                invalidate();
            }
        }

        return super.onSingleTapUp(e);
    }



}
