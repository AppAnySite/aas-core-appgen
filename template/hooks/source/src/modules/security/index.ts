/**
 * Security Module Entry Point
 * 
 * This module provides security validation and threat detection features.
 * All external access to security functionality should go through this entry point.
 */

// Import types
import type { 
  SecurityEvent, 
  SecurityRule, 
  SecurityConfig,
  SecurityValidationResult 
} from './types';

// Import constants
import { SecurityEventType, SecurityLevel } from './types';

// Import the main feature class
import { SecurityFeature, createSecurityFeature } from './SecurityFeature';

// Import utilities
import { SecurityUtils } from './utils/SecurityUtils';

// Import the security manager from core
import { securityManager, validateURL } from '../../core/SecurityManager';

// Re-export everything
export { SecurityFeature, createSecurityFeature, SecurityUtils, securityManager, validateURL };
export { SecurityEventType, SecurityLevel };
export type { 
  SecurityEvent, 
  SecurityRule, 
  SecurityConfig,
  SecurityValidationResult 
};

// Export the module configuration interface
export interface SecurityModuleConfig {
  enabled: boolean;
  validateUrls?: boolean;
  blockedDomains?: string[];
  allowedDomains?: string[];
  httpsEnforcement?: boolean;
  certificatePinning?: boolean;
  customRules?: Array<{
    name: string;
    validator: (url: string) => boolean;
  }>;
  customHandlers?: {
    onSecurityEvent?: (event: SecurityEvent) => void;
    onThreatDetected?: (threat: any) => void;
  };
}

// Export the module interface
export interface SecurityModule {
  initialize(): Promise<void>;
  deinitialize(): Promise<void>;
  validateUrl(url: string): SecurityValidationResult;
  addBlockedDomain(domain: string): void;
  removeBlockedDomain(domain: string): void;
  addAllowedDomain(domain: string): void;
  addSecurityRule(name: string, rule: (url: string) => boolean): void;
  getSecurityEvents(): SecurityEvent[];
  getSecurityReport(): string;
  isFeatureEnabled(): boolean;
}

// Default export for the module
export default {
  SecurityFeature: SecurityFeature,
  createSecurityFeature: createSecurityFeature,
  SecurityUtils: SecurityUtils,
  securityManager: securityManager,
};
