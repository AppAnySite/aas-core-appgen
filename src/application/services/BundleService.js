/**
 * Bundle Service
 * 
 * High-performance service that handles React Native bundle generation
 * with optimized asset management and universal bundle creation.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import { BundleRepository } from '../../infrastructure/repositories/BundleRepository.js';
import { ConfigRepository } from '../../infrastructure/repositories/ConfigRepository.js';
import { AppConfig } from '../../domain/entities/AppConfig.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export class BundleService {
    constructor() {
        this.bundleRepository = new BundleRepository();
        this.configRepository = new ConfigRepository();
        this.bundleCache = new Map();
        this.currentProgress = 0;
    }

    /**
     * Generate React Native bundle
     * @param {string} projectPath - Path to the project
     * @param {Object} options - Bundle options
     * @returns {Promise<Object>} Bundle result
     */
    async generateBundle(projectPath, options) {
        const startTime = Date.now();
        
        try {
            // Load project configuration
            if (options.progressCallback) {
                options.progressCallback(5, 'Loading project configuration...');
            }
            const configData = await this.loadProjectConfig(projectPath);
            const appConfig = new AppConfig(configData);
            
            // Validate project structure and install dependencies if needed
            if (options.progressCallback) {
                options.progressCallback(10, 'Validating project structure...');
            }
            await this.validateProjectStructure(projectPath, { progressCallback: options.progressCallback });
            
            // Get bundle configuration
            if (options.progressCallback) {
                options.progressCallback(25, 'Preparing bundle configuration...');
            }
            const bundleConfig = this.getBundleConfig(appConfig, options);
            
            // Generate bundle
            if (options.progressCallback) {
                options.progressCallback(30, 'Generating React Native bundle...');
            }
            const result = await this.bundleRepository.generateBundle(projectPath, appConfig, bundleConfig);
            
            if (options.progressCallback) {
                options.progressCallback(90, 'Bundle generation completed');
            }
            
            if (options.progressCallback) {
                options.progressCallback(100, 'Bundle generation completed successfully');
            }
            
            const duration = Date.now() - startTime;
            return {
                success: true,
                projectName: appConfig.projectName,
                duration,
                outputPath: result.outputPath,
                bundlePath: result.bundlePath,
                assetsPath: result.assetsPath,
                fileSize: result.fileSize,
                assetsCount: result.assetsCount
            };
        } catch (error) {
            throw new Error(`Bundle generation failed: ${error.message}`);
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
     * Validate project structure and install dependencies if needed
     * @param {string} projectPath - Path to the project
     * @param {Object} options - Bundle options with progress callback
     * @throws {Error} If project structure is invalid
     */
    async validateProjectStructure(projectPath, options = {}) {
        const requiredFiles = [
            'package.json',
            'index.js',
            'app-config.json'
        ];

        // Check required files
        for (const file of requiredFiles) {
            const filePath = path.join(projectPath, file);
            try {
                await fs.access(filePath);
            } catch (error) {
                throw new Error(`Required file not found: ${file}`);
            }
        }

        // Check if node_modules exists
        const nodeModulesPath = path.join(projectPath, 'node_modules');
        try {
            await fs.access(nodeModulesPath);
            // node_modules exists, no need to install
            if (options.progressCallback) {
                options.progressCallback(20, 'Dependencies already installed');
            }
        } catch (error) {
            // node_modules doesn't exist, install dependencies
            if (options.progressCallback) {
                options.progressCallback(10, 'Installing project dependencies...');
            }
            await this.installDependencies(projectPath, options.progressCallback);
        }
    }

    /**
     * Install project dependencies
     * @param {string} projectPath - Path to the project
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<void>}
     */
    async installDependencies(projectPath, progressCallback) {
        return new Promise((resolve, reject) => {
            const installProcess = spawn('npm', ['install'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                cwd: projectPath,
                env: { ...process.env, NODE_ENV: 'production' }
            });

            let stdout = '';
            let stderr = '';
            let isCompleted = false;
            let timeoutId = null;

            // Handle stdout
            installProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                if (progressCallback) {
                    progressCallback(15, 'Installing dependencies...');
                }
            });

            // Handle stderr
            installProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                // Don't treat npm warnings as errors
            });

            // Handle process completion
            installProcess.on('close', (code) => {
                isCompleted = true;
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                if (code === 0) {
                    if (progressCallback) {
                        progressCallback(20, 'Dependencies installed successfully');
                    }
                    resolve();
                } else {
                    reject(new Error(`npm install failed with code ${code}. Stderr: ${stderr}`));
                }
            });

            // Handle process errors
            installProcess.on('error', (error) => {
                isCompleted = true;
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                
                reject(new Error(`Failed to install dependencies: ${error.message}`));
            });

            // Set timeout (5 minutes)
            timeoutId = setTimeout(() => {
                if (!isCompleted) {
                    isCompleted = true;
                    installProcess.kill('SIGTERM');
                    reject(new Error('Dependency installation timed out'));
                }
            }, 300000);
        });
    }

    /**
     * Get bundle configuration from app config and options
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} options - Bundle options
     * @returns {Object} Bundle configuration
     */
    getBundleConfig(appConfig, options) {
        const buildConfig = appConfig.build?.bundle || {};
        
        return {
            dev: options.dev !== undefined ? options.dev : buildConfig.dev || false,
            platform: buildConfig.platform || 'android',
            entryFile: buildConfig.entryFile || 'index.js',
            bundleName: buildConfig.bundleName || 'complete-app.bundle',
            assetsDest: buildConfig.assetsDest || 'assets',
            sourceMap: buildConfig.sourceMap || false,
            resetCache: buildConfig.resetCache || false,
            output: buildConfig.output || 'build/bundles'
        };
    }

    /**
     * Get service statistics
     * @returns {Object} Service statistics
     */
    getStats() {
        return {
            bundleCacheSize: this.bundleCache.size,
            currentProgress: this.currentProgress,
            bundleStats: this.bundleRepository.getStats()
        };
    }

    /**
     * Clear bundle cache
     */
    clearCaches() {
        this.bundleCache.clear();
        this.currentProgress = 0;
        this.bundleRepository.clearCache();
    }
}
