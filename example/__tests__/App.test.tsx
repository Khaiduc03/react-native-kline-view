/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-screens', () => {
  const { View } = require('react-native');
  return {
    Screen: View,
    ScreenContainer: View,
    FullWindowOverlay: View,
    enableScreens: jest.fn(),
  };
});

jest.mock('../navigation/RootNavigator', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockRootNavigator() {
    return React.createElement(View, { testID: 'root-navigator' });
  };
});

const App = require('../App').default;

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
