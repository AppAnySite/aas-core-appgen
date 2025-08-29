import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Text,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeProvider';
import { 
  WebViewComponentProps, 
  WebViewState, 
  WebViewError, 
  WebViewMessage
} from '../types';
import type { OfflineConfig } from '../../../types';
import { LoadingComponent } from '../../../shared/components/LoadingComponent';
import { ErrorComponent } from '../../../shared/components/ErrorComponent';
import { NetworkStatusComponent } from '../../network/components/NetworkStatusComponent';
import { WatermarkComponent } from '../../../shared/components/WatermarkComponent';
import { eventBus, EventType, emitEvent } from '../../../core/EventBus';
import { performanceMonitor, startTimer, MetricType } from '../../../core/PerformanceMonitor';
import { securityManager, validateURL } from '../../../core/SecurityManager';
import { logger } from '../../../utils/Logger';
import { dynamicConfigLoader, getWebViewConfig, getUiConfig, getLazyLoadingConfig, getDeepLinkingConfig, getOfflineConfig } from '../../../config/DynamicConfigLoader';
import { 
  lazyLoadingManager, 
  initializeLazyLoading, 
  startLazyLoading, 
  getLoadingState, 
  getLoadingProgress,
  LoadingState 
} from '../LazyLoadingManager';
import { SkeletonLoadingComponent } from './SkeletonLoadingComponent';
import { 
  deepLinkManager, 
  initializeDeepLinking, 
  processDeepLink, 
  isDeepLinkingEnabled,
  onDeepLinkResult,
  DeepLinkResult
} from '../../../core/DeepLinkManager';
import { OfflineIndicator } from '../../offline/components/OfflineIndicator';
import { 
  offlineStorageManager, 
  initializeOfflineStorage, 
  storeOfflineData 
} from '../../../core/OfflineStorageManager';
import { 
  smartSyncManager, 
  initializeSmartSync, 
  performSync 
} from '../../../core/SmartSyncManager';
import { 
  networkManager, 
  startNetworkMonitoring, 
  NetworkEventType,
  NetworkEvent 
} from '../../../core/NetworkManager';

/**
 * Professional WebView component with comprehensive features
 * Handles loading states, errors, navigation, and user interactions
 */
export const WebViewComponent: React.FC<WebViewComponentProps> = ({
  config: propConfig,
  onStateChange,
  onError,
  onMessage,
  testID = 'webview-component',
  accessibilityLabel = 'Web content',
  accessibilityHint = 'Displays web content in a native container',
  style,
}) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  
  // Dynamic configuration state
  const [dynamicConfig, setDynamicConfig] = useState<any>(null);
  const [uiConfig, setUiConfig] = useState<any>(null);
  const [lazyLoadingConfig, setLazyLoadingConfig] = useState<any>(null);
  const [deepLinkingConfig, setDeepLinkingConfig] = useState<any>(null);
  
  // Lazy loading state
  const [lazyLoadingState, setLazyLoadingState] = useState<LoadingState>(LoadingState.INITIAL);
  const [lazyLoadingProgress, setLazyLoadingProgress] = useState<number>(0);
  
  // Deep linking state
  const [isDeepLinkingEnabled, setIsDeepLinkingEnabled] = useState<boolean>(false);
  
  // Network and offline state
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineConfig, setOfflineConfig] = useState<any>(null);
  const [networkState, setNetworkState] = useState<any>(null);
  
  // Use dynamic config if available, otherwise fall back to prop config
  const config = dynamicConfig || propConfig;
  
  // State management
  const [state, setState] = useState<WebViewState>({
    isLoading: true,
    canGoBack: false,
    canGoForward: false,
    currentUrl: config?.url || '',
    title: config?.title || '',
    navigationHistory: [],
  });
  
  const [error, setError] = useState<WebViewError | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  // Load dynamic configuration on component mount
  useEffect(() => {
    const loadDynamicConfig = async () => {
      try {
        await dynamicConfigLoader.loadConfig();
        const webViewConfig = getWebViewConfig();
        const uiConfigData = getUiConfig();
        const lazyLoadingData = getLazyLoadingConfig();
        const deepLinkingData = getDeepLinkingConfig();
        const offlineData = getOfflineConfig();
        
        setDynamicConfig(webViewConfig);
        setUiConfig(uiConfigData);
        setLazyLoadingConfig(lazyLoadingData);
        setDeepLinkingConfig(deepLinkingData);
        setOfflineConfig(offlineData);
        
        // Initialize lazy loading if enabled
        if (lazyLoadingData?.enabled) {
          initializeLazyLoading(lazyLoadingData);
          
          // Set up lazy loading event listeners
          lazyLoadingManager.addEventListener('stateChange', (data: any) => {
            setLazyLoadingState(data.state);
            setLazyLoadingProgress(data.progress);
          });
          
          lazyLoadingManager.addEventListener('progressUpdate', (data: any) => {
            setLazyLoadingProgress(data.progress);
          });
        }
        
        // Initialize deep linking if enabled
        if (deepLinkingData?.enabled) {
          try {
            await initializeDeepLinking(deepLinkingData);
            setIsDeepLinkingEnabled(true);
            
            // Set up deep link result handler
            onDeepLinkResult((result) => {
              logger.info('Deep link result received', {
                handled: result.handled,
                action: result.action,
                reason: result.reason,
              }, 'WebViewComponent');
            });
            
          } catch (error) {
            logger.error('Failed to initialize deep linking', error as Error, null, 'WebViewComponent');
          }
        }
        
        // Initialize network monitoring
        try {
          await startNetworkMonitoring();
          
          // Set up network event listeners
          networkManager.onNetworkEvent((event: NetworkEvent) => {
            setNetworkState(event.currentState);
            setIsOffline(!event.currentState.isConnected);
            
            logger.info('Network event received', {
              type: event.type,
              isConnected: event.currentState.isConnected,
              quality: event.currentState.quality,
            }, 'WebViewComponent');
          });
          
          // Get initial network state
          const initialState = networkManager.getCurrentState();
          setNetworkState(initialState);
          setIsOffline(!initialState.isConnected);
          
        } catch (error) {
          logger.error('Failed to initialize network monitoring', error as Error, null, 'WebViewComponent');
        }
        
        // Initialize offline functionality if enabled
        if (offlineData?.enabled) {
          initializeOfflineStorage();
          const offlineConfig: OfflineConfig = {
            enabled: offlineData.enabled,
            maxStorageSize: offlineData.storage?.maxSize || 1000,
            syncInterval: offlineData.sync?.syncInterval || 30000,
            retryAttempts: offlineData.sync?.maxRetries || 3,
            sync: offlineData.sync,
          };
          initializeSmartSync(offlineConfig);
        }
        
        // Update state with new configuration
        updateState({
          currentUrl: webViewConfig.url,
          title: webViewConfig.title,
        });
        
        logger.info('Dynamic configuration loaded successfully', {
          url: webViewConfig.url,
          title: webViewConfig.title,
          watermark: uiConfigData?.watermark,
          lazyLoading: lazyLoadingData?.enabled,
        }, 'WebViewComponent');
      } catch (error) {
        logger.error('Failed to load dynamic configuration', error as Error, null, 'WebViewComponent');
        // Fall back to prop config
      }
    };

    loadDynamicConfig();

    // Cleanup function to remove event listeners
    return () => {
      if (lazyLoadingConfig?.enabled) {
        lazyLoadingManager.removeEventListener('stateChange', () => {});
        lazyLoadingManager.removeEventListener('progressUpdate', () => {});
      }
    };
  }, []);

  // Update state and notify parent
  const updateState = useCallback((updates: Partial<WebViewState>) => {
    const newState = { ...state, ...updates };
    setState(newState);
    onStateChange?.(newState);
  }, [state, onStateChange]);

  // Handle load start
  const handleLoadStart = useCallback(() => {
    const startTime = Date.now();
    setLoadStartTime(startTime);
    updateState({ isLoading: true });
    
    // Start lazy loading if enabled
    if (lazyLoadingConfig?.enabled) {
      startLazyLoading();
    }
    
    // Emit event
    emitEvent(EventType.WEBVIEW_LOAD_START, {
      source: 'WebViewComponent',
      data: { url: config.url, startTime },
    });
    
    // Start performance timer
    const endTimer = startTimer('webview_load', MetricType.WEBVIEW_LOAD);
    
    // Log event
    logger.info('WebView load started', { url: config.url }, 'WebViewComponent');
    
    config.onLoadStart?.();
  }, [updateState, config, lazyLoadingConfig]);

  // Handle load end
  const handleLoadEnd = useCallback(() => {
    const loadTime = loadStartTime ? Date.now() - loadStartTime : 0;
    
    // Record performance metric
    performanceMonitor.measureWebViewLoad(config.url, loadTime);
    
    // Log performance
    logger.info(`WebView loaded in ${loadTime}ms`, { url: config.url, loadTime }, 'WebViewComponent');
    
    updateState({ isLoading: false });
    setLoadStartTime(null);
    
    // Store page for offline access
    if (offlineConfig?.enabled) {
      try {
        storeOfflineData({
          type: 'webpage',
          data: {
            url: config.url,
            title: state.title,
            loadedAt: Date.now(),
            loadTime: loadTime,
            isCached: true,
          },
          timestamp: Date.now(),
          syncStatus: 'synced',
          retryCount: 0,
        });
        logger.info('Page stored for offline access', { url: config.url }, 'WebViewComponent');
      } catch (error) {
        logger.error('Failed to store page for offline access', error as Error, { url: config.url }, 'WebViewComponent');
      }
    }
    
    // Complete lazy loading if enabled
    if (lazyLoadingConfig?.enabled) {
      // Cache the loaded content
      lazyLoadingManager.cacheContent(config.url, { loadedAt: Date.now() });
    }
    
    // Emit event
    emitEvent(EventType.WEBVIEW_LOAD_END, {
      source: 'WebViewComponent',
      data: { url: config.url, loadTime },
    });
    
    config.onLoadEnd?.();
  }, [updateState, loadStartTime, config, lazyLoadingConfig]);

  // Handle errors with enhanced error categorization
  const handleError = useCallback((event: any) => {
    const webViewError: WebViewError = {
      code: event.nativeEvent?.code || -1,
      description: event.nativeEvent?.description || 'Unknown error',
      // url: event.nativeEvent?.url || config.url,
      timestamp: Date.now(),
    };
    
    // Categorize error for better handling
    const errorCategory = getErrorCategory(webViewError.code);
    const isRetryable = isErrorRetryable(webViewError.code);
    const shouldShowAlert = shouldShowErrorAlert(webViewError.code);
    
    // Check if this is an offline-related error
    const isOfflineError = isOffline && (
      webViewError.description.includes('ERR_NAME_NOT_RESOLVED') ||
      webViewError.description.includes('ERR_INTERNET_DISCONNECTED') ||
      webViewError.description.includes('net::ERR_NAME_NOT_RESOLVED')
    );
    
    if (isOfflineError) {
      console.log('📱 Offline network error detected:', webViewError.description);
      // Don't show retry for offline errors, just show offline message
      logger.info('Offline error - showing offline message instead of retry', {
        errorCode: webViewError.code,
        description: webViewError.description
      }, 'WebViewComponent');
    }
    
    // Handle lazy loading error
    if (lazyLoadingConfig?.enabled) {
      lazyLoadingManager.handleError(new Error(webViewError.description));
    }
    
    // Log error with enhanced context
    logger.error('WebView error occurred', new Error(webViewError.description), { 
      errorCode: webViewError.code,
      errorCategory,
      isRetryable,
      url: webViewError.url,
      description: webViewError.description,
      networkState: networkState,
      loadTime: loadStartTime ? Date.now() - loadStartTime : null,
    }, 'WebViewComponent');
    
    updateState({ 
      isLoading: false
    });
    setError(webViewError);
    setError(webViewError);
    setLoadStartTime(null);
    
    // Emit error event with enhanced data
    emitEvent(EventType.WEBVIEW_ERROR, {
      source: 'WebViewComponent',
      data: {
        ...webViewError,
        category: errorCategory,
        isRetryable,
        networkState,
        loadTime: loadStartTime ? Date.now() - loadStartTime : null,
      },
    });
    
    // Notify parent
    onError?.(webViewError);
    config.onError?.(webViewError);
    
    // Show alert only for user-actionable errors (but not offline errors)
    if (shouldShowAlert && !isOfflineError) {
      const alertMessage = getErrorMessage(webViewError.code, webViewError.description);
      Alert.alert(
        'Loading Error',
        alertMessage,
        [
          { text: 'Retry', onPress: handleRetry, style: isRetryable ? 'default' : 'cancel' },
          { text: 'Go Back', onPress: handleGoBack, style: 'cancel' },
        ]
      );
    }
    
    // For offline errors, show a different message
    if (isOfflineError) {
      Alert.alert(
        'Offline Mode',
        'You are currently offline. Some features may be limited.',
        [
          { text: 'OK', style: 'default' },
        ]
      );
    }
    
    // Auto-retry for certain network errors if network is available and not offline
    if (isRetryable && networkState?.isConnected && !networkState?.isExpensive && !isOffline) {
      setTimeout(() => {
        logger.info('Auto-retrying WebView load after error', { 
          errorCode: webViewError.code,
          url: webViewError.url 
        }, 'WebViewComponent');
        handleRetry();
      }, 2000); // Wait 2 seconds before auto-retry
    }
  }, [updateState, onError, config, config.url, lazyLoadingConfig, networkState, loadStartTime]);

  // Helper functions for error handling
  const getErrorCategory = (errorCode: string | number): string => {
    if (errorCode === -1001) return 'timeout';
    if (errorCode === -1009) return 'no_connection';
    if (errorCode === -1003) return 'host_unreachable';
    if (errorCode === -1004) return 'host_not_found';
    if (errorCode === -1005) return 'connection_lost';
    if (errorCode === -1006) return 'dns_lookup_failed';
    if (errorCode === -1007) return 'connection_refused';
    if (errorCode === -1008) return 'connection_reset';
    if (errorCode === -1011) return 'bad_server_response';
    if (errorCode === -1012) return 'user_cancelled';
    if (errorCode === -1013) return 'user_cancelled';
    if (errorCode === -1014) return 'user_cancelled';
    if (errorCode === -1015) return 'user_cancelled';
    if (errorCode === -1016) return 'user_cancelled';
    if (errorCode === -1017) return 'user_cancelled';
    if (errorCode === -1018) return 'user_cancelled';
    if (errorCode === -1019) return 'user_cancelled';
    if (errorCode === -1020) return 'user_cancelled';
    if (errorCode === -1021) return 'user_cancelled';
    if (errorCode === -1022) return 'user_cancelled';
    if (errorCode === -1023) return 'user_cancelled';
    if (errorCode === -1024) return 'user_cancelled';
    if (errorCode === -1025) return 'user_cancelled';
    if (errorCode === -1026) return 'user_cancelled';
    if (errorCode === -1027) return 'user_cancelled';
    if (errorCode === -1028) return 'user_cancelled';
    if (errorCode === -1029) return 'user_cancelled';
    if (errorCode === -1030) return 'user_cancelled';
    if (errorCode === -1031) return 'user_cancelled';
    if (errorCode === -1032) return 'user_cancelled';
    if (errorCode === -1033) return 'user_cancelled';
    if (errorCode === -1034) return 'user_cancelled';
    if (errorCode === -1035) return 'user_cancelled';
    if (errorCode === -1036) return 'user_cancelled';
    if (errorCode === -1037) return 'user_cancelled';
    if (errorCode === -1038) return 'user_cancelled';
    if (errorCode === -1039) return 'user_cancelled';
    if (errorCode === -1040) return 'user_cancelled';
    if (errorCode === -1041) return 'user_cancelled';
    if (errorCode === -1042) return 'user_cancelled';
    if (errorCode === -1043) return 'user_cancelled';
    if (errorCode === -1044) return 'user_cancelled';
    if (errorCode === -1045) return 'user_cancelled';
    if (errorCode === -1046) return 'user_cancelled';
    if (errorCode === -1047) return 'user_cancelled';
    if (errorCode === -1048) return 'user_cancelled';
    if (errorCode === -1049) return 'user_cancelled';
    if (errorCode === -1050) return 'user_cancelled';
    return 'unknown';
  };

  const isErrorRetryable = (errorCode: string | number): boolean => {
    const retryableErrors = [-1001, -1003, -1004, -1005, -1006, -1007, -1008, -1011];
    return retryableErrors.includes(Number(errorCode));
  };

  const shouldShowErrorAlert = (errorCode: string | number): boolean => {
    const nonAlertErrors = [-1009, -1012, -1013, -1014, -1015, -1016, -1017, -1018, -1019, -1020];
    return !nonAlertErrors.includes(Number(errorCode));
  };

  const getErrorMessage = (errorCode: string | number, description: string): string => {
    const code = Number(errorCode);
    switch (code) {
      case -1001:
        return 'Request timed out. Please check your internet connection and try again.';
      case -1003:
        return 'Unable to reach the server. Please try again later.';
      case -1004:
        return 'Server not found. Please check the URL and try again.';
      case -1005:
        return 'Connection was lost. Please try again.';
      case -1006:
        return 'DNS lookup failed. Please check your internet connection.';
      case -1007:
        return 'Connection was refused. Please try again later.';
      case -1008:
        return 'Connection was reset. Please try again.';
      case -1011:
        return 'Server returned an error. Please try again later.';
      default:
        return description || 'Failed to load the website. Please check your internet connection and try again.';
    }
  };

  // Handle navigation state changes
  const handleNavigationStateChange = useCallback((navState: any) => {
    // Process deep linking if enabled
    if (isDeepLinkingEnabled && deepLinkingConfig?.enabled) {
      console.log('🔗 Deep Linking Debug:', {
        url: navState.url,
        isDeepLinkingEnabled,
        deepLinkingConfig: deepLinkingConfig
      });
      
      // Process deep link asynchronously
      processDeepLink(navState.url, 'app').then((deepLinkResult) => {
        console.log('🔗 Deep Link Result:', deepLinkResult);
        
        // Only redirect to browser if explicitly configured to do so
        if (!deepLinkResult.shouldOpenInApp && deepLinkResult.shouldRedirectToBrowser && deepLinkingConfig?.redirectToBrowser) {
          // Redirect to browser for external URLs
          logger.info('Redirecting to browser', { url: navState.url, reason: deepLinkResult.reason }, 'WebViewComponent');
          
          console.log('🚫 Should redirect to browser:', navState.url);
          
          // Actually implement browser redirection
          try {
            // Use Linking to open in external browser
            Linking.openURL(navState.url);
          } catch (error) {
            logger.error('Failed to redirect to browser', error as Error, { url: navState.url }, 'WebViewComponent');
          }
        }
      }).catch((error) => {
        logger.error('Failed to process deep link', error as Error, { url: navState.url }, 'WebViewComponent');
      });
    } else {
      console.log('🔗 Deep Linking not enabled or configured');
    }
    
    // Validate URL for security threats
    const securityValidation = validateURL(navState.url);
    if (!securityValidation.isValid) {
      logger.warn('Navigation blocked due to security concerns', securityValidation, 'WebViewComponent');
      // Could implement navigation blocking here
    }
    
    const historyUpdate = [...state.navigationHistory];
    
    // Add current state to history if it's different
    const currentState = {
      url: navState.url,
      title: navState.title,
      loading: navState.loading,
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward,
      lockIdentifier: navState.lockIdentifier,
    };
    
    if (historyUpdate.length === 0 || 
        historyUpdate[historyUpdate.length - 1] !== currentState.url) {
      historyUpdate.push(currentState.url);
    }
    
    updateState({
      isLoading: navState.loading,
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward,
      currentUrl: navState.url,
      title: navState.title,
      navigationHistory: historyUpdate.slice(-50), // Keep last 50 entries
    });
    
    // Emit navigation event
    emitEvent(EventType.WEBVIEW_NAVIGATION, {
      source: 'WebViewComponent',
      data: navState,
    });
    
    // Log navigation
    logger.info('WebView navigation state changed', {
      url: navState.url,
      title: navState.title,
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward,
    }, 'WebViewComponent');
    
    config.onNavigationStateChange?.(navState);
  }, [state.navigationHistory, updateState, config, isDeepLinkingEnabled, deepLinkingConfig]);

  // Utility function to extract domain from URL
  const getDomainFromUrl = useCallback((url: string): string | null => {
    try {
      const domainMatch = url.match(/https?:\/\/([^\/]+)/);
      return domainMatch ? domainMatch[1] : null;
    } catch (error) {
      console.log('📱 Error parsing URL:', error);
      return null;
    }
  }, []);

  // Handle should start load with request
  const handleShouldStartLoadWithRequest = useCallback((request: any) => {
    console.log('🔗 Should Start Load Request:', {
      url: request.url,
      mainDocumentURL: request.mainDocumentURL,
      navigationType: request.navigationType,
      isTopFrame: request.isTopFrame,
      isOffline
    });

    // If offline, only allow navigation to the configured domain URLs
    if (isOffline && offlineConfig?.enabled) {
      // Get the configured URL from config
      const configuredUrl = config.url || dynamicConfig?.url;
      if (configuredUrl) {
        const domain = getDomainFromUrl(configuredUrl);
        if (domain && request.url.includes(domain)) {
          console.log('📱 Allowing configured domain URL in offline mode:', request.url);
          return true;
        }
      }
      
      // Block other external URLs when offline
      console.log('📱 Blocking external URL in offline mode:', request.url);
      return false;
    }

    // Always allow navigation when online
    return true;
  }, [isOffline, offlineConfig, config.url, dynamicConfig?.url, getDomainFromUrl]);

  // Handle messages from WebView
  const handleMessage = useCallback((event: any) => {
      const message: WebViewMessage = {
        type: 'webview_message',
        data: event.nativeEvent?.data || '',
        timestamp: Date.now(),
        // url: event.nativeEvent?.url || config.url,
      };
    
    // Log message
    logger.debug('WebView message received', message, 'WebViewComponent');
    
    // Emit message event
    emitEvent(EventType.WEBVIEW_MESSAGE, {
      source: 'WebViewComponent',
      data: message,
    });
    
    try {
      const data = JSON.parse(message.data);
      onMessage?.(data);
      config.onMessage?.(data);
    } catch (error) {
      logger.warn('Failed to parse WebView message', { error, message }, 'WebViewComponent');
    }
  }, [onMessage, config, config.url]);

  // Navigation methods
  const handleGoBack = useCallback(() => {
    if (state.canGoBack) {
      webViewRef.current?.goBack();
    } else {
      // If can't go back, show exit confirmation
      Alert.alert(
        'Exit App',
        'Are you sure you want to exit the app?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp(), style: 'destructive' },
        ]
      );
    }
  }, [state.canGoBack]);

  const handleGoForward = useCallback(() => {
    if (state.canGoForward) {
      webViewRef.current?.goForward();
    }
  }, [state.canGoForward]);

  const handleReload = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setError(null);
    webViewRef.current?.reload();
  }, [updateState]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    webViewRef.current?.reload();
  }, []);

  // Handle back button on Android
  useEffect(() => {
    const backAction = () => {
      if (state.canGoBack) {
        handleGoBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [state.canGoBack, handleGoBack]);

  // Auto-retry on network recovery
  useEffect(() => {
    if (error && state.isLoading === false) {
      // Could implement network recovery logic here
      // For now, we'll just log the error state
      console.log('WebView in error state, ready for retry');
    }
  }, [error, state.isLoading]);

  // Styles
  const styles = createStyles(theme, insets);

  // Render error state
  if (error) {
    return (
      <View style={[styles.container, style]} testID={`${testID}-error`}>
        <ErrorComponent
          error={error}
          onRetry={handleRetry}
          onGoBack={handleGoBack}
          showRetryButton={uiConfig?.error?.showRetryButton !== false}
          showGoBackButton={uiConfig?.error?.showGoBackButton !== false}
          customMessages={uiConfig?.error?.customMessages}
          testID={`${testID}-error-component`}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Network Status Indicator */}
      <NetworkStatusComponent />
      
      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: config.url }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        // WebView configuration
        javaScriptEnabled={config.javaScriptEnabled ?? true}
        domStorageEnabled={config.domStorageEnabled ?? true}
        startInLoadingState={false}
        scalesPageToFit={config.scalesPageToFit ?? true}
        allowsInlineMediaPlayback={config.allowsInlineMediaPlayback ?? true}
        mediaPlaybackRequiresUserAction={config.mediaPlaybackRequiresUserAction ?? false}
        allowsFullscreenVideo={config.allowsFullscreenVideo ?? true}
        mixedContentMode={config.mixedContentMode ?? 'compatibility'}
        cacheEnabled={config.cacheEnabled ?? true}
        cacheMode={isOffline ? 'LOAD_CACHE_ELSE_NETWORK' : (config.cacheMode ?? 'LOAD_DEFAULT')}
        userAgent={config.userAgent}
        // Security settings
        allowFileAccess={config.allowFileAccess ?? false}
        allowUniversalAccessFromFileURLs={config.allowUniversalAccessFromFileURLs ?? false}
        allowFileAccessFromFileURLs={config.allowFileAccessFromFileURLs ?? false}
        // Additional features
        pullToRefreshEnabled={config.pullToRefreshEnabled ?? true}
        // Accessibility
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={`${testID}-webview`}
      />
      
      {/* Loading overlay with lazy loading support */}
      {state.isLoading && (
        <View style={styles.loadingOverlay} testID={`${testID}-loading`}>
          {/* Show skeleton loading if enabled */}
          {lazyLoadingConfig?.enabled && lazyLoadingState === LoadingState.SKELETON && (
            <SkeletonLoadingComponent
              enabled={lazyLoadingConfig.skeletonConfig?.enabled}
              backgroundColor={lazyLoadingConfig.skeletonConfig?.backgroundColor}
              shimmerColor={lazyLoadingConfig.skeletonConfig?.shimmerColor}
              animationDuration={lazyLoadingConfig.skeletonConfig?.animationDuration}
              testID={`${testID}-skeleton-loading`}
            />
          )}
          
          {/* Show progressive loading if enabled */}
          {lazyLoadingConfig?.enabled && lazyLoadingState === LoadingState.PROGRESSIVE && (
            <LoadingComponent
              size="large"
              color={uiConfig?.loading?.color || theme.colors.primary}
              text={`${lazyLoadingConfig.customLoadingStates?.loading || "Loading content..."} (${lazyLoadingProgress}%)`}
              showSpinner={uiConfig?.loading?.showSpinner !== false}
              testID={`${testID}-progressive-loading`}
            />
          )}
          
          {/* Show cached content indicator */}
          {lazyLoadingConfig?.enabled && lazyLoadingState === LoadingState.CACHED && (
            <LoadingComponent
              size="large"
              color={uiConfig?.loading?.color || theme.colors.primary}
              text={lazyLoadingConfig.customLoadingStates?.success || "Loading from cache..."}
              showSpinner={false}
              testID={`${testID}-cached-loading`}
            />
          )}
          
          {/* Show default loading if lazy loading is disabled or in initial state */}
          {(!lazyLoadingConfig?.enabled || lazyLoadingState === LoadingState.INITIAL || lazyLoadingState === LoadingState.LOADING) && (
            <LoadingComponent
              size="large"
              color={uiConfig?.loading?.color || theme.colors.primary}
              text={uiConfig?.loading?.text || "Loading website..."}
              showSpinner={uiConfig?.loading?.showSpinner !== false}
              testID={`${testID}-loading-component`}
            />
          )}
        </View>
      )}
      
      {/* Debug controls removed - using pull-to-refresh instead */}
      
      {/* Watermark - Always render if config exists */}
      {uiConfig?.watermark && uiConfig.watermark.enabled && (
        <>
          {console.log('Rendering watermark with config:', uiConfig.watermark)}
          <WatermarkComponent
            config={uiConfig.watermark}
            testID={`${testID}-watermark`}
          />
        </>
      )}
      
      {/* Offline Indicator */}
      {offlineConfig?.indicator?.enabled && (
        <OfflineIndicator
          isOffline={isOffline}
          onRetry={() => {
            // Trigger sync when retry is pressed
            if (offlineConfig?.sync?.enabled) {
              performSync();
            }
          }}
          position={offlineConfig.indicator.position}
          style={offlineConfig.indicator.style}
          autoHide={offlineConfig.indicator.autoHide}
          hideDelay={offlineConfig.indicator.hideDelay}
          testID={`${testID}-offline-indicator`}
        />
      )}
    </View>
  );
};

// Styles
const createStyles = (theme: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background + 'E6', // 90% opacity
  },
});

export default WebViewComponent;
