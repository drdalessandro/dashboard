"use client";

// src/features/dashboard/components/ui/RightSidebar.tsx
import React from 'react';
import { Box, Divider, useTheme } from '@mui/material';
import PractitionerInfo from './RightSidebar/PractitionerInfo';
import PatientSatisfaction from './RightSidebar/PatientSatisfaction';
import UpcomingAppointments from './RightSidebar/UpcomingAppointments';

const RightSidebar: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%', // Take full height of parent container
        width: '100%',
        backgroundColor: theme.palette.background.paper,
        borderLeft: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        // Remove overflow scrolling to prevent scrollbars
        overflow: 'visible',
      }}
    >
      {/* Components stacked vertically */}
      <Box sx={{ flexShrink: 0 }}>
        <PractitionerInfo />
        <Divider />
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <UpcomingAppointments />
        <Divider />
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <PatientSatisfaction />
      </Box>
    </Box>
  );
};

export default RightSidebar;