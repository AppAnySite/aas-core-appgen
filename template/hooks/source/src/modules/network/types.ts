/**
 * Network Module Types
 */

/**
 * Network connection types
 */
export enum ConnectionType {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
  VPN = 'vpn',
  NONE = 'none',
  UNKNOWN = 'unknown',
}

/**
 * Network quality levels
 */
export enum NetworkQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  UNKNOWN = 'unknown',
}

/**
 * Network event types
 */
export enum NetworkEventType {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  TYPE_CHANGED = 'type_changed',
  QUALITY_CHANGED = 'quality_changed',
  CONNECTION_RESTORED = 'connection_restored',
  EXPENSIVE_CONNECTION = 'expensive_connection',
  METERED_CONNECTION = 'metered_connection',
}

/**
 * Network state interface
 */
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: ConnectionType;
  quality: NetworkQuality;
  isExpensive: boolean;
  isMetered: boolean;
  strength?: number;
  ping?: number;
  timestamp: number;
}

/**
 * Network event interface
 */
export interface NetworkEvent {
  type: NetworkEventType;
  previousState?: NetworkState;
  currentState: NetworkState;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  enabled: boolean;
  enableEventListeners?: boolean;
  pingInterval?: number;
  qualityMonitoring?: boolean;
  connectionHistory?: boolean;
  maxHistorySize?: number;
  pingTimeout?: number;
  retryAttempts?: number;
}
