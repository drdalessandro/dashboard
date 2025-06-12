/**
 * ErrorBoundary Component - Enhanced Healthcare Platform Version
 * 
 * Catches React errors and prevents infinite loops or crashes
 * Provides user-friendly error messages and recovery options
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Box, Typography, Card, CardContent } from '@mui/material';
import { RefreshOutlined, ReportProblemOutlined } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Card sx={{ border: '1px solid', borderColor: 'error.main', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ReportProblemOutlined color="error" />
                <Typography variant="h6" color="error">
                  Something went wrong
                </Typography>
              </Box>
              
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  An unexpected error occurred while loading this page. This might be due to:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Network connectivity issues</li>
                  <li>Data synchronization problems</li>
                  <li>Temporary server issues</li>
                </ul>
              </Alert>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    Error: {this.state.error.message}
                  </Typography>
                  {this.state.errorInfo && (
                    <details style={{ marginTop: '8px' }}>
                      <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
                        Component Stack (Development)
                      </summary>
                      <pre style={{ fontSize: '11px', margin: '4px 0', whiteSpace: 'pre-wrap' }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshOutlined />}
                  onClick={this.handleRetry}
                  size="small"
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleReload}
                  size="small"
                >
                  Reload Page
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;