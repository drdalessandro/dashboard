// src/components/auth/AuthWrapper.tsx
import React, { useEffect, useState } from 'react';
import { Typography, CircularProgress } from '@mui/material';
import { MedplumLogin } from '@app/login/MedplumLogin';
import { medplumAuthService } from '@providers/auth-provider/medplumAuth';

interface AuthWrapperProps {
    children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Check authentication status
        const checkAuth = async () => {
            try {
                // First, check for existing authentication using the initialize method
                const isAlreadyAuthenticated = await medplumAuthService.initialize();

                if (isAlreadyAuthenticated) {
                    console.log('User is already authenticated');
                    setIsAuthenticated(true);
                    return;
                }

                // If not authenticated, try client credentials flow
                console.log('Attempting client credentials authentication');
                const success = await medplumAuthService.refreshToken();

                if (success) {
                    console.log('Client credentials authentication successful');
                    setIsAuthenticated(true);
                } else {
                    console.log('Client credentials authentication failed, showing login form');
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Authentication check failed:', error);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    if (isAuthenticated === null) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column'
            }}>
                <Typography variant="h6" gutterBottom>Loading Gandall Healthcare Platform</Typography>
                <CircularProgress />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <MedplumLogin />;
    }

    return <>{children}</>;
};