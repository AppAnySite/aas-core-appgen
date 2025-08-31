/**
 * Executor Repository Implementation
 * 
 * High-performance implementation of external command execution operations
 * with optimized process management, timeout handling, and error recovery.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { IExecutorRepository } from '../../domain/repositories/IExecutorRepository.js';

export class ExecutorRepository extends IExecutorRepository {
    constructor() {
        super();
        this.timeoutMs = 300000; // 5 minutes
        this.maxRetries = 3;
        this.processCache = new Map(); // Cache for process status
    }

    /**
     * Execute cookiecutter command with optimized process management
     * @param {string} templatePath - Path to template
     * @param {string} outputPath - Output directory path
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<void>}
     * @throws {Error} If execution fails
     */
    async executeCookiecutter(templatePath, outputPath, progressCallback) {
        return new Promise((resolve, reject) => {
            // Validate inputs with early return
            if (!templatePath || !outputPath) {
                reject(new Error('Template path and output path are required'));
                return;
            }

            // Store original working directory
            const originalCwd = process.cwd();
            
            // Execute cookiecutter command with optimized options
            // Use the specified output path to create the project
            const cookiecutterProcess = spawn('cookiecutter', [templatePath, '--no-input'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                cwd: outputPath, // Use the specified output path
                env: { ...process.env, PYTHONUNBUFFERED: '1' } // Optimize Python output
            });

            let stdout = '';
            let stderr = '';
            let isCompleted = false;
            let timeoutId = null;

            // Optimized progress tracking
            const updateProgress = (progress, message) => {
                if (progressCallback && !isCompleted) {
                    progressCallback(progress, message);
                }
            };

            // Handle stdout with buffered processing
            cookiecutterProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                updateProgress(60, 'Generating project structure...');
            });

            // Handle stderr (non-blocking)
            cookiecutterProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                // Don't treat stderr as error for cookiecutter
            });

            // Handle process completion
            cookiecutterProcess.on('close', (code) => {
                isCompleted = true;
                process.chdir(originalCwd);
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                if (code === 0) {
                    updateProgress(100, 'Project generation completed successfully');
                    resolve();
                } else {
                    reject(new Error(`Cookiecutter failed with code ${code}. Stderr: ${stderr}`));
                }
            });

            // Handle process errors
            cookiecutterProcess.on('error', (error) => {
                isCompleted = true;
                process.chdir(originalCwd);
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                
                reject(new Error(`Failed to execute cookiecutter: ${error.message}`));
            });

            // Set optimized timeout
            timeoutId = setTimeout(() => {
                if (!isCompleted) {
                    isCompleted = true;
                    cookiecutterProcess.kill('SIGTERM');
                    process.chdir(originalCwd);
                    reject(new Error('Cookiecutter execution timed out'));
                }
            }, this.timeoutMs);
        });
    }

    /**
     * Check if cookiecutter is installed with optimized check
     * @returns {Promise<boolean>} True if cookiecutter is available
     */
    async isCookiecutterInstalled() {
        const cacheKey = 'cookiecutter_installed';
        
        // Check cache first (O(1))
        if (this.processCache.has(cacheKey)) {
            return this.processCache.get(cacheKey);
        }

        return new Promise((resolve) => {
            const checkProcess = spawn('cookiecutter', ['--version'], {
                stdio: 'pipe',
                shell: true,
                timeout: 5000 // 5 second timeout
            });

            const timeoutId = setTimeout(() => {
                checkProcess.kill('SIGTERM');
                this.processCache.set(cacheKey, false);
                resolve(false);
            }, 5000);

            checkProcess.on('close', (code) => {
                clearTimeout(timeoutId);
                const isInstalled = code === 0;
                this.processCache.set(cacheKey, isInstalled);
                resolve(isInstalled);
            });

            checkProcess.on('error', () => {
                clearTimeout(timeoutId);
                this.processCache.set(cacheKey, false);
                resolve(false);
            });
        });
    }

    /**
     * Install cookiecutter if not available with optimized installation
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<void>}
     * @throws {Error} If installation fails
     */
    async installCookiecutter(progressCallback) {
        const isInstalled = await this.isCookiecutterInstalled();
        
        if (isInstalled) {
            if (progressCallback) {
                progressCallback(20, 'Cookiecutter is already installed');
            }
            return;
        }

        if (progressCallback) {
            progressCallback(10, 'Installing cookiecutter...');
        }

        return new Promise((resolve, reject) => {
            const installProcess = spawn('pip', ['install', 'cookiecutter'], {
                stdio: 'pipe',
                shell: true,
                timeout: 120000 // 2 minutes timeout
            });

            let timeoutId = setTimeout(() => {
                installProcess.kill('SIGTERM');
                reject(new Error('Cookiecutter installation timed out'));
            }, 120000);

            installProcess.on('close', (code) => {
                clearTimeout(timeoutId);
                if (code === 0) {
                    // Clear cache to force re-check
                    this.processCache.delete('cookiecutter_installed');
                    
                    if (progressCallback) {
                        progressCallback(20, 'Cookiecutter installed successfully');
                    }
                    resolve();
                } else {
                    reject(new Error('Failed to install cookiecutter'));
                }
            });

            installProcess.on('error', (error) => {
                clearTimeout(timeoutId);
                reject(new Error(`Failed to install cookiecutter: ${error.message}`));
            });
        });
    }

    /**
     * Clean up generated files on error with optimized cleanup
     * @param {string} projectPath - Path to generated project
     * @returns {Promise<void>}
     */
    async cleanupOnError(projectPath) {
        try {
            const resolvedPath = path.resolve(projectPath);
            
            // Check if directory exists before attempting removal
            try {
                const stats = await fs.stat(resolvedPath);
                if (stats.isDirectory()) {
                    await fs.rm(resolvedPath, { recursive: true, force: true });
                }
            } catch (error) {
                // Directory doesn't exist, nothing to clean up
            }
        } catch (error) {
            // Ignore cleanup errors silently
            console.warn('Failed to cleanup project directory:', error.message);
        }
    }

    /**
     * Get process cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.processCache.size,
            entries: Array.from(this.processCache.entries())
        };
    }

    /**
     * Clear process cache
     */
    clearCache() {
        this.processCache.clear();
    }
}
