// src/features/patients/pages/PatientDashboardPage.tsx
"use client";

import React from 'react';
import PatientDetailsPage from './PatientDetailsPage';
import { useValidatedId } from '../../../hooks/useValidatedParams';
import { RouteParamLoader } from '../../../components/common/RouteParamLoader';

/**
 * Patient Dashboard Page - FIXED
 * A wrapper component that handles routing with proper parameter validation
 */
const PatientDashboardPage = () => {
  // FIXED: Use validated ID instead of direct useParams
  const idParam = useValidatedId();

  return (
    <RouteParamLoader 
      paramResult={idParam}
      resourceName="Patient"
      listPageUrl="/patients"
    >
      <PatientDetailsPage params={{ id: idParam.value! }} />
    </RouteParamLoader>
  );
};

export default PatientDashboardPage;