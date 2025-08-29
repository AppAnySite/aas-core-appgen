/**
 * Create Command Implementation
 * 
 * High-performance command implementation that uses the application service
 * to generate applications with optimized progress tracking and error handling.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import ICreateCommand from './ICreateCommand.js';
import { AppGenerationService } from '../../application/services/AppGenerationService.js';
import { ConfigRepository } from '../../infrastructure/repositories/ConfigRepository.js';
import { TemplateRepository } from '../../infrastructure/repositories/TemplateRepository.js';
import { ExecutorRepository } from '../../infrastructure/repositories/ExecutorRepository.js';

export class CreateCommand extends ICreateCommand {
    constructor(errorHandler) {
        super();
        this.errorHandler = errorHandler;
        
        // Initialize repositories with optimized instances
        this.configRepository = new ConfigRepository();
        this.templateRepository = new TemplateRepository();
        this.executorRepository = new ExecutorRepository();
        
        // Initialize application service
        this.appGenerationService = new AppGenerationService(
            this.configRepository,
            this.templateRepository,
            this.executorRepository
        );

        // Performance tracking
        this.executionStats = {
            startTime: 0,
            endTime: 0,
            duration: 0
        };
    }

    /**
     * Execute the create command with optimized performance
     * @param {Object} options - Command options
     * @throws {Error} If execution fails
     */
    async execute(options) {
        this.executionStats.startTime = Date.now();
        
        try {
            // Validate required options with optimized validation
            this.validateOptions(options);

            // Execute app generation with performance tracking
            const result = await this.appGenerationService.generateApp(
                options.configFile,
                (progress, message) => this.printProgress(progress, message)
            );

            // Log success with performance metrics (no duplicate 100% message)
            this.executionStats.endTime = Date.now();
            this.executionStats.duration = this.executionStats.endTime - this.executionStats.startTime;
            
            // Return result for potential use by calling code
            return result;

        } catch (error) {
            // Handle error through error handler with performance tracking
            this.executionStats.endTime = Date.now();
            this.executionStats.duration = this.executionStats.endTime - this.executionStats.startTime;
            
            this.errorHandler.handleError(error);
            throw error;
        }
    }

    /**
     * Validate command options with optimized validation
     * @param {Object} options - Command options to validate
     * @throws {Error} If validation fails
     */
    validateOptions(options) {
        // Optimized validation with early returns
        if (!options) {
            throw new Error('Command options are required');
        }

        if (!options.configFile) {
            throw new Error('Configuration file path is required');
        }

        if (typeof options.configFile !== 'string') {
            throw new Error('Configuration file path must be a string');
        }

        if (options.configFile.trim() === '') {
            throw new Error('Configuration file path cannot be empty');
        }

        // Additional validation for file path format
        if (!options.configFile.includes('.json')) {
            throw new Error('Configuration file must be a JSON file');
        }
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
     * Get execution statistics
     * @returns {Object} Execution statistics
     */
    getExecutionStats() {
        return {
            ...this.executionStats,
            serviceStats: this.appGenerationService.getStats()
        };
    }

    /**
     * Clear all caches and reset statistics
     */
    clearCaches() {
        this.appGenerationService.clearCaches();
        this.executionStats = {
            startTime: 0,
            endTime: 0,
            duration: 0
        };
    }
}

export default CreateCommand;