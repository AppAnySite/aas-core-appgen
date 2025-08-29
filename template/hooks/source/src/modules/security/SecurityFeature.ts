import { Feature, FeatureStatus } from '../../core/FeatureManager';
import { securityManager, validateURL } from '../../core/SecurityManager';
import { 
  SecurityConfig, 
  SecurityEvent, 
  SecurityEventType, 
  SecurityLevel,
  SecurityValidationResult,
  SecurityRule 
} from './types';
import { SecurityUtils } from './utils/SecurityUtils';
import { logger } from '../../utils/Logger';
import { eventBus, EventType, emitEvent } from '../../core/EventBus';

/**
 * Security Feature Implementation
 * Modular feature that can be independently controlled
 */
export class SecurityFeature implements Feature {
  public id = 'security';
  public name = 'Security Manager';
  public version = '1.0.0';
  public status: FeatureStatus = FeatureStatus.DISABLED;
  public dependencies: string[] = [];
  public config: SecurityConfig;

  private securityEvents: SecurityEvent[] = [];
  private eventCallbacks: Array<(event: SecurityEvent) => void> = [];

  constructor(config: SecurityConfig) {
    const defaultConfig: SecurityConfig = {
      enabled: true,
      validateUrls: true,
      blockedDomains: [],
      allowedDomains: [],
      httpsEnforcement: true,
      certificatePinning: false,
      customRules: [],
      threatDetection: {
        enabled: true,
        sensitivity: SecurityLevel.MEDIUM,
      },
      logging: {
        enabled: true,
        level: SecurityLevel.MEDIUM,
      },
    };
    
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Initialize the security feature
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Security Feature', this.config, 'SecurityFeature');
      
      // Validate configuration
      if (!SecurityUtils.validateConfig(this.config)) {
        throw new Error('Invalid security configuration');
      }

      // Configure security manager with settings
      if (this.config.validateUrls !== false) {
        securityManager.setEnabled(true);
      }
      
      // Set up blocked domains if configured
      if (this.config.blockedDomains && Array.isArray(this.config.blockedDomains)) {
        this.config.blockedDomains.forEach((domain: string) => {
          securityManager.addBlockedDomain(domain);
        });
      }
      
      // Set up allowed domains if configured
      if (this.config.allowedDomains && Array.isArray(this.config.allowedDomains)) {
        this.config.allowedDomains.forEach((domain: string) => {
          securityManager.addAllowedDomain(domain);
        });
      }
      
      // Set up custom security rules if configured
      if (this.config.customRules && Array.isArray(this.config.customRules)) {
        this.config.customRules.forEach((rule: SecurityRule) => {
          if (rule.name && rule.validator) {
            securityManager.addSecurityRule(rule.name, rule.validator);
          }
        });
      }
      
      logger.info('Security Feature initialized successfully', null, 'SecurityFeature');
      
    } catch (error) {
      logger.error('Failed to initialize Security Feature', error as Error, null, 'SecurityFeature');
      throw error;
    }
  }

  /**
   * Deinitialize the security feature
   */
  public async deinitialize(): Promise<void> {
    try {
      logger.info('Deinitializing Security Feature', null, 'SecurityFeature');
      
      // Disable security manager
      securityManager.setEnabled(false);
      
      // Clear security events
      securityManager.clearSecurityEvents();
      
      // Clear event callbacks
      this.eventCallbacks = [];
      
      logger.info('Security Feature deinitialized successfully', null, 'SecurityFeature');
      
    } catch (error) {
      logger.error('Failed to deinitialize Security Feature', error as Error, null, 'SecurityFeature');
      throw error;
    }
  }

  /**
   * Check if feature is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled !== false;
  }

  /**
   * Get current status
   */
  public getStatus(): FeatureStatus {
    return this.status;
  }

  /**
   * Get feature configuration
   */
  public getConfig(): SecurityConfig {
    return this.config;
  }

  /**
   * Get feature dependencies
   */
  public getDependencies(): string[] {
    return this.dependencies;
  }

  /**
   * Validate a URL for security threats
   */
  public validateUrl(url: string): SecurityValidationResult {
    if (!this.isEnabled()) {
      logger.warn('Security Feature is disabled', { url }, 'SecurityFeature');
      return {
        isValid: true,
        threats: [],
        warnings: [],
        recommendations: [],
        level: SecurityLevel.LOW,
        blockedDomains: [],
        allowedDomains: [],
      };
    }

    try {
      const validation = validateURL(url);
      
      // Convert to our SecurityValidationResult format
      const result: SecurityValidationResult = {
        isValid: validation.isValid,
        threats: validation.threats || [],
        warnings: validation.warnings || [],
        recommendations: validation.recommendations || [],
        level: this.determineSecurityLevel(validation.threats || []),
        blockedDomains: this.config.blockedDomains,
        allowedDomains: this.config.allowedDomains,
      };

      // Log security event
      this.logSecurityEvent(SecurityEventType.URL_VALIDATED, url, result.level, 
        `URL validation completed: ${result.isValid ? 'PASSED' : 'FAILED'}`);

      return result;
    } catch (error) {
      logger.error('Failed to validate URL', error as Error, { url }, 'SecurityFeature');
      return {
        isValid: false,
        threats: ['Validation failed'],
        warnings: [],
        recommendations: ['Check URL format and try again'],
        level: SecurityLevel.CRITICAL,
        blockedDomains: [],
        allowedDomains: [],
      };
    }
  }

  /**
   * Add blocked domain
   */
  public addBlockedDomain(domain: string): void {
    if (this.isEnabled()) {
      securityManager.addBlockedDomain(domain);
      this.config.blockedDomains.push(domain);
      
      this.logSecurityEvent(SecurityEventType.DOMAIN_BLOCKED, domain, SecurityLevel.HIGH,
        `Domain added to blocked list: ${domain}`);
    }
  }

  /**
   * Remove blocked domain
   */
  public removeBlockedDomain(domain: string): void {
    if (this.isEnabled()) {
      securityManager.removeBlockedDomain(domain);
      this.config.blockedDomains = this.config.blockedDomains.filter(d => d !== domain);
      
      logger.info(`Domain removed from blocked list: ${domain}`, null, 'SecurityFeature');
    }
  }

  /**
   * Add allowed domain
   */
  public addAllowedDomain(domain: string): void {
    if (this.isEnabled()) {
      securityManager.addAllowedDomain(domain);
      this.config.allowedDomains.push(domain);
      
      logger.info(`Domain added to allowed list: ${domain}`, null, 'SecurityFeature');
    }
  }

  /**
   * Add custom security rule
   */
  public addSecurityRule(name: string, rule: (url: string) => boolean): void {
    if (this.isEnabled()) {
      securityManager.addSecurityRule(name, rule);
      
      const securityRule: SecurityRule = {
        name,
        description: `Custom rule: ${name}`,
        validator: rule,
        level: SecurityLevel.MEDIUM,
        enabled: true,
      };
      
      this.config.customRules.push(securityRule);
      
      logger.info(`Custom security rule added: ${name}`, null, 'SecurityFeature');
    }
  }

  /**
   * Get security events
   */
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  /**
   * Get security report
   */
  public getSecurityReport(): string {
    return securityManager.exportSecurityReport();
  }

  /**
   * Add security event listener
   */
  public onSecurityEvent(callback: (event: SecurityEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Remove security event listener
   */
  public removeSecurityEventListener(callback: (event: SecurityEvent) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * Determine security level based on threats
   */
  private determineSecurityLevel(threats: any[]): SecurityLevel {
    if (threats.length === 0) return SecurityLevel.LOW;
    if (threats.length <= 2) return SecurityLevel.MEDIUM;
    if (threats.length <= 5) return SecurityLevel.HIGH;
    return SecurityLevel.CRITICAL;
  }

  /**
   * Log security event
   */
  private logSecurityEvent(
    type: SecurityEventType,
    url: string,
    level: SecurityLevel,
    description: string,
    metadata?: Record<string, any>
  ): void {
    const event: SecurityEvent = {
      type,
      url,
      level,
      description,
      timestamp: Date.now(),
      metadata,
    };

    this.securityEvents.push(event);
    
    // Keep only recent events
    if (this.securityEvents.length > 100) {
      this.securityEvents.shift();
    }

    // Notify callbacks
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('Error in security event callback', error as Error, null, 'SecurityFeature');
      }
    });

    // Emit global event
    emitEvent(EventType.APP_ERROR, {
      source: 'SecurityFeature',
      data: event,
    });
  }
}

// Export factory function for easy creation
export const createSecurityFeature = (config: SecurityConfig): SecurityFeature => {
  return new SecurityFeature(config);
};
