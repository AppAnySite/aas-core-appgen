import winston from 'winston';
import 'winston-daily-rotate-file';
import chalk from 'chalk';
import config from '../../config';

/**
 * Configures and exports the logger.
 * @module utils/logger
 */

// Configure the file transport for daily rotation
const transport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

// Configure the console transport with colors
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${chalk.gray(`[${timestamp}]`)} ${level}: ${message}`;
    })
  )
});

// Create the logger instance
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    transport,
    consoleTransport
  ]
});

/**
 * Logs a message with the specified level.
 * @param {string} level - The log level.
 * @param {string} message - The message to log.
 */
export const log = (level, message) => {
  logger.log({ level: level.toLowerCase(), message });
};

export default log;
