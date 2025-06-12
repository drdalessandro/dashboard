// Integration with Healthcare Platform Infrastructure
// File: src/services/seeding/OrganizationSeeder.ts

import React from 'react';
import { OrganizationDataSeeder, seedOrganizationsWithAuth } from './OrganizationDataSeeder.js';
import { medplumClient } from '../../lib/medplum/client.js';
import supabaseClient from '../../lib/supabase/client.js';
import { useOrganization } from '../../hooks/useOrganization.js';

// React Hook for seeding healthcare organizations with enhanced authentication
export function useOrganizationSeeder() {
    const medplum = medplumClient;
    const [isSeeding, setIsSeeding] = React.useState(false);
    const [seedingProgress, setSeedingProgress] = React.useState<string>('');

    const seedOrganizations = async (options?: { 
        token?: string; 
        useStoredAuth?: boolean 
    }) => {
        if (!medplum) {
            throw new Error('Medplum client not available');
        }

        setIsSeeding(true);
        setSeedingProgress('🔐 Checking authentication...');

        try {
            setSeedingProgress('🏥 Starting organization seeding...');
            const result = await seedOrganizationsWithAuth(medplum, {
                token: options?.token,
                useStoredAuth: options?.useStoredAuth !== false
            });

            setSeedingProgress('💾 Updating local cache...');
            await updateLocalCache(result);

            setSeedingProgress('✅ Organization seeding completed!');
            return result;

        } catch (error: any) {
            const errorMessage = error.message?.includes('Authentication') 
                ? `🔑 ${error.message}` 
                : `❌ Error: ${error.message}`;
            setSeedingProgress(errorMessage);
            throw error;
        } finally {
            setIsSeeding(false);
        }
    };

    return {
        seedOrganizations,
        isSeeding,
        seedingProgress
    };
}

// Update local Supabase cache for offline support
async function updateLocalCache(organizationData: any) {
    const { allOrganizations } = organizationData;

    // Cache all organizations
    for (const organization of allOrganizations) {
        await supabaseClient
            .from('fhir_resources')
            .upsert({
                id: organization.id,
                resource_type: 'Organization',
                data: organization,
                last_updated: new Date().toISOString()
            });
    }
}

// Enhanced React component with authentication options
export function OrganizationSeedingButton({ 
    token, 
    showAdvanced = false 
}: { 
    token?: string; 
    showAdvanced?: boolean; 
}) {
    const { seedOrganizations, isSeeding, seedingProgress } = useOrganizationSeeder();
    const [localToken, setLocalToken] = React.useState(token || '');
    const [useStoredAuth, setUseStoredAuth] = React.useState(true);

    const handleSeedData = async () => {
        try {
            const result = await seedOrganizations({
                token: localToken || undefined,
                useStoredAuth
            });
            console.log('Organizations seeded:', result);
        } catch (error: any) {
            console.error('Seeding failed:', error);
            if (error.message?.includes('Authentication')) {
                alert(`Authentication Error: ${error.message}\n\nTip: Try logging into the application first or provide a valid token.`);
            } else {
                alert(`Seeding failed: ${error.message}`);
            }
        }
    };

    return (
        <div className="p-4 space-y-4">
            <button 
                onClick={handleSeedData}
                disabled={isSeeding}
                className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
            >
                {isSeeding ? 'Seeding Organizations...' : 'Seed Healthcare Organizations'}
            </button>

            {showAdvanced && (
                <div className="space-y-2">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Access Token (optional)
                        </label>
                        <input
                            type="password"
                            value={localToken}
                            onChange={(e) => setLocalToken(e.target.value)}
                            placeholder="Enter access token"
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={useStoredAuth}
                                onChange={(e) => setUseStoredAuth(e.target.checked)}
                                className="mr-2"
                            />
                            Use stored authentication
                        </label>
                    </div>
                </div>
            )}

            {seedingProgress && (
                <div className="mt-2 text-sm text-gray-600">
                    {seedingProgress}
                </div>
            )}
        </div>
    );
}

// Integration with existing organization hooks
export function useOrganizationsData() {
    const organizationHook = useOrganization();

    const organizationsData = organizationHook.data || [];

    // Categorize organizations by type
    const categorizedData = React.useMemo(() => {
        const nationalHospitals = organizationsData.filter(org => 
            org.name?.includes('Point G') || 
            org.name?.includes('Gabriel Toure') || 
            org.name?.includes('Kati')
        );
        
        const regionalHospitals = organizationsData.filter(org => 
            org.name?.includes('Hopital Regional')
        );
        
        const referralCenters = organizationsData.filter(org => 
            org.name?.includes('Centre de Sante de Reference') ||
            org.alias?.some(a => a.includes('CSRef'))
        );
        
        const communityHealthCenters = organizationsData.filter(org => 
            org.name?.includes('Centre de Sante Communautaire') ||
            org.alias?.some(a => a.includes('CSCom'))
        );

        return {
            nationalHospitals,
            regionalHospitals,
            referralCenters,
            communityHealthCenters,
            allOrganizations: organizationsData
        };
    }, [organizationsData]);

    return {
        ...categorizedData,
        isLoading: organizationHook.loading,
        error: organizationHook.error,
        refresh: organizationHook.refresh
    };
}

// Enhanced convenience function for healthcare organizations
export function useHealthcareOrganizations() {
    const organizationHook = useOrganization();
    
    React.useEffect(() => {
        if (organizationHook?.setFilters) {
            // Filter for healthcare provider organizations
            organizationHook.setFilters({
                type: 'prov'
            });
        }
    }, [organizationHook]);

    return {
        organizations: organizationHook?.data || [],
        isLoading: organizationHook?.loading || false,
        error: organizationHook?.error,
        refresh: organizationHook?.refresh
    };
}
