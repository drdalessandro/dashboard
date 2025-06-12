/**
 * useEncounter.ts
 * 
 * Factory-generated hook for FHIR Encounter resources
 * Provides comprehensive Encounter management with healthcare platform integration
 */

import { Encounter } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';
import React from 'react';

// Generate the base Encounter hook using the factory
const useEncounter = createResourceHook<Encounter>(
  ResourceConfigs.Encounter,
  {
    // Optional customizations
    onDataChange: (data) => {
      const count = Array.isArray(data) ? data.length : data ? 1 : 0;
      console.log('Encounter data changed:', count, 'records');
    },
    onError: (error) => {
      console.error('Encounter operation error:', error.userMessage);
    }
  }
);

/**
 * Patient-specific convenience function to get encounters for a specific patient
 * @param patientId - The patient ID to filter encounters for
 * @returns Hook result with patient's encounters
 */
export function usePatientEncounters(patientId: string) {
  const encounterHook = useEncounter();
  const patientEncountersRef = React.useRef(encounterHook);
  const isMountedRef = React.useRef(true);
  // Cleanup function
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Set up patient-specific filter and fetch encounters
  React.useEffect(() => {
    if (!patientId || !isMountedRef.current) return;

    const currentHook = patientEncountersRef.current;

    // Set filters for patient-specific encounters
    currentHook?.setFilters?.({ subject: `Patient/${patientId}` });

    // Fetch encounters with sorting by date (most recent first)
    currentHook?.fetchMany?.({
      sort: [{ field: 'period.start', order: 'desc' }],
      pagination: { limit: 50 }
    });
  }, [patientId]);

  // Return the expected destructured format
  return {
    data: encounterHook.data,
    isLoading: encounterHook.isLoading,
    error: encounterHook.error,
    refetch: encounterHook.fetchMany
  };
}
/**
 * Get recent encounters for a patient (last 10)
 * @param patientId - The patient ID
 * @returns Hook result with recent encounters
 */
export function useRecentPatientEncounters(patientId: string) {
  const encounterHook = useEncounter();
  const recentEncountersRef = React.useRef(encounterHook);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!patientId || !isMountedRef.current) return;

    const currentHook = recentEncountersRef.current;

    // Set filters and fetch only recent encounters
    currentHook?.setFilters?.({ subject: `Patient/${patientId}` });
    currentHook?.fetchMany?.({
      sort: [{ field: 'period.start', order: 'desc' }],
      pagination: { limit: 10 }
    });
  }, [patientId]);

  // Return the expected destructured format
  return {
    data: encounterHook.data,
    isLoading: encounterHook.isLoading,
    error: encounterHook.error,
    refetch: encounterHook.fetchMany
  };
}

// Export the hook and convenience functions
export default useEncounter;
export { useEncounter as useEncounterHook };
