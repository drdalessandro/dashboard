/**
 * useCareTeam.ts - Factory-Generated Implementation
 * 
 * Care team hook using the generic createResourceHook factory
 * Provides consistent interface and enhanced functionality
 */

import React from 'react';
import { CareTeam, Patient, Practitioner, PractitionerRole } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';
import { formatHumanName } from '../utils/fhir/resourceUtils';
import { createLogger } from '../utils/logger';
import type { CategorizedError } from '../services/medplum';
import { t } from 'i18next';

const logger = createLogger('useCareTeam');

/**
 * Generic utility function to get practitioner role from care team participant
 * Can be used in both care team view and patient details view
 */
export async function getPractitionerRoleForCareTeamParticipant(
    careTeam: CareTeam,
    practitionerId: string,
    practitionerRoleHook: any
): Promise<string> {
    if (!careTeam.participant || !Array.isArray(careTeam.participant)) {
        return 'Care Team Member';
    }

    // Find the practitioner in participants array
    const participant = careTeam.participant.find(p =>
        p.member?.reference === `Practitioner/${practitionerId}`
    );

    if (!participant) {
        return 'Care Team Member';
    }

    // If the participant has a role defined directly
    if (participant.role?.[0]?.coding?.[0]?.display) {
        return participant.role[0].coding[0].display;
    }

    if (participant.role?.[0]?.text) {
        return participant.role[0].text;
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

    return 'Care Team Member';
}

export interface CareTeamData {
    id: string;
    name?: string;
    status: string;
    subject?: string;
    participantCount: number;
    category?: string;
    period?: {
        start?: string;
        end?: string;
    };
}

export interface PractitionerCareTeamData {
    id: string;
    name?: string;
    role?: string;
    organization?: {
        reference?: string;
        display?: string;
    };
    department?: string;
    specialty?: string;
    status: string;
    period?: {
        start?: string;
        end?: string;
    };
}

export interface UseCareTeamResult {
    totalCareTeamCount: number;
    recentCareTeams: CareTeamData[];
    isLoading: boolean;
    error: CategorizedError | null;
    refetch: () => Promise<void>;
}

export interface UseCareTeamOptions {
    recentLimit?: number;
    enabled?: boolean;
    patientId?: string;
}

export interface UsePractitionerCareTeamResult {
    careTeams: PractitionerCareTeamData[];
    isLoading: boolean;
    error: CategorizedError | null;
    refetch: () => Promise<void>;
}

export interface UsePractitionerCareTeamOptions {
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

// Create a specialized CareTeam hook
const useCareTeamHook = createResourceHook<CareTeam>(
    {
        ...ResourceConfigs.CareTeam,
        displayName: 'Care Teams',
        description: 'Healthcare care teams',
        features: {
            ...ResourceConfigs.CareTeam.features,
            enableEnhancement: true,
            enablePagination: true,
            enableSearch: true,
        },
        search: {
            ...ResourceConfigs.CareTeam.search,
            searchableFields: ['name', 'subject', 'participant'],
            defaultSort: { field: '_lastUpdated', order: 'desc' as const },
        }
    },
    {
        onDataChange: (data) => {
            const count = Array.isArray(data) ? data.length : data ? 1 : 0;
            logger.debug('Care teams data changed:', count, 'records');
        },
        onError: (error) => {
            logger.error('Care teams operation error:', error.userMessage);
        }
    }
);

/**
 * Factory-generated care team hook
 * Uses the generic createResourceHook factory for consistent behavior
 */
export function useCareTeam(
    options: UseCareTeamOptions = {}
): UseCareTeamResult {
    const { recentLimit = 10, enabled = true, patientId } = options;
    const careTeamHook = useCareTeamHook();
    const practitionerRoleHook = usePractitionerRoleHook();

    // Track if component is mounted
    const isMountedRef = React.useRef(true);

    React.useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Fetch care teams
    const fetchCareTeams = React.useCallback(async () => {
        if (!enabled || !isMountedRef.current) {
            return;
        }

        try {
            logger.debug('Fetching care teams', { patientId });

            const searchParams: Record<string, string> = {
                '_sort': '-_lastUpdated',
                '_count': '100'
            };

            // If patientId is provided, filter by subject
            if (patientId) {
                searchParams['subject'] = `Patient/${patientId}`;
            }

            await careTeamHook.search(searchParams);
        } catch (err) {
            logger.error('Failed to fetch care teams:', err);
        }
    }, [enabled, patientId, careTeamHook]);

    // Set up search when options change
    React.useEffect(() => {
        if (enabled && isMountedRef.current) {
            fetchCareTeams();
        }
    }, [enabled, fetchCareTeams]);

    // Transform the raw care team data into the expected format
    const transformedData = React.useMemo(() => {
        if (!careTeamHook.data || !Array.isArray(careTeamHook.data)) {
            return {
                totalCount: 0,
                recentCareTeams: []
            };
        }

        const careTeams = careTeamHook.data as CareTeam[];
        const recentCareTeams = careTeams.slice(0, recentLimit).map(careTeam => {
            const participantCount = careTeam.participant?.length || 0;
            const category = careTeam.category?.[0]?.coding?.[0]?.display ||
                careTeam.category?.[0]?.text ||
                'General Care Team';

            return {
                id: careTeam.id || '',
                name: careTeam.name || t('unnamedCareTeam', { ns: 'common' }),
                status: careTeam.status || 'unknown',
                subject: careTeam.subject?.reference,
                participantCount,
                category,
                period: careTeam.period ? {
                    start: careTeam.period.start,
                    end: careTeam.period.end
                } : undefined
            };
        });

        return {
            totalCount: careTeams.length,
            recentCareTeams
        };
    }, [careTeamHook.data, recentLimit]);

    return {
        totalCareTeamCount: transformedData.totalCount,
        recentCareTeams: transformedData.recentCareTeams,
        isLoading: careTeamHook.isLoading,
        error: careTeamHook.error,
        refetch: fetchCareTeams
    };
}

/**
 * Hook to fetch care teams where a practitioner is a participant
 */
export function usePractitionerCareTeam(
    practitionerId: string,
    options: UsePractitionerCareTeamOptions = {}
): UsePractitionerCareTeamResult {
    const { enabled = true } = options;
    const careTeamHook = useCareTeamHook();

    // Track if component is mounted
    const isMountedRef = React.useRef(true);

    React.useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Fetch care teams where practitioner is a participant
    const fetchCareTeams = React.useCallback(async () => {
        if (!enabled || !practitionerId || !isMountedRef.current) {
            return;
        }

        try {
            logger.debug('Fetching care teams for practitioner:', practitionerId);

            const searchParams: Record<string, string> = {
                'participant': `Practitioner/${practitionerId}`,
                '_sort': '-_lastUpdated',
                '_count': '50'
            };

            await careTeamHook.search(searchParams);
        } catch (err) {
            logger.error('Failed to fetch practitioner care teams:', err);
        }
    }, [enabled, practitionerId, careTeamHook]);

    // Set up search when options change
    React.useEffect(() => {
        if (enabled && practitionerId && isMountedRef.current) {
            fetchCareTeams();
        }
    }, [enabled, practitionerId, fetchCareTeams]);

    // Transform the raw care team data into the expected format
    const transformedData = React.useMemo(() => {
        if (!careTeamHook.data || !Array.isArray(careTeamHook.data)) {
            return [];
        }

        const careTeams = careTeamHook.data as CareTeam[];
        
        return careTeams.map(careTeam => {
            // Find the participant that matches our practitioner
            const participant = careTeam.participant?.find(p =>
                p.member?.reference === `Practitioner/${practitionerId}`
            );

            // Extract role information from the participant
            const role = participant?.role?.[0]?.coding?.[0]?.display ||
                participant?.role?.[0]?.text ||
                'Care Team Member';

            // Extract organization information
            const organization = careTeam.managingOrganization?.[0] || participant?.onBehalfOf;

            // Extract department/specialty from category or participant role
            const department = careTeam.category?.[0]?.coding?.[0]?.display ||
                careTeam.category?.[0]?.text ||
                participant?.role?.[0]?.coding?.[0]?.display ||
                'General Medicine';

            return {
                id: careTeam.id || '',
                name: careTeam.name || 'Unnamed Care Team',
                role,
                organization: organization ? {
                    reference: organization.reference,
                    display: organization.display || 'Unknown Organization'
                } : undefined,
                department,
                specialty: department, // For now, using department as specialty
                status: careTeam.status || 'unknown',
                period: careTeam.period ? {
                    start: careTeam.period.start,
                    end: careTeam.period.end
                } : undefined
            };
        });
    }, [careTeamHook.data, practitionerId]);

    return {
        careTeams: transformedData,
        isLoading: careTeamHook.isLoading,
        error: careTeamHook.error,
        refetch: fetchCareTeams
    };
}

/**
 * Convenience hook for getting care teams for a specific patient
 */
export const usePatientCareTeams = (patientId: string, options?: {
    enabled?: boolean;
    recentLimit?: number;
}) => {
    const { enabled = true, recentLimit = 10 } = options || {};

    return useCareTeam({
        enabled,
        recentLimit,
        patientId
    });
};

/**
 * Convenience hook for getting all care teams
 */
export const useAllCareTeams = (options?: {
    enabled?: boolean;
}) => {
    const { enabled = true } = options || {};

    return useCareTeam({
        enabled,
        recentLimit: 1000 // Large limit to get all care teams
    });
};

// Export as default for easy replacement
export default useCareTeam;