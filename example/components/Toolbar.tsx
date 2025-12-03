import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import type { Theme } from '../utils/themes';

type ToolbarProps = {
  theme: Theme;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  onTestUpdate?: () => void;
  onTestAddCandles?: () => void;
  onTestAddCandlesAtStart?: () => void;
};

const Toolbar: React.FC<ToolbarProps> = ({
  theme,
  isDarkTheme,
  onToggleTheme,
  onTestUpdate,
  onTestAddCandles,
  onTestAddCandlesAtStart,
}) => {
  const styles = createToolbarStyles(theme);

  return (
    <View style={styles.toolbar}>
      <View style={styles.toolbarRight}>
        {onTestUpdate && (
          <TouchableOpacity style={styles.testButton} onPress={onTestUpdate}>
            <Text style={styles.testButtonText}>Update Last</Text>
          </TouchableOpacity>
        )}
        {onTestAddCandles && (
          <TouchableOpacity
            style={styles.testButton}
            onPress={onTestAddCandles}
          >
            <Text style={styles.testButtonText}>Add at End</Text>
          </TouchableOpacity>
        )}
        {onTestAddCandlesAtStart && (
          <TouchableOpacity
            style={styles.testButton}
            onPress={onTestAddCandlesAtStart}
          >
            <Text style={styles.testButtonText}>Add at Start</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.themeLabel}>{isDarkTheme ? 'Night' : 'Day'}</Text>
        <Switch
          value={isDarkTheme}
          onValueChange={onToggleTheme}
          trackColor={{ false: '#E0E0E0', true: theme.buttonColor }}
          thumbColor={isDarkTheme ? '#FFFFFF' : '#F4F3F4'}
        />
      </View>
    </View>
  );
};

export default Toolbar;

const createToolbarStyles = (theme: Theme) => {
  return StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.headerColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.gridColor,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    toolbarRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeLabel: {
      fontSize: 14,
      color: theme.textColor,
      marginRight: 8,
    },
    testButton: {
      backgroundColor: theme.buttonColor,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      marginRight: 12,
    },
    testButtonText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });
};
