// src/components/ui/feedback/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Default fallback UI for error states
 */
const DefaultFallback = ({
  error,
  errorInfo,
  resetErrorBoundary
}: {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetErrorBoundary: () => void;
}) => {
  // Get translation function directly since we can't use hooks in class components
  const { t } = useTranslation();

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        m: 2,
        maxWidth: '100%',
        overflow: 'auto',
        border: '1px solid #ffa6a6',
        backgroundColor: '#FFFFFF'
      }}
    >
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('common.errorBoundary.title')}
        </Typography>
        <Typography variant="body2">
          {t('common.errorBoundary.description')}
        </Typography>
      </Alert>

      {error && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="error" gutterBottom>
            {t('common.errorBoundary.errorMessage')}:
          </Typography>
          <Typography variant="body2" component="code"
            sx={{
              display: 'block',
              p: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 1,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {error.toString()}
          </Typography>
        </Box>
      )}

      {errorInfo && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="error" gutterBottom>
            {t('common.errorBoundary.stackTrace')}:
          </Typography>
          <Typography variant="body2" component="code"
            sx={{
              display: 'block',
              p: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 1,
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              maxHeight: '200px',
              wordBreak: 'break-word'
            }}
          >
            {errorInfo.componentStack}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={resetErrorBoundary}
        >
          {t('common.errorBoundary.tryAgain')}
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.href = '/'}
        >
          {t('common.errorBoundary.backToHome')}
        </Button>
      </Box>
    </Paper>
  );
};

/**
 * Error boundary component for catching and displaying errors gracefully
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Catch the error details
    this.setState({
      error,
      errorInfo
    });

    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // You could also log to a service like Sentry here
    // if (process.env.NODE_ENV === 'production') {
    //   captureException(error);
    // }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call any custom reset function provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Otherwise, use the default fallback
      return (
        <DefaultFallback
          error={error}
          errorInfo={errorInfo}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
