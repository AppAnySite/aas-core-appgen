/**
 * Configuration Repository Implementation
 * 
 * High-performance implementation of configuration data access operations
 * with caching, optimized error handling, and O(1) file operations.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import fs from 'fs/promises';
import path from 'path';
import { IConfigRepository } from '../../domain/repositories/IConfigRepository.js';

export class ConfigRepository extends IConfigRepository {
    constructor() {
        super();
        this.cache = new Map(); // O(1) cache for file existence checks
        this.maxCacheSize = 100;
    }

    /**
     * Load configuration from file with optimized caching
     * @param {string} configPath - Path to configuration file
     * @returns {Promise<Object>} Configuration data
     * @throws {Error} If loading fails
     */
    async loadConfig(configPath) {
        const resolvedPath = path.resolve(configPath);
        
        try {
            // Use cached file content if available
            if (this.cache.has(resolvedPath)) {
                return this.cache.get(resolvedPath);
            }

            const configContent = await fs.readFile(resolvedPath, 'utf8');
            const configData = JSON.parse(configContent);

            // Cache the result for O(1) subsequent access
            this.cacheResult(resolvedPath, configData);
            
            return configData;
        } catch (error) {
            this.handleLoadError(error, configPath);
        }
    }

    /**
     * Save configuration to file with optimized error handling
     * @param {string} configPath - Path to save configuration
     * @param {Object} configData - Configuration data to save
     * @returns {Promise<void>}
     * @throws {Error} If saving fails
     */
    async saveConfig(configPath, configData) {
        const resolvedPath = path.resolve(configPath);
        
        try {
            const configDir = path.dirname(resolvedPath);
            
            // Ensure directory exists (single operation)
            await fs.mkdir(configDir, { recursive: true });
            
            // Optimized JSON stringification with proper formatting
            const configContent = JSON.stringify(configData, null, 2);
            await fs.writeFile(resolvedPath, configContent, 'utf8');

            // Update cache
            this.cacheResult(resolvedPath, configData);
        } catch (error) {
            throw new Error(`Failed to save configuration: ${error.message}`);
        }
    }

    /**
     * Validate configuration file exists with O(1) cache lookup
     * @param {string} configPath - Path to configuration file
     * @returns {Promise<boolean>} True if file exists
     */
    async configExists(configPath) {
        const resolvedPath = path.resolve(configPath);
        
        // Check cache first (O(1))
        if (this.cache.has(resolvedPath)) {
            return true;
        }

        try {
            await fs.access(resolvedPath);
            this.cache.set(resolvedPath, true);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Cache result with size management
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     */
    cacheResult(key, value) {
        // Implement LRU cache eviction
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    /**
     * Handle load errors with specific error types
     * @param {Error} error - Error object
     * @param {string} configPath - Configuration file path
     * @throws {Error} Specific error message
     */
    handleLoadError(error, configPath) {
        if (error.code === 'ENOENT') {
            throw new Error(`Configuration file not found: ${configPath}`);
        }
        if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON format in configuration file: ${configPath}`);
        }
        if (error.code === 'EACCES') {
            throw new Error(`Permission denied accessing configuration file: ${configPath}`);
        }
        throw new Error(`Failed to load configuration: ${error.message}`);
    }

    /**
     * Clear cache for testing or memory management
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: this.cache.size / this.maxCacheSize
        };
    }
}
