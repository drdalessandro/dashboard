"use client";

// src/features/dashboard/components/new-ui/DashboardHeader.tsx
import React from 'react';
import {
  Box,
  Typography,
  InputBase,
  IconButton,
  Badge,
  Paper,
  useTheme,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';

interface DashboardHeaderProps {
  isOffline?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isOffline = false }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2,
        px: 3,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: '#fff',
        height: '64px', // Fixed height to match our layout calculation
        flexShrink: 0,
      }}
    >
      {/* Page Title and Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {/* Mobile Logo (visible only on xs and sm) */}
        <Box
          component="img"
          src="/assets/brand/gandall-logo.png"
          alt="Gandall"
          sx={{
            display: { xs: 'block', md: 'none' },
            height: 32,
            width: 'auto',
            mr: 2
          }}
        />

        <Typography variant="h5" color="text.primary" fontWeight={500}>
          Dashboard
        </Typography>

        {isOffline && (
          <Chip
            icon={<WifiOffIcon />}
            label="Offline Mode"
            color="warning"
            variant="outlined"
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      {/* Search and Notifications */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Search Bar */}
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            width: { xs: 150, sm: 380 },
          }}
        >
          <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
          <InputBase
            placeholder="Search type of keywords"
            sx={{
              fontSize: 14,
              color: theme.palette.text.secondary,
              width: '100%',
              '& .MuiInputBase-input': {
                p: '4px 0',
                width: '100%',
              },
            }}
          />
        </Paper>

        {/* Notifications */}
        <IconButton
          size="medium"
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 1
          }}
        >
          <Badge badgeContent={4} color="error">
            <NotificationsIcon color="action" />
          </Badge>
        </IconButton>
      </Box>
    </Box>
  );
};

export default DashboardHeader;