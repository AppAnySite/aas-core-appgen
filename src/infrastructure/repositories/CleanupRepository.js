/**
 * Cleanup Repository Implementation
 * 
 * High-performance implementation of cleanup operations
 * for build artifacts, bundles, and temporary files.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import fs from 'fs/promises';
import path from 'path';
import { AppConfig } from '../../domain/entities/AppConfig.js';

export class CleanupRepository {
    constructor() {
        this.cleanupCache = new Map();
    }

    /**
     * Clean all build artifacts
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} cleanupConfig - Cleanup configuration
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanAll(projectPath, appConfig, cleanupConfig) {
        const startTime = Date.now();
        
        try {
            const cleanedArtifacts = [];
            let freedSpace = 0;
            
            // Clean Android artifacts
            if (cleanupConfig.removeBuildArtifacts) {
                const androidResult = await this.cleanAndroidArtifacts(projectPath, appConfig);
                cleanedArtifacts.push(...androidResult.cleanedArtifacts);
                freedSpace += androidResult.freedSpace;
            }
            
            // Clean bundle artifacts
            if (cleanupConfig.removeBundles) {
                const bundleResult = await this.cleanBundleArtifacts(projectPath, appConfig);
                cleanedArtifacts.push(...bundleResult.cleanedArtifacts);
                freedSpace += bundleResult.freedSpace;
            }
            
            // Clean node_modules if requested
            if (cleanupConfig.removeNodeModules) {
                const nodeResult = await this.cleanNodeModules(projectPath);
                cleanedArtifacts.push(...nodeResult.cleanedArtifacts);
                freedSpace += nodeResult.freedSpace;
            }
            
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                cleanedArtifacts,
                freedSpace,
                duration
            };
        } catch (error) {
            throw new Error(`Cleanup failed: ${error.message}`);
        }
    }

    /**
     * Clean Android build artifacts
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} cleanupConfig - Cleanup configuration
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanAndroid(projectPath, appConfig, cleanupConfig) {
        const startTime = Date.now();
        
        try {
            const result = await this.cleanAndroidArtifacts(projectPath, appConfig);
            
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                cleanedArtifacts: result.cleanedArtifacts,
                freedSpace: result.freedSpace,
                duration
            };
        } catch (error) {
            throw new Error(`Android cleanup failed: ${error.message}`);
        }
    }

    /**
     * Clean bundle artifacts
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} cleanupConfig - Cleanup configuration
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanBundles(projectPath, appConfig, cleanupConfig) {
        const startTime = Date.now();
        
        try {
            const result = await this.cleanBundleArtifacts(projectPath, appConfig);
            
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                cleanedArtifacts: result.cleanedArtifacts,
                freedSpace: result.freedSpace,
                duration
            };
        } catch (error) {
            throw new Error(`Bundle cleanup failed: ${error.message}`);
        }
    }

    /**
     * Clean Android artifacts
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanAndroidArtifacts(projectPath, appConfig) {
        const cleanedArtifacts = [];
        let freedSpace = 0;
        
        const androidPaths = [
            path.join(projectPath, 'android', 'app', 'build'),
            path.join(projectPath, 'android', 'build'),
            path.join(projectPath, 'build', 'android')
        ];
        
        for (const androidPath of androidPaths) {
            try {
                const stats = await fs.stat(androidPath);
                if (stats.isDirectory()) {
                    await this.removeDirectory(androidPath);
                    cleanedArtifacts.push(androidPath);
                    freedSpace += stats.size;
                }
            } catch (error) {
                // Directory doesn't exist, skip
            }
        }
        
        return { cleanedArtifacts, freedSpace };
    }

    /**
     * Clean bundle artifacts
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanBundleArtifacts(projectPath, appConfig) {
        const cleanedArtifacts = [];
        let freedSpace = 0;
        
        const bundlePaths = [
            path.join(projectPath, 'build', 'bundles'),
            path.join(projectPath, 'build', 'bundles', appConfig.projectName)
        ];
        
        for (const bundlePath of bundlePaths) {
            try {
                const stats = await fs.stat(bundlePath);
                if (stats.isDirectory()) {
                    await this.removeDirectory(bundlePath);
                    cleanedArtifacts.push(bundlePath);
                    freedSpace += stats.size;
                }
            } catch (error) {
                // Directory doesn't exist, skip
            }
        }
        
        return { cleanedArtifacts, freedSpace };
    }

    /**
     * Clean node_modules
     * @param {string} projectPath - Path to the project
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanNodeModules(projectPath) {
        const cleanedArtifacts = [];
        let freedSpace = 0;
        
        const nodeModulesPath = path.join(projectPath, 'node_modules');
        
        try {
            const stats = await fs.stat(nodeModulesPath);
            if (stats.isDirectory()) {
                await this.removeDirectory(nodeModulesPath);
                cleanedArtifacts.push(nodeModulesPath);
                freedSpace += stats.size;
            }
        } catch (error) {
            // Directory doesn't exist, skip
        }
        
        return { cleanedArtifacts, freedSpace };
    }

    /**
     * Remove directory recursively
     * @param {string} dirPath - Directory path to remove
     */
    async removeDirectory(dirPath) {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
        } catch (error) {
            // Ignore errors during cleanup
        }
    }

    /**
     * Get repository statistics
     * @returns {Object} Repository statistics
     */
    getStats() {
        return {
            cleanupCacheSize: this.cleanupCache.size
        };
    }

    /**
     * Clear cleanup cache
     */
    clearCache() {
        this.cleanupCache.clear();
    }
}
