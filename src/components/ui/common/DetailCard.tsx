// src/components/ui/common/DetailCard.tsx
"use client";

/**
 * DetailCard Component
 * A component for displaying detailed information with an icon, title, and content
 * Based on the Medical Dashboard UI Kit design
 */
import React, { ReactNode } from 'react';
import { Box, Paper, Typography, Divider, IconButton, useTheme } from '@mui/material';
import { MoreVert } from '@mui/icons-material';

interface DetailCardProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  sx?: any;
  headerSx?: any;
}

export default function DetailCard({
  title,
  children,
  icon,
  actions,
  className,
  sx,
  headerSx
}: DetailCardProps) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '12px',
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...sx
      }}
      className={className}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          pb: 2,
          ...headerSx
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                backgroundColor: '#EEF3FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
              }}
            >
              {React.cloneElement(icon as React.ReactElement, {
                sx: { color: theme.palette.primary.main, fontSize: '24px' },
              })}
            </Box>
          )}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>

        {actions || (
          <IconButton size="small">
            <MoreVert fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider />

      <Box sx={{ p: 3, flexGrow: 1 }}>
        {children}
      </Box>
    </Paper>
  );
}