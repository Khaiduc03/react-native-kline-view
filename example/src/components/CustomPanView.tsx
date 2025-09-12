import React from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';

interface PanViewData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  macd?: number;
  dif?: number;
  dea?: number;
}

interface CustomPanViewProps {
  data: PanViewData | null;
  visible: boolean;
  position: { x: number; y: number };
  theme: 'light' | 'dark';
}

const CustomPanView: React.FC<CustomPanViewProps> = ({
  data,
  visible,
  position,
  theme,
}) => {
  if (!visible || !data) return null;

  const isDark = theme === 'dark';
  const styles = createStyles(isDark);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: position.x - 150, // Center the panel
          top: position.y - 200, // Position above the touch point
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Thông tin chi tiết</Text>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{data.time}</Text>
        </View>
      </View>

      {/* Price Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giá</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Mở:</Text>
          <Text
            style={[styles.value, { color: isDark ? '#00FF87' : '#00C853' }]}
          >
            {data.open.toFixed(2)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cao:</Text>
          <Text
            style={[styles.value, { color: isDark ? '#00FF87' : '#00C853' }]}
          >
            {data.high.toFixed(2)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Thấp:</Text>
          <Text
            style={[styles.value, { color: isDark ? '#FF6B6B' : '#FF1744' }]}
          >
            {data.low.toFixed(2)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Đóng:</Text>
          <Text
            style={[styles.value, { color: isDark ? '#00FF87' : '#00C853' }]}
          >
            {data.close.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Change Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biến động</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Thay đổi:</Text>
          <Text
            style={[
              styles.value,
              {
                color:
                  data.change >= 0
                    ? isDark
                      ? '#00FF87'
                      : '#00C853'
                    : isDark
                    ? '#FF6B6B'
                    : '#FF1744',
              },
            ]}
          >
            {data.change >= 0 ? '+' : ''}
            {data.change.toFixed(2)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phần trăm:</Text>
          <Text
            style={[
              styles.value,
              {
                color:
                  data.changePercent >= 0
                    ? isDark
                      ? '#00FF87'
                      : '#00C853'
                    : isDark
                    ? '#FF6B6B'
                    : '#FF1744',
              },
            ]}
          >
            {data.changePercent >= 0 ? '+' : ''}
            {data.changePercent.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Volume */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Khối lượng</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Volume:</Text>
          <Text style={styles.value}>{data.volume.toLocaleString()}</Text>
        </View>
      </View>

      {/* Moving Averages */}
      {(data.ma5 || data.ma10 || data.ma20) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trung bình động</Text>
          {data.ma5 && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: '#FFD700' }]}>MA5:</Text>
              <Text style={styles.value}>{data.ma5.toFixed(2)}</Text>
            </View>
          )}
          {data.ma10 && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: '#FF69B4' }]}>MA10:</Text>
              <Text style={styles.value}>{data.ma10.toFixed(2)}</Text>
            </View>
          )}
          {data.ma20 && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: '#87CEEB' }]}>MA20:</Text>
              <Text style={styles.value}>{data.ma20.toFixed(2)}</Text>
            </View>
          )}
        </View>
      )}

      {/* MACD */}
      {(data.macd || data.dif || data.dea) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MACD</Text>
          {data.dif && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: '#FF6B6B' }]}>DIF:</Text>
              <Text style={styles.value}>{data.dif.toFixed(4)}</Text>
            </View>
          )}
          {data.dea && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: '#4ECDC4' }]}>DEA:</Text>
              <Text style={styles.value}>{data.dea.toFixed(4)}</Text>
            </View>
          )}
          {data.macd && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: '#45B7D1' }]}>MACD:</Text>
              <Text style={styles.value}>{data.macd.toFixed(4)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Arrow indicator */}
      <View
        style={[
          styles.arrow,
          { borderTopColor: isDark ? '#1A1D21' : '#F7F9FA' },
        ]}
      />
    </Animated.View>
  );
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      width: 300,
      backgroundColor: isDark ? '#1A1D21' : '#F7F9FA',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1000,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#212832' : '#E8EBED',
    },
    headerText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#CFD3D6' : '#14171A',
    },
    timeContainer: {
      backgroundColor: isDark ? '#212832' : '#E8EBED',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    timeText: {
      fontSize: 12,
      color: isDark ? '#8B95A1' : '#6D7B8A',
    },
    section: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#CFD3D6' : '#14171A',
      marginBottom: 6,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    label: {
      fontSize: 12,
      color: isDark ? '#8B95A1' : '#6D7B8A',
      fontWeight: '500',
    },
    value: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#CFD3D6' : '#14171A',
    },
    arrow: {
      position: 'absolute',
      bottom: -8,
      left: '50%',
      marginLeft: -8,
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
    },
  });

export default CustomPanView;
