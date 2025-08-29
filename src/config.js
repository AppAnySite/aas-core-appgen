/**
 * High-Performance Configuration
 * 
 * Optimized configuration with environment-based settings
 * for maximum performance in production.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

export default {
    // Logging configuration
    logLevel: process.env.LOG_LEVEL || 'info',
    
    // Performance configuration
    cacheEnabled: process.env.CACHE_ENABLED !== 'false',
    maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE) || 100,
    
    // Timeout configuration
    executionTimeout: parseInt(process.env.EXECUTION_TIMEOUT) || 300000, // 5 minutes
    installationTimeout: parseInt(process.env.INSTALLATION_TIMEOUT) || 120000, // 2 minutes
    
    // Environment detection
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test'
};
  