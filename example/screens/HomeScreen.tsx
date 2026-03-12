import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native KLine Demo</Text>
      <Text style={styles.subtitle}>
        Chọn cách dùng phù hợp: đơn giản hoặc đầy đủ tính năng.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SimpleKLineDemo')}
      >
        <Text style={styles.buttonText}>Simple: chỉ truyền candles</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate('BinanceLiveDemo')}
      >
        <Text style={styles.buttonText}>Binance: REST + realtime WS</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.tertiaryButton]}
        onPress={() => navigation.navigate('KLineDemo')}
      >
        <Text style={styles.buttonText}>Advanced: full optionList</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    maxWidth: 320,
    marginBottom: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#0ea5e9',
  },
  tertiaryButton: {
    backgroundColor: '#6366f1',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
