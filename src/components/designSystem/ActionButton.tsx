import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ActionButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  variant?: ButtonVariant;
  loading?: boolean;
  size?: ButtonSize;
}

// Enhanced styling to match HTML template button patterns
const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => !['buttonVariant', 'buttonSize'].includes(prop as string),
})<{
  buttonVariant: ButtonVariant;
  buttonSize: ButtonSize;
}>(({ theme, buttonVariant = 'primary', buttonSize = 'medium', disabled }) => {
  // Base styles matching HTML template
  const baseStyles = {
    borderRadius: '0.5rem',
    fontWeight: 500,
    textTransform: 'none' as const,
    transition: 'all 0.15s ease-in-out',
    fontFamily: '"Inter", "Noto Sans", sans-serif',
    boxShadow: 'none',
    '&:hover': {
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
    '&:focus': {
      outline: '2px solid transparent',
      outlineOffset: '2px',
      boxShadow: '0 0 0 3px rgba(25, 147, 229, 0.1)',
    },
  };

  // Size variants
  const sizeStyles = {
    small: {
      padding: '0.375rem 0.75rem',
      fontSize: '0.75rem',
      height: '32px',
    },
    medium: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      height: '40px',
    },
    large: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      height: '48px',
    },
  };
  // Variant styles matching HTML template patterns
  const variantStyles = {
    primary: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      border: `1px solid ${theme.palette.primary.main}`,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        borderColor: theme.palette.primary.dark,
      },
      '&:disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        borderColor: theme.palette.action.disabled,
        color: theme.palette.action.disabled,
      },
    },
    secondary: {
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.secondary.contrastText,
      border: `1px solid ${theme.palette.secondary.main}`,
      '&:hover': {
        backgroundColor: theme.palette.secondary.dark,
        borderColor: theme.palette.secondary.dark,
      },
      '&:disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        borderColor: theme.palette.action.disabled,
        color: theme.palette.action.disabled,
      },
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.divider}`,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        borderColor: theme.palette.text.secondary,
      },
      '&:disabled': {
        borderColor: theme.palette.action.disabled,
        color: theme.palette.text.disabled,
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.palette.text.secondary,
      border: '1px solid transparent',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.text.primary,
      },
      '&:disabled': {
        color: theme.palette.text.disabled,
      },
    },
    danger: {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      border: `1px solid ${theme.palette.error.main}`,
      '&:hover': {
        backgroundColor: theme.palette.error.dark,
        borderColor: theme.palette.error.dark,
      },
      '&:disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        borderColor: theme.palette.action.disabled,
        color: theme.palette.action.disabled,
      },
    },
  } as const;
  return {
    ...baseStyles,
    ...sizeStyles[buttonSize || 'medium'],
    ...variantStyles[buttonVariant || 'primary'],
  };
});

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  children,
  startIcon,
  endIcon,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <StyledButton
      buttonVariant={variant}
      buttonSize={size}
      disabled={isDisabled}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
      endIcon={loading ? undefined : endIcon}
      {...props}
    >
      {loading && (
        <CircularProgress
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          sx={{
            color: 'currentColor',
            marginRight: children ? 1 : 0,
          }}
        />
      )}
      {children}
    </StyledButton>
  );
};

export default ActionButton;