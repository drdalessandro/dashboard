/**
 * Patient Edit Page
 * Displays the patient edit form using the feature components
 * Implements offline-first capabilities for healthcare workers in low-connectivity areas
 */
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { CircularProgress, Box, Typography } from "@mui/material";
import { createLogger } from "../../../../utils/logger";

// Initialize logger for debugging and monitoring
const logger = createLogger('PatientEditPage');

// Dynamically import the PatientEditPage component with SSR disabled
const PatientEditComponent = dynamic(
  () => import("../../../../features/patients/pages/PatientEditPage"),
  { ssr: false }
);

/**
 * Patient edit page component for the Gandall Healthcare Platform
 * Provides a form for editing patients with FHIR compliance
 * Uses dynamic imports to ensure client-side rendering only
 */
export default function PatientEditPage() {
  // Log page load for monitoring
  React.useEffect(() => {
    logger.info('Patient edit page loaded');
  }, []);

  return (
    <Suspense fallback={
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="50vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading patient form...
        </Typography>
      </Box>
    }>
      <PatientEditComponent />
    </Suspense>
  );
}