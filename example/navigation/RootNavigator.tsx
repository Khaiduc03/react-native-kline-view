import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import KLineScreen from '../screens/KLineScreen';

export type RootStackParamList = {
  Home: undefined;
  KLineDemo: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="KLineDemo"
        component={KLineScreen}
        options={{ title: 'KLine Demo' }}
      />
    </Stack.Navigator>
  );
}
