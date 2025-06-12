// Integration with Healthcare Platform Infrastructure
// File: src/services/seeding/PatientClinicalSeeder.ts

import React from 'react';
import { seedPatientClinicalData } from './PatientClinicalDataSeeder';
import { medplumClient } from '../lib/medplum/client';


// React Hook for seeding patient clinical data
export function usePatientClinicalSeeder() {
    // Initialize Medplum client
    const medplum = medplumClient;
    const [isSeeding, setIsSeeding] = React.useState(false);
    const [seedingProgress, setSeedingProgress] = React.useState<string>('');

    const seedClinicalData = async (patientId: string) => {
        if (!medplum) {
            throw new Error('Medplum client not available');
        }

        setIsSeeding(true);
        setSeedingProgress('Starting clinical data seeding...');

        try {
            // Create seeder instance with the patient ID
            const seeder = new PatientClinicalDataSeeder(medplum, patientId);

            setSeedingProgress('Verifying patient exists...');
            const result = await seeder.seedAllClinicalData();

            // Update Supabase for offline sync
            setSeedingProgress('Updating local cache...');
            await updateLocalCache(patientId, result);

            setSeedingProgress('✓ Clinical data seeding completed!');
            return result;

        } catch (error) {
            setSeedingProgress(`❌ Error: ${error.message}`);
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
        await medplumClient
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
        await supabase
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
        await supabase
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
        await supabase
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

// Simple usage in a React component
export function PatientDataSeedingButton({ patientId }: { patientId: string }) {
    const { seedClinicalData, isSeeding, seedingProgress } = usePatientClinicalSeeder();

    const handleSeedData = async () => {
        try {
            const result = await seedClinicalData(patientId);
            console.log('Clinical data seeded:', result);
            // Show success notification
        } catch (error) {
            console.error('Seeding failed:', error);
            // Show error notification
        }
    };

    return (
        <div className= "p-4" >
        <button 
        onClick={ handleSeedData }
    disabled = { isSeeding }
    className = "bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
        >
        { isSeeding? 'Seeding...': 'Seed Clinical Data' }
        </button>

    {
        seedingProgress && (
            <div className="mt-2 text-sm text-gray-600" >
                { seedingProgress }
                </div>
      )
    }
    </div>
  );
}

// Console/Script usage for development
export async function runPatientSeeding() {
    const { MedplumClient } = await import('@medplum/core');

    const medplum = new MedplumClient({
        baseUrl: process.env.MEDPLUM_BASE_URL || 'http://localhost:8100',
        clientId: process.env.MEDPLUM_CLIENT_ID
    });

    // Authenticate if needed
    await medplum.startLogin({
        email: 'admin@example.com',
        password: 'password'
    });

    // Seed the specific patient
    const patientId = '01970192-304e-723a-881f-ab29b1308594';
    const result = await seedPatientClinicalData(medplum);

    console.log('Seeding completed for patient:', patientId);
    console.log('Created resources:', {
        allergies: result.allergies.length,
        immunizations: result.immunizations.length,
        conditions: result.conditions.length,
        medications: result.medications.length
    });

    return result;
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