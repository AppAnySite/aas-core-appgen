import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, TextStyle } from '../types';

/**
 * Light theme configuration
 */
const lightTheme: Theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    text: {
      primary: '#000000',
      secondary: '#8E8E93',
      disabled: '#C7C7CC',
    },
    border: '#C6C6C8',
    divider: '#C6C6C8',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 36,
    },
  },
};

/**
 * Dark theme configuration
 */
const darkTheme: Theme = {
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    error: '#FF453A',
    warning: '#FF9F0A',
    success: '#30D158',
    text: {
      primary: '#FFFFFF',
      secondary: '#8E8E93',
      disabled: '#3A3A3C',
    },
    border: '#38383A',
    divider: '#38383A',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 36,
    },
  },
};

/**
 * Theme context interface
 */
interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  currentThemeMode: 'light' | 'dark' | 'system';
  setCustomThemeOverrides: (overrides: Partial<Theme>) => void;
  clearCustomThemeOverrides: () => void;
  getThemeHistory: () => Array<{ mode: 'light' | 'dark' | 'system'; timestamp: number }>;
}

/**
 * Theme context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme provider props
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: 'light' | 'dark' | 'system';
}

/**
 * Theme provider component
 * Manages theme state and provides theme context to the app
 */
export const ThemeProvider = ({
  children,
  initialTheme = 'system',
}: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(initialTheme as 'light' | 'dark' | 'system');
  const [customTheme, setCustomTheme] = useState<Partial<Theme> | null>(null);
  const [themeHistory, setThemeHistory] = useState<Array<{ mode: 'light' | 'dark' | 'system'; timestamp: number }>>([]);

  // Determine the actual theme based on mode and system preference
  const getActualTheme = (): Theme => {
    let baseTheme: Theme;
    
    if (themeMode === 'system') {
      baseTheme = systemColorScheme === 'dark' ? darkTheme : lightTheme;
    } else {
      baseTheme = themeMode === 'dark' ? darkTheme : lightTheme;
    }

    // Apply custom theme overrides if available
    if (customTheme) {
      return mergeThemes(baseTheme, customTheme);
    }

    return baseTheme;
  };

  const [theme, setThemeState] = useState<Theme>(getActualTheme());

  // Update theme when system color scheme changes
  useEffect(() => {
    const newTheme = getActualTheme();
    setThemeState(newTheme);
    
    // Log theme change
    console.log('Theme changed:', {
      mode: themeMode,
      systemColorScheme,
      hasCustomTheme: !!customTheme,
    });
  }, [themeMode, systemColorScheme, customTheme]);

  // Track theme history
  useEffect(() => {
    setThemeHistory(prev => {
      const newHistory = [...prev, { mode: themeMode, timestamp: Date.now() }];
      // Keep only last 10 theme changes
      return newHistory.slice(-10);
    });
  }, [themeMode]);

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'system') {
        return systemColorScheme === 'dark' ? 'light' : 'dark';
      }
      return prev === 'light' ? 'dark' : 'light';
    });
  };

  /**
   * Set specific theme mode
   */
  const setTheme = (newThemeMode: 'light' | 'dark' | 'system') => {
    setThemeMode(newThemeMode);
  };

  /**
   * Set custom theme overrides
   */
  const setCustomThemeOverrides = (overrides: Partial<Theme>) => {
    setCustomTheme(overrides);
  };

  /**
   * Clear custom theme overrides
   */
  const clearCustomThemeOverrides = () => {
    setCustomTheme(null);
  };

  /**
   * Get theme history
   */
  const getThemeHistory = () => {
    return [...themeHistory];
  };

  const contextValue: ThemeContextType = {
    theme,
    isDark: theme === darkTheme,
    toggleTheme,
    setTheme,
    currentThemeMode: themeMode,
    setCustomThemeOverrides,
    clearCustomThemeOverrides,
    getThemeHistory,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook to get theme colors
 */
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

/**
 * Hook to get theme spacing
 */
export const useThemeSpacing = () => {
  const { theme } = useTheme();
  return theme.spacing;
};

/**
 * Hook to get theme typography
 */
export const useThemeTypography = () => {
  const { theme } = useTheme();
  return theme.typography;
};

/**
 * Hook to get theme border radius
 */
export const useThemeBorderRadius = () => {
  const { theme } = useTheme();
  return theme.borderRadius;
};

/**
 * Utility function to create themed styles
 */
export const createThemedStyles = <T extends Record<string, any>>(
  styleFactory: (theme: Theme) => T
) => {
  return styleFactory;
};

/**
 * Merge themes with custom overrides
 */
const mergeThemes = (baseTheme: Theme, overrides: Partial<Theme>): Theme => {
  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme.colors,
      ...overrides.colors,
      text: {
        ...baseTheme.colors.text,
        ...overrides.colors?.text,
      },
    },
    spacing: {
      ...baseTheme.spacing,
      ...overrides.spacing,
    },
    borderRadius: {
      ...baseTheme.borderRadius,
      ...overrides.borderRadius,
    },
    typography: {
      ...baseTheme.typography,
      ...overrides.typography,
    },
  };
};

/**
 * Export theme configurations for direct use
 */
export { lightTheme, darkTheme };
