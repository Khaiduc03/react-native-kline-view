import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import CustomKLineChart from './CustomKLineChart';
import { useKLineChart } from '../hooks/useKLineChart';

const PanViewExample: React.FC = () => {
  const [enablePanView, setEnablePanView] = useState(true);
  const [panViewTheme, setPanViewTheme] = useState<'light' | 'dark'>('dark');

  const {
    state,
    toggleTheme,
    selectTimeType,
    selectIndicator,
    selectDrawTool,
  } = useKLineChart();

  const handleDrawItemDidTouch = (event: any) => {
    console.log('Draw item did touch:', event);
  };

  const handleDrawItemComplete = (event: any) => {
    console.log('Draw item complete:', event);
  };

  const handleDrawPointComplete = (event: any) => {
    console.log('Draw point complete:', event);
  };

  const handleChartPress = (event: any) => {
    console.log('Chart pressed:', event);
  };

  const handleChartLongPress = (event: any) => {
    console.log('Chart long pressed:', event);
    Alert.alert('Long Press', 'Chart long pressed!');
  };

  const handleChartPan = (event: any) => {
    console.log('Chart pan:', event);
  };

  const handleChartZoom = (event: any) => {
    console.log('Chart zoom:', event);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>K-Line Chart với Custom Pan View</Text>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Enable Pan View:</Text>
            <Switch
              value={enablePanView}
              onValueChange={setEnablePanView}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={enablePanView ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Theme:</Text>
            <TouchableOpacity
              style={[
                styles.themeButton,
                { backgroundColor: panViewTheme === 'dark' ? '#333' : '#fff' },
              ]}
              onPress={() =>
                setPanViewTheme(panViewTheme === 'dark' ? 'light' : 'dark')
              }
            >
              <Text
                style={[
                  styles.themeButtonText,
                  { color: panViewTheme === 'dark' ? '#fff' : '#333' },
                ]}
              >
                {panViewTheme === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <CustomKLineChart
          optionList={state.optionList}
          onDrawItemDidTouch={handleDrawItemDidTouch}
          onDrawItemComplete={handleDrawItemComplete}
          onDrawPointComplete={handleDrawPointComplete}
          // Pan view customization
          enablePanView={enablePanView}
          panViewTheme={panViewTheme}
          // Chart behavior
          enableGestures={true}
          enableZoom={true}
          enableScroll={true}
          enableDrawing={true}
          // Event handlers
          onChartPress={handleChartPress}
          onChartLongPress={handleChartLongPress}
          onChartPan={handleChartPan}
          onChartZoom={handleChartZoom}
          // Styling
          containerStyle={styles.customContainer}
          chartStyle={styles.customChart}
        />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Hướng dẫn sử dụng:</Text>
        <Text style={styles.instructionText}>
          • Pan trên chart để xem thông tin chi tiết
        </Text>
        <Text style={styles.instructionText}>
          • Long press để kích hoạt chế độ vẽ
        </Text>
        <Text style={styles.instructionText}>• Pinch để zoom in/out</Text>
        <Text style={styles.instructionText}>
          • Toggle switch để bật/tắt pan view
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customContainer: {
    borderRadius: 8,
  },
  customChart: {
    borderRadius: 8,
  },
  instructions: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default PanViewExample;
