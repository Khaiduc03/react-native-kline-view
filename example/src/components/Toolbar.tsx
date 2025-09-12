import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { ToolbarProps, Theme } from '../types';

const Toolbar: React.FC<ToolbarProps> = ({ isDarkTheme, onToggleTheme }) => {
  const theme = require('../constants').ThemeManager.getCurrentTheme(isDarkTheme);

  return (
    <View style={[styles.toolbar, { backgroundColor: theme.headerColor }]}>
      <Text style={[styles.title, { color: theme.textColor }]}>K-line Chart</Text>
      <View style={styles.toolbarRight}>
        <Text style={[styles.themeLabel, { color: theme.textColor }]}>
          {isDarkTheme ? 'Night' : 'Day'}
        </Text>
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

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 14,
    marginRight: 8,
  },
});

export default Toolbar;
