import { Feature, FeatureStatus } from '../../core/FeatureManager';
import { WebViewConfig } from './types';
import { logger } from '../../utils/Logger';

/**
 * WebView Feature Implementation
 * Modular feature that can be independently controlled
 */
export class WebViewFeature implements Feature {
  public id = 'webview';
  public name = 'WebView';
  public version = '1.0.0';
  public status: FeatureStatus = FeatureStatus.DISABLED;
  public dependencies: string[] = ['network', 'security'];
  public config: WebViewConfig;

  constructor(config: WebViewConfig) {
    this.config = config;
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing WebView Feature', this.config, 'WebViewFeature');
      
      // Validate configuration
      if (!this.config.url) {
        throw new Error('WebView URL is required');
      }
      
      logger.info('WebView Feature initialized successfully', null, 'WebViewFeature');
      
    } catch (error) {
      logger.error('Failed to initialize WebView Feature', error as Error, 'WebViewFeature');
      throw error;
    }
  }

  public async deinitialize(): Promise<void> {
    try {
      logger.info('Deinitializing WebView Feature', null, 'WebViewFeature');
      
      // Cleanup WebView resources
      
      logger.info('WebView Feature deinitialized successfully', null, 'WebViewFeature');
      
    } catch (error) {
      logger.error('Failed to deinitialize WebView Feature', error as Error, 'WebViewFeature');
      throw error;
    }
  }

  public isEnabled(): boolean {
    return this.config.enabled !== false;
  }

  public getStatus(): FeatureStatus {
    return this.status;
  }

  public getConfig(): WebViewConfig {
    return this.config;
  }

  public getDependencies(): string[] {
    return this.dependencies;
  }
}

export const createWebViewFeature = (config: WebViewConfig): WebViewFeature => {
  return new WebViewFeature(config);
};
