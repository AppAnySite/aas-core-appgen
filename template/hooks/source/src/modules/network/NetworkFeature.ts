import { Feature, FeatureStatus } from '../../core/FeatureManager';
import { NetworkConfig } from './types';
import { networkManager } from '../../core/NetworkManager';
import { logger } from '../../utils/Logger';

/**
 * Network Feature Implementation
 * Modular feature that can be independently controlled
 */
export class NetworkFeature implements Feature {
  public id = 'network';
  public name = 'Network Monitoring';
  public version = '1.0.0';
  public status: FeatureStatus = FeatureStatus.DISABLED;
  public dependencies: string[] = [];
  public config: NetworkConfig;

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Network Feature', this.config, 'NetworkFeature');
      
      // Start network monitoring
      await networkManager.startMonitoring();
      
      logger.info('Network Feature initialized successfully', null, 'NetworkFeature');
      
    } catch (error) {
      logger.error('Failed to initialize Network Feature', error as Error, 'NetworkFeature');
      throw error;
    }
  }

  public async deinitialize(): Promise<void> {
    try {
      logger.info('Deinitializing Network Feature', null, 'NetworkFeature');
      
      // Stop network monitoring
      networkManager.stopMonitoring();
      
      logger.info('Network Feature deinitialized successfully', null, 'NetworkFeature');
      
    } catch (error) {
      logger.error('Failed to deinitialize Network Feature', error as Error, 'NetworkFeature');
      throw error;
    }
  }

  public isEnabled(): boolean {
    return this.config.enabled !== false;
  }

  public getStatus(): FeatureStatus {
    return this.status;
  }

  public getConfig(): NetworkConfig {
    return this.config;
  }

  public getDependencies(): string[] {
    return this.dependencies;
  }
}

export const createNetworkFeature = (config: NetworkConfig): NetworkFeature => {
  return new NetworkFeature(config);
};
