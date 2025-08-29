import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { ErrorComponentProps, WebViewError } from '../../types/index';

/**
 * Professional error component for displaying WebView errors
 */
export const ErrorComponent = ({
  error,
  onRetry,
  onGoBack,
  showRetryButton = true,
  showGoBackButton = true,
  customMessages,
  testID = 'error-component',
  style,
}: ErrorComponentProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleRetry = () => {
    onRetry?.();
  };

  const handleGoBack = () => {
    onGoBack?.();
  };

  const getErrorMessage = (error: WebViewError): string => {
    // Check for custom messages first
    if (customMessages) {
      switch (error.code) {
        case -1001: // NSURLErrorTimedOut
          return customMessages?.timeout || 'Request timed out. Please check your internet connection and try again.';
        case -1009: // NSURLErrorNotConnectedToInternet
          return customMessages?.network || 'No internet connection. Please check your network settings.';
        case -1011: // NSURLErrorBadServerResponse
          return customMessages?.server || 'Server error. Please try again later.';
      }
    }

    switch (error.code) {
      case -1001: // NSURLErrorTimedOut
        return 'Request timed out. Please check your internet connection and try again.';
      case -1003: // NSURLErrorCannotFindHost
        return 'Unable to find the server. Please check the URL and try again.';
      case -1004: // NSURLErrorCannotConnectToHost
        return 'Unable to connect to the server. Please check your internet connection.';
      case -1009: // NSURLErrorNotConnectedToInternet
        return 'No internet connection. Please check your network settings.';
      case -1011: // NSURLErrorBadServerResponse
        return 'Server error. Please try again later.';
      case -1012: // NSURLErrorUserCancelledAuthentication
        return 'Authentication cancelled. Please try again.';
      case -1013: // NSURLErrorUserAuthenticationRequired
        return 'Authentication required. Please log in and try again.';
      case -1014: // NSURLErrorZeroByteResource
        return 'The requested resource is empty.';
      case -1015: // NSURLErrorCannotDecodeRawData
        return 'Unable to decode the response. Please try again.';
      case -1016: // NSURLErrorCannotDecodeContentData
        return 'Unable to decode the content. Please try again.';
      case -1017: // NSURLErrorCannotParseResponse
        return 'Unable to parse the server response. Please try again.';
      case -1018: // NSURLErrorInternationalRoamingOff
        return 'International roaming is disabled. Please enable it or connect to WiFi.';
      case -1019: // NSURLErrorCallIsActive
        return 'Cannot connect while a call is active. Please end the call and try again.';
      case -1020: // NSURLErrorDataNotAllowed
        return 'Data usage is not allowed. Please check your data settings.';
      case -1021: // NSURLErrorRequestBodyStreamExhausted
        return 'Request body stream exhausted. Please try again.';
      case -1100: // NSURLErrorFileDoesNotExist
        return 'The requested file does not exist.';
      case -1101: // NSURLErrorFileIsDirectory
        return 'The requested resource is a directory.';
      case -1102: // NSURLErrorNoPermissionsToReadFile
        return 'No permission to read the file.';
      case -1103: // NSURLErrorSecureConnectionFailed
        return 'Secure connection failed. Please check your security settings.';
      case -1104: // NSURLErrorServerCertificateHasBadDate
        return 'Server certificate has an invalid date.';
      case -1105: // NSURLErrorServerCertificateUntrusted
        return 'Server certificate is not trusted.';
      case -1106: // NSURLErrorServerCertificateHasUnknownRoot
        return 'Server certificate has an unknown root.';
      case -1107: // NSURLErrorServerCertificateNotYetValid
        return 'Server certificate is not yet valid.';
      case -1108: // NSURLErrorClientCertificateRejected
        return 'Client certificate was rejected.';
      case -1109: // NSURLErrorClientCertificateRequired
        return 'Client certificate is required.';
      case -1110: // NSURLErrorCannotLoadFromNetwork
        return 'Cannot load from network. Please check your connection.';
      case -1111: // NSURLErrorCannotCreateFile
        return 'Cannot create file. Please check your storage permissions.';
      case -1112: // NSURLErrorCannotOpenFile
        return 'Cannot open file. Please check your file permissions.';
      case -1113: // NSURLErrorCannotCloseFile
        return 'Cannot close file. Please try again.';
      case -1114: // NSURLErrorCannotWriteToFile
        return 'Cannot write to file. Please check your storage permissions.';
      case -1115: // NSURLErrorCannotRemoveFile
        return 'Cannot remove file. Please check your file permissions.';
      case -1116: // NSURLErrorCannotMoveFile
        return 'Cannot move file. Please check your file permissions.';
      case -1117: // NSURLErrorDownloadDecodingFailedMidStream
        return 'Download decoding failed. Please try again.';
      case -1118: // NSURLErrorDownloadDecodingFailedToComplete
        return 'Download decoding failed to complete. Please try again.';
      default:
        return error.description || 'An unexpected error occurred. Please try again.';
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.content}>
        <Text style={styles.icon} testID={`${testID}-icon`}>
          ⚠️
        </Text>
        
        <Text style={styles.title} testID={`${testID}-title`}>
          Connection Error
        </Text>
        
        <Text style={styles.message} testID={`${testID}-message`}>
          {getErrorMessage(error)}
        </Text>
        
        <Text style={styles.url} testID={`${testID}-url`}>
          {error.url}
        </Text>
        
        <View style={styles.buttonContainer}>
          {onRetry && showRetryButton && (
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={handleRetry}
              testID={`${testID}-retry-button`}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
          
          {onGoBack && showGoBackButton && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={handleGoBack}
              testID={`${testID}-back-button`}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.md,
    marginBottom: theme.spacing.md,
  },
  url: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '400',
    color: theme.colors.text.disabled,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  retryButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
  },
  backButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
  },
});

export default ErrorComponent;
