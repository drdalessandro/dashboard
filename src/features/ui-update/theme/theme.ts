import { createTheme } from '@mui/material/styles';

/**
 * Theme configuration for the Healthcare Platform based on Figma design
 */
export const figmaTheme = createTheme({
  palette: {
    primary: {
      main: '#1E88E5', // Brand, CTAs, Links (Primary Blue)
      light: '#64B5F6',
      dark: '#1565C0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00BFA5', // Accent Green
      light: '#5DF2D6',
      dark: '#008E76',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF5252', // Alert Red
      light: '#FF8A80',
      dark: '#C50E29',
    },
    warning: {
      main: '#FFA726', // Warning
      light: '#FFD95B',
      dark: '#C77800',
    },
    info: {
      main: '#2196F3', // Info
      light: '#64B5F6',
      dark: '#0069C0',
    },
    success: {
      main: '#4CAF50', // Success
      light: '#80E27E',
      dark: '#087F23',
    },
    background: {
      default: '#F5F5F5', // Neutral Gray
      paper: '#FFFFFF', 
    },
    text: {
      primary: '#424242', // Dark Gray (Text)
      secondary: '#757575',
      disabled: '#9E9E9E',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, system-ui, sans-serif',
    h1: {
      fontSize: '2rem', // 32px
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem', // 24px
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
    },
    button: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 16px', 
          height: 40,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        outlined: {
          borderWidth: '1px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: 16,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: 12,
        },
        head: {
          backgroundColor: '#F5F5F5',
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: 'auto',
          fontWeight: 500,
          '&.Mui-selected': {
            fontWeight: 600,
          }
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 24,
          fontSize: '0.75rem',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          height: 40,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
  shape: {
    borderRadius: 4,
  },
  spacing: 8,
});

export default figmaTheme;
