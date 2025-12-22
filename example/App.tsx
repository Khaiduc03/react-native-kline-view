import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import KLineScreen from './screens/KLineScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <KLineScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
