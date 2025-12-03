import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from './theme';
import {
  DrawTypeConstants,
  DrawTypeValue,
  DrawToolHelper,
  IndicatorTypes,
  MainIndicatorKey,
  SubIndicatorKey,
  TimeTypes,
} from './constants';

export interface ToolbarProps {
  styles: Styles;
  theme: Theme;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}

// Helper type to approximate the shape created by createStyles in KLineChart
export interface Styles {
  container: any;
  toolbar: any;
  title: any;
  toolbarRight: any;
  themeLabel: any;
  chartContainer?: any;
  chart?: any;
  controlBar: any;
  controlButton: any;
  activeButton: any;
  controlButtonText: any;
  activeButtonText: any;
  selectorOverlay: any;
  selectorModal: any;
  selectorTitle: any;
  selectorList: any;
  selectorSectionTitle: any;
  selectorItem: any;
  selectedItem: any;
  selectorItemText: any;
  selectedItemText: any;
  closeButton: any;
  closeButtonText: any;
  selectorContainer: any;
  toolbarButton: any;
  buttonText: any;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  styles,
  theme,
  isDarkTheme,
  onToggleTheme,
}) => (
  <View style={styles.toolbar}>
    <Text style={styles.title}>K线图表</Text>
    <View style={styles.toolbarRight}>
      <Text style={styles.themeLabel}>{isDarkTheme ? '夜间' : '日间'}</Text>
      <Switch
        value={isDarkTheme}
        onValueChange={onToggleTheme}
        trackColor={{ false: '#E0E0E0', true: theme.buttonColor }}
        thumbColor={isDarkTheme ? '#FFFFFF' : '#F4F3F4'}
      />
    </View>
  </View>
);

export interface ControlBarProps {
  styles: Styles;
  selectedTimeType: number;
  selectedMainIndicator: number;
  selectedSubIndicator: number;
  selectedDrawTool: DrawTypeValue;
  onShowTimeSelector: () => void;
  onShowIndicatorSelector: () => void;
  onToggleDrawToolSelector: () => void;
  onClearDrawings: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  styles,
  selectedTimeType,
  selectedMainIndicator,
  selectedSubIndicator,
  selectedDrawTool,
  onShowTimeSelector,
  onShowIndicatorSelector,
  onToggleDrawToolSelector,
  onClearDrawings,
}) => (
  <View style={styles.controlBar}>
    <TouchableOpacity style={styles.controlButton} onPress={onShowTimeSelector}>
      <Text style={styles.controlButtonText}>
        {TimeTypes[selectedTimeType].label}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.controlButton}
      onPress={onShowIndicatorSelector}
    >
      <Text style={styles.controlButtonText}>
        {IndicatorTypes.main[selectedMainIndicator as MainIndicatorKey].label}/
        {IndicatorTypes.sub[selectedSubIndicator as SubIndicatorKey].label}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.toolbarButton,
        selectedDrawTool !== DrawTypeConstants.none && styles.activeButton,
      ]}
      onPress={onToggleDrawToolSelector}
    >
      <Text
        style={[
          styles.buttonText,
          selectedDrawTool !== DrawTypeConstants.none &&
            styles.activeButtonText,
        ]}
      >
        {selectedDrawTool !== DrawTypeConstants.none
          ? DrawToolHelper.name(selectedDrawTool)
          : '绘图'}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.controlButton} onPress={onClearDrawings}>
      <Text style={styles.controlButtonText}>清除</Text>
    </TouchableOpacity>
  </View>
);

export interface TimeSelectorProps {
  styles: Styles;
  visible: boolean;
  selectedTimeType: number;
  onSelect: (timeType: number) => void;
  onClose: () => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  styles,
  visible,
  selectedTimeType,
  onSelect,
  onClose,
}) =>
  visible ? (
    <View style={styles.selectorOverlay}>
      <View style={styles.selectorModal}>
        <Text style={styles.selectorTitle}>选择时间周期</Text>
        <View style={styles.selectorList}>
          {Object.keys(TimeTypes).map(key => {
            const timeType = parseInt(key, 10);
            const isSelected = selectedTimeType === timeType;
            return (
              <TouchableOpacity
                key={timeType}
                style={[styles.selectorItem, isSelected && styles.selectedItem]}
                onPress={() => onSelect(timeType)}
              >
                <Text
                  style={[
                    styles.selectorItemText,
                    isSelected && styles.selectedItemText,
                  ]}
                >
                  {TimeTypes[timeType].label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>关闭</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

export interface IndicatorSelectorProps {
  styles: Styles;
  visible: boolean;
  selectedMainIndicator: number;
  selectedSubIndicator: number;
  onSelect: (type: 'main' | 'sub', value: number) => void;
  onClose: () => void;
}

export const IndicatorSelector: React.FC<IndicatorSelectorProps> = ({
  styles,
  visible,
  selectedMainIndicator,
  selectedSubIndicator,
  onSelect,
  onClose,
}) =>
  visible ? (
    <View style={styles.selectorOverlay}>
      <View style={styles.selectorModal}>
        <Text style={styles.selectorTitle}>选择指标</Text>
        <View style={styles.selectorList}>
          {(['main', 'sub'] as const).map(type => (
            <View key={type}>
              <Text style={styles.selectorSectionTitle}>
                {type === 'main' ? '主图' : '副图'}
              </Text>
              {Object.keys(IndicatorTypes[type]).map(key => {
                const indicator = parseInt(key, 10);
                const isSelected =
                  (type === 'main' && selectedMainIndicator === indicator) ||
                  (type === 'sub' && selectedSubIndicator === indicator);
                return (
                  <TouchableOpacity
                    key={indicator}
                    style={[
                      styles.selectorItem,
                      isSelected && styles.selectedItem,
                    ]}
                    onPress={() => onSelect(type, indicator)}
                  >
                    <Text
                      style={[
                        styles.selectorItemText,
                        isSelected && styles.selectedItemText,
                      ]}
                    >
                      {type === 'main'
                        ? IndicatorTypes.main[indicator as MainIndicatorKey]
                            .label
                        : IndicatorTypes.sub[indicator as SubIndicatorKey]
                            .label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>关闭</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

export interface DrawToolSelectorProps {
  styles: Styles;
  visible: boolean;
  selectedDrawTool: DrawTypeValue;
  drawShouldContinue: boolean;
  onSelectTool: (tool: DrawTypeValue) => void;
  onToggleDrawContinue: (value: boolean) => void;
}

export const DrawToolSelector: React.FC<DrawToolSelectorProps> = ({
  styles,
  visible,
  selectedDrawTool,
  drawShouldContinue,
  onSelectTool,
  onToggleDrawContinue,
}) =>
  visible ? (
    <View style={styles.selectorContainer}>
      {Object.keys(DrawTypeConstants).map(key => {
        const numeric = (DrawTypeConstants as Record<string, DrawTypeValue>)[
          key
        ];
        const isSelected = selectedDrawTool === numeric;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.selectorItem, isSelected && styles.selectedItem]}
            onPress={() => onSelectTool(numeric)}
          >
            <Text
              style={[
                styles.selectorItemText,
                isSelected && styles.selectedItemText,
              ]}
            >
              {DrawToolHelper.name(numeric)}
            </Text>
          </TouchableOpacity>
        );
      })}
      <Text style={styles.selectorItemText}>是否连续绘图: </Text>
      <Switch value={drawShouldContinue} onValueChange={onToggleDrawContinue} />
    </View>
  ) : null;
