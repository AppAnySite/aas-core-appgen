/**
 * Build Service
 * 
 * High-performance service that orchestrates Android build operations
 * with automatic keystore management and optimized build processes.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import { AndroidBuildRepository } from '../../infrastructure/repositories/AndroidBuildRepository.js';
import { KeystoreRepository } from '../../infrastructure/repositories/KeystoreRepository.js';
import { ConfigRepository } from '../../infrastructure/repositories/ConfigRepository.js';
import { AppConfig } from '../../domain/entities/AppConfig.js';
import path from 'path';
import fs from 'fs/promises';

export class BuildService {
    constructor() {
        this.androidBuildRepository = new AndroidBuildRepository();
        this.keystoreRepository = new KeystoreRepository();
        this.configRepository = new ConfigRepository();
        this.buildCache = new Map();
        this.currentProgress = 0;
    }

    /**
     * Build Android debug APK
     * @param {string} projectPath - Path to the project
     * @param {Object} options - Build options
     * @returns {Promise<Object>} Build result
     */
    async buildAndroidDebug(projectPath, options) {
        const startTime = Date.now();
        
        try {
            const progressCallback = options.progressCallback || (() => {});
            
            progressCallback(20, 'Loading project configuration...');
            // Load project configuration
            const configData = await this.loadProjectConfig(projectPath);
            const appConfig = new AppConfig(configData);
            
            progressCallback(25, 'Validating project structure...');
            // Validate project structure
            await this.validateProjectStructure(projectPath);
            
            progressCallback(30, 'Building Android debug APK...');
            // Build debug APK
            const result = await this.androidBuildRepository.buildDebugAPK(projectPath, appConfig, {
                ...options,
                progressCallback: (progress, message) => {
                    // Map progress from 30-100% for the build process
                    const mappedProgress = 30 + (progress * 0.70);
                    progressCallback(mappedProgress, message);
                }
            });
            
            progressCallback(100, 'Debug build completed successfully');
            
            const duration = Date.now() - startTime;
            return {
                success: true,
                buildType: 'debug',
                projectName: appConfig.projectName,
                duration,
                outputPath: result.outputPath,
                fileSize: result.fileSize
            };
        } catch (error) {
            throw new Error(`Debug APK build failed: ${error.message}`);
        }
    }

    /**
     * Build Android release APK
     * @param {string} projectPath - Path to the project
     * @param {Object} options - Build options
     * @returns {Promise<Object>} Build result
     */
    async buildAndroidRelease(projectPath, options) {
        const startTime = Date.now();
        
        try {
            const progressCallback = options.progressCallback || (() => {});
            
            progressCallback(20, 'Loading project configuration...');
            // Load project configuration
            const configData = await this.loadProjectConfig(projectPath);
            const appConfig = new AppConfig(configData);
            
            progressCallback(25, 'Validating project structure...');
            // Validate project structure
            await this.validateProjectStructure(projectPath);
            
            progressCallback(30, 'Ensuring keystore exists...');
            // Ensure keystore exists
            await this.ensureKeystoreExists(projectPath, appConfig);
            
            progressCallback(35, 'Building Android release APK...');
            // Build release APK
            const result = await this.androidBuildRepository.buildReleaseAPK(projectPath, appConfig, {
                ...options,
                progressCallback: (progress, message) => {
                    // Map progress from 35-100% for the build process
                    const mappedProgress = 35 + (progress * 0.65);
                    progressCallback(mappedProgress, message);
                }
            });
            
            progressCallback(100, 'Release build completed successfully');
            
            const duration = Date.now() - startTime;
            return {
                success: true,
                buildType: 'release',
                projectName: appConfig.projectName,
                duration,
                outputPath: result.outputPath,
                fileSize: result.fileSize,
                keystoreUsed: result.keystoreUsed
            };
        } catch (error) {
            throw new Error(`Release APK build failed: ${error.message}`);
        }
    }

    /**
     * Build Android AAB bundle
     * @param {string} projectPath - Path to the project
     * @param {Object} options - Build options
     * @returns {Promise<Object>} Build result
     */
    async buildAndroidAAB(projectPath, options) {
        const startTime = Date.now();
        
        try {
            // Load project configuration
            const configData = await this.loadProjectConfig(projectPath);
            const appConfig = new AppConfig(configData);
            
            // Validate project structure
            await this.validateProjectStructure(projectPath);
            
            // Ensure keystore exists
            await this.ensureKeystoreExists(projectPath, appConfig);
            
            // Build AAB bundle
            const result = await this.androidBuildRepository.buildAABBundle(projectPath, appConfig, options);
            
            const duration = Date.now() - startTime;
            return {
                success: true,
                buildType: 'aab',
                projectName: appConfig.projectName,
                duration,
                outputPath: result.outputPath,
                fileSize: result.fileSize,
                keystoreUsed: result.keystoreUsed
            };
        } catch (error) {
            throw new Error(`AAB bundle build failed: ${error.message}`);
        }
    }

    /**
     * Build all Android artifacts (debug, release, AAB)
     * @param {string} projectPath - Path to the project
     * @param {Object} options - Build options
     * @returns {Promise<Object>} Build result
     */
    async buildAndroidAll(projectPath, options) {
        const startTime = Date.now();
        
        try {
            // Load project configuration
            const configData = await this.loadProjectConfig(projectPath);
            const appConfig = new AppConfig(configData);
            
            // Validate project structure
            await this.validateProjectStructure(projectPath);
            
            // Ensure keystore exists for release builds
            await this.ensureKeystoreExists(projectPath, appConfig);
            
            // Build all artifacts in parallel
            const [debugResult, releaseResult, aabResult] = await Promise.all([
                this.androidBuildRepository.buildDebugAPK(projectPath, appConfig, options),
                this.androidBuildRepository.buildReleaseAPK(projectPath, appConfig, options),
                this.androidBuildRepository.buildAABBundle(projectPath, appConfig, options)
            ]);
            
            const duration = Date.now() - startTime;
            return {
                success: true,
                buildType: 'all',
                projectName: appConfig.projectName,
                duration,
                artifacts: {
                    debug: {
                        outputPath: debugResult.outputPath,
                        fileSize: debugResult.fileSize
                    },
                    release: {
                        outputPath: releaseResult.outputPath,
                        fileSize: releaseResult.fileSize,
                        keystoreUsed: releaseResult.keystoreUsed
                    },
                    aab: {
                        outputPath: aabResult.outputPath,
                        fileSize: aabResult.fileSize,
                        keystoreUsed: aabResult.keystoreUsed
                    }
                }
            };
        } catch (error) {
            throw new Error(`All Android builds failed: ${error.message}`);
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
            'android/app/build.gradle',
            'android/gradle.properties',
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
     * Ensure keystore exists for the project
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     */
    async ensureKeystoreExists(projectPath, appConfig) {
        const keystorePath = path.join(projectPath, 'build', 'android', 'keystores', `${appConfig.projectName}-release-key.keystore`);
        
        try {
            await fs.access(keystorePath);
        } catch (error) {
            // Keystore doesn't exist, create it
            await this.keystoreRepository.createKeystore(projectPath, appConfig);
        }
    }

    /**
     * Get service statistics
     * @returns {Object} Service statistics
     */
    getStats() {
        return {
            buildCacheSize: this.buildCache.size,
            currentProgress: this.currentProgress,
            androidBuildStats: this.androidBuildRepository.getStats(),
            keystoreStats: this.keystoreRepository.getStats()
        };
    }

    /**
     * Clear build cache
     */
    clearCaches() {
        this.buildCache.clear();
        this.currentProgress = 0;
        this.androidBuildRepository.clearCache();
        this.keystoreRepository.clearCache();
    }
}
