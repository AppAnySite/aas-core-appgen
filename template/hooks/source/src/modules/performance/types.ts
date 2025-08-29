/**
 * Performance Module Types
 * Reusing types from existing PerformanceMonitor
 */

// Re-export existing types from PerformanceMonitor
// Define performance types locally
export interface PerformanceMetric {
  id: string;
  type: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: any;
}

export interface PerformanceThreshold {
  id: string;
  type: string;
  name: string;
  threshold: number;
  warning: number;
  critical: number;
  unit: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export { MetricType } from '../../core/PerformanceMonitor';

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  enabled: boolean;
  enableMonitoring: boolean;
  thresholds: PerformanceThreshold[];
  metrics: string[];
  maxMetrics: number;
  alertCallbacks: Array<(metric: PerformanceMetric, threshold: PerformanceThreshold) => void>;
}

/**
 * Performance report interface
 */
export interface PerformanceReport {
  summary: {
    totalMetrics: number;
    averageResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    timestamp: number;
  };
  metrics: PerformanceMetric[];
  insights: {
    slowestOperations: PerformanceMetric[];
    memoryIssues: PerformanceMetric[];
    networkIssues: PerformanceMetric[];
    recommendations: string[];
  };
  thresholds: {
    exceeded: PerformanceThreshold[];
    within: PerformanceThreshold[];
  };
}

/**
 * Performance alert interface
 */
export interface PerformanceAlert {
  type: 'threshold_exceeded' | 'memory_warning' | 'slow_operation';
  metric: PerformanceMetric;
  threshold?: PerformanceThreshold;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
}

/**
 * Performance trend interface
 */
export interface PerformanceTrend {
  metricName: string;
  trend: 'improving' | 'stable' | 'degrading';
  changePercentage: number;
  period: '1h' | '24h' | '7d' | '30d';
  dataPoints: Array<{
    value: number;
    timestamp: number;
  }>;
}

/**
 * Performance benchmark interface
 */
export interface PerformanceBenchmark {
  name: string;
  description: string;
  baseline: number;
  current: number;
  unit: string;
  improvement: number; // percentage
  status: 'pass' | 'fail' | 'warning';
}
