// src/components/ui/cards/Card.tsx
"use client";

/**
 * Card Component
 * A reusable card component that wraps content in a styled container
 * Based on the Medical Dashboard UI Kit design
 */
import React, { ReactNode } from 'react';
import { Paper, Box, SxProps, Theme } from '@mui/material';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  elevation?: number;
  sx?: SxProps<Theme>;
  className?: string;
  noBodyPadding?: boolean;
  headerSx?: SxProps<Theme>;
  bodySx?: SxProps<Theme>;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  actions,
  elevation = 0, // Changed to 0 to match SummaryCards
  sx = {},
  className = '',
  noBodyPadding = false,
  headerSx = {},
  bodySx = {},
}) => {
  const hasHeader = title || subtitle || actions;

  return (
    <Paper
      elevation={elevation}
      sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        background: '#fff',
        p: noBodyPadding ? 0 : 3, // Add padding at the paper level for consistency
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
      className={className}
    >
      {hasHeader && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            ...headerSx,
          }}
        >
          <Box>
            {title && (
              <Box component="h3" sx={{
                fontWeight: 600,
                fontSize: '1.125rem',
                color: 'text.primary',
                m: 0,
              }}>
                {title}
              </Box>
            )}
            {subtitle && (
              <Box component="p" sx={{
                fontSize: '0.875rem',
                color: 'text.secondary',
                m: 0,
                mt: title ? 0.5 : 0
              }}>
                {subtitle}
              </Box>
            )}
          </Box>
          {actions && <Box>{actions}</Box>}
        </Box>
      )}

      <Box
        sx={{
          flexGrow: 1,
          ...bodySx,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

export default Card;