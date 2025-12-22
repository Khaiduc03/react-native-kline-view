package com.github.fujianlian.klinechart;

import android.graphics.Color;
import android.os.Build;
import android.util.Log;
import android.view.View;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.github.fujianlian.klinechart.container.HTKLineContainerView;
import com.github.fujianlian.klinechart.draw.PrimaryStatus;
import com.github.fujianlian.klinechart.draw.SecondStatus;
import com.github.fujianlian.klinechart.formatter.DateFormatter;
import com.github.fujianlian.klinechart.formatter.ValueFormatter;

import javax.annotation.Nonnull;
import java.text.SimpleDateFormat;
import java.util.*;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.parser.Feature;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;

public class RNKLineView extends SimpleViewManager<HTKLineContainerView> {
    private static final String TAG = "RNKLineView";

	public static String onDrawItemDidTouchKey = "onDrawItemDidTouch";

	public static String onDrawItemCompleteKey = "onDrawItemComplete";

	public static String onDrawPointCompleteKey = "onDrawPointComplete";

    @Nonnull
    @Override
    public String getName() {
        return "RNKLineView";
    }

    @Nonnull
    @Override
    protected HTKLineContainerView createViewInstance(@Nonnull ThemedReactContext reactContext) {
    	HTKLineContainerView containerView = new HTKLineContainerView(reactContext);
    	return containerView;
    }

	@Override
	public Map getExportedCustomDirectEventTypeConstants() {
		return MapBuilder.of(
				onDrawItemDidTouchKey, MapBuilder.of("registrationName", onDrawItemDidTouchKey),
				onDrawItemCompleteKey, MapBuilder.of("registrationName", onDrawItemCompleteKey),
				onDrawPointCompleteKey, MapBuilder.of("registrationName", onDrawPointCompleteKey)
		);
	}





    


    // ----- Imperative commands (Phase 1) -----
    private static final int COMMAND_SET_DATA = 1;
    private static final int COMMAND_APPEND_CANDLE = 2;
    private static final int COMMAND_UPDATE_LAST_CANDLE = 3;

  private static final String COMMAND_SET_DATA_NAME = "setData";
  private static final String COMMAND_APPEND_CANDLE_NAME = "appendCandle";
  private static final String COMMAND_UPDATE_LAST_CANDLE_NAME = "updateLastCandle";
    public Map<String, Integer> getCommandsMap() {
        Map<String, Integer> map = new HashMap<>();
        map.put("setData", COMMAND_SET_DATA);
        map.put("appendCandle", COMMAND_APPEND_CANDLE);
        map.put("updateLastCandle", COMMAND_UPDATE_LAST_CANDLE);
        return map;
    }
public void receiveCommand(@Nonnull final HTKLineContainerView root, int commandId, @androidx.annotation.Nullable final ReadableArray args) {
        if (root == null) {
            Log.w(TAG, "receiveCommand: root is null, commandId=" + commandId);
            return;
        }

        switch (commandId) {
            case COMMAND_SET_DATA: {
                if (args == null || args.size() == 0 || args.isNull(0)) {
                    Log.w(TAG, "setData: args empty or null");
                    return;
                }
                final ReadableArray candleArray = args.getArray(0);
                if (candleArray == null) {
                    Log.w(TAG, "setData: candleArray is null");
                    return;
                }
                Log.i(TAG, "setData: count=" + candleArray.size());

                // Copy ReadableArray into plain Java structures on the UI thread (ReadableArray is not thread-safe)
                final List<Map<String, Object>> candleMaps = new ArrayList<>();
                for (int i = 0; i < candleArray.size(); i++) {
                    if (!candleArray.isNull(i)) {
                        ReadableMap m = candleArray.getMap(i);
                        if (m != null) {
                            candleMaps.add(readableMapToMap(m));
                        }
                    }
                }

                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        final List<KLineEntity> entities = root.configManager.packModelList((List) candleMaps);
                        root.post(new Runnable() {
                            @Override
                            public void run() {
                                root.configManager.modelArray.clear();
                                root.configManager.modelArray.addAll(entities);
                                root.reloadConfigManager();
                            }
                        });
                    }
                }).start();
                return;
            }

            case COMMAND_APPEND_CANDLE: {
                if (args == null || args.size() == 0 || args.isNull(0)) {
                    Log.w(TAG, "appendCandle: args empty or null");
                    return;
                }
                final ReadableMap candle = args.getMap(0);
                if (candle == null) {
                    Log.w(TAG, "appendCandle: candle is null");
                    return;
                }
                final Map<String, Object> candleMap = readableMapToMap(candle);
                Log.i(TAG, "appendCandle keys=" + candleMap.keySet());

                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        final KLineEntity entity = root.configManager.packModel(candleMap);
                        root.post(new Runnable() {
                            @Override
                            public void run() {
                                root.configManager.modelArray.add(entity);
                                root.reloadConfigManager();
                            }
                        });
                    }
                }).start();
                return;
            }

            case COMMAND_UPDATE_LAST_CANDLE: {
                if (args == null || args.size() == 0 || args.isNull(0)) {
                    Log.w(TAG, "updateLastCandle: args empty or null");
                    return;
                }
                final ReadableMap candle = args.getMap(0);
                if (candle == null) {
                    Log.w(TAG, "updateLastCandle: candle is null");
                    return;
                }
                final Map<String, Object> candleMap = readableMapToMap(candle);
                Log.i(TAG, "updateLastCandle keys=" + candleMap.keySet());

                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        final KLineEntity entity = root.configManager.packModel(candleMap);
                        root.post(new Runnable() {
                            @Override
                            public void run() {
                                int size = root.configManager.modelArray.size();
                                if (size == 0) {
                                    root.configManager.modelArray.add(entity);
                                } else {
                                    root.configManager.modelArray.set(size - 1, entity);
                                }
                                root.reloadConfigManager();
                            }
                        });
                    }
                }).start();
                return;
            }
        }
    }

    @Override
    public void receiveCommand(@Nonnull final HTKLineContainerView root, @Nonnull String commandId, final ReadableArray args) {
        if (commandId == null) return;
        switch (commandId) {
            case "setData":
                receiveCommand(root, COMMAND_SET_DATA, args);
                return;
            case "appendCandle":
                receiveCommand(root, COMMAND_APPEND_CANDLE, args);
                return;
            case "updateLastCandle":
                receiveCommand(root, COMMAND_UPDATE_LAST_CANDLE, args);
                return;
            default:
                return;
        }
    }

    private static Map<String, Object> readableMapToMap(ReadableMap map) {
        Map<String, Object> result = new HashMap<>();
        ReadableMapKeySetIterator iterator = map.keySetIterator();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            ReadableType type = map.getType(key);
            switch (type) {
                case Null:
                    result.put(key, null);
                    break;
                case Boolean:
                    result.put(key, map.getBoolean(key));
                    break;
                case Number:
                    // React Native numbers are doubles on the bridge
                    result.put(key, map.getDouble(key));
                    break;
                case String:
                    result.put(key, map.getString(key));
                    break;
                case Map:
                    result.put(key, readableMapToMap(map.getMap(key)));
                    break;
                case Array:
                    result.put(key, readableArrayToList(map.getArray(key)));
                    break;
            }
        }
        return result;
    }

    private static List<Object> readableArrayToList(ReadableArray array) {
        List<Object> result = new ArrayList<>();
        for (int i = 0; i < array.size(); i++) {
            ReadableType type = array.getType(i);
            switch (type) {
                case Null:
                    result.add(null);
                    break;
                case Boolean:
                    result.add(array.getBoolean(i));
                    break;
                case Number:
                    result.add(array.getDouble(i));
                    break;
                case String:
                    result.add(array.getString(i));
                    break;
                case Map:
                    result.add(readableMapToMap(array.getMap(i)));
                    break;
                case Array:
                    result.add(readableArrayToList(array.getArray(i)));
                    break;
            }
        }
        return result;
    }


@ReactProp(name = "optionList")
    public void setOptionList(final HTKLineContainerView containerView, String optionList) {
        if (optionList == null) {
            return;
        }
        
        new Thread(new Runnable() {
            @Override
            public void run() {
                int disableDecimalFeature = JSON.DEFAULT_PARSER_FEATURE & ~Feature.UseBigDecimal.getMask();
                Map optionMap = (Map)JSON.parse(optionList, disableDecimalFeature);
                containerView.configManager.reloadOptionList(optionMap);
                containerView.post(new Runnable() {
                    @Override
                    public void run() {
                        containerView.reloadConfigManager();
                    }
                });
            }
        }).start();
    }



}