import { RefineThemes } from "@refinedev/mui";
import { createTheme } from "@mui/material/styles";
import { deepmerge } from "@mui/utils";
import { figmaLightTheme, figmaDarkTheme } from './figmaTheme';

// Gandall Group brand colors
export const colors = {
  primary: '#2A8A8E', // Teal orbital
  secondary: '#E47846', // Orange orbital
  accent: '#D83E54', // Red orbital
  highlight: '#C6D62F', // Light Green orbital
  text: {
    primary: '#000000', // Black
    secondary: '#424242',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
  },
  status: {
    pending: '#4FC3F7',
    success: '#4CAF50',
    warning: '#FFA726',
    error: '#FF5252',
    info: '#2196F3'
  }
};

// Use Figma theme instead of custom ones
export const customLightTheme = figmaLightTheme;
export const customDarkTheme = figmaDarkTheme;