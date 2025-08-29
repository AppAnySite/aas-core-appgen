import { logger } from '../../../utils/Logger';
import { OfflineConfig, OfflineState, SyncStatus } from '../types';

/**
 * Offline Utilities
 * Provides helper functions for offline operations
 */
export class OfflineUtils {
  /**
   * Validate offline configuration
   */
  static validateConfig(config: OfflineConfig): boolean {
    if (typeof config.enabled !== 'boolean') {
      logger.error('Invalid offline config: enabled must be boolean', new Error('Invalid config'), 'OfflineUtils');
      return false;
    }

    if (config.indicator && typeof config.indicator.enabled !== 'boolean') {
      logger.error('Invalid offline config: indicator.enabled must be boolean', new Error('Invalid config'), 'OfflineUtils');
      return false;
    }

    if (config.sync && typeof config.sync.enabled !== 'boolean') {
      logger.error('Invalid offline config: sync.enabled must be boolean', new Error('Invalid config'), 'OfflineUtils');
      return false;
    }

    return true;
  }

  /**
   * Check if device is offline
   */
  static async isOffline(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD'
      });
      return !response.ok;
    } catch {
      return true;
    }
  }

  /**
   * Get offline state summary
   */
  static getOfflineStateSummary(state: OfflineState): string {
    if (state.isOffline) {
      return 'Offline';
    }
    
    if (state.pendingActions > 0) {
      return `${state.pendingActions} pending actions`;
    }
    
    return 'Online';
  }

  /**
   * Format sync status for display
   */
  static formatSyncStatus(status: SyncStatus): string {
    switch (status) {
      case SyncStatus.IDLE:
        return 'Idle';
      case SyncStatus.SYNCING:
        return 'Syncing...';
      case SyncStatus.SUCCESS:
        return 'Synced';
      case SyncStatus.FAILED:
        return 'Sync Failed';
      case SyncStatus.RETRYING:
        return 'Retrying...';
      default:
        return 'Unknown';
    }
  }

  /**
   * Calculate storage usage percentage
   */
  static calculateStorageUsage(current: number, max: number): number {
    if (max <= 0) return 0;
    return Math.round((current / max) * 100);
  }

  /**
   * Check if storage is full
   */
  static isStorageFull(current: number, max: number): boolean {
    return this.calculateStorageUsage(current, max) >= 90;
  }
}
