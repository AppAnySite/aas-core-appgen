import { OfflineData, SyncResult, OfflineConfig } from '../types';
import { logger } from '../utils/Logger';
import { eventBus, EventType, emitEvent } from './EventBus';
import { 
  offlineStorageManager, 
  getPendingSyncData, 
  updateSyncStatus, 
  trackSyncAttempt 
} from './OfflineStorageManager';

/**
 * SmartSyncManager - Handles intelligent data synchronization
 * Manages background sync, retry logic, and conflict resolution
 */
class SmartSyncManager {
  private static instance: SmartSyncManager;
  private config: OfflineConfig | null = null;
  private isInitialized = false;
  private isSyncing = false;
  private syncInterval: any = null;
  private retryQueue: OfflineData[] = [];
  private syncHistory: SyncResult[] = [];

  private constructor() {}

  static getInstance(): SmartSyncManager {
    if (!SmartSyncManager.instance) {
      SmartSyncManager.instance = new SmartSyncManager();
    }
    return SmartSyncManager.instance;
  }

  /**
   * Initialize the smart sync manager
   */
  initialize(config: OfflineConfig): void {
    this.config = config;
    this.isInitialized = true;
    
    logger.info('SmartSyncManager initialized', {
      enabled: config.enabled,
      autoSync: config.sync?.autoSync,
      syncInterval: config.sync?.syncInterval,
    }, 'SmartSyncManager');

    emitEvent(EventType.OFFLINE_SYNC_STARTED, {
      source: 'SmartSyncManager',
      data: config,
    });

    // Start auto sync if enabled
    if (config.sync?.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync(): void {
    if (!this.config?.sync?.autoSync || this.syncInterval) return;

    const interval = this.config.sync.syncInterval || 30000; // 30 seconds default
    
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, interval);

    logger.info('Auto sync started', { interval }, 'SmartSyncManager');
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Auto sync stopped', {}, 'SmartSyncManager');
    }
  }

  /**
   * Perform manual synchronization
   */
  async performSync(): Promise<SyncResult> {
    if (!this.isInitialized || this.isSyncing) {
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: ['Sync already in progress or not initialized'],
        timestamp: Date.now(),
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      logger.info('Starting smart sync', {}, 'SmartSyncManager');

      emitEvent(EventType.OFFLINE_SYNC_STARTED, {
        source: 'SmartSyncManager',
        data: { timestamp: startTime },
      });

      // Get pending sync data
      const pendingData = await getPendingSyncData();
      
      if (pendingData.length === 0) {
        const result: SyncResult = {
          success: true,
          syncedItems: 0,
          failedItems: 0,
          errors: [],
          timestamp: Date.now(),
        };

        this.syncHistory.push(result);
        trackSyncAttempt(true);
        
        logger.info('No pending data to sync', {}, 'SmartSyncManager');
        return result;
      }

      // Process each item
      const results = await Promise.allSettled(
        pendingData.map(item => this.syncItem(item))
      );

      // Analyze results
      const syncedItems = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failedItems = results.filter(r => r.status === 'rejected' || !r.value).length;
      const errors = results
        .map((r, index) => r.status === 'rejected' ? `Item ${index}: ${r.reason}` : null)
        .filter(Boolean) as string[];

      const success = failedItems === 0;
      const syncTime = Date.now() - startTime;

      const result: SyncResult = {
        success,
        syncedItems,
        failedItems,
        errors,
        timestamp: Date.now(),
      };

      this.syncHistory.push(result);
      trackSyncAttempt(success);

      // Log results
      logger.info('Smart sync completed', {
        success,
        syncedItems,
        failedItems,
        syncTime,
        errors: errors.length,
      }, 'SmartSyncManager');

      // Emit completion event
      if (success) {
        emitEvent(EventType.OFFLINE_SYNC_COMPLETED, {
          source: 'SmartSyncManager',
          data: result,
        });
      } else {
        emitEvent(EventType.OFFLINE_SYNC_FAILED, {
          source: 'SmartSyncManager',
          data: result,
        });
      }

      return result;

    } catch (error) {
      const result: SyncResult = {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
        timestamp: Date.now(),
      };

      this.syncHistory.push(result);
      trackSyncAttempt(false);

      logger.error('Smart sync failed', error as Error, null, 'SmartSyncManager');

      emitEvent(EventType.OFFLINE_SYNC_FAILED, {
        source: 'SmartSyncManager',
        data: result,
      });

      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: OfflineData): Promise<boolean> {
    try {
      // Check retry limit
      const maxRetries = this.config?.sync?.maxRetries || 3;
      if (item.retryCount >= maxRetries) {
        logger.warn('Item exceeded retry limit', {
          id: item.id,
          retryCount: item.retryCount,
          maxRetries,
        }, 'SmartSyncManager');
        
        await updateSyncStatus(item.id, 'failed');
        return false;
      }

      // Simulate sync operation based on data type
      const success = await this.syncByType(item);
      
      if (success) {
        await updateSyncStatus(item.id, 'synced');
        logger.info('Item synced successfully', { id: item.id, type: item.type }, 'SmartSyncManager');
      } else {
        await updateSyncStatus(item.id, 'failed');
        logger.warn('Item sync failed', { id: item.id, type: item.type }, 'SmartSyncManager');
      }

      return success;

    } catch (error) {
      logger.error('Error syncing item', error as Error, { id: item.id }, 'SmartSyncManager');
      await updateSyncStatus(item.id, 'failed');
      return false;
    }
  }

  /**
   * Sync based on data type
   */
  private async syncByType(item: OfflineData): Promise<boolean> {
    switch (item.type) {
      case 'page':
        return this.syncPageData(item);
      case 'config':
        return this.syncConfigData(item);
      case 'analytics':
        return this.syncAnalyticsData(item);
      case 'user_data':
        return this.syncUserData(item);
      default:
        logger.warn('Unknown data type for sync', { type: item.type }, 'SmartSyncManager');
        return false;
    }
  }

  /**
   * Sync page data
   */
  private async syncPageData(item: OfflineData): Promise<boolean> {
    // Simulate page data sync
    await new Promise<void>(resolve => setTimeout(resolve, 100));
    return Math.random() > 0.1; // 90% success rate
  }

  /**
   * Sync config data
   */
  private async syncConfigData(item: OfflineData): Promise<boolean> {
    // Simulate config sync
    await new Promise<void>(resolve => setTimeout(resolve, 50));
    return Math.random() > 0.05; // 95% success rate
  }

  /**
   * Sync analytics data
   */
  private async syncAnalyticsData(item: OfflineData): Promise<boolean> {
    // Simulate analytics sync
    await new Promise<void>(resolve => setTimeout(resolve, 200));
    return Math.random() > 0.15; // 85% success rate
  }

  /**
   * Sync user data
   */
  private async syncUserData(item: OfflineData): Promise<boolean> {
    // Simulate user data sync
    await new Promise<void>(resolve => setTimeout(resolve, 150));
    return Math.random() > 0.08; // 92% success rate
  }

  /**
   * Add item to retry queue
   */
  addToRetryQueue(item: OfflineData): void {
    this.retryQueue.push(item);
    logger.info('Item added to retry queue', { id: item.id, queueSize: this.retryQueue.length }, 'SmartSyncManager');
  }

  /**
   * Process retry queue
   */
  async processRetryQueue(): Promise<void> {
    if (this.retryQueue.length === 0) return;

    logger.info('Processing retry queue', { queueSize: this.retryQueue.length }, 'SmartSyncManager');

    const items = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of items) {
      await this.syncItem(item);
      // Add delay between retries
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStatistics(): {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    successRate: number;
    averageSyncTime: number;
    lastSyncTime: number;
    queueSize: number;
  } {
    const totalSyncs = this.syncHistory.length;
    const successfulSyncs = this.syncHistory.filter(r => r.success).length;
    const failedSyncs = totalSyncs - successfulSyncs;
    const successRate = totalSyncs > 0 ? successfulSyncs / totalSyncs : 0;
    const averageSyncTime = this.syncHistory.length > 0 
      ? this.syncHistory.reduce((sum, r) => sum + (Date.now() - r.timestamp), 0) / totalSyncs 
      : 0;
    const lastSyncTime = this.syncHistory.length > 0 
      ? this.syncHistory[this.syncHistory.length - 1].timestamp 
      : 0;

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      successRate,
      averageSyncTime,
      lastSyncTime,
      queueSize: this.retryQueue.length,
    };
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get current configuration
   */
  getConfig(): OfflineConfig | null {
    return this.config;
  }

  /**
   * Check if smart sync is enabled
   */
  isEnabled(): boolean {
    return this.isInitialized && this.config?.enabled === true;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopAutoSync();
    this.retryQueue = [];
    this.syncHistory = [];
    this.isSyncing = false;
    this.isInitialized = false;
    
    logger.info('SmartSyncManager cleaned up', {}, 'SmartSyncManager');
  }
}

// Export singleton instance
export const smartSyncManager = SmartSyncManager.getInstance();

// Export convenience functions
export const initializeSmartSync = (config: OfflineConfig) => smartSyncManager.initialize(config);
export const startAutoSync = () => smartSyncManager.startAutoSync();
export const stopAutoSync = () => smartSyncManager.stopAutoSync();
export const performSync = () => smartSyncManager.performSync();
export const addToRetryQueue = (item: OfflineData) => smartSyncManager.addToRetryQueue(item);
export const processRetryQueue = () => smartSyncManager.processRetryQueue();
export const getSyncStatistics = () => smartSyncManager.getSyncStatistics();
export const isSyncInProgress = () => smartSyncManager.isSyncInProgress();
export const isSmartSyncEnabled = () => smartSyncManager.isEnabled();
export const cleanupSmartSync = () => smartSyncManager.cleanup();
