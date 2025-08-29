/**
 * Shared Components Entry Point
 * 
 * This module provides shared UI components that can be used across all modules.
 */

// Import shared components
import { LoadingComponent } from './LoadingComponent';
import { ErrorComponent } from './ErrorComponent';
import { WatermarkComponent } from './WatermarkComponent';

// Re-export components
export { LoadingComponent, ErrorComponent, WatermarkComponent };

// Default export
export default {
  LoadingComponent,
  ErrorComponent,
  WatermarkComponent,
};
