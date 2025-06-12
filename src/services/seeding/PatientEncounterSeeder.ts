// Integration with Healthcare Platform Infrastructure
// File: src/services/seeding/PatientEncounterSeeder.ts

import React from 'react';
import { PatientEncounterDataSeeder, seedPatientEncountersWithAuth } from './PatientEncounterDataSeeder';
import { medplumClient } from '../../lib/medplum/client';
import supabaseClient from '../../lib/supabase/client';
import { useEncounter } from '../../hooks/useEncounter';

// React Hook for seeding patient encounter data with enhanced authentication
export function usePatientEncounterSeeder() {
    const medplum = medplumClient;
    const [isSeeding, setIsSeeding] = React.useState(false);
    const [seedingProgress, setSeedingProgress] = React.useState<string>('');

    const seedEncounterData = async (patientId: string, options?: { 
        token?: string; 
        useStoredAuth?: boolean 
    }) => {
        if (!medplum) {
            throw new Error('Medplum client not available');
        }

        setIsSeeding(true);
        setSeedingProgress('🔐 Checking authentication...');

        try {
            setSeedingProgress('🏥 Starting encounter data seeding...');
            const result = await seedPatientEncountersWithAuth(medplum, patientId, {
                token: options?.token,
                useStoredAuth: options?.useStoredAuth !== false
            });

            setSeedingProgress('💾 Updating local cache...');
            await updateLocalCache(patientId, result);

            setSeedingProgress('✅ Encounter data seeding completed!');
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
        seedEncounterData,
        isSeeding,
        seedingProgress
    };
}
// Update local Supabase cache for offline support
async function updateLocalCache(patientId: string, encounterData: any) {
    const { encounters } = encounterData;

    // Cache encounters
    for (const encounter of encounters) {
        await supabaseClient
            .from('fhir_resources')
            .upsert({
                id: encounter.id,
                resource_type: 'Encounter',
                patient_id: patientId,
                data: encounter,
                last_updated: new Date().toISOString()
            });
    }
}

// Enhanced React component with authentication options
export function PatientEncounterSeedingButton({ 
    patientId, 
    token, 
    showAdvanced = false 
}: { 
    patientId: string; 
    token?: string; 
    showAdvanced?: boolean; 
}) {
    const { seedEncounterData, isSeeding, seedingProgress } = usePatientEncounterSeeder();
    const [localToken, setLocalToken] = React.useState(token || '');
    const [useStoredAuth, setUseStoredAuth] = React.useState(true);

    const handleSeedData = async () => {
        try {
            const result = await seedEncounterData(patientId, {
                token: localToken || undefined,
                useStoredAuth
            });
            console.log('Encounter data seeded:', result);
            // Show success notification
        } catch (error: any) {
            console.error('Seeding failed:', error);
            // Show error notification with helpful message
            if (error.message?.includes('Authentication')) {
                alert(`Authentication Error: ${error.message}\n\nTip: Try logging into the application first or provide a valid token.`);
            } else {
                alert(`Seeding failed: ${error.message}`);
            }
        }
    };