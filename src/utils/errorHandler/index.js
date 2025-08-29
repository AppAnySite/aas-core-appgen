/**
 * High-Performance Error Handler
 * 
 * Optimized error handler with minimal overhead and maximum performance
 * for production environments.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import { log } from "../logger/index.js";

/**
 * High-performance error handler class
 * Handles errors with optimized logging and minimal overhead
 */
class ErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.maxErrors = 100; // Prevent infinite error loops
    }

    /**
     * Handle an error with optimized processing
     * @param {Error} error - The error to handle
     * @param {boolean} [exit=false] - Whether to exit the process
     * @param {Object} [context={}] - Additional context information
     */
    handleError(error, exit = false, context = {}) {
        // Prevent infinite error loops
        if (this.errorCount >= this.maxErrors) {
            console.error('Maximum error count reached. Exiting to prevent infinite loops.');
            process.exit(1);
        }

        this.errorCount++;

        // Optimized error message construction
        const errorMessage = this.formatErrorMessage(error, context);
        
        // Log error with optimized logging
        log('ERROR', errorMessage);

        // Exit if requested
        if (exit) {
            process.exit(1);
        }
    }

    /**
     * Format error message with optimized string construction
     * @param {Error} error - The error object
     * @param {Object} context - Additional context
     * @returns {string} Formatted error message
     */
    formatErrorMessage(error, context) {
        const parts = [];

        // Add error message
        if (error.message) {
            parts.push(error.message);
        }

        // Add context information if available
        if (context.file) {
            parts.push(`File: ${context.file}`);
        }

        if (context.line) {
            parts.push(`Line: ${context.line}`);
        }

        // Add stack trace only in development or verbose mode
        if (process.env.NODE_ENV === 'development' || process.env.VERBOSE) {
            parts.push(`Stack: ${error.stack}`);
        }

        return parts.join(' | ');
    }

    /**
     * Handle specific error types with optimized handling
     * @param {Error} error - The error to handle
     * @param {string} type - Error type for specific handling
     */
    handleSpecificError(error, type) {
        const errorHandlers = {
            'VALIDATION': () => this.handleValidationError(error),
            'CONFIGURATION': () => this.handleConfigurationError(error),
            'TEMPLATE': () => this.handleTemplateError(error),
            'EXECUTION': () => this.handleExecutionError(error)
        };

        const handler = errorHandlers[type.toUpperCase()];
        if (handler) {
            handler();
        } else {
            this.handleError(error);
        }
    }

    /**
     * Handle validation errors
     * @param {Error} error - Validation error
     */
    handleValidationError(error) {
        log('ERROR', `Validation Error: ${error.message}`);
    }

    /**
     * Handle configuration errors
     * @param {Error} error - Configuration error
     */
    handleConfigurationError(error) {
        log('ERROR', `Configuration Error: ${error.message}`);
    }

    /**
     * Handle template errors
     * @param {Error} error - Template error
     */
    handleTemplateError(error) {
        log('ERROR', `Template Error: ${error.message}`);
    }

    /**
     * Handle execution errors
     * @param {Error} error - Execution error
     */
    handleExecutionError(error) {
        log('ERROR', `Execution Error: ${error.message}`);
    }

    /**
     * Reset error count (useful for testing)
     */
    resetErrorCount() {
        this.errorCount = 0;
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        return {
            errorCount: this.errorCount,
            maxErrors: this.maxErrors
        };
    }
}

export default ErrorHandler;
