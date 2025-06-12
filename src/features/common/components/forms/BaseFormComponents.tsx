/**
 * BaseFormComponents.tsx
 * 
 * Common styled form components used across patient and practitioner features
 */
import React from 'react';
import { styled, TextField, FormControl, Typography, SxProps, Theme, Box } from '@mui/material';
import { DataCard } from '../../../../components/designSystem';

/**
 * Standard text field with consistent styling
 */
export const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'white',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 400,
    height: '44px',
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        border: 'none'
      }
    },
    '&.Mui-focused': {
      outline: '2px solid #3b82f6',
      outlineOffset: '2px',
      '& .MuiOutlinedInput-notchedOutline': {
        border: 'none'
      }
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none'
    }
  },
  '& .MuiOutlinedInput-input': {
    padding: '12px',
    fontSize: '0.875rem',
    color: '#1e293b',
    '&::placeholder': {
      color: '#94a3b8',
      opacity: 1
    }
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    lineHeight: 1.43,
    marginBottom: '8px',
    position: 'relative',
    transform: 'none',
    '&.Mui-focused': {
      color: '#374151'
    }
  }
});

/**
 * Standard form control with consistent styling
 */
export const StyledFormControl = styled(FormControl)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'white',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 400,
    height: '44px',
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        border: 'none'
      }
    },
    '&.Mui-focused': {
      outline: '2px solid #3b82f6',
      outlineOffset: '2px',
      '& .MuiOutlinedInput-notchedOutline': {
        border: 'none'
      }
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none'
    }
  },
  '& .MuiSelect-select': {
    padding: '12px',
    fontSize: '0.875rem',
    color: '#1e293b'
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    lineHeight: 1.43,
    marginBottom: '8px',
    position: 'relative',
    transform: 'none',
    '&.Mui-focused': {
      color: '#374151'
    }
  }
});

/**
 * Standard field label
 */
export const FieldLabel = styled(Typography)({
  color: '#374151',
  fontSize: '0.875rem',
  fontWeight: 500,
  lineHeight: 1.43,
  paddingBottom: '8px'
});

/**
 * Required field asterisk
 */
export const RequiredAsterisk = styled('span')({
  color: '#ef4444'
});

/**
 * Section header for form subsections
 */
export const SubSectionHeader = styled(Typography)({
  color: '#374151',
  fontSize: '1rem',
  fontWeight: 500,
  lineHeight: 1.5
});

/**
 * FormCard - Reusable card wrapper for form sections
 */
interface FormCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const FormCard = React.memo<FormCardProps>(({ 
  title, 
  icon, 
  children, 
  sx 
}) => {
  return (
    <DataCard 
      title={
        icon ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            {title}
          </Box>
        ) : (
          title
        )
      }
      sx={{ mb: 3, ...sx }}
    >
      {children}
    </DataCard>
  );
});

FormCard.displayName = 'FormCard';