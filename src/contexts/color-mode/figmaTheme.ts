import { createTheme } from '@mui/material/styles';

/**
 * Figma-based theme for the Healthcare Platform
 * This theme matches the design from the UI guidelines
 */
export const figmaTheme = createTheme({
  palette: {
    primary: {
      main: '#1E88E5', // Primary Blue from Figma design
      light: '#E3F2FD',
      dark: '#1565C0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00BFA5', // Accent Green from Figma design
      light: '#E0F2F1',
      dark: '#00897B',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF5252', // Alert Red from Figma design
      light: '#FFEBEE',
      dark: '#D32F2F',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFA726', // Warning from Figma design
      light: '#FFF3E0',
      dark: '#F57C00',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#2196F3', // Info from Figma design
      light: '#E3F2FD',
      dark: '#1565C0',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#4CAF50', // Success from Figma design
      light: '#E8F5E9',
      dark: '#388E3C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5', // Neutral Gray from Figma design
      paper: '#FFFFFF',
    },
    text: {
      primary: '#424242', // Dark Gray from Figma design
      secondary: '#757575',
      disabled: '#BDBDBD',
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
    h4: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
    },
    h5: {
      fontSize: '1rem', // 16px
      fontWeight: 600,
    },
    h6: {
      fontSize: '0.875rem', // 14px
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
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
    },
    button: {
      textTransform: 'none', // Avoid uppercase text in buttons
      fontWeight: 500,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
      `,
    },
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
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#E3F2FD', // Light blue background on hover
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
  shape: {
    borderRadius: 4,
  },
  spacing: 8,
});

// Create light and dark Figma-based themes
export const figmaLightTheme = figmaTheme;

export const figmaDarkTheme = createTheme({
  ...figmaTheme,
  palette: {
    ...figmaTheme.palette,
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
  },
});

export default figmaTheme;