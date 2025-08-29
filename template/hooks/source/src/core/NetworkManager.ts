import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { logger } from '../utils/Logger';
import { eventBus, EventType, emitEvent } from './EventBus';
import { AppConfiguration } from '../config/AppConfig';

/**
 * Network connection types
 */
export enum ConnectionType {
  NONE = 'none',
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
  BLUETOOTH = 'bluetooth',
  VPN = 'vpn',
  WIMAX = 'wimax',
  UNKNOWN = 'unknown',
}

/**
 * Network quality levels
 */
export enum NetworkQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  UNKNOWN = 'unknown',
}

/**
 * Network state interface
 */
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: ConnectionType;
  isExpensive: boolean;
  isMetered: boolean;
  strength: number | null;
  quality: NetworkQuality;
  details: {
    isConnectionExpensive?: boolean;
    cellularGeneration?: string;
    carrier?: string;
    ipAddress?: string;
    subnet?: string;
    gateway?: string;
    dns?: string[];
  };
  lastUpdated: number;
  connectionHistory: NetworkState[];
}

/**
 * Network event types
 */
export enum NetworkEventType {
  CONNECTION_CHANGED = 'connection_changed',
  QUALITY_CHANGED = 'quality_changed',
  CONNECTION_LOST = 'connection_lost',
  CONNECTION_RESTORED = 'connection_restored',
  EXPENSIVE_CONNECTION = 'expensive_connection',
  METERED_CONNECTION = 'metered_connection',
}

/**
 * Network event interface
 */
export interface NetworkEvent {
  type: NetworkEventType;
  previousState: NetworkState | null;
  currentState: NetworkState;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Comprehensive Network Manager with real-time monitoring
 */
class NetworkManager {
  private static instance: NetworkManager;
  private currentState: NetworkState;
  private subscription: NetInfoSubscription | null = null;
  private isMonitoring: boolean = false;
  private connectionHistory: NetworkState[] = [];
  private maxHistorySize: number = 100;
  private qualityThresholds = {
    excellent: { minStrength: 80, maxLatency: 50 },
    good: { minStrength: 60, maxLatency: 100 },
    fair: { minStrength: 40, maxLatency: 200 },
    poor: { minStrength: 0, maxLatency: Infinity },
  };
  private eventCallbacks: Array<(event: NetworkEvent) => void> = [];
  private lastPingTime: number = 0;
  private pingResults: number[] = [];

  private constructor() {
    this.currentState = this.getInitialState();
    this.setupEventListeners();
  }

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  /**
   * Get initial network state
   */
  private getInitialState(): NetworkState {
    return {
      isConnected: false,
      isInternetReachable: false,
      type: ConnectionType.NONE,
      isExpensive: false,
      isMetered: false,
      strength: null,
      quality: NetworkQuality.UNKNOWN,
      details: {},
      lastUpdated: Date.now(),
      connectionHistory: [],
    };
  }

  /**
   * Start network monitoring
   */
  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Network monitoring already started', null, 'NetworkManager');
      return;
    }

    try {
      // Get initial state
      const initialState = await NetInfo.fetch();
      this.updateState(this.mapNetInfoToState(initialState));

      // Subscribe to network changes
      this.subscription = NetInfo.addEventListener(this.handleNetworkChange.bind(this));
      
      this.isMonitoring = true;
      
      logger.info('Network monitoring started', {
        initialType: this.currentState.type,
        isConnected: this.currentState.isConnected,
      }, 'NetworkManager');

      // Emit initial state
      emitEvent(EventType.NETWORK_STATE_CHANGED, {
        source: 'NetworkManager',
        data: this.currentState,
      });

    } catch (error) {
      logger.error('Failed to start network monitoring', error as Error, null, 'NetworkManager');
      throw error;
    }
  }

  /**
   * Stop network monitoring
   */
  public stopMonitoring(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    
    this.isMonitoring = false;
    logger.info('Network monitoring stopped', null, 'NetworkManager');
  }

  /**
   * Handle network state changes
   */
  private async handleNetworkChange(state: NetInfoState): Promise<void> {
    const previousState = { ...this.currentState };
    const newState = this.mapNetInfoToState(state);
    
    // Update current state
    this.updateState(newState);

    // Create network event
    const networkEvent: NetworkEvent = {
      type: this.determineEventType(previousState, newState),
      previousState: previousState,
      currentState: newState,
      timestamp: Date.now(),
      metadata: this.generateEventMetadata(previousState, newState),
    };

    // Log the change
    logger.info('Network state changed', {
      from: previousState.type,
      to: newState.type,
      isConnected: newState.isConnected,
      quality: newState.quality,
    }, 'NetworkManager');

    // Emit events
    emitEvent(EventType.NETWORK_STATE_CHANGED, {
      source: 'NetworkManager',
      data: newState,
    });

    // Notify callbacks
    this.eventCallbacks.forEach(callback => {
      try {
        callback(networkEvent);
      } catch (error) {
        logger.error('Error in network event callback', error as Error, null, 'NetworkManager');
      }
    });

    // Perform quality assessment
    await this.assessNetworkQuality();
  }

  /**
   * Map NetInfo state to our NetworkState
   */
  private mapNetInfoToState(netInfoState: NetInfoState): NetworkState {
    const connectionType = this.mapConnectionType(netInfoState.type);
    const quality = this.assessQualityFromState(netInfoState);

    return {
      isConnected: netInfoState.isConnected ?? false,
      isInternetReachable: netInfoState.isInternetReachable ?? false,
      type: connectionType,
      isExpensive: netInfoState.details?.isConnectionExpensive ?? false,
      isMetered: this.isMeteredConnection(netInfoState),
      strength: this.getConnectionStrength(netInfoState),
      quality,
      details: {
        isConnectionExpensive: netInfoState.details?.isConnectionExpensive,
        cellularGeneration: (netInfoState.details as any)?.cellularGeneration,
        carrier: (netInfoState.details as any)?.carrier,
        ipAddress: (netInfoState.details as any)?.ipAddress,
        subnet: (netInfoState.details as any)?.subnet,
        gateway: (netInfoState.details as any)?.gateway,
        dns: (netInfoState.details as any)?.dns,
      },
      lastUpdated: Date.now(),
      connectionHistory: [...this.connectionHistory],
    };
  }

  /**
   * Map NetInfo connection type to our enum
   */
  private mapConnectionType(netInfoType: string | null): ConnectionType {
    switch (netInfoType) {
      case 'wifi':
        return ConnectionType.WIFI;
      case 'cellular':
        return ConnectionType.CELLULAR;
      case 'ethernet':
        return ConnectionType.ETHERNET;
      case 'bluetooth':
        return ConnectionType.BLUETOOTH;
      case 'vpn':
        return ConnectionType.VPN;
      case 'wimax':
        return ConnectionType.WIMAX;
      case 'none':
        return ConnectionType.NONE;
      default:
        return ConnectionType.UNKNOWN;
    }
  }

  /**
   * Assess network quality from NetInfo state
   */
  private assessQualityFromState(netInfoState: NetInfoState): NetworkQuality {
    if (!netInfoState.isConnected) {
      return NetworkQuality.UNKNOWN;
    }

    // For cellular, use generation as quality indicator
    if (netInfoState.type === 'cellular' && netInfoState.details?.cellularGeneration) {
      const generation = netInfoState.details.cellularGeneration.toLowerCase();
      if (generation.includes('5g')) return NetworkQuality.EXCELLENT;
      if (generation.includes('4g') || generation.includes('lte')) return NetworkQuality.GOOD;
      if (generation.includes('3g')) return NetworkQuality.FAIR;
      return NetworkQuality.POOR;
    }

    // For WiFi, assume good quality (could be enhanced with signal strength)
    if (netInfoState.type === 'wifi') {
      return NetworkQuality.GOOD;
    }

    return NetworkQuality.UNKNOWN;
  }

  /**
   * Check if connection is metered
   */
  private isMeteredConnection(netInfoState: NetInfoState): boolean {
    // Cellular connections are typically metered
    if (netInfoState.type === 'cellular') {
      return true;
    }

    // Check if connection is marked as expensive
    if (netInfoState.details?.isConnectionExpensive) {
      return true;
    }

    return false;
  }

  /**
   * Get connection strength (placeholder - would need platform-specific implementation)
   */
  private getConnectionStrength(netInfoState: NetInfoState): number | null {
    // This would require platform-specific implementation
    // For now, return null to indicate unknown strength
    return null;
  }

  /**
   * Determine event type based on state changes
   */
  private determineEventType(previous: NetworkState, current: NetworkState): NetworkEventType {
    if (!previous.isConnected && current.isConnected) {
      return NetworkEventType.CONNECTION_RESTORED;
    }
    
    if (previous.isConnected && !current.isConnected) {
      return NetworkEventType.CONNECTION_LOST;
    }
    
    if (previous.type !== current.type) {
      return NetworkEventType.CONNECTION_CHANGED;
    }
    
    if (previous.quality !== current.quality) {
      return NetworkEventType.QUALITY_CHANGED;
    }
    
    if (!previous.isExpensive && current.isExpensive) {
      return NetworkEventType.EXPENSIVE_CONNECTION;
    }
    
    if (!previous.isMetered && current.isMetered) {
      return NetworkEventType.METERED_CONNECTION;
    }
    
    return NetworkEventType.CONNECTION_CHANGED;
  }

  /**
   * Generate event metadata
   */
  private generateEventMetadata(previous: NetworkState, current: NetworkState): Record<string, any> {
    return {
      connectionDuration: this.getConnectionDuration(),
      qualityChange: previous.quality !== current.quality ? {
        from: previous.quality,
        to: current.quality,
      } : null,
      typeChange: previous.type !== current.type ? {
        from: previous.type,
        to: current.type,
      } : null,
    };
  }

  /**
   * Update current state and maintain history
   */
  private updateState(newState: NetworkState): void {
    this.currentState = newState;
    
    // Add to history
    this.connectionHistory.push(newState);
    if (this.connectionHistory.length > this.maxHistorySize) {
      this.connectionHistory.shift();
    }
  }

  /**
   * Assess network quality with ping test
   */
  private async assessNetworkQuality(): Promise<void> {
    if (!this.currentState.isConnected) {
      return;
    }

    try {
      const pingTime = await this.performPingTest();
      this.pingResults.push(pingTime);
      
      // Keep only last 10 ping results
      if (this.pingResults.length > 10) {
        this.pingResults.shift();
      }

      // Update quality based on ping results
      const avgPing = this.pingResults.reduce((a, b) => a + b, 0) / this.pingResults.length;
      const newQuality = this.calculateQualityFromPing(avgPing);
      
      if (newQuality !== this.currentState.quality) {
        this.currentState.quality = newQuality;
        this.currentState.lastUpdated = Date.now();
        
        logger.info('Network quality updated', {
          quality: newQuality,
          avgPing: avgPing,
        }, 'NetworkManager');
      }
    } catch (error) {
      logger.warn('Failed to assess network quality', { error }, 'NetworkManager');
    }
  }

  /**
   * Perform ping test to assess network quality
   */
  private async performPingTest(): Promise<number> {
    const startTime = Date.now();
    
    try {
      // Simple ping test using fetch
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
      });
      
      if (!response.ok) {
        throw new Error('Ping test failed');
      }
      
      return Date.now() - startTime;
    } catch (error) {
      // Return a high ping time for failed tests
      return 1000;
    }
  }

  /**
   * Calculate quality from ping time
   */
  private calculateQualityFromPing(pingTime: number): NetworkQuality {
    if (pingTime < 50) return NetworkQuality.EXCELLENT;
    if (pingTime < 100) return NetworkQuality.GOOD;
    if (pingTime < 200) return NetworkQuality.FAIR;
    return NetworkQuality.POOR;
  }

  /**
   * Get current network state
   */
  public getCurrentState(): NetworkState {
    return { ...this.currentState };
  }

  /**
   * Check if currently connected
   */
  public isConnected(): boolean {
    return this.currentState.isConnected;
  }

  /**
   * Check if internet is reachable
   */
  public isInternetReachable(): boolean {
    return this.currentState.isInternetReachable;
  }

  /**
   * Get connection type
   */
  public getConnectionType(): ConnectionType {
    return this.currentState.type;
  }

  /**
   * Get network quality
   */
  public getNetworkQuality(): NetworkQuality {
    return this.currentState.quality;
  }

  /**
   * Check if connection is expensive
   */
  public isExpensiveConnection(): boolean {
    return this.currentState.isExpensive;
  }



  /**
   * Get connection duration
   */
  public getConnectionDuration(): number {
    if (this.connectionHistory.length < 2) {
      return 0;
    }
    
    const firstConnection = this.connectionHistory.find(state => state.isConnected);
    if (!firstConnection) {
      return 0;
    }
    
    return Date.now() - firstConnection.lastUpdated;
  }

  /**
   * Add network event listener
   */
  public onNetworkEvent(callback: (event: NetworkEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Remove network event listener
   */
  public removeNetworkEventListener(callback: (event: NetworkEvent) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * Get connection history
   */
  public getConnectionHistory(): NetworkState[] {
    return [...this.connectionHistory];
  }

  /**
   * Clear connection history
   */
  public clearConnectionHistory(): void {
    this.connectionHistory = [];
    logger.info('Connection history cleared', null, 'NetworkManager');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for app state changes to optimize monitoring
    eventBus.addListener(EventType.APP_STATE_CHANGED, (payload) => {
      if (payload.data === 'background') {
        // Could reduce monitoring frequency in background
        logger.debug('App went to background, adjusting network monitoring', null, 'NetworkManager');
      } else if (payload.data === 'active') {
        // Resume full monitoring when app becomes active
        logger.debug('App became active, resuming full network monitoring', null, 'NetworkManager');
      }
    });
  }

  /**
   * Export network statistics
   */
  public exportNetworkStats(): string {
    const stats = {
      currentState: this.currentState,
      connectionHistory: this.connectionHistory,
      pingResults: this.pingResults,
      averagePing: this.pingResults.length > 0 
        ? this.pingResults.reduce((a, b) => a + b, 0) / this.pingResults.length 
        : null,
      connectionDuration: this.getConnectionDuration(),
      isMonitoring: this.isMonitoring,
    };

    return JSON.stringify(stats, null, 2);
  }
}

// Export singleton instance
export const networkManager = NetworkManager.getInstance();

// Export convenience functions
export const startNetworkMonitoring = () => networkManager.startMonitoring();
export const stopNetworkMonitoring = () => networkManager.stopMonitoring();
export const getNetworkState = () => networkManager.getCurrentState();
export const isNetworkConnected = () => networkManager.isConnected();
export const getNetworkQuality = () => networkManager.getNetworkQuality();
export const onNetworkChange = (callback: (event: NetworkEvent) => void) => {
  networkManager.onNetworkEvent(callback);
};
