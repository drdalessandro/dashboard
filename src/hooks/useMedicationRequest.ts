/**
 * useMedicationRequest.ts - Factory-Based Hook
 * 
 * Auto-generated MedicationRequest hook using the resource factory
 * Provides comprehensive FHIR MedicationRequest resource management for prescriptions
 * 
 * FIXED: Now properly uses createResourceHook factory pattern for consistency and performance
 */

import React from 'react';
import { MedicationRequest } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';

/**
 * Generated MedicationRequest hook with full FHIR support
 * 
 * Features included:
 * - Full CRUD operations for prescriptions
 * - Offline-first sync capabilities  
 * - Enhanced data with computed properties
 * - Type-safe operations throughout
 * - Built-in caching and error handling
 * - Automatic pagination and filtering
 */
export const useMedicationRequest = createResourceHook<MedicationRequest>(
    ResourceConfigs.MedicationRequest,
    {
        // Optional customizations
        onDataChange: (data) => {
            const count = Array.isArray(data) ? data.length : data ? 1 : 0;
            console.log('MedicationRequest data changed:', count, 'records');
        },
        onError: (error) => {
            console.error('MedicationRequest operation error:', error.userMessage);
        }
    }
);

/**
 * Convenience hook for fetching medication requests for a specific patient
 * Uses the factory-generated hook with proper patient filtering
 * 
 * @param patientId - The patient ID to fetch medication requests for
 * @param options - Additional options for the query
 * @returns Hook result with patient-specific medication requests
 */
export const usePatientMedicationRequests = (patientId: string, options?: {
    enabled?: boolean;
    status?: 'active' | 'on-hold' | 'cancelled' | 'completed';
    intent?: 'proposal' | 'plan' | 'order';
}) => {
    const medicationHook = useMedicationRequest();
    const {
        data,
        isLoading,
        error
    } = medicationHook;

    // Use refs to prevent infinite loops
    const medicationHookRef = React.useRef(medicationHook);
    medicationHookRef.current = medicationHook;

    const { enabled = true, status, intent } = options || {};

    // Stable fetch function with direct reference
    const fetchPatientMedicationRequests = React.useCallback(async () => {
        if (!enabled || !patientId) return;

        try {
            const filters = {
                'subject': `Patient/${patientId}`,
                ...(status && { 'status': status }),
                ...(intent && { 'intent': intent })
            };

            await medicationHookRef.current.fetchMany({
                sort: {
                    field: 'authoredOn',
                    direction: 'desc'
                },
                filters: filters
            });
        } catch (err) {
            console.error('Failed to fetch patient medication requests:', err);
        }
    }, [patientId, enabled, status, intent]);

    // Fetch data when parameters change
    React.useEffect(() => {
        fetchPatientMedicationRequests();
    }, [fetchPatientMedicationRequests]);

    // Create a manual refetch function
    const refetchPatientMedicationRequests = React.useCallback(async () => {
        if (!patientId) return;

        try {
            await medicationHookRef.current.fetchMany({
                sort: {
                    field: 'authoredOn',
                    direction: 'desc'
                },
                filters: {
                    'subject': `Patient/${patientId}`,
                    ...(status && { 'status': status }),
                    ...(intent && { 'intent': intent })
                }
            });
        } catch (err) {
            console.error('Failed to refetch patient medication requests:', err);
        }
    }, [patientId, status, intent]);

    return {
        data: Array.isArray(data) ? data : [],
        isLoading,
        error,
        refetch: refetchPatientMedicationRequests
    };
};

export default useMedicationRequest;
