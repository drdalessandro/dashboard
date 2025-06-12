import React from 'react';
import { Box, BoxProps, Typography, Button, SxProps, Theme } from '@mui/material';
import { styled } from '@mui/material/styles';

interface EmptyStateProps extends BoxProps {
  /** Optional icon to display at the top */
  icon?: React.ReactNode;
  /** Main title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Optional action button configuration */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom height for the empty state container */
  height?: number | string;
  /** Additional styles */
  sx?: SxProps<Theme>;
}

const EmptyStateContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'height',
})<{ height?: number | string }>(({ theme, height = 300 }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: theme.spacing(6),
  minHeight: typeof height === 'number' ? `${height}px` : height,
  width: '100%',
  color: theme.palette.text.secondary,
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  color: theme.palette.text.secondary,
  '& svg': {
    fontSize: 64,
  },
}));

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  action,
  height = 300,
  sx,
  ...rest
}) => {
  return (
    <EmptyStateContainer
      height={height}
      sx={{
        ...(sx || {}),
      }}
      {...rest}
    >
      {icon && <IconWrapper>{icon}</IconWrapper>}

      <Typography
        variant="h6"
        color="text.primary"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: 'inherit',
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography
          variant="body2"
          color="inherit"
          sx={{
            mb: 3,
            maxWidth: 400,
            opacity: 0.8,
          }}
        >
          {subtitle}
        </Typography>
      )}

      {action && (
        <Button
          variant="contained"
          color="primary"
          onClick={action.onClick}
          sx={{
            mt: 2,
            textTransform: 'none',
          }}
        >
          {action.label}
        </Button>
      )}
    </EmptyStateContainer>
  );
};

export default EmptyState;
