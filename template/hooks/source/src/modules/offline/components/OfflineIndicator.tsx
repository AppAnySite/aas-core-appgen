import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeProvider';

interface OfflineIndicatorProps {
  isOffline: boolean;
  onRetry?: () => void;
  position?: 'top' | 'bottom' | 'floating';
  style?: 'banner' | 'toast' | 'badge';
  autoHide?: boolean;
  hideDelay?: number;
  testID?: string;
}

/**
 * OfflineIndicator - Shows visual feedback when app is offline
 */
export const OfflineIndicator = ({
  isOffline,
  onRetry,
  position = 'top',
  style = 'banner',
  autoHide = true,
  hideDelay = 3000,
  testID = 'offline-indicator',
}: OfflineIndicatorProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOffline) {
      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide if enabled
      if (autoHide) {
        const timer = setTimeout(() => {
          hideIndicator();
        }, hideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      hideIndicator();
    }
  }, [isOffline, autoHide, hideDelay]);

  const hideIndicator = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getContainerStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      zIndex: 9999,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          top: insets.top,
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: insets.bottom,
        };
      case 'floating':
        return {
          ...baseStyle,
          top: '50%',
          marginTop: -25,
        };
      default:
        return baseStyle;
    }
  };

  const getIndicatorStyle = () => {
    switch (style) {
      case 'toast':
        return styles.toast;
      case 'badge':
        return styles.badge;
      case 'banner':
      default:
        return styles.banner;
    }
  };

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        getContainerStyle(),
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      testID={testID}
    >
      <View style={[getIndicatorStyle(), { backgroundColor: theme.colors.error }]}>
        <View style={styles.content}>
          <Text style={[styles.text, { color: theme.colors.background }]}>
            📱 You're offline
          </Text>
          <Text style={[styles.subtext, { color: theme.colors.background }]}>
            Some features may be limited
          </Text>
        </View>
        
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.background }]}
            onPress={onRetry}
            testID={`${testID}-retry`}
          >
            <Text style={[styles.retryText, { color: theme.colors.error }]}>
              Retry
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toast: {
    marginHorizontal: 32,
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtext: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
