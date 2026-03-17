package com.github.fujianlian.klinechart.container;


import android.view.MotionEvent;
import android.view.ViewGroup;
import android.widget.RelativeLayout;
import android.util.Log;
import com.facebook.react.bridge.*;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.github.fujianlian.klinechart.BuildConfig;
import com.github.fujianlian.klinechart.HTKLineConfigManager;
import com.github.fujianlian.klinechart.KLineChartView;
import com.github.fujianlian.klinechart.BaseKLineChartView;
import com.github.fujianlian.klinechart.KLineEntity;
import com.github.fujianlian.klinechart.RNKLineView;
import com.github.fujianlian.klinechart.formatter.DateFormatter;


public class HTKLineContainerView extends RelativeLayout {
    private static final String TAG = "RNKLineView.Container";

    private ThemedReactContext reactContext;

    public HTKLineConfigManager configManager = new HTKLineConfigManager();

    public KLineChartView klineView;

    public HTShotView shotView;

    public HTKLineContainerView(ThemedReactContext context) {
        super(context);
        this.reactContext = context;
        klineView = new KLineChartView(getContext(), configManager);
        // More, smaller grid cells
        klineView.setGridColumns(0);
        klineView.setGridRows(4);
        klineView.setChildDraw(0);
        klineView.setDateTimeFormatter(new DateFormatter());
        klineView.configManager = configManager;
        klineView.setRefreshListener(new KLineChartView.KChartRefreshListener() {
            @Override
            public void onLoadMoreBegin(KLineChartView chart) {
                emitLoadMore();
                chart.refreshComplete();
            }
        });
        addView(klineView, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        if (shotView == null) {
            ViewGroup shotTarget = resolveShotTarget();
            shotView = new HTShotView(getContext(), shotTarget);
            shotView.setEnabled(false);
            shotView.dimension = 300;
        }
        if (shotView.getParent() != this) {
            if (shotView.getParent() instanceof ViewGroup) {
                ((ViewGroup) shotView.getParent()).removeView(shotView);
            }
            RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(shotView.dimension, shotView.dimension);
            layoutParams.setMargins(50, 50, 0, 0);
            addView(shotView, layoutParams);
            shotView.bringToFront();
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        if (shotView != null && shotView.getParent() == this) {
            removeView(shotView);
        }
        super.onDetachedFromWindow();
    }

    private ViewGroup resolveShotTarget() {
        if (getParent() instanceof ViewGroup) {
            return (ViewGroup) getParent();
        }
        return this;
    }

    public void reloadConfigManager() {
        if (BuildConfig.DEBUG) {
            Log.d(
                    TAG,
                    "reloadConfigManager count=" + configManager.modelArray.size()
                            + " drawState=" + configManager.shouldReloadDrawItemIndex
                            + " drawType=" + configManager.drawType
                            + " itemWidth=" + configManager.itemWidth
                            + " candleWidth=" + configManager.candleWidth
            );
        }
        klineView.changeMainDrawType(klineView.configManager.primaryStatus);
        klineView.changeSecondDrawType(klineView.configManager.secondStatus);
        klineView.setMainDrawLine(klineView.configManager.isMinute);
        klineView.setPointWidth(klineView.configManager.itemWidth);
        klineView.setCandleWidth(klineView.configManager.candleWidth);

        if (klineView.configManager.fontFamily.length() > 0) {
            klineView.setTextFontFamily(klineView.configManager.fontFamily);
        }
        klineView.setTextColor(klineView.configManager.textColor);
        klineView.setTextSize(klineView.configManager.rightTextFontSize);
        klineView.setMTextSize(klineView.configManager.candleTextFontSize);
        klineView.setMTextColor(klineView.configManager.candleTextColor);
        klineView.reloadColor();
        klineView.setGridLineColor(klineView.configManager.gridColor);

        // Register prediction select callback
        final int viewId = this.getId();
        klineView.mOnPredictionSelectListener = new BaseKLineChartView.OnPredictionSelectListener() {
            @Override
            public void onPredictionSelect(java.util.Map<String, Object> payload) {
                WritableMap map = Arguments.createMap();
                for (java.util.Map.Entry<String, Object> entry : payload.entrySet()) {
                    String key = entry.getKey();
                    Object value = entry.getValue();
                    if (value == null) {
                        map.putNull(key);
                    } else if (value instanceof String) {
                        map.putString(key, (String) value);
                    } else if (value instanceof Number) {
                        map.putDouble(key, ((Number) value).doubleValue());
                    } else if (value instanceof Boolean) {
                        map.putBoolean(key, (Boolean) value);
                    } else if (value instanceof Integer) {
                        map.putInt(key, (Integer) value);
                    }
                }
                reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                        viewId,
                        RNKLineView.onPredictionSelectKey,
                        map
                );
            }
        };

        Boolean isEnd = klineView.getScrollOffset() >= klineView.getMaxScrollX();
        // Do not force scroll to end after append/update unless explicitly requested
        klineView.configManager.shouldScrollToEnd = false;
        klineView.notifyChanged();
        if (isEnd || klineView.configManager.shouldScrollToEnd) {
            klineView.setScrollX(klineView.getMaxScrollX());
        }
        if (BuildConfig.DEBUG) {
            Log.d(
                    TAG,
                    "after reload scrollX=" + klineView.getScrollOffset()
                            + " maxScrollX=" + klineView.getMaxScrollX()
                            + " scale=" + klineView.getScaleX()
            );
        }


        final int id = this.getId();
        configManager.onDrawItemDidTouch = new Callback() {
            @Override
            public void invoke(Object... args) {
                HTDrawItem drawItem = (HTDrawItem) args[0];
                int drawItemIndex = (int) args[1];
                configManager.shouldReloadDrawItemIndex = drawItemIndex;

                WritableMap map = Arguments.createMap();
                if (drawItem != null) {
                    int drawColor = drawItem.drawColor;
                    int alpha = (drawColor >> 24) & 0xFF;
                    int red = (drawColor >> 16) & 0xFF;
                    int green = (drawColor >> 8) & 0xFF;
                    int blue = (drawColor) & 0xFF;
                    WritableArray colorList = Arguments.createArray();

                    colorList.pushDouble(red / 255.0);
                    colorList.pushDouble(green / 255.0);
                    colorList.pushDouble(blue / 255.0);
                    colorList.pushDouble(alpha / 255.0);

                    map.putArray("drawColor", colorList);
                    map.putDouble("drawLineHeight", drawItem.drawLineHeight);
                    map.putDouble("drawDashWidth", drawItem.drawDashWidth);
                    map.putDouble("drawDashSpace", drawItem.drawDashSpace);
                    map.putBoolean("drawIsLock", drawItem.drawIsLock);
                }
                map.putInt("shouldReloadDrawItemIndex", drawItemIndex);
                reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                        id,
                        RNKLineView.onDrawItemDidTouchKey,
                        map
                );
            }
        };
        configManager.onDrawItemComplete = new Callback() {
            @Override
            public void invoke(Object... args) {
                reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                        id,
                        RNKLineView.onDrawItemCompleteKey,
                        Arguments.createMap()
                );
            }
        };
        configManager.onDrawPointComplete = new Callback() {
            @Override
            public void invoke(Object... args) {
                HTDrawItem drawItem = (HTDrawItem) args[0];
                WritableMap map = Arguments.createMap();
                map.putInt("pointCount", drawItem.pointList.size());
                reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                        id,
                        RNKLineView.onDrawPointCompleteKey,
                        map
                );
            }
        };

        int reloadIndex = configManager.shouldReloadDrawItemIndex;
        if (reloadIndex >= 0 && reloadIndex < klineView.drawContext.drawItemList.size()) {
            HTDrawItem drawItem = klineView.drawContext.drawItemList.get(reloadIndex);
            drawItem.drawColor = configManager.drawColor;
            drawItem.drawLineHeight = configManager.drawLineHeight;
            drawItem.drawDashWidth = configManager.drawDashWidth;
            drawItem.drawDashSpace = configManager.drawDashSpace;
            drawItem.drawIsLock = configManager.drawIsLock;
            if (configManager.drawShouldTrash) {
                configManager.shouldReloadDrawItemIndex = HTDrawState.showPencil;
                klineView.drawContext.drawItemList.remove(reloadIndex);
                configManager.drawShouldTrash = false;
            }
            klineView.drawContext.invalidate();
        } else if (reloadIndex > HTDrawState.showContext) {
            configManager.shouldReloadDrawItemIndex = HTDrawState.showPencil;
        }


        if (configManager.shouldFixDraw) {
            configManager.shouldFixDraw = false;
            klineView.drawContext.fixDrawItemList();
        }
        if (configManager.shouldClearDraw) {
            configManager.shouldReloadDrawItemIndex = HTDrawState.showPencil;
            configManager.shouldClearDraw = false;
            klineView.drawContext.clearDrawItemList();
        }

    }

    private HTPoint convertLocation(HTPoint location) {
        HTPoint reloadLocation = new HTPoint(location.x, location.y);
        reloadLocation.x = Math.max(0, Math.min(reloadLocation.x, getWidth()));
        reloadLocation.y = Math.max(0, Math.min(reloadLocation.y, getHeight()));
//        reloadLocation.x += klineView.getScrollOffset();
        reloadLocation = klineView.valuePointFromViewPoint(reloadLocation);
        return reloadLocation;
    }

    public void unPredictionSelect() {
        if (klineView != null) {
            klineView.unPredictionSelect();
        }
    }

    public void prependData(java.util.List<KLineEntity> entities) {
        if (entities == null || entities.isEmpty()) return;
        int previousCount = configManager.modelArray.size();
        int oldScroll = klineView.getScrollOffset();
        float oldScale = klineView.getScaleX() == 0 ? 1f : klineView.getScaleX();
        int oldVisibleStart = klineView.getVisibleStartIndex();
        int anchorIndex = previousCount > 0
                ? Math.max(0, Math.min(oldVisibleStart, previousCount - 1))
                : -1;
        Long anchorId = anchorIndex >= 0 ? configManager.modelArray.get(anchorIndex).id : null;
        float oldAnchorScreenX = anchorIndex >= 0
                ? (klineView.getItemMiddleScrollX(anchorIndex) - oldScroll) * oldScale
                : 0f;

        int oldSelectedIndex = klineView.getSelectedIndex();
        Long selectedId = null;
        if (oldSelectedIndex >= 0 && oldSelectedIndex < previousCount) {
            selectedId = configManager.modelArray.get(oldSelectedIndex).id;
        }

        configManager.modelArray.addAll(0, entities);
        reloadConfigManager();
        boolean anchorRestored = false;
        if (anchorId != null) {
            int newAnchorIndex = findIndexById(anchorId.longValue());
            if (newAnchorIndex >= 0) {
                float newScale = klineView.getScaleX() == 0 ? 1f : klineView.getScaleX();
                float desiredScroll = klineView.getItemMiddleScrollX(newAnchorIndex) - (oldAnchorScreenX / newScale);
                klineView.setScrollX(Math.round(desiredScroll));
                anchorRestored = true;
            } else {
                emitError("E_PREPEND_ANCHOR_MISS", "Anchor candle missing after prependData on Android.", false);
            }
        }
        if (!anchorRestored) {
            int delta = Math.round(configManager.itemWidth * entities.size());
            klineView.setScrollX(oldScroll + delta);
        }

        if (selectedId != null) {
            int newSelectedIndex = findIndexById(selectedId.longValue());
            if (newSelectedIndex >= 0) {
                klineView.setSelectedIndexIfLongPress(newSelectedIndex);
            } else {
                klineView.offsetSelectedIndexIfLongPress(entities.size());
            }
        } else {
            klineView.offsetSelectedIndexIfLongPress(entities.size());
        }
    }



    @Override
    public boolean onInterceptTouchEvent(MotionEvent event) {
        if (BuildConfig.DEBUG && event != null) {
            Log.d(
                    TAG,
                    "onIntercept action=" + event.getActionMasked()
                            + " pointers=" + event.getPointerCount()
                            + " drawState=" + configManager.shouldReloadDrawItemIndex
                            + " drawType=" + configManager.drawType
            );
        }
        if (event != null && event.getPointerCount() > 1) {
            // Keep pinch-zoom handled by chart view.
            if (getParent() != null) {
                getParent().requestDisallowInterceptTouchEvent(true);
            }
            return false;
        }
        int reloadIndex = configManager.shouldReloadDrawItemIndex;
        if (reloadIndex > HTDrawState.showContext && !isValidDrawItemIndex(reloadIndex)) {
            configManager.shouldReloadDrawItemIndex = HTDrawState.showPencil;
            reloadIndex = HTDrawState.showPencil;
        }
        switch (reloadIndex) {
            case HTDrawState.none: {
                return false;
            }
            case HTDrawState.showPencil: {
                if (configManager.drawType == HTDrawType.none) {
                    HTPoint location = new HTPoint(event.getX(), event.getY());
                    location = convertLocation(location);
                    if ((HTDrawItem.canResponseLocation(klineView.drawContext.drawItemList, location, klineView)) == null) {
                        return false;
                    }
                }
                return true;
            }
            case HTDrawState.showContext: {
                if (configManager.drawType == HTDrawType.none) {
                    HTPoint location = new HTPoint(event.getX(), event.getY());
                    location = convertLocation(location);
                    if ((HTDrawItem.canResponseLocation(klineView.drawContext.drawItemList, location, klineView)) == null) {
                        return false;
                    }
                }
                return true;
            }
        }
        return true;
    }

    private HTPoint lastLocation;

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (BuildConfig.DEBUG && event != null) {
            Log.d(
                    TAG,
                    "onTouch action=" + event.getActionMasked()
                            + " pointers=" + event.getPointerCount()
            );
        }
        handlerDraw(event);
        handlerShot(event);
        return true;
    }

    private void handlerDraw(MotionEvent event) {
        HTPoint location = new HTPoint(event.getX(), event.getY());
        location = convertLocation(location);
        HTPoint previousLocation = lastLocation != null ? lastLocation : location;
        lastLocation = location;
        int state = event.getAction();
        Boolean isCancel = state == MotionEvent.ACTION_CANCEL;
        if (isCancel) {
            state = MotionEvent.ACTION_UP;
        }
        HTPoint translation = new HTPoint(
                location.x - previousLocation.x,
                location.y - previousLocation.y
        );
        if (event.getAction() == MotionEvent.ACTION_UP || event.getAction() == MotionEvent.ACTION_CANCEL) {
            lastLocation = null;
        }
        klineView.drawContext.touchesGesture(location, translation, state);
    }

    private void handlerShot(MotionEvent event) {
        if (shotView == null) {
            return;
        }
        if (event.getAction() == MotionEvent.ACTION_UP || event.getAction() == MotionEvent.ACTION_CANCEL) {
            shotView.setPoint(null);
            lastLocation = null;
        } else {
            shotView.setPoint(new HTPoint(event.getX(), event.getY()));
        }
    }

    private void emitLoadMore() {
        WritableMap map = Arguments.createMap();
        double earliestId = configManager.modelArray.isEmpty() ? 0 : configManager.modelArray.get(0).id;
        map.putDouble("earliestId", earliestId);
        int visibleFrom = klineView.getVisibleStartIndex();
        if (!configManager.modelArray.isEmpty()) {
            int safeVisibleFrom = Math.max(0, Math.min(visibleFrom, configManager.modelArray.size() - 1));
            map.putDouble("firstVisibleId", configManager.modelArray.get(safeVisibleFrom).id);
        } else {
            map.putDouble("firstVisibleId", 0);
        }
        WritableMap range = Arguments.createMap();
        range.putInt("from", visibleFrom);
        range.putInt("to", klineView.getVisibleStopIndex());
        map.putMap("visibleRange", range);
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                this.getId(),
                RNKLineView.onLoadMoreKey,
                map
        );
    }

    private int findIndexById(long id) {
        for (int i = 0; i < configManager.modelArray.size(); i++) {
            if (configManager.modelArray.get(i).id == id) {
                return i;
            }
        }
        return -1;
    }

    private boolean isValidDrawItemIndex(int index) {
        return index >= 0 && index < klineView.drawContext.drawItemList.size();
    }

    public void emitError(String code, String message, boolean fatal) {
        WritableMap map = Arguments.createMap();
        map.putString("code", code);
        map.putString("message", message);
        map.putString("source", "android");
        map.putBoolean("fatal", fatal);
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                this.getId(),
                RNKLineView.onChartErrorKey,
                map
        );
    }

}
