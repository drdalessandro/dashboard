// Integration with Healthcare Platform Infrastructure
// File: src/services/seeding/PatientClinicalSeeder.ts

import React from 'react';
import { PatientClinicalDataSeeder, seedPatientClinicalDataWithAuth } from './PatientClinicalDataSeeder';
import { medplumClient } from '../../lib/medplum/client';
import supabaseClient from '../../lib/supabase/client';
import { useAllergyIntolerance } from '../../hooks/useAllergyIntolerance';
import { useImmunization } from '../../hooks/useImmunization';
import { useCondition } from '../../hooks/useCondition';
import { useMedicationRequest } from '../../hooks/useMedicationRequest';

// React Hook for seeding patient clinical data with enhanced authentication
export function usePatientClinicalSeeder() {
    const medplum = medplumClient;
    const [isSeeding, setIsSeeding] = React.useState(false);
    const [seedingProgress, setSeedingProgress] = React.useState<string>('');

    const seedClinicalData = async (patientId: string, options?: { 
        token?: string; 
        useStoredAuth?: boolean 
    }) => {
        if (!medplum) {
            throw new Error('Medplum client not available');
        }

        setIsSeeding(true);
        setSeedingProgress('🔐 Checking authentication...');

        try {
            setSeedingProgress('🏥 Starting clinical data seeding...');
            const result = await seedPatientClinicalDataWithAuth(medplum, patientId, {
                token: options?.token,
                useStoredAuth: options?.useStoredAuth !== false
            });

            setSeedingProgress('💾 Updating local cache...');
            await updateLocalCache(patientId, result);

            setSeedingProgress('✅ Clinical data seeding completed!');
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
        seedClinicalData,
        isSeeding,
        seedingProgress
    };
}
// Update local Supabase cache for offline support
async function updateLocalCache(patientId: string, clinicalData: any) {
    const { allergies, immunizations, conditions, medications } = clinicalData;

    // Cache allergies
    for (const allergy of allergies) {
        await supabaseClient
            .from('fhir_resources')
            .upsert({
                id: allergy.id,
                resource_type: 'AllergyIntolerance',
                patient_id: patientId,
                data: allergy,
                last_updated: new Date().toISOString()
            });
    }

    // Cache immunizations
    for (const immunization of immunizations) {
        await supabaseClient
            .from('fhir_resources')
            .upsert({
                id: immunization.id,
                resource_type: 'Immunization',
                patient_id: patientId,
                data: immunization,
                last_updated: new Date().toISOString()
            });
    }

    // Cache conditions
    for (const condition of conditions) {
        await supabaseClient
            .from('fhir_resources')
            .upsert({
                id: condition.id,
                resource_type: 'Condition',
                patient_id: patientId,
                data: condition,
                last_updated: new Date().toISOString()
            });
    }

    // Cache medication requests
    for (const medication of medications) {
        await supabaseClient
            .from('fhir_resources')
            .upsert({
                id: medication.id,
                resource_type: 'MedicationRequest',
                patient_id: patientId,
                data: medication,
                last_updated: new Date().toISOString()
            });
    }
}

// Enhanced React component with authentication options
export function PatientDataSeedingButton({ 
    patientId, 
    token, 
    showAdvanced = false 
}: { 
    patientId: string; 
    token?: string; 
    showAdvanced?: boolean; 
}) {
    const { seedClinicalData, isSeeding, seedingProgress } = usePatientClinicalSeeder();
    const [localToken, setLocalToken] = React.useState(token || '');
    const [useStoredAuth, setUseStoredAuth] = React.useState(true);

    const handleSeedData = async () => {
        try {
            const result = await seedClinicalData(patientId, {
                token: localToken || undefined,
                useStoredAuth
            });
            console.log('Clinical data seeded:', result);
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

    return (
        <div className="p-4 space-y-4">
            <button 
                onClick={handleSeedData}
                disabled={isSeeding}
                className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
            >
                {isSeeding ? 'Seeding...' : 'Seed Clinical Data'}
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
// Console/Script usage for development with enhanced authentication
export async function runPatientSeeding(
    patientId: string = '01970192-304e-723a-881f-ab29b1308594',
    options?: { token?: string; email?: string; password?: string }
) {
    const { MedplumClient } = await import('@medplum/core');

    const medplum = new MedplumClient({
        baseUrl: process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103',
        clientId: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || ''
    });

    try {
        console.log('🏥 Starting patient clinical data seeding');
        console.log(`📋 Patient ID: ${patientId}`);

        // Use the enhanced seeding function
        const result = await seedPatientClinicalDataWithAuth(medplum, patientId, options);

        console.log('✅ Seeding completed for patient:', patientId);
        console.log('📊 Created resources:', {
            allergies: result.allergies.length,
            immunizations: result.immunizations.length,
            conditions: result.conditions.length,
            medications: result.medications.length
        });

        return result;
    } catch (error: any) {
        console.error('❌ Seeding failed:', error);
        
        if (error.message?.includes('Authentication')) {
            console.error(`
💡 Authentication Help:
• Provide a token: runPatientSeeding(patientId, { token: "your-token" })
• Use email/password: runPatientSeeding(patientId, { email: "user@example.com", password: "pass" })
• Login to the application first, then try again
            `);
        }
        
        throw error;
    }
}

// Integration with existing patient hooks
export function usePatientClinicalData(patientId: string) {
    const { usePatientAllergies } = useAllergyIntolerance();
    const { usePatientImmunizations } = useImmunization();
    const { usePatientConditions } = useCondition();
    const { usePatientMedicationRequests } = useMedicationRequest();

    const allergies = usePatientAllergies(patientId);
    const immunizations = usePatientImmunizations(patientId);
    const conditions = usePatientConditions(patientId);
    const medications = usePatientMedicationRequests(patientId);

    return {
        allergies,
        immunizations,
        conditions,
        medications,
        isLoading: allergies.loading || immunizations.loading || conditions.loading || medications.loading,
        hasData: allergies.data?.length > 0 || immunizations.data?.length > 0 ||
            conditions.data?.length > 0 || medications.data?.length > 0
    };
}

// Utility function to get authentication token from application
export function getStoredAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem('medplum.access_token') || 
           localStorage.getItem('access_token') || 
           null;
}

// Utility function to check if user is authenticated
export function isUserAuthenticated(): boolean {
    return !!getStoredAuthToken();
}