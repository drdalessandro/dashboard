// src/components/ui/cards/StatsCard.tsx
"use client";

/**
 * StatsCard Component
 * A component for displaying statistics with an icon, title, value, and trend
 * Based on the Medical Dashboard UI Kit design
 */
import React, { ReactNode } from 'react';
import { Box, Typography, Paper, useTheme, SxProps, Theme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | null;
  trendValue?: string | number;
  iconBg?: string;
  iconColor?: string;
  sx?: SxProps<Theme>;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend = null,
  trendValue,
  iconBg = '#EEF3FF', // Default to blue background
  iconColor = 'primary.main',
  sx = {},
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '12px',
        border: `1px solid ${theme.palette.divider}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      {/* Icon at the top */}
      {icon && (
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            backgroundColor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
          }}
        >
          {React.cloneElement(icon as React.ReactElement, {
            sx: { color: theme.palette.primary.main, fontSize: '24px' },
          })}
        </Box>
      )}

      {/* Title */}
      <Typography
        variant="subtitle2"
        color="text.secondary"
        fontWeight={400}
        sx={{ mb: 1 }}
      >
        {title}
      </Typography>

      {/* Value and trend indicator */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography
          variant="h4"
          color="text.primary"
          fontWeight={600}
        >
          {value}
        </Typography>

        {trend && trendValue && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            <TrendingUpIcon
              sx={{
                color: '#14CC26',
                fontSize: 16
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: '#14CC26',
                fontWeight: 500
              }}
            >
              {trendValue}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default StatsCard;