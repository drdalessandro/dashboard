// Node.js utilities for Patient Encounter Seeding
// File: src/services/seeding/PatientEncounterUtils.ts

import { PatientEncounterDataSeeder, seedPatientEncountersWithAuth } from './PatientEncounterDataSeeder';

// Console/Script usage for development with enhanced authentication
export async function runPatientEncounterSeeding(
    patientId: string = '01970192-304e-723a-881f-ab29b1308594',
    options?: { token?: string; email?: string; password?: string }
) {
    const { MedplumClient } = await import('@medplum/core');

    const medplum = new MedplumClient({
        baseUrl: process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103',
        clientId: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || ''
    });

    try {
        console.log('🏥 Starting patient encounter data seeding');
        console.log(`📋 Patient ID: ${patientId}`);

        const result = await seedPatientEncountersWithAuth(medplum, patientId, options);

        console.log('✅ Encounter seeding completed for patient:', patientId);
        console.log('📊 Created encounters:', {
            total: result.encounters.length,
            patient: `${result.patient.name?.[0]?.given?.[0]} ${result.patient.name?.[0]?.family}`
        });

        return result;
    } catch (error: any) {
        console.error('❌ Encounter seeding failed:', error);
        
        if (error.message?.includes('Authentication')) {
            console.error(`
💡 Authentication Help:
• Provide a token: runPatientEncounterSeeding(patientId, { token: "your-token" })
• Use email/password: runPatientEncounterSeeding(patientId, { email: "user@example.com", password: "pass" })
• Login to the application first, then try again
            `);
        }
        
        throw error;
    }
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