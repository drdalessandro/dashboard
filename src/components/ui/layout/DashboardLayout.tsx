"use client";

// src/components/ui/layout/DashboardLayout.tsx
import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import DashboardHeader from './DashboardHeader';

// Define the width of the sidebar when expanded
const DRAWER_WIDTH = 250;

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
}

/**
 * Main dashboard layout component that provides the application shell
 * including header, sidebar, and content area.
 * 
 * Note: This component doesn't include CssBaseline as it should be handled
 * at the application root level to prevent CSS import order issues.
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    title = 'Dashboard'
}) => {
    const { t } = useTranslation(['common']);
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    
    // Prevent hydration mismatch by defaulting to false on server
    const [isClient, setIsClient] = React.useState(false);
    const { isOffline } = useNetworkStatus?.() || { isOffline: false };
    
    React.useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <Box sx={{
            display: 'flex',
            backgroundColor: '#FFFFFF', // Match dashboard feature background
            height: '100vh',
            width: '100%',
            overflow: 'hidden' // Prevent scrolling on the main container
        }}>
            {/* Left Sidebar */}
            <Sidebar isMobile={!isDesktop} />

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden', // Prevent scrolling on the main content container
                    height: '100%'
                }}
            >
                {/* Header */}
                <DashboardHeader title={title} isOffline={isClient && isOffline} />

                {/* Content */}
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                        overflow: 'hidden', // Prevent scrolling at this level
                        height: 'calc(100% - 64px)', // Subtract header height
                    }}
                >
                    {/* Main Dashboard Content - With scroll */}
                    <Box sx={{
                        flex: 1,
                        overflow: 'auto', // Allow scrolling for main content
                        p: 3, // Moved padding here from parent
                        height: '100%',
                        borderRadius: 0, // Remove border radius
                        backgroundColor: 'background.paper',
                        '&::-webkit-scrollbar': {
                            width: '6px',
                            height: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: 'transparent',
                        }
                    }}>
                        {children}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default DashboardLayout;
