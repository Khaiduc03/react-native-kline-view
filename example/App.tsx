import React from 'react';
import { StyleSheet, View } from 'react-native';
import KLineScreen from './screens/KLineScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <KLineScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
