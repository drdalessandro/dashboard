/**
 * useObservation.ts - Generated Hook
 * 
 * Auto-generated Observation hook using the resource factory
 * Provides comprehensive FHIR Observation resource management for clinical observations
 */

import { Observation } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';
import React from 'react';

/**
 * Generated Observation hook with full FHIR support
 * 
 * Features included:
 * - Full CRUD operations for clinical observations
 * - Offline-first sync capabilities  
 * - Enhanced data with computed properties
 * - Type-safe operations throughout
 */
const useObservation = createResourceHook<Observation>(
  ResourceConfigs.Observation,
  {
    // Optional customizations
    onDataChange: (data) => {
      const count = Array.isArray(data) ? data.length : data ? 1 : 0;
      console.log('Observation data changed:', count, 'records');
    },
    onError: (error) => {
      console.error('Observation operation error:', error.userMessage);
    }
  }
);

/**
 * Patient-specific convenience function to get observations for a specific patient
 * @param patientId - The patient ID to filter observations for
 * @returns Hook result with patient's observations
 */
export function usePatientObservations(patientId: string) {
  const observationHook = useObservation();
  const patientObservationsRef = React.useRef(observationHook);
  const isMountedRef = React.useRef(true);

  // Cleanup function
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Set up patient-specific filter and fetch observations
  React.useEffect(() => {
    if (!patientId || !isMountedRef.current) return;

    const currentHook = patientObservationsRef.current;

    // Set filters for patient-specific observations
    currentHook?.setFilters?.({ subject: `Patient/${patientId}` });

    // Fetch observations with sorting by date (most recent first)
    currentHook?.fetchMany?.({
      sort: [{ field: 'effectiveDateTime', order: 'desc' }],
      pagination: { limit: 100 }
    });
  }, [patientId]);

  // Return the expected destructured format
  return {
    data: observationHook.data,
    isLoading: observationHook.isLoading,
    error: observationHook.error,
    refetch: observationHook.fetchMany
  };
}

/**
 * Get vital signs for a patient (Blood Pressure, Heart Rate, Glucose, Cholesterol, Body Weight)
 * @param patientId - The patient ID
 * @returns Hook result with vital observations
 */
export function usePatientVitals(patientId: string) {
  const observationHook = useObservation();
  const vitalsRef = React.useRef(observationHook);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!patientId || !isMountedRef.current) return;

    const currentHook = vitalsRef.current;

    // Common vital signs LOINC codes
    const vitalCodes = [
      '85354-9', // Blood pressure panel
      '8867-4',  // Heart rate
      '33747-0', // Blood glucose
      '14647-2', // Cholesterol
      '29463-7', // Body weight
      '8302-2',  // Body height
      '39156-5', // Body mass index
      '8310-5',  // Body temperature
      '2708-6',  // Oxygen saturation
      '9279-1'   // Respiratory rate
    ];

    // Set filters for patient-specific vital observations
    currentHook?.setFilters?.({
      subject: `Patient/${patientId}`,
      code: vitalCodes.join(',')
    });

    // Fetch vital observations with sorting by date (most recent first)
    currentHook?.fetchMany?.({
      sort: [{ field: 'effectiveDateTime', order: 'desc' }],
      pagination: { limit: 50 }
    });
  }, [patientId]);

  // Return the expected destructured format
  return {
    data: observationHook.data,
    isLoading: observationHook.isLoading,
    error: observationHook.error,
    refetch: observationHook.fetchMany
  };
}

// Export the hook and convenience functions
export default useObservation;
export { useObservation as useObservationHook };