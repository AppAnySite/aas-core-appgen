/**
 * Template Repository Interface
 * 
 * Defines the contract for template management operations
 * including template discovery, validation, and configuration.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

export class ITemplateRepository {
    /**
     * Get template path
     * @returns {Promise<string>} Path to template directory
     * @throws {Error} If template not found
     */
    async getTemplatePath() {
        throw new Error('Method not implemented');
    }

    /**
     * Validate template exists and is valid
     * @param {string} templatePath - Path to template
     * @returns {Promise<boolean>} True if template is valid
     */
    async validateTemplate(templatePath) {
        throw new Error('Method not implemented');
    }

    /**
     * Prepare template configuration
     * @param {string} templatePath - Path to template
     * @param {Object} cookiecutterConfig - Cookiecutter configuration
     * @param {string} appConfigPath - Path to app config file
     * @returns {Promise<void>}
     * @throws {Error} If preparation fails
     */
    async prepareTemplate(templatePath, cookiecutterConfig, appConfigPath) {
        throw new Error('Method not implemented');
    }

    /**
     * Clean up template after use
     * @param {string} templatePath - Path to template
     * @returns {Promise<void>}
     */
    async cleanupTemplate(templatePath) {
        throw new Error('Method not implemented');
    }
}
