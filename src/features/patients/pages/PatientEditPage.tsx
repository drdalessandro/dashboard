/**
 * PatientEditPage.tsx
 * 
 * FIXED: Refactored page component for editing Patient resources with proper parameter validation
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Patient } from '@medplum/fhirtypes';

import { ResourceEditPage } from '../../../components/common/ResourceEditPage';
import { useResource } from '../../../hooks/useResource';
import PatientForm from '../components/PatientForm';
import { patientAdapter, PatientFormValues } from '../../../adapters/PatientAdapter';
import { useValidatedId } from '../../../hooks/useValidatedParams';
import { RouteParamLoader } from '../../../components/common/RouteParamLoader';
const PatientEditPage: React.FC = () => {
  const { t } = useTranslation('patient');

  // FIXED: Use validated ID instead of direct useParams
  const idParam = useValidatedId();
  const patientId = idParam.value;

  // Use the resource hook for Patient resources
  const { fetchResource, updateResource, createResource } = useResource({
    resourceType: 'Patient'
  });

  // Define steps for the progress stepper
  const steps = [
    t('labels.steps.personalInfo.title', { ns: 'patient' }),
    t('labels.steps.contactInfo.title', { ns: 'patient' }),
    t('labels.steps.addressInfo.title', { ns: 'patient' })
  ];

  // Memoize handlers to avoid recreating them on every render
  const handleFetchPatient = React.useCallback(async (id: string): Promise<Patient> => {
    return await fetchResource<Patient>(id);
  }, [fetchResource]);

  // Handler for saving a patient resource
  const handleSavePatient = React.useCallback(async (formValues: PatientFormValues): Promise<Patient> => {
    const patientResource = patientAdapter.toResource(formValues, patientId || undefined);

    if (patientId) {
      return await updateResource<Patient>(patientResource);
    } else {
      return await createResource<Patient>(patientResource);
    }
  }, [updateResource, createResource, patientId]);

  return (
    <RouteParamLoader
      paramResult={idParam}
      resourceName="Patient"
      listPageUrl="/patients"
    >
      <ResourceEditPage<Patient, PatientFormValues>
        resourceType="Patient"
        resourceId={patientId || undefined}
        resourceDisplayName={t('labels.personalInfo.title', { ns: 'patient' })}
        fetchResource={handleFetchPatient}
        saveResource={handleSavePatient}
        mapResourceToForm={React.useCallback((resource) => patientAdapter.toFormValues(resource), [])}
        defaultFormValues={patientAdapter.getDefaultFormValues()}
        renderForm={(props) => <PatientForm {...props} />}
        listPageUrl="/patients"
        detailPageUrl={(id) => `/patients/show/${id}`}
        steps={steps}
        validateForm={(values) => patientAdapter.validateFormValues(values)}
      />
    </RouteParamLoader>
  );
};

export default PatientEditPage;