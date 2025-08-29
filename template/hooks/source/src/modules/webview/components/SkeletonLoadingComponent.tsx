import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';

/**
 * Skeleton loading component props
 */
export interface SkeletonLoadingProps {
  enabled?: boolean;
  backgroundColor?: string;
  shimmerColor?: string;
  animationDuration?: number;
  showPlaceholder?: boolean;
  testID?: string;
  style?: any;
}

/**
 * Professional skeleton loading component
 * Shows animated placeholder content while real content loads
 */
export const SkeletonLoadingComponent = ({
  enabled = true,
  backgroundColor,
  shimmerColor,
  animationDuration = 1500,
  showPlaceholder = true,
  testID = 'skeleton-loading',
  style,
}: SkeletonLoadingProps) => {
  const { theme } = useTheme();
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  // Default colors from theme
  const defaultBgColor = backgroundColor || theme.colors.surface;
  const defaultShimmerColor = shimmerColor || theme.colors.primary + '20';

  useEffect(() => {
    if (enabled) {
      const startShimmerAnimation = () => {
        shimmerAnimation.setValue(0);
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: false,
        }).start(() => {
          // Loop the animation
          startShimmerAnimation();
        });
      };

      startShimmerAnimation();
    }
  }, [enabled, animationDuration, shimmerAnimation]);

  if (!enabled || !showPlaceholder) {
    return null;
  }

  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-Dimensions.get('window').width, Dimensions.get('window').width],
  });

  const styles = createStyles(defaultBgColor, defaultShimmerColor, theme);

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logo} />
          <View style={styles.headerText}>
            <View style={styles.titleLine} />
            <View style={styles.subtitleLine} />
          </View>
        </View>
      </View>

      {/* Content skeleton */}
      <View style={styles.content}>
        {/* Main content area */}
        <View style={styles.mainContent}>
          <View style={styles.contentLine} />
          <View style={styles.contentLine} />
          <View style={[styles.contentLine, { width: '70%' }]} />
        </View>

        {/* Sidebar skeleton */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarItem} />
          <View style={styles.sidebarItem} />
          <View style={styles.sidebarItem} />
        </View>
      </View>

      {/* Navigation skeleton */}
      <View style={styles.navigation}>
        <View style={styles.navItem} />
        <View style={styles.navItem} />
        <View style={styles.navItem} />
        <View style={styles.navItem} />
      </View>

      {/* Shimmer overlay */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslateX }],
          },
        ]}
      />
    </View>
  );
};

/**
 * Create styles for skeleton loading
 */
const createStyles = (backgroundColor: string, shimmerColor: string, theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
      position: 'relative',
      overflow: 'hidden',
    },
    header: {
      height: 80,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logo: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.text.disabled,
      marginRight: theme.spacing.md,
    },
    headerText: {
      flex: 1,
    },
    titleLine: {
      height: 16,
      backgroundColor: theme.colors.text.disabled,
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.xs,
      width: '60%',
    },
    subtitleLine: {
      height: 12,
      backgroundColor: theme.colors.text.disabled,
      borderRadius: theme.borderRadius.sm,
      width: '40%',
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      padding: theme.spacing.lg,
    },
    mainContent: {
      flex: 1,
      marginRight: theme.spacing.lg,
    },
    contentLine: {
      height: 14,
      backgroundColor: theme.colors.text.disabled,
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.md,
      width: '100%',
    },
    sidebar: {
      width: 100,
    },
    sidebarItem: {
      height: 60,
      backgroundColor: theme.colors.text.disabled,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    navigation: {
      height: 60,
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      alignItems: 'center',
    },
    navItem: {
      flex: 1,
      height: 40,
      backgroundColor: theme.colors.text.disabled,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.xs,
    },
    shimmer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: shimmerColor,
      opacity: 0.3,
    },
  });

export default SkeletonLoadingComponent;
