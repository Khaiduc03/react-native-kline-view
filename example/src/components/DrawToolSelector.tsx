import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { DrawToolSelectorProps } from '../types';
import { DrawToolTypes } from '../constants';

const DrawToolSelector: React.FC<DrawToolSelectorProps> = ({
  visible,
  onClose,
  selectedDrawTool,
  drawShouldContinue,
  onSelectDrawTool,
  onToggleDrawContinue,
  theme,
}) => {
  if (!visible) return null;

  return (
    <View style={[styles.selectorContainer, { backgroundColor: theme.backgroundColor }]}>
      {Object.keys(DrawToolTypes).map((toolKey) => (
        <TouchableOpacity
          key={toolKey}
          style={[
            styles.selectorItem,
            selectedDrawTool === parseInt(toolKey, 10) && styles.selectedItem,
          ]}
          onPress={() => onSelectDrawTool(parseInt(toolKey, 10))}
        >
          <Text
            style={[
              styles.selectorItemText,
              { color: theme.textColor },
              selectedDrawTool === parseInt(toolKey, 10) && styles.selectedItemText,
            ]}
          >
            {DrawToolTypes[parseInt(toolKey, 10)].label}
          </Text>
        </TouchableOpacity>
      ))}
      <View style={styles.continueContainer}>
        <Text style={[styles.selectorItemText, { color: theme.textColor }]}>
          Continuous Drawing:{' '}
        </Text>
        <Switch
          value={drawShouldContinue}
          onValueChange={onToggleDrawContinue}
          trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
          thumbColor={drawShouldContinue ? '#FFFFFF' : '#F4F3F4'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    zIndex: 1000,
  },
  selectorItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#2196F3',
  },
  selectorItemText: {
    fontSize: 14,
    textAlign: 'center',
  },
  selectedItemText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  continueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
});

export default DrawToolSelector;
