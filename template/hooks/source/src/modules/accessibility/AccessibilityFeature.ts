import { Feature, FeatureStatus } from '../../core/FeatureManager';
import { accessibilityManager, initializeAccessibility } from '../../core/AccessibilityManager';
import { 
  AccessibilityConfig, 
  AccessibilityRecommendation 
} from './types';
import type { 
  AccessibilityState, 
  AccessibilityEvent, 
  AccessibilityAction 
} from '../../core/AccessibilityManager';
import { AccessibilityUtils } from './utils/AccessibilityUtils';
import { logger } from '../../utils/Logger';
import { eventBus, EventType, emitEvent } from '../../core/EventBus';

/**
 * Accessibility Feature Implementation
 * Modular feature that can be independently controlled
 */
export class AccessibilityFeature implements Feature {
  public id = 'accessibility';
  public name = 'Accessibility Manager';
  public version = '1.0.0';
  public status: FeatureStatus = FeatureStatus.DISABLED;
  public dependencies: string[] = [];
  public config: AccessibilityConfig;

  private eventCallbacks: Array<(event: AccessibilityEvent) => void> = [];
  private actionCallbacks: Array<(action: string) => void> = [];

  constructor(config: AccessibilityConfig) {
    const defaultConfig: AccessibilityConfig = {
      enabled: true,
      customActions: [],
      enableRecommendations: true,
      autoDetectFeatures: true,
      eventCallbacks: [],
      actionCallbacks: [],
    };
    
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Initialize the accessibility feature
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Accessibility Feature', this.config, 'AccessibilityFeature');
      
      // Validate configuration
      if (!AccessibilityUtils.validateConfig(this.config)) {
        throw new Error('Invalid accessibility configuration');
      }

      // Initialize accessibility manager
      await initializeAccessibility();
      
      // Set up custom actions if configured
      if (this.config.customActions && Array.isArray(this.config.customActions)) {
              this.config.customActions.forEach((action: any) => {
        if (action.name && action.action) {
          accessibilityManager.addAccessibilityAction({
            name: action.name,
            label: action.label || action.name,
            hint: action.hint,
            action: action.action,
          } as any);
        }
      });
      }
      
      logger.info('Accessibility Feature initialized successfully', null, 'AccessibilityFeature');
      
    } catch (error) {
      logger.error('Failed to initialize Accessibility Feature', error as Error, null, 'AccessibilityFeature');
      throw error;
    }
  }

  /**
   * Deinitialize the accessibility feature
   */
  public async deinitialize(): Promise<void> {
    try {
      logger.info('Deinitializing Accessibility Feature', null, 'AccessibilityFeature');
      
      // Clear event callbacks
      this.eventCallbacks = [];
      this.actionCallbacks = [];
      
      logger.info('Accessibility Feature deinitialized successfully', null, 'AccessibilityFeature');
      
    } catch (error) {
      logger.error('Failed to deinitialize Accessibility Feature', error as Error, null, 'AccessibilityFeature');
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
  public getConfig(): AccessibilityConfig {
    return this.config;
  }

  /**
   * Get feature dependencies
   */
  public getDependencies(): string[] {
    return this.dependencies;
  }

  /**
   * Check if specific accessibility feature is enabled
   */
  public isFeatureEnabled(feature: string): boolean {
    // Convert string to AccessibilityFeature enum if needed
    return accessibilityManager.isFeatureEnabled(feature as any);
  }

  /**
   * Add custom accessibility action
   */
  public addAccessibilityAction(action: AccessibilityAction): void {
    if (this.isEnabled()) {
      accessibilityManager.addAccessibilityAction(action as any);
      this.config.customActions.push(action as any);
      
      logger.info(`Accessibility action added: ${action.name}`, null, 'AccessibilityFeature');
    }
  }

  /**
   * Remove accessibility action
   */
  public removeAccessibilityAction(name: string): void {
    if (this.isEnabled()) {
      accessibilityManager.removeAccessibilityAction(name);
      this.config.customActions = this.config.customActions.filter(action => action.name !== name);
      
      logger.info(`Accessibility action removed: ${name}`, null, 'AccessibilityFeature');
    }
  }

  /**
   * Perform accessibility action
   */
  public performAccessibilityAction(name: string): boolean {
    if (this.isEnabled()) {
      const success = accessibilityManager.performAccessibilityAction(name);
      
      if (success) {
        // Notify action callbacks
        this.actionCallbacks.forEach(callback => {
          try {
            callback(name);
          } catch (error) {
            logger.error('Error in accessibility action callback', error as Error, null, 'AccessibilityFeature');
          }
        });
      }
      
      return success;
    }
    return false;
  }

  /**
   * Get accessibility recommendations
   */
  public getAccessibilityRecommendations(): AccessibilityRecommendation[] {
    if (this.isEnabled() && this.config.enableRecommendations) {
      const state = accessibilityManager.getState();
      return AccessibilityUtils.generateRecommendations(state);
    }
    return [];
  }

  /**
   * Get accessibility report
   */
  public getAccessibilityReport(): string {
    if (this.isEnabled()) {
      return accessibilityManager.exportAccessibilityReport();
    }
    return 'Accessibility feature is disabled';
  }

  /**
   * Get current accessibility state
   */
  public getAccessibilityState(): AccessibilityState {
    return accessibilityManager.getState();
  }

  /**
   * Add accessibility event listener
   */
  public onAccessibilityEvent(callback: (event: AccessibilityEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Remove accessibility event listener
   */
  public removeAccessibilityEventListener(callback: (event: AccessibilityEvent) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * Add accessibility action listener
   */
  public onAccessibilityAction(callback: (action: string) => void): void {
    this.actionCallbacks.push(callback);
  }

  /**
   * Remove accessibility action listener
   */
  public removeAccessibilityActionListener(callback: (action: string) => void): void {
    const index = this.actionCallbacks.indexOf(callback);
    if (index > -1) {
      this.actionCallbacks.splice(index, 1);
    }
  }

  /**
   * Run accessibility test
   */
  public runAccessibilityTest(testName: string): any {
    if (this.isEnabled()) {
      const state = accessibilityManager.getState();
      return AccessibilityUtils.runAccessibilityTest(testName, state);
    }
    return null;
  }

  /**
   * Get accessibility compliance report
   */
  public getAccessibilityComplianceReport(): any {
    if (this.isEnabled()) {
      const state = accessibilityManager.getState();
      const tests = [
        this.runAccessibilityTest('screen_reader_compatibility'),
        this.runAccessibilityTest('color_contrast'),
        this.runAccessibilityTest('motion_sensitivity'),
        this.runAccessibilityTest('text_scaling'),
      ].filter(test => test !== null);
      
      return AccessibilityUtils.generateComplianceReport(state, tests);
    }
    return null;
  }

  /**
   * Check accessibility compliance level
   */
  public getComplianceLevel(): string {
    const report = this.getAccessibilityComplianceReport();
    return report ? report.level : 'NONE';
  }

  /**
   * Get accessibility score
   */
  public getAccessibilityScore(): number {
    const report = this.getAccessibilityComplianceReport();
    return report ? report.score : 0;
  }
}

// Export factory function for easy creation
export const createAccessibilityFeature = (config: AccessibilityConfig): AccessibilityFeature => {
  return new AccessibilityFeature(config);
};
