/**
 * Configuration Repository Interface
 * 
 * Defines the contract for configuration data access operations
 * following the repository pattern for clean separation of concerns.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

export class IConfigRepository {
    /**
     * Load configuration from file
     * @param {string} configPath - Path to configuration file
     * @returns {Promise<Object>} Configuration data
     * @throws {Error} If loading fails
     */
    async loadConfig(configPath) {
        throw new Error('Method not implemented');
    }

    /**
     * Save configuration to file
     * @param {string} configPath - Path to save configuration
     * @param {Object} configData - Configuration data to save
     * @returns {Promise<void>}
     * @throws {Error} If saving fails
     */
    async saveConfig(configPath, configData) {
        throw new Error('Method not implemented');
    }

    /**
     * Validate configuration file exists
     * @param {string} configPath - Path to configuration file
     * @returns {Promise<boolean>} True if file exists
     */
    async configExists(configPath) {
        throw new Error('Method not implemented');
    }
}
