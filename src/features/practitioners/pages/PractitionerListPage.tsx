"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/ui/layout/DashboardLayout';
import { PractitionersList } from '../components/PractitionersList';

/**
 * Practitioner List Page
 * A simple wrapper around the PractitionersList component
 * This separates the page concerns from the feature implementation
 */
const PractitionerListPage: React.FC = () => {
  const { t } = useTranslation('practitioner');

  return (
    <DashboardLayout title={t('title')}>
      <PractitionersList />
    </DashboardLayout>
  );
};

export default PractitionerListPage;
