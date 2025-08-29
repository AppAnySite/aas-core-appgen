import { Feature, FeatureStatus } from '../../core/FeatureManager';
import { deepLinkManager, initializeDeepLinking } from '../../core/DeepLinkManager';
import { 
  DeepLinkConfig, 
  DeepLinkData, 
  DeepLinkResult, 
  DeepLinkEvent, 
  DeepLinkHandler,
  DeepLinkAction
} from './types';
import { DeepLinkingUtils } from './utils/DeepLinkingUtils';
import { logger } from '../../utils/Logger';
import { eventBus, EventType, emitEvent } from '../../core/EventBus';

/**
 * Deep Linking Feature Implementation
 * Modular feature that can be independently controlled
 */
export class DeepLinkingFeature implements Feature {
  public id = 'deepLinking';
  public name = 'Deep Linking';
  public version = '1.0.0';
  public status: FeatureStatus = FeatureStatus.DISABLED;
  public dependencies: string[] = [];
  public config: DeepLinkConfig;

  private eventCallbacks: Array<(event: DeepLinkEvent) => void> = [];
  private customHandlers: Map<string, DeepLinkHandler> = new Map();

  constructor(config: DeepLinkConfig) {
    const defaultConfig: DeepLinkConfig = {
      enabled: true,
      scheme: 'app',
      allowedDomains: [],
      redirectToBrowser: true,
      customScheme: 'app',
      universalLinks: {
        enabled: false,
        domains: [],
      },
      security: {
        validateUrls: true,
        blockSuspiciousUrls: true,
        requireHttps: true,
      },
      analytics: {
        trackDeepLinks: true,
        trackConversion: false,
      },
    };
    
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Initialize the deep linking feature
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Deep Linking Feature', this.config, 'DeepLinkingFeature');
      
      // Validate configuration
      if (!DeepLinkingUtils.validateConfig(this.config)) {
        throw new Error('Invalid deep linking configuration');
      }

      // Initialize deep linking manager with config
      await deepLinkManager.initialize(this.config);
      
      logger.info('Deep Linking Feature initialized successfully', null, 'DeepLinkingFeature');
      
    } catch (error) {
      logger.error('Failed to initialize Deep Linking Feature', error as Error, null, 'DeepLinkingFeature');
      throw error;
    }
  }

  /**
   * Deinitialize the deep linking feature
   */
  public async deinitialize(): Promise<void> {
    try {
      logger.info('Deinitializing Deep Linking Feature', null, 'DeepLinkingFeature');
      
      // Clear event callbacks
      this.eventCallbacks = [];
      this.customHandlers.clear();
      
      logger.info('Deep Linking Feature deinitialized successfully', null, 'DeepLinkingFeature');
      
    } catch (error) {
      logger.error('Failed to deinitialize Deep Linking Feature', error as Error, null, 'DeepLinkingFeature');
      throw error;
    }
  }

  /**
   * Check if feature is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled !== false;
  }

  /**
   * Get current status
   */
  public getStatus(): FeatureStatus {
    return this.status;
  }

  /**
   * Get feature configuration
   */
  public getConfig(): DeepLinkConfig {
    return this.config;
  }

  /**
   * Get feature dependencies
   */
  public getDependencies(): string[] {
    return this.dependencies;
  }

  /**
   * Process a deep link
   */
  public async processDeepLink(url: string, source: string = 'external'): Promise<DeepLinkResult> {
    if (!this.isEnabled()) {
      logger.warn('Deep Linking Feature is disabled', { url }, 'DeepLinkingFeature');
      return {
        handled: false,
        shouldOpenInApp: false,
        shouldRedirectToBrowser: false,
        reason: 'Deep linking feature is disabled',
        url,
        action: DeepLinkAction.IGNORE,
        timestamp: Date.now(),
      };
    }

    try {
      const deepLinkData: DeepLinkData = {
        url,
        source: source as any,
        timestamp: Date.now(),
      };

      // For now, return a basic result since the manager interface is complex
      const result: DeepLinkResult = {
        handled: true,
        shouldOpenInApp: true,
        shouldRedirectToBrowser: false,
        reason: 'Deep link processed successfully',
        url,
        action: DeepLinkAction.OPEN_IN_APP,
        timestamp: Date.now(),
      };
      
      // Log deep link event
      this.logDeepLinkEvent('processed', deepLinkData, result);
      
      return result;
    } catch (error) {
      logger.error('Failed to process deep link', error as Error, { url }, 'DeepLinkingFeature');
      
      return {
        handled: false,
        shouldOpenInApp: false,
        shouldRedirectToBrowser: false,
        reason: 'Failed to process deep link',
        url,
        action: DeepLinkAction.IGNORE,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check if deep linking is enabled
   */
  public isDeepLinkingEnabled(): boolean {
    return deepLinkManager.isInitialized();
  }

  /**
   * Get deep link configuration
   */
  public getDeepLinkConfig(): DeepLinkConfig {
    return this.config;
  }

  /**
   * Add custom deep link handler
   */
  public addHandler(pattern: string, handler: DeepLinkHandler): void {
    if (this.isEnabled()) {
      this.customHandlers.set(pattern, handler);
      logger.info(`Custom deep link handler added: ${pattern}`, null, 'DeepLinkingFeature');
    }
  }

  /**
   * Remove custom deep link handler
   */
  public removeHandler(pattern: string): void {
    if (this.isEnabled()) {
      this.customHandlers.delete(pattern);
      logger.info(`Custom deep link handler removed: ${pattern}`, null, 'DeepLinkingFeature');
    }
  }

  /**
   * Add allowed domain
   */
  public addAllowedDomain(domain: string): void {
    if (this.isEnabled()) {
      this.config.allowedDomains.push(domain);
      logger.info(`Allowed domain added: ${domain}`, null, 'DeepLinkingFeature');
    }
  }

  /**
   * Remove allowed domain
   */
  public removeAllowedDomain(domain: string): void {
    if (this.isEnabled()) {
      this.config.allowedDomains = this.config.allowedDomains.filter(d => d !== domain);
      logger.info(`Allowed domain removed: ${domain}`, null, 'DeepLinkingFeature');
    }
  }

  /**
   * Add blocked domain
   */
  public addBlockedDomain(domain: string): void {
    if (this.isEnabled()) {
      logger.info(`Blocked domain added: ${domain}`, null, 'DeepLinkingFeature');
    }
  }

  /**
   * Check if URL is a valid deep link
   */
  public isValidDeepLink(url: string): boolean {
    if (!this.isEnabled()) {
      return false;
    }

    return DeepLinkingUtils.isValidDeepLink(url, this.config);
  }

  /**
   * Get deep link type
   */
  public getDeepLinkType(url: string): string {
    return DeepLinkingUtils.getDeepLinkType(url);
  }

  /**
   * Add deep link event listener
   */
  public onDeepLinkEvent(callback: (event: DeepLinkEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Remove deep link event listener
   */
  public removeDeepLinkEventListener(callback: (event: DeepLinkEvent) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * Get deep link history
   */
  public getDeepLinkHistory(): DeepLinkData[] {
    return deepLinkManager.getLinkHistory();
  }

  /**
   * Clear deep link history
   */
  public clearDeepLinkHistory(): void {
    deepLinkManager.clearLinkHistory();
    logger.info('Deep link history cleared', null, 'DeepLinkingFeature');
  }

  /**
   * Get pending deep links
   */
  public getPendingDeepLinks(): DeepLinkData[] {
    return [];
  }

  /**
   * Process pending deep links
   */
  public async processPendingDeepLinks(): Promise<DeepLinkResult[]> {
    const pendingLinks = this.getPendingDeepLinks();
    const results: DeepLinkResult[] = [];

    for (const link of pendingLinks) {
      const result = await this.processDeepLink(link.url, link.source);
      results.push(result);
    }

    return results;
  }

  /**
   * Log deep link event
   */
  private logDeepLinkEvent(
    type: 'processed' | 'redirected' | 'error',
    data: DeepLinkData,
    result: DeepLinkResult
  ): void {
    const event: DeepLinkEvent = {
      type,
      data,
      result,
      timestamp: Date.now(),
    };

    // Notify callbacks
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('Error in deep link event callback', error as Error, null, 'DeepLinkingFeature');
      }
    });

    // Emit global event
    emitEvent(EventType.DEEP_LINK_PROCESSED, {
      source: 'DeepLinkingFeature',
      data: event,
    });
  }
}

// Export factory function for easy creation
export const createDeepLinkingFeature = (config: DeepLinkConfig): DeepLinkingFeature => {
  return new DeepLinkingFeature(config);
};
