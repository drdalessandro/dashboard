"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/ui/layout/DashboardLayout';
import { PatientsList } from '../components/PatientsList';

/**
 * Patient List Page
 * A simple wrapper around the PatientsList component
 * This separates the page concerns from the feature implementation
 */
const PatientListPage: React.FC = () => {
  const { t } = useTranslation('patient');

  return (
    <DashboardLayout title={t('title')}>
      <PatientsList />
    </DashboardLayout>
  );
};

export default PatientListPage;
