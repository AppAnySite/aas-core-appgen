/**
 * Cleanup Service
 * 
 * High-performance service that handles cleanup operations
 * for build artifacts, bundles, and temporary files.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import { CleanupRepository } from '../../infrastructure/repositories/CleanupRepository.js';
import { ConfigRepository } from '../../infrastructure/repositories/ConfigRepository.js';
import { AppConfig } from '../../domain/entities/AppConfig.js';
import path from 'path';
import fs from 'fs/promises';

export class CleanupService {
    constructor() {
        this.cleanupRepository = new CleanupRepository();
        this.configRepository = new ConfigRepository();
        this.cleanupCache = new Map();
        this.currentProgress = 0;
    }

    /**
     * Clean all build artifacts
     * @param {string} projectPath - Path to the project
     * @param {Object} options - Cleanup options
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanAll(projectPath, options) {
        const startTime = Date.now();
        
        try {
            // Load project configuration
            const configData = await this.loadProjectConfig(projectPath);
            const appConfig = new AppConfig(configData);
            
            // Validate project structure
            await this.validateProjectStructure(projectPath);
            
            // Get cleanup configuration
            const cleanupConfig = this.getCleanupConfig(appConfig, options);
            
            // Clean all artifacts
            const result = await this.cleanupRepository.cleanAll(projectPath, appConfig, cleanupConfig);
            
            const duration = Date.now() - startTime;
            return {
                success: true,
                projectName: appConfig.projectName,
                duration,
                cleanedArtifacts: result.cleanedArtifacts,
                freedSpace: result.freedSpace
            };
        } catch (error) {
            throw new Error(`Cleanup failed: ${error.message}`);
        }
    }

    /**
     * Clean Android build artifacts
     * @param {string} projectPath - Path to the project
     * @param {Object} options - Cleanup options
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanAndroid(projectPath, options) {
        const startTime = Date.now();
        
        try {
            // Load project configuration
            const configData = await this.loadProjectConfig(projectPath);
            const appConfig = new AppConfig(configData);
            
            // Validate project structure
            await this.validateProjectStructure(projectPath);
            
            // Get cleanup configuration
            const cleanupConfig = this.getCleanupConfig(appConfig, options);
            
            // Clean Android artifacts
            const result = await this.cleanupRepository.cleanAndroid(projectPath, appConfig, cleanupConfig);
            
            const duration = Date.now() - startTime;
            return {
                success: true,
                projectName: appConfig.projectName,
                duration,
                cleanedArtifacts: result.cleanedArtifacts,
                freedSpace: result.freedSpace
            };
        } catch (error) {
            throw new Error(`Android cleanup failed: ${error.message}`);
        }
    }

    /**
     * Clean bundle artifacts
     * @param {string} projectPath - Path to the project
     * @param {Object} options - Cleanup options
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanBundles(projectPath, options) {
        const startTime = Date.now();
        
        try {
            // Load project configuration
            const configData = await this.loadProjectConfig(projectPath);
            const appConfig = new AppConfig(configData);
            
            // Validate project structure
            await this.validateProjectStructure(projectPath);
            
            // Get cleanup configuration
            const cleanupConfig = this.getCleanupConfig(appConfig, options);
            
            // Clean bundle artifacts
            const result = await this.cleanupRepository.cleanBundles(projectPath, appConfig, cleanupConfig);
            
            const duration = Date.now() - startTime;
            return {
                success: true,
                projectName: appConfig.projectName,
                duration,
                cleanedArtifacts: result.cleanedArtifacts,
                freedSpace: result.freedSpace
            };
        } catch (error) {
            throw new Error(`Bundle cleanup failed: ${error.message}`);
        }
    }

    /**
     * Load project configuration
     * @param {string} projectPath - Path to the project
     * @returns {Promise<Object>} Configuration data
     */
    async loadProjectConfig(projectPath) {
        const configPath = path.join(projectPath, 'app-config.json');
        
        try {
            return await this.configRepository.loadConfig(configPath);
        } catch (error) {
            throw new Error(`Failed to load project configuration: ${error.message}`);
        }
    }

    /**
     * Validate project structure
     * @param {string} projectPath - Path to the project
     * @throws {Error} If project structure is invalid
     */
    async validateProjectStructure(projectPath) {
        const requiredFiles = [
            'package.json',
            'app-config.json'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(projectPath, file);
            try {
                await fs.access(filePath);
            } catch (error) {
                throw new Error(`Required file not found: ${file}`);
            }
        }
    }

    /**
     * Get cleanup configuration from app config and options
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} options - Cleanup options
     * @returns {Object} Cleanup configuration
     */
    getCleanupConfig(appConfig, options) {
        const buildConfig = appConfig.build?.cleanup || {};
        
        return {
            removeNodeModules: buildConfig.removeNodeModules || false,
            removeBuildArtifacts: buildConfig.removeBuildArtifacts || true,
            removeBundles: buildConfig.removeBundles || false,
            force: options.force || false
        };
    }

    /**
     * Get service statistics
     * @returns {Object} Service statistics
     */
    getStats() {
        return {
            cleanupCacheSize: this.cleanupCache.size,
            currentProgress: this.currentProgress,
            cleanupStats: this.cleanupRepository.getStats()
        };
    }

    /**
     * Clear cleanup cache
     */
    clearCaches() {
        this.cleanupCache.clear();
        this.currentProgress = 0;
        this.cleanupRepository.clearCache();
    }
}
