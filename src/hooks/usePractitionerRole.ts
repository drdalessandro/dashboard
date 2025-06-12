/**
 * usePractitionerRole.ts - Factory-Generated Implementation
 * 
 * Hook for fetching PractitionerRole resources for a given practitioner
 * According to FHIR specification: https://www.medplum.com/docs/api/fhir/resources/practitionerrole
 */
import React from 'react';
import { PractitionerRole } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';
import { createLogger } from '../utils/logger';
import type { CategorizedError } from '../services/medplum';

const logger = createLogger('usePractitionerRole');

export interface UsePractitionerRoleOptions {
  enabled?: boolean;
}

export interface UsePractitionerRoleResult {
  practitionerRoles: PractitionerRole[];
  isLoading: boolean;
  error: CategorizedError | null;
  refetch: () => Promise<void>;
}

// Create a specialized PractitionerRole hook for practitioner-specific queries
const usePractitionerRoleHook = createResourceHook<PractitionerRole>(
  {
    ...ResourceConfigs.PractitionerRole,
    displayName: 'Practitioner Roles',
    description: 'Roles associated with a specific practitioner',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: false,
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: false
    },
    search: {
      searchableFields: ['practitioner', 'organization', 'code', 'specialty'],
      defaultSort: { field: '_lastUpdated', order: 'desc' as const },
    }
  },
  {
    onDataChange: (data) => {
      const count = Array.isArray(data) ? data.length : data ? 1 : 0;
      logger.debug('Practitioner roles data changed:', count, 'records');
    },
    onError: (error) => {
      logger.error('Practitioner roles operation error:', error.userMessage);
    }
  }
);

/**
 * Factory-generated practitioner roles hook
 * Uses the generic createResourceHook factory for consistent behavior
 */
export function usePractitionerRole(
  practitionerId: string,
  options: UsePractitionerRoleOptions = {}
): UsePractitionerRoleResult {
  const { enabled = true } = options;
  const roleHook = usePractitionerRoleHook();
  
  // Track if component is mounted
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch roles for the specific practitioner
  const fetchPractitionerRoles = React.useCallback(async () => {
    if (!practitionerId || !enabled || !isMountedRef.current) {
      return;
    }

    try {
      logger.debug(`Fetching roles for practitioner: ${practitionerId}`);

      // Search for PractitionerRole resources where practitioner references this practitioner
      await roleHook.search({
        'practitioner': `Practitioner/${practitionerId}`,
        '_include': 'PractitionerRole:organization',
        '_sort': '-_lastUpdated',
        '_count': '50'
      });

    } catch (err) {
      logger.error('Failed to fetch practitioner roles:', err);
    }
  }, [practitionerId, enabled, roleHook]);

  // Set up practitioner-specific search when practitionerId changes
  React.useEffect(() => {
    if (enabled && practitionerId && isMountedRef.current) {
      fetchPractitionerRoles();
    }
  }, [enabled, practitionerId, fetchPractitionerRoles]);

  // Transform the raw role data into the expected format
  const transformedData = React.useMemo(() => {
    if (!roleHook.data || !Array.isArray(roleHook.data)) {
      return {
        practitionerRoles: roleHook.data ? [roleHook.data] : []
      };
    }

    const roles = roleHook.data as PractitionerRole[];
    
    return {
      practitionerRoles: roles
    };
  }, [roleHook.data]);

  return {
    practitionerRoles: transformedData.practitionerRoles,
    isLoading: roleHook.isLoading,
    error: roleHook.error,
    refetch: fetchPractitionerRoles
  };
}

// Export as default for easy replacement
export default usePractitionerRole;