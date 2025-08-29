/**
 * High-Performance Logger Implementation
 * 
 * Optimized logger with minimal overhead and maximum performance
 * for production environments.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import winston from 'winston';
import chalk from 'chalk';

/**
 * Optimized logger configuration for high performance
 */
const createOptimizedLogger = () => {
    // Simplified console transport for maximum performance
    const consoleTransport = new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(({ level, message, timestamp }) => {
                const colorMap = {
                    error: chalk.red,
                    warn: chalk.yellow,
                    info: chalk.blue,
                    debug: chalk.gray
                };
                
                const color = colorMap[level] || chalk.white;
                return `${chalk.gray(`[${timestamp}]`)} ${color(level.toUpperCase())}: ${message}`;
            })
        )
    });

    // Create optimized logger instance
    return winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.splat()
        ),
        transports: [consoleTransport],
        // Disable exit on error for better error handling
        exitOnError: false
    });
};

// Create singleton logger instance
const logger = createOptimizedLogger();

/**
 * Optimized logging function with performance improvements
 * @param {string} level - The log level
 * @param {string} message - The message to log
 */
export const log = (level, message) => {
    // Optimized level mapping
    const levelMap = {
        'ERROR': 'error',
        'WARN': 'warn', 
        'INFO': 'info',
        'DEBUG': 'debug'
    };
    
    const mappedLevel = levelMap[level.toUpperCase()] || 'info';
    logger.log({ level: mappedLevel, message });
};

/**
 * Performance-optimized logging methods
 */
export const loggerUtils = {
    error: (message) => log('ERROR', message),
    warn: (message) => log('WARN', message),
    info: (message) => log('INFO', message),
    debug: (message) => log('DEBUG', message)
};

export default log;
