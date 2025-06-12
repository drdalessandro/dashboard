/**
 * usePractitionerPatients.ts - Factory-Generated Implementation
 * 
 * Practitioner patients hook using the generic createResourceHook factory
 * Provides consistent interface and enhanced functionality
 */

import React from 'react';
import { Patient, Encounter, PractitionerRole } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';
import { formatHumanName } from '../utils/fhir/resourceUtils';
import { createLogger } from '../utils/logger';
import type { CategorizedError } from '../services/medplum';
import { useEncounterHook } from './useEncounter';
import { t } from 'i18next';

const logger = createLogger('usePractitionerPatients');

/**
 * Generic utility function to get practitioner role from patient's generalPractitioner field
 * Can be used in both practitioner patients view and patient details view
 */
export async function getPractitionerRoleForPatient(
    patient: Patient,
    practitionerId: string,
    practitionerRoleHook: any
): Promise<string> {
    if (!patient.generalPractitioner || !Array.isArray(patient.generalPractitioner)) {
        return 'General Practitioner';
    }

    // Find the practitioner reference in generalPractitioner array
    const practitionerRef = patient.generalPractitioner.find(gp =>
        gp.reference === `Practitioner/${practitionerId}`
    );

    if (!practitionerRef) {
        return 'General Practitioner';
    }

    try {
        // Search for PractitionerRole associated with this practitioner
        await practitionerRoleHook.search({
            'practitioner': `Practitioner/${practitionerId}`,
            '_count': '1'
        });

        const roles = Array.isArray(practitionerRoleHook.data) ? practitionerRoleHook.data :
            practitionerRoleHook.data ? [practitionerRoleHook.data] : [];

        if (roles.length > 0) {
            const role = roles[0] as PractitionerRole;
            // Get role from code.coding.display or code.text
            const roleDisplay = role.code?.[0]?.coding?.[0]?.display ||
                role.code?.[0]?.text ||
                role.specialty?.[0]?.coding?.[0]?.display ||
                role.specialty?.[0]?.text;

            if (roleDisplay) {
                return roleDisplay;
            }
        }
    } catch (err) {
        logger.error('Failed to fetch practitioner role:', err);
    }

    return 'General Practitioner';
}

export interface PractitionerPatientData {
    id: string;
    name: string;
    birthDate?: string;
    lastEncounterDate?: string;
    encounterType?: string;
    relationshipType?: string;
}

export interface UsePractitionerPatientsResult {
    totalPatientCount: number;
    recentPatients: PractitionerPatientData[];
    isLoading: boolean;
    error: CategorizedError | null;
    refetch: () => Promise<void>;
}

export interface UsePractitionerPatientsOptions {
    recentLimit?: number;
    enabled?: boolean;
}

// Create a PractitionerRole hook for role lookup
const usePractitionerRoleHook = createResourceHook<PractitionerRole>(
    ResourceConfigs.PractitionerRole || {
        resourceType: 'PractitionerRole',
        features: {
            enableCRUD: true,
            enableCaching: true,
            enableEnhancement: false,
            enablePagination: true,
            enableSearch: true,
            enableOffline: true,
            enableOptimisticUpdates: false
        }
    }
);

// Create a specialized Patient hook for practitioner-specific queries
const usePractitionerPatientHook = createResourceHook<Patient>(
    {
        ...ResourceConfigs.Patient,
        displayName: 'Practitioner Patients',
        description: 'Patients associated with a specific practitioner',
        features: {
            ...ResourceConfigs.Patient.features,
            enableEnhancement: true,
            enablePagination: true,
            enableSearch: true,
        },
        search: {
            ...ResourceConfigs.Patient.search,
            searchableFields: ['name', 'identifier', 'telecom', 'generalPractitioner'],
            defaultSort: { field: '_lastUpdated', order: 'desc' as const },
        }
    },
    {
        onDataChange: (data) => {
            const count = Array.isArray(data) ? data.length : data ? 1 : 0;
            logger.debug('Practitioner patients data changed:', count, 'records');
        },
        onError: (error) => {
            logger.error('Practitioner patients operation error:', error.userMessage);
        }
    }
);

/**
 * Factory-generated practitioner patients hook
 * Uses the generic createResourceHook factory for consistent behavior
 */
export function usePractitionerPatients(
    practitionerId: string,
    options: UsePractitionerPatientsOptions = {}
): UsePractitionerPatientsResult {
    const { recentLimit = 10, enabled = true } = options;
    const patientHook = usePractitionerPatientHook();
    const encounterHook = useEncounterHook();
    const practitionerRoleHook = usePractitionerRoleHook();

    // Track if component is mounted
    const isMountedRef = React.useRef(true);
    const [encounterData, setEncounterData] = React.useState<Record<string, { type: string; date: string }>>({});
    const [roleData, setRoleData] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Fetch patients for the specific practitioner
    const fetchPractitionerPatients = React.useCallback(async () => {
        if (!practitionerId || !enabled || !isMountedRef.current) {
            return;
        }

        try {
            logger.debug(`Fetching patients for practitioner: ${practitionerId}`);

            // Strategy 1: Search by generalPractitioner
            await patientHook.search({
                'general-practitioner': `Practitioner/${practitionerId}`,
                '_sort': '-_lastUpdated',
                '_count': '100'
            });

            // If no results from general practitioner search, we could implement
            // encounter-based search as a fallback, but the factory pattern
            // focuses on direct Patient resource queries
        } catch (err) {
            logger.error('Failed to fetch practitioner patients:', err);
        }
    }, [practitionerId, enabled, patientHook]);

    // Fetch encounters for patients once patient data is available
    const fetchEncountersForPatients = React.useCallback(async (patients: Patient[]) => {
        if (!patients.length || !isMountedRef.current) return;

        try {
            const encounterPromises = patients.map(async (patient) => {
                if (!patient.id) return null;

                // Search for encounters for this patient
                await encounterHook.search({
                    'subject': `Patient/${patient.id}`,
                    '_sort': '-period.start',
                    '_count': '10' // Only get the most recent encounters
                });

                const encounters = Array.isArray(encounterHook.data) ? encounterHook.data :
                    encounterHook.data ? [encounterHook.data] : [];

                if (encounters.length > 0) {
                    const mostRecentEncounter = encounters[0] as Encounter;
                    return {
                        patientId: patient.id,
                        type: mostRecentEncounter.type?.[0]?.text ||
                            mostRecentEncounter.type?.[0]?.coding?.[0]?.display ||
                            mostRecentEncounter.class?.display || 'Unknown',
                        date: mostRecentEncounter.period?.start || mostRecentEncounter.period?.end || ''
                    };
                }
                return null;
            });

            const encounterResults = await Promise.all(encounterPromises);
            const encounterMap: Record<string, { type: string; date: string }> = {};

            encounterResults.forEach((result) => {
                if (result) {
                    encounterMap[result.patientId] = {
                        type: result.type,
                        date: result.date
                    };
                }
            });

            if (isMountedRef.current) {
                setEncounterData(encounterMap);
            }
        } catch (err) {
            logger.error('Failed to fetch encounters for patients:', err);
        }
    }, [encounterHook]);

    // Set up practitioner-specific search when practitionerId changes
    React.useEffect(() => {
        if (enabled && practitionerId && isMountedRef.current) {
            fetchPractitionerPatients();
        }
    }, [enabled, practitionerId, fetchPractitionerPatients]);

    // Fetch practitioner roles for patients
    const fetchPractitionerRolesForPatients = React.useCallback(async (patients: Patient[]) => {
        if (!patients.length || !isMountedRef.current) return;

        try {
            const rolePromises = patients.map(async (patient) => {
                if (!patient.id) return null;

                const role = await getPractitionerRoleForPatient(patient, practitionerId, practitionerRoleHook);
                return {
                    patientId: patient.id,
                    role: role
                };
            });

            const roleResults = await Promise.all(rolePromises);
            const roleMap: Record<string, string> = {};

            roleResults.forEach((result) => {
                if (result) {
                    roleMap[result.patientId] = result.role;
                }
            });

            if (isMountedRef.current) {
                setRoleData(roleMap);
            }
        } catch (err) {
            logger.error('Failed to fetch practitioner roles for patients:', err);
        }
    }, [practitionerId, practitionerRoleHook]);

    // Fetch encounters when patient data changes
    React.useEffect(() => {
        if (patientHook.data && Array.isArray(patientHook.data) && patientHook.data.length > 0) {
            fetchEncountersForPatients(patientHook.data);
            fetchPractitionerRolesForPatients(patientHook.data);
        }
    }, [patientHook.data, fetchEncountersForPatients, fetchPractitionerRolesForPatients]);

    // Transform the raw patient data into the expected format
    const transformedData = React.useMemo(() => {
        if (!patientHook.data || !Array.isArray(patientHook.data)) {
            return {
                totalCount: 0,
                recentPatients: []
            };
        }

        const patients = patientHook.data as Patient[];
        const recentPatients = patients.slice(0, recentLimit).map(patient => {
            const patientId = patient.id || '';
            const encounterInfo = encounterData[patientId];
            const practitionerRole = roleData[patientId];

            return {
                id: patientId,
                name: formatHumanName(patient.name),
                birthDate: patient.birthDate || '',
                lastEncounterDate: encounterInfo?.date,
                encounterType: encounterInfo?.type || t('noEncounters', { ns: 'practitioner' }),
                relationshipType: practitionerRole || t('generalPractitioner', { ns: 'practitioner' })
            };
        });

        return {
            totalCount: patients.length,
            recentPatients
        };
    }, [patientHook.data, recentLimit, encounterData, roleData]);

    return {
        totalPatientCount: transformedData.totalCount,
        recentPatients: transformedData.recentPatients,
        isLoading: patientHook.isLoading,
        error: patientHook.error,
        refetch: fetchPractitionerPatients
    };
}

/**
 * Convenience hook for getting all patients for a practitioner
 */
export const useAllPractitionerPatients = (practitionerId: string, options?: {
    enabled?: boolean;
    includeInactive?: boolean;
}) => {
    const { enabled = true } = options || {};

    return usePractitionerPatients(practitionerId, {
        enabled,
        recentLimit: 1000 // Large limit to get all patients
    });
};

// Export as default for easy replacement
export default usePractitionerPatients;
