import { logger } from '../utils/Logger';

/**
 * Simple EventEmitter implementation for React Native
 */
class SimpleEventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) return false;
    this.events[event].forEach(listener => listener(...args));
    return true;
  }

  removeListener(event: string, listener: Function): void {
    if (!this.events[event]) return;
    const index = this.events[event].indexOf(listener);
    if (index !== -1) {
      this.events[event].splice(index, 1);
    }
  }

  removeAllListeners(): void {
    this.events = {};
  }
}

/**
 * Event types for the application
 */
export enum EventType {
  // WebView Events
  WEBVIEW_LOAD_START = 'webview:load:start',
  WEBVIEW_LOAD_END = 'webview:load:end',
  WEBVIEW_ERROR = 'webview:error',
  WEBVIEW_NAVIGATION = 'webview:navigation',
  WEBVIEW_MESSAGE = 'webview:message',
  
  // App Lifecycle Events
  APP_INITIALIZED = 'app:initialized',
  APP_STATE_CHANGED = 'app:state:changed',
  APP_ERROR = 'app:error',
  
  // Theme Events
  THEME_CHANGED = 'theme:changed',
  THEME_SYSTEM_CHANGED = 'theme:system:changed',
  
  // Network Events
  NETWORK_CONNECTED = 'network:connected',
  NETWORK_DISCONNECTED = 'network:disconnected',
  NETWORK_TYPE_CHANGED = 'network:type:changed',
  NETWORK_STATE_CHANGED = 'network:state:changed',
  
  // Performance Events
  PERFORMANCE_METRIC = 'performance:metric',
  MEMORY_WARNING = 'memory:warning',
  
  // Analytics Events
  ANALYTICS_EVENT = 'analytics:event',
  USER_ACTION = 'user:action',
  
  // Deep Linking Events
  DEEP_LINK_INITIALIZED = 'deep_link:initialized',
  DEEP_LINK_PROCESSED = 'deep_link:processed',
  DEEP_LINK_REDIRECTED = 'deep_link:redirected',
  
  // Accessibility Events
  ACCESSIBILITY_STATE_CHANGED = 'accessibility:state:changed',
  ACCESSIBILITY_EVENT = 'accessibility:event',
  
  // Offline Events
  OFFLINE_STORAGE_INITIALIZED = 'offline:storage:initialized',
  OFFLINE_DATA_STORED = 'offline:data:stored',
  OFFLINE_DATA_CLEARED = 'offline:data:cleared',
  OFFLINE_SYNC_STARTED = 'offline:sync:started',
  OFFLINE_SYNC_COMPLETED = 'offline:sync:completed',
  OFFLINE_SYNC_FAILED = 'offline:sync:failed',
  
  // Error Events
  ERROR_REPORTED = 'error:reported',
  CRASH_DETECTED = 'crash:detected',
}

/**
 * Event payload interface
 */
export interface EventPayload {
  timestamp: number;
  source: string;
  data?: any;
  metadata?: Record<string, any>;
}

/**
 * Event listener interface
 */
export interface EventListener {
  type: EventType;
  handler: (payload: EventPayload) => void;
  priority?: number;
  once?: boolean;
}

/**
 * Advanced Event Bus with priority, filtering, and middleware support
 */
class EventBus extends SimpleEventEmitter {
  private static instance: EventBus;
  private listeners: Map<EventType, EventListener[]> = new Map();
  private middleware: Array<(event: EventType, payload: EventPayload) => EventPayload> = [];
  private performanceMetrics: Map<string, number[]> = new Map();
  private isEnabled: boolean = true;

  private constructor() {
    super();
    this.setupDefaultHandlers();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Add middleware for event processing
   */
  public addMiddleware(middleware: (event: EventType, payload: EventPayload) => EventPayload): void {
    this.middleware.push(middleware);
  }

  /**
   * Emit event with advanced features
   */
  public emit(event: EventType, payload: EventPayload): boolean {
    if (!this.isEnabled) return false;

    const startTime = Date.now();
    
    // Apply middleware
    let processedPayload = { ...payload };
    for (const middleware of this.middleware) {
      processedPayload = middleware(event, processedPayload);
    }

    // Track performance
    this.trackPerformance(event, startTime);

    // Log event
    logger.debug(`Event emitted: ${event}`, processedPayload, 'EventBus');

    // Emit to listeners
    const result = super.emit(event, processedPayload);
    
    // Emit to global listeners
    this.emitToListeners(event, processedPayload);
    
    return result;
  }

  /**
   * Add event listener with priority
   */
  public addListener(
    type: EventType, 
    handler: (payload: EventPayload) => void, 
    priority: number = 0,
    once: boolean = false
  ): void {
    const listener: EventListener = { type, handler, priority, once };
    
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    
    const listeners = this.listeners.get(type)!;
    listeners.push(listener);
    
    // Sort by priority (higher priority first)
    listeners.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    logger.debug(`Listener added for ${type} with priority ${priority}`, null, 'EventBus');
  }

  /**
   * Remove event listener
   */
  public removeListener(type: EventType, handler: (payload: EventPayload) => void): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.findIndex(l => l.handler === handler);
      if (index !== -1) {
        listeners.splice(index, 1);
        logger.debug(`Listener removed for ${type}`, null, 'EventBus');
      }
    }
  }

  /**
   * Emit to registered listeners
   */
  private emitToListeners(event: EventType, payload: EventPayload): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    const toRemove: EventListener[] = [];

    for (const listener of listeners) {
      try {
        listener.handler(payload);
        
        if (listener.once) {
          toRemove.push(listener);
        }
      } catch (error) {
        logger.error(`Error in event listener for ${event}`, error as Error, null, 'EventBus');
      }
    }

    // Remove one-time listeners
    for (const listener of toRemove) {
      this.removeListener(event, listener.handler);
    }
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(event: EventType, startTime: number): void {
    const duration = Date.now() - startTime;
    
    if (!this.performanceMetrics.has(event)) {
      this.performanceMetrics.set(event, []);
    }
    
    const metrics = this.performanceMetrics.get(event)!;
    metrics.push(duration);
    
    // Keep only last 100 metrics
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get performance metrics for an event
   */
  public getPerformanceMetrics(event: EventType): { avg: number; min: number; max: number; count: number } {
    const metrics = this.performanceMetrics.get(event) || [];
    
    if (metrics.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    const sum = metrics.reduce((a, b) => a + b, 0);
    const avg = sum / metrics.length;
    const min = Math.min(...metrics);
    const max = Math.max(...metrics);
    
    return { avg, min, max, count: metrics.length };
  }

  /**
   * Setup default event handlers
   */
  private setupDefaultHandlers(): void {
    // Global error handler
    this.addListener(EventType.APP_ERROR, (payload) => {
      logger.error('Application error detected', payload.data, payload, 'EventBus');
    }, 1000);

    // Performance monitoring
    this.addListener(EventType.PERFORMANCE_METRIC, (payload) => {
      logger.info('Performance metric recorded', payload.data, 'EventBus');
    }, 500);

    // Memory warning handler
    this.addListener(EventType.MEMORY_WARNING, (payload) => {
      logger.warn('Memory warning received', payload.data, 'EventBus');
      // Could implement memory cleanup here
    }, 1000);
  }

  /**
   * Enable/disable event bus
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.info(`Event bus ${enabled ? 'enabled' : 'disabled'}`, null, 'EventBus');
  }

  /**
   * Clear all listeners
   */
  public clear(): void {
    this.listeners.clear();
    this.removeAllListeners();
    logger.info('Event bus cleared', null, 'EventBus');
  }

  /**
   * Get listener count for an event
   */
  public getListenerCount(type: EventType): number {
    const listeners = this.listeners.get(type);
    return listeners ? listeners.length : 0;
  }

  /**
   * Get all registered event types
   */
  public getRegisteredEvents(): EventType[] {
    return Array.from(this.listeners.keys());
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

// Export convenience functions
export const emitEvent = (type: EventType, payload: Omit<EventPayload, 'timestamp'>) => {
  eventBus.emit(type, {
    ...payload,
    timestamp: Date.now(),
  });
};

export const addEventListener = (
  type: EventType, 
  handler: (payload: EventPayload) => void, 
  priority?: number,
  once?: boolean
) => {
  eventBus.addListener(type, handler, priority, once);
};

export const removeEventListener = (type: EventType, handler: (payload: EventPayload) => void) => {
  eventBus.removeListener(type, handler);
};
