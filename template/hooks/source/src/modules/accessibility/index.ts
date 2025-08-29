/**
 * Accessibility Module Entry Point
 * 
 * This module provides accessibility features and support.
 * All external access to accessibility functionality should go through this entry point.
 */

// Import types and constants
import type { 
  AccessibilityState, 
  AccessibilityEvent, 
  AccessibilityAction,
  AccessibilityConfig,
} from './types';

// Define AccessibilityEventType locally since it's not in types
export enum AccessibilityEventType {
  FEATURE_CHANGED = 'feature_changed',
  ACTION_PERFORMED = 'action_performed',
  STATE_CHANGED = 'state_changed',
}

// Import the main feature class
import { AccessibilityFeature, createAccessibilityFeature } from './AccessibilityFeature';

// Import utilities
import { AccessibilityUtils } from './utils/AccessibilityUtils';

// Import the accessibility manager from core
import { accessibilityManager, initializeAccessibility } from '../../core/AccessibilityManager';

// Re-export everything
export { AccessibilityFeature, createAccessibilityFeature, AccessibilityUtils, accessibilityManager, initializeAccessibility };
export type { 
  AccessibilityState, 
  AccessibilityEvent, 
  AccessibilityAction,
  AccessibilityConfig 
};

// Export the module configuration interface
export interface AccessibilityModuleConfig {
  enabled: boolean;
  customActions?: Array<{
    name: string;
    label: string;
    hint?: string;
    action: () => void;
  }>;
  enableRecommendations?: boolean;
  autoDetectFeatures?: boolean;
  customHandlers?: {
    onAccessibilityEvent?: (event: AccessibilityEvent) => void;
    onFeatureChanged?: (feature: string, enabled: boolean) => void;
  };
}

// Export the module interface
export interface AccessibilityModule {
  initialize(): Promise<void>;
  deinitialize(): Promise<void>;
  isFeatureEnabled(feature: string): boolean;
  addAccessibilityAction(action: AccessibilityAction): void;
  removeAccessibilityAction(name: string): void;
  performAccessibilityAction(name: string): boolean;
  getAccessibilityRecommendations(): any[];
  getAccessibilityReport(): string;
  getAccessibilityState(): AccessibilityState;
  isFeatureEnabled(): boolean;
}

// Default export for the module
export default {
  AccessibilityFeature: AccessibilityFeature,
  createAccessibilityFeature: createAccessibilityFeature,
  AccessibilityUtils: AccessibilityUtils,
  accessibilityManager: accessibilityManager,
};
