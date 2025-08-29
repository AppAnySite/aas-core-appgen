/**
 * Network Module Entry Point
 * 
 * This module provides network monitoring and connectivity features.
 * All external access to network functionality should go through this entry point.
 */

// Import types and constants
import type { NetworkState, NetworkConfig, NetworkEvent, NetworkEventType } from './types';
import { NetworkQuality, ConnectionType } from './types';

// Import the main feature class
import { NetworkFeature, createNetworkFeature } from './NetworkFeature';

// Import the network manager from core
import { networkManager } from '../../core/NetworkManager';

// Import utilities
import { NetworkUtils } from './utils/NetworkUtils';

// Re-export everything
export { NetworkFeature, createNetworkFeature, networkManager, NetworkUtils };
export { NetworkQuality, ConnectionType };
export type { NetworkState, NetworkEvent, NetworkEventType, NetworkConfig };

// Export the module configuration interface
export interface NetworkModuleConfig {
  enabled: boolean;
  enableEventListeners?: boolean;
  pingInterval?: number;
  qualityMonitoring?: boolean;
  connectionHistory?: boolean;
  customHandlers?: {
    onConnectionChange?: (state: NetworkState) => void;
    onQualityChange?: (quality: NetworkQuality) => void;
  };
}

// Export the module interface
export interface NetworkModule {
  initialize(): Promise<void>;
  deinitialize(): Promise<void>;
  getNetworkState(): NetworkState;
  isConnected(): boolean;
  getNetworkQuality(): NetworkQuality;
  startPingTest(): Promise<number>;
  getConnectionHistory(): NetworkState[];
  isFeatureEnabled(): boolean;
}

// Default export for the module
export default {
  NetworkFeature,
  createNetworkFeature,
  NetworkUtils,
  networkManager,
};
