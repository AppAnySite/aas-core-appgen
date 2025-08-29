import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';

interface NetworkStatusComponentProps {
  isConnected?: boolean;
  connectionType?: string;
  quality?: string;
  style?: any;
}

export const NetworkStatusComponent = ({
  isConnected = true,
  connectionType = 'WiFi',
  quality = 'Good',
  style,
}: NetworkStatusComponentProps) => {
  const { theme } = useTheme();

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.error }, style]}>
      <Text style={[styles.text, { color: theme.colors.text.primary }]}>
        No Internet Connection
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
