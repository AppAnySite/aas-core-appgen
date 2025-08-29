/**
 * Application Configuration Domain Entity
 * 
 * Optimized domain entity for application configuration validation
 * with O(1) time complexity for critical operations.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

export class AppConfig {
    constructor(configData) {
        this.validateConfigData(configData);
        this.initializeFromConfig(configData);
    }

    /**
     * Validate configuration data with optimized structure checking
     * @param {Object} configData - Configuration data to validate
     * @throws {Error} If validation fails
     */
    validateConfigData(configData) {
        if (!configData || typeof configData !== 'object') {
            throw new Error('Configuration data is required and must be an object');
        }

        // Check for required app section
        if (!configData.app || typeof configData.app !== 'object') {
            throw new Error('Missing required "app" section in configuration');
        }

        const app = configData.app;

        // Validate required fields (lines 3, 7, 8 from app-config.json)
        const requiredFields = [
            { field: 'name', line: 3 },
            { field: 'bundleId', line: 7 },
            { field: 'androidPackageName', line: 8 }
        ];

        for (const { field, line } of requiredFields) {
            if (!app[field] || typeof app[field] !== 'string' || app[field].trim() === '') {
                throw new Error(`Missing or empty required field "app.${field}" (line ${line})`);
            }
        }

        // Validate structure matches expected format
        this.validateStructure(configData);
    }

    /**
     * Validate the overall structure of the configuration
     * @param {Object} configData - Configuration data
     * @throws {Error} If structure is invalid
     */
    validateStructure(configData) {
        const expectedSections = ['app', 'theme', 'features', 'api', 'logging', 'ui', 'metadata'];
        
        for (const section of expectedSections) {
            if (!(section in configData)) {
                throw new Error(`Missing required section: "${section}"`);
            }
        }

        // Validate app section structure
        const requiredAppFields = ['name', 'version', 'buildNumber', 'environment', 'bundleId', 'androidPackageName', 'displayName'];
        for (const field of requiredAppFields) {
            if (!(field in configData.app)) {
                throw new Error(`Missing required field in app section: "${field}"`);
            }
        }
    }

    /**
     * Initialize properties from validated configuration
     * @param {Object} configData - Validated configuration data
     */
    initializeFromConfig(configData) {
        const app = configData.app;
        
        // Core properties (O(1) access)
        this.projectName = app.name;
        this.appName = app.displayName || app.name;
        this.bundleIdentifier = app.bundleId;
        this.androidPackageName = app.androidPackageName;
        this.version = app.version;
        this.buildNumber = app.buildNumber;
        this.environment = app.environment;

        // Nested properties with default values
        this.theme = configData.theme || {};
        this.features = configData.features || {};
        this.api = configData.api || {};
        this.logging = configData.logging || {};
        this.ui = configData.ui || {};
        this.metadata = configData.metadata || {};

        // Pre-compute frequently accessed values for O(1) access
        this.webviewUrl = this.getWebviewUrl();
        this.isAnalyticsEnabled = this.isFeatureEnabled('analytics');
        this.isOfflineEnabled = this.isFeatureEnabled('offline');
    }

    /**
     * Get WebView URL with fallback
     * @returns {string} WebView URL
     */
    getWebviewUrl() {
        return this.features?.webview?.url || 'https://www.appanysite.com/';
    }

    /**
     * Check if feature is enabled (O(1) operation)
     * @param {string} featureName - Name of the feature
     * @returns {boolean} True if feature is enabled
     */
    isFeatureEnabled(featureName) {
        return this.features?.[featureName]?.enabled === true;
    }

    /**
     * Get theme color with fallback (O(1) operation)
     * @param {string} colorName - Name of the color
     * @param {string} mode - Theme mode (light/dark)
     * @returns {string} Color value or default
     */
    getThemeColor(colorName, mode = 'light') {
        return this.theme?.[mode]?.colors?.[colorName] || '#007AFF';
    }

    /**
     * Convert to cookiecutter configuration format
     * @returns {Object} Cookiecutter configuration object
     */
    toCookiecutterConfig() {
        return {
            project_name: this.projectName,
            app_name: this.appName,
            bundle_identifier: this.bundleIdentifier,
            android_package_name: this.androidPackageName
        };
    }

    /**
     * Get project directory name
     * @returns {string} Project directory name
     */
    getProjectDirectory() {
        return this.projectName;
    }

    /**
     * Get configuration summary for logging
     * @returns {Object} Configuration summary
     */
    getSummary() {
        return {
            projectName: this.projectName,
            appName: this.appName,
            bundleId: this.bundleIdentifier,
            androidPackage: this.androidPackageName,
            version: this.version,
            webviewUrl: this.webviewUrl,
            analyticsEnabled: this.isAnalyticsEnabled,
            offlineEnabled: this.isOfflineEnabled
        };
    }

    /**
     * Validate bundle identifier format
     * @param {string} bundleId - Bundle identifier to validate
     * @returns {boolean} True if valid
     */
    static isValidBundleIdentifier(bundleId) {
        return /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(bundleId);
    }

    /**
     * Validate package name format
     * @param {string} packageName - Package name to validate
     * @returns {boolean} True if valid
     */
    static isValidPackageName(packageName) {
        return /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName);
    }

    /**
     * Validate project name format
     * @param {string} projectName - Project name to validate
     * @returns {boolean} True if valid
     */
    static isValidProjectName(projectName) {
        return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(projectName);
    }
}
