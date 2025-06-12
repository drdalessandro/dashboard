// src/components/debug/SimpleDebug.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import medplumClient from '@lib/medplum/client';

/**
 * A simple debug component to verify Medplum client initialization
 * and component rendering in the application
 */
export const SimpleDebug: React.FC = () => {
    const [clientInfo, setClientInfo] = useState<any>({
        initialized: false,
        baseUrl: 'Unknown',
        isLoggedIn: false,
        tokenExists: false
    });

    useEffect(() => {
        // Simple check of Medplum client state
        try {
            const baseUrl = medplumClient.getBaseUrl();
            const isLoggedIn = !!medplumClient.getActiveLogin();
            const accessToken = localStorage.getItem('medplum.access_token');
            
            setClientInfo({
                initialized: true,
                baseUrl,
                isLoggedIn,
                tokenExists: !!accessToken
            });
        } catch (error) {
            setClientInfo({
                initialized: false,
                error: String(error)
            });
        }
    }, []);

    return (
        <Paper 
            elevation={3} 
            sx={{ 
                p: 2, 
                m: 2, 
                border: '3px dashed blue',
                backgroundColor: '#f0f8ff'
            }}
        >
            <Typography variant="h6" gutterBottom>
                Simple Debug Component
            </Typography>
            <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                    <strong>Component Rendered:</strong> Yes
                </Typography>
                <Typography variant="body2">
                    <strong>Medplum Client Initialized:</strong> {clientInfo.initialized ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2">
                    <strong>Base URL:</strong> {clientInfo.baseUrl}
                </Typography>
                <Typography variant="body2">
                    <strong>Is Logged In:</strong> {clientInfo.isLoggedIn ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2">
                    <strong>Access Token Exists:</strong> {clientInfo.tokenExists ? 'Yes' : 'No'}
                </Typography>
                {clientInfo.error && (
                    <Typography variant="body2" color="error">
                        <strong>Error:</strong> {clientInfo.error}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};
