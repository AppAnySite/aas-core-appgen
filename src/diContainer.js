/**
 * Dependency Injection Container
 * 
 * Professional DI container for managing service dependencies
 * with proper lifecycle management and error handling.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import { CreateCommand } from './modules/create/CreateCommand.js';
import BuildCommand from './modules/build/BuildCommand.js';
import { ConfigRepository } from './infrastructure/repositories/ConfigRepository.js';
import { TemplateRepository } from './infrastructure/repositories/TemplateRepository.js';
import { ExecutorRepository } from './infrastructure/repositories/ExecutorRepository.js';
import { AndroidBuildRepository } from './infrastructure/repositories/AndroidBuildRepository.js';
import { BundleRepository } from './infrastructure/repositories/BundleRepository.js';
import { KeystoreRepository } from './infrastructure/repositories/KeystoreRepository.js';
import { CleanupRepository } from './infrastructure/repositories/CleanupRepository.js';
import { AppGenerationService } from './application/services/AppGenerationService.js';
import { BuildService } from './application/services/BuildService.js';
import { BundleService } from './application/services/BundleService.js';
import { CleanupService } from './application/services/CleanupService.js';
import ErrorHandler from './utils/errorHandler/index.js';

class DIContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
        this.initializeServices();
    }

    /**
     * Initialize all services with their dependencies
     */
    initializeServices() {
        // Register repositories
        this.register('ConfigRepository', ConfigRepository);
        this.register('TemplateRepository', TemplateRepository);
        this.register('ExecutorRepository', ExecutorRepository);
        this.register('AndroidBuildRepository', AndroidBuildRepository);
        this.register('BundleRepository', BundleRepository);
        this.register('KeystoreRepository', KeystoreRepository);
        this.register('CleanupRepository', CleanupRepository);

        // Register application services
        this.register('AppGenerationService', AppGenerationService, [
            'ConfigRepository',
            'TemplateRepository',
            'ExecutorRepository'
        ]);

        this.register('BuildService', BuildService, [
            'AndroidBuildRepository',
            'KeystoreRepository',
            'ConfigRepository'
        ]);

        this.register('BundleService', BundleService, [
            'BundleRepository',
            'ConfigRepository'
        ]);

        this.register('CleanupService', CleanupService, [
            'CleanupRepository',
            'ConfigRepository'
        ]);

        // Register commands with dependencies
        this.register('CreateCommand', CreateCommand, ['ErrorHandler']);
        this.register('BuildCommand', BuildCommand, ['ErrorHandler']);

        // Register utilities
        this.register('ErrorHandler', ErrorHandler);
    }

    /**
     * Register a service with optional dependencies
     * @param {string} name - Service name
     * @param {Function} Constructor - Service constructor
     * @param {Array<string>} dependencies - Service dependencies
     */
    register(name, Constructor, dependencies = []) {
        this.services.set(name, { Constructor, dependencies });
    }

    /**
     * Get a service instance
     * @param {string} name - Service name
     * @returns {Object} Service instance
     * @throws {Error} If service not found
     */
    get(name) {
        // Check if singleton already exists
        if (this.singletons.has(name)) {
            return this.singletons.get(name);
        }

        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not found`);
        }

        const { Constructor, dependencies } = service;
        const resolvedDependencies = dependencies.map(dep => this.get(dep));
        const instance = new Constructor(...resolvedDependencies);

        // Store as singleton
        this.singletons.set(name, instance);
        return instance;
    }

    /**
     * Clear all service instances (useful for testing)
     */
    clear() {
        this.singletons.clear();
    }

    /**
     * Get all registered service names
     * @returns {Array<string>} Service names
     */
    getRegisteredServices() {
        return Array.from(this.services.keys());
    }
}

// Create and export singleton instance
const container = new DIContainer();
export default container;