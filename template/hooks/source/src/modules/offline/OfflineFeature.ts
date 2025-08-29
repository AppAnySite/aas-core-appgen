import { Feature, FeatureStatus } from '../../core/FeatureManager';
import { OfflineConfig, OfflineState, SyncStatus, OfflineIndicatorPosition, OfflineIndicatorStyle } from './types';
import { OfflineUtils } from './utils/OfflineUtils';
import { logger } from '../../utils/Logger';

/**
 * Offline Feature Implementation
 * Modular feature that can be independently controlled
 */
export class OfflineFeature implements Feature {
  public id = 'offline';
  public name = 'Offline Support';
  public version = '1.0.0';
  public status: FeatureStatus = FeatureStatus.DISABLED;
  public dependencies: string[] = ['network'];
  public config: OfflineConfig;

  private currentState: OfflineState;

  constructor(config: OfflineConfig) {
    const defaultConfig: OfflineConfig = {
      enabled: true,
      indicator: {
        enabled: true,
        position: OfflineIndicatorPosition.TOP,
        style: OfflineIndicatorStyle.BANNER,
        autoHide: true,
        hideDelay: 3000,
      },
      sync: {
        enabled: true,
        autoSync: true,
        syncInterval: 30000,
        maxRetries: 3,
        retryDelay: 1000,
      },
      storage: {
        enabled: true,
        maxSize: 1000,
        cleanupInterval: 3600000,
        encryptionEnabled: false,
      },
    };

    this.config = { ...defaultConfig, ...config };

    this.currentState = this.getInitialState();
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Offline Feature', this.config, 'OfflineFeature');
      
      if (!OfflineUtils.validateConfig(this.config)) {
        throw new Error('Invalid offline configuration');
      }

      // Initialize offline state
      this.currentState.isOffline = await OfflineUtils.isOffline();
      
      logger.info('Offline Feature initialized successfully', null, 'OfflineFeature');
      
    } catch (error) {
      logger.error('Failed to initialize Offline Feature', error as Error, 'OfflineFeature');
      throw error;
    }
  }

  public async deinitialize(): Promise<void> {
    try {
      logger.info('Deinitializing Offline Feature', null, 'OfflineFeature');
      
      // Reset state
      this.currentState = this.getInitialState();
      
      logger.info('Offline Feature deinitialized successfully', null, 'OfflineFeature');
      
    } catch (error) {
      logger.error('Failed to deinitialize Offline Feature', error as Error, 'OfflineFeature');
      throw error;
    }
  }

  public isEnabled(): boolean {
    return this.config.enabled !== false;
  }

  public getStatus(): FeatureStatus {
    return this.status;
  }

  public getConfig(): OfflineConfig {
    return this.config;
  }

  public getDependencies(): string[] {
    return this.dependencies;
  }

  /**
   * Get current offline state
   */
  public getOfflineState(): OfflineState {
    return { ...this.currentState };
  }

  /**
   * Check if currently offline
   */
  public isOffline(): boolean {
    return this.currentState.isOffline;
  }

  /**
   * Get sync status
   */
  public getSyncStatus(): SyncStatus {
    return this.currentState.syncStatus;
  }

  /**
   * Get storage usage
   */
  public getStorageUsage(): number {
    return this.currentState.storageUsage;
  }

  /**
   * Get initial offline state
   */
  private getInitialState(): OfflineState {
    return {
      isOffline: false,
      lastOnline: Date.now(),
      pendingActions: 0,
      syncStatus: SyncStatus.IDLE,
      storageUsage: 0,
      timestamp: Date.now(),
    };
  }
}

export const createOfflineFeature = (config: OfflineConfig): OfflineFeature => {
  return new OfflineFeature(config);
};
