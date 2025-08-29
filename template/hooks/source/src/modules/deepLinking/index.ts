/**
 * Deep Linking Module Entry Point
 * 
 * This module provides deep linking and URL handling features.
 * All external access to deep linking functionality should go through this entry point.
 */

// Import types
import type { 
  DeepLinkData, 
  DeepLinkResult, 
  DeepLinkEvent, 
  DeepLinkHandler,
  DeepLinkConfig 
} from './types';

// Import constants
import { DeepLinkType, DeepLinkAction } from './types';

// Import the main feature class
import { DeepLinkingFeature, createDeepLinkingFeature } from './DeepLinkingFeature';

// Import utilities
import { DeepLinkingUtils } from './utils/DeepLinkingUtils';

// Re-export everything
export { DeepLinkingFeature, createDeepLinkingFeature, DeepLinkingUtils };
export { DeepLinkType, DeepLinkAction };
export type { 
  DeepLinkData, 
  DeepLinkResult, 
  DeepLinkEvent, 
  DeepLinkHandler,
  DeepLinkConfig 
};

// Export the module configuration interface
export interface DeepLinkingModuleConfig {
  enabled: boolean;
  enableEventListeners?: boolean;
  scheme?: string;
  allowedDomains?: string[];
  redirectToBrowser?: boolean;
  customScheme?: string;
  universalLinks?: {
    enabled: boolean;
    domains: string[];
  };
  customHandlers?: {
    onDeepLinkProcessed?: (result: DeepLinkResult) => void;
    onDeepLinkRedirected?: (url: string) => void;
  };
}

// Export the module interface
export interface DeepLinkingModule {
  initialize(): Promise<void>;
  deinitialize(): Promise<void>;
  processDeepLink(url: string, source?: string): Promise<DeepLinkResult>;
  isDeepLinkingEnabled(): boolean;
  getDeepLinkConfig(): DeepLinkConfig;
  addHandler(pattern: string, handler: DeepLinkHandler): void;
  removeHandler(pattern: string): void;
  isFeatureEnabled(): boolean;
}

// Default export for the module
export default {
  DeepLinkingFeature,
  createDeepLinkingFeature,
  DeepLinkingUtils,
};
