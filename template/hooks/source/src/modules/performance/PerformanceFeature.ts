import { Feature, FeatureStatus } from '../../core/FeatureManager';
import { performanceMonitor, MetricType } from '../../core/PerformanceMonitor';
import { 
  PerformanceConfig, 
  PerformanceReport 
} from './types';
import type { 
  PerformanceMetric, 
  PerformanceThreshold 
} from '../../core/PerformanceMonitor';
import { PerformanceUtils } from './utils/PerformanceUtils';
import { logger } from '../../utils/Logger';
import { eventBus, EventType, emitEvent } from '../../core/EventBus';

/**
 * Performance Feature Implementation
 * Modular feature that can be independently controlled
 */
export class PerformanceFeature implements Feature {
  public id = 'performance';
  public name = 'Performance Monitor';
  public version = '1.0.0';
  public status: FeatureStatus = FeatureStatus.DISABLED;
  public dependencies: string[] = [];
  public config: PerformanceConfig;

  private alertCallbacks: Array<(metric: PerformanceMetric, threshold: PerformanceThreshold) => void> = [];

  constructor(config: PerformanceConfig) {
    const defaultConfig: PerformanceConfig = {
      enabled: true,
      enableMonitoring: true,
      thresholds: [],
      metrics: [],
      maxMetrics: 1000,
      alertCallbacks: [],
    };
    
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Initialize the performance feature
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Performance Feature', this.config, 'PerformanceFeature');
      
      // Validate configuration
      if (!PerformanceUtils.validateConfig(this.config)) {
        throw new Error('Invalid performance configuration');
      }

      // Configure performance monitor with thresholds
      if (this.config.thresholds && Array.isArray(this.config.thresholds)) {
              this.config.thresholds.forEach((threshold: any) => {
        performanceMonitor.addThreshold(threshold as any);
      });
      }
      
      logger.info('Performance Feature initialized successfully', null, 'PerformanceFeature');
      
    } catch (error) {
      logger.error('Failed to initialize Performance Feature', error as Error, null, 'PerformanceFeature');
      throw error;
    }
  }

  /**
   * Deinitialize the performance feature
   */
  public async deinitialize(): Promise<void> {
    try {
      logger.info('Deinitializing Performance Feature', null, 'PerformanceFeature');
      
      // Performance monitor cleanup can be added here
      
      // Clear alert callbacks
      this.alertCallbacks = [];
      
      logger.info('Performance Feature deinitialized successfully', null, 'PerformanceFeature');
      
    } catch (error) {
      logger.error('Failed to deinitialize Performance Feature', error as Error, null, 'PerformanceFeature');
      throw error;
    }
  }

  /**
   * Check if feature is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled !== false;
  }

  /**
   * Get current status
   */
  public getStatus(): FeatureStatus {
    return this.status;
  }

  /**
   * Get feature configuration
   */
  public getConfig(): PerformanceConfig {
    return this.config;
  }

  /**
   * Get feature dependencies
   */
  public getDependencies(): string[] {
    return this.dependencies;
  }

  /**
   * Record a performance metric
   */
  public recordMetric(type: MetricType, name: string, value: number, unit: string = 'ms', metadata?: any): void {
    if (!this.isEnabled()) {
      return;
    }

    try {
      performanceMonitor.recordMetric(type, name, value, unit, metadata);
      
      // Check if this metric exceeds any thresholds
      this.checkMetricThresholds(type, name, value);
      
    } catch (error) {
      logger.error('Failed to record performance metric', error as Error, { type, name, value }, 'PerformanceFeature');
    }
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): PerformanceMetric[] {
    return performanceMonitor.getMetrics();
  }

  /**
   * Get performance insights
   */
  public getPerformanceInsights(): any {
    return performanceMonitor.getPerformanceInsights();
  }

  /**
   * Get performance report
   */
  public getPerformanceReport(): string {
    return performanceMonitor.exportPerformanceReport();
  }

  /**
   * Add performance threshold
   */
  public addThreshold(threshold: PerformanceThreshold): void {
    if (this.isEnabled()) {
      performanceMonitor.addThreshold(threshold as any);
      this.config.thresholds.push(threshold as any);
      
      logger.info(`Performance threshold added: ${threshold.name}`, null, 'PerformanceFeature');
    }
  }

  /**
   * Check if performance is within thresholds
   */
  public checkThresholds(): boolean {
    // This would need to be implemented based on the actual PerformanceMonitor interface
    return true;
  }

  /**
   * Add performance alert callback
   */
  public onPerformanceAlert(callback: (metric: PerformanceMetric, threshold: PerformanceThreshold) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Remove performance alert callback
   */
  public removePerformanceAlertCallback(callback: (metric: PerformanceMetric, threshold: PerformanceThreshold) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  /**
   * Start a performance timer
   */
  public startTimer(name: string, type: MetricType = MetricType.RENDER_TIME): () => void {
    return performanceMonitor.startTimer(name, type);
  }

  /**
   * Measure memory usage
   */
  public measureMemoryUsage(): void {
    if (this.isEnabled()) {
      performanceMonitor.measureMemoryUsage();
    }
  }

  /**
   * Measure render performance
   */
  public measureRenderTime(componentName: string, renderTime: number): void {
    if (this.isEnabled()) {
      performanceMonitor.measureRenderTime(componentName, renderTime);
    }
  }

  /**
   * Measure network request performance
   */
  public measureNetworkRequest(url: string, duration: number, statusCode?: number): void {
    if (this.isEnabled()) {
      performanceMonitor.measureNetworkRequest(url, duration, statusCode);
    }
  }

  /**
   * Measure WebView load performance
   */
  public measureWebViewLoad(url: string, loadTime: number): void {
    if (this.isEnabled()) {
      performanceMonitor.measureWebViewLoad(url, loadTime);
    }
  }

  /**
   * Check if metric exceeds thresholds
   */
  private checkMetricThresholds(type: MetricType, name: string, value: number): void {
    const key = `${type}.${name}`;
    const threshold = this.config.thresholds.find(t => `${t.type}.${t.name}` === key);
    
    if (threshold && value >= threshold.warning) {
      const metric: PerformanceMetric = {
        type,
        name,
        value,
        unit: threshold.unit,
        timestamp: Date.now(),
      } as any;

      // Notify alert callbacks
      this.alertCallbacks.forEach(callback => {
        try {
          callback(metric, threshold as any);
        } catch (error) {
          logger.error('Error in performance alert callback', error as Error, null, 'PerformanceFeature');
        }
      });

      // Emit global event
      emitEvent(EventType.PERFORMANCE_METRIC, {
        source: 'PerformanceFeature',
        data: { metric, threshold, exceeded: true },
      });
    }
  }
}

// Export factory function for easy creation
export const createPerformanceFeature = (config: PerformanceConfig): PerformanceFeature => {
  return new PerformanceFeature(config);
};
