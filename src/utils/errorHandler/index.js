import log from "../logger";

/**
 * ErrorHandler class.
 * Handles errors by logging them and optionally terminating the process.
 */
class ErrorHandler {
  /**
   * Handles an error.
   * @param {Error} error - The error to handle.
   * @param {boolean} [exit=false] - Whether to exit the process.
   */
  handleError(error, exit = false) {
    log('ERROR', `${error.message}\n${error.stack}`);
    if (exit) {
      process.exit(1);
    }
  }
}

export default ErrorHandler;
