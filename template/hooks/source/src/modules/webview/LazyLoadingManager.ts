import { logger } from '../../utils/Logger';

/**
 * Lazy loading configuration interface
 */
export interface LazyLoadingConfig {
  enabled: boolean;
  strategy: 'progressive' | 'skeleton' | 'minimal' | 'custom';
  skeletonConfig: {
    enabled: boolean;
    backgroundColor: string;
    shimmerColor: string;
    animationDuration: number;
    showPlaceholder: boolean;
  };
  progressiveConfig: {
    enabled: boolean;
    preloadImages: boolean;
    preloadScripts: boolean;
    preloadStyles: boolean;
    priorityOrder: string[];
  };
  cacheConfig: {
    enabled: boolean;
    maxCacheSize: number;
    cacheExpiry: number;
    offlineSupport: boolean;
  };
  animationConfig: {
    type: 'fade' | 'slide' | 'scale' | 'custom';
    duration: number;
    easing: string;
    delay: number;
  };
  customLoadingStates: {
    initial: string;
    loading: string;
    error: string;
    success: string;
  };
}

/**
 * Loading state enum
 */
export enum LoadingState {
  INITIAL = 'initial',
  LOADING = 'loading',
  PROGRESSIVE = 'progressive',
  SKELETON = 'skeleton',
  SUCCESS = 'success',
  ERROR = 'error',
  CACHED = 'cached',
}

/**
 * Lazy loading manager for WebView content
 */
class LazyLoadingManager {
  private static instance: LazyLoadingManager;
  private config: LazyLoadingConfig | null = null;
  private currentState: LoadingState = LoadingState.INITIAL;
  private loadingProgress: number = 0;
  private cache: Map<string, any> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): LazyLoadingManager {
    if (!LazyLoadingManager.instance) {
      LazyLoadingManager.instance = new LazyLoadingManager();
    }
    return LazyLoadingManager.instance;
  }

  /**
   * Initialize lazy loading with configuration
   */
  public initialize(config: LazyLoadingConfig): void {
    this.config = config;
    this.currentState = LoadingState.INITIAL;
    this.loadingProgress = 0;

    logger.info('Lazy loading initialized', {
      strategy: config.strategy,
      enabled: config.enabled,
    }, 'LazyLoadingManager');
  }

  /**
   * Get current loading state
   */
  public getCurrentState(): LoadingState {
    return this.currentState;
  }

  /**
   * Get loading progress (0-100)
   */
  public getLoadingProgress(): number {
    return this.loadingProgress;
  }

  /**
   * Start lazy loading process
   */
  public startLoading(): void {
    if (!this.config?.enabled) {
      this.setState(LoadingState.SUCCESS);
      return;
    }

    this.setState(LoadingState.LOADING);
    this.loadingProgress = 0;

    // Start progressive loading based on strategy
    switch (this.config.strategy) {
      case 'progressive':
        this.startProgressiveLoading();
        break;
      case 'skeleton':
        this.startSkeletonLoading();
        break;
      case 'minimal':
        this.startMinimalLoading();
        break;
      case 'custom':
        this.startCustomLoading();
        break;
      default:
        this.startProgressiveLoading();
    }
  }

  /**
   * Set loading state and notify listeners
   */
  private setState(state: LoadingState): void {
    this.currentState = state;
    this.notifyListeners('stateChange', { state, progress: this.loadingProgress });
    
    logger.info('Loading state changed', {
      from: this.currentState,
      to: state,
      progress: this.loadingProgress,
    }, 'LazyLoadingManager');
  }

  /**
   * Update loading progress
   */
  public updateProgress(progress: number): void {
    this.loadingProgress = Math.min(100, Math.max(0, progress));
    this.notifyListeners('progressUpdate', { 
      state: this.currentState, 
      progress: this.loadingProgress 
    });
  }

  /**
   * Start progressive loading strategy
   */
  private startProgressiveLoading(): void {
    if (!this.config?.progressiveConfig.enabled) {
      this.setState(LoadingState.SUCCESS);
      return;
    }

    // Simulate progressive loading steps
    const steps = [
      { name: 'Initializing', progress: 10 },
      { name: 'Loading HTML', progress: 30 },
      { name: 'Loading CSS', progress: 50 },
      { name: 'Loading JavaScript', progress: 70 },
      { name: 'Loading Images', progress: 90 },
      { name: 'Finalizing', progress: 100 },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        this.updateProgress(step.progress);
        logger.info(`Progressive loading: ${step.name}`, { progress: step.progress }, 'LazyLoadingManager');
        currentStep++;
      } else {
        clearInterval(interval);
        this.setState(LoadingState.SUCCESS);
      }
    }, 500);
  }

  /**
   * Start skeleton loading strategy
   */
  private startSkeletonLoading(): void {
    if (!this.config?.skeletonConfig.enabled) {
      this.setState(LoadingState.SUCCESS);
      return;
    }

    this.setState(LoadingState.SKELETON);
    
    // Simulate skeleton loading with shimmer effect
    setTimeout(() => {
      this.updateProgress(50);
    }, 1000);

    setTimeout(() => {
      this.updateProgress(100);
      this.setState(LoadingState.SUCCESS);
    }, 2000);
  }

  /**
   * Start minimal loading strategy
   */
  private startMinimalLoading(): void {
    this.setState(LoadingState.LOADING);
    
    // Quick minimal loading
    setTimeout(() => {
      this.updateProgress(100);
      this.setState(LoadingState.SUCCESS);
    }, 300);
  }

  /**
   * Start custom loading strategy
   */
  private startCustomLoading(): void {
    this.setState(LoadingState.LOADING);
    
    // Custom loading logic based on configuration
    const customStates = this.config?.customLoadingStates;
    if (customStates) {
      logger.info('Custom loading states', customStates, 'LazyLoadingManager');
    }

    // Simulate custom loading
    setTimeout(() => {
      this.updateProgress(100);
      this.setState(LoadingState.SUCCESS);
    }, 1000);
  }

  /**
   * Handle loading error
   */
  public handleError(error: Error): void {
    this.setState(LoadingState.ERROR);
    logger.error('Lazy loading error', error, null, 'LazyLoadingManager');
  }

  /**
   * Cache content for offline support
   */
  public cacheContent(key: string, content: any): void {
    if (!this.config?.cacheConfig.enabled) return;

    // Check cache size limit
    if (this.cache.size >= (this.config.cacheConfig.maxCacheSize || 100)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      content,
      timestamp: Date.now(),
      expiry: this.config.cacheConfig.cacheExpiry || 3600000, // 1 hour default
    });

    logger.info('Content cached', { key: String(key), cacheSize: this.cache.size }, 'LazyLoadingManager');
  }

  /**
   * Get cached content
   */
  public getCachedContent(key: string): any {
    if (!this.config?.cacheConfig.enabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache has expired
    if (Date.now() - cached.timestamp > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    this.setState(LoadingState.CACHED);
    logger.info('Cached content retrieved', { key: String(key) }, 'LazyLoadingManager');
    return cached.content;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    logger.info('Cache cleared', null, 'LazyLoadingManager');
  }

  /**
   * Add event listener
   */
  public addEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify event listeners
   */
  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Error in lazy loading listener', error as Error, null, 'LazyLoadingManager');
        }
      });
    }
  }

  /**
   * Get loading configuration
   */
  public getConfig(): LazyLoadingConfig | null {
    return this.config;
  }

  /**
   * Check if lazy loading is enabled
   */
  public isEnabled(): boolean {
    return this.config?.enabled || false;
  }

  /**
   * Get loading strategy
   */
  public getStrategy(): string {
    return this.config?.strategy ?? 'progressive';
  }

  /**
   * Reset loading state
   */
  public reset(): void {
    this.currentState = LoadingState.INITIAL;
    this.loadingProgress = 0;
    this.notifyListeners('reset', { state: this.currentState, progress: 0 });
  }
}

// Export singleton instance
export const lazyLoadingManager = LazyLoadingManager.getInstance();

// Export convenience functions
export const initializeLazyLoading = (config: LazyLoadingConfig) => lazyLoadingManager.initialize(config);
export const startLazyLoading = () => lazyLoadingManager.startLoading();
export const getLoadingState = () => lazyLoadingManager.getCurrentState();
export const getLoadingProgress = () => lazyLoadingManager.getLoadingProgress();
export const isLazyLoadingEnabled = () => lazyLoadingManager.isEnabled();
