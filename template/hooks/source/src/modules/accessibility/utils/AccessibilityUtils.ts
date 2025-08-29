import { 
  AccessibilityConfig, 
  AccessibilityRecommendation,
  AccessibilityReport,
  AccessibilityTestResult,
  AccessibilityComplianceLevel,
  AccessibilityComplianceReport 
} from '../types';
import type { 
  AccessibilityState, 
  AccessibilityEvent, 
  AccessibilityAction 
} from '../../../core/AccessibilityManager';
import { logger } from '../../../utils/Logger';

/**
 * Accessibility Utilities
 * Provides helper functions for accessibility operations
 */
export class AccessibilityUtils {
  /**
   * Validate accessibility configuration
   */
  static validateConfig(config: AccessibilityConfig): boolean {
    if (typeof config.enabled !== 'boolean') {
      logger.error('Invalid accessibility config: enabled must be boolean', new Error('Invalid config'), 'AccessibilityUtils');
      return false;
    }

    if (typeof config.enableRecommendations !== 'boolean') {
      logger.error('Invalid accessibility config: enableRecommendations must be boolean', new Error('Invalid config'), 'AccessibilityUtils');
      return false;
    }

    if (typeof config.autoDetectFeatures !== 'boolean') {
      logger.error('Invalid accessibility config: autoDetectFeatures must be boolean', new Error('Invalid config'), 'AccessibilityUtils');
      return false;
    }

    if (!Array.isArray(config.customActions)) {
      logger.error('Invalid accessibility config: customActions must be array', new Error('Invalid config'), 'AccessibilityUtils');
      return false;
    }

    return true;
  }

  /**
   * Generate accessibility recommendations
   */
  static generateRecommendations(state: AccessibilityState): AccessibilityRecommendation[] {
    const recommendations: AccessibilityRecommendation[] = [];

    // Screen reader recommendations
    if (!state.isScreenReaderEnabled) {
      recommendations.push({
        type: 'screen_reader_support',
        priority: 'high',
        description: 'Screen reader support not detected',
        recommendation: 'Ensure all interactive elements have proper accessibility labels and hints',
        category: 'screen_reader',
      });
    }

    // High contrast recommendations
    if (state.isHighContrastEnabled) {
      recommendations.push({
        type: 'high_contrast_optimization',
        priority: 'medium',
        description: 'High contrast mode is enabled',
        recommendation: 'Ensure sufficient color contrast ratios and avoid relying solely on color for information',
        category: 'visual',
      });
    }

    // Reduce motion recommendations
    if (state.isReduceMotionEnabled) {
      recommendations.push({
        type: 'reduce_motion_optimization',
        priority: 'medium',
        description: 'Reduce motion is enabled',
        recommendation: 'Provide alternative animations or disable animations for users with motion sensitivity',
        category: 'motor',
      });
    }

    // Large text recommendations
    if (state.isLargeTextEnabled) {
      recommendations.push({
        type: 'large_text_optimization',
        priority: 'medium',
        description: 'Large text is enabled',
        recommendation: 'Ensure UI elements scale properly and text remains readable',
        category: 'visual',
      });
    }

    // Bold text recommendations
    if (state.isBoldTextEnabled) {
      recommendations.push({
        type: 'bold_text_optimization',
        priority: 'low',
        description: 'Bold text is enabled',
        recommendation: 'Ensure text remains readable and doesn\'t cause layout issues',
        category: 'visual',
      });
    }

    return recommendations;
  }

  /**
   * Generate accessibility report
   */
  static generateReport(
    state: AccessibilityState,
    recommendations: AccessibilityRecommendation[],
    actions: any[]
  ): AccessibilityReport {
    const enabledFeatures = Object.entries(state)
      .filter(([key, value]) => key.startsWith('is') && typeof value === 'boolean' && value)
      .map(([key]) => key.replace('is', '').replace('Enabled', '').toLowerCase());

    const disabledFeatures = Object.entries(state)
      .filter(([key, value]) => key.startsWith('is') && typeof value === 'boolean' && !value)
      .map(([key]) => key.replace('is', '').replace('Enabled', '').toLowerCase());

    return {
      summary: {
        totalFeatures: enabledFeatures.length + disabledFeatures.length,
        enabledFeatures: enabledFeatures.length,
        disabledFeatures: disabledFeatures.length,
        recommendations: recommendations.length,
        timestamp: Date.now(),
      },
      features: [
        ...enabledFeatures.map(name => ({
          name,
          enabled: true,
          description: `${name} accessibility feature is enabled`,
        })),
        ...disabledFeatures.map(name => ({
          name,
          enabled: false,
          description: `${name} accessibility feature is disabled`,
        })),
      ],
      recommendations,
      actions: actions.map(action => ({
        name: action.name,
        label: action.label,
        description: action.hint || `Custom accessibility action: ${action.name}`,
      })),
    };
  }

  /**
   * Run accessibility test
   */
  static runAccessibilityTest(testName: string, state: AccessibilityState): AccessibilityTestResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    switch (testName) {
      case 'screen_reader_compatibility':
        if (!state.isScreenReaderEnabled) {
          issues.push('Screen reader not detected');
          recommendations.push('Test with screen reader enabled');
          score -= 30;
        }
        break;

      case 'color_contrast':
        if (state.isHighContrastEnabled) {
          recommendations.push('Verify color contrast ratios meet WCAG guidelines');
          score -= 10;
        }
        break;

      case 'motion_sensitivity':
        if (state.isReduceMotionEnabled) {
          recommendations.push('Ensure animations respect reduce motion preference');
          score -= 15;
        }
        break;

      case 'text_scaling':
        if (state.isLargeTextEnabled) {
          recommendations.push('Test UI with large text enabled');
          score -= 10;
        }
        break;

      default:
        issues.push(`Unknown test: ${testName}`);
        score -= 50;
    }

    return {
      testName,
      passed: score >= 70,
      score,
      issues,
      recommendations,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate compliance report
   */
  static generateComplianceReport(
    state: AccessibilityState,
    tests: AccessibilityTestResult[]
  ): AccessibilityComplianceReport {
    const passedTests = tests.filter(test => test.passed).length;
    const failedTests = tests.filter(test => !test.passed).length;
    const totalTests = tests.length;

    const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    let level: AccessibilityComplianceLevel;
    if (score >= 95) {
      level = AccessibilityComplianceLevel.AAA;
    } else if (score >= 85) {
      level = AccessibilityComplianceLevel.AA;
    } else if (score >= 70) {
      level = AccessibilityComplianceLevel.A;
    } else {
      level = AccessibilityComplianceLevel.NONE;
    }

    const details = tests.map(test => ({
      criterion: test.testName,
      passed: test.passed,
      description: test.issues.length > 0 ? test.issues.join(', ') : 'Test passed',
    }));

    return {
      level,
      score,
      passedTests,
      failedTests,
      totalTests,
      details,
    };
  }

  /**
   * Format accessibility feature name
   */
  static formatFeatureName(featureName: string): string {
    return featureName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Get accessibility feature description
   */
  static getFeatureDescription(featureName: string): string {
    const descriptions: Record<string, string> = {
      screenReader: 'Assistive technology for users with visual impairments',
      voiceOver: 'Apple\'s screen reader for iOS and macOS',
      talkBack: 'Google\'s screen reader for Android',
      largeText: 'Increased text size for better readability',
      boldText: 'Bold text rendering for enhanced visibility',
      highContrast: 'High contrast mode for better visibility',
      reduceMotion: 'Reduced motion for users with motion sensitivity',
      reduceTransparency: 'Reduced transparency for better visibility',
      increaseContrast: 'Increased contrast for better visibility',
      differentiateWithoutColor: 'Color-independent information display',
    };

    return descriptions[featureName] || `Accessibility feature: ${featureName}`;
  }

  /**
   * Get accessibility compliance level description
   */
  static getComplianceLevelDescription(level: AccessibilityComplianceLevel): string {
    switch (level) {
      case AccessibilityComplianceLevel.AAA:
        return 'Highest level of accessibility compliance (AAA)';
      case AccessibilityComplianceLevel.AA:
        return 'Standard level of accessibility compliance (AA)';
      case AccessibilityComplianceLevel.A:
        return 'Basic level of accessibility compliance (A)';
      case AccessibilityComplianceLevel.NONE:
        return 'No accessibility compliance achieved';
      default:
        return 'Unknown compliance level';
    }
  }

  /**
   * Get accessibility score color
   */
  static getAccessibilityScoreColor(score: number): string {
    if (score >= 95) return '#34C759'; // Green (AAA)
    if (score >= 85) return '#30D158'; // Light Green (AA)
    if (score >= 70) return '#FF9500'; // Orange (A)
    return '#FF3B30'; // Red (None)
  }

  /**
   * Check if accessibility feature is critical
   */
  static isCriticalFeature(featureName: string): boolean {
    const criticalFeatures = ['screenReader', 'voiceOver', 'talkBack'];
    return criticalFeatures.includes(featureName);
  }

  /**
   * Get accessibility feature priority
   */
  static getFeaturePriority(featureName: string): 'low' | 'medium' | 'high' {
    if (this.isCriticalFeature(featureName)) {
      return 'high';
    }

    const mediumPriorityFeatures = ['highContrast', 'reduceMotion', 'largeText'];
    if (mediumPriorityFeatures.includes(featureName)) {
      return 'medium';
    }

    return 'low';
  }
}
