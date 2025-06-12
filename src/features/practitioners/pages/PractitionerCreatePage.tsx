/**
 * PractitionerCreatePage.tsx - Aligned with Edit Page Logic
 * 
 * Create page using ResourceEditPage pattern aligned with PractitionerEditPage
 */
"use client"

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Practitioner } from '@medplum/fhirtypes';

import { ResourceEditPage } from '../../../components/common/ResourceEditPage';
import { useResource } from '../../../hooks/useResource';
import PractitionerForm from '../components/PractitionerForm';
import { practitionerAdapter, PractitionerFormValues } from '../../../adapters/PractitionerAdapter';

const PractitionerCreatePage: React.FC = () => {
  const { t } = useTranslation(['practitioner', 'common']);

  // Use the resource hook for Practitioner resources
  const { fetchResource, updateResource, createResource } = useResource({
    resourceType: 'Practitioner'
  });

  // Define steps for the progress stepper (if needed)
  const steps = [
    t('steps.personalInfo', { ns: 'practitioner' }),
    t('steps.qualifications', { ns: 'practitioner' }),
    t('steps.contactInfo', { ns: 'practitioner' })
  ];

  // Handler for fetching a practitioner resource - not used in create mode
  const handleFetchPractitioner = React.useCallback(async (id: string): Promise<Practitioner> => {
    return await fetchResource<Practitioner>(id);
  }, [fetchResource]);

  // Handler for saving a practitioner resource - memoized to prevent recreation
  const handleSavePractitioner = React.useCallback(async (formValues: PractitionerFormValues): Promise<Practitioner> => {
    // For create page, always use createResource (no resourceId)
    const practitionerResource = practitionerAdapter.toResource(formValues, undefined);
    return await createResource<Practitioner>(practitionerResource);
  }, [createResource]);

  return (
    <ResourceEditPage<Practitioner, PractitionerFormValues>
      resourceType="Practitioner"
      // No resourceId for create mode
      resourceId={undefined}
      resourceDisplayName={t('navigation.practitioner', { ns: 'practitioner' })}
      fetchResource={handleFetchPractitioner}
      saveResource={handleSavePractitioner}
      mapResourceToForm={React.useCallback((resource) => practitionerAdapter.toFormValues(resource), [])}
      defaultFormValues={practitionerAdapter.getDefaultFormValues()}
      renderForm={(props) => <PractitionerForm {...props} />}
      listPageUrl="/practitioners"
      detailPageUrl={(id) => `/practitioners/show/${id}`}
      steps={steps}
      validateForm={(values) => practitionerAdapter.validateFormValues(values)}
    />
  );
};

export default PractitionerCreatePage;