/**
 * Application Generation Service
 * 
 * High-performance service that orchestrates the application generation process
 * with parallel operations, optimized progress tracking, and comprehensive error handling.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import { AppConfig } from '../../domain/entities/AppConfig.js';
import fs from 'fs/promises';
import path from 'path';

export class AppGenerationService {
    constructor(configRepository, templateRepository, executorRepository) {
        this.configRepository = configRepository;
        this.templateRepository = templateRepository;
        this.executorRepository = executorRepository;
        this.progressCache = new Map(); // Cache for progress tracking
        this.currentProgress = 0; // Track current progress to ensure it only increases
    }

    /**
     * Generate application from configuration file with optimized execution
     * @param {string} configFilePath - Path to configuration file
     * @param {string} outputPath - Path where the project should be created (optional)
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<Object>} Generation result
     * @throws {Error} If generation fails
     */
    async generateApp(configFilePath, outputPath, progressCallback) {
        const startTime = Date.now();
        let appConfig = null;
        
        try {
            // Step 1: Load and validate configuration (O(1) with caching)
            await this.updateProgress(progressCallback, 5, 'Loading and validating configuration');
            const configData = await this.configRepository.loadConfig(configFilePath);
            appConfig = new AppConfig(configData);

            // Step 2: Sequential operations for proper progress tracking
            await this.updateProgress(progressCallback, 10, 'Preparing environment');
            
            // Ensure cookiecutter is available
            await this.updateProgress(progressCallback, 15, 'Ensuring cookiecutter is available');
            await this.executorRepository.installCookiecutter(
                (progress, message) => this.updateProgress(progressCallback, 15 + progress * 0.05, message)
            );

            // Prepare template
            await this.updateProgress(progressCallback, 20, 'Locating and validating template');
            const templatePath = await this.templateRepository.getTemplatePath();

            await this.updateProgress(progressCallback, 25, 'Preparing template configuration');
            const cookiecutterConfig = appConfig.toCookiecutterConfig();
            await this.templateRepository.prepareTemplate(templatePath, cookiecutterConfig, configFilePath);

            // Step 3: Prepare output directory
            await this.updateProgress(progressCallback, 30, 'Preparing output directory');
            const finalOutputPath = outputPath || process.cwd();
            
            // Create output directory if it doesn't exist
            try {
                await fs.access(finalOutputPath);
            } catch (error) {
                await this.updateProgress(progressCallback, 32, 'Creating output directory');
                await fs.mkdir(finalOutputPath, { recursive: true });
            }

            // Step 4: Execute cookiecutter (main operation)
            await this.updateProgress(progressCallback, 35, 'Generating project with cookiecutter');
            
            await this.executorRepository.executeCookiecutter(
                templatePath,
                finalOutputPath,
                (progress, message) => this.updateProgress(progressCallback, 35 + progress * 0.55, message)
            );

            // Step 5: Post-process and validate
            await this.updateProgress(progressCallback, 90, 'Post-processing generated project');
            const projectPath = path.join(finalOutputPath, appConfig.getProjectDirectory());
            await this.validateGeneratedProject(projectPath);

            // Step 6: Cleanup
            await this.updateProgress(progressCallback, 95, 'Cleaning up temporary files');
            await this.templateRepository.cleanupTemplate(templatePath);

            const duration = Date.now() - startTime;
            await this.updateProgress(progressCallback, 100, `Project generation completed successfully in ${duration}ms`);

            return {
                success: true,
                projectPath,
                projectName: appConfig.projectName,
                duration,
                config: appConfig.getSummary()
            };

        } catch (error) {
            // Optimized cleanup on error
            if (appConfig) {
                const finalOutputPath = outputPath || process.cwd();
                const projectPath = path.join(finalOutputPath, appConfig.getProjectDirectory());
                await this.executorRepository.cleanupOnError(projectPath);
            }
            
            throw new Error(`App generation failed: ${error.message}`);
        }
    }

    /**
     * Update progress with optimized bounds checking and caching
     * @param {Function} progressCallback - Progress callback function
     * @param {number} progress - Progress percentage
     * @param {string} message - Progress message
     */
    async updateProgress(progressCallback, progress, message) {
        if (!progressCallback) return;

        // Ensure progress only increases
        const boundedProgress = Math.min(100, Math.max(this.currentProgress, Math.round(progress)));
        this.currentProgress = boundedProgress;
        
        // Cache progress to avoid duplicate updates
        const cacheKey = `${boundedProgress}_${message}`;
        if (this.progressCache.has(cacheKey)) {
            return;
        }
        
        this.progressCache.set(cacheKey, true);
        progressCallback(boundedProgress, message);
    }

    /**
     * Validate generated project with optimized checks
     * @param {string} projectPath - Path to generated project
     * @throws {Error} If validation fails
     */
    async validateGeneratedProject(projectPath) {
        try {
            // Check if project directory exists
            const stats = await fs.stat(projectPath);
            if (!stats.isDirectory()) {
                throw new Error('Generated project directory was not created');
            }

            // Check for essential project files
            const essentialFiles = ['package.json', 'app.json', 'index.js'];
            const missingFiles = [];

            for (const file of essentialFiles) {
                try {
                    await fs.access(path.join(projectPath, file));
                } catch (error) {
                    missingFiles.push(file);
                }
            }

            if (missingFiles.length > 0) {
                throw new Error(`Generated project is missing essential files: ${missingFiles.join(', ')}`);
            }

        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error('Generated project directory was not created');
            }
            throw error;
        }
    }

    /**
     * Get service statistics
     * @returns {Object} Service statistics
     */
    getStats() {
        return {
            progressCacheSize: this.progressCache.size,
            currentProgress: this.currentProgress,
            configCacheStats: this.configRepository.getCacheStats(),
            templateCacheStats: this.templateRepository.getCacheStats(),
            executorCacheStats: this.executorRepository.getCacheStats()
        };
    }

    /**
     * Clear all caches
     */
    clearCaches() {
        this.progressCache.clear();
        this.currentProgress = 0;
        this.configRepository.clearCache();
        this.templateRepository.clearCache();
        this.executorRepository.clearCache();
    }
}
