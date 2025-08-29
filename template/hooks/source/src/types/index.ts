/**
 * Global Types
 * Centralized type definitions used across the application
 */

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    error: string;
    warning: string;
    success: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: string;
    divider: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    fontFamily: {
      regular: string;
      medium: string;
      bold: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    lineHeight: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
  };
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
}

export interface TextStyle {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

// WebView Types
export interface WebViewState {
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  currentUrl: string;
  title: string;
  navigationHistory: string[];
  error?: WebViewError;
}

export interface WebViewError {
  code: string | number;
  description: string;
  url?: string;
  timestamp: number;
}

export interface WebViewMessage {
  type: string;
  data: any;
  timestamp: number;
  url?: string;
}

export interface WebViewConfig {
  url: string;
  title: string;
  userAgent?: string;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  startInLoadingState?: boolean;
  scalesPageToFit?: boolean;
  allowsInlineMediaPlayback?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  allowsFullscreenVideo?: boolean;
  mixedContentMode?: string;
  cacheEnabled?: boolean;
  cacheMode?: string;
  allowFileAccess?: boolean;
  allowUniversalAccessFromFileURLs?: boolean;
  allowFileAccessFromFileURLs?: boolean;
  pullToRefreshEnabled?: boolean;
  timeout?: number;
  retryAttempts?: number;
  offlineMessage?: string;
  onShouldStartLoadWithRequest?: (request: any) => boolean;
  onNavigationStateChange?: (state: any) => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onMessage?: (message: any) => void;
}

// Component Props Types
export interface LoadingComponentProps {
  isLoading?: boolean;
  message?: string;
  text?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: any;
  showSpinner?: boolean;
  testID?: string;
}

export interface ErrorComponentProps {
  error: WebViewError;
  onRetry?: () => void;
  onDismiss?: () => void;
  onGoBack?: () => void;
  showRetryButton?: boolean;
  showGoBackButton?: boolean;
  customMessages?: {
    retry?: string;
    goBack?: string;
    dismiss?: string;
    timeout?: string;
    network?: string;
    server?: string;
  };
  testID?: string;
  style?: any;
}

export interface WatermarkConfig {
  enabled: boolean;
  text?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number;
  fontSize?: number;
  color?: string;
}

// App Configuration Types
export interface AppConfig {
  name: string;
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
  bundleId: string;
  displayName: string;
  apiBaseUrl?: string;
  theme: {
    defaultMode: 'light' | 'dark' | 'system';
    light: Theme;
    dark: Theme;
  };
  features: {
    [key: string]: {
      enabled: boolean;
      [key: string]: any;
    };
  };
  enableAnalytics?: boolean;
  enableCrashReporting?: boolean;
  enablePushNotifications?: boolean;
}

// Offline Types
export interface OfflineData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  retryCount: number;
}

export interface OfflineAnalytics {
  totalItems: number;
  pendingItems: number;
  syncedItems: number;
  failedItems: number;
  lastSyncTime?: number;
  totalStorageUsed: number;
  totalItemsStored: number;
  totalItemsSynced: number;
  totalSyncFailures: number;
  averageSyncTime: number;
  lastSyncTimestamp: number;
  cachedPages: number;
  offlineSessions: number;
  offlineDuration: number;
  syncAttempts: number;
  syncSuccessRate: number;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors?: string[];
  timestamp: number;
}

export interface OfflineConfig {
  enabled: boolean;
  maxStorageSize: number;
  syncInterval: number;
  retryAttempts: number;
  sync?: {
    autoSync: boolean;
    syncInterval: number;
    maxRetries: number;
  };
}

// Accessibility Types
export interface AccessibilityState {
  isEnabled: boolean;
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  isInvertColorsEnabled: boolean;
  isBoldTextEnabled: boolean;
  isGrayscaleEnabled: boolean;
  isHighContrastEnabled: boolean;
  isLargeTextEnabled: boolean;
  isVoiceOverEnabled: boolean;
  isTalkBackEnabled: boolean;
}

export interface AccessibilityEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface AccessibilityAction {
  id: string;
  label: string;
  action: () => void;
}

// Performance Types
export interface PerformanceMetric {
  id: string;
  type: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: any;
}

export interface PerformanceThreshold {
  id: string;
  type: string;
  name: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type MetricType = 'memory' | 'cpu' | 'network' | 'render' | 'custom';

// Security Types
export interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  metadata?: any;
}

export interface SecurityValidationResult {
  isValid: boolean;
  threats: string[];
  recommendations: string[];
}

// Deep Linking Types
export interface DeepLinkResult {
  success: boolean;
  url: string;
  source: string;
  handled: boolean;
  shouldOpenInApp: boolean;
  shouldRedirectToBrowser: boolean;
  reason: string;
  timestamp: number;
}

export interface DeepLinkConfig {
  enabled: boolean;
  scheme: string;
  customScheme?: string;
  universalLinks?: {
    enabled: boolean;
    domains: string[];
  };
}

export interface DeepLinkHandler {
  pattern: string;
  handler: (url: string, params: Record<string, string>) => void;
}

// Navigation Types
export interface NavigationState {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  lockIdentifier?: number;
}

// Network Types
export interface NetworkStatusComponentProps {
  testID?: string;
  style?: any;
}
