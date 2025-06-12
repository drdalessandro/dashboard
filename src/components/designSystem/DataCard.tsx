import React from 'react';
import { Card, CardProps, CardContent, CardHeader, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

type MuiCardVariant = 'elevation' | 'outlined';
type CustomCardVariant = 'default' | 'outlined' | 'elevation';

// Omit variant from CardProps to avoid type conflicts
interface DataCardProps extends Omit<CardProps, 'title' | 'variant' | 'elevation'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
  variant?: CustomCardVariant;
  elevation?: number;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'cardVariant',
})<{ cardVariant?: CustomCardVariant }>(({ theme, cardVariant }) => {
  const styles: Record<string, any> = {
    borderRadius: theme.spacing(1.5), // 12px
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    transition: 'all 0.15s ease-in-out',
  };

  if (cardVariant === 'elevation') {
    styles.boxShadow = theme.shadows[2];
  } else if (cardVariant === 'outlined') {
    styles.backgroundColor = 'transparent';
    styles.borderColor = theme.palette.divider;
  }

  return styles;
});

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2, 3),
  '& .MuiCardHeader-title': {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  '& .MuiCardHeader-subheader': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
}));

export const DataCard: React.FC<DataCardProps> = ({
  title,
  subtitle,
  action,
  children,
  noPadding = false,
  variant = 'default',
  ...cardProps
}) => {
  // Map our custom variant to MUI's variant
  const muiVariant: MuiCardVariant = variant === 'elevation' ? 'elevation' : 'outlined';

  // Extract elevation from cardProps to avoid passing it twice
  const { elevation: _, ...restCardProps } = cardProps;

  return (
    <StyledCard
      {...restCardProps}
      variant={variant === 'default' ? 'outlined' : muiVariant}
      cardVariant={variant}
      elevation={variant === 'elevation' ? 2 : 0}
    >
      {(title || action) && (
        <StyledCardHeader
          title={title}
          subheader={subtitle}
          action={action}
          sx={!title && !subtitle ? { borderBottom: 0 } : {}}
        />
      )}
      {noPadding ? (
        children
      ) : (
        <CardContent sx={{ p: 3 }}>
          {children}
        </CardContent>
      )}
    </StyledCard>
  );
};

export default DataCard;
