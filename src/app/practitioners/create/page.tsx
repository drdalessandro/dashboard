/**
 * Practitioner Create Page
 * Displays the practitioner creation form using the feature components
 * Implements offline-first capabilities for healthcare workers in low-connectivity areas
 */
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { CircularProgress, Box, Typography } from "@mui/material";
import { createLogger } from "../../../utils/logger";

// Initialize logger for debugging and monitoring
const logger = createLogger('PractitionerCreatePage');

// Dynamically import the PractitionerCreatePage component with SSR disabled
const PractitionerCreateComponent = dynamic(
  () => import("../../../features/practitioners/pages/PractitionerCreatePage"),
  { ssr: false }
);

/**
 * Practitioner creation page component for the Gandall Healthcare Platform
 * Provides a form for adding new practitioners with FHIR compliance
 * Uses dynamic imports to ensure client-side rendering only
 */
export default function CreatePractitionerPage() {
  // Log page load for monitoring
  React.useEffect(() => {
    logger.info('Practitioner create page loaded');
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
      <PractitionerCreateComponent />
    </Suspense>
  );
}
