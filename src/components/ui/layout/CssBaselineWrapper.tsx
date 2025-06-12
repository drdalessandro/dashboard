"use client";

import React from 'react';
import { CssBaseline } from '@mui/material';

/**
 * CssBaselineWrapper
 * 
 * This component wraps the CssBaseline component to ensure
 * that all @import rules are handled correctly.
 */
export const CssBaselineWrapper: React.FC = () => {
  // Only render the CssBaseline component
  return <CssBaseline />;
};

export default CssBaselineWrapper;
