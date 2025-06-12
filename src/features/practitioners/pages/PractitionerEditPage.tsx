/**
 * PractitionerEditPage.tsx
 * 
 * Page component for editing Practitioner resources with proper parameter validation
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Practitioner } from '@medplum/fhirtypes';

import { ResourceEditPage } from '../../../components/common/ResourceEditPage';
import { useResource } from '../../../hooks/useResource';
import PractitionerForm from '../components/PractitionerForm';
import { practitionerAdapter, PractitionerFormValues } from '../../../adapters/PractitionerAdapter';
import { useValidatedId } from '../../../hooks/useValidatedParams';
import { RouteParamLoader } from '../../../components/common/RouteParamLoader';

const PractitionerEditPage: React.FC = () => {
  const { t } = useTranslation(['practitioner', 'common']);

  // Use validated ID instead of direct useParams
  const idParam = useValidatedId();
  const practitionerId = idParam.value;

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

  // Handler for fetching a practitioner resource - memoized to prevent recreation
  const handleFetchPractitioner = React.useCallback(async (id: string): Promise<Practitioner> => {
    return await fetchResource<Practitioner>(id);
  }, [fetchResource]);

  // Handler for saving a practitioner resource - memoized to prevent recreation
  const handleSavePractitioner = React.useCallback(async (formValues: PractitionerFormValues): Promise<Practitioner> => {
    const practitionerResource = practitionerAdapter.toResource(formValues, practitionerId ?? undefined);

    if (practitionerId) {
      return await updateResource<Practitioner>(practitionerResource);
    } else {
      return await createResource<Practitioner>(practitionerResource);
    }
  }, [updateResource, createResource, practitionerId]);

  return (
    <RouteParamLoader
      paramResult={idParam}
      resourceName="Practitioner"
      listPageUrl="/practitioners"
    >
      <ResourceEditPage<Practitioner, PractitionerFormValues>
        resourceType="Practitioner"
        resourceId={practitionerId ?? undefined}
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
    </RouteParamLoader>
  );
};

export default PractitionerEditPage;