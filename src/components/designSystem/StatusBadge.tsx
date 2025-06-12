import React from 'react';
import { Chip, ChipProps, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

export type StatusVariant = 'active' | 'inactive' | 'pending' | 'warning' | 'error' | 'success';

export interface StatusBadgeProps extends Omit<ChipProps, 'color' | 'variant'> {
  status: StatusVariant;
  variant?: 'filled' | 'outlined';
  label?: string;
}

const getStatusStyles = (status: StatusVariant, theme: Theme) => {
  const statusMap = {
    active: {
      bg: theme.palette.success.light,
      color: theme.palette.success.dark,
      border: theme.palette.success.main,
    },
    inactive: {
      bg: theme.palette.error.light,
      color: theme.palette.error.dark,
      border: theme.palette.error.main,
    },
    pending: {
      bg: theme.palette.info.light,
      color: theme.palette.info.dark,
      border: theme.palette.info.main,
    },
    warning: {
      bg: theme.palette.warning.light,
      color: theme.palette.warning.dark,
      border: theme.palette.warning.main,
    },
    error: {
      bg: theme.palette.error.light,
      color: theme.palette.error.dark,
      border: theme.palette.error.main,
    },
    success: {
      bg: theme.palette.success.light,
      color: theme.palette.success.dark,
      border: theme.palette.success.main,
    },
  };

  return statusMap[status] || statusMap.active;
};

const StyledChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status: StatusVariant }>(({ theme, status, variant }) => {
  const { bg, color, border } = getStatusStyles(status, theme);

  return {
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    height: 'auto',
    padding: '2px 12px',
    backgroundColor: variant === 'outlined' ? 'transparent' : bg,
    color: variant === 'outlined' ? border : color,
    border: variant === 'outlined' ? `1px solid ${border}` : 'none',
    '& .MuiChip-label': {
      padding: '0 4px',
    },
  };
});

const defaultLabels: Record<StatusVariant, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  warning: 'Warning',
  error: 'Error',
  success: 'Success',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'active',
  variant = 'filled',
  label,
  ...props
}) => {
  const theme = useTheme();
  const displayLabel = React.useMemo(
    () => label || defaultLabels[status] || status,
    [label, status]
  );

  return (
    <StyledChip
      {...props}
      status={status}
      label={displayLabel}
      variant={variant}
      size="small"
      // @ts-ignore - theme is properly typed but MUI's type definitions are complex
      theme={theme}
    />
  );
};

export default StatusBadge;
