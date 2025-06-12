import React from 'react';
import { Card, CardContent, CardHeader, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

// Enhanced card styling to match HTML template
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '0.75rem', // rounded-xl
  border: '1px solid #e2e8f0', // border-slate-200
  backgroundColor: '#ffffff',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // shadow-lg
  overflow: 'hidden',
  marginBottom: theme.spacing(3),
}));

const StyledCardHeader = styled(Box)({
  backgroundColor: '#f8fafc', // bg-slate-50
  padding: '1rem 1.5rem', // px-6 py-4
  borderBottom: '1px solid #e2e8f0', // border-slate-200
});

const StyledCardContent = styled(CardContent)({
  padding: '1.5rem', // p-6
  '&:last-child': {
    paddingBottom: '1.5rem',
  },
});

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <StyledCard className={className}>
      <StyledCardHeader>
        <Typography
          variant="h6"
          sx={{
            fontSize: '1.25rem', // text-xl
            fontWeight: 600, // font-semibold
            color: '#475569', // text-slate-700
            fontFamily: '"Inter", "Noto Sans", sans-serif',
          }}
        >
          {title}
        </Typography>
      </StyledCardHeader>
      <StyledCardContent>
        {children}
      </StyledCardContent>
    </StyledCard>
  );
};

// Definition list component to match HTML template
interface DefinitionListProps {
  items: Array<{
    term: string;
    description: string | React.ReactNode;
  }>;
  columns?: 1 | 2 | 3;
}

export const DefinitionList: React.FC<DefinitionListProps> = ({
  items,
  columns = 2,
}) => {
  return (
    <Box
      component="dl"
      sx={{
        display: 'grid',
        gridTemplateColumns: columns === 2 ? { xs: '1fr', sm: '1fr 1fr' } : columns === 3 ? { xs: '1fr', sm: '1fr 1fr 1fr' } : '1fr',
        gap: '1rem 1.5rem', // gap-x-6 gap-y-4
        margin: 0,
      }}
    >
      {items.map((item, index) => (
        <Box key={index}>
          <Typography
            component="dt"
            variant="body2"
            sx={{
              fontSize: '0.875rem', // text-sm
              fontWeight: 500, // font-medium
              color: '#64748b', // text-slate-500
              marginBottom: '0.25rem',
            }}
          >
            {item.term}
          </Typography>
          <Typography
            component="dd"
            variant="body2"
            sx={{
              fontSize: '0.875rem', // text-sm
              color: '#334155', // text-slate-700
              margin: 0,
            }}
          >
            {item.description}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default SectionCard;