import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TimeSelectorProps } from '../types';
import { TimeTypes } from '../constants';

const TimeSelector: React.FC<TimeSelectorProps> = ({
  visible,
  onClose,
  selectedTimeType,
  onSelectTimeType,
  theme,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.selectorOverlay}>
      <View style={[styles.selectorModal, { backgroundColor: theme.backgroundColor }]}>
        <Text style={[styles.selectorTitle, { color: theme.textColor }]}>Select Time Period</Text>
        <ScrollView style={styles.selectorList}>
          {Object.keys(TimeTypes).map((timeTypeKey) => {
            const timeType = parseInt(timeTypeKey, 10);
            return (
              <TouchableOpacity
                key={timeType}
                style={[
                  styles.selectorItem,
                  selectedTimeType === timeType && styles.selectedItem,
                ]}
                onPress={() => onSelectTimeType(timeType)}
              >
                <Text
                  style={[
                    styles.selectorItemText,
                    { color: theme.textColor },
                    selectedTimeType === timeType && styles.selectedItemText,
                  ]}
                >
                  {TimeTypes[timeType].label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={[styles.closeButtonText, { color: theme.textColor }]}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  selectorModal: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: 12,
    padding: 20,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectorList: {
    maxHeight: 300,
  },
  selectorItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItem: {
    backgroundColor: '#2196F3',
  },
  selectorItemText: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectedItemText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignSelf: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TimeSelector;
