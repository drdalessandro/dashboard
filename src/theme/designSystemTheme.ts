import { createTheme } from '@mui/material/styles';

// Design System Theme extracted from HTML templates
export const designSystemTheme = createTheme({
  palette: {
    // Primary palette from CSS variables
    primary: {
      main: '#1993e5',      // --color-primary
      dark: '#1476b7',      // --color-primary-dark
      light: '#47abed',     // --color-primary-light
      contrastText: '#ffffff', // --color-primary-content
    },
    // Secondary palette
    secondary: {
      main: '#e7eef3',      // --color-secondary
      dark: '#c4d1dd',      // --color-secondary-dark
      light: '#ffffff',     // --color-secondary-light
      contrastText: '#0e161b', // --color-secondary-content
    },
    // Status colors
    error: {
      main: '#dc3545',      // --color-error
    },
    warning: {
      main: '#ffc107',      // --color-warning
    },
    success: {
      main: '#28a745',      // --color-success
    },
    // Background colors
    background: {
      default: '#f9fafb',   // --color-foreground
      paper: '#ffffff',     // --color-background
    },
    // Text colors
    text: {
      primary: '#0e161b',   // --color-copy
      secondary: '#4e7a97', // --color-copy-light
      disabled: '#8a9faa',  // --color-copy-lighter
    },
    // Other colors
    divider: '#e7eef3',     // --color-border
    action: {
      disabled: '#d1d5db',  // --color-disabled
      disabledBackground: '#d1d5db',
    },
  },
  
  // Typography from HTML templates
  typography: {
    fontFamily: '"Inter", "Noto Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    
    // Text sizes mapped from Tailwind classes
    h1: {
      fontSize: '2.25rem',     // text-3xl
      fontWeight: 700,         // font-bold
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem',    // text-2xl
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',      // text-xl
      fontWeight: 600,         // font-semibold
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',     // text-lg
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontSize: '1rem',        // text-base
      fontWeight: 500,         // font-medium
      lineHeight: 1.6,
    },
    h6: {
      fontSize: '0.875rem',    // text-sm
      fontWeight: 500,
      lineHeight: 1.7,
    },
    body1: {
      fontSize: '1rem',        // text-base
      fontWeight: 400,         // font-normal
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',    // text-sm
      fontWeight: 400,
      lineHeight: 1.6,
    },
    caption: {
      fontSize: '0.75rem',     // text-xs
      fontWeight: 400,
      lineHeight: 1.7,
    },
    button: {
      fontSize: '0.875rem',    // text-sm
      fontWeight: 500,         // font-medium
      textTransform: 'none',   // No uppercase transformation
    },
  },
  
  // Spacing system from Tailwind (1 unit = 0.25rem = 4px)
  spacing: 4, // Base spacing unit
  
  // Shape and borders
  shape: {
    borderRadius: 8, // rounded-lg
  },
  
  // Component overrides to match HTML template styles
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',      // rounded-lg
          padding: '0.5rem 1rem',      // py-2 px-4
          fontSize: '0.875rem',        // text-sm
          fontWeight: 500,             // font-medium
          transition: 'all 0.15s ease-in-out', // transition-colors
          textTransform: 'none',
        },
        containedPrimary: {
          backgroundColor: '#1993e5',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#1476b7', // bg-primary-dark
          },
        },
        outlined: {
          borderColor: '#e7eef3',      // border-border
          color: '#0e161b',            // text-copy
          '&:hover': {
            backgroundColor: '#f9fafb', // bg-foreground
            borderColor: '#c4d1dd',
          },
        },
      },
    },
    
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.5rem',    // rounded-lg
            backgroundColor: '#f9fafb', // bg-foreground
            fontSize: '0.875rem',       // text-sm
            '& fieldset': {
              borderColor: '#e7eef3',   // border-border
            },
            '&:hover fieldset': {
              borderColor: '#c4d1dd',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1993e5',   // border-primary
            },
          },
        },
      },
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',      // rounded-xl
          border: '1px solid #e7eef3',  // border border-border
          boxShadow: 'none',
          backgroundColor: '#ffffff',   // bg-background
        },
      },
    },
    
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '9999px',       // rounded-full
          fontSize: '0.75rem',          // text-xs
          fontWeight: 500,              // font-medium
        },
        colorSuccess: {
          backgroundColor: '#dcfce7',   // bg-green-100
          color: '#15803d',             // text-green-700
        },
        colorError: {
          backgroundColor: '#fee2e2',   // bg-red-100
          color: '#b91c1c',             // text-red-700
        },
      },
    },
    
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f9fafb',   // bg-foreground
          '& .MuiTableCell-head': {
            fontSize: '0.875rem',       // text-sm
            fontWeight: 500,            // font-medium
            color: '#4e7a97',           // text-copy-light
            borderBottom: '1px solid #e7eef3', // border-border
          },
        },
      },
    },
    
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',         // text-sm
          padding: '0.75rem 1rem',      // py-3 px-4
          borderBottom: '1px solid #e7eef3', // border-border
        },
      },
    },
    
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: '0.5rem',            // p-2
          borderRadius: '0.5rem',       // rounded-lg
          '&:hover': {
            backgroundColor: '#f9fafb', // hover:bg-foreground
          },
        },
      },
    },
  },
});

// Export additional design tokens for use in components
export const designTokens = {
  // Shadows from templates
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  
  // Transitions
  transitions: {
    colors: 'color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out',
    all: 'all 0.15s ease-in-out',
    opacity: 'opacity 0.3s ease-in-out',
  },
  
  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};
