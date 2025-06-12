/**
 * FormCard.tsx
 * 
 * Reusable card wrapper for form sections using design system
 */
import React from 'react';
import { SxProps, Theme, Box } from '@mui/material';
import { DataCard } from '@/components/designSystem';

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

export default FormCard;
