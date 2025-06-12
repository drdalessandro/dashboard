/**
 * Practitioner Edit Page
 * Displays the practitioner edit form using the feature components
 * Implements offline-first capabilities for healthcare workers in low-connectivity areas
 */
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { CircularProgress, Box, Typography } from "@mui/material";
import { createLogger } from "../../../../utils/logger";

// Initialize logger for debugging and monitoring
const logger = createLogger('PractitionerEditPage');

// Dynamically import the PractitionerEditPage component with SSR disabled
const PractitionerEditComponent = dynamic(
  () => import("../../../../features/practitioners/pages/PractitionerEditPage"),
  { ssr: false }
);

/**
 * Practitioner edit page component for the Gandall Healthcare Platform
 * Provides a form for editing practitioners with FHIR compliance
 * Uses dynamic imports to ensure client-side rendering only
 */
export default function PractitionerEditPage() {
  // Log page load for monitoring
  React.useEffect(() => {
    logger.info('Practitioner edit page loaded');
  }, []);

  return (
    <Suspense fallback={
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="50vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading practitioner form...
        </Typography>
      </Box>
    }>
      <PractitionerEditComponent />
    </Suspense>
  );
}