/**
 * Patient List Page
 * Updated to use the enhanced patient list component with Figma design implementation
 */
"use client";

import React from "react";
import PatientListPage from "../../features/patients/pages/PatientListPage";
import { createLogger } from "../../utils/logger";

// Initialize logger for debugging and monitoring
const logger = createLogger('PatientListPage');

/**
 * Patient List Page Component
 * Main entry point for displaying patient list with enhanced UI
 */
export default function PatientsPage() {
  // Log page load for monitoring
  React.useEffect(() => {
    logger.info('Patient list page loaded');
  }, []);

  return <PatientListPage />;
}