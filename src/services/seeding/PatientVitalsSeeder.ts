// Integration with Healthcare Platform Infrastructure
// File: src/services/seeding/PatientVitalsSeeder.ts

import React from 'react';
import { PatientVitalsDataSeeder, seedPatientVitalsWithAuth } from './PatientVitalsDataSeeder';
import { medplumClient } from '../../lib/medplum/client';
import supabaseClient from '../../lib/supabase/client';
import { useObservation } from '../../hooks/useObservation';

// React Hook for seeding patient vitals data with enhanced authentication
export function usePatientVitalsSeeder() {
    const medplum = medplumClient;
    const [isSeeding, setIsSeeding] = React.useState(false);
    const [seedingProgress, setSeedingProgress] = React.useState<string>('');

    const seedVitalsData = async (patientId: string, options?: { 
        token?: string; 
        useStoredAuth?: boolean 
    }) => {
        if (!medplum) {
            throw new Error('Medplum client not available');
        }

        setIsSeeding(true);
        setSeedingProgress('🔐 Checking authentication...');

        try {
            setSeedingProgress('🩺 Starting vitals data seeding...');
            const result = await seedPatientVitalsWithAuth(medplum, patientId, {
                token: options?.token,
                useStoredAuth: options?.useStoredAuth !== false
            });

            setSeedingProgress('💾 Updating local cache...');
            await updateLocalCache(patientId, result);

            setSeedingProgress('✅ Vitals data seeding completed!');
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
        seedVitalsData,
        isSeeding,
        seedingProgress
    };
}

// Update local Supabase cache for offline support
async function updateLocalCache(patientId: string, vitalsData: any) {
    const { bloodPressure, heartRate, glucose, cholesterol, bodyWeight } = vitalsData;

    // Cache blood pressure observations
    for (const bp of bloodPressure) {
        await supabaseClient
            .from('fhir_resources')
            .upsert({
                id: bp.id,
                resource_type: 'Observation',
                patient_id: patientId,
                data: bp,
                last_updated: new Date().toISOString()
            });
    }

    // Cache other vitals observations
    const observations = [heartRate, glucose, cholesterol, bodyWeight];
    for (const observation of observations) {
        await supabaseClient
            .from('fhir_resources')
            .upsert({
                id: observation.id,
                resource_type: 'Observation',
                patient_id: patientId,
                data: observation,
                last_updated: new Date().toISOString()
            });
    }
}

// Enhanced React component with authentication options
export function PatientVitalsSeedingButton({ 
    patientId, 
    token, 
    showAdvanced = false 
}: { 
    patientId: string; 
    token?: string; 
    showAdvanced?: boolean; 
}) {
    const { seedVitalsData, isSeeding, seedingProgress } = usePatientVitalsSeeder();
    const [localToken, setLocalToken] = React.useState(token || '');
    const [useStoredAuth, setUseStoredAuth] = React.useState(true);

    const handleSeedData = async () => {
        try {
            const result = await seedVitalsData(patientId, {
                token: localToken || undefined,
                useStoredAuth
            });
            console.log('Vitals data seeded:', result);
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
                {isSeeding ? 'Seeding Vitals...' : 'Seed Vitals Data'}
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

// Integration with existing patient vitals hooks
export function usePatientVitalsData(patientId: string) {
    const observationHook = useObservation();

    // Use the hook's filtering capabilities to get patient-specific vitals
    React.useEffect(() => {
        if (patientId && observationHook.setFilters) {
            observationHook.setFilters({
                subject: `Patient/${patientId}`,
                category: 'vital-signs'
            });
        }
    }, [patientId, observationHook.setFilters]);

    const vitalsObservations = observationHook.data || [];

    // Categorize vitals by type
    const vitalsData = React.useMemo(() => {
        const bloodPressure = vitalsObservations.filter(obs => 
            obs.code?.coding?.some(c => c.code === '85354-9' || c.code === '8480-6' || c.code === '8462-4')
        );
        const heartRate = vitalsObservations.filter(obs => 
            obs.code?.coding?.some(c => c.code === '8867-4')
        );
        const bodyWeight = vitalsObservations.filter(obs => 
            obs.code?.coding?.some(c => c.code === '29463-7')
        );

        return {
            bloodPressure,
            heartRate,
            bodyWeight,
            allVitals: vitalsObservations
        };
    }, [vitalsObservations]);

    return {
        ...vitalsData,
        isLoading: observationHook.loading,
        error: observationHook.error,
        refresh: observationHook.refresh
    };
}

// Enhanced convenience function specifically for patient vitals
export function usePatientVitals(patientId: string) {
    const observationHook = useObservation();
    
    React.useEffect(() => {
        if (patientId && observationHook?.setFilters) {
            // Filter for vital signs observations for this patient
            observationHook.setFilters({
                subject: `Patient/${patientId}`,
                category: 'vital-signs'
            });
        }
    }, [patientId, observationHook]);

    return {
        vitals: observationHook?.data || [],
        isLoading: observationHook?.loading || false,
        error: observationHook?.error,
        refresh: observationHook?.refresh
    };
}
