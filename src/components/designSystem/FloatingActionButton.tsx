import React from 'react';
import { Fab, Box } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface FloatingActionButtonProps {
  onClick?: () => void;
  label?: string;
  icon?: React.ReactNode;
}

// Styled FAB to match HTML template
const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: '2rem', // bottom-8
  right: '2rem', // right-8
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem', // gap-2
  borderRadius: '9999px', // rounded-full
  backgroundColor: '#2563eb', // bg-blue-600
  color: '#ffffff',
  padding: '1rem 1.5rem', // px-6 py-4
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // shadow-xl
  fontFamily: '"Inter", "Noto Sans", sans-serif',
  fontSize: '0.875rem', // text-sm
  fontWeight: 500, // font-medium
  textTransform: 'none',
  transition: 'background-color 150ms ease', // transition-colors duration-150
  '&:hover': {
    backgroundColor: '#1d4ed8', // hover:bg-blue-700
  },
  '&:focus': {
    outline: 'none',
    boxShadow: '0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.5)', // focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  },
  [theme.breakpoints.down('sm')]: {
    bottom: '1rem',
    right: '1rem',
    padding: '0.75rem 1rem',
  },
}));

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  label = 'Create/Link Record',
  icon = <AddIcon />,
}) => {
  return (
    <StyledFab
      variant="extended"
      onClick={onClick}
      aria-label={label}
    >
      {icon}
      <Box component="span" sx={{ ml: 0.5 }}>
        {label}
      </Box>
    </StyledFab>
  );
};

export default FloatingActionButton;