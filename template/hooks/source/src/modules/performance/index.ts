/**
 * Performance Module Entry Point
 * 
 * This module provides performance monitoring and metrics collection features.
 * All external access to performance functionality should go through this entry point.
 */

// Import types and constants
import type { 
  PerformanceMetric, 
  PerformanceThreshold, 
  PerformanceConfig,
  PerformanceReport 
} from './types';
import { MetricType } from './types';

// Import the main feature class
import { PerformanceFeature, createPerformanceFeature } from './PerformanceFeature';

// Import utilities
import { PerformanceUtils } from './utils/PerformanceUtils';

// Import the performance monitor from core
import { performanceMonitor } from '../../core/PerformanceMonitor';

// Re-export everything
export { PerformanceFeature, createPerformanceFeature, PerformanceUtils, performanceMonitor };
export { MetricType };
export type { 
  PerformanceMetric, 
  PerformanceThreshold, 
  PerformanceConfig,
  PerformanceReport 
};

// Export the module configuration interface
export interface PerformanceModuleConfig {
  enabled: boolean;
  enableMonitoring?: boolean;
  thresholds?: PerformanceThreshold[];
  metrics?: string[];
  customHandlers?: {
    onPerformanceAlert?: (metric: PerformanceMetric) => void;
    onThresholdExceeded?: (threshold: PerformanceThreshold) => void;
  };
}

// Export the module interface
export interface PerformanceModule {
  initialize(): Promise<void>;
  deinitialize(): Promise<void>;
  recordMetric(type: MetricType, name: string, value: number, unit?: string, metadata?: any): void;
  getMetrics(): PerformanceMetric[];
  getPerformanceInsights(): any;
  getPerformanceReport(): string;
  addThreshold(threshold: PerformanceThreshold): void;
  checkThresholds(): boolean;
  isFeatureEnabled(): boolean;
}

// Default export for the module
export default {
  PerformanceFeature: PerformanceFeature,
  createPerformanceFeature: createPerformanceFeature,
  PerformanceUtils: PerformanceUtils,
  performanceMonitor: performanceMonitor,
};
