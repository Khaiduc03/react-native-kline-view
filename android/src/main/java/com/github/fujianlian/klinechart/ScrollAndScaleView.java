package com.github.fujianlian.klinechart;

import android.content.Context;
import androidx.core.view.GestureDetectorCompat;
import android.util.Log;
import android.util.AttributeSet;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.widget.OverScroller;
import android.widget.RelativeLayout;

/**
 * 可以滑动和放大的view
 * Created by tian on 2016/5/3.
 */
public abstract class ScrollAndScaleView extends RelativeLayout implements
        GestureDetector.OnGestureListener,
        ScaleGestureDetector.OnScaleGestureListener {
    private static final String TAG = "RNKLineView.Gesture";

    protected int mScrollX = 0;
    protected GestureDetectorCompat mDetector;
    protected ScaleGestureDetector mScaleDetector;

    protected boolean isLongPress = false;

    private OverScroller mScroller;

    protected boolean touch = false;

    protected float mScaleX = 1;

    protected float mScaleXMax = 3f;

    protected float mScaleXMin = 0.3f;

    private boolean mMultipleTouch = false;

    private boolean mScrollEnable = true;

    private boolean mScaleEnable = true;

    public ScrollAndScaleView(Context context) {
        super(context);
        init();
    }

    public ScrollAndScaleView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public ScrollAndScaleView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private float mDownX = 0;

    private float mDownY = 0;


    private void init() {
        setWillNotDraw(false);
        mDetector = new GestureDetectorCompat(getContext(), this);
        mScaleDetector = new ScaleGestureDetector(getContext(), this);
        mScroller = new OverScroller(getContext());
        this.setClickable(true);
    }



    @Override
    public boolean onDown(MotionEvent e) {
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "onDown x=" + e.getX() + " y=" + e.getY());
        }
        return true;
    }

    @Override
    public void onShowPress(MotionEvent e) {

    }

    @Override
    public boolean onSingleTapUp(MotionEvent e) {
        return false;
    }

    @Override
    public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
        if (!isLongPress && !isMultipleTouch()) {
            scrollBy(-Math.round(distanceX), 0);
            if (BuildConfig.DEBUG) {
                Log.d(
                        TAG,
                        "onScroll dx=" + distanceX + " dy=" + distanceY + " scrollX=" + mScrollX
                );
            }
            return true;
        }
        return false;
    }

    @Override
    public void onLongPress(MotionEvent e) {
        isLongPress = true;
    }

    @Override
    public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
        if (!isTouch() && isScrollEnable()) {
            mScroller.fling(-mScrollX, 0
                    , Math.round(velocityX / mScaleX), 0,
                    Integer.MIN_VALUE, Integer.MAX_VALUE,
                    0, 0);
        }
        return true;
    }

    @Override
    public void computeScroll() {
        if (mScroller.computeScrollOffset()) {
            if (!isTouch()) {
                scrollTo(-mScroller.getCurrX(), mScroller.getCurrY());
            } else {
                mScroller.forceFinished(true);
            }
        }
    }

    @Override
    public void scrollBy(int x, int y) {
        scrollTo(mScrollX - Math.round(x / mScaleX), 0);
    }

    @Override
    public void scrollTo(int x, int y) {
        if (!isScrollEnable()) {
            mScroller.forceFinished(true);
            return;
        }
        int oldX = mScrollX;
        mScrollX = x;
        checkAndFixScrollX();
        onScrollChanged(mScrollX, 0, oldX, 0);
        invalidate();
    }

    @Override
    public boolean onScale(ScaleGestureDetector detector) {
        if (!isScaleEnable()) {
            if (BuildConfig.DEBUG) {
                Log.d(TAG, "onScale blocked: scale disabled");
            }
            return false;
        }
        if (isLongPress) {
            if (BuildConfig.DEBUG) {
                Log.d(TAG, "onScale blocked: longPress active");
            }
            return false;
        }
        float oldScale = mScaleX;
        float nextScale = oldScale * detector.getScaleFactor();
        if (nextScale < mScaleXMin) {
            nextScale = mScaleXMin;
        } else if (nextScale > mScaleXMax) {
            nextScale = mScaleXMax;
        }
        mScaleX = nextScale;
        if (Math.abs(mScaleX - oldScale) > 0.0001f) {
            onScaleChanged(mScaleX, oldScale);
        }
        if (BuildConfig.DEBUG) {
            Log.d(
                    TAG,
                    "onScale factor=" + detector.getScaleFactor()
                            + " scaleX=" + mScaleX
                            + " min=" + mScaleXMin
                            + " max=" + mScaleXMax
            );
        }
        return true;
    }

    protected void onScaleChanged(float scale, float oldScale) {
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "onScaleChanged old=" + oldScale + " new=" + scale);
        }
        invalidate();
    }

    @Override
    public boolean onScaleBegin(ScaleGestureDetector detector) {
        if (BuildConfig.DEBUG) {
            Log.d(
                    TAG,
                    "onScaleBegin enabled=" + isScaleEnable()
                            + " longPress=" + isLongPress
                            + " currentScale=" + mScaleX
                            + " pointers?" // pointer count is unavailable on detector, keep event trace in onTouch.
            );
        }
        return true;
    }

    @Override
    public void onScaleEnd(ScaleGestureDetector detector) {
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "onScaleEnd finalScale=" + mScaleX);
        }
    }

    float x;

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        boolean isMultiTouchEvent = event.getPointerCount() > 1;
        // 按压手指超过1个
        if (isMultiTouchEvent) {
            isLongPress = false;
            if (getParent() != null) {
                getParent().requestDisallowInterceptTouchEvent(true);
            }
        }
        switch (event.getAction() & MotionEvent.ACTION_MASK) {
            case MotionEvent.ACTION_DOWN:
                if (isLongPress) {
                    isLongPress = false;
                }
                touch = true;
                x = event.getX();
                mDownX = event.getX();
                mDownY = event.getY();
                if (getParent() != null) {
                    // Chart gestures have priority over parent scroll containers.
                    getParent().requestDisallowInterceptTouchEvent(true);
                }
                break;
            case MotionEvent.ACTION_MOVE:
                //长按之后移动
                if (isLongPress) {
                    onLongPress(event);
                }
                if (getParent() != null) {
                    getParent().requestDisallowInterceptTouchEvent(true);
                }
                break;
            case MotionEvent.ACTION_POINTER_DOWN:
                mMultipleTouch = true;
                if (getParent() != null) {
                    getParent().requestDisallowInterceptTouchEvent(true);
                }
                break;
            case MotionEvent.ACTION_POINTER_UP:
                invalidate();
                break;
            case MotionEvent.ACTION_UP:
                if (x == event.getX()) {

                }
                touch = false;
                mMultipleTouch = false;
                if (getParent() != null) {
                    getParent().requestDisallowInterceptTouchEvent(false);
                }
                invalidate();
                break;
            case MotionEvent.ACTION_CANCEL:
                isLongPress = false;
                touch = false;
                mMultipleTouch = false;
                if (getParent() != null) {
                    getParent().requestDisallowInterceptTouchEvent(false);
                }
                invalidate();
                break;
            default:
                break;
        }
        mMultipleTouch = isMultiTouchEvent;
        this.mDetector.onTouchEvent(event);
        this.mScaleDetector.onTouchEvent(event);
        if (BuildConfig.DEBUG) {
            Log.d(
                    TAG,
                    "onTouch action=" + actionToString(event.getActionMasked())
                            + " pointers=" + event.getPointerCount()
                            + " multi=" + mMultipleTouch
                            + " touch=" + touch
                            + " scaleEnabled=" + isScaleEnable()
                            + " scrollEnabled=" + isScrollEnable()
                            + " scaleX=" + mScaleX
            );
        }
        return true;
    }

    private String actionToString(int action) {
        switch (action) {
            case MotionEvent.ACTION_DOWN:
                return "DOWN";
            case MotionEvent.ACTION_UP:
                return "UP";
            case MotionEvent.ACTION_MOVE:
                return "MOVE";
            case MotionEvent.ACTION_CANCEL:
                return "CANCEL";
            case MotionEvent.ACTION_POINTER_DOWN:
                return "POINTER_DOWN";
            case MotionEvent.ACTION_POINTER_UP:
                return "POINTER_UP";
            default:
                return String.valueOf(action);
        }
    }


    /**
     * 滑到了最左边
     */
    abstract public void onLeftSide();

    /**
     * 滑到了最右边
     */
    abstract public void onRightSide();

    /**
     * 是否在触摸中
     *
     * @return
     */
    public boolean isTouch() {
        return touch;
    }

    /**
     * 获取位移的最小值
     *
     * @return
     */
    public abstract int getMinScrollX();

    /**
     * 获取位移的最大值
     *
     * @return
     */
    public abstract int getMaxScrollX();

    /**
     * 设置ScrollX
     *
     * @param scrollX
     */
    public void setScrollX(int scrollX) {
        this.mScrollX = scrollX;
        scrollTo(scrollX, 0);
    }

    /**
     * 是否是多指触控
     *
     * @return
     */
    public boolean isMultipleTouch() {
        return mMultipleTouch;
    }

    protected void checkAndFixScrollX() {
        int contentSizeWidth = (getMaxScrollX());
        if (mScrollX < getMinScrollX()) {
            mScrollX = getMinScrollX();
            mScroller.forceFinished(true);
        } else if (mScrollX > contentSizeWidth) {
            mScrollX = contentSizeWidth;
            mScroller.forceFinished(true);
        }
    }

    public float getScaleXMax() {
        return mScaleXMax;
    }

    public float getScaleXMin() {
        return mScaleXMin;
    }

    public boolean isScrollEnable() {
        return mScrollEnable;
    }

    public boolean isScaleEnable() {
        return mScaleEnable;
    }

    /**
     * 设置缩放的最大值
     */
    public void setScaleXMax(float scaleXMax) {
        mScaleXMax = scaleXMax;
    }

    /**
     * 设置缩放的最小值
     */
    public void setScaleXMin(float scaleXMin) {
        mScaleXMin = scaleXMin;
    }

    /**
     * 设置是否可以滑动
     */
    public void setScrollEnable(boolean scrollEnable) {
        mScrollEnable = scrollEnable;
    }

    /**
     * 设置是否可以缩放
     */
    public void setScaleEnable(boolean scaleEnable) {
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "setScaleEnable " + mScaleEnable + " -> " + scaleEnable);
        }
        mScaleEnable = scaleEnable;
    }

    @Override
    public float getScaleX() {
        return mScaleX;
    }

    public void applyScaleX(float scaleX) {
        float clamped = scaleX;
        if (clamped < mScaleXMin) {
            clamped = mScaleXMin;
        } else if (clamped > mScaleXMax) {
            clamped = mScaleXMax;
        }
        float oldScale = mScaleX;
        mScaleX = clamped;
        if (Math.abs(mScaleX - oldScale) > 0.0001f) {
            onScaleChanged(mScaleX, oldScale);
        }
    }
}
