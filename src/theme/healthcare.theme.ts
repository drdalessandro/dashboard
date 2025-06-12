import { createTheme, ThemeOptions } from '@mui/material/styles';
// Import the design system theme from Step 1
import { designSystemTheme } from './designSystemTheme';

// Healthcare Platform Theme Configuration
// This extends the design system theme with any healthcare-specific overrides
export const healthcareTheme: ThemeOptions = {
  ...designSystemTheme,
  // Any healthcare-specific overrides can be added here
  // For now, we'll use the design system theme as-is
};

// Create the theme instance
export const theme = createTheme(healthcareTheme);

// Export default for backward compatibility
export default theme;
