package com.github.fujianlian.klinechart.formatter;

import com.github.fujianlian.klinechart.base.IValueFormatter;

import java.util.Locale;

/**
 * Format large data values
 * Created by tifezh on 2017/12/13.
 */

public class BigValueFormatter implements IValueFormatter{

	// Must be sorted
    private int[] values={10000,1000000,100000000};
	private String[] units={"万","百万","亿"}; // Chinese units: 万=10k, 百万=1M, 亿=100M

    @Override
    public String format(float value) {
        String unit="";
        int i=values.length-1;
        while (i>=0)
        {
            if(value>values[i]) {
                value /= values[i];
                unit = units[i];
                break;
            }
            i--;
        }
        return String.format(Locale.getDefault(),"%.2f", value)+unit;
    }
}
