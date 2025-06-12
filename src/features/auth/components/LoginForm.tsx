// src/features/auth/components/LoginForm.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  Paper,
  CircularProgress,
  FormHelperText,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import LanguageSelector from './LanguageSelector';

/**
 * Login form component with offline authentication support
 */
export const LoginForm: React.FC = () => {
  const { t } = useTranslation(['auth', 'common']);
  const { state, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: ''
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = {
      email: !email ? t('errors.emailRequired') : '',
      password: !password ? t('errors.passwordRequired') : ''
    };

    setFormErrors(errors);

    // If there are errors, don't proceed
    if (errors.email || errors.password) {
      return;
    }

    // Try to login
    await login({
      email,
      password,
      rememberDevice
    });
  };

  // Check if login is disabled (offline and not previously authenticated)
  const loginDisabled = state.offline.isOffline && !state.offline.offlineAuthenticated &&
    !authService.isOfflineAuthAvailable();

  return (
    <Paper elevation={3} sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" gutterBottom>
              {t('login.title')}
            </Typography>
            <LanguageSelector />
          </Box>

          {/* Show offline warning if applicable */}
          {state.offline.isOffline && (
            <Alert
              severity={loginDisabled ? "error" : "warning"}
              sx={{ mb: 3 }}
            >
              {loginDisabled
                ? t('messages.offlineUnavailable', { ns: 'common' })
                : t('messages.offlineAvailable', { ns: 'common' })
              }
            </Alert>
          )}

          {/* Show error message if login failed */}
          {state.error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
            >
              {state.error}
            </Alert>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit}>
            <TextField
              label={t('login.email', { ns: 'auth' })}
              variant="outlined"
              fullWidth
              margin="normal"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={state.isLoading || loginDisabled}
              autoComplete="email"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label={t('login.password', { ns: 'auth' })}
              variant="outlined"
              fullWidth
              margin="normal"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={state.isLoading || loginDisabled}
              autoComplete="current-password"
              InputLabelProps={{ shrink: true }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  disabled={state.isLoading || loginDisabled}
                  color="primary"
                />
              }
              label={t('login.rememberDevice', { ns: 'auth' })}
            />
            <FormHelperText>
              {t('login.rememberDeviceHelp', { ns: 'auth' })}
            </FormHelperText>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={state.isLoading || loginDisabled}
            >
              {state.isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                t('login.submitButton', { ns: 'auth' })
              )}
            </Button>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t('login.or', { ns: 'auth' })}
              </Typography>
            </Divider>

            {/* Offline login button - only show if available */}
            {state.offline.isOffline && authService.isOfflineAuthAvailable() && (
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                size="large"
                onClick={() => login({ email: '', password: '' })}
                disabled={state.isLoading}
              >
                {t('login.offlineLoginButton', { ns: 'auth' })}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </Paper>
  );
};

export default LoginForm;
