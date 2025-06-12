/**
 * useCondition.ts - Factory-Based Hook
 * 
 * Auto-generated Condition hook using the resource factory
 * Provides comprehensive FHIR Condition resource management
 * 
 * FIXED: Now properly uses createResourceHook factory pattern for consistency and performance
 */

import React from 'react';
import { Condition } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';

/**
 * Generated Condition hook with full FHIR support
 * 
 * Features included:
 * - Full CRUD operations
 * - Offline-first sync capabilities  
 * - Enhanced data with computed properties
 * - Type-safe operations throughout
 * - Built-in caching and error handling
 * - Automatic pagination and filtering
 */
export const useCondition = createResourceHook<Condition>(
    ResourceConfigs.Condition,
    {
        // Optional customizations
        onDataChange: (data) => {
            const count = Array.isArray(data) ? data.length : data ? 1 : 0;
            console.log('Condition data changed:', count, 'records');
        },
        onError: (error) => {
            console.error('Condition operation error:', error.userMessage);
        }
    }
);

/**
 * Convenience hook for fetching conditions for a specific patient
 * Uses the factory-generated hook with proper patient filtering
 * 
 * @param patientId - The patient ID to fetch conditions for
 * @param options - Additional options for the query
 * @returns Hook result with patient-specific conditions
 */
export const usePatientConditions = (patientId: string, options?: {
    enabled?: boolean;
    clinicalStatus?: 'active' | 'recurrence' | 'relapse' | 'inactive' | 'remission' | 'resolved';
    severity?: 'mild' | 'moderate' | 'severe';
    category?: string;
}) => {
    const conditionHook = useCondition();
    const {
        data,
        isLoading,
        error
    } = conditionHook;

    // Use refs to prevent infinite loops
    const conditionHookRef = React.useRef(conditionHook);
    conditionHookRef.current = conditionHook;

    const { enabled = true, clinicalStatus, severity, category } = options || {};

    // Stable fetch function with direct reference
    const fetchPatientConditions = React.useCallback(async () => {
        if (!enabled || !patientId) return;

        try {
            const patientFilters = {
                'subject': `Patient/${patientId}`,
                ...(clinicalStatus && { 'clinical-status': clinicalStatus }),
                ...(severity && { 'severity': severity }),
                ...(category && { 'category': category })
            };

            await conditionHookRef.current.fetchMany({
                sort: {
                    field: 'recordedDate',
                    direction: 'desc'
                },
                filters: patientFilters
            });
        } catch (err) {
            console.error('Failed to fetch patient conditions:', err);
        }
    }, [patientId, enabled, clinicalStatus, severity, category]);

    // Fetch data when parameters change
    React.useEffect(() => {
        fetchPatientConditions();
    }, [fetchPatientConditions]);

    // Create a manual refetch function
    const refetchPatientConditions = React.useCallback(async () => {
        if (!patientId) return;

        try {
            await conditionHookRef.current.fetchMany({
                sort: {
                    field: 'recordedDate',
                    direction: 'desc'
                },
                filters: {
                    'subject': `Patient/${patientId}`,
                    ...(clinicalStatus && { 'clinical-status': clinicalStatus }),
                    ...(severity && { 'severity': severity }),
                    ...(category && { 'category': category })
                }
            });
        } catch (err) {
            console.error('Failed to refetch patient conditions:', err);
        }
    }, [patientId, clinicalStatus, severity, category]);

    return {
        data: Array.isArray(data) ? data : [],
        isLoading,
        error,
        refetch: refetchPatientConditions
    };
};

export default useCondition;
