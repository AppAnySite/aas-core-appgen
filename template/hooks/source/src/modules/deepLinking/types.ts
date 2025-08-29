/**
 * Deep Linking Module Types
 */

/**
 * Deep link types
 */
export enum DeepLinkType {
  CUSTOM_SCHEME = 'custom_scheme',
  UNIVERSAL_LINK = 'universal_link',
  HTTP_URL = 'http_url',
  HTTPS_URL = 'https_url',
  UNKNOWN = 'unknown',
}

/**
 * Deep link actions
 */
export enum DeepLinkAction {
  OPEN_IN_APP = 'open_in_app',
  OPEN_IN_BROWSER = 'open_in_browser',
  REDIRECT_TO_BROWSER = 'redirect_to_browser',
  SHOW_ALERT = 'show_alert',
  NAVIGATE = 'navigate',
  EXECUTE_SCRIPT = 'execute_script',
  IGNORE = 'ignore',
  CUSTOM = 'custom',
}

/**
 * Deep link data interface
 */
export interface DeepLinkData {
  url: string;
  source: 'app' | 'external' | 'notification' | 'browser' | 'universal';
  timestamp: number;
  metadata?: Record<string, any>;
  referrer?: string;
  campaign?: string;
  medium?: string;
  sourceName?: string;
}

/**
 * Deep link result interface
 */
export interface DeepLinkResult {
  handled: boolean;
  shouldOpenInApp: boolean;
  shouldRedirectToBrowser: boolean;
  reason: string;
  url: string;
  action: DeepLinkAction;
  error?: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}

/**
 * Deep link event interface
 */
export interface DeepLinkEvent {
  type: 'processed' | 'redirected' | 'error';
  data: DeepLinkData;
  result: DeepLinkResult;
  timestamp: number;
}

/**
 * Deep link handler interface
 */
export interface DeepLinkHandler {
  pattern: string;
  priority: number;
  handler: (url: string, data: DeepLinkData) => Promise<DeepLinkResult>;
}

/**
 * Deep link configuration
 */
export interface DeepLinkConfig {
  enabled: boolean;
  scheme: string;
  allowedDomains: string[];
  redirectToBrowser: boolean;
  customScheme: string;
  universalLinks: {
    enabled: boolean;
    domains: string[];
  };
  security?: {
    validateUrls: boolean;
    blockSuspiciousUrls: boolean;
    requireHttps: boolean;
  };
  analytics?: {
    trackDeepLinks: boolean;
    trackConversion: boolean;
  };
}

/**
 * URL parsing result
 */
export interface URLParseResult {
  protocol: string;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  port?: string;
  isValid: boolean;
}

/**
 * Handler registration options
 */
export interface HandlerRegistration {
  pattern: string;
  priority?: number;
  description?: string;
}
