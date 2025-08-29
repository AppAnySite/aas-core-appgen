import { 
  DeepLinkType, 
  DeepLinkAction, 
  DeepLinkData, 
  DeepLinkResult, 
  URLParseResult,
  DeepLinkConfig 
} from '../types';
import { logger } from '../../../utils/Logger';

/**
 * Deep Linking Utilities
 * Provides helper functions for deep linking operations
 */
export class DeepLinkingUtils {
  /**
   * Parse URL and extract components
   */
  static parseURL(url: string): URLParseResult {
    try {
      // Use regex to parse URL components
      const urlRegex = /^(https?:\/\/)?([^\/\?#]+)([^\?#]*)(\?[^#]*)?(#.*)?$/;
      const match = url.match(urlRegex);
      
      if (!match) {
        return {
          protocol: '',
          hostname: '',
          pathname: '',
          search: '',
          hash: '',
          isValid: false,
        };
      }

      const [, protocol = '', hostname = '', pathname = '', search = '', hash = ''] = match;
      
      // Extract port from hostname if present
      const hostnameParts = hostname.split(':');
      const finalHostname = hostnameParts[0];
      const port = hostnameParts[1];

      return {
        protocol: protocol.replace('://', ''),
        hostname: finalHostname,
        pathname,
        search,
        hash,
        port,
        isValid: true,
      };
    } catch (error) {
      logger.error('Failed to parse URL', error as Error, { url }, 'DeepLinkingUtils');
      return {
        protocol: '',
        hostname: '',
        pathname: '',
        search: '',
        hash: '',
        isValid: false,
      };
    }
  }

  /**
   * Determine deep link type from URL
   */
  static getDeepLinkType(url: string): DeepLinkType {
    const parsed = this.parseURL(url);
    
    if (!parsed.isValid) {
      return DeepLinkType.UNKNOWN;
    }

    // Check for custom scheme
    if (parsed.protocol && !parsed.protocol.startsWith('http')) {
      return DeepLinkType.CUSTOM_SCHEME;
    }

    // Check for universal links (https)
    if (parsed.protocol === 'https') {
      return DeepLinkType.UNIVERSAL_LINK;
    }

    // Check for HTTP URLs
    if (parsed.protocol === 'http') {
      return DeepLinkType.HTTP_URL;
    }

    return DeepLinkType.UNKNOWN;
  }

  /**
   * Validate URL against allowed domains
   */
  static validateDomain(url: string, allowedDomains: string[]): boolean {
    const parsed = this.parseURL(url);
    
    if (!parsed.isValid || !parsed.hostname) {
      return false;
    }

    return allowedDomains.some(domain => {
      // Handle wildcard domains
      if (domain.startsWith('*.')) {
        const wildcardDomain = domain.slice(2);
        return parsed.hostname.endsWith(wildcardDomain) || 
               parsed.hostname === wildcardDomain;
      }
      
      return parsed.hostname === domain;
    });
  }

  /**
   * Check if URL matches a pattern
   */
  static matchesPattern(url: string, pattern: string): boolean {
    try {
      // Convert pattern to regex
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(url);
    } catch (error) {
      logger.error('Invalid pattern', error as Error, { pattern }, 'DeepLinkingUtils');
      return false;
    }
  }

  /**
   * Create deep link result
   */
  static createDeepLinkResult(
    url: string,
    action: DeepLinkAction,
    handled: boolean = true,
    reason: string = '',
    error?: string
  ): DeepLinkResult {
    return {
      handled,
      shouldOpenInApp: action === DeepLinkAction.OPEN_IN_APP,
      shouldRedirectToBrowser: action === DeepLinkAction.REDIRECT_TO_BROWSER,
      reason,
      url,
      action,
      error,
      timestamp: Date.now(),
    };
  }

  /**
   * Extract parameters from URL
   */
  static extractURLParams(url: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    try {
      const searchIndex = url.indexOf('?');
      if (searchIndex === -1) return params;

      const searchString = url.slice(searchIndex + 1);
      const hashIndex = searchString.indexOf('#');
      const queryString = hashIndex !== -1 ? searchString.slice(0, hashIndex) : searchString;

      const pairs = queryString.split('&');
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
          params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
      });
    } catch (error) {
      logger.error('Failed to extract URL params', error as Error, { url }, 'DeepLinkingUtils');
    }

    return params;
  }

  /**
   * Build URL with parameters
   */
  static buildURL(baseUrl: string, params: Record<string, string>): string {
    try {
      const url = new URL(baseUrl);
      
      Object.entries(params).forEach(([key, value]) => {
        // URLSearchParams.set is not available in React Native
        // We'll use a different approach
        const newUrl = new URL(url.toString());
        newUrl.searchParams.append(key, value);
        return newUrl.toString();
      });
      
      return url.toString();
    } catch (error) {
      logger.error('Failed to build URL', error as Error, { baseUrl, params }, 'DeepLinkingUtils');
      return baseUrl;
    }
  }

  /**
   * Sanitize URL for logging
   */
  static sanitizeURL(url: string): string {
    try {
      const parsed = this.parseURL(url);
      if (!parsed.isValid) return '[INVALID_URL]';

      // Remove sensitive parameters
      const sensitiveParams = ['token', 'password', 'key', 'secret', 'auth'];
      const params = this.extractURLParams(url);
      
      const sanitizedParams = Object.entries(params).map(([key, value]) => {
        if (sensitiveParams.includes(key.toLowerCase())) {
          return `${key}=[REDACTED]`;
        }
        return `${key}=${value}`;
      });

      const queryString = sanitizedParams.length > 0 ? `?${sanitizedParams.join('&')}` : '';
      
      return `${parsed.protocol}://${parsed.hostname}${parsed.pathname}${queryString}${parsed.hash}`;
    } catch (error) {
      return '[ERROR_PARSING_URL]';
    }
  }

  /**
   * Validate deep link configuration
   */
  static validateConfig(config: DeepLinkConfig): boolean {
    if (typeof config.enabled !== 'boolean') {
      logger.error('Invalid deep link config: enabled must be boolean', new Error('Invalid config'), 'DeepLinkingUtils');
      return false;
    }

    if (config.scheme && typeof config.scheme !== 'string') {
      logger.error('Invalid deep link config: scheme must be string', new Error('Invalid config'), 'DeepLinkingUtils');
      return false;
    }

    if (!Array.isArray(config.allowedDomains)) {
      logger.error('Invalid deep link config: allowedDomains must be array', new Error('Invalid config'), 'DeepLinkingUtils');
      return false;
    }

    return true;
  }

  /**
   * Get deep link type display name
   */
  static getDeepLinkTypeDisplayName(type: DeepLinkType): string {
    switch (type) {
      case DeepLinkType.CUSTOM_SCHEME:
        return 'Custom Scheme';
      case DeepLinkType.UNIVERSAL_LINK:
        return 'Universal Link';
      case DeepLinkType.HTTP_URL:
        return 'HTTP URL';
      case DeepLinkType.HTTPS_URL:
        return 'HTTPS URL';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get action display name
   */
  static getActionDisplayName(action: DeepLinkAction): string {
    switch (action) {
      case DeepLinkAction.OPEN_IN_APP:
        return 'Open in App';
      case DeepLinkAction.REDIRECT_TO_BROWSER:
        return 'Redirect to Browser';
      case DeepLinkAction.SHOW_ALERT:
        return 'Show Alert';
      case DeepLinkAction.IGNORE:
        return 'Ignore';
      case DeepLinkAction.CUSTOM:
        return 'Custom Action';
      default:
        return 'Unknown';
    }
  }

  /**
   * Check if URL is a valid deep link
   */
  static isValidDeepLink(url: string, config: DeepLinkConfig): boolean {
    if (!config.enabled) return false;

    const type = this.getDeepLinkType(url);
    
    // Custom scheme validation
    if (type === DeepLinkType.CUSTOM_SCHEME) {
      const parsed = this.parseURL(url);
      return parsed.protocol === config.scheme;
    }

    // Universal link validation
    if (type === DeepLinkType.UNIVERSAL_LINK) {
      return this.validateDomain(url, config.allowedDomains);
    }

    return false;
  }
}
