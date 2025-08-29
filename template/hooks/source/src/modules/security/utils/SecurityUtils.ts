import { SecurityConfig, SecurityLevel, SecurityEventType, URLAnalysisResult, DomainValidationResult } from '../types';
import { logger } from '../../../utils/Logger';

/**
 * Security Utilities
 * Provides helper functions for security operations
 */
export class SecurityUtils {
  /**
   * Validate security configuration
   */
  static validateConfig(config: SecurityConfig): boolean {
    if (typeof config.enabled !== 'boolean') {
      logger.error('Invalid security config: enabled must be boolean', new Error('Invalid config'), 'SecurityUtils');
      return false;
    }

    if (typeof config.validateUrls !== 'boolean') {
      logger.error('Invalid security config: validateUrls must be boolean', new Error('Invalid config'), 'SecurityUtils');
      return false;
    }

    if (!Array.isArray(config.blockedDomains)) {
      logger.error('Invalid security config: blockedDomains must be array', new Error('Invalid config'), 'SecurityUtils');
      return false;
    }

    if (!Array.isArray(config.allowedDomains)) {
      logger.error('Invalid security config: allowedDomains must be array', new Error('Invalid config'), 'SecurityUtils');
      return false;
    }

    return true;
  }

  /**
   * Analyze URL for security threats
   */
  static analyzeURL(url: string): URLAnalysisResult {
    const threats: any[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Parse URL
      const urlRegex = /^(https?:\/\/)?([^\/\?#]+)([^\?#]*)(\?[^#]*)?(#.*)?$/;
      const match = url.match(urlRegex);
      
      if (!match) {
        threats.push({
          type: 'invalid_url',
          severity: SecurityLevel.CRITICAL,
          description: 'Invalid URL format',
          url,
          timestamp: Date.now(),
        });
        
        return {
          url,
          isValid: false,
          protocol: '',
          hostname: '',
          pathname: '',
          threats,
          warnings,
          recommendations,
          securityScore: 0,
        };
      }

      const [, protocol = '', hostname = '', pathname = '', search = '', hash = ''] = match;
      const finalProtocol = protocol.replace('://', '');
      const finalHostname = hostname.split(':')[0];

      // Check for HTTP (non-HTTPS)
      if (finalProtocol === 'http') {
        warnings.push('Using HTTP instead of HTTPS');
        recommendations.push('Use HTTPS for secure communication');
      }

      // Check for suspicious patterns
      if (this.containsSuspiciousPatterns(url)) {
        threats.push({
          type: 'suspicious_pattern',
          severity: SecurityLevel.HIGH,
          description: 'URL contains suspicious patterns',
          url,
          timestamp: Date.now(),
        });
      }

      // Check for data leakage patterns
      if (this.containsDataLeakagePatterns(url)) {
        threats.push({
          type: 'data_leakage',
          severity: SecurityLevel.CRITICAL,
          description: 'URL may contain sensitive data',
          url,
          timestamp: Date.now(),
        });
      }

      // Calculate security score
      const securityScore = this.calculateSecurityScore(threats, warnings, finalProtocol);

      return {
        url,
        isValid: true,
        protocol: finalProtocol,
        hostname: finalHostname,
        pathname,
        threats,
        warnings,
        recommendations,
        securityScore,
      };

    } catch (error) {
      logger.error('Failed to analyze URL', error as Error, { url }, 'SecurityUtils');
      
      return {
        url,
        isValid: false,
        protocol: '',
        hostname: '',
        pathname: '',
        threats: [{
          type: 'analysis_error',
          severity: SecurityLevel.CRITICAL,
          description: 'Failed to analyze URL',
          url,
          timestamp: Date.now(),
        }],
        warnings,
        recommendations: ['Check URL format and try again'],
        securityScore: 0,
      };
    }
  }

  /**
   * Validate domain
   */
  static validateDomain(domain: string, blockedDomains: string[], allowedDomains: string[]): DomainValidationResult {
    const isBlocked = blockedDomains.some(blocked => {
      if (blocked.startsWith('*.')) {
        const wildcardDomain = blocked.slice(2);
        return domain.endsWith(wildcardDomain) || domain === wildcardDomain;
      }
      return domain === blocked;
    });

    const isAllowed = allowedDomains.some(allowed => {
      if (allowed.startsWith('*.')) {
        const wildcardDomain = allowed.slice(2);
        return domain.endsWith(wildcardDomain) || domain === wildcardDomain;
      }
      return domain === allowed;
    });

    return {
      domain,
      isValid: !isBlocked && (allowedDomains.length === 0 || isAllowed),
      isBlocked,
      isAllowed,
      reason: isBlocked ? 'Domain is blocked' : (allowedDomains.length > 0 && !isAllowed ? 'Domain not in allowed list' : undefined),
    };
  }

  /**
   * Check for suspicious patterns in URL
   */
  private static containsSuspiciousPatterns(url: string): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /<script/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check for data leakage patterns in URL
   */
  private static containsDataLeakagePatterns(url: string): boolean {
    const leakagePatterns = [
      /password=/i,
      /token=/i,
      /key=/i,
      /secret=/i,
      /auth=/i,
      /api_key=/i,
      /private_key=/i,
    ];

    return leakagePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Calculate security score (0-100)
   */
  private static calculateSecurityScore(threats: any[], warnings: string[], protocol: string): number {
    let score = 100;

    // Deduct points for threats
    threats.forEach(threat => {
      switch (threat.severity) {
        case SecurityLevel.CRITICAL:
          score -= 40;
          break;
        case SecurityLevel.HIGH:
          score -= 25;
          break;
        case SecurityLevel.MEDIUM:
          score -= 15;
          break;
        case SecurityLevel.LOW:
          score -= 5;
          break;
      }
    });

    // Deduct points for warnings
    score -= warnings.length * 5;

    // Deduct points for HTTP
    if (protocol === 'http') {
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Get security level display name
   */
  static getSecurityLevelDisplayName(level: SecurityLevel): string {
    switch (level) {
      case SecurityLevel.LOW:
        return 'Low Risk';
      case SecurityLevel.MEDIUM:
        return 'Medium Risk';
      case SecurityLevel.HIGH:
        return 'High Risk';
      case SecurityLevel.CRITICAL:
        return 'Critical Risk';
      default:
        return 'Unknown Risk';
    }
  }

  /**
   * Get security level color
   */
  static getSecurityLevelColor(level: SecurityLevel): string {
    switch (level) {
      case SecurityLevel.LOW:
        return '#34C759'; // Green
      case SecurityLevel.MEDIUM:
        return '#FF9500'; // Orange
      case SecurityLevel.HIGH:
        return '#FF3B30'; // Red
      case SecurityLevel.CRITICAL:
        return '#FF0000'; // Bright Red
      default:
        return '#8E8E93'; // Gray
    }
  }

  /**
   * Sanitize URL for logging
   */
  static sanitizeURL(url: string): string {
    try {
      // Simple regex-based sanitization for sensitive parameters
      const sensitiveParams = ['password', 'token', 'key', 'secret', 'auth', 'api_key'];
      let sanitizedUrl = url;
      
      sensitiveParams.forEach(param => {
        const regex = new RegExp(`[?&]${param}=[^&]*`, 'gi');
        sanitizedUrl = sanitizedUrl.replace(regex, `&${param}=[REDACTED]`);
      });
      
      // Clean up any double ampersands
      sanitizedUrl = sanitizedUrl.replace(/&&/g, '&');
      sanitizedUrl = sanitizedUrl.replace(/\?&/, '?');
      
      return sanitizedUrl;
    } catch (error) {
      return '[INVALID_URL]';
    }
  }

  /**
   * Generate security report
   */
  static generateSecurityReport(
    totalUrls: number,
    blockedUrls: number,
    threats: any[],
    warnings: string[]
  ): string {
    const report = {
      summary: {
        totalUrls,
        blockedUrls,
        allowedUrls: totalUrls - blockedUrls,
        threatCount: threats.length,
        warningCount: warnings.length,
      },
      threats: threats.map(threat => ({
        type: threat.type,
        severity: threat.severity,
        description: threat.description,
        url: this.sanitizeURL(threat.url),
      })),
      warnings,
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(report, null, 2);
  }
}
