/**
 * Build Command Implementation
 * 
 * High-performance build command implementation that orchestrates
 * Android builds, bundle generation, and cleanup operations.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import IBuildCommand from './IBuildCommand.js';
import { BuildService } from '../../application/services/BuildService.js';
import { BundleService } from '../../application/services/BundleService.js';
import { CleanupService } from '../../application/services/CleanupService.js';
import path from 'path';

class BuildCommand extends IBuildCommand {
    constructor(errorHandler) {
        super();
        this.errorHandler = errorHandler;
        
        // Initialize services
        this.buildService = new BuildService();
        this.bundleService = new BundleService();
        this.cleanupService = new CleanupService();

        // Performance tracking
        this.executionStats = {
            startTime: 0,
            endTime: 0,
            duration: 0
        };
    }

    /**
     * Execute the build command with optimized performance
     * @param {Object} options - Command options
     * @throws {Error} If execution fails
     */
    async execute(options) {
        this.executionStats.startTime = Date.now();
        
        try {
            // Validate required options
            this.validateOptions(options);

            const { command, platform, buildType, projectPath } = options;

            // Execute based on command type
            switch (command) {
                case 'android':
                    await this.executeAndroidBuild(platform, buildType, projectPath, options);
                    break;
                case 'bundle':
                    await this.executeBundleGeneration(projectPath, options);
                    break;
                case 'clean':
                    await this.executeCleanup(platform, projectPath, options);
                    break;
                default:
                    throw new Error(`Unknown build command: ${command}`);
            }

            // Log success with performance metrics
            this.executionStats.endTime = Date.now();
            this.executionStats.duration = this.executionStats.endTime - this.executionStats.startTime;
            
            return { success: true, duration: this.executionStats.duration };

        } catch (error) {
            // Handle error through error handler with performance tracking
            this.executionStats.endTime = Date.now();
            this.executionStats.duration = this.executionStats.endTime - this.executionStats.startTime;
            
            this.errorHandler.handleError(error);
            throw error;
        }
    }

    /**
     * Execute Android build operations
     * @param {string} platform - Platform (android)
     * @param {string} buildType - Build type (debug, release, aab, all)
     * @param {string} projectPath - Project path
     * @param {Object} options - Build options
     */
    async executeAndroidBuild(platform, buildType, projectPath, options) {
        if (platform !== 'android') {
            throw new Error(`Unsupported platform: ${platform}`);
        }

        // Install dependencies first
        await this.installDependencies(projectPath, options);

        switch (buildType) {
            case 'debug':
                await this.buildService.buildAndroidDebug(projectPath, {
                    ...options,
                    progressCallback: (progress, message) => this.printProgress(progress, message)
                });
                break;
            case 'release':
                await this.buildService.buildAndroidRelease(projectPath, {
                    ...options,
                    progressCallback: (progress, message) => this.printProgress(progress, message)
                });
                break;
            case 'aab':
                await this.buildService.buildAndroidAAB(projectPath, {
                    ...options,
                    progressCallback: (progress, message) => this.printProgress(progress, message)
                });
                break;
            case 'all':
                await this.buildService.buildAndroidAll(projectPath, {
                    ...options,
                    progressCallback: (progress, message) => this.printProgress(progress, message)
                });
                break;
            default:
                throw new Error(`Unknown Android build type: ${buildType}`);
        }
    }

    /**
     * Install project dependencies
     * @param {string} projectPath - Project path
     * @param {Object} options - Build options
     */
    async installDependencies(projectPath, options) {
        const { spawn } = await import('child_process');
        const fs = await import('fs/promises');
        
        // Check if package.json exists before running npm install
        const packageJsonPath = path.join(projectPath, 'package.json');
        try {
            await fs.access(packageJsonPath);
        } catch (error) {
            throw new Error(`package.json not found in project directory: ${projectPath}. Make sure the project is properly generated.`);
        }
        
        return new Promise((resolve, reject) => {
            this.printProgress(5, 'Installing project dependencies...');
            
            const npmProcess = spawn('npm', ['install'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                cwd: projectPath
            });

            let stdout = '';
            let stderr = '';

            npmProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                this.printProgress(10, 'Installing dependencies...');
            });

            npmProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            npmProcess.on('close', (code) => {
                if (code === 0) {
                    this.printProgress(15, 'Dependencies installed successfully');
                    resolve();
                } else {
                    reject(new Error(`npm install failed with code ${code}. Stderr: ${stderr}`));
                }
            });

            npmProcess.on('error', (error) => {
                reject(new Error(`Failed to execute npm install: ${error.message}`));
            });
        });
    }

    /**
     * Execute bundle generation
     * @param {string} projectPath - Project path
     * @param {Object} options - Bundle options
     */
    async executeBundleGeneration(projectPath, options) {
        await this.bundleService.generateBundle(projectPath, {
            ...options,
            progressCallback: (progress, message) => this.printProgress(progress, message)
        });
    }

    /**
     * Print progress with optimized timestamp and caching
     * @param {number} percentage - Progress percentage
     * @param {string} message - Progress message
     */
    printProgress(percentage, message) {
        const timestamp = new Date().toISOString();
        const boundedPercentage = Math.min(100, Math.max(0, Math.round(percentage)));
        
        console.log(`[${timestamp}] Progress: ${boundedPercentage}% - ${message}`);
    }

    /**
     * Execute cleanup operations
     * @param {string} platform - Platform (android, bundles, or null for all)
     * @param {string} projectPath - Project path
     * @param {Object} options - Cleanup options
     */
    async executeCleanup(platform, projectPath, options) {
        if (!platform) {
            await this.cleanupService.cleanAll(projectPath, options);
        } else {
            switch (platform) {
                case 'android':
                    await this.cleanupService.cleanAndroid(projectPath, options);
                    break;
                case 'bundles':
                    await this.cleanupService.cleanBundles(projectPath, options);
                    break;
                default:
                    throw new Error(`Unknown cleanup target: ${platform}`);
            }
        }
    }

    /**
     * Validate command options with optimized validation
     * @param {Object} options - Command options to validate
     * @throws {Error} If validation fails
     */
    validateOptions(options) {
        if (!options) {
            throw new Error('Command options are required');
        }

        if (!options.command) {
            throw new Error('Build command is required (android, bundle, clean)');
        }

        if (!options.projectPath) {
            throw new Error('Project path is required');
        }

        if (typeof options.projectPath !== 'string') {
            throw new Error('Project path must be a string');
        }

        if (options.projectPath.trim() === '') {
            throw new Error('Project path cannot be empty');
        }

        // Validate platform for android commands
        if (options.command === 'android' && options.platform !== 'android') {
            throw new Error('Android builds require platform to be "android"');
        }

        // Validate build type for android commands
        if (options.command === 'android' && !options.buildType) {
            throw new Error('Android build type is required (debug, release, aab, all)');
        }
    }

    /**
     * Get execution statistics
     * @returns {Object} Execution statistics
     */
    getExecutionStats() {
        return {
            ...this.executionStats,
            buildStats: this.buildService.getStats(),
            bundleStats: this.bundleService.getStats(),
            cleanupStats: this.cleanupService.getStats()
        };
    }

    /**
     * Clear all caches and reset statistics
     */
    clearCaches() {
        this.buildService.clearCaches();
        this.bundleService.clearCaches();
        this.cleanupService.clearCaches();
        this.executionStats = {
            startTime: 0,
            endTime: 0,
            duration: 0
        };
    }
}

export default BuildCommand;
