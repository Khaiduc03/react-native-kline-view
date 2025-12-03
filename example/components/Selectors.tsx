import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { TimeTypes, IndicatorTypes, DrawToolTypes } from '../utils/constants';

type Theme = {
  [key: string]: any;
};

type SelectorsProps = {
  theme: Theme;
  showTimeSelector: boolean;
  showIndicatorSelector: boolean;
  showDrawToolSelector: boolean;
  selectedTimeType: number;
  selectedMainIndicator: number;
  selectedSubIndicator: number;
  selectedDrawTool: number;
  drawShouldContinue: boolean;
  onSelectTimeType: (timeType: number) => void;
  onSelectIndicator: (type: 'main' | 'sub', indicator: number) => void;
  onSelectDrawTool: (tool: number) => void;
  onCloseTimeSelector: () => void;
  onCloseIndicatorSelector: () => void;
  onToggleDrawShouldContinue: (value: boolean) => void;
};

const Selectors: React.FC<SelectorsProps> = ({
  theme,
  showTimeSelector,
  showIndicatorSelector,
  showDrawToolSelector,
  selectedTimeType,
  selectedMainIndicator,
  selectedSubIndicator,
  selectedDrawTool,
  drawShouldContinue,
  onSelectTimeType,
  onSelectIndicator,
  onSelectDrawTool,
  onCloseTimeSelector,
  onCloseIndicatorSelector,
  onToggleDrawShouldContinue,
}) => {
  const styles = createSelectorsStyles(theme);
  return (
    <>
      {/* Time selector */}
      {showTimeSelector && (
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorModal}>
            <Text style={styles.selectorTitle}>Select Time Period</Text>
            <ScrollView style={styles.selectorList}>
              {Object.keys(TimeTypes).map(timeTypeKey => {
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
                        selectedTimeType === timeType &&
                          styles.selectedItemText,
                      ]}
                    >
                      {TimeTypes[timeType].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCloseTimeSelector}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Indicator selector */}
      {showIndicatorSelector && (
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorModal}>
            <Text style={styles.selectorTitle}>Select Indicator</Text>
            <ScrollView style={styles.selectorList}>
              {Object.keys(IndicatorTypes).map(typeKey => {
                const type = typeKey as 'main' | 'sub';
                return (
                  <View key={type}>
                    <Text style={styles.selectorSectionTitle}>
                      {type === 'main' ? 'Main Chart' : 'Sub Chart'}
                    </Text>
                    {Object.keys(IndicatorTypes[type]).map(indicatorKey => {
                      const indicator = parseInt(indicatorKey, 10);
                      const isSelected =
                        (type === 'main' &&
                          selectedMainIndicator === indicator) ||
                        (type === 'sub' && selectedSubIndicator === indicator);
                      return (
                        <TouchableOpacity
                          key={indicator}
                          style={[
                            styles.selectorItem,
                            isSelected && styles.selectedItem,
                          ]}
                          onPress={() => onSelectIndicator(type, indicator)}
                        >
                          <Text
                            style={[
                              styles.selectorItemText,
                              isSelected && styles.selectedItemText,
                            ]}
                          >
                            {IndicatorTypes[type][indicator].label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCloseIndicatorSelector}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Drawing tool selector */}
      {showDrawToolSelector && (
        <View style={styles.selectorContainer}>
          {Object.keys(DrawToolTypes).map(toolKey => {
            const tool = parseInt(toolKey, 10);
            const toolConfig = DrawToolTypes[toolKey];
            return (
              <TouchableOpacity
                key={toolKey}
                style={[
                  styles.selectorItem,
                  selectedDrawTool === tool && styles.selectedItem,
                ]}
                onPress={() => onSelectDrawTool(tool)}
              >
                <Text
                  style={[
                    styles.selectorItemText,
                    selectedDrawTool === tool && styles.selectedItemText,
                  ]}
                >
                  {toolConfig.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.selectorItemText}>Continuous Drawing: </Text>
          <Switch
            value={drawShouldContinue}
            onValueChange={onToggleDrawShouldContinue}
          />
        </View>
      )}
    </>
  );
};

export default Selectors;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const createSelectorsStyles = (theme: Theme) => {
  return StyleSheet.create({
    selectorOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectorModal: {
      width: screenWidth * 0.8,
      maxHeight: screenHeight * 0.6,
      backgroundColor: theme.backgroundColor,
      borderRadius: 12,
      padding: 16,
    },
    selectorTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: 16,
    },
    selectorList: {
      maxHeight: screenHeight * 0.4,
    },
    selectorSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 12,
    },
    selectorItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginVertical: 2,
    },
    selectedItem: {
      backgroundColor: theme.buttonColor,
    },
    selectorItemText: {
      fontSize: 16,
      color: theme.textColor,
    },
    selectedItemText: {
      color: '#FFFFFF',
      fontWeight: '500',
    },
    closeButton: {
      marginTop: 16,
      paddingVertical: 12,
      backgroundColor: theme.buttonColor,
      borderRadius: 8,
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    selectorContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
    },
  });
};

