// src/components/error/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree.
 * Displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback || (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            m: 2,
            bgcolor: '#fff8f8',
            border: '1px solid #ffcdd2',
            borderRadius: 2
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>

          <Typography variant="body1" paragraph>
            The application encountered an error. This has been logged for investigation.
          </Typography>

          <Box sx={{ mt: 2, mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </Box>

          {process.env.NODE_ENV !== 'production' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Error Details (Development Only):
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: '200px', overflow: 'auto' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {this.state.error?.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre style={{ margin: 0, marginTop: '10px', whiteSpace: 'pre-wrap' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </Paper>
            </Box>
          )}
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
