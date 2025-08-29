import { OfflineData, OfflineAnalytics, SyncResult } from '../types';
import { logger } from '../utils/Logger';
import { eventBus, EventType, emitEvent } from './EventBus';

/**
 * OfflineStorageManager - Manages SQLite database for offline data
 * Simulates SQLite operations for React Native
 */
class OfflineStorageManager {
  private static instance: OfflineStorageManager;
  private database: Map<string, OfflineData> = new Map();
  private analytics: OfflineAnalytics = {
    totalItems: 0,
    pendingItems: 0,
    syncedItems: 0,
    failedItems: 0,
    lastSyncTime: 0,
    totalStorageUsed: 0,
    totalItemsStored: 0,
    totalItemsSynced: 0,
    totalSyncFailures: 0,
    averageSyncTime: 0,
    lastSyncTimestamp: 0,
    cachedPages: 0,
    offlineSessions: 0,
    offlineDuration: 0,
    syncAttempts: 0,
    syncSuccessRate: 0,
  };
  private isInitialized = false;
  private maxSize = 1000; // Maximum number of items in database

  private constructor() {}

  static getInstance(): OfflineStorageManager {
    if (!OfflineStorageManager.instance) {
      OfflineStorageManager.instance = new OfflineStorageManager();
    }
    return OfflineStorageManager.instance;
  }

  /**
   * Initialize the offline storage
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // In a real implementation, this would initialize SQLite
      // For now, we'll simulate the database setup
      await this.createTables();
      await this.loadAnalytics();
      
      this.isInitialized = true;
      
      logger.info('OfflineStorageManager initialized', {
        databaseSize: this.database.size,
        maxSize: this.maxSize,
      }, 'OfflineStorageManager');

      emitEvent(EventType.OFFLINE_STORAGE_INITIALIZED, {
        source: 'OfflineStorageManager',
        data: { databaseSize: this.database.size },
      });
    } catch (error) {
      logger.error('Failed to initialize offline storage', error as Error, null, 'OfflineStorageManager');
      throw error;
    }
  }

  /**
   * Create database tables (simulated)
   */
  private async createTables(): Promise<void> {
    // Simulate table creation
    logger.info('Creating offline storage tables', {}, 'OfflineStorageManager');
    
    // In real implementation, this would create SQLite tables
    // CREATE TABLE offline_data (id TEXT PRIMARY KEY, type TEXT, data TEXT, timestamp INTEGER, sync_status TEXT, retry_count INTEGER)
    // CREATE TABLE offline_analytics (key TEXT PRIMARY KEY, value TEXT)
  }

  /**
   * Store data for offline access
   */
  async storeData(data: Omit<OfflineData, 'id'>): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const id = this.generateId();
    const offlineData: OfflineData = {
      ...data,
      id,
    };

    // Check database size limit
    if (this.database.size >= this.maxSize) {
      await this.cleanupOldData();
    }

    this.database.set(id, offlineData);
    
    // Update analytics
    this.analytics.cachedPages = this.database.size;

    logger.info('Data stored for offline access', {
      id,
      type: data.type,
      timestamp: data.timestamp,
    }, 'OfflineStorageManager');

    emitEvent(EventType.OFFLINE_DATA_STORED, {
      source: 'OfflineStorageManager',
      data: offlineData,
    });

    return id;
  }

  /**
   * Retrieve data by ID
   */
  async getData(id: string): Promise<OfflineData | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const data = this.database.get(id);
    
    if (data) {
      logger.info('Data retrieved from offline storage', { id, type: data.type }, 'OfflineStorageManager');
    }

    return data || null;
  }

  /**
   * Get all data of a specific type
   */
  async getDataByType(type: OfflineData['type']): Promise<OfflineData[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const data = Array.from(this.database.values()).filter(item => item.type === type);
    
    logger.info('Data retrieved by type', { type, count: data.length }, 'OfflineStorageManager');
    
    return data;
  }

  /**
   * Get all pending sync data
   */
  async getPendingSyncData(): Promise<OfflineData[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const pendingData = Array.from(this.database.values()).filter(
      item => item.syncStatus === 'pending' || item.syncStatus === 'failed'
    );

    return pendingData;
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(id: string, status: OfflineData['syncStatus']): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const data = this.database.get(id);
    if (data) {
      data.syncStatus = status;
      if (status === 'failed') {
        data.retryCount += 1;
      }
      
      logger.info('Sync status updated', { id, status, retryCount: data.retryCount }, 'OfflineStorageManager');
    }
  }

  /**
   * Delete data by ID
   */
  async deleteData(id: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const deleted = this.database.delete(id);
    
    if (deleted) {
      this.analytics.cachedPages = this.database.size;
      logger.info('Data deleted from offline storage', { id }, 'OfflineStorageManager');
    }

    return deleted;
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.database.clear();
    this.analytics.cachedPages = 0;
    
    logger.info('All offline data cleared', {}, 'OfflineStorageManager');

    emitEvent(EventType.OFFLINE_DATA_CLEARED, {
      source: 'OfflineStorageManager',
      data: { clearedItems: this.database.size },
    });
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<{
    totalItems: number;
    pendingSync: number;
    failedSync: number;
    syncedItems: number;
    analytics: OfflineAnalytics;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const items = Array.from(this.database.values());
    const pendingSync = items.filter(item => item.syncStatus === 'pending').length;
    const failedSync = items.filter(item => item.syncStatus === 'failed').length;
    const syncedItems = items.filter(item => item.syncStatus === 'synced').length;

    return {
      totalItems: this.database.size,
      pendingSync,
      failedSync,
      syncedItems,
      analytics: { ...this.analytics },
    };
  }

  /**
   * Track offline session
   */
  trackOfflineSession(duration: number): void {
    this.analytics.offlineSessions += 1;
    this.analytics.offlineDuration += duration;
    
    logger.info('Offline session tracked', {
      sessionCount: this.analytics.offlineSessions,
      totalDuration: this.analytics.offlineDuration,
    }, 'OfflineStorageManager');
  }

  /**
   * Track sync attempt
   */
  trackSyncAttempt(success: boolean): void {
    this.analytics.syncAttempts += 1;
    this.analytics.lastSyncTime = Date.now();
    
    if (success) {
      const successRate = (this.analytics.syncSuccessRate * (this.analytics.syncAttempts - 1) + 1) / this.analytics.syncAttempts;
      this.analytics.syncSuccessRate = successRate;
    } else {
      const successRate = (this.analytics.syncSuccessRate * (this.analytics.syncAttempts - 1)) / this.analytics.syncAttempts;
      this.analytics.syncSuccessRate = successRate;
    }
  }

  /**
   * Load analytics from storage
   */
  private async loadAnalytics(): Promise<void> {
    // In real implementation, this would load from SQLite
    // For now, we'll use the default analytics object
  }

  /**
   * Save analytics to storage
   */
  private async saveAnalytics(): Promise<void> {
    // In real implementation, this would save to SQLite
    logger.info('Analytics saved', this.analytics, 'OfflineStorageManager');
  }

  /**
   * Clean up old data when database is full
   */
  private async cleanupOldData(): Promise<void> {
    const items = Array.from(this.database.entries());
    items.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10% of items
    const itemsToRemove = Math.ceil(this.maxSize * 0.1);
    for (let i = 0; i < itemsToRemove && i < items.length; i++) {
      this.database.delete(items[i][0]);
    }
    
    logger.info('Old data cleaned up', { removedItems: itemsToRemove }, 'OfflineStorageManager');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if storage is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current database size
   */
  getSize(): number {
    return this.database.size;
  }
}

// Export singleton instance
export const offlineStorageManager = OfflineStorageManager.getInstance();

// Export convenience functions
export const initializeOfflineStorage = () => offlineStorageManager.initialize();
export const storeOfflineData = (data: Omit<OfflineData, 'id'>) => offlineStorageManager.storeData(data);
export const getOfflineData = (id: string) => offlineStorageManager.getData(id);
export const getOfflineDataByType = (type: OfflineData['type']) => offlineStorageManager.getDataByType(type);
export const getPendingSyncData = () => offlineStorageManager.getPendingSyncData();
export const updateSyncStatus = (id: string, status: OfflineData['syncStatus']) => offlineStorageManager.updateSyncStatus(id, status);
export const deleteOfflineData = (id: string) => offlineStorageManager.deleteData(id);
export const clearAllOfflineData = () => offlineStorageManager.clearAllData();
export const getOfflineStatistics = () => offlineStorageManager.getStatistics();
export const trackOfflineSession = (duration: number) => offlineStorageManager.trackOfflineSession(duration);
export const trackSyncAttempt = (success: boolean) => offlineStorageManager.trackSyncAttempt(success);
export const isOfflineStorageReady = () => offlineStorageManager.isReady();
export const getOfflineStorageSize = () => offlineStorageManager.getSize();
