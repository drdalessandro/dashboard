/**
 * useAllergyIntolerance.ts - Factory-Based Hook
 * 
 * Auto-generated AllergyIntolerance hook using the resource factory
 * Provides comprehensive FHIR AllergyIntolerance resource management for patient allergies
 * 
 * FIXED: Now properly uses createResourceHook factory pattern for consistency and performance
 */

import React from 'react';
import { AllergyIntolerance } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';

/**
 * Generated AllergyIntolerance hook with full FHIR support
 * 
 * Features included:
 * - Full CRUD operations for allergy records
 * - Offline-first sync capabilities  
 * - Enhanced data with computed properties
 * - Type-safe operations throughout
 * - Built-in caching and error handling
 * - Automatic pagination and filtering
 */
export const useAllergyIntolerance = createResourceHook<AllergyIntolerance>(
    ResourceConfigs.AllergyIntolerance,
    {
        // Optional customizations
        onDataChange: (data) => {
            const count = Array.isArray(data) ? data.length : data ? 1 : 0;
            console.log('AllergyIntolerance data changed:', count, 'records');
        },
        onError: (error) => {
            console.error('AllergyIntolerance operation error:', error.userMessage);
        }
    }
);

/**
 * Convenience hook for fetching allergies for a specific patient
 * Uses the factory-generated hook with proper patient filtering
 * 
 * @param patientId - The patient ID to fetch allergies for
 * @param options - Additional options for the query
 * @returns Hook result with patient-specific allergies
 */
export const usePatientAllergies = (patientId: string, options?: {
    enabled?: boolean;
    status?: 'active' | 'inactive' | 'resolved';
    criticality?: 'low' | 'high' | 'unable-to-assess';
    type?: 'allergy' | 'intolerance';
}) => {
    const allergyHook = useAllergyIntolerance();
    const {
        data,
        isLoading,
        error
    } = allergyHook;

    // Use refs to prevent infinite loops
    const allergyHookRef = React.useRef(allergyHook);
    allergyHookRef.current = allergyHook;

    const { enabled = true, status, criticality, type } = options || {};

    // Stable fetch function with direct reference
    const fetchPatientAllergies = React.useCallback(async () => {
        if (!enabled || !patientId) return;

        try {
            const filters = {
                'patient': `Patient/${patientId}`,
                ...(status && { 'clinical-status': status }),
                ...(criticality && { 'criticality': criticality }),
                ...(type && { 'type': type })
            };

            await allergyHookRef.current.fetchMany({
                sort: {
                    field: 'recordedDate',
                    direction: 'desc'
                },
                filters: filters
            });
        } catch (err) {
            console.error('Failed to fetch patient allergies:', err);
        }
    }, [patientId, enabled, status, criticality, type]);

    // Fetch data when parameters change
    React.useEffect(() => {
        fetchPatientAllergies();
    }, [fetchPatientAllergies]);

    // Create a manual refetch function
    const refetchPatientAllergies = React.useCallback(async () => {
        if (!patientId) return;

        try {
            await allergyHookRef.current.fetchMany({
                sort: {
                    field: 'recordedDate',
                    direction: 'desc'
                },
                filters: {
                    'patient': `Patient/${patientId}`,
                    ...(status && { 'clinical-status': status }),
                    ...(criticality && { 'criticality': criticality }),
                    ...(type && { 'type': type })
                }
            });
        } catch (err) {
            console.error('Failed to refetch patient allergies:', err);
        }
    }, [patientId, status, criticality, type]);

    return {
        data: Array.isArray(data) ? data : [],
        isLoading,
        error,
        refetch: refetchPatientAllergies
    };
};

/**
 * Hook for fetching high-criticality allergies for a patient
 * Uses the patient allergies hook with criticality filter
 */
export const usePatientCriticalAllergies = (patientId: string, options?: { enabled?: boolean }) => {
    return usePatientAllergies(patientId, {
        enabled: options?.enabled,
        status: 'active',
        criticality: 'high'
    });
};

/**
 * Hook for searching allergies by allergen code
 * Uses the factory-generated hook with code filtering
 */
export const useAllergyByCode = (allergenCode: string, options?: { enabled?: boolean }) => {
    const { data, isLoading, error, setFilters, fetchMany } = useAllergyIntolerance();
    const { enabled = true } = options || {};

    React.useEffect(() => {
        if (!enabled || !allergenCode) return;

        if (setFilters) {
            setFilters({ 'code': allergenCode });
        }
    }, [allergenCode, enabled, setFilters]);

    return { data, isLoading, error };
};

export default useAllergyIntolerance;
