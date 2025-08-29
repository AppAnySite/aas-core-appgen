import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Watermark configuration interface
 */
export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  subtext: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  color: string;
  fontSize: number;
  subtextFontSize: number;
  padding: number;
  cornerRadius: number;
  backgroundColor: string;
  showInScreenshots: boolean;
  showInProduction: boolean;
  showInDevelopment: boolean;
}

/**
 * Watermark component props
 */
export interface WatermarkComponentProps {
  config: WatermarkConfig;
  testID?: string;
  style?: any;
}

/**
 * Professional watermark component
 * Displays customizable watermark text with professional styling
 */
export const WatermarkComponent = ({
  config,
  testID = 'watermark-component',
  style,
}: WatermarkComponentProps) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Don't render if watermark is disabled
  if (!config.enabled) {
    return null;
  }

  // Check environment visibility settings
  const isDevelopment = __DEV__;
  const isProduction = !isDevelopment;
  
  if (isDevelopment && !config.showInDevelopment) {
    return null;
  }
  
  if (isProduction && !config.showInProduction) {
    return null;
  }

  // Calculate position styles
  const getPositionStyles = () => {
    const baseStyles: any = {
      position: 'absolute' as const,
      zIndex: 9999,
    };

    switch (config.position) {
      case 'top-left':
        return {
          ...baseStyles,
          top: insets.top + config.padding,
          left: insets.left + config.padding,
        };
      case 'top-right':
        return {
          ...baseStyles,
          top: insets.top + config.padding,
          right: insets.right + config.padding,
        };
      case 'bottom-left':
        return {
          ...baseStyles,
          bottom: insets.bottom + config.padding,
          left: insets.left + config.padding,
        };
      case 'bottom-right':
        return {
          ...baseStyles,
          bottom: insets.bottom + config.padding,
          right: insets.right + config.padding,
        };
      case 'center':
        return {
          ...baseStyles,
          top: '50%',
          left: '50%',
          transform: [{ translateX: -50 }, { translateY: -50 }],
        };
      default:
        return {
          ...baseStyles,
          bottom: insets.bottom + config.padding,
          right: insets.right + config.padding,
        };
    }
  };

  // Create styles
  const styles = createStyles(config, theme, getPositionStyles());

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityLabel="Watermark"
      accessibilityHint="App watermark showing generation source"
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Text style={styles.mainText} numberOfLines={1}>
          {config.text}
        </Text>
        {config.subtext && (
          <Text style={styles.subText} numberOfLines={1}>
            {config.subtext}
          </Text>
        )}
      </View>
    </View>
  );
};

/**
 * Create styles for the watermark component
 */
const createStyles = (config: WatermarkConfig, theme: any, positionStyles: any) =>
  StyleSheet.create({
    container: {
      ...positionStyles,
      backgroundColor: config.backgroundColor,
      borderRadius: config.cornerRadius,
      paddingHorizontal: config.padding,
      paddingVertical: config.padding * 0.75,
      opacity: config.opacity,
      shadowColor: theme.colors.text.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 8,
      borderWidth: 1,
      borderColor: config.color + '40',
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    mainText: {
      color: config.color,
      fontSize: config.fontSize,
      fontWeight: '600',
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
      letterSpacing: 0.5,
    },
    subText: {
      color: config.color,
      fontSize: config.subtextFontSize,
      fontWeight: '400',
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      letterSpacing: 0.3,
      marginTop: 2,
      opacity: 0.8,
    },
  });

export default WatermarkComponent;
