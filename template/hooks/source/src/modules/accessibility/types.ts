/**
 * Accessibility Module Types
 */

export interface AccessibilityState {
  isEnabled: boolean;
  isAccessibilityEnabled: boolean;
  isAssistiveTouchEnabled: boolean;
  isSwitchControlEnabled: boolean;
  isVoiceControlEnabled: boolean;
  isZoomEnabled: boolean;
  isIncreaseContrastEnabled: boolean;
}

export interface AccessibilityEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface AccessibilityAction {
  name: string;
  label: string;
  hint?: string;
  action: () => void;
}

export interface AccessibilityConfig {
  enabled: boolean;
  customActions: AccessibilityAction[];
  enableRecommendations: boolean;
  autoDetectFeatures: boolean;
  eventCallbacks: Array<(event: AccessibilityEvent) => void>;
  actionCallbacks: Array<(action: string) => void>;
}

/**
 * Accessibility recommendation interface
 */
export interface AccessibilityRecommendation {
  type: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  category: 'screen_reader' | 'visual' | 'motor' | 'cognitive' | 'general';
}

/**
 * Accessibility report interface
 */
export interface AccessibilityReport {
  summary: {
    totalFeatures: number;
    enabledFeatures: number;
    disabledFeatures: number;
    recommendations: number;
    timestamp: number;
  };
  features: Array<{
    name: string;
    enabled: boolean;
    description: string;
  }>;
  recommendations: AccessibilityRecommendation[];
  actions: Array<{
    name: string;
    label: string;
    description: string;
  }>;
}

/**
 * Accessibility test result interface
 */
export interface AccessibilityTestResult {
  testName: string;
  passed: boolean;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  timestamp: number;
}

/**
 * Accessibility compliance level
 */
export enum AccessibilityComplianceLevel {
  A = 'A',
  AA = 'AA',
  AAA = 'AAA',
  NONE = 'none',
}

/**
 * Accessibility compliance report
 */
export interface AccessibilityComplianceReport {
  level: AccessibilityComplianceLevel;
  score: number; // 0-100
  passedTests: number;
  failedTests: number;
  totalTests: number;
  details: Array<{
    criterion: string;
    passed: boolean;
    description: string;
  }>;
}
