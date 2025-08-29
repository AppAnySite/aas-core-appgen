import { logger } from '../utils/Logger';
import { eventBus, EventType, emitEvent } from './EventBus';

/**
 * Accessibility features
 */
export enum AccessibilityFeature {
  SCREEN_READER = 'screen_reader',
  VOICE_OVER = 'voice_over',
  TALK_BACK = 'talk_back',
  LARGE_TEXT = 'large_text',
  BOLD_TEXT = 'bold_text',
  HIGH_CONTRAST = 'high_contrast',
  REDUCE_MOTION = 'reduce_motion',
  REDUCE_TRANSPARENCY = 'reduce_transparency',
  INCREASE_CONTRAST = 'increase_contrast',
  DIFFERENTIATE_WITHOUT_COLOR = 'differentiate_without_color',
}

/**
 * Accessibility event types
 */
export enum AccessibilityEventType {
  FEATURE_CHANGED = 'feature_changed',
  SCREEN_READER_ACTIVATED = 'screen_reader_activated',
  SCREEN_READER_DEACTIVATED = 'screen_reader_deactivated',
  ACCESSIBILITY_FOCUS_CHANGED = 'accessibility_focus_changed',
  ACCESSIBILITY_ACTION_PERFORMED = 'accessibility_action_performed',
}

/**
 * Accessibility state interface
 */
export interface AccessibilityState {
  isScreenReaderEnabled: boolean;
  isVoiceOverEnabled: boolean;
  isTalkBackEnabled: boolean;
  isLargeTextEnabled: boolean;
  isBoldTextEnabled: boolean;
  isHighContrastEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  isIncreaseContrastEnabled: boolean;
  isDifferentiateWithoutColorEnabled: boolean;
  activeFeatures: AccessibilityFeature[];
  lastUpdated: number;
}

/**
 * Accessibility event interface
 */
export interface AccessibilityEvent {
  type: AccessibilityEventType;
  feature?: AccessibilityFeature;
  data?: any;
  timestamp: number;
}

/**
 * Accessibility action interface
 */
export interface AccessibilityAction {
  name: string;
  label: string;
  hint?: string;
  action: () => void;
}

/**
 * Comprehensive Accessibility Manager
 */
class AccessibilityManager {
  private static instance: AccessibilityManager;
  private state: AccessibilityState;
  private eventCallbacks: Array<(event: AccessibilityEvent) => void> = [];
  private actionCallbacks: Array<(action: string) => void> = [];
  private isEnabled: boolean = true;
  private accessibilityActions: Map<string, AccessibilityAction> = new Map();

  private constructor() {
    this.state = this.getInitialState();
    this.setupEventListeners();
  }

  public static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  /**
   * Get initial accessibility state
   */
  private getInitialState(): AccessibilityState {
    return {
      isScreenReaderEnabled: false,
      isVoiceOverEnabled: false,
      isTalkBackEnabled: false,
      isLargeTextEnabled: false,
      isBoldTextEnabled: false,
      isHighContrastEnabled: false,
      isReduceMotionEnabled: false,
      isReduceTransparencyEnabled: false,
      isIncreaseContrastEnabled: false,
      isDifferentiateWithoutColorEnabled: false,
      activeFeatures: [],
      lastUpdated: Date.now(),
    };
  }

  /**
   * Initialize accessibility manager
   */
  public async initialize(): Promise<void> {
    try {
      // In a real app, you would check actual accessibility settings
      // For now, we'll simulate the detection
      await this.detectAccessibilityFeatures();
      
      logger.info('Accessibility manager initialized', {
        activeFeatures: this.state.activeFeatures,
        screenReaderEnabled: this.state.isScreenReaderEnabled,
      }, 'AccessibilityManager');

      // Emit initial state
      emitEvent(EventType.ACCESSIBILITY_STATE_CHANGED, {
        source: 'AccessibilityManager',
        data: this.state,
      });

    } catch (error) {
      logger.error('Failed to initialize accessibility manager', error as Error, null, 'AccessibilityManager');
      throw error;
    }
  }

  /**
   * Detect accessibility features
   */
  private async detectAccessibilityFeatures(): Promise<void> {
    // In a real app, you would use platform-specific APIs
    // For now, we'll simulate detection
    
    // Simulate screen reader detection
    this.state.isScreenReaderEnabled = Math.random() > 0.7; // 30% chance
    this.state.isVoiceOverEnabled = this.state.isScreenReaderEnabled && Math.random() > 0.5;
    this.state.isTalkBackEnabled = this.state.isScreenReaderEnabled && !this.state.isVoiceOverEnabled;
    
    // Simulate other accessibility features
    this.state.isLargeTextEnabled = Math.random() > 0.8; // 20% chance
    this.state.isBoldTextEnabled = Math.random() > 0.9; // 10% chance
    this.state.isHighContrastEnabled = Math.random() > 0.85; // 15% chance
    this.state.isReduceMotionEnabled = Math.random() > 0.9; // 10% chance
    this.state.isReduceTransparencyEnabled = Math.random() > 0.95; // 5% chance
    this.state.isIncreaseContrastEnabled = Math.random() > 0.9; // 10% chance
    this.state.isDifferentiateWithoutColorEnabled = Math.random() > 0.95; // 5% chance
    
    // Update active features
    this.updateActiveFeatures();
    
    this.state.lastUpdated = Date.now();
  }

  /**
   * Update active features list
   */
  private updateActiveFeatures(): void {
    const activeFeatures: AccessibilityFeature[] = [];
    
    if (this.state.isScreenReaderEnabled) {
      activeFeatures.push(AccessibilityFeature.SCREEN_READER);
    }
    if (this.state.isVoiceOverEnabled) {
      activeFeatures.push(AccessibilityFeature.VOICE_OVER);
    }
    if (this.state.isTalkBackEnabled) {
      activeFeatures.push(AccessibilityFeature.TALK_BACK);
    }
    if (this.state.isLargeTextEnabled) {
      activeFeatures.push(AccessibilityFeature.LARGE_TEXT);
    }
    if (this.state.isBoldTextEnabled) {
      activeFeatures.push(AccessibilityFeature.BOLD_TEXT);
    }
    if (this.state.isHighContrastEnabled) {
      activeFeatures.push(AccessibilityFeature.HIGH_CONTRAST);
    }
    if (this.state.isReduceMotionEnabled) {
      activeFeatures.push(AccessibilityFeature.REDUCE_MOTION);
    }
    if (this.state.isReduceTransparencyEnabled) {
      activeFeatures.push(AccessibilityFeature.REDUCE_TRANSPARENCY);
    }
    if (this.state.isIncreaseContrastEnabled) {
      activeFeatures.push(AccessibilityFeature.INCREASE_CONTRAST);
    }
    if (this.state.isDifferentiateWithoutColorEnabled) {
      activeFeatures.push(AccessibilityFeature.DIFFERENTIATE_WITHOUT_COLOR);
    }
    
    this.state.activeFeatures = activeFeatures;
  }

  /**
   * Get current accessibility state
   */
  public getState(): AccessibilityState {
    return { ...this.state };
  }

  /**
   * Check if a specific feature is enabled
   */
  public isFeatureEnabled(feature: AccessibilityFeature): boolean {
    switch (feature) {
      case AccessibilityFeature.SCREEN_READER:
        return this.state.isScreenReaderEnabled;
      case AccessibilityFeature.VOICE_OVER:
        return this.state.isVoiceOverEnabled;
      case AccessibilityFeature.TALK_BACK:
        return this.state.isTalkBackEnabled;
      case AccessibilityFeature.LARGE_TEXT:
        return this.state.isLargeTextEnabled;
      case AccessibilityFeature.BOLD_TEXT:
        return this.state.isBoldTextEnabled;
      case AccessibilityFeature.HIGH_CONTRAST:
        return this.state.isHighContrastEnabled;
      case AccessibilityFeature.REDUCE_MOTION:
        return this.state.isReduceMotionEnabled;
      case AccessibilityFeature.REDUCE_TRANSPARENCY:
        return this.state.isReduceTransparencyEnabled;
      case AccessibilityFeature.INCREASE_CONTRAST:
        return this.state.isIncreaseContrastEnabled;
      case AccessibilityFeature.DIFFERENTIATE_WITHOUT_COLOR:
        return this.state.isDifferentiateWithoutColorEnabled;
      default:
        return false;
    }
  }

  /**
   * Check if screen reader is enabled
   */
  public isScreenReaderEnabled(): boolean {
    return this.state.isScreenReaderEnabled;
  }

  /**
   * Check if voice over is enabled
   */
  public isVoiceOverEnabled(): boolean {
    return this.state.isVoiceOverEnabled;
  }

  /**
   * Check if talk back is enabled
   */
  public isTalkBackEnabled(): boolean {
    return this.state.isTalkBackEnabled;
  }

  /**
   * Check if large text is enabled
   */
  public isLargeTextEnabled(): boolean {
    return this.state.isLargeTextEnabled;
  }

  /**
   * Check if high contrast is enabled
   */
  public isHighContrastEnabled(): boolean {
    return this.state.isHighContrastEnabled;
  }

  /**
   * Check if reduce motion is enabled
   */
  public isReduceMotionEnabled(): boolean {
    return this.state.isReduceMotionEnabled;
  }

  /**
   * Add accessibility action
   */
  public addAccessibilityAction(action: AccessibilityAction): void {
    this.accessibilityActions.set(action.name, action);
    logger.info('Accessibility action added', { name: action.name, label: action.label }, 'AccessibilityManager');
  }

  /**
   * Remove accessibility action
   */
  public removeAccessibilityAction(name: string): void {
    this.accessibilityActions.delete(name);
    logger.info('Accessibility action removed', { name }, 'AccessibilityManager');
  }

  /**
   * Get accessibility action
   */
  public getAccessibilityAction(name: string): AccessibilityAction | undefined {
    return this.accessibilityActions.get(name);
  }

  /**
   * Get all accessibility actions
   */
  public getAccessibilityActions(): AccessibilityAction[] {
    return Array.from(this.accessibilityActions.values());
  }

  /**
   * Perform accessibility action
   */
  public performAccessibilityAction(name: string): boolean {
    const action = this.accessibilityActions.get(name);
    if (action) {
      try {
        action.action();
        
        // Emit action performed event
        this.emitAccessibilityEvent(AccessibilityEventType.ACCESSIBILITY_ACTION_PERFORMED, {
          action: name,
          label: action.label,
        });
        
        // Notify callbacks
        this.actionCallbacks.forEach(callback => {
          try {
            callback(name);
          } catch (error) {
            logger.error('Error in accessibility action callback', error as Error, null, 'AccessibilityManager');
          }
        });
        
        logger.info('Accessibility action performed', { name, label: action.label }, 'AccessibilityManager');
        return true;
      } catch (error) {
        logger.error('Failed to perform accessibility action', error as Error, { name }, 'AccessibilityManager');
        return false;
      }
    }
    return false;
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
   * Emit accessibility event
   */
  private emitAccessibilityEvent(type: AccessibilityEventType, data?: any): void {
    const event: AccessibilityEvent = {
      type,
      data,
      timestamp: Date.now(),
    };

    // Notify callbacks
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('Error in accessibility event callback', error as Error, null, 'AccessibilityManager');
      }
    });

    // Emit global event
    emitEvent(EventType.ACCESSIBILITY_EVENT, {
      source: 'AccessibilityManager',
      data: event,
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for app state changes to recheck accessibility features
    eventBus.addListener(EventType.APP_STATE_CHANGED, (payload) => {
      if (payload.data === 'active') {
        // Recheck accessibility features when app becomes active
        this.detectAccessibilityFeatures();
      }
    });
  }

  /**
   * Get accessibility recommendations
   */
  public getAccessibilityRecommendations(): Array<{
    type: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }> {
    const recommendations: Array<{
      type: string;
      priority: 'low' | 'medium' | 'high';
      description: string;
      recommendation: string;
    }> = [];

    // Check for missing accessibility features
    if (!this.state.isScreenReaderEnabled) {
      recommendations.push({
        type: 'screen_reader_support',
        priority: 'high',
        description: 'Screen reader support not detected',
        recommendation: 'Ensure all interactive elements have proper accessibility labels and hints',
      });
    }

    if (this.state.isHighContrastEnabled) {
      recommendations.push({
        type: 'high_contrast_optimization',
        priority: 'medium',
        description: 'High contrast mode is enabled',
        recommendation: 'Ensure sufficient color contrast ratios and avoid relying solely on color for information',
      });
    }

    if (this.state.isReduceMotionEnabled) {
      recommendations.push({
        type: 'reduce_motion_optimization',
        priority: 'medium',
        description: 'Reduce motion is enabled',
        recommendation: 'Provide alternative animations or disable animations for users with motion sensitivity',
      });
    }

    if (this.state.isLargeTextEnabled) {
      recommendations.push({
        type: 'large_text_optimization',
        priority: 'medium',
        description: 'Large text is enabled',
        recommendation: 'Ensure UI elements scale properly and text remains readable',
      });
    }

    return recommendations;
  }

  /**
   * Export accessibility report
   */
  public exportAccessibilityReport(): string {
    const report = {
      state: this.state,
      actions: this.getAccessibilityActions().map(action => ({
        name: action.name,
        label: action.label,
        hint: action.hint,
      })),
      recommendations: this.getAccessibilityRecommendations(),
      timestamp: Date.now(),
    };

    return JSON.stringify(report, null, 2);
  }
}

// Export singleton instance
export const accessibilityManager = AccessibilityManager.getInstance();

// Export convenience functions
export const initializeAccessibility = () => accessibilityManager.initialize();
export const getAccessibilityState = () => accessibilityManager.getState();
export const isScreenReaderEnabled = () => accessibilityManager.isScreenReaderEnabled();
export const isHighContrastEnabled = () => accessibilityManager.isHighContrastEnabled();
export const isReduceMotionEnabled = () => accessibilityManager.isReduceMotionEnabled();
export const addAccessibilityAction = (action: AccessibilityAction) => accessibilityManager.addAccessibilityAction(action);
export const performAccessibilityAction = (name: string) => accessibilityManager.performAccessibilityAction(name);
export const onAccessibilityEvent = (callback: (event: AccessibilityEvent) => void) => {
  accessibilityManager.onAccessibilityEvent(callback);
};
