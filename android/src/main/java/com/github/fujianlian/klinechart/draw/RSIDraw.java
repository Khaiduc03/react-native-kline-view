package com.github.fujianlian.klinechart.draw;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
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

import static android.graphics.Typeface.NORMAL;

/**
 * RSI实现类
 * Created by tifezh on 2016/6/19.
 */
public class RSIDraw implements IChartDraw<IRSI> {
    private static final String TAG = "RNKLineView.RSIDraw";

    private Context mContext = null;

    private Paint mRSI1Paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mRSI2Paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint mRSI3Paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Paint primaryPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    public RSIDraw(BaseKLineChartView view) {
        mContext = view.getContext();
    }

    @Override
    public void drawTranslated(@Nullable IRSI lastPoint, @NonNull IRSI curPoint, float lastX, float curX, @NonNull Canvas canvas, @NonNull BaseKLineChartView view, int position) {
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
        String text = "";
        for (int i = 0; i < view.configManager.rsiList.size(); i++) {
            HTKLineTargetItem configItem = (HTKLineTargetItem) view.configManager.rsiList.get(i);
            HTKLineTargetItem targetItem = safeTargetItem(point.rsiList, configItem.index, "drawText");
            if (targetItem == null) {
                continue;
            }
            this.primaryPaint.setColor(safeTargetColor(view, configItem.index));
            StringBuilder stringBuilder = new StringBuilder();
            stringBuilder.append("RSI(");
            stringBuilder.append(targetItem.title);
            stringBuilder.append("):");
            stringBuilder.append(view.formatValue(targetItem.value));
            stringBuilder.append("  ");
            text = stringBuilder.toString();
            canvas.drawText(text, x, y, this.primaryPaint);
            x += this.primaryPaint.measureText(text);
        }
    }

    @Override
    public float getMaxValue(IRSI point) {
        KLineEntity item = (KLineEntity) point;
        return item.targetListISMax(item.rsiList, true);
    }

    @Override
    public float getMinValue(IRSI point) {
        KLineEntity item = (KLineEntity) point;
        return item.targetListISMax(item.rsiList, false);
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

    /**
     * 设置曲线宽度
     */
    public void setLineWidth(float width) {
        mRSI1Paint.setStrokeWidth(width);
        mRSI2Paint.setStrokeWidth(width);
        mRSI3Paint.setStrokeWidth(width);
        primaryPaint.setStrokeWidth(width);
    }

    /**
     * 设置文字大小
     */
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

    private HTKLineTargetItem safeTargetItem(java.util.List<HTKLineTargetItem> list, int index, String owner) {
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
}
