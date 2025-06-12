/**
 * Hooks Index
 * Central export for all hooks in the application
 */

// Core hooks
export { useMedplum } from './useMedplum';
export { useResource } from './useResource';
export { useNetworkStatus } from './useNetworkStatus';
export { default as useOfflineMode } from './useOfflineMode';

// Resource hooks - Patient and Practitioner
export { default as usePatient } from './usePatient';
export { default as usePractitioner } from './usePractitioner';

// Clinical resource hooks
export { useAllergyIntolerance, usePatientAllergies, useAllergyByCode, usePatientCriticalAllergies } from './useAllergyIntolerance';
export { useCondition, usePatientConditions } from './useCondition';
export { useImmunization, usePatientImmunizations } from './useImmunization';
export { useMedicationRequest, usePatientMedicationRequests } from './useMedicationRequest';
export { useEncounterHook as useEncounter, usePatientEncounters, useRecentPatientEncounters } from './useEncounter';
export { useObservationHook as useObservation, usePatientObservations, usePatientVitals } from './useObservation';
export { useOrganization, useHealthcareProviders, useOrganizationsByLocation } from './useOrganization';

// Specialized hooks
export { default as usePractitionerPatients } from './usePractitionerPatients';
export { default as usePractitionerById } from './usePractitionerById';
export { default as useCareTeam, usePatientCareTeams, useAllCareTeams, usePractitionerCareTeam } from './useCareTeam';

// Utility hooks
export { useRouteId } from './useRouteId';
export { useValidatedParams } from './useValidatedParams';

// Hook factories and utilities
export * from './factory';
export * from './base';
export * from './common';
