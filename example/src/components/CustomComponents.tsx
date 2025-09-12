import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';

// Custom Header Component
export const CustomHeader: React.FC<{
  title: string;
  onMenuPress?: () => void;
  onSettingsPress?: () => void;
  theme?: any;
}> = ({ title, onMenuPress, onSettingsPress, theme }) => {
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: theme?.headerColor || '#F7F9FA' },
      ]}
    >
      <TouchableOpacity style={styles.headerButton} onPress={onMenuPress}>
        <Text
          style={[
            styles.headerButtonText,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          ☰
        </Text>
      </TouchableOpacity>

      <Text
        style={[styles.headerTitle, { color: theme?.textColor || '#14171A' }]}
      >
        {title}
      </Text>

      <TouchableOpacity style={styles.headerButton} onPress={onSettingsPress}>
        <Text
          style={[
            styles.headerButtonText,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          ⚙️
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Custom Footer Component
export const CustomFooter: React.FC<{
  onRefresh?: () => void;
  onFullscreen?: () => void;
  onShare?: () => void;
  theme?: any;
}> = ({ onRefresh, onFullscreen, onShare, theme }) => {
  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: theme?.headerColor || '#F7F9FA' },
      ]}
    >
      <TouchableOpacity style={styles.footerButton} onPress={onRefresh}>
        <Text
          style={[
            styles.footerButtonText,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          🔄
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.footerButton} onPress={onFullscreen}>
        <Text
          style={[
            styles.footerButtonText,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          ⛶
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.footerButton} onPress={onShare}>
        <Text
          style={[
            styles.footerButtonText,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          📤
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Custom Left Panel Component
export const CustomLeftPanel: React.FC<{
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  theme?: any;
}> = ({ onZoomIn, onZoomOut, onReset, theme }) => {
  return (
    <View
      style={[
        styles.leftPanel,
        { backgroundColor: theme?.backgroundColor || '#FFFFFF' },
      ]}
    >
      <TouchableOpacity style={styles.panelButton} onPress={onZoomIn}>
        <Text
          style={[
            styles.panelButtonText,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          🔍+
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.panelButton} onPress={onZoomOut}>
        <Text
          style={[
            styles.panelButtonText,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          🔍-
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.panelButton} onPress={onReset}>
        <Text
          style={[
            styles.panelButtonText,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          🎯
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Custom Right Panel Component
export const CustomRightPanel: React.FC<{
  onToggleMA?: () => void;
  onToggleMACD?: () => void;
  onToggleVolume?: () => void;
  theme?: any;
}> = ({ onToggleMA, onToggleMACD, onToggleVolume, theme }) => {
  return (
    <View
      style={[
        styles.rightPanel,
        { backgroundColor: theme?.backgroundColor || '#FFFFFF' },
      ]}
    >
      <TouchableOpacity style={styles.panelButton} onPress={onToggleMA}>
        <Text
          style={[
            styles.panelButtonText,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          MA
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.panelButton} onPress={onToggleMACD}>
        <Text
          style={[
            styles.panelButtonText,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          MACD
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.panelButton} onPress={onToggleVolume}>
        <Text
          style={[
            styles.panelButtonText,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          VOL
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Custom Overlay Component
export const CustomOverlay: React.FC<{
  onClose?: () => void;
  theme?: any;
}> = ({ onClose, theme }) => {
  return (
    <View
      style={[
        styles.overlay,
        { backgroundColor: theme?.backgroundOpacity || 'rgba(0, 0, 0, 0.5)' },
      ]}
    >
      <View
        style={[
          styles.overlayContent,
          { backgroundColor: theme?.backgroundColor || '#FFFFFF' },
        ]}
      >
        <Text
          style={[
            styles.overlayTitle,
            { color: theme?.textColor || '#14171A' },
          ]}
        >
          Chart Settings
        </Text>

        <View style={styles.overlaySection}>
          <Text
            style={[
              styles.overlayLabel,
              { color: theme?.textColor || '#14171A' },
            ]}
          >
            Enable Gestures
          </Text>
          <Switch />
        </View>

        <View style={styles.overlaySection}>
          <Text
            style={[
              styles.overlayLabel,
              { color: theme?.textColor || '#14171A' },
            ]}
          >
            Enable Zoom
          </Text>
          <Switch />
        </View>

        <View style={styles.overlaySection}>
          <Text
            style={[
              styles.overlayLabel,
              { color: theme?.textColor || '#14171A' },
            ]}
          >
            Enable Scroll
          </Text>
          <Switch />
        </View>

        <TouchableOpacity style={styles.overlayCloseButton} onPress={onClose}>
          <Text style={styles.overlayCloseButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Custom Background Component
export const CustomBackground: React.FC<{
  theme?: any;
}> = ({ theme }) => {
  return (
    <View
      style={[
        styles.background,
        { backgroundColor: theme?.backgroundColor || '#FFFFFF' },
      ]}
    >
      <View
        style={[
          styles.backgroundPattern,
          { backgroundColor: theme?.gridColor || '#E8EBED' },
        ]}
      />
      <View
        style={[
          styles.backgroundPattern,
          { backgroundColor: theme?.gridColor || '#E8EBED' },
        ]}
      />
      <View
        style={[
          styles.backgroundPattern,
          { backgroundColor: theme?.gridColor || '#E8EBED' },
        ]}
      />
    </View>
  );
};

// Custom Loading Component
export const CustomLoading: React.FC<{
  message?: string;
  theme?: any;
}> = ({ message = 'Loading chart...', theme }) => {
  return (
    <View
      style={[
        styles.loading,
        { backgroundColor: theme?.backgroundColor || '#FFFFFF' },
      ]}
    >
      <View style={styles.loadingSpinner} />
      <Text
        style={[styles.loadingText, { color: theme?.textColor || '#14171A' }]}
      >
        {message}
      </Text>
    </View>
  );
};

// Custom Error Component
export const CustomError: React.FC<{
  message?: string;
  onRetry?: () => void;
  theme?: any;
}> = ({ message = 'Error loading chart', onRetry, theme }) => {
  return (
    <View
      style={[
        styles.error,
        { backgroundColor: theme?.backgroundColor || '#FFFFFF' },
      ]}
    >
      <Text
        style={[styles.errorIcon, { color: theme?.decreaseColor || '#FF1744' }]}
      >
        ⚠️
      </Text>
      <Text
        style={[styles.errorText, { color: theme?.textColor || '#14171A' }]}
      >
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 16,
  },
  leftPanel: {
    width: 80,
    paddingVertical: 20,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  rightPanel: {
    width: 80,
    paddingVertical: 20,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  panelButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
  },
  panelButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  overlaySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  overlayLabel: {
    fontSize: 16,
  },
  overlayCloseButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 10,
  },
  overlayCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  background: {
    flex: 1,
    opacity: 0.1,
  },
  backgroundPattern: {
    height: 1,
    marginVertical: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#E0E0E0',
    borderTopColor: '#2196F3',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
