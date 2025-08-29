import { PerformanceConfig, PerformanceReport, PerformanceAlert } from '../types';
import type { PerformanceMetric, PerformanceThreshold } from '../../../core/PerformanceMonitor';
import { logger } from '../../../utils/Logger';

/**
 * Performance Utilities
 * Provides helper functions for performance operations
 */
export class PerformanceUtils {
  /**
   * Validate performance configuration
   */
  static validateConfig(config: PerformanceConfig): boolean {
    if (typeof config.enabled !== 'boolean') {
      logger.error('Invalid performance config: enabled must be boolean', new Error('Invalid config'), 'PerformanceUtils');
      return false;
    }

    if (typeof config.enableMonitoring !== 'boolean') {
      logger.error('Invalid performance config: enableMonitoring must be boolean', new Error('Invalid config'), 'PerformanceUtils');
      return false;
    }

    if (!Array.isArray(config.thresholds)) {
      logger.error('Invalid performance config: thresholds must be array', new Error('Invalid config'), 'PerformanceUtils');
      return false;
    }

    if (typeof config.maxMetrics !== 'number' || config.maxMetrics <= 0) {
      logger.error('Invalid performance config: maxMetrics must be positive number', new Error('Invalid config'), 'PerformanceUtils');
      return false;
    }

    return true;
  }

  /**
   * Calculate average from metrics
   */
  static calculateAverage(metrics: any[], metricName: string): number {
    const filteredMetrics = metrics.filter(m => m.name === metricName);
    
    if (filteredMetrics.length === 0) {
      return 0;
    }

    const sum = filteredMetrics.reduce((total, metric) => total + metric.value, 0);
    return sum / filteredMetrics.length;
  }

  /**
   * Calculate percentile from metrics
   */
  static calculatePercentile(metrics: any[], metricName: string, percentile: number): number {
    const filteredMetrics = metrics.filter(m => m.name === metricName);
    
    if (filteredMetrics.length === 0) {
      return 0;
    }

    const sortedValues = filteredMetrics.map(m => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    
    return sortedValues[index] || 0;
  }

  /**
   * Check if metric exceeds threshold
   */
  static exceedsThreshold(metric: any, threshold: any): boolean {
    return metric.value >= threshold.warning;
  }

  /**
   * Check if metric is critical
   */
  static isCritical(metric: any, threshold: any): boolean {
    return metric.value >= threshold.critical;
  }

  /**
   * Format performance metric for display
   */
  static formatMetric(metric: any): string {
    return `${metric.name}: ${metric.value}${metric.unit}`;
  }

  /**
   * Get performance trend
   */
  static getPerformanceTrend(metrics: any[], metricName: string, period: number): 'improving' | 'stable' | 'degrading' {
    const now = Date.now();
    const recentMetrics = metrics.filter(m => 
      m.name === metricName && 
      (now - m.timestamp) <= period
    );

    if (recentMetrics.length < 2) {
      return 'stable';
    }

    const sortedMetrics = recentMetrics.sort((a, b) => a.timestamp - b.timestamp);
    const firstHalf = sortedMetrics.slice(0, Math.floor(sortedMetrics.length / 2));
    const secondHalf = sortedMetrics.slice(Math.floor(sortedMetrics.length / 2));

    const firstAvg = this.calculateAverage(firstHalf, metricName);
    const secondAvg = this.calculateAverage(secondHalf, metricName);

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change < -5) return 'improving';
    if (change > 5) return 'degrading';
    return 'stable';
  }

  /**
   * Generate performance alert
   */
  static generateAlert(
    metric: any, 
    threshold: any, 
    type: 'threshold_exceeded' | 'memory_warning' | 'slow_operation'
  ): PerformanceAlert {
    const severity = this.isCritical(metric, threshold) ? 'critical' : 'high';
    
    let message = '';
    switch (type) {
      case 'threshold_exceeded':
        message = `${metric.name} exceeded threshold: ${metric.value}${metric.unit} (threshold: ${threshold.warning}${threshold.unit})`;
        break;
      case 'memory_warning':
        message = `High memory usage detected: ${metric.value}${metric.unit}`;
        break;
      case 'slow_operation':
        message = `Slow operation detected: ${metric.name} took ${metric.value}${metric.unit}`;
        break;
    }

    return {
      type,
      metric,
      threshold,
      severity,
      message,
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze performance metrics
   */
  static analyzeMetrics(metrics: any[]): {
    slowestOperations: any[];
    memoryIssues: any[];
    networkIssues: any[];
    recommendations: string[];
  } {
    const slowestOperations = metrics
      .filter(m => m.type === 'render_time' || m.type === 'component_mount')
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const memoryIssues = metrics
      .filter(m => m.type === 'memory_usage' && m.value > 200)
      .sort((a, b) => b.value - a.value);

    const networkIssues = metrics
      .filter(m => m.type === 'network_request' && m.value > 5000)
      .sort((a, b) => b.value - a.value);

    const recommendations: string[] = [];

    if (slowestOperations.length > 0) {
      recommendations.push('Consider optimizing slow rendering operations');
    }

    if (memoryIssues.length > 0) {
      recommendations.push('Monitor memory usage and implement cleanup strategies');
    }

    if (networkIssues.length > 0) {
      recommendations.push('Optimize network requests and implement caching');
    }

    return {
      slowestOperations,
      memoryIssues,
      networkIssues,
      recommendations,
    };
  }

  /**
   * Generate performance report
   */
  static generateReport(
    metrics: any[],
    thresholds: any[]
  ): PerformanceReport {
    const analysis = this.analyzeMetrics(metrics);
    
    const averageResponseTime = this.calculateAverage(
      metrics.filter(m => m.type === 'network_request'),
      'http_request'
    );

    const memoryUsage = this.calculateAverage(
      metrics.filter(m => m.type === 'memory_usage'),
      'current_memory'
    );

    const exceededThresholds = thresholds.filter(threshold => {
      const metric = metrics.find(m => `${m.type}.${m.name}` === `${threshold.type}.${threshold.name}`);
      return metric && this.exceedsThreshold(metric, threshold);
    });

    const withinThresholds = thresholds.filter(threshold => {
      const metric = metrics.find(m => `${m.type}.${m.name}` === `${threshold.type}.${threshold.name}`);
      return metric && !this.exceedsThreshold(metric, threshold);
    });

    return {
      summary: {
        totalMetrics: metrics.length,
        averageResponseTime,
        memoryUsage,
        cpuUsage: 0, // Would need platform-specific implementation
        timestamp: Date.now(),
      },
      metrics,
      insights: analysis,
      thresholds: {
        exceeded: exceededThresholds,
        within: withinThresholds,
      },
    };
  }

  /**
   * Get performance score (0-100)
   */
  static getPerformanceScore(metrics: PerformanceMetric[], thresholds: PerformanceThreshold[]): number {
    let score = 100;
    let totalChecks = 0;

    thresholds.forEach(threshold => {
      const metric = metrics.find(m => `${m.type}.${m.name}` === `${threshold.type}.${threshold.name}`);
      if (metric) {
        totalChecks++;
        
        if (this.isCritical(metric, threshold)) {
          score -= 20;
        } else if (this.exceedsThreshold(metric, threshold)) {
          score -= 10;
        }
      }
    });

    // Normalize score based on number of checks
    if (totalChecks > 0) {
      score = Math.max(0, score);
    }

    return score;
  }

  /**
   * Format performance score
   */
  static formatPerformanceScore(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Poor';
    return 'Critical';
  }

  /**
   * Get performance score color
   */
  static getPerformanceScoreColor(score: number): string {
    if (score >= 90) return '#34C759'; // Green
    if (score >= 80) return '#30D158'; // Light Green
    if (score >= 70) return '#FF9500'; // Orange
    if (score >= 60) return '#FF3B30'; // Red
    return '#FF0000'; // Bright Red
  }
}
