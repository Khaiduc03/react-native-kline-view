import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import KLineScreen from '../screens/KLineScreen';
import SimpleKLineScreen from '../screens/SimpleKLineScreen';
import BinanceLiveScreen from '../screens/BinanceLiveScreen';
import ChartAIDemoScreen from '../screens/ChartAIDemoScreen';

export type RootStackParamList = {
  Home: undefined;
  SimpleKLineDemo: undefined;
  BinanceLiveDemo: undefined;
  KLineDemo: undefined;
  ChartAIDemo: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="SimpleKLineDemo"
        component={SimpleKLineScreen}
        options={{ title: 'Simple Demo' }}
      />
      <Stack.Screen
        name="BinanceLiveDemo"
        component={BinanceLiveScreen}
        options={{ title: 'Binance Live' }}
      />
      <Stack.Screen
        name="KLineDemo"
        component={KLineScreen}
        options={{ title: 'KLine Demo' }}
      />
      <Stack.Screen
        name="ChartAIDemo"
        component={ChartAIDemoScreen}
        options={{ title: 'ChartAI Demo' }}
      />
    </Stack.Navigator>
  );
}
