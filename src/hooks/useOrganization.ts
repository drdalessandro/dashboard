/**
 * useOrganization.ts
 * 
 * Organization resource hook using the factory pattern
 * Provides comprehensive Organization management with FHIR compliance
 */

import { Organization } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';
import React from 'react';

// Generate the Organization hook using the factory
const useOrganizationBase = createResourceHook<Organization>(ResourceConfigs.Organization);

// Enhanced Organization hook with search functionality
export function useOrganization() {
  const baseHook = useOrganizationBase();

  // Add search organizations functionality
  const searchOrganizations = React.useCallback(async (searchTerm: string): Promise<Organization[]> => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    try {
      // Use the API search function from the base hook
      if (baseHook?.fetchMany) {
        const result = await baseHook.fetchMany({
          filters: {
            'name:contains': searchTerm,
            'active': 'true',
            '_count': '20'
          }
        });
        return Array.isArray(result) ? result : [];
      }

      // Fallback to local data search if API search not available
      const allOrganizations = Array.isArray(baseHook?.data) ? baseHook.data : (baseHook?.data ? [baseHook.data] : []);
      const filtered = allOrganizations.filter(org =>
        org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.alias?.some(alias => alias.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return filtered.slice(0, 20); // Limit to 20 results
    } catch (error) {
      console.error('Error searching organizations:', error);
      return [];
    }
  }, [baseHook?.fetchMany, baseHook?.data]);

  return {
    ...baseHook,
    searchOrganizations
  };
}

// Convenience function for healthcare provider organizations
export function useHealthcareProviders() {
  const organizationHook = useOrganization();

  React.useEffect(() => {
    if (organizationHook?.setFilters) {
      // Filter for healthcare provider organizations
      organizationHook.setFilters({
        'type:text': 'prov',
        active: 'true'
      });
    }
  }, [organizationHook]);

  return {
    organizations: Array.isArray(organizationHook?.data) ? organizationHook.data : (organizationHook?.data ? [organizationHook.data] : []),
    isLoading: organizationHook?.isLoading || false,
    error: organizationHook?.error,
    refetch: organizationHook?.fetchMany || (() => Promise.resolve())
  };
}

// Convenience function for organizations by region/city
export function useOrganizationsByLocation(city?: string, region?: string) {
  const organizationHook = useOrganization();

  React.useEffect(() => {
    if (organizationHook?.setFilters) {
      const filters: any = {
        'type:text': 'prov',
        active: 'true'
      };

      if (city) {
        filters['address-city'] = city;
      }

      if (region) {
        filters['address-state'] = region;
      }

      organizationHook.setFilters(filters);
    }
  }, [city, region, organizationHook]);

  return {
    organizations: Array.isArray(organizationHook?.data) ? organizationHook.data : (organizationHook?.data ? [organizationHook.data] : []),
    isLoading: organizationHook?.isLoading || false,
    error: organizationHook?.error,
    refetch: organizationHook?.fetchMany || (() => Promise.resolve())
  };
}

// Default export
export default useOrganization;
