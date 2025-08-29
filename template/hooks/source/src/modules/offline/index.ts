/**
 * Offline Module Entry Point
 * 
 * This module provides offline support and synchronization features.
 * All external access to offline functionality should go through this entry point.
 */

// Import types and constants
import type { OfflineConfig, OfflineState, OfflineEvent, OfflineIndicatorConfig, SyncConfig, StorageConfig } from './types';
import { SyncStatus, OfflineIndicatorPosition, OfflineIndicatorStyle, OfflineEventType } from './types';

// Import the main feature class
import { OfflineFeature, createOfflineFeature } from './OfflineFeature';

// Import utilities
import { OfflineUtils } from './utils/OfflineUtils';

// Re-export everything
export { OfflineFeature, createOfflineFeature, OfflineUtils };
export { SyncStatus, OfflineIndicatorPosition, OfflineIndicatorStyle, OfflineEventType };
export type { OfflineConfig, OfflineState, OfflineEvent, OfflineIndicatorConfig, SyncConfig, StorageConfig };

// Export the module configuration interface
export interface OfflineModuleConfig {
  enabled: boolean;
  indicator?: {
    enabled?: boolean;
    position?: OfflineIndicatorPosition;
    style?: OfflineIndicatorStyle;
    autoHide?: boolean;
    hideDelay?: number;
  };
  sync?: {
    enabled?: boolean;
    autoSync?: boolean;
    syncInterval?: number;
    maxRetries?: number;
  };
  storage?: {
    enabled?: boolean;
    maxSize?: number;
    cleanupInterval?: number;
  };
}

// Export the module interface
export interface OfflineModule {
  initialize(): Promise<void>;
  deinitialize(): Promise<void>;
  getOfflineState(): OfflineState;
  isOffline(): boolean;
  getSyncStatus(): SyncStatus;
  getStorageUsage(): number;
  isFeatureEnabled(): boolean;
}

// Default export for the module
export default {
  OfflineFeature: OfflineFeature,
  createOfflineFeature: createOfflineFeature,
  OfflineUtils: OfflineUtils,
};
