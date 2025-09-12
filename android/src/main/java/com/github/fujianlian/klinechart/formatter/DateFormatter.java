package com.github.fujianlian.klinechart.formatter;

import com.github.fujianlian.klinechart.base.IDateTimeFormatter;
import com.github.fujianlian.klinechart.utils.DateUtil;

import java.util.Date;

/**
 * Date formatter
 * Created by tifezh on 2016/6/21.
 */

public class DateFormatter implements IDateTimeFormatter {
    @Override
    public String format(Date date) {
        if (date != null) {
            return DateUtil.DateFormat.format(date);
        } else {
            return "";
        }
    }
}
