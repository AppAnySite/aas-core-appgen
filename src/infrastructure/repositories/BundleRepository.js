/**
 * Bundle Repository Implementation
 * 
 * High-performance implementation of React Native bundle generation
 * with optimized asset management and universal bundle creation.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { AppConfig } from '../../domain/entities/AppConfig.js';

export class BundleRepository {
    constructor() {
        this.timeoutMs = 300000; // 5 minutes
        this.maxRetries = 3;
        this.bundleCache = new Map();
    }

    /**
     * Generate React Native bundle
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} bundleConfig - Bundle configuration
     * @returns {Promise<Object>} Bundle result
     */
    async generateBundle(projectPath, appConfig, bundleConfig) {
        const startTime = Date.now();
        
        try {
            // Validate project structure
            await this.validateProjectStructure(projectPath);
            
            // Prepare bundle environment
            await this.prepareBundleEnvironment(projectPath, appConfig, bundleConfig);
            
            // Execute bundle generation
            const result = await this.executeBundleCommand(projectPath, appConfig, bundleConfig);
            
            // Get output file information AFTER bundle generation
            const outputPath = path.join(projectPath, bundleConfig.output, appConfig.projectName);
            const bundlePath = path.join(outputPath, bundleConfig.bundleName);
            const assetsPath = path.join(outputPath, bundleConfig.assetsDest);
            
            // Get file size (now the bundle should exist)
            let fileSize = '0 B';
            let assetsCount = 0;
            
            try {
                const stats = await fs.stat(bundlePath);
                fileSize = this.formatFileSize(stats.size);
            } catch (error) {
                console.warn('Bundle file not found after generation:', error.message);
            }
            
            // Count assets
            try {
                assetsCount = await this.countAssets(assetsPath);
            } catch (error) {
                console.warn('Assets directory not found:', error.message);
            }
            
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                outputPath,
                bundlePath,
                assetsPath,
                fileSize,
                assetsCount,
                duration
            };
        } catch (error) {
            throw new Error(`Bundle generation failed: ${error.message}`);
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
            'index.js',
            'node_modules'
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
     * Prepare bundle environment
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} bundleConfig - Bundle configuration
     */
    async prepareBundleEnvironment(projectPath, appConfig, bundleConfig) {
        // Create output directory structure
        const outputPath = path.join(projectPath, bundleConfig.output, appConfig.projectName);
        await fs.mkdir(outputPath, { recursive: true });
        
        // Create assets directory
        const assetsPath = path.join(outputPath, bundleConfig.assetsDest);
        await fs.mkdir(assetsPath, { recursive: true });
    }

    /**
     * Execute React Native bundle command
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} bundleConfig - Bundle configuration
     * @returns {Promise<Object>} Bundle result
     */
    async executeBundleCommand(projectPath, appConfig, bundleConfig) {
        return new Promise((resolve, reject) => {
            // Use relative paths for React Native bundle command
            const outputPath = path.join(bundleConfig.output, appConfig.projectName);
            const bundlePath = path.join(outputPath, bundleConfig.bundleName);
            const assetsPath = path.join(outputPath, bundleConfig.assetsDest);
            
            // Prepare bundle command arguments
            const args = [
                'react-native', 'bundle',
                '--platform', bundleConfig.platform,
                '--dev', bundleConfig.dev.toString(),
                '--entry-file', bundleConfig.entryFile,
                '--bundle-output', bundlePath,
                '--assets-dest', assetsPath
            ];
            
            // Add optional arguments
            if (bundleConfig.sourceMap) {
                args.push('--sourcemap-output', `${bundlePath}.map`);
            }
            
            if (bundleConfig.resetCache) {
                args.push('--reset-cache');
            }
            
            const bundleProcess = spawn('npx', args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                cwd: projectPath,
                env: { ...process.env, NODE_ENV: bundleConfig.dev ? 'development' : 'production' }
            });

            let stdout = '';
            let stderr = '';
            let isCompleted = false;
            let timeoutId = null;

            // Handle stdout
            bundleProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            // Handle stderr
            bundleProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Handle process completion
            bundleProcess.on('close', (code) => {
                isCompleted = true;
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                if (code === 0) {
                    resolve({ success: true, stdout, stderr });
                } else {
                    reject(new Error(`Bundle generation failed with code ${code}. Stderr: ${stderr}`));
                }
            });

            // Handle process errors
            bundleProcess.on('error', (error) => {
                isCompleted = true;
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                
                reject(new Error(`Failed to execute bundle generation: ${error.message}`));
            });

            // Set timeout
            timeoutId = setTimeout(() => {
                if (!isCompleted) {
                    isCompleted = true;
                    bundleProcess.kill('SIGTERM');
                    reject(new Error('Bundle generation timed out'));
                }
            }, this.timeoutMs);
        });
    }

    /**
     * Count assets in assets directory
     * @param {string} assetsPath - Path to assets directory
     * @returns {Promise<number>} Number of assets
     */
    async countAssets(assetsPath) {
        try {
            const files = await fs.readdir(assetsPath, { recursive: true });
            return files.length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Get repository statistics
     * @returns {Object} Repository statistics
     */
    getStats() {
        return {
            bundleCacheSize: this.bundleCache.size,
            timeoutMs: this.timeoutMs,
            maxRetries: this.maxRetries
        };
    }

    /**
     * Clear bundle cache
     */
    clearCache() {
        this.bundleCache.clear();
    }
}
