"use client";

import React, { ReactNode } from 'react';
import { Box, useTheme } from '@mui/material';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import RightSidebar from './RightSidebar';

type DashboardLayoutProps = {
  children: ReactNode;
  userProfile?: any; // Keep for backward compatibility
  isOffline?: boolean;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userProfile,
  isOffline,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{
      display: 'flex',
      backgroundColor: '#FFFFFF',
      height: '100vh',
      width: '100%',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: '100%'
        }}
      >
        {/* Header */}
        <DashboardHeader isOffline={isOffline} />

        {/* Content */}
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            height: 'calc(100% - 64px)',
          }}
        >
          {/* Main Dashboard Content */}
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            height: '100%',
            borderRadius: 0,
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

      {/* Right Sidebar Container */}
      <Box
        sx={{
          width: 350,
          display: { xs: 'none', lg: 'block' },
          flexShrink: 0,
          height: '100%',
          borderLeft: `1px solid ${theme.palette.divider}`,
          overflow: 'auto'
        }}
      >
        <RightSidebar />
      </Box>
    </Box>
  );
};

export default DashboardLayout;