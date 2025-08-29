/**
 * Template Repository Implementation
 * 
 * High-performance implementation of template management operations
 * with caching, optimized file operations, and O(1) template discovery.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository.js';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TemplateRepository extends ITemplateRepository {
    constructor() {
        super();
        this.templateCache = new Map(); // O(1) cache for template paths
        this.requiredFiles = new Set(['cookiecutter.json', '{{cookiecutter.project_name}}']);
        
        // Generic template paths within the project directory
        this.possibleTemplatePaths = [
            path.join(process.cwd(), 'template'), // Primary template location
            path.join(__dirname, '..', '..', 'template'), // Fallback from src
            path.join(process.cwd(), 'templates', 'aas-app-template') // Alternative location
        ];
    }

    /**
     * Get template path with O(1) cache lookup
     * @returns {Promise<string>} Path to template directory
     * @throws {Error} If template not found
     */
    async getTemplatePath() {
        // Check cache first (O(1))
        if (this.templateCache.has('templatePath')) {
            return this.templateCache.get('templatePath');
        }

        // Find template with optimized search
        const templatePath = await this.findTemplatePath();
        
        if (!templatePath) {
            throw new Error('Template not found. Please ensure the template is available in the "template" directory within the project.');
        }

        // Cache the result
        this.templateCache.set('templatePath', templatePath);
        return templatePath;
    }

    /**
     * Find template path with optimized search
     * @returns {Promise<string|null>} Template path or null
     */
    async findTemplatePath() {
        // Use Promise.all for parallel validation
        const validationPromises = this.possibleTemplatePaths.map(async (templatePath) => {
            if (await this.validateTemplate(templatePath)) {
                return templatePath;
            }
            return null;
        });

        try {
            const results = await Promise.all(validationPromises);
            return results.find(result => result !== null) || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Validate template exists and is valid with optimized checks
     * @param {string} templatePath - Path to template
     * @returns {Promise<boolean>} True if template is valid
     */
    async validateTemplate(templatePath) {
        const cacheKey = `template_${templatePath}`;
        
        // Check cache first (O(1))
        if (this.templateCache.has(cacheKey)) {
            return this.templateCache.get(cacheKey);
        }

        try {
            const resolvedPath = path.resolve(templatePath);
            
            // Single stat operation to check if directory exists
            const stats = await fs.stat(resolvedPath);
            if (!stats.isDirectory()) {
                this.cacheValidationResult(cacheKey, false);
                return false;
            }

            // Optimized file existence check
            const exists = await this.checkRequiredFiles(resolvedPath);
            this.cacheValidationResult(cacheKey, exists);
            return exists;
        } catch (error) {
            this.cacheValidationResult(cacheKey, false);
            return false;
        }
    }

    /**
     * Check required files with optimized batch operation
     * @param {string} templatePath - Template directory path
     * @returns {Promise<boolean>} True if all required files exist
     */
    async checkRequiredFiles(templatePath) {
        try {
            // Batch check all required files
            const checkPromises = Array.from(this.requiredFiles).map(async (file) => {
                const filePath = path.join(templatePath, file);
                try {
                    await fs.access(filePath);
                    return true;
                } catch (error) {
                    return false;
                }
            });

            const results = await Promise.all(checkPromises);
            return results.every(exists => exists);
        } catch (error) {
            return false;
        }
    }

    /**
     * Prepare template configuration with optimized file operations
     * @param {string} templatePath - Path to template
     * @param {Object} cookiecutterConfig - Cookiecutter configuration
     * @param {string} appConfigPath - Path to app config file
     * @returns {Promise<void>}
     * @throws {Error} If preparation fails
     */
    async prepareTemplate(templatePath, cookiecutterConfig, appConfigPath) {
        const resolvedTemplatePath = path.resolve(templatePath);
        
        try {
            // Parallel file operations for maximum performance
            await Promise.all([
                this.writeCookiecutterConfig(resolvedTemplatePath, cookiecutterConfig),
                this.copyAppConfig(resolvedTemplatePath, appConfigPath)
            ]);
        } catch (error) {
            throw new Error(`Template preparation failed: ${error.message}`);
        }
    }

    /**
     * Write cookiecutter configuration with optimized JSON handling
     * @param {string} templatePath - Template directory path
     * @param {Object} cookiecutterConfig - Configuration to write
     * @returns {Promise<void>}
     */
    async writeCookiecutterConfig(templatePath, cookiecutterConfig) {
        const cookiecutterPath = path.join(templatePath, 'cookiecutter.json');
        const configContent = JSON.stringify(cookiecutterConfig, null, 2);
        await fs.writeFile(cookiecutterPath, configContent, 'utf8');
    }

    /**
     * Copy app config with optimized directory creation
     * @param {string} templatePath - Template directory path
     * @param {string} appConfigPath - Source app config path
     * @returns {Promise<void>}
     */
    async copyAppConfig(templatePath, appConfigPath) {
        const appConfigTargetPath = path.join(templatePath, 'hooks', 'source', 'app-config.json');
        const appConfigTargetDir = path.dirname(appConfigTargetPath);
        
        // Ensure target directory exists (single operation)
        await fs.mkdir(appConfigTargetDir, { recursive: true });
        
        // Copy file with optimized operation
        await fs.copyFile(appConfigPath, appConfigTargetPath);
    }

    /**
     * Clean up template after use
     * @param {string} templatePath - Path to template
     * @returns {Promise<void>}
     */
    async cleanupTemplate(templatePath) {
        try {
            // Clear template cache
            this.templateCache.clear();
        } catch (error) {
            // Ignore cleanup errors silently
            console.warn('Template cleanup failed:', error.message);
        }
    }

    /**
     * Cache validation result
     * @param {string} key - Cache key
     * @param {boolean} result - Validation result
     */
    cacheValidationResult(key, result) {
        this.templateCache.set(key, result);
    }

    /**
     * Get template cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.templateCache.size,
            templatePath: this.templateCache.has('templatePath'),
            validationResults: Array.from(this.templateCache.entries())
                .filter(([key]) => key.startsWith('template_'))
                .length
        };
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.templateCache.clear();
    }
}
