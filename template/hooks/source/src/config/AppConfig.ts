import { AppConfig, WebViewConfig } from '../types';

/**
 * Environment-based configuration management
 * Provides different settings for development, staging, and production environments
 */
class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Load configuration based on current environment
   */
  private loadConfiguration(): AppConfig {
    const environment = this.getEnvironment();
    
    const baseConfig: AppConfig = {
      name: '',
      version: '1.0.0',
      buildNumber: '1',
      environment,
      bundleId: '',
      displayName: '',
      apiBaseUrl: '',
      theme: {
        defaultMode: 'system',
        light: {
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
              disabled: '#C7C7CC'
            },
            border: '#C6C6C8',
            divider: '#C6C6C8'
          },
          spacing: {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32,
            xxl: 48
          },
          typography: {
            fontFamily: {
              regular: 'System',
              medium: 'System',
              bold: 'System'
            },
            fontSize: {
              xs: 12,
              sm: 14,
              md: 16,
              lg: 18,
              xl: 20,
              xxl: 24
            },
            lineHeight: {
              xs: 16,
              sm: 20,
              md: 24,
              lg: 28,
              xl: 32,
              xxl: 36
            }
          },
          borderRadius: {
            xs: 2,
            sm: 4,
            md: 8,
            lg: 12,
            xl: 16,
            round: 50
          }
        },
        dark: {
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
              disabled: '#3A3A3C'
            },
            border: '#38383A',
            divider: '#38383A'
          },
          spacing: {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32,
            xxl: 48
          },
          typography: {
            fontFamily: {
              regular: 'System',
              medium: 'System',
              bold: 'System'
            },
            fontSize: {
              xs: 12,
              sm: 14,
              md: 16,
              lg: 18,
              xl: 20,
              xxl: 24
            },
            lineHeight: {
              xs: 16,
              sm: 20,
              md: 24,
              lg: 28,
              xl: 32,
              xxl: 36
            }
          },
          borderRadius: {
            xs: 2,
            sm: 4,
            md: 8,
            lg: 12,
            xl: 16,
            round: 50
          }
        }
      },
      features: {
        network: { enabled: true },
        security: { enabled: true },
        performance: { enabled: true },
        accessibility: { enabled: true },
        deepLinking: { enabled: true },
        offline: { enabled: true }
      },
      enableAnalytics: true,
      enableCrashReporting: true,
      enablePushNotifications: false,
    };

    switch (environment) {
      case 'development':
        return {
          ...baseConfig,
          apiBaseUrl: 'http://localhost:3000/api',
          enableAnalytics: false,
          enableCrashReporting: false,
        };
      
      case 'staging':
        return {
          ...baseConfig,
          apiBaseUrl: 'https://staging-api.example.com',
          enableAnalytics: true,
          enableCrashReporting: true,
        };
      
      case 'production':
        return {
          ...baseConfig,
          apiBaseUrl: 'https://api.example.com',
          enableAnalytics: true,
          enableCrashReporting: true,
          enablePushNotifications: true,
        };
      
      default:
        return baseConfig;
    }
  }

  /**
   * Get current environment
   */
    private getEnvironment(): 'development' | 'staging' | 'production' {
    // In React Native, we can't easily detect development mode without __DEV__
    // For now, default to development
    return 'development';
  }

  /**
   * Get current configuration
   */
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get WebView configuration
   */
  public getWebViewConfig(): WebViewConfig {
    return {
      url: (this.config.features as any)?.webview?.url || '',
      title: this.config.name,
      userAgent: this.getUserAgent(),
      allowFileAccess: false,
      allowUniversalAccessFromFileURLs: false,
      allowFileAccessFromFileURLs: false,
      javaScriptEnabled: true,
      domStorageEnabled: true,
      startInLoadingState: false,
      scalesPageToFit: true,
      allowsInlineMediaPlayback: true,
      mediaPlaybackRequiresUserAction: false,
      allowsFullscreenVideo: true,
      mixedContentMode: 'compatibility',
      cacheEnabled: true,
      cacheMode: 'LOAD_DEFAULT',
      onShouldStartLoadWithRequest: this.handleShouldStartLoadWithRequest.bind(this),
      onNavigationStateChange: this.handleNavigationStateChange.bind(this),
      onError: this.handleWebViewError.bind(this),
      onLoadStart: this.handleLoadStart.bind(this),
      onLoadEnd: this.handleLoadEnd.bind(this),
      onMessage: this.handleWebViewMessage.bind(this),
    };
  }

  /**
   * Get appropriate user agent for the platform
   */
  private getUserAgent(): string {
    const platform = require('react-native').Platform.OS;
    
    if (platform === 'ios') {
      return 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
    } else {
      return 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36';
    }
  }

  /**
   * Handle WebView navigation requests
   */
  private handleShouldStartLoadWithRequest(request: any): boolean {
    // Log navigation for analytics
    console.log('WebView navigation:', request.url);
    
    // Allow all navigation by default
    // You can add custom logic here to block certain URLs or handle deep links
    return true;
  }

  /**
   * Handle WebView navigation state changes
   */
  private handleNavigationStateChange(navState: any): void {
    console.log('WebView navigation state changed:', {
      url: navState.url,
      title: navState.title,
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward,
    });
  }

  /**
   * Handle WebView errors
   */
  private handleWebViewError(error: any): void {
    console.error('WebView error:', error);
    
    // In production, you might want to send this to your error reporting service
    if (this.config.enableCrashReporting) {
      // Send error to crash reporting service
    }
  }

  /**
   * Handle WebView load start
   */
  private handleLoadStart(): void {
    console.log('WebView load started');
  }

  /**
   * Handle WebView load end
   */
  private handleLoadEnd(): void {
    console.log('WebView load ended');
  }

  /**
   * Handle WebView messages
   */
  private handleWebViewMessage(message: any): void {
    console.log('WebView message received:', message);
    
    // Handle messages from the website
    try {
      const data = JSON.parse(message.data);
      this.handleWebViewMessageData(data);
    } catch (error) {
      console.warn('Failed to parse WebView message:', error);
    }
  }

  /**
   * Handle parsed WebView message data
   */
  private handleWebViewMessageData(data: any): void {
    switch (data.type) {
      case 'ANALYTICS':
        if (this.config.enableAnalytics) {
          // Track analytics event
          console.log('Analytics event from WebView:', data.event);
        }
        break;
      
      case 'NAVIGATION':
        // Handle navigation requests from WebView
        console.log('Navigation request from WebView:', data);
        break;
      
      case 'ERROR':
        // Handle error reports from WebView
        console.error('Error from WebView:', data.error);
        break;
      
      default:
        console.log('Unknown WebView message type:', data.type);
    }
  }

  /**
   * Validate configuration with comprehensive checks
   */
  public validateConfig(): boolean {
    const requiredFields: (keyof AppConfig)[] = [
      'name',
      'version',
      'environment',
    ];

    // Check required fields
    for (const field of requiredFields) {
      if (!this.config[field]) {
        console.error(`Missing required configuration field: ${field}`);
        return false;
      }
    }

    // Validate URL format
    try {
      const webviewUrl = (this.config.features as any)?.webview?.url;
      if (webviewUrl) {
        new URL(webviewUrl);
      }
    } catch (error) {
      console.error('Invalid WebView URL in configuration:', (this.config.features as any)?.webview?.url);
      return false;
    }

    // Validate environment
    const validEnvironments = ['development', 'staging', 'production'];
    if (!validEnvironments.includes(this.config.environment)) {
      console.error('Invalid environment in configuration:', this.config.environment);
      return false;
    }

    // Validate version format
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(this.config.version)) {
      console.error('Invalid version format in configuration:', this.config.version);
      return false;
    }

    // Validate build number
    if (!this.config.buildNumber || isNaN(Number(this.config.buildNumber))) {
      console.error('Invalid build number in configuration:', this.config.buildNumber);
      return false;
    }

    return true;
  }

  /**
   * Get configuration for specific feature with enhanced defaults
   */
  public getFeatureConfig(feature: string): any {
    const featureConfigs: Record<string, any> = {
      analytics: {
        enabled: this.config.enableAnalytics,
        trackingId: 'your-tracking-id',
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        batchSize: 20,
        flushInterval: 30000, // 30 seconds
        maxQueueSize: 1000,
      },
      crashReporting: {
        enabled: this.config.enableCrashReporting,
        serviceUrl: 'https://crash-reporting.example.com',
        maxReportsPerSession: 10,
        includeDeviceInfo: true,
        includeUserInfo: true,
        includeScreenshots: false,
      },
      pushNotifications: {
        enabled: this.config.enablePushNotifications,
        fcmSenderId: 'your-fcm-sender-id',
        defaultChannel: 'general',
        soundEnabled: true,
        badgeEnabled: true,
        alertEnabled: true,
      },
      webView: {
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        offlineMessage: 'No internet connection. Please check your network settings.',
        cacheEnabled: true,
        cacheSize: 50 * 1024 * 1024, // 50MB
        userAgent: this.getUserAgent(),
        allowFileAccess: false,
        allowUniversalAccessFromFileURLs: false,
        allowFileAccessFromFileURLs: false,
      },
      network: {
        timeout: 30000,
        retryAttempts: 3,
        offlineDetection: true,
        connectionTypes: ['wifi', 'cellular'],
        qualityMonitoring: true,
        pingInterval: 60000, // 1 minute
      },
      security: {
        validateUrls: true,
        blockSuspiciousUrls: true,
        requireHttps: true,
        certificatePinning: false,
        allowedDomains: [],
        blockedDomains: [],
      },
      performance: {
        monitoring: true,
        metrics: {
          renderTime: { warning: 16, critical: 33 },
          networkRequest: { warning: 2000, critical: 5000 },
          webViewLoad: { warning: 3000, critical: 8000 },
          memoryUsage: { warning: 200, critical: 500 },
        },
        sampling: 0.1, // 10% of sessions
      },
    };

    return featureConfigs[feature] || {};
  }
}

// Export singleton instance
export const AppConfiguration = ConfigurationManager.getInstance();

// Export default configuration for direct access
export const defaultAppConfig: AppConfig = AppConfiguration.getConfig();
export const defaultWebViewConfig: WebViewConfig = AppConfiguration.getWebViewConfig();
