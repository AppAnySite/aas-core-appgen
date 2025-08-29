/**
 * WebView Module Entry Point
 * 
 * This module provides WebView functionality and components.
 * All external access to WebView functionality should go through this entry point.
 */

// Import types
import type { WebViewConfig, WebViewState, WebViewError, WebViewMessage, WebViewComponentProps } from './types';

// Import the main feature class
import { WebViewFeature, createWebViewFeature } from './WebViewFeature';

// Import components
import WebViewComponent from './components/WebViewComponent';
import { SkeletonLoadingComponent } from './components/SkeletonLoadingComponent';

// Import the lazy loading manager
import { lazyLoadingManager, initializeLazyLoading, startLazyLoading, getLoadingState, getLoadingProgress, LoadingState } from './LazyLoadingManager';

// Re-export everything
export { WebViewFeature, createWebViewFeature, WebViewComponent, SkeletonLoadingComponent, lazyLoadingManager, initializeLazyLoading, startLazyLoading, getLoadingState, getLoadingProgress, LoadingState };
export type { WebViewConfig, WebViewState, WebViewError, WebViewMessage, WebViewComponentProps };

// Export the module configuration interface
export interface WebViewModuleConfig {
  enabled: boolean;
  url: string;
  title: string;
  userAgent?: string;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  startInLoadingState?: boolean;
  scalesPageToFit?: boolean;
  allowsInlineMediaPlayback?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  allowsFullscreenVideo?: boolean;
  mixedContentMode?: string;
  cacheEnabled?: boolean;
  cacheMode?: string;
  allowFileAccess?: boolean;
  allowUniversalAccessFromFileURLs?: boolean;
  allowFileAccessFromFileURLs?: boolean;
  pullToRefreshEnabled?: boolean;
  timeout?: number;
  retryAttempts?: number;
  offlineMessage?: string;
}

// Export the module interface
export interface WebViewModule {
  initialize(): Promise<void>;
  deinitialize(): Promise<void>;
  getConfig(): WebViewConfig;
  isFeatureEnabled(): boolean;
}

// Default export for the module
export default {
  WebViewFeature: WebViewFeature,
  createWebViewFeature: createWebViewFeature,
  WebViewComponent: WebViewComponent,
  SkeletonLoadingComponent: SkeletonLoadingComponent,
  lazyLoadingManager: lazyLoadingManager,
};
