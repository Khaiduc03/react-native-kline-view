import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ControlBarProps } from '../types';
import { TimeTypes, IndicatorTypes, DrawTypeConstants, DrawToolHelper } from '../constants';

const ControlBar: React.FC<ControlBarProps> = ({
  selectedTimeType,
  selectedMainIndicator,
  selectedSubIndicator,
  selectedDrawTool,
  onTimeTypePress,
  onIndicatorPress,
  onDrawToolPress,
  onClearDrawings,
  theme,
}) => {
  return (
    <View style={[styles.controlBar, { backgroundColor: theme.backgroundColor }]}>
      <TouchableOpacity style={styles.controlButton} onPress={onTimeTypePress}>
        <Text style={[styles.controlButtonText, { color: theme.textColor }]}>
          {TimeTypes[selectedTimeType].label}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onIndicatorPress}>
        <Text style={[styles.controlButtonText, { color: theme.textColor }]}>
          {IndicatorTypes.main[selectedMainIndicator].label}/{IndicatorTypes.sub[selectedSubIndicator].label}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toolbarButton,
          selectedDrawTool !== DrawTypeConstants.none && styles.activeButton,
        ]}
        onPress={onDrawToolPress}
      >
        <Text
          style={[
            styles.buttonText,
            selectedDrawTool !== DrawTypeConstants.none && styles.activeButtonText,
          ]}
        >
          {selectedDrawTool !== DrawTypeConstants.none
            ? DrawToolHelper.name(selectedDrawTool)
            : 'Drawing'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onClearDrawings}>
        <Text style={[styles.controlButtonText, { color: theme.textColor }]}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  activeButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
});

export default ControlBar;
