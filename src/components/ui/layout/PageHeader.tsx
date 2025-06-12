"use client";

/**
 * PageHeader Component
 * A reusable header component for page titles and actions
 * Based on the Medical Dashboard UI Kit design
 */
import React, { ReactNode } from 'react';
import { Box, Typography, Button, SxProps, Theme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
  sx?: SxProps<Theme>;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backButton = false,
  onBack,
  actions,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        mb: 4,
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {backButton && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{
              mr: 2,
              color: 'neutral.600',
              '&:hover': {
                backgroundColor: 'neutral.50',
              },
            }}
          >
            Back
          </Button>
        )}
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              color: 'neutral.800',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              sx={{
                color: 'neutral.500',
                mt: 0.5,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {actions && (
        <Box
          sx={{
            display: 'flex',
            mt: { xs: 2, md: 0 },
            gap: 2,
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader;
