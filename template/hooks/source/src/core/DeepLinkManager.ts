import { Linking, Platform } from 'react-native';
import { logger } from '../utils/Logger';
import { eventBus, EventType, emitEvent } from './EventBus';
import { securityManager, validateURL } from './SecurityManager';

/**
 * Deep link types
 */
export enum DeepLinkType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  UNIVERSAL = 'universal',
  CUSTOM_SCHEME = 'custom_scheme',
  HTTP_HTTPS = 'http_https',
}

/**
 * Deep link action types
 */
export enum DeepLinkAction {
  OPEN_IN_APP = 'open_in_app',
  OPEN_IN_BROWSER = 'open_in_browser',
  SHOW_ALERT = 'show_alert',
  NAVIGATE = 'navigate',
  EXECUTE_SCRIPT = 'execute_script',
  CUSTOM = 'custom',
}

/**
 * Deep link configuration
 */
export interface DeepLinkConfig {
  enabled: boolean;
  scheme: string;
  allowedDomains: string[];
  redirectToBrowser: boolean;
  customScheme?: string;
  universalLinks?: {
    enabled: boolean;
    domains: string[];
  };
  security?: {
    validateUrls: boolean;
    blockSuspiciousUrls: boolean;
    requireHttps: boolean;
  };
  analytics?: {
    trackDeepLinks: boolean;
    trackConversion: boolean;
  };
}

/**
 * Deep link data
 */
export interface DeepLinkData {
  url: string;
  source: 'app' | 'browser' | 'notification' | 'external' | 'universal';
  timestamp: number;
  metadata?: Record<string, any>;
  referrer?: string;
  campaign?: string;
  medium?: string;
  sourceName?: string;
}

/**
 * Deep link result
 */
export interface DeepLinkResult {
  handled: boolean;
  shouldOpenInApp: boolean;
  shouldRedirectToBrowser: boolean;
  reason: string;
  url: string;
  action: DeepLinkAction;
  data?: any;
  error?: string;
}

/**
 * Deep link handler
 */
export interface DeepLinkHandler {
  pattern: string | RegExp;
  action: DeepLinkAction;
  handler: (url: string, data: DeepLinkData) => Promise<DeepLinkResult>;
  priority: number;
}

/**
 * Comprehensive Deep Link Manager
 */
class DeepLinkManager {
  private static instance: DeepLinkManager;
  private config: DeepLinkConfig | null = null;
  private handlers: DeepLinkHandler[] = [];
  private _isInitialized: boolean = false;
  private pendingLinks: DeepLinkData[] = [];
  private linkHistory: DeepLinkData[] = [];
  private maxHistorySize: number = 100;
  private eventCallbacks: Array<(result: DeepLinkResult) => void> = [];

  private constructor() {
    this.setupDefaultHandlers();
  }

  public static getInstance(): DeepLinkManager {
    if (!DeepLinkManager.instance) {
      DeepLinkManager.instance = new DeepLinkManager();
    }
    return DeepLinkManager.instance;
  }

  /**
   * Initialize deep linking
   */
  public async initialize(config: DeepLinkConfig): Promise<void> {
    if (this.isInitialized()) {
      logger.warn('Deep linking already initialized', null, 'DeepLinkManager');
      return;
    }

    try {
      this.config = config;
      
      // Set up URL scheme handling
      if (config.customScheme) {
        await this.setupCustomScheme(config.customScheme);
      }

      // Set up universal links
      if (config.universalLinks?.enabled) {
        await this.setupUniversalLinks(config.universalLinks.domains);
      }

      // Set up initial URL handling
      await this.handleInitialURL();

      this._isInitialized = true;
      
      logger.info('Deep linking initialized successfully', {
        scheme: config.scheme,
        customScheme: config.customScheme,
        universalLinks: config.universalLinks?.enabled,
      }, 'DeepLinkManager');

      // Process any pending links
      await this.processPendingLinks();

    } catch (error) {
      logger.error('Failed to initialize deep linking', error as Error, null, 'DeepLinkManager');
      throw error;
    }
  }

  /**
   * Setup custom URL scheme
   */
  private async setupCustomScheme(scheme: string): Promise<void> {
    try {
      // Add event listener for URL changes
      Linking.addEventListener('url', this.handleURL.bind(this));
      
      logger.info('Custom scheme setup completed', { scheme }, 'DeepLinkManager');
    } catch (error) {
      logger.error('Failed to setup custom scheme', error as Error, { scheme }, 'DeepLinkManager');
      throw error;
    }
  }

  /**
   * Setup universal links
   */
  private async setupUniversalLinks(domains: string[]): Promise<void> {
    try {
      // For universal links, we need to handle the initial URL
      // and set up proper domain association
      
      logger.info('Universal links setup completed', { domains }, 'DeepLinkManager');
    } catch (error) {
      logger.error('Failed to setup universal links', error as Error, { domains }, 'DeepLinkManager');
      throw error;
    }
  }

  /**
   * Handle initial URL when app is opened via deep link
   */
  private async handleInitialURL(): Promise<void> {
    try {
      const initialURL = await Linking.getInitialURL();
      if (initialURL) {
        const deepLinkData: DeepLinkData = {
          url: initialURL,
          source: 'external',
          timestamp: Date.now(),
        };
        
        await this.processDeepLink(deepLinkData);
      }
    } catch (error) {
      logger.error('Failed to handle initial URL', error as Error, null, 'DeepLinkManager');
    }
  }

  /**
   * Handle URL changes
   */
  private async handleURL(event: { url: string }): Promise<void> {
    try {
      const deepLinkData: DeepLinkData = {
        url: event.url,
        source: 'app',
        timestamp: Date.now(),
      };
      
      await this.processDeepLink(deepLinkData);
    } catch (error) {
      logger.error('Failed to handle URL change', error as Error, { url: event.url }, 'DeepLinkManager');
    }
  }

  /**
   * Process deep link
   */
  public async processDeepLink(data: DeepLinkData): Promise<DeepLinkResult> {
    try {
      // Add to history
      this.addToHistory(data);

      // Validate URL if security is enabled
      if (this.config?.security?.validateUrls) {
        const securityValidation = validateURL(data.url);
        if (!securityValidation.isValid) {
          const result: DeepLinkResult = {
            handled: false,
            shouldOpenInApp: false,
            shouldRedirectToBrowser: false,
            reason: 'URL failed security validation',
            url: data.url,
            action: DeepLinkAction.SHOW_ALERT,
            error: 'Security validation failed',
          };
          
          this.notifyCallbacks(result);
          return result;
        }
      }

      // Determine link type
      const linkType = this.getLinkType(data.url);
      
      // Find appropriate handler
      const handler = this.findHandler(data.url);
      
      if (handler) {
        // Execute handler
        const result = await handler.handler(data.url, data);
        
        // Track analytics if enabled
        if (this.config?.analytics?.trackDeepLinks) {
          this.trackDeepLink(data, result);
        }
        
        this.notifyCallbacks(result);
        return result;
      }

      // Default handling based on configuration
      const defaultResult = this.getDefaultResult(data, linkType);
      this.notifyCallbacks(defaultResult);
      return defaultResult;

    } catch (error) {
      logger.error('Failed to process deep link', error as Error, { url: data.url }, 'DeepLinkManager');
      
      const errorResult: DeepLinkResult = {
        handled: false,
        shouldOpenInApp: false,
        shouldRedirectToBrowser: false,
        reason: 'Processing failed',
        url: data.url,
        action: DeepLinkAction.SHOW_ALERT,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      this.notifyCallbacks(errorResult);
      return errorResult;
    }
  }

  /**
   * Get link type from URL
   */
  private getLinkType(url: string): DeepLinkType {
    try {
      // Parse URL manually to avoid type issues
      const urlMatch = url.match(/^([^:]+):\/\/([^\/]+)/);
      if (!urlMatch) {
        return DeepLinkType.EXTERNAL;
      }
      
      const protocol = urlMatch[1];
      const hostname = urlMatch[2];
      
      if (protocol === 'http' || protocol === 'https') {
        // Check if it's a universal link
        if (this.config?.universalLinks?.domains.some(domain => 
          hostname === domain || hostname.endsWith('.' + domain)
        )) {
          return DeepLinkType.UNIVERSAL;
        }
        return DeepLinkType.HTTP_HTTPS;
      }
      
      if (protocol === this.config?.customScheme) {
        return DeepLinkType.CUSTOM_SCHEME;
      }
      
      return DeepLinkType.EXTERNAL;
    } catch {
      return DeepLinkType.EXTERNAL;
    }
  }

  /**
   * Find appropriate handler for URL
   */
  private findHandler(url: string): DeepLinkHandler | null {
    // Sort handlers by priority (highest first)
    const sortedHandlers = [...this.handlers].sort((a, b) => b.priority - a.priority);
    
    for (const handler of sortedHandlers) {
      if (this.matchesPattern(url, handler.pattern)) {
        return handler;
      }
    }
    
    return null;
  }

  /**
   * Check if URL matches pattern
   */
  private matchesPattern(url: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return url.includes(pattern);
    }
    return pattern.test(url);
  }

  /**
   * Get default result based on configuration
   */
  private getDefaultResult(data: DeepLinkData, linkType: DeepLinkType): DeepLinkResult {
    const shouldOpenInApp = this.shouldOpenInApp(data.url, linkType);
    const shouldRedirectToBrowser = !shouldOpenInApp && this.config?.redirectToBrowser;
    
    return {
      handled: true,
      shouldOpenInApp,
      shouldRedirectToBrowser: shouldRedirectToBrowser ?? false,
      reason: shouldOpenInApp ? 'Opened in app' : 'Redirected to browser',
      url: data.url,
      action: shouldOpenInApp ? DeepLinkAction.OPEN_IN_APP : DeepLinkAction.OPEN_IN_BROWSER,
    };
  }

  /**
   * Determine if URL should open in app
   */
  private shouldOpenInApp(url: string, linkType: DeepLinkType): boolean {
    if (!this.config) return false;
    
    try {
      // Parse URL manually to avoid type issues
      const urlMatch = url.match(/^([^:]+):\/\/([^\/]+)/);
      if (!urlMatch) {
        return false;
      }
      
      const hostname = urlMatch[2];
      
      // Custom scheme links always open in app
      if (linkType === DeepLinkType.CUSTOM_SCHEME) {
        return true;
      }
      
      // Universal links open in app if domain is allowed
      if (linkType === DeepLinkType.UNIVERSAL) {
        return this.config.universalLinks?.domains?.some(domain => 
          hostname === domain || hostname.endsWith('.' + domain)
        ) ?? false;
      }
      
      // Check allowed domains
      if (this.config.allowedDomains.length > 0) {
        return this.config.allowedDomains.some(domain => 
          hostname === domain || hostname.endsWith('.' + domain)
        );
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Add deep link handler
   */
  public addHandler(handler: DeepLinkHandler): void {
    this.handlers.push(handler);
    logger.info('Deep link handler added', { pattern: handler.pattern }, 'DeepLinkManager');
  }

  /**
   * Remove deep link handler
   */
  public removeHandler(pattern: string | RegExp): void {
    const index = this.handlers.findIndex(h => h.pattern === pattern);
    if (index > -1) {
      this.handlers.splice(index, 1);
      logger.info('Deep link handler removed', { pattern }, 'DeepLinkManager');
    }
  }

  /**
   * Setup default handlers
   */
  private setupDefaultHandlers(): void {
    // Internal navigation handler - uses dynamic scheme from config
    const scheme = this.config?.scheme || 'app';
    this.addHandler({
      pattern: new RegExp(`^${scheme}:\/\/navigate\/(.+)$`),
      action: DeepLinkAction.NAVIGATE,
      priority: 100,
      handler: async (url: string, data: DeepLinkData) => {
        const match = url.match(new RegExp(`^${scheme}:\/\/navigate\/(.+)$`));
        if (match) {
          return {
            handled: true,
            shouldOpenInApp: true,
            shouldRedirectToBrowser: false,
            reason: 'Internal navigation',
            url,
            action: DeepLinkAction.NAVIGATE,
            data: { route: match[1] },
          };
        }
        return this.getDefaultResult(data, DeepLinkType.CUSTOM_SCHEME);
      },
    });

    // External link handler - uses dynamic domain from config
    const allowedDomains = this.config?.allowedDomains || [];
    const domainPattern = allowedDomains.length > 0 
      ? `(?!.*(${allowedDomains.join('|')}))` 
      : '';
    this.addHandler({
      pattern: new RegExp(`^https?:\/\/${domainPattern}`),
      action: DeepLinkAction.OPEN_IN_BROWSER,
      priority: 50,
      handler: async (url: string, data: DeepLinkData) => {
        return {
          handled: true,
          shouldOpenInApp: false,
          shouldRedirectToBrowser: true,
          reason: 'External link',
          url,
          action: DeepLinkAction.OPEN_IN_BROWSER,
        };
      },
    });
  }

  /**
   * Add to history
   */
  private addToHistory(data: DeepLinkData): void {
    this.linkHistory.push(data);
    if (this.linkHistory.length > this.maxHistorySize) {
      this.linkHistory.shift();
    }
  }

  /**
   * Process pending links
   */
  private async processPendingLinks(): Promise<void> {
    for (const link of this.pendingLinks) {
      await this.processDeepLink(link);
    }
    this.pendingLinks = [];
  }

  /**
   * Add pending link
   */
  public addPendingLink(data: DeepLinkData): void {
    this.pendingLinks.push(data);
  }

  /**
   * Track deep link analytics
   */
  private trackDeepLink(data: DeepLinkData, result: DeepLinkResult): void {
    const analyticsData = {
      url: data.url,
      source: data.source,
      handled: result.handled,
      action: result.action,
      timestamp: data.timestamp,
      campaign: data.campaign,
      medium: data.medium,
      referrer: data.referrer,
    };

    emitEvent(EventType.ANALYTICS_EVENT, {
      source: 'DeepLinkManager',
      data: {
        name: 'deep_link_processed',
        properties: analyticsData,
        timestamp: Date.now(),
      },
    });

    logger.info('Deep link tracked', analyticsData, 'DeepLinkManager');
  }

  /**
   * Add event callback
   */
  public onDeepLinkResult(callback: (result: DeepLinkResult) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Remove event callback
   */
  public removeDeepLinkCallback(callback: (result: DeepLinkResult) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * Notify callbacks
   */
  private notifyCallbacks(result: DeepLinkResult): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        logger.error('Error in deep link callback', error as Error, null, 'DeepLinkManager');
      }
    });
  }

  /**
   * Get link history
   */
  public getLinkHistory(): DeepLinkData[] {
    return [...this.linkHistory];
  }

  /**
   * Clear link history
   */
  public clearLinkHistory(): void {
    this.linkHistory = [];
    logger.info('Deep link history cleared', null, 'DeepLinkManager');
  }

  /**
   * Get configuration
   */
  public getConfig(): DeepLinkConfig | null {
    return this.config;
  }

  /**
   * Check if initialized
   */
  public isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Export deep link statistics
   */
  public exportDeepLinkStats(): string {
    const stats = {
      isInitialized: this.isInitialized,
      config: this.config,
      handlers: this.handlers.map(h => ({ pattern: h.pattern, action: h.action, priority: h.priority })),
      linkHistory: this.linkHistory,
      pendingLinks: this.pendingLinks,
    };

    return JSON.stringify(stats, null, 2);
  }
}

// Export singleton instance
export const deepLinkManager = DeepLinkManager.getInstance();

// Export convenience functions
export const initializeDeepLinking = (config: DeepLinkConfig) => deepLinkManager.initialize(config);
export const processDeepLink = (url: string, source: DeepLinkData['source'] = 'external') => {
  const data: DeepLinkData = {
    url,
    source,
    timestamp: Date.now(),
  };
  return deepLinkManager.processDeepLink(data);
};
export const addDeepLinkHandler = (handler: DeepLinkHandler) => deepLinkManager.addHandler(handler);
export const onDeepLinkResult = (callback: (result: DeepLinkResult) => void) => {
  deepLinkManager.onDeepLinkResult(callback);
};
export const isDeepLinkingEnabled = () => deepLinkManager.isInitialized;
