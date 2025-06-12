import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usePatient } from '@/hooks/usePatient';
import { usePatientAllergies } from '@/hooks/useAllergyIntolerance';
import { usePatientConditions } from '@/hooks/useCondition';
import { usePatientImmunizations } from '@/hooks/useImmunization';
import { usePatientMedicationRequests } from '@/hooks/useMedicationRequest';
import { getPatientIdDiagnostics } from '@/utils/medplumUtils';
import {
  processClinicalDataFromResponses,
  transformPatientForDisplay,
  getDefaultVitals
} from '../utils/patientDataUtils';

/**
 * Hook for fetching and managing patient details with related clinical data
 * Optimized to prevent infinite loops and unnecessary re-renders
 */
export const usePatientDetails = (patientId: string) => {
  const { t } = useTranslation(['patient']);

  // Use refs for stable hook references to prevent infinite loops
  const isMountedRef = useRef(true);
  const patientHook = usePatient();
  const patientHookRef = useRef(patientHook);
  patientHookRef.current = patientHook;

  // Get diagnostics and validation
  const diagnostics = useMemo(() => getPatientIdDiagnostics(patientId), [patientId]);
  const isValidPatientId = diagnostics.isValid;

  // Use the patient hook directly
  const {
    data: patientData,
    isLoading: patientLoading,
    error: patientError
  } = patientHook;

  // Stable fetch function using useCallback with retry mechanism
  const fetchPatientData = useCallback(async (id: string) => {
    if (!isMountedRef.current) return;

    try {
      await patientHookRef.current.fetchOne(id);
    } catch (err) {
      console.error('Error fetching patient:', err);

      // Retry mechanism for failed authentication
      if (err instanceof Error && (err.message.includes('fetch failed') || err.message.includes('401'))) {
        console.log('Retrying patient fetch due to authentication issue...');
        setTimeout(() => {
          if (isMountedRef.current) {
            patientHookRef.current.fetchOne(id).catch(retryErr => {
              console.error('Retry failed:', retryErr);
            });
          }
        }, 1000);
      }
    }
  }, []); // Empty dependencies for stable reference

  // Fetch patient data when ID is valid
  useEffect(() => {
    if (isValidPatientId && diagnostics.normalizedId) {
      const timeoutId = setTimeout(() => {
        fetchPatientData(diagnostics.normalizedId);
      }, 100); // Slightly longer delay to allow authentication to settle
      return () => clearTimeout(timeoutId);
    }
  }, [isValidPatientId, diagnostics.normalizedId, fetchPatientData]); // Removed unstable fetchPatient

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Get single patient from response (handle both array and single object responses)
  const patient = useMemo(() => {
    if (!patientData) return null;
    return Array.isArray(patientData) ? patientData[0] : patientData;
  }, [patientData]);

  // Memoize the patient ID to prevent unnecessary re-renders
  const patientIdForDeps = diagnostics.normalizedId;

  // Fetch related clinical data using patient-specific hooks
  const allergiesResponse = usePatientAllergies(patientIdForDeps, {
    enabled: isValidPatientId && !!patientIdForDeps
  });
  const conditionsResponse = usePatientConditions(patientIdForDeps, {
    enabled: isValidPatientId && !!patientIdForDeps
  });
  const immunizationsResponse = usePatientImmunizations(patientIdForDeps, {
    enabled: isValidPatientId && !!patientIdForDeps
  });
  const medicationsResponse = usePatientMedicationRequests(patientIdForDeps, {
    status: 'active',
    enabled: isValidPatientId && !!patientIdForDeps
  });

  // Normalize clinical data responses to always have array or undefined for data
  const normalizedAllergies = useMemo(() => {
    if (allergiesResponse.data == null) return undefined;
    return Array.isArray(allergiesResponse.data)
      ? allergiesResponse.data
      : [allergiesResponse.data];
  }, [allergiesResponse.data]);

  const normalizedConditions = useMemo(() => {
    if (conditionsResponse.data == null) return undefined;
    return Array.isArray(conditionsResponse.data)
      ? conditionsResponse.data
      : [conditionsResponse.data];
  }, [conditionsResponse.data]);

  const normalizedImmunizations = useMemo(() => {
    if (immunizationsResponse.data == null) return undefined;
    return Array.isArray(immunizationsResponse.data)
      ? immunizationsResponse.data
      : [immunizationsResponse.data];
  }, [immunizationsResponse.data]);

  const normalizedMedications = useMemo(() => {
    if (medicationsResponse.data == null) return undefined;
    return Array.isArray(medicationsResponse.data)
      ? medicationsResponse.data
      : [medicationsResponse.data];
  }, [medicationsResponse.data]);

  // Process clinical data with normalized responses
  const processedClinicalData = useMemo(() => processClinicalDataFromResponses(
    { ...allergiesResponse, data: normalizedAllergies },
    { ...conditionsResponse, data: normalizedConditions },
    { ...immunizationsResponse, data: normalizedImmunizations },
    { ...medicationsResponse, data: normalizedMedications }
  ), [
    normalizedAllergies, allergiesResponse.isLoading,
    normalizedConditions, conditionsResponse.isLoading,
    normalizedImmunizations, immunizationsResponse.isLoading,
    normalizedMedications, medicationsResponse.isLoading
  ]);

  // Transform patient data for display
  const patientDisplayData = useMemo(() => {
    if (!patient) return null;
    return transformPatientForDisplay(
      patient,
      getDefaultVitals(),
      processedClinicalData
    );
  }, [patient, processedClinicalData]);

  // Simplified loading state calculation - trust the individual hook states
  const isLoading = useMemo(() => {
    // Don't show loading for invalid IDs
    if (!isValidPatientId) return false;
    
    // Show loading if any individual hook is loading
    return (
      patientLoading ||
      allergiesResponse.isLoading ||
      conditionsResponse.isLoading ||
      immunizationsResponse.isLoading ||
      medicationsResponse.isLoading
    );
  }, [
    isValidPatientId,
    patientLoading,
    allergiesResponse.isLoading,
    conditionsResponse.isLoading,
    immunizationsResponse.isLoading,
    medicationsResponse.isLoading
  ]);

  // Enhanced error handling that combines all potential errors
  const combinedError = useMemo(() => {
    // If there's a fetch error, don't treat it as a blocking error - let the UI handle it
    const fetchErrors = [
      patientError,
      allergiesResponse.error,
      conditionsResponse.error,
      immunizationsResponse.error,
      medicationsResponse.error
    ].filter(Boolean);

    // Only return error if it's not a simple fetch failure (authentication issue)
    const nonFetchErrors = fetchErrors.filter(error =>
      !(error instanceof Error && error.message.includes('fetch failed'))
    );

    return nonFetchErrors.length > 0 ? nonFetchErrors[0] : null;
  }, [
    patientError,
    allergiesResponse.error,
    conditionsResponse.error,
    immunizationsResponse.error,
    medicationsResponse.error
  ]);

  // Expose refetch function that refreshes all data
  const refetch = useCallback(async () => {
    if (!isValidPatientId || !diagnostics.normalizedId) return;

    try {
      // Refetch patient data
      await patientHookRef.current.refetch();

      // Refetch all clinical data
      await Promise.all([
        allergiesResponse.refetch?.(),
        conditionsResponse.refetch?.(),
        immunizationsResponse.refetch?.(),
        medicationsResponse.refetch?.()
      ].filter(Boolean));

      console.log('All patient data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing patient data:', error);
    }
  }, [
    isValidPatientId,
    diagnostics.normalizedId,
    allergiesResponse.refetch,
    conditionsResponse.refetch,
    immunizationsResponse.refetch,
    medicationsResponse.refetch
  ]);

  return {
    diagnostics,
    isValidPatientId,
    patient,
    patientDisplayData,
    allergies: allergiesResponse.data,
    conditions: conditionsResponse.data,
    immunizations: immunizationsResponse.data,
    medications: medicationsResponse.data,
    isLoading,
    error: combinedError,
    refetch
  };
};
