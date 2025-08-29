import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { WebViewComponent } from './src/modules/webview';
import { dynamicConfigLoader } from './src/config/DynamicConfigLoader';
import { 
  featureManager, 
  initializeFeatureManager, 
  registerFeature,
  onFeatureEvent,
  FeatureEvent,
  FeatureEventType 
} from './src/core/FeatureManager';
import { createNetworkFeature } from './src/modules/network';
import { createDeepLinkingFeature } from './src/modules/deepLinking';
import { createSecurityFeature } from './src/modules/security';
import { createPerformanceFeature } from './src/modules/performance';
import { createAccessibilityFeature } from './src/modules/accessibility';
import { createOfflineFeature } from './src/modules/offline';
import { createWebViewFeature } from './src/modules/webview';
import { logger } from './src/utils/Logger';

/**
 * Modular App Component
 * Uses FeatureManager to independently control features
 */
const AppModular = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    initializeModularApp();
  }, []);

  /**
   * Initialize the modular app with feature management
   */
  const initializeModularApp = async () => {
    try {
      logger.info('Initializing modular app', null, 'AppModular');

      // Load dynamic configuration
      await dynamicConfigLoader.loadConfig();
      const config = dynamicConfigLoader.getConfig();
      
      if (!config) {
        throw new Error('Failed to load configuration');
      }
      
      logger.info('Dynamic configuration loaded successfully', null, 'AppModular');

      // Initialize feature manager with configuration
      const featureManagerConfig = {
        features: {
          network: {
            enabled: (config.features as any)?.network?.enabled ?? true,
            config: (config.features as any)?.network ?? {},
            dependencies: [],
          },
          deepLinking: {
            enabled: config.features?.deepLinking?.enabled ?? true,
            config: config.features?.deepLinking ?? {},
            dependencies: [],
          },
          security: {
            enabled: config.features?.security?.enabled ?? true,
            config: config.features?.security ?? {},
            dependencies: [],
          },
          performance: {
            enabled: (config.features as any)?.performance?.enabled ?? true,
            config: (config.features as any)?.performance ?? {},
            dependencies: [],
          },
          accessibility: {
            enabled: (config.features as any)?.accessibility?.enabled ?? true,
            config: (config.features as any)?.accessibility ?? {},
            dependencies: [],
          },
          offline: {
            enabled: (config.features as any)?.offline?.enabled ?? true,
            config: (config.features as any)?.offline ?? {},
            dependencies: [],
          },
          webview: {
            enabled: (config.features as any)?.webview?.enabled ?? true,
            config: (config.features as any)?.webview ?? {},
            dependencies: [],
          },
        },
        autoInitialize: true,
        strictMode: false, // Allow features to fail without breaking the app
      };

      await initializeFeatureManager(featureManagerConfig);
      logger.info('Feature manager initialized successfully', null, 'AppModular');

      // Register all features
      await registerAllFeatures(config);

      // Set up feature event listeners
      setupFeatureEventListeners();

      setIsInitialized(true);
      logger.info('Modular app initialization completed successfully', null, 'AppModular');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      logger.error('Failed to initialize modular app', error as Error, null, 'AppModular');
      setInitializationError(errorMessage);
    }
  };

  /**
   * Register all features with the feature manager
   */
  const registerAllFeatures = async (config: any) => {
    try {
      // Register Network Feature
      if (config.features?.network?.enabled) {
        const networkFeature = createNetworkFeature(config.features.network);
        registerFeature(networkFeature);
        logger.info('Network feature registered', null, 'AppModular');
      }

      // Register Deep Linking Feature
      if (config.features?.deepLinking?.enabled) {
        const deepLinkingFeature = createDeepLinkingFeature(config.features.deepLinking);
        registerFeature(deepLinkingFeature);
        logger.info('Deep Linking feature registered', null, 'AppModular');
      }

      // Register Security Feature
      if (config.features?.security?.enabled) {
        const securityFeature = createSecurityFeature(config.features.security);
        registerFeature(securityFeature);
        logger.info('Security feature registered', null, 'AppModular');
      }

      // Register Performance Feature
      if (config.features?.performance?.enabled) {
        const performanceFeature = createPerformanceFeature(config.features.performance);
        registerFeature(performanceFeature);
        logger.info('Performance feature registered', null, 'AppModular');
      }

      // Register Accessibility Feature
      if (config.features?.accessibility?.enabled) {
        const accessibilityFeature = createAccessibilityFeature(config.features.accessibility);
        registerFeature(accessibilityFeature);
        logger.info('Accessibility feature registered', null, 'AppModular');
      }

      // Register Offline Feature
      if (config.features?.offline?.enabled) {
        const offlineFeature = createOfflineFeature(config.features.offline);
        registerFeature(offlineFeature);
        logger.info('Offline feature registered', null, 'AppModular');
      }

      // Register WebView Feature
      if (config.features?.webview?.enabled) {
        const webviewFeature = createWebViewFeature(config.features.webview);
        registerFeature(webviewFeature);
        logger.info('WebView feature registered', null, 'AppModular');
      }

      logger.info('All features registered successfully', null, 'AppModular');

    } catch (error) {
      logger.error('Failed to register features', error as Error, null, 'AppModular');
      throw error;
    }
  };

  /**
   * Set up feature event listeners
   */
  const setupFeatureEventListeners = () => {
    onFeatureEvent((event: FeatureEvent) => {
      switch (event.type) {
        case FeatureEventType.FEATURE_INITIALIZED:
          logger.info(`Feature ${event.featureId} initialized successfully`, null, 'AppModular');
          break;
        case FeatureEventType.FEATURE_DEINITIALIZED:
          logger.info(`Feature ${event.featureId} deinitialized successfully`, null, 'AppModular');
          break;
        case FeatureEventType.FEATURE_ERROR:
          logger.error(`Feature ${event.featureId} encountered an error`, event.error, null, 'AppModular');
          break;
        case FeatureEventType.FEATURE_STATUS_CHANGED:
          logger.info(`Feature ${event.featureId} status changed to ${event.status}`, null, 'AppModular');
          break;
        case FeatureEventType.DEPENDENCY_MISSING:
          logger.warn(`Feature ${event.featureId} has missing dependencies`, event.metadata, 'AppModular');
          break;
      }
    });
  };

  /**
   * Handle app cleanup
   */
  useEffect(() => {
    return () => {
      // Cleanup features when app unmounts
      if (isInitialized) {
        featureManager.deinitializeAllFeatures().catch(error => {
          logger.error('Failed to deinitialize features during cleanup', error as Error, null, 'AppModular');
        });
      }
    };
  }, [isInitialized]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <ThemeProvider>
          <div style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#f5f5f5'
          }}>
            <div style={{ 
              fontSize: 18, 
              color: '#333',
              textAlign: 'center',
              padding: 20
            }}>
              {initializationError ? (
                <>
                  <div style={{ color: '#ff3b30', marginBottom: 10 }}>
                    Initialization Error
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    {initializationError}
                  </div>
                </>
              ) : (
                'Initializing...'
              )}
            </div>
          </div>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  // Show main app when initialized
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <WebViewComponent config={(dynamicConfigLoader.getConfig()?.features as any)?.webview || {
          url: '',
          title: ''
        }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default AppModular;
