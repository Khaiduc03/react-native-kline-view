import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { IndicatorSelectorProps } from '../types';
import { IndicatorTypes } from '../constants';

const IndicatorSelector: React.FC<IndicatorSelectorProps> = ({
  visible,
  onClose,
  selectedMainIndicator,
  selectedSubIndicator,
  onSelectIndicator,
  theme,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.selectorOverlay}>
      <View style={[styles.selectorModal, { backgroundColor: theme.backgroundColor }]}>
        <Text style={[styles.selectorTitle, { color: theme.textColor }]}>Select Indicator</Text>
        <ScrollView style={styles.selectorList}>
          {Object.keys(IndicatorTypes).map((type) => (
            <View key={type}>
              <Text style={[styles.selectorSectionTitle, { color: theme.textColor }]}>
                {type === 'main' ? 'Main Chart' : 'Sub Chart'}
              </Text>
              {Object.keys(IndicatorTypes[type]).map((indicatorKey) => {
                const indicator = parseInt(indicatorKey, 10);
                return (
                  <TouchableOpacity
                    key={indicator}
                    style={[
                      styles.selectorItem,
                      ((type === 'main' && selectedMainIndicator === indicator) ||
                        (type === 'sub' && selectedSubIndicator === indicator)) &&
                        styles.selectedItem,
                    ]}
                    onPress={() => onSelectIndicator(type as 'main' | 'sub', indicator)}
                  >
                    <Text
                      style={[
                        styles.selectorItemText,
                        { color: theme.textColor },
                        ((type === 'main' && selectedMainIndicator === indicator) ||
                          (type === 'sub' && selectedSubIndicator === indicator)) &&
                          styles.selectedItemText,
                      ]}
                    >
                      {IndicatorTypes[type][indicator].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
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
  selectorSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
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

export default IndicatorSelector;
