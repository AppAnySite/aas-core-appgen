/**
 * Security Module Types
 */

/**
 * Security event types
 */
export enum SecurityEventType {
  URL_VALIDATED = 'url_validated',
  THREAT_DETECTED = 'threat_detected',
  DOMAIN_BLOCKED = 'domain_blocked',
  HTTPS_VIOLATION = 'https_violation',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  DATA_LEAKAGE = 'data_leakage',
}

/**
 * Security levels
 */
export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  type: SecurityEventType;
  url: string;
  level: SecurityLevel;
  description: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Security rule interface
 */
export interface SecurityRule {
  name: string;
  description: string;
  validator: (url: string) => boolean;
  level: SecurityLevel;
  enabled: boolean;
}

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  isValid: boolean;
  threats: any[];
  warnings: string[];
  recommendations: string[];
  level: SecurityLevel;
  blockedDomains: string[];
  allowedDomains: string[];
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  enabled: boolean;
  validateUrls: boolean;
  blockedDomains: string[];
  allowedDomains: string[];
  httpsEnforcement: boolean;
  certificatePinning: boolean;
  customRules: SecurityRule[];
  threatDetection: {
    enabled: boolean;
    sensitivity: SecurityLevel;
  };
  logging: {
    enabled: boolean;
    level: SecurityLevel;
  };
}

/**
 * Threat information
 */
export interface ThreatInfo {
  type: string;
  severity: SecurityLevel;
  description: string;
  url: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Domain validation result
 */
export interface DomainValidationResult {
  domain: string;
  isValid: boolean;
  isBlocked: boolean;
  isAllowed: boolean;
  reason?: string;
}

/**
 * URL analysis result
 */
export interface URLAnalysisResult {
  url: string;
  isValid: boolean;
  protocol: string;
  hostname: string;
  pathname: string;
  threats: ThreatInfo[];
  warnings: string[];
  recommendations: string[];
  securityScore: number; // 0-100
}
