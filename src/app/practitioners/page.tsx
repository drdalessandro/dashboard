/**
 * Practitioner List Page
 * Updated to use the enhanced practitioner list component with Figma design implementation
 */
"use client";

import React from "react";
import PractitionerListPage from "../../features/practitioners/pages/PractitionerListPage";
import { createLogger } from "../../utils/logger";

// Initialize logger for debugging and monitoring
const logger = createLogger('PractitionerListPage');

/**
 * Practitioner List Page Component
 * Main entry point for displaying practitioner list with enhanced UI
 */
export default function PractitionersPage() {
  // Log page load for monitoring
  React.useEffect(() => {
    logger.info('Practitioner list page loaded');
  }, []);

  return <PractitionerListPage />;
}