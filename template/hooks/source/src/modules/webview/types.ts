/**
 * WebView Module Types
 */

/**
 * WebView state interface
 */
export interface WebViewState {
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  currentUrl: string;
  title: string;
  navigationHistory: string[];
}

/**
 * WebView error interface
 */
export interface WebViewError {
  code: string;
  description: string;
  url?: string;
  timestamp: number;
}

/**
 * WebView message interface
 */
export interface WebViewMessage {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * WebView component props
 */
export interface WebViewComponentProps {
  config: {
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
  };
  onStateChange?: (state: WebViewState) => void;
  onError?: (error: WebViewError) => void;
  onMessage?: (message: WebViewMessage) => void;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
}

/**
 * WebView configuration
 */
export interface WebViewConfig {
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
