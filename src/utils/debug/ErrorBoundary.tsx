import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createLogger } from '../logger';

const logger = createLogger('ErrorBoundary');

// Props for the fallback component
interface FallbackProps {
  error: Error;
  resetError: () => void;
}

// Define separate types for fallback options
type FallbackRenderFn = (props: FallbackProps) => React.ReactElement;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ReactElement | FallbackRenderFn;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component for Gandall Healthcare Platform
 * 
 * Catches JavaScript errors in child component tree and displays a fallback UI
 * instead of crashing the whole application. Essential for healthcare applications
 * where maintaining functionality is critical.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    logger.error('Component error:', error);
    logger.error('Component stack:', errorInfo.componentStack);

    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Render fallback UI
      if (fallback) {
        if (typeof fallback === 'function') {
          // TypeScript narrowing: if it's a function, treat it as our FallbackRenderFn
          return (fallback as FallbackRenderFn)({
            error,
            resetError: this.resetError
          });
        }
        // Otherwise it's a ReactElement
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong.</h2>
          <details>
            <summary>Error Details</summary>
            <p>{this.state.error?.toString()}</p>
          </details>
          <button
            onClick={this.resetError}
            style={{
              padding: '8px 16px',
              marginTop: '16px',
              background: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}
