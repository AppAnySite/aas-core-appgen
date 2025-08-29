import { logger } from '../utils/Logger';
import { eventBus, EventType, emitEvent } from './EventBus';

/**
 * Performance metric types
 */
export enum MetricType {
  MEMORY_USAGE = 'memory_usage',
  RENDER_TIME = 'render_time',
  NETWORK_REQUEST = 'network_request',
  WEBVIEW_LOAD = 'webview_load',
  USER_INTERACTION = 'user_interaction',
  APP_STARTUP = 'app_startup',
  COMPONENT_MOUNT = 'component_mount',
  COMPONENT_UPDATE = 'component_update',
}

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  type: MetricType;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Performance threshold interface
 */
export interface PerformanceThreshold {
  type: MetricType;
  name: string;
  warning: number;
  critical: number;
  unit: string;
}

/**
 * Advanced Performance Monitor with real-time metrics and alerting
 */
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private observers: Map<string, (metric: PerformanceMetric) => void> = new Map();
  private isEnabled: boolean = true;
  private maxMetrics: number = 1000;
  private alertCallbacks: Array<(metric: PerformanceMetric, threshold: PerformanceThreshold) => void> = [];

  private constructor() {
    this.setupDefaultThresholds();
    this.setupEventListeners();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a performance metric
   */
  public recordMetric(
    type: MetricType,
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, any>,
    tags?: string[]
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      type,
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
      tags,
    };

    this.metrics.push(metric);
    
    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Check thresholds
    this.checkThresholds(metric);

    // Notify observers
    this.notifyObservers(metric);

    // Emit event
    emitEvent(EventType.PERFORMANCE_METRIC, {
      source: 'PerformanceMonitor',
      data: metric,
    });

    logger.debug(`Performance metric recorded: ${type}.${name} = ${value}${unit}`, metric, 'PerformanceMonitor');
  }

  /**
   * Start a performance timer
   */
  public startTimer(name: string, type: MetricType = MetricType.RENDER_TIME): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(type, name, duration, 'ms');
    };
  }

  /**
   * Measure memory usage
   */
  public measureMemoryUsage(): void {
    // In a real app, you would use React Native's memory APIs
    // For now, we'll simulate memory measurement
    const memoryUsage = Math.random() * 100; // Simulated memory usage in MB
    
    this.recordMetric(
      MetricType.MEMORY_USAGE,
      'current_memory',
      memoryUsage,
      'MB',
      { platform: 'react-native' }
    );
  }

  /**
   * Measure render performance
   */
  public measureRenderTime(componentName: string, renderTime: number): void {
    this.recordMetric(
      MetricType.RENDER_TIME,
      `${componentName}_render`,
      renderTime,
      'ms',
      { component: componentName }
    );
  }

  /**
   * Measure network request performance
   */
  public measureNetworkRequest(url: string, duration: number, statusCode?: number): void {
    this.recordMetric(
      MetricType.NETWORK_REQUEST,
      'http_request',
      duration,
      'ms',
      { url, statusCode }
    );
  }

  /**
   * Measure WebView load performance
   */
  public measureWebViewLoad(url: string, loadTime: number): void {
    this.recordMetric(
      MetricType.WEBVIEW_LOAD,
      'webview_load',
      loadTime,
      'ms',
      { url }
    );
  }

  /**
   * Add performance threshold
   */
  public addThreshold(threshold: PerformanceThreshold): void {
    const key = `${threshold.type}.${threshold.name}`;
    this.thresholds.set(key, threshold);
    logger.info(`Performance threshold added: ${key}`, threshold, 'PerformanceMonitor');
  }

  /**
   * Check if metric exceeds thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const key = `${metric.type}.${metric.name}`;
    const threshold = this.thresholds.get(key);
    
    if (!threshold) return;

    if (metric.value >= threshold.critical) {
      this.triggerAlert(metric, threshold, 'CRITICAL');
    } else if (metric.value >= threshold.warning) {
      this.triggerAlert(metric, threshold, 'WARNING');
    }
  }

  /**
   * Trigger performance alert
   */
  private triggerAlert(metric: PerformanceMetric, threshold: PerformanceThreshold, level: 'WARNING' | 'CRITICAL'): void {
    const alert = {
      level,
      metric,
      threshold,
      timestamp: Date.now(),
    };

    logger.warn(`Performance alert: ${level} - ${metric.name} = ${metric.value}${metric.unit}`, alert, 'PerformanceMonitor');

    // Notify alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(metric, threshold);
      } catch (error) {
        logger.error('Error in performance alert callback', error as Error, null, 'PerformanceMonitor');
      }
    });

    // Emit event
    emitEvent(EventType.PERFORMANCE_METRIC, {
      source: 'PerformanceMonitor',
      data: alert,
      metadata: { alert: true, level },
    });
  }

  /**
   * Add performance alert callback
   */
  public onAlert(callback: (metric: PerformanceMetric, threshold: PerformanceThreshold) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Add metric observer
   */
  public observe(type: MetricType, callback: (metric: PerformanceMetric) => void): void {
    const key = type;
    this.observers.set(key, callback);
  }

  /**
   * Notify observers
   */
  private notifyObservers(metric: PerformanceMetric): void {
    const observer = this.observers.get(metric.type);
    if (observer) {
      try {
        observer(metric);
      } catch (error) {
        logger.error('Error in performance observer', error as Error, null, 'PerformanceMonitor');
      }
    }
  }

  /**
   * Get metrics by type
   */
  public getMetrics(type?: MetricType): PerformanceMetric[] {
    if (type) {
      return this.metrics.filter(m => m.type === type);
    }
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  public getMetricsSummary(): Record<MetricType, { count: number; avg: number; min: number; max: number }> {
    const summary: Record<MetricType, { count: number; avg: number; min: number; max: number }> = {} as any;

    Object.values(MetricType).forEach(type => {
      const typeMetrics = this.getMetrics(type);
      if (typeMetrics.length > 0) {
        const values = typeMetrics.map(m => m.value);
        summary[type] = {
          count: typeMetrics.length,
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      } else {
        summary[type] = { count: 0, avg: 0, min: 0, max: 0 };
      }
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
    logger.info('Performance metrics cleared', null, 'PerformanceMonitor');
  }

  /**
   * Get performance insights and recommendations
   */
  public getPerformanceInsights(): {
    issues: Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string; recommendation: string }>;
    trends: Array<{ metric: string; trend: 'improving' | 'stable' | 'degrading'; change: number }>;
    recommendations: string[];
  } {
    const insights = {
      issues: [] as Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string; recommendation: string }>,
      trends: [] as Array<{ metric: string; trend: 'improving' | 'stable' | 'degrading'; change: number }>,
      recommendations: [] as string[],
    };

    // Analyze recent metrics for issues
    const recentMetrics = this.metrics.slice(-100); // Last 100 metrics
    
    // Check for slow render times
    const renderTimes = recentMetrics.filter(m => m.type === MetricType.RENDER_TIME);
    const avgRenderTime = renderTimes.length > 0 ? renderTimes.reduce((sum, m) => sum + m.value, 0) / renderTimes.length : 0;
    
    if (avgRenderTime > 33) {
      insights.issues.push({
        type: 'slow_rendering',
        severity: avgRenderTime > 66 ? 'high' : 'medium',
        description: `Average render time is ${avgRenderTime.toFixed(1)}ms`,
        recommendation: 'Consider optimizing component rendering or reducing UI complexity',
      });
    }

    // Check for memory issues
    const memoryUsage = recentMetrics.filter(m => m.type === MetricType.MEMORY_USAGE);
    const maxMemory = memoryUsage.length > 0 ? Math.max(...memoryUsage.map(m => m.value)) : 0;
    
    if (maxMemory > 500) {
      insights.issues.push({
        type: 'high_memory_usage',
        severity: maxMemory > 800 ? 'high' : 'medium',
        description: `Peak memory usage is ${maxMemory.toFixed(0)}MB`,
        recommendation: 'Check for memory leaks and optimize image loading',
      });
    }

    // Check for slow network requests
    const networkRequests = recentMetrics.filter(m => m.type === MetricType.NETWORK_REQUEST);
    const slowRequests = networkRequests.filter(m => m.value > 5000).length;
    
    if (slowRequests > 0) {
      insights.issues.push({
        type: 'slow_network_requests',
        severity: slowRequests > 5 ? 'high' : 'medium',
        description: `${slowRequests} network requests took longer than 5 seconds`,
        recommendation: 'Consider implementing caching or optimizing API calls',
      });
    }

    // Analyze trends
    const metricTypes = Object.values(MetricType);
    metricTypes.forEach(type => {
      const typeMetrics = recentMetrics.filter(m => m.type === type);
      if (typeMetrics.length >= 10) {
        const firstHalf = typeMetrics.slice(0, Math.floor(typeMetrics.length / 2));
        const secondHalf = typeMetrics.slice(Math.floor(typeMetrics.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;
        
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        let trend: 'improving' | 'stable' | 'degrading' = 'stable';
        if (change < -10) trend = 'improving';
        else if (change > 10) trend = 'degrading';
        
        insights.trends.push({
          metric: type,
          trend,
          change: Math.abs(change),
        });
      }
    });

    // Generate recommendations
    if (insights.issues.length === 0) {
      insights.recommendations.push('Performance is within acceptable ranges');
    } else {
      insights.recommendations.push('Monitor performance metrics regularly');
      insights.recommendations.push('Consider implementing performance budgets');
    }

    return insights;
  }

  /**
   * Export performance report
   */
  public exportPerformanceReport(): string {
    const report = {
      summary: this.getMetricsSummary(),
      insights: this.getPerformanceInsights(),
      recentMetrics: this.metrics.slice(-50), // Last 50 metrics
      thresholds: Array.from(this.thresholds.values()),
      timestamp: Date.now(),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Enable/disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.info(`Performance monitoring ${enabled ? 'enabled' : 'disabled'}`, null, 'PerformanceMonitor');
  }

  /**
   * Setup default performance thresholds
   */
  private setupDefaultThresholds(): void {
    this.addThreshold({
      type: MetricType.RENDER_TIME,
      name: 'component_render',
      warning: 16, // 60fps = 16ms
      critical: 33, // 30fps = 33ms
      unit: 'ms',
    });

    this.addThreshold({
      type: MetricType.NETWORK_REQUEST,
      name: 'http_request',
      warning: 2000,
      critical: 5000,
      unit: 'ms',
    });

    this.addThreshold({
      type: MetricType.WEBVIEW_LOAD,
      name: 'webview_load',
      warning: 3000,
      critical: 8000,
      unit: 'ms',
    });

    this.addThreshold({
      type: MetricType.MEMORY_USAGE,
      name: 'current_memory',
      warning: 200, // 200MB
      critical: 500, // 500MB
      unit: 'MB',
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Monitor WebView performance
    eventBus.addListener(EventType.WEBVIEW_LOAD_END, (payload) => {
      if (payload.data?.loadTime) {
        this.measureWebViewLoad(payload.data.url, payload.data.loadTime);
      }
    });

    // Monitor memory warnings
    eventBus.addListener(EventType.MEMORY_WARNING, () => {
      this.measureMemoryUsage();
    });
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): string {
    return JSON.stringify({
      summary: this.getMetricsSummary(),
      metrics: this.metrics,
      thresholds: Array.from(this.thresholds.values()),
    }, null, 2);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export convenience functions
export const recordMetric = (
  type: MetricType,
  name: string,
  value: number,
  unit?: string,
  metadata?: Record<string, any>,
  tags?: string[]
) => {
  performanceMonitor.recordMetric(type, name, value, unit, metadata, tags);
};

export const startTimer = (name: string, type?: MetricType) => {
  return performanceMonitor.startTimer(name, type);
};

export const measureRenderTime = (componentName: string, renderTime: number) => {
  performanceMonitor.measureRenderTime(componentName, renderTime);
};

export const measureNetworkRequest = (url: string, duration: number, statusCode?: number) => {
  performanceMonitor.measureNetworkRequest(url, duration, statusCode);
};
