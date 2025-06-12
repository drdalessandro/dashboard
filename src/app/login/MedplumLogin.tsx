// src/app/auth/MedplumLogin.tsx
import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Typography, Alert, Paper, Divider, CircularProgress } from '@mui/material';
import { medplumAuthService } from '@providers/auth-provider/medplumAuth';
import { UserInfo, saveUserInfo } from '../../utils/userInfoStorage';
import { formatHumanName } from '../../utils/fhir/resourceUtils';
import { useTranslation } from 'react-i18next';

export const MedplumLogin: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [clientCredentialsLoading, setClientCredentialsLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Handle login with username/password
    const handleLogin = async () => {
        if (!isOnline) {
            setError(t('You are currently offline. Please connect to the internet to login'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Attempting password authentication');
            // Call the authenticate method on the service instance
            const response = await medplumAuthService.login({
                email,
                password,
                providerName: "emailPassword"
            });

            if (response.success) {
                console.log('Password authentication successful');

                // After successful login, get the user profile and save to localStorage
                try {
                    const profile = await medplumAuthService.getIdentity();

                    if (profile) {
                        const userInfo: UserInfo = {
                            id: profile.id,
                            name: formatHumanName(profile.name),
                            role: profile.resourceType || 'User',
                            initials: (profile.name?.[0]?.given?.[0]?.[0] || '') + (profile.name?.[0]?.family?.[0] || '')
                        };

                        // Save to localStorage for persistent access
                        saveUserInfo(userInfo);
                        console.log('User info saved to localStorage:', userInfo);
                    }
                } catch (profileError) {
                    console.error("Error saving user info after login:", profileError);
                    // Still continue with login flow
                }

                window.location.reload(); // Reload to apply authentication
            } else {
                setError(t('Authentication failed. Please check your credentials.'));
            }
        } catch (err) {
            setError(t('An error occurred during authentication.'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle login with client credentials
    const handleClientCredentialsLogin = async () => {
        if (!isOnline) {
            setError(t('You are currently offline. Please connect to the internet to login'));
            return;
        }

        setClientCredentialsLoading(true);
        setError('');

        try {
            console.log('Attempting client credentials authentication');
            // Use the refreshToken method for client credentials
            const success = await medplumAuthService.refreshToken();

            if (success) {
                console.log('Client credentials authentication successful');
                window.location.reload(); // Reload to apply authentication
            } else {
                setError(t('Client credentials authentication failed. Please check your environment variables.'));
            }
        } catch (err) {
            setError(t('An error occurred during client credentials authentication.'));
            console.error(err);
        } finally {
            setClientCredentialsLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ maxWidth: 500, mx: 'auto', p: 4, mt: 8 }}>
            {!isOnline && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {t('You are currently offline. You can only use the app if you have previously logged in.')}
                </Alert>
            )}
            <Typography variant="h5" component="h1" gutterBottom align="center">
                {t('Gandall Healthcare Platform')}
            </Typography>
            <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary" sx={{ mb: 3 }}>
                {t('Authentication')}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    {t('Option 1: User Credentials')}
                </Typography>
                <TextField
                    label={t('Email')}
                    fullWidth
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || !isOnline}
                />

                <TextField
                    label={t('Password')}
                    type="password"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || !isOnline}
                />

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={handleLogin}
                    disabled={loading || clientCredentialsLoading || !isOnline}
                >
                    {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
                    {loading ? t('Logging in...') : t('Login with User Credentials')}
                </Button>

                <Button
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    sx={{ mt: 1 }}
                    onClick={() => {
                        setEmail('test@example.com');
                        setPassword('password123');
                        // Then trigger login
                        handleLogin();
                    }}
                    disabled={loading || clientCredentialsLoading || !isOnline}
                >
                    {t('Use Test Credentials')}
                </Button>
            </Box>

            <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">{t('OR')}</Typography>
            </Divider>

            <Box>
                <Typography variant="h6" gutterBottom>
                    {t('Option 2: Client Credentials')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('Authenticate using client ID and secret from environment variables')}
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleClientCredentialsLogin}
                    disabled={clientCredentialsLoading || loading || !isOnline}
                >
                    {clientCredentialsLoading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
                    {clientCredentialsLoading ? t('Authenticating...') : t('Login with Client Credentials')}
                </Button>
            </Box>
        </Paper>
    );
};