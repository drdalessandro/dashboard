/**
 * useImmunization.ts - Generated Hook
 * 
 * Auto-generated Immunization hook using the resource factory
 * Provides comprehensive FHIR Immunization resource management for patient vaccinations
 */

import React from 'react';
import { Immunization } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';

/**
 * Generated Immunization hook with full FHIR support
 * 
 * Features included:
 * - Full CRUD operations for immunization records
 * - Offline-first sync capabilities  
 * - Enhanced data with computed properties
 * - Type-safe operations throughout
 */
export const useImmunization = createResourceHook<Immunization>(
    ResourceConfigs.Immunization,
    {
        // Optional customizations
        onDataChange: (data) => {
            const count = Array.isArray(data) ? data.length : data ? 1 : 0;
            console.log('Immunization data changed:', count, 'records');
        },
        onError: (error) => {
            console.error('Immunization operation error:', error.userMessage);
        }
    }
);

/**
 * Convenience hook for fetching immunizations for a specific patient
 * 
 * @param patientId - The patient ID to fetch immunizations for
 * @param options - Additional options for the query
 * @returns Hook result with patient-specific immunizations
 */
export const usePatientImmunizations = (patientId: string, options?: {
    enabled?: boolean;
    status?: 'completed' | 'entered-in-error' | 'not-done';
    vaccineCode?: string;
}) => {
    const immunizationHook = useImmunization();
    const {
        data,
        isLoading,
        error
    } = immunizationHook;

    // Use refs to prevent infinite loops
    const immunizationHookRef = React.useRef(immunizationHook);
    immunizationHookRef.current = immunizationHook;

    const { enabled = true, status, vaccineCode } = options || {};

    // Stable fetch function with direct reference
    const fetchPatientImmunizations = React.useCallback(async () => {
        if (!enabled || !patientId) return;

        try {
            const filters = {
                'patient': `Patient/${patientId}`,
                ...(status && { 'status': status }),
                ...(vaccineCode && { 'vaccine-code': vaccineCode })
            };

            await immunizationHookRef.current.fetchMany({
                sort: {
                    field: 'date',
                    direction: 'desc'
                },
                filters: filters
            });
        } catch (err) {
            console.error('Failed to fetch patient immunizations:', err);
        }
    }, [patientId, enabled, status, vaccineCode]);

    // Fetch data when parameters change
    React.useEffect(() => {
        fetchPatientImmunizations();
    }, [fetchPatientImmunizations]);

    // Create a manual refetch function
    const refetchPatientImmunizations = React.useCallback(async () => {
        if (!patientId) return;

        try {
            await immunizationHookRef.current.fetchMany({
                sort: {
                    field: 'date',
                    direction: 'desc'
                },
                filters: {
                    'patient': `Patient/${patientId}`,
                    ...(status && { 'status': status }),
                    ...(vaccineCode && { 'vaccine-code': vaccineCode })
                }
            });
        } catch (err) {
            console.error('Failed to refetch patient immunizations:', err);
        }
    }, [patientId, status, vaccineCode]);

    return {
        data: Array.isArray(data) ? data : [],
        isLoading,
        error,
        refetch: refetchPatientImmunizations
    };
};