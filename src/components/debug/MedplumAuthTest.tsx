// src/components/debug/MedplumAuthTest.tsx
import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    TextField,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import medplumClient from '@lib/medplum/client';
import { authenticateWithMedplum } from '@providers/auth-provider/medplumAuth';

/**
 * A component for testing Medplum authentication with detailed diagnostics
 */
export const MedplumAuthTest: React.FC = () => {
    // State for authentication status and environment variables
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');
    const [envVars, setEnvVars] = useState({
        baseUrl: process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || '',
        clientId: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || '',
        clientSecret: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_SECRET || ''
    });
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [clientState, setClientState] = useState({
        isAuthenticated: false,
        hasAccessToken: false,
        baseUrl: ''
    });

    // Function to test client credentials authentication
    const testClientCredentials = async () => {
        setStatus('loading');
        setMessage('Testing client credentials authentication...');

        try {
            console.group('🔍 Testing Medplum Client Credentials Auth');

            // Log environment variables (masked for security)
            console.log('Environment variables:', {
                baseUrl: envVars.baseUrl ? `${envVars.baseUrl.substring(0, 10)}...` : 'Not set',
                clientId: envVars.clientId ? `${envVars.clientId.substring(0, 5)}...` : 'Not set',
                clientSecret: envVars.clientSecret ? 'Present (hidden)' : 'Not set'
            });

            // Test authentication using the login method of the auth provider
            try {
                // Use client credentials flow (empty credentials since they're configured in the client)
                const result = await authenticateWithMedplum.login({});

                setStatus('success');
                setMessage('Client credentials authentication successful!');
            } catch (error) {
                console.error('Authentication error:', error);
                setStatus('error');
                setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Update client state
            updateClientState();

            console.groupEnd();
        } catch (error) {
            console.error('Error during client credentials test:', error);
            setStatus('error');
            setMessage(`Authentication error: ${error instanceof Error ? error.message : String(error)}`);
            console.groupEnd();
        }
    };

    // Function to test password authentication
    const testPasswordAuth = async () => {
        if (!username || !password) {
            setMessage('Please enter both username and password');
            return;
        }

        setStatus('loading');
        setMessage(`Testing password authentication for ${username}...`);

        try {
            console.group('🔍 Testing Medplum Password Auth');

            // Test authentication using the login method of the auth provider
            try {
                // Use username/password authentication flow
                const result = await authenticateWithMedplum.login({
                    email: username,
                    password: password
                });

                setStatus('success');
                setMessage('Password authentication successful!');
            } catch (error) {
                console.error('Authentication error:', error);
                setStatus('error');
                setMessage(`Password authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Update client state
            updateClientState();

            console.groupEnd();
        } catch (error) {
            console.error('Error during password authentication test:', error);
            setStatus('error');
            setMessage(`Authentication error: ${error instanceof Error ? error.message : String(error)}`);
            console.groupEnd();
        }
    };

    // Function to test server health via API
    const testServerHealth = async () => {
        setStatus('loading');
        setMessage('Testing Medplum server health via API...');

        try {
            console.group('🔍 Testing Server Health');

            // Use our API endpoint to check server health
            const healthUrl = `/api/debug/medplum-health?baseUrl=${encodeURIComponent(envVars.baseUrl)}`;
            console.log('Health check URL:', healthUrl);

            // Make request to our API endpoint
            const response = await fetch(healthUrl);
            const data = await response.json();

            // Log response
            console.log('Health check response:', data);

            // Update state based on result
            if (response.ok && data.ok) {
                setStatus('success');
                setMessage(`Server health check successful! Server status: ${data.status} ${data.statusText}`);
            } else {
                setStatus('error');
                setMessage(`Server health check failed: ${data.error || 'Unknown error'}`);
            }

            // Update client state
            updateClientState();

            console.groupEnd();
        } catch (error) {
            console.error('Error during server health check:', error);
            setStatus('error');
            setMessage(`Server health check error: ${error instanceof Error ? error.message : String(error)}`);
            console.groupEnd();
        }
    };

    // Function to test API proxy
    const testApiProxy = async () => {
        setStatus('loading');
        setMessage('Testing API proxy...');

        try {
            console.group('🔍 Testing API Proxy');

            // Test the proxy endpoint
            const response = await fetch('/api/auth/medplum-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    baseUrl: envVars.baseUrl,
                    clientId: envVars.clientId,
                    clientSecret: envVars.clientSecret
                })
            });

            // Log response status
            console.log('Proxy response status:', response.status, response.statusText);

            // Parse response
            const data = await response.json();
            console.log('Proxy response data:', {
                success: response.ok,
                hasAccessToken: !!data.access_token,
                tokenType: data.token_type,
                expiresIn: data.expires_in
            });

            // Update state based on result
            if (response.ok && data.access_token) {
                setStatus('success');
                setMessage('API proxy test successful!');

                // Set the token in the Medplum client
                await medplumClient.setAccessToken(data.access_token);

                // Update client state
                updateClientState();
            } else {
                setStatus('error');
                setMessage(`API proxy test failed: ${data.error || 'Unknown error'}`);
            }

            console.groupEnd();
        } catch (error) {
            console.error('Error during API proxy test:', error);
            setStatus('error');
            setMessage(`API proxy error: ${error instanceof Error ? error.message : String(error)}`);
            console.groupEnd();
        }
    };

    // Function to check CORS with a direct request
    const testCors = async () => {
        setStatus('loading');
        setMessage('Testing CORS with direct request...');

        try {
            console.group('🔍 Testing CORS');

            // Construct token URL
            const tokenUrl = `${envVars.baseUrl}/oauth2/token`;
            console.log('Token URL:', tokenUrl);

            // Prepare request parameters
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', envVars.clientId);
            params.append('client_secret', envVars.clientSecret);

            // Make direct request with CORS mode
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': window.location.origin
                },
                mode: 'cors',
                body: params
            });

            // Log response
            console.log('CORS test response status:', response.status, response.statusText);

            // Update state based on result
            if (response.ok) {
                const data = await response.json();
                console.log('CORS test response data:', {
                    hasAccessToken: !!data.access_token,
                    tokenType: data.token_type,
                    expiresIn: data.expires_in
                });

                setStatus('success');
                setMessage('CORS test successful! Direct requests are working.');
            } else {
                const errorText = await response.text();
                console.error('CORS test failed:', errorText);

                setStatus('error');
                setMessage(`CORS test failed: ${response.status} ${response.statusText}`);
            }

            console.groupEnd();
        } catch (error) {
            console.error('Error during CORS test:', error);
            setStatus('error');
            setMessage(`CORS error: ${error instanceof Error ? error.message : String(error)}`);
            console.groupEnd();
        }
    };

    // Function to update client state
    const updateClientState = () => {
        setClientState({
            isAuthenticated: !!medplumClient.getActiveLogin(),
            hasAccessToken: !!medplumClient.getAccessToken(),
            baseUrl: medplumClient.getBaseUrl()
        });
    };

    // Function to reset client
    const resetClient = () => {
        medplumClient.clear();
        updateClientState();
        setStatus('idle');
        setMessage('Client reset. All authentication data cleared.');
    };

    return (
        <Paper elevation={3} sx={{ p: 3, m: 2, maxWidth: '800px', mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                Medplum Authentication Test
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Environment Variables Section */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Environment Variables
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField
                        label="Base URL"
                        value={envVars.baseUrl}
                        onChange={(e) => setEnvVars({ ...envVars, baseUrl: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Client ID"
                        value={envVars.clientId}
                        onChange={(e) => setEnvVars({ ...envVars, clientId: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Client Secret"
                        value={envVars.clientSecret}
                        onChange={(e) => setEnvVars({ ...envVars, clientSecret: e.target.value })}
                        type="password"
                        fullWidth
                        margin="normal"
                    />
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Client Credentials Test */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Client Credentials Authentication
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={testClientCredentials}
                    disabled={status === 'loading'}
                    sx={{ mr: 2 }}
                >
                    Test Client Credentials
                </Button>
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={testApiProxy}
                    disabled={status === 'loading'}
                    sx={{ mr: 2 }}
                >
                    Test API Proxy
                </Button>
                <Button
                    variant="outlined"
                    color="warning"
                    onClick={testCors}
                    disabled={status === 'loading'}
                    sx={{ mr: 2 }}
                >
                    Test CORS
                </Button>
                <Button
                    variant="outlined"
                    color="info"
                    onClick={testServerHealth}
                    disabled={status === 'loading'}
                >
                    Test Server Health
                </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Password Authentication Test */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Password Authentication
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        fullWidth
                        margin="normal"
                    />
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={testPasswordAuth}
                    disabled={status === 'loading' || !username || !password}
                    sx={{ mt: 2 }}
                >
                    Test Password Authentication
                </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Status Section */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Status
                </Typography>

                {status === 'loading' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CircularProgress size={24} sx={{ mr: 2 }} />
                        <Typography>{message}</Typography>
                    </Box>
                )}

                {status === 'success' && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {message}
                    </Alert>
                )}

                {status === 'error' && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {message}
                    </Alert>
                )}

                <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Client State:
                    </Typography>
                    <Typography variant="body2">
                        Is Authenticated: {clientState.isAuthenticated ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2">
                        Has Access Token: {clientState.hasAccessToken ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2">
                        Base URL: {clientState.baseUrl || 'Not set'}
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    color="error"
                    onClick={resetClient}
                    sx={{ mt: 2 }}
                >
                    Reset Client
                </Button>
            </Box>
        </Paper>
    );
};

export default MedplumAuthTest;
