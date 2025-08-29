/**
 * Executor Repository Interface
 * 
 * Defines the contract for external command execution operations
 * including cookiecutter execution and dependency management.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

export class IExecutorRepository {
    /**
     * Execute cookiecutter command
     * @param {string} templatePath - Path to template
     * @param {string} outputPath - Output directory path
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<void>}
     * @throws {Error} If execution fails
     */
    async executeCookiecutter(templatePath, outputPath, progressCallback) {
        throw new Error('Method not implemented');
    }

    /**
     * Check if cookiecutter is installed
     * @returns {Promise<boolean>} True if cookiecutter is available
     */
    async isCookiecutterInstalled() {
        throw new Error('Method not implemented');
    }

    /**
     * Install cookiecutter if not available
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<void>}
     * @throws {Error} If installation fails
     */
    async installCookiecutter(progressCallback) {
        throw new Error('Method not implemented');
    }

    /**
     * Clean up generated files on error
     * @param {string} projectPath - Path to generated project
     * @returns {Promise<void>}
     */
    async cleanupOnError(projectPath) {
        throw new Error('Method not implemented');
    }
}
