package com.github.fujianlian.klinechart;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.DashPathEffect;
import android.graphics.LinearGradient;
import android.graphics.Shader;
import android.animation.ValueAnimator;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import android.view.GestureDetector;
import androidx.annotation.ColorRes;
import androidx.annotation.DimenRes;
import androidx.core.content.ContextCompat;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import android.widget.ProgressBar;

import androidx.core.view.GestureDetectorCompat;
import com.github.fujianlian.klinechart.draw.*;

import static android.graphics.Typeface.NORMAL;

/**
 * k线图
 * Created by tian on 2016/5/20.
 */
public class KLineChartView extends BaseKLineChartView {

    ProgressBar mProgressBar;
    private boolean isRefreshing = false;
    private boolean isLoadMoreEnd = false;
    private boolean mLastScrollEnable;
    private boolean mLastScaleEnable;

    private KChartRefreshListener mRefreshListener;

    private MACDDraw mMACDDraw;
    private RSIDraw mRSIDraw;
    private MainDraw mMainDraw;
    private KDJDraw mKDJDraw;
    private WRDraw mWRDraw;
    private VolumeDraw mVolumeDraw;

    // Prediction / Live Analysis
    private Paint mPredictionPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mPredictionBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private float predictionAnimationProgress = 0f;
    private ValueAnimator predictionJumpAnimator;
    private boolean isPredictionAnimating = false;
    private int mWidth = 0; // Ensure mWidth is accessible or use getWidth()

    public KLineChartView(Context context, HTKLineConfigManager configManager) {
        super(context, configManager);
        initView();
        reloadAttributedList(null);
    }

    public void reloadColor() {
        this.mMainDraw.reloadColor(this);
        this.mMACDDraw.reloadColor(this);
        this.mKDJDraw.reloadColor(this);
        this.mVolumeDraw.reloadColor(this);
    }

    public void changeSecondDrawType(SecondStatus secondStatus) {
        switch (secondStatus) {
            case MACD: {
                setChildDraw(0);
                break;
            }
            case KDJ: {
                setChildDraw(1);
                break;
            }
            case RSI: {
                setChildDraw(2);
                break;
            }
            case WR: {
                setChildDraw(3);
                break;
            }
            case NONE: {
                hideChildDraw();
                break;
            }
        }
    }

    private void initView() {
        mProgressBar = new ProgressBar(getContext());
        LayoutParams layoutParams = new LayoutParams(dp2px(50), dp2px(50));
        layoutParams.addRule(CENTER_IN_PARENT);
        addView(mProgressBar, layoutParams);
        mProgressBar.setVisibility(GONE);
        mVolumeDraw = new VolumeDraw(this);
        mMACDDraw = new MACDDraw(this);
        mWRDraw = new WRDraw(this);
        mKDJDraw = new KDJDraw(this);
        mRSIDraw = new RSIDraw(this);
        mMainDraw = new MainDraw(this);
        addChildDraw(mMACDDraw);
        addChildDraw(mKDJDraw);
        addChildDraw(mRSIDraw);
        addChildDraw(mWRDraw);
        setVolDraw(mVolumeDraw);
        setMainDraw(mMainDraw);
    }

    private void reloadAttributedList(AttributeSet attrs) {
        TypedArray array = getContext().obtainStyledAttributes(attrs, R.styleable.KLineChartView);
        if (array != null) {
            try {
                //public
                setPointWidth(array.getDimension(R.styleable.KLineChartView_kc_point_width, getDimension(R.dimen.chart_point_width)));
                setTextSize(array.getDimension(R.styleable.KLineChartView_kc_text_size, getDimension(R.dimen.chart_text_size)));
                setTextColor(array.getColor(R.styleable.KLineChartView_kc_text_color, getColor(R.color.chart_text)));
                setMTextSize(array.getDimension(R.styleable.KLineChartView_kc_text_size, getDimension(R.dimen.chart_text_size)));
                setMTextColor(array.getColor(R.styleable.KLineChartView_kc_text_color, getColor(R.color.chart_white)));
                setLineWidth(array.getDimension(R.styleable.KLineChartView_kc_line_width, getDimension(R.dimen.chart_line_width)));
                setBackgroundColor(array.getColor(R.styleable.KLineChartView_kc_background_color, getColor(R.color.chart_bac)));
                setSelectPointColor(array.getColor(R.styleable.KLineChartView_kc_background_color, getColor(R.color.chart_point_bac)));

                setSelectedXLineColor(Color.WHITE);
                setSelectedXLineWidth(getDimension(R.dimen.chart_line_width));

                setSelectedYLineColor(Color.parseColor("#8040424D"));
                setSelectedYLineWidth(getDimension(R.dimen.chart_point_width));

                setGridLineWidth(array.getDimension(R.styleable.KLineChartView_kc_grid_line_width, getDimension(R.dimen.chart_grid_line_width)));
                setGridLineColor(array.getColor(R.styleable.KLineChartView_kc_grid_line_color, getColor(R.color.chart_grid_line)));
                //macd
                setMACDWidth(array.getDimension(R.styleable.KLineChartView_kc_macd_width, getDimension(R.dimen.chart_candle_width)));
                setDIFColor(array.getColor(R.styleable.KLineChartView_kc_dif_color, getColor(R.color.chart_ma5)));
                setDEAColor(array.getColor(R.styleable.KLineChartView_kc_dea_color, getColor(R.color.chart_ma10)));
                setMACDColor(array.getColor(R.styleable.KLineChartView_kc_macd_color, getColor(R.color.chart_ma30)));
                //kdj
                setKColor(array.getColor(R.styleable.KLineChartView_kc_dif_color, getColor(R.color.chart_ma5)));
                setDColor(array.getColor(R.styleable.KLineChartView_kc_dea_color, getColor(R.color.chart_ma10)));
                setJColor(array.getColor(R.styleable.KLineChartView_kc_macd_color, getColor(R.color.chart_ma30)));
                //wr
                setRColor(array.getColor(R.styleable.KLineChartView_kc_dif_color, getColor(R.color.chart_ma5)));
                //rsi
                setRSI1Color(array.getColor(R.styleable.KLineChartView_kc_dif_color, getColor(R.color.chart_ma5)));
                setRSI2Color(array.getColor(R.styleable.KLineChartView_kc_dea_color, getColor(R.color.chart_ma10)));
                setRSI3Color(array.getColor(R.styleable.KLineChartView_kc_macd_color, getColor(R.color.chart_ma30)));
                //main
                setMa5Color(array.getColor(R.styleable.KLineChartView_kc_dif_color, getColor(R.color.chart_ma5)));
                setMa10Color(array.getColor(R.styleable.KLineChartView_kc_dea_color, getColor(R.color.chart_ma10)));
                setMa30Color(array.getColor(R.styleable.KLineChartView_kc_macd_color, getColor(R.color.chart_ma30)));
                setCandleWidth(array.getDimension(R.styleable.KLineChartView_kc_candle_width, getDimension(R.dimen.chart_candle_width)));
                setCandleLineWidth(array.getDimension(R.styleable.KLineChartView_kc_candle_line_width, getDimension(R.dimen.chart_candle_line_width)));
                setSelectorBackgroundColor(array.getColor(R.styleable.KLineChartView_kc_selector_background_color, getColor(R.color.chart_selector)));
                setSelectorTextSize(array.getDimension(R.styleable.KLineChartView_kc_selector_text_size, getDimension(R.dimen.chart_selector_text_size)));
                setCandleSolid(array.getBoolean(R.styleable.KLineChartView_kc_candle_solid, true));
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                array.recycle();
            }
        }
    }

    private float getDimension(@DimenRes int resId) {
        return getResources().getDimension(resId);
    }

    private int getColor(@ColorRes int resId) {
        return ContextCompat.getColor(getContext(), resId);
    }

    @Override
    public void onLeftSide() {
        // showLoading();
    }

    @Override
    public void onRightSide() {
    }

    public void showLoading() {
        if (!isLoadMoreEnd && !isRefreshing) {
            isRefreshing = true;
            if (mProgressBar != null) {
                mProgressBar.setVisibility(View.VISIBLE);
            }
            if (mRefreshListener != null) {
                mRefreshListener.onLoadMoreBegin(this);
            }
            mLastScaleEnable = isScaleEnable();
            mLastScrollEnable = isScrollEnable();
            super.setScrollEnable(false);
            super.setScaleEnable(false);
        }
    }

    public void justShowLoading() {
        if (!isRefreshing) {
            isLongPress = false;
            isRefreshing = true;
            if (mProgressBar != null) {
                mProgressBar.setVisibility(View.VISIBLE);
            }
            if (mRefreshListener != null) {
                mRefreshListener.onLoadMoreBegin(this);
            }
            mLastScaleEnable = isScaleEnable();
            mLastScrollEnable = isScrollEnable();
            super.setScrollEnable(false);
            super.setScaleEnable(false);
        }
    }

    private void hideLoading() {
        if (mProgressBar != null) {
            mProgressBar.setVisibility(View.GONE);
        }
        super.setScrollEnable(mLastScrollEnable);
        super.setScaleEnable(mLastScaleEnable);
    }

    /**
     * 隐藏选择器内容
     */
    public void hideSelectData() {
        isLongPress = false;
        // invalidate();
    }

    /**
     * 刷新完成
     */
    public void refreshComplete() {
        isRefreshing = false;
        hideLoading();
    }

    /**
     * 刷新完成，没有数据
     */
    public void refreshEnd() {
        isLoadMoreEnd = true;
        isRefreshing = false;
        hideLoading();
    }

    /**
     * 重置加载更多
     */
    public void resetLoadMoreEnd() {
        isLoadMoreEnd = false;
    }

    public void setLoadMoreEnd() {
        isLoadMoreEnd = true;
    }

    public interface KChartRefreshListener {
        /**
         * 加载更多
         *
         * @param chart
         */
        void onLoadMoreBegin(KLineChartView chart);
    }

    @Override
    public void setScaleEnable(boolean scaleEnable) {
        if (isRefreshing) {
            throw new IllegalStateException("请勿在刷新状态设置属性");
        }
        super.setScaleEnable(scaleEnable);

    }

    @Override
    public void setScrollEnable(boolean scrollEnable) {
        if (isRefreshing) {
            throw new IllegalStateException("请勿在刷新状态设置属性");
        }
        super.setScrollEnable(scrollEnable);
    }

    /**
     * 设置DIF颜色
     */
    public void setDIFColor(int color) {
        mMACDDraw.setDIFColor(color);
    }

    /**
     * 设置DEA颜色
     */
    public void setDEAColor(int color) {
        mMACDDraw.setDEAColor(color);
    }

    /**
     * 设置MACD颜色
     */
    public void setMACDColor(int color) {
        mMACDDraw.setMACDColor(color);
    }

    /**
     * 设置MACD的宽度
     *
     * @param MACDWidth
     */
    public void setMACDWidth(float MACDWidth) {
        mMACDDraw.setMACDWidth(MACDWidth);
    }

    /**
     * 设置K颜色
     */
    public void setKColor(int color) {
        mKDJDraw.setKColor(color);
    }

    /**
     * 设置D颜色
     */
    public void setDColor(int color) {
        mKDJDraw.setDColor(color);
    }

    /**
     * 设置J颜色
     */
    public void setJColor(int color) {
        mKDJDraw.setJColor(color);
    }

    /**
     * 设置R颜色
     */
    public void setRColor(int color) {
        mWRDraw.setRColor(color);
    }

    /**
     * 设置ma5颜色
     *
     * @param color
     */
    public void setMa5Color(int color) {
        mMainDraw.setMa5Color(color);
        mVolumeDraw.setMa5Color(color);
    }

    /**
     * 设置ma10颜色
     *
     * @param color
     */
    public void setMa10Color(int color) {
        mMainDraw.setMa10Color(color);
        mVolumeDraw.setMa10Color(color);
    }

    /**
     * 设置ma20颜色
     *
     * @param color
     */
    public void setMa30Color(int color) {
        mMainDraw.setMa30Color(color);
    }

    /**
     * 设置选择器文字大小
     *
     * @param textSize
     */
    public void setSelectorTextSize(float textSize) {
        mMainDraw.setSelectorTextSize(textSize);
    }

    /**
     * 设置选择器背景
     *
     * @param color
     */
    public void setSelectorBackgroundColor(int color) {
        mMainDraw.setSelectorBackgroundColor(color);
    }

    /**
     * 设置蜡烛宽度
     *
     * @param candleWidth
     */
    public void setCandleWidth(float candleWidth) {
        mMainDraw.setCandleWidth(candleWidth);
    }

    /**
     * 设置蜡烛线宽度
     *
     * @param candleLineWidth
     */
    public void setCandleLineWidth(float candleLineWidth) {
        mMainDraw.setCandleLineWidth(candleLineWidth);
    }

    /**
     * 蜡烛是否空心
     */
    public void setCandleSolid(boolean candleSolid) {
        mMainDraw.setCandleSolid(candleSolid);
    }

    public void setRSI1Color(int color) {
        mRSIDraw.setRSI1Color(color);
    }

    public void setRSI2Color(int color) {
        mRSIDraw.setRSI2Color(color);
    }

    public void setRSI3Color(int color) {
        mRSIDraw.setRSI3Color(color);
    }

    @Override
    public void setTextSize(float textSize) {
        super.setTextSize(textSize);
        mMainDraw.setTextSize(textSize);
        mRSIDraw.setTextSize(textSize);
        mMACDDraw.setTextSize(textSize);
        mKDJDraw.setTextSize(textSize);
        mWRDraw.setTextSize(textSize);
        mVolumeDraw.setTextSize(textSize);
    }

    public void setTextFontFamily(String fontFamily) {
        super.setTextFontFamily(fontFamily);
        mMainDraw.setTextFontFamily(fontFamily);
        mRSIDraw.setTextFontFamily(fontFamily);
        mMACDDraw.setTextFontFamily(fontFamily);
        mKDJDraw.setTextFontFamily(fontFamily);
        mWRDraw.setTextFontFamily(fontFamily);
        mVolumeDraw.setTextFontFamily(fontFamily);
    }

    @Override
    public void setLineWidth(float lineWidth) {
        super.setLineWidth(lineWidth);
        mMainDraw.setLineWidth(lineWidth);
        mRSIDraw.setLineWidth(lineWidth);
        mMACDDraw.setLineWidth(lineWidth);
        mKDJDraw.setLineWidth(lineWidth);
        mWRDraw.setLineWidth(lineWidth);
        mVolumeDraw.setLineWidth(lineWidth);
    }

    @Override
    public void setTextColor(int color) {
        super.setTextColor(color);
        mMainDraw.setSelectorTextColor(color);
    }

    /**
     * 设置刷新监听
     */
    public void setRefreshListener(KChartRefreshListener refreshListener) {
        mRefreshListener = refreshListener;
    }

    public void setMainDrawLine(boolean isLine) {
        this.isMinute = isLine;
        // invalidate();
    }

    private int startX;
    private int startY;

    @Override
    public boolean onInterceptTouchEvent(MotionEvent ev) {
        switch (ev.getAction()) {
            case MotionEvent.ACTION_DOWN:
                startX = (int) ev.getX();
                startY = (int) ev.getY();
                break;
            case MotionEvent.ACTION_MOVE:
                int dX = (int) (ev.getX() - startX);
                int dY = (int) (ev.getY() - startX);
                if (Math.abs(dX) > Math.abs(dY)) {
                    //左右滑动
                    return true;
                } else {
                    //上下滑动
                    return false;
                }
            case MotionEvent.ACTION_UP:
                break;
            default:
        }
        return super.onInterceptTouchEvent(ev);
    
    }

    public void startPredictionAnimation() {
        if (predictionJumpAnimator != null) {
            predictionJumpAnimator.cancel();
        }
        predictionJumpAnimator = ValueAnimator.ofFloat(0f, 1f);
        predictionJumpAnimator.setDuration(1500); // 1.5s duration
        predictionJumpAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(ValueAnimator animation) {
                predictionAnimationProgress = (float) animation.getAnimatedValue();
                invalidate();
            }
        });
        isPredictionAnimating = true;
        predictionJumpAnimator.start();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        drawPrediction(canvas);
    }

    private void drawPrediction(Canvas canvas) {
        if (configManager.predictionList == null || configManager.predictionList.isEmpty()) {
            // android.util.Log.d("HTKLine", "drawPrediction: Skip - empty list");
            return;
        }

        int count = configManager.modelArray.size();
        if (count == 0 || mItemCount == 0) return;

        // Find target index (timeline index)
        int targetIndex = count - 1;
        Double startTimeObj = configManager.predictionStartTime;
        if (startTimeObj != null) {
            double startTime = startTimeObj;
            for (int i = count - 1; i >= 0; i--) {
                KLineEntity entity = (KLineEntity) getItem(i);
                if (entity.id <= startTime) {
                    targetIndex = i;
                    break;
                }
            }
        }
        
        float startX = scrollXtoViewX(getItemMiddleScrollX(targetIndex));
        float itemWidth = configManager.itemWidth * mScaleX;
        int bgExtension = Math.max((count - 1) - targetIndex, 10);
        float bgEndX = startX + bgExtension * itemWidth;
        
        android.util.Log.d("HTKLine", "drawPrediction: Index=" + targetIndex + " StartX=" + startX + " EndX=" + bgEndX + " Progress=" + predictionAnimationProgress + " Bias=" + configManager.predictionBias);

        // Animation Clip
        float progress = predictionAnimationProgress;
        canvas.save();
        
        // Clip to Main Chart Area to prevent overflow into Volume/Child views
        canvas.clipRect(mMainRect);

        if (progress < 1.0f) {
            float totalWidth = bgEndX - startX;
            float currentWidth = totalWidth * progress;
            float currentEndX = startX + currentWidth;
             // We clip the drawing area to wipe from left to right
            canvas.clipRect(startX, mMainRect.top, currentEndX, mMainRect.bottom);
        }

        // Draw Bias Label
        if (configManager.predictionBias != null) {
            String biasText = configManager.predictionBias.toUpperCase();
            boolean isBullish = "bullish".equalsIgnoreCase(configManager.predictionBias);
            mPredictionPaint.setColor(isBullish ? Color.parseColor("#00AA00") : Color.RED);
            mPredictionPaint.setStyle(Paint.Style.FILL);
            mPredictionPaint.setTextSize(dp2px(12));
            mPredictionPaint.setPathEffect(null);
            
            // Draw at top-left of prediction area
            float labelY = mMainRect.top + dp2px(20);
            // canvas.drawText(biasText, startX + dp2px(5), labelY, mPredictionPaint);
        }

        // Entry Line
        if (configManager.predictionEntry != null) {
            float entryY = yFromValue(configManager.predictionEntry.floatValue());
            mPredictionPaint.setColor(Color.DKGRAY);
            mPredictionPaint.setPathEffect(new DashPathEffect(new float[]{10, 5}, 0));
            mPredictionPaint.setStrokeWidth(dp2px(1));
            mPredictionPaint.setStyle(Paint.Style.STROKE);
            Path path = new Path();
            path.moveTo(startX, entryY);
            path.lineTo(bgEndX, entryY);
            canvas.drawPath(path, mPredictionPaint);
            
             // SL Zone
            if (configManager.predictionStopLoss != null) {
                float slY = yFromValue(configManager.predictionStopLoss.floatValue());
                float rectY = Math.min(entryY, slY);
                float rectH = Math.abs(entryY - slY);
                
                if (rectH > 0 && bgEndX > startX) {
                    int slideColor1 = Color.argb(50, 230, 50, 50); // Red alpha 0.2
                    int slideColor2 = Color.argb(10, 230, 50, 50); // Red alpha 0.05
                    Shader shader = new LinearGradient(startX, entryY, startX, slY, slideColor1, slideColor2, Shader.TileMode.CLAMP);
                    mPredictionBgPaint.setShader(shader);
                    mPredictionBgPaint.setStyle(Paint.Style.FILL);
                    canvas.drawRect(startX, rectY, bgEndX, rectY + rectH, mPredictionBgPaint);
                }
                
                // SL Line
                mPredictionPaint.setColor(Color.RED);
                mPredictionPaint.setPathEffect(null); // Solid
                Path slPath = new Path();
                slPath.moveTo(startX, slY);
                slPath.lineTo(bgEndX, slY);
                canvas.drawPath(slPath, mPredictionPaint);
            }
            
            // TP Zones
            if (!configManager.predictionList.isEmpty()) {
                 // Find extreme target for gradient
                 float extremeTargetVal = configManager.predictionEntry.floatValue();
                 boolean isBullish = "bullish".equalsIgnoreCase(configManager.predictionBias);
                 
                 for (java.util.Map<String, Object> t : configManager.predictionList) {
                     Object v = t.get("value");
                     if (v == null) v = t.get("level"); // Fallback to level

                     if (v instanceof Number) {
                         float val = ((Number) v).floatValue();
                         if (isBullish) extremeTargetVal = Math.max(extremeTargetVal, val);
                         else extremeTargetVal = Math.min(extremeTargetVal, val);
                         
                         // Draw TP Line
                         float tpY = yFromValue(val);
                         mPredictionPaint.setColor(Color.parseColor("#00AA00")); // Green
                         mPredictionPaint.setPathEffect(new DashPathEffect(new float[]{10, 10}, 0));
                         Path tpPath = new Path();
                         tpPath.moveTo(startX, tpY);
                         tpPath.lineTo(bgEndX, tpY);
                         canvas.drawPath(tpPath, mPredictionPaint);
                     }
                 }
                 
                 float targetY = yFromValue(extremeTargetVal);
                 float rectY = Math.min(entryY, targetY);
                 float rectH = Math.abs(entryY - targetY);
                 
                 if (rectH > 0 && bgEndX > startX) {
                    int slideColor1 = Color.argb(50, 50, 200, 50); // Green alpha 0.2
                    int slideColor2 = Color.argb(10, 50, 200, 50); // Green alpha 0.05
                    Shader shader = new LinearGradient(startX, entryY, startX, targetY, slideColor1, slideColor2, Shader.TileMode.CLAMP);
                    mPredictionBgPaint.setShader(shader);
                    mPredictionBgPaint.setStyle(Paint.Style.FILL);
                    canvas.drawRect(startX, rectY, bgEndX, rectY + rectH, mPredictionBgPaint);
                 }
            }
        }
        
        canvas.restore();
    }

    public interface OnPredictionSelectListener {
        void onPredictionSelect(java.util.Map<String, Object> details);
    }

    private OnPredictionSelectListener mOnPredictionSelectListener;

    public void setOnPredictionSelectListener(OnPredictionSelectListener listener) {
        this.mOnPredictionSelectListener = listener;
    }

    @Override
    public boolean onSingleTapUp(MotionEvent e) {
        if (checkPredictionClick(e.getX(), e.getY())) {
            return true;
        }
        return super.onSingleTapUp(e);
    }

    private boolean checkPredictionClick(float x, float y) {
        if (configManager.predictionList == null || configManager.predictionList.isEmpty()) {
            return false;
        }
        
        int count = configManager.modelArray.size();
        if (count == 0) return false;
        
        int targetIndex = count - 1;
        if (configManager.predictionStartTime != null) {
            double startTime = configManager.predictionStartTime;
            for (int i = count - 1; i >= 0; i--) {
                KLineEntity entity = (KLineEntity) getItem(i);
                if (entity.id <= startTime) {
                    targetIndex = i;
                    break;
                }
            }
        }
        
        float startX = scrollXtoViewX(getItemMiddleScrollX(targetIndex));
        float itemWidth = configManager.itemWidth * mScaleX;
        int bgExtension = Math.max((count - 1) - targetIndex, 10);
        float bgEndX = startX + bgExtension * itemWidth;
        
        if (x < startX || x > bgEndX) return false;
        
        // Find candidates
        List<Map<String, Object>> candidates = new ArrayList<>();
        
        // Entry
        if (configManager.predictionEntry != null) {
            float entryY = yFromValue(configManager.predictionEntry.floatValue());
            if (Math.abs(y - entryY) < 60) { // 60px threshold
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("type", "entry");
                map.put("price", configManager.predictionEntry);
                map.put("dist", Math.abs(y - entryY));
                
                // Enrich with Entry Zone metadata
                if (configManager.predictionEntryZones != null) {
                    for (Map<String, Object> zone : configManager.predictionEntryZones) {
                        // Logic: if price matches or is close? 
                        // For simplicity, take first or match ID if available. 
                        // The user wanted ALL metadata passed through.
                        // We merge them.
                        for (Map.Entry<String, Object> entry : zone.entrySet()) {
                             if (!entry.getKey().equals("price") && !entry.getKey().equals("value")) {
                                 map.put(entry.getKey(), entry.getValue());
                             }
                        }
                        break; // Just match the first one for now as per iOS logic approx
                    }
                }
                candidates.add(map);
            }
        }
        
        // SL
        if (configManager.predictionStopLoss != null) {
            float slY = yFromValue(configManager.predictionStopLoss.floatValue());
            if (Math.abs(y - slY) < 60) {
                 Map<String, Object> map = new java.util.HashMap<>();
                map.put("type", "sl");
                map.put("price", configManager.predictionStopLoss);
                map.put("dist", Math.abs(y - slY));
                candidates.add(map);
            }
        }
        
        // Targets
        for (int i = 0; i < configManager.predictionList.size(); i++) {
             Map<String, Object> t = configManager.predictionList.get(i);
             Object v = t.get("value");
             if (v == null) v = t.get("level"); // Fallback to level

             if (v instanceof Number) {
                 float val = ((Number) v).floatValue();
                 float tpY = yFromValue(val);
                 if (Math.abs(y - tpY) < 60) {
                     Map<String, Object> map = new java.util.HashMap<>();
                     map.put("type", "tp");
                     map.put("price", val);
                     map.put("index", i);
                     map.put("dist", Math.abs(y - tpY));
                      // Merge metadata
                     for (Map.Entry<String, Object> entry : t.entrySet()) {
                         if (!entry.getKey().equals("value") && !entry.getKey().equals("level")) {
                             map.put(entry.getKey(), entry.getValue());
                         }
                     }
                     candidates.add(map);
                 }
             }
        }
        
        if (!candidates.isEmpty()) {
            // Sort by distance
            Map<String, Object> best = candidates.get(0);
            float minDist = ((Number)best.get("dist")).floatValue();
            for (Map<String, Object> c : candidates) {
                float d = ((Number)c.get("dist")).floatValue();
                if (d < minDist) {
                    minDist = d;
                    best = c;
                }
            }
            
            if (mOnPredictionSelectListener != null) {
                mOnPredictionSelectListener.onPredictionSelect(best);
                return true; // Consumed
            }
        }
        
        return false;
    }

    @Override
    public void onLongPress(MotionEvent e) {

        if (!isRefreshing) {
            super.onLongPress(e);
        }
    }
}
