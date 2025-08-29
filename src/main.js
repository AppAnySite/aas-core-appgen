#!/usr/bin/env node

/**
 * High-Performance CLI Entry Point
 * 
 * Optimized main entry point with performance tracking and error handling
 * for maximum efficiency in production environments.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { log } from './utils/logger/index.js';
import container from './diContainer.js';

// Performance tracking
const startTime = Date.now();

// Create optimized command program
const program = new Command();

// Configure program with performance optimizations
program
    .name('aas-core-appgen')
    .description('High-performance CLI tool for generating React Native apps using cookiecutter templates')
    .version('v00.03.00')
    .option('--verbose', 'Enable verbose mode for detailed logging')
    .option('--debug', 'Enable debug mode for development')
    .option('--no-cache', 'Disable caching for debugging');

// Create command with optimized options
program
    .command('create')
    .description('Create a new project using config file')
    .requiredOption('-c, --config-file <configFile>', 'Path to JSON configuration file')
    .option('--verbose', 'Enable verbose mode')
    .option('--debug', 'Enable debug mode')
    .option('--no-cache', 'Disable caching')
    .action(async (options) => {
        try {
            // Set environment variables based on options
            if (options.verbose) {
                process.env.VERBOSE = 'true';
            }
            if (options.debug) {
                process.env.NODE_ENV = 'development';
                process.env.LOG_LEVEL = 'debug';
            }
            if (options.cache === false) {
                process.env.CACHE_ENABLED = 'false';
            }

            // Get command instance from container
            const createCommand = container.get('CreateCommand');
            
            // Execute with performance tracking
            const result = await createCommand.execute(options);
            
            // Log execution statistics if verbose (no duplicate completion message)
            if (options.verbose) {
                const duration = Date.now() - startTime;
                log('INFO', `Total execution time: ${duration}ms`);
                const stats = createCommand.getExecutionStats();
                log('DEBUG', `Execution Statistics: ${JSON.stringify(stats, null, 2)}`);
            }

        } catch (error) {
            // Handle errors with optimized error handling
            const errorHandler = container.get('ErrorHandler');
            errorHandler.handleError(error, true, {
                file: 'main.js',
                line: 'command execution'
            });
        }
    });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    const errorHandler = container.get('ErrorHandler');
    errorHandler.handleError(error, true, {
        file: 'main.js',
        line: 'uncaught exception'
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    const errorHandler = container.get('ErrorHandler');
    errorHandler.handleError(new Error(`Unhandled Promise Rejection: ${reason}`), true, {
        file: 'main.js',
        line: 'unhandled rejection'
    });
});

// Parse command line arguments with error handling
try {
    program.parse(process.argv);
} catch (error) {
    const errorHandler = container.get('ErrorHandler');
    errorHandler.handleError(error, true, {
        file: 'main.js',
        line: 'argument parsing'
    });
}