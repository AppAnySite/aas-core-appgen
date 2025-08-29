/**
 * Offline Module Types
 */

/**
 * Offline indicator position
 */
export enum OfflineIndicatorPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  CENTER = 'center',
}

/**
 * Offline indicator style
 */
export enum OfflineIndicatorStyle {
  BANNER = 'banner',
  TOAST = 'toast',
  MODAL = 'modal',
  INLINE = 'inline',
}

/**
 * Sync status
 */
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

/**
 * Offline indicator configuration
 */
export interface OfflineIndicatorConfig {
  enabled: boolean;
  position: OfflineIndicatorPosition;
  style: OfflineIndicatorStyle;
  autoHide: boolean;
  hideDelay: number;
  message?: string;
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  enabled: boolean;
  maxSize: number;
  cleanupInterval: number;
  encryptionEnabled: boolean;
}

/**
 * Offline state
 */
export interface OfflineState {
  isOffline: boolean;
  lastOnline: number;
  pendingActions: number;
  syncStatus: SyncStatus;
  storageUsage: number;
  timestamp: number;
}

/**
 * Offline event types
 */
export enum OfflineEventType {
  WENT_OFFLINE = 'went_offline',
  WENT_ONLINE = 'went_online',
  SYNC_STARTED = 'sync_started',
  SYNC_COMPLETED = 'sync_completed',
  SYNC_FAILED = 'sync_failed',
  STORAGE_FULL = 'storage_full',
}

/**
 * Offline event
 */
export interface OfflineEvent {
  type: OfflineEventType;
  timestamp: number;
  data?: any;
  metadata?: Record<string, any>;
}

/**
 * Offline configuration
 */
export interface OfflineConfig {
  enabled: boolean;
  indicator: OfflineIndicatorConfig;
  sync: SyncConfig;
  storage: StorageConfig;
}
