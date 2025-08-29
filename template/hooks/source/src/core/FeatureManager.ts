import { logger } from '../utils/Logger';
import { eventBus, EventType, emitEvent } from './EventBus';

/**
 * Feature status enum
 */
export enum FeatureStatus {
  DISABLED = 'disabled',
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  ERROR = 'error',
  DEINITIALIZING = 'deinitializing',
}

/**
 * Feature interface
 */
export interface Feature {
  id: string;
  name: string;
  version: string;
  status: FeatureStatus;
  dependencies: string[];
  config: any;
  initialize: () => Promise<void>;
  deinitialize: () => Promise<void>;
  isEnabled: () => boolean;
  getStatus: () => FeatureStatus;
  getConfig: () => any;
  getDependencies: () => string[];
}

/**
 * Feature manager configuration
 */
export interface FeatureManagerConfig {
  features: {
    [featureId: string]: {
      enabled: boolean;
      config: any;
      dependencies?: string[];
    };
  };
  autoInitialize: boolean;
  strictMode: boolean; // Fail if dependencies are missing
}

/**
 * Feature event types
 */
export enum FeatureEventType {
  FEATURE_INITIALIZED = 'feature_initialized',
  FEATURE_DEINITIALIZED = 'feature_deinitialized',
  FEATURE_ERROR = 'feature_error',
  FEATURE_STATUS_CHANGED = 'feature_status_changed',
  DEPENDENCY_MISSING = 'dependency_missing',
}

/**
 * Feature event interface
 */
export interface FeatureEvent {
  type: FeatureEventType;
  featureId: string;
  status: FeatureStatus;
  error?: Error;
  timestamp: number;
  metadata?: any;
}

/**
 * Comprehensive Feature Manager for Modular Architecture
 */
class FeatureManager {
  private static instance: FeatureManager;
  private features: Map<string, Feature> = new Map();
  private config: FeatureManagerConfig | null = null;
  private isInitialized: boolean = false;
  private eventCallbacks: Array<(event: FeatureEvent) => void> = [];

  private constructor() {}

  public static getInstance(): FeatureManager {
    if (!FeatureManager.instance) {
      FeatureManager.instance = new FeatureManager();
    }
    return FeatureManager.instance;
  }

  /**
   * Initialize feature manager
   */
  public async initialize(config: FeatureManagerConfig): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Feature manager already initialized', null, 'FeatureManager');
      return;
    }

    try {
      this.config = config;
      
      logger.info('Feature manager initializing', {
        totalFeatures: Object.keys(config.features).length,
        autoInitialize: config.autoInitialize,
        strictMode: config.strictMode,
      }, 'FeatureManager');

      // Auto-initialize features if enabled
      if (config.autoInitialize) {
        await this.initializeEnabledFeatures();
      }

      this.isInitialized = true;
      
      logger.info('Feature manager initialized successfully', {
        activeFeatures: this.getActiveFeatures().length,
        disabledFeatures: this.getDisabledFeatures().length,
      }, 'FeatureManager');

    } catch (error) {
      logger.error('Failed to initialize feature manager', error as Error, null, 'FeatureManager');
      throw error;
    }
  }

  /**
   * Register a feature
   */
  public registerFeature(feature: Feature): void {
    if (this.features.has(feature.id)) {
      logger.warn(`Feature ${feature.id} already registered`, null, 'FeatureManager');
      return;
    }

    this.features.set(feature.id, feature);
    
    logger.info('Feature registered', {
      id: feature.id,
      name: feature.name,
      version: feature.version,
      dependencies: feature.dependencies,
    }, 'FeatureManager');
  }

  /**
   * Unregister a feature
   */
  public async unregisterFeature(featureId: string): Promise<void> {
    const feature = this.features.get(featureId);
    if (!feature) {
      logger.warn(`Feature ${featureId} not found`, null, 'FeatureManager');
      return;
    }

    // Deinitialize if active
    if (feature.status === FeatureStatus.ACTIVE) {
      await this.deinitializeFeature(featureId);
    }

    this.features.delete(featureId);
    
    logger.info('Feature unregistered', { id: featureId }, 'FeatureManager');
  }

  /**
   * Initialize a specific feature
   */
  public async initializeFeature(featureId: string): Promise<void> {
    const feature = this.features.get(featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    // Check if feature is enabled in config
    if (!this.isFeatureEnabled(featureId)) {
      logger.info(`Feature ${featureId} is disabled in configuration`, null, 'FeatureManager');
      return;
    }

    // Check dependencies
    const missingDependencies = this.checkDependencies(featureId);
    if (missingDependencies.length > 0) {
      const error = new Error(`Missing dependencies for ${featureId}: ${missingDependencies.join(', ')}`);
      
      if (this.config?.strictMode) {
        throw error;
      } else {
        logger.warn(`Feature ${featureId} initialization skipped due to missing dependencies`, {
          missingDependencies,
        }, 'FeatureManager');
        return;
      }
    }

    try {
      // Update status
      feature.status = FeatureStatus.INITIALIZING;
      this.emitFeatureEvent(FeatureEventType.FEATURE_STATUS_CHANGED, featureId, feature.status);

      // Initialize feature
      await feature.initialize();
      
      // Update status
      feature.status = FeatureStatus.ACTIVE;
      
      logger.info(`Feature ${featureId} initialized successfully`, null, 'FeatureManager');
      
      this.emitFeatureEvent(FeatureEventType.FEATURE_INITIALIZED, featureId, feature.status);

    } catch (error) {
      feature.status = FeatureStatus.ERROR;
      
      logger.error(`Failed to initialize feature ${featureId}`, error as Error, null, 'FeatureManager');
      
      this.emitFeatureEvent(FeatureEventType.FEATURE_ERROR, featureId, feature.status, error as Error);
      
      throw error;
    }
  }

  /**
   * Deinitialize a specific feature
   */
  public async deinitializeFeature(featureId: string): Promise<void> {
    const feature = this.features.get(featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    if (feature.status !== FeatureStatus.ACTIVE) {
      logger.info(`Feature ${featureId} is not active, skipping deinitialization`, null, 'FeatureManager');
      return;
    }

    try {
      // Update status
      feature.status = FeatureStatus.DEINITIALIZING;
      this.emitFeatureEvent(FeatureEventType.FEATURE_STATUS_CHANGED, featureId, feature.status);

      // Deinitialize feature
      await feature.deinitialize();
      
      // Update status
      feature.status = FeatureStatus.DISABLED;
      
      logger.info(`Feature ${featureId} deinitialized successfully`, null, 'FeatureManager');
      
      this.emitFeatureEvent(FeatureEventType.FEATURE_DEINITIALIZED, featureId, feature.status);

    } catch (error) {
      feature.status = FeatureStatus.ERROR;
      
      logger.error(`Failed to deinitialize feature ${featureId}`, error as Error, null, 'FeatureManager');
      
      this.emitFeatureEvent(FeatureEventType.FEATURE_ERROR, featureId, feature.status, error as Error);
      
      throw error;
    }
  }

  /**
   * Initialize all enabled features
   */
  public async initializeEnabledFeatures(): Promise<void> {
    const enabledFeatures = this.getEnabledFeatures();
    
    logger.info('Initializing enabled features', {
      count: enabledFeatures.length,
      features: enabledFeatures.map(f => f.id),
    }, 'FeatureManager');

    // Initialize features in dependency order
    const sortedFeatures = this.sortByDependencies(enabledFeatures);
    
    for (const feature of sortedFeatures) {
      try {
        await this.initializeFeature(feature.id);
      } catch (error) {
        if (this.config?.strictMode) {
          throw error;
        } else {
          logger.error(`Failed to initialize feature ${feature.id}, continuing with others`, error as Error, null, 'FeatureManager');
        }
      }
    }
  }

  /**
   * Deinitialize all features
   */
  public async deinitializeAllFeatures(): Promise<void> {
    const activeFeatures = this.getActiveFeatures();
    
    logger.info('Deinitializing all features', {
      count: activeFeatures.length,
      features: activeFeatures.map(f => f.id),
    }, 'FeatureManager');

    // Deinitialize in reverse dependency order
    const sortedFeatures = this.sortByDependencies(activeFeatures).reverse();
    
    for (const feature of sortedFeatures) {
      try {
        await this.deinitializeFeature(feature.id);
      } catch (error) {
        logger.error(`Failed to deinitialize feature ${feature.id}`, error as Error, null, 'FeatureManager');
      }
    }
  }

  /**
   * Check if feature is enabled in configuration
   */
  public isFeatureEnabled(featureId: string): boolean {
    if (!this.config?.features[featureId]) {
      return false;
    }
    return this.config.features[featureId].enabled;
  }

  /**
   * Get feature configuration
   */
  public getFeatureConfig(featureId: string): any {
    return this.config?.features[featureId]?.config || {};
  }

  /**
   * Check dependencies for a feature
   */
  private checkDependencies(featureId: string): string[] {
    const feature = this.features.get(featureId);
    if (!feature) return [];

    const missingDependencies: string[] = [];
    
    for (const dependencyId of feature.dependencies) {
      const dependency = this.features.get(dependencyId);
      if (!dependency || dependency.status !== FeatureStatus.ACTIVE) {
        missingDependencies.push(dependencyId);
      }
    }

    return missingDependencies;
  }

  /**
   * Sort features by dependencies
   */
  private sortByDependencies(features: Feature[]): Feature[] {
    const sorted: Feature[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (feature: Feature) => {
      if (visiting.has(feature.id)) {
        throw new Error(`Circular dependency detected: ${feature.id}`);
      }
      
      if (visited.has(feature.id)) {
        return;
      }

      visiting.add(feature.id);

      // Visit dependencies first
      for (const dependencyId of feature.dependencies) {
        const dependency = features.find(f => f.id === dependencyId);
        if (dependency) {
          visit(dependency);
        }
      }

      visiting.delete(feature.id);
      visited.add(feature.id);
      sorted.push(feature);
    };

    for (const feature of features) {
      if (!visited.has(feature.id)) {
        visit(feature);
      }
    }

    return sorted;
  }

  /**
   * Get enabled features
   */
  public getEnabledFeatures(): Feature[] {
    return Array.from(this.features.values()).filter(feature => 
      this.isFeatureEnabled(feature.id)
    );
  }

  /**
   * Get active features
   */
  public getActiveFeatures(): Feature[] {
    return Array.from(this.features.values()).filter(feature => 
      feature.status === FeatureStatus.ACTIVE
    );
  }

  /**
   * Get disabled features
   */
  public getDisabledFeatures(): Feature[] {
    return Array.from(this.features.values()).filter(feature => 
      feature.status === FeatureStatus.DISABLED
    );
  }

  /**
   * Get feature by ID
   */
  public getFeature(featureId: string): Feature | undefined {
    return this.features.get(featureId);
  }

  /**
   * Get all features
   */
  public getAllFeatures(): Feature[] {
    return Array.from(this.features.values());
  }

  /**
   * Get feature status
   */
  public getFeatureStatus(featureId: string): FeatureStatus | null {
    const feature = this.features.get(featureId);
    return feature ? feature.status : null;
  }

  /**
   * Add feature event listener
   */
  public onFeatureEvent(callback: (event: FeatureEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Remove feature event listener
   */
  public removeFeatureEventListener(callback: (event: FeatureEvent) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * Emit feature event
   */
  private emitFeatureEvent(
    type: FeatureEventType, 
    featureId: string, 
    status: FeatureStatus, 
    error?: Error
  ): void {
    const event: FeatureEvent = {
      type,
      featureId,
      status,
      error,
      timestamp: Date.now(),
    };

    // Notify callbacks
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('Error in feature event callback', error as Error, null, 'FeatureManager');
      }
    });

    // Emit global event
    emitEvent(EventType.APP_INITIALIZED, {
      source: 'FeatureManager',
      data: event,
    });
  }

  /**
   * Get feature manager status
   */
  public getStatus(): {
    isInitialized: boolean;
    totalFeatures: number;
    activeFeatures: number;
    disabledFeatures: number;
    errorFeatures: number;
    features: Array<{ id: string; name: string; status: FeatureStatus; enabled: boolean }>;
  } {
    const features = this.getAllFeatures();
    
    return {
      isInitialized: this.isInitialized,
      totalFeatures: features.length,
      activeFeatures: features.filter(f => f.status === FeatureStatus.ACTIVE).length,
      disabledFeatures: features.filter(f => f.status === FeatureStatus.DISABLED).length,
      errorFeatures: features.filter(f => f.status === FeatureStatus.ERROR).length,
      features: features.map(f => ({
        id: f.id,
        name: f.name,
        status: f.status,
        enabled: this.isFeatureEnabled(f.id),
      })),
    };
  }

  /**
   * Export feature manager report
   */
  public exportReport(): string {
    const report = {
      status: this.getStatus(),
      config: this.config,
      features: this.getAllFeatures().map(f => ({
        id: f.id,
        name: f.name,
        version: f.version,
        status: f.status,
        dependencies: f.dependencies,
        enabled: this.isFeatureEnabled(f.id),
        config: this.getFeatureConfig(f.id),
      })),
      timestamp: Date.now(),
    };

    return JSON.stringify(report, null, 2);
  }
}

// Export singleton instance
export const featureManager = FeatureManager.getInstance();

// Export convenience functions
export const initializeFeatureManager = (config: FeatureManagerConfig) => featureManager.initialize(config);
export const registerFeature = (feature: Feature) => featureManager.registerFeature(feature);
export const initializeFeature = (featureId: string) => featureManager.initializeFeature(featureId);
export const deinitializeFeature = (featureId: string) => featureManager.deinitializeFeature(featureId);
export const isFeatureEnabled = (featureId: string) => featureManager.isFeatureEnabled(featureId);
export const getFeatureStatus = (featureId: string) => featureManager.getFeatureStatus(featureId);
export const onFeatureEvent = (callback: (event: FeatureEvent) => void) => {
  featureManager.onFeatureEvent(callback);
};
