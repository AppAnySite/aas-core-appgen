import { logger } from '../utils/Logger';
import { eventBus, EventType, emitEvent } from './EventBus';

/**
 * Security threat levels
 */
export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security event types
 */
export enum SecurityEventType {
  URL_VALIDATION_FAILED = 'url_validation_failed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  CERTIFICATE_ERROR = 'certificate_error',
  CONTENT_INJECTION = 'content_injection',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_LEAKAGE = 'data_leakage',
  MALWARE_DETECTED = 'malware_detected',
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  type: SecurityEventType;
  threatLevel: ThreatLevel;
  description: string;
  timestamp: number;
  source: string;
  data?: any;
  metadata?: Record<string, any>;
}

/**
 * URL validation result
 */
export interface URLValidationResult {
  isValid: boolean;
  threats: SecurityEvent[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Advanced Security Manager with threat detection and prevention
 */
class SecurityManager {
  private static instance: SecurityManager;
  private securityEvents: SecurityEvent[] = [];
  private blockedDomains: Set<string> = new Set();
  private allowedDomains: Set<string> = new Set();
  private securityRules: Map<string, (url: string) => boolean> = new Map();
  private isEnabled: boolean = true;
  private maxEvents: number = 1000;
  private threatCallbacks: Array<(event: SecurityEvent) => void> = [];

  private constructor() {
    this.setupDefaultSecurityRules();
    this.setupEventListeners();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Validate URL for security threats
   */
  public validateURL(url: string): URLValidationResult {
    const threats: SecurityEvent[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      const urlMatch = url.match(/^https?:\/\/([^\/]+)/);
      if (!urlMatch) {
        const threat: SecurityEvent = {
          type: SecurityEventType.URL_VALIDATION_FAILED,
          threatLevel: ThreatLevel.HIGH,
          description: `Invalid URL format: ${url}`,
          timestamp: Date.now(),
          source: 'SecurityManager',
          data: { url, error: 'Invalid URL format' },
        };
        threats.push(threat);
        recommendations.push('Ensure URL is properly formatted');
        return { isValid: false, threats, warnings, recommendations };
      }
      
      const domain = urlMatch[1].toLowerCase();

      // Check if domain is blocked
      if (this.blockedDomains.has(domain)) {
        const threat: SecurityEvent = {
          type: SecurityEventType.UNAUTHORIZED_ACCESS,
          threatLevel: ThreatLevel.HIGH,
          description: `Access to blocked domain: ${domain}`,
          timestamp: Date.now(),
          source: 'SecurityManager',
          data: { url, domain },
        };
        threats.push(threat);
        recommendations.push('Domain is blocked for security reasons');
      }

      // Check for suspicious patterns
      if (this.detectSuspiciousPatterns(url)) {
        const threat: SecurityEvent = {
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          threatLevel: ThreatLevel.MEDIUM,
          description: `Suspicious URL pattern detected: ${url}`,
          timestamp: Date.now(),
          source: 'SecurityManager',
          data: { url, patterns: this.getSuspiciousPatterns(url) },
        };
        threats.push(threat);
        warnings.push('URL contains suspicious patterns');
      }

      // Check for data leakage
      if (this.detectDataLeakage(url)) {
        const threat: SecurityEvent = {
          type: SecurityEventType.DATA_LEAKAGE,
          threatLevel: ThreatLevel.CRITICAL,
          description: `Potential data leakage detected in URL: ${url}`,
          timestamp: Date.now(),
          source: 'SecurityManager',
          data: { url, leakedData: this.extractSensitiveData(url) },
        };
        threats.push(threat);
        recommendations.push('Remove sensitive data from URL');
      }

      // Check protocol security
      const protocol = url.startsWith('https://') ? 'https:' : url.startsWith('http://') ? 'http:' : 'unknown';
      if (protocol === 'unknown') {
        const threat: SecurityEvent = {
          type: SecurityEventType.URL_VALIDATION_FAILED,
          threatLevel: ThreatLevel.HIGH,
          description: `Unsupported protocol: ${protocol}`,
          timestamp: Date.now(),
          source: 'SecurityManager',
          data: { url, protocol },
        };
        threats.push(threat);
        recommendations.push('Use HTTPS protocol for security');
      }

      // Apply custom security rules
      for (const [ruleName, rule] of Array.from(this.securityRules.entries())) {
        if (!rule(url)) {
          const threat: SecurityEvent = {
            type: SecurityEventType.URL_VALIDATION_FAILED,
            threatLevel: ThreatLevel.MEDIUM,
            description: `Failed security rule: ${ruleName}`,
            timestamp: Date.now(),
            source: 'SecurityManager',
            data: { url, rule: ruleName },
          };
          threats.push(threat);
          warnings.push(`Failed security rule: ${ruleName}`);
        }
      }

    } catch (error) {
      const threat: SecurityEvent = {
        type: SecurityEventType.URL_VALIDATION_FAILED,
        threatLevel: ThreatLevel.HIGH,
        description: `Invalid URL format: ${url}`,
        timestamp: Date.now(),
        source: 'SecurityManager',
        data: { url, error: error instanceof Error ? error.message : 'Unknown error' },
      };
      threats.push(threat);
      recommendations.push('Ensure URL is properly formatted');
    }

    const isValid = threats.length === 0;

    // Log security events
    threats.forEach(threat => this.recordSecurityEvent(threat));

    return {
      isValid,
      threats,
      warnings,
      recommendations,
    };
  }

  /**
   * Detect suspicious patterns in URL
   */
  private detectSuspiciousPatterns(url: string): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /<script/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i,
      /alert\s*\(/i,
      /confirm\s*\(/i,
      /prompt\s*\(/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Get suspicious patterns found in URL
   */
  private getSuspiciousPatterns(url: string): string[] {
    const patterns = [
      { pattern: /javascript:/i, name: 'JavaScript protocol' },
      { pattern: /data:/i, name: 'Data protocol' },
      { pattern: /vbscript:/i, name: 'VBScript protocol' },
      { pattern: /on\w+\s*=/i, name: 'Event handler' },
      { pattern: /<script/i, name: 'Script tag' },
      { pattern: /eval\s*\(/i, name: 'Eval function' },
      { pattern: /document\./i, name: 'Document object access' },
      { pattern: /window\./i, name: 'Window object access' },
      { pattern: /alert\s*\(/i, name: 'Alert function' },
      { pattern: /confirm\s*\(/i, name: 'Confirm function' },
      { pattern: /prompt\s*\(/i, name: 'Prompt function' },
    ];

    return patterns
      .filter(({ pattern }) => pattern.test(url))
      .map(({ name }) => name);
  }

  /**
   * Detect potential data leakage in URL
   */
  private detectDataLeakage(url: string): boolean {
    const sensitivePatterns = [
      /password\s*=/i,
      /token\s*=/i,
      /key\s*=/i,
      /secret\s*=/i,
      /api_key\s*=/i,
      /access_token\s*=/i,
      /refresh_token\s*=/i,
      /session_id\s*=/i,
      /user_id\s*=/i,
      /email\s*=/i,
      /phone\s*=/i,
      /ssn\s*=/i,
      /credit_card\s*=/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Extract sensitive data from URL
   */
  private extractSensitiveData(url: string): string[] {
    const sensitivePatterns = [
      { pattern: /password\s*=\s*([^&]+)/i, name: 'Password' },
      { pattern: /token\s*=\s*([^&]+)/i, name: 'Token' },
      { pattern: /key\s*=\s*([^&]+)/i, name: 'Key' },
      { pattern: /secret\s*=\s*([^&]+)/i, name: 'Secret' },
      { pattern: /api_key\s*=\s*([^&]+)/i, name: 'API Key' },
      { pattern: /access_token\s*=\s*([^&]+)/i, name: 'Access Token' },
      { pattern: /refresh_token\s*=\s*([^&]+)/i, name: 'Refresh Token' },
      { pattern: /session_id\s*=\s*([^&]+)/i, name: 'Session ID' },
      { pattern: /user_id\s*=\s*([^&]+)/i, name: 'User ID' },
      { pattern: /email\s*=\s*([^&]+)/i, name: 'Email' },
      { pattern: /phone\s*=\s*([^&]+)/i, name: 'Phone' },
      { pattern: /ssn\s*=\s*([^&]+)/i, name: 'SSN' },
      { pattern: /credit_card\s*=\s*([^&]+)/i, name: 'Credit Card' },
    ];

    return sensitivePatterns
      .filter(({ pattern }) => pattern.test(url))
      .map(({ name }) => name);
  }

  /**
   * Add blocked domain
   */
  public addBlockedDomain(domain: string): void {
    this.blockedDomains.add(domain.toLowerCase());
    logger.info(`Domain blocked: ${domain}`, null, 'SecurityManager');
  }

  /**
   * Remove blocked domain
   */
  public removeBlockedDomain(domain: string): void {
    this.blockedDomains.delete(domain.toLowerCase());
    logger.info(`Domain unblocked: ${domain}`, null, 'SecurityManager');
  }

  /**
   * Add allowed domain
   */
  public addAllowedDomain(domain: string): void {
    this.allowedDomains.add(domain.toLowerCase());
    logger.info(`Domain allowed: ${domain}`, null, 'SecurityManager');
  }

  /**
   * Add custom security rule
   */
  public addSecurityRule(name: string, rule: (url: string) => boolean): void {
    this.securityRules.set(name, rule);
    logger.info(`Security rule added: ${name}`, null, 'SecurityManager');
  }

  /**
   * Record security event
   */
  public recordSecurityEvent(event: SecurityEvent): void {
    if (!this.isEnabled) return;

    this.securityEvents.push(event);
    
    // Keep only the latest events
    if (this.securityEvents.length > this.maxEvents) {
      this.securityEvents.shift();
    }

    // Notify threat callbacks
    this.threatCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('Error in security threat callback', error as Error, null, 'SecurityManager');
      }
    });

    // Log based on threat level
    switch (event.threatLevel) {
      case ThreatLevel.LOW:
        logger.info(`Security event: ${event.description}`, event, 'SecurityManager');
        break;
      case ThreatLevel.MEDIUM:
        logger.warn(`Security warning: ${event.description}`, event, 'SecurityManager');
        break;
      case ThreatLevel.HIGH:
      case ThreatLevel.CRITICAL:
        logger.error(`Security threat: ${event.description}`, new Error(event.description), event, 'SecurityManager');
        break;
    }

    // Emit event
    emitEvent(EventType.ERROR_REPORTED, {
      source: 'SecurityManager',
      data: event,
    });
  }

  /**
   * Add threat callback
   */
  public onThreat(callback: (event: SecurityEvent) => void): void {
    this.threatCallbacks.push(callback);
  }

  /**
   * Get security events
   */
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  /**
   * Get security events by threat level
   */
  public getSecurityEventsByThreatLevel(level: ThreatLevel): SecurityEvent[] {
    return this.securityEvents.filter(event => event.threatLevel === level);
  }

  /**
   * Clear security events
   */
  public clearSecurityEvents(): void {
    this.securityEvents = [];
    logger.info('Security events cleared', null, 'SecurityManager');
  }

  /**
   * Enable/disable security manager
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.info(`Security manager ${enabled ? 'enabled' : 'disabled'}`, null, 'SecurityManager');
  }

  /**
   * Setup default security rules with enhanced protection
   */
  private setupDefaultSecurityRules(): void {
    // HTTPS enforcement rule
    this.addSecurityRule('https_enforcement', (url) => {
      return url.startsWith('https://') || url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1');
    });

    // Domain validation rule
    this.addSecurityRule('domain_validation', (url) => {
      try {
        const urlMatch = url.match(/^https?:\/\/([^\/]+)/);
        if (!urlMatch) return false;
        const hostname = urlMatch[1];
        return hostname.length > 0 && hostname.length <= 253;
      } catch {
        return false;
      }
    });

    // Port validation rule
    this.addSecurityRule('port_validation', (url) => {
      try {
        const urlMatch = url.match(/^https?:\/\/[^:]+:(\d+)/);
        if (!urlMatch) return true; // No port specified, use default
        const portNum = parseInt(urlMatch[1], 10);
        return portNum >= 1 && portNum <= 65535;
      } catch {
        return false;
      }
    });

    // IP address validation rule
    this.addSecurityRule('ip_validation', (url) => {
      try {
        const urlMatch = url.match(/^https?:\/\/([^\/]+)/);
        if (!urlMatch) return false;
        const hostname = urlMatch[1];
        
        // Allow localhost and private IP ranges
        if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
        
        // Block private IP ranges in production
        const privateIPRanges = [
          /^10\./,
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
          /^192\.168\./,
        ];
        
        if (privateIPRanges.some(range => range.test(hostname))) {
          return false; // Block private IPs
        }
        
        return true;
      } catch {
        return false;
      }
    });

    // Content type validation rule
    this.addSecurityRule('content_type_validation', (url) => {
      const dangerousExtensions = [
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.apk'
      ];
      return !dangerousExtensions.some(ext => url.toLowerCase().includes(ext));
    });

    // URL length validation rule
    this.addSecurityRule('url_length_validation', (url) => {
      return url.length <= 2048; // Reasonable URL length limit
    });

    // Special character validation rule
    this.addSecurityRule('special_char_validation', (url) => {
      const dangerousChars = ['<', '>', '"', "'", '&', 'script', 'javascript', 'vbscript'];
      return !dangerousChars.some(char => url.toLowerCase().includes(char));
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Monitor WebView navigation
    eventBus.addListener(EventType.WEBVIEW_NAVIGATION, (payload) => {
      if (payload.data?.url) {
        const validation = this.validateURL(payload.data.url);
        if (!validation.isValid) {
          logger.warn('WebView navigation blocked due to security concerns', validation, 'SecurityManager');
        }
      }
    });
  }

  /**
   * Export security report
   */
  public exportSecurityReport(): string {
    const report = {
      summary: {
        totalEvents: this.securityEvents.length,
        byThreatLevel: Object.values(ThreatLevel).reduce((acc, level) => {
          acc[level] = this.getSecurityEventsByThreatLevel(level).length;
          return acc;
        }, {} as Record<ThreatLevel, number>),
        blockedDomains: Array.from(this.blockedDomains),
        allowedDomains: Array.from(this.allowedDomains),
        securityRules: Array.from(this.securityRules.keys()),
      },
      recentEvents: this.securityEvents.slice(-50), // Last 50 events
      recommendations: this.generateSecurityRecommendations(),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(): string[] {
    const recommendations: string[] = [];

    const criticalEvents = this.getSecurityEventsByThreatLevel(ThreatLevel.CRITICAL);
    if (criticalEvents.length > 0) {
      recommendations.push('Immediate action required: Critical security threats detected');
    }

    const highEvents = this.getSecurityEventsByThreatLevel(ThreatLevel.HIGH);
    if (highEvents.length > 5) {
      recommendations.push('High number of high-threat events: Review security policies');
    }

    if (this.blockedDomains.size === 0) {
      recommendations.push('Consider adding domain blocking for enhanced security');
    }

    return recommendations;
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();

// Export convenience functions
export const validateURL = (url: string): URLValidationResult => {
  return securityManager.validateURL(url);
};

export const addBlockedDomain = (domain: string) => {
  securityManager.addBlockedDomain(domain);
};

export const addSecurityRule = (name: string, rule: (url: string) => boolean) => {
  securityManager.addSecurityRule(name, rule);
};

export const onSecurityThreat = (callback: (event: SecurityEvent) => void) => {
  securityManager.onThreat(callback);
};
