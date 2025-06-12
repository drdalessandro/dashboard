// Node.js utilities for Patient Vitals Seeding
// File: src/services/seeding/PatientVitalsUtils.ts

import { PatientVitalsDataSeeder, seedPatientVitalsWithAuth } from './PatientVitalsDataSeeder';

// Console/Script usage for development with enhanced authentication
export async function runPatientVitalsSeeding(
    patientId: string = '01970192-304e-723a-881f-ab29b1308594',
    options?: { token?: string; email?: string; password?: string }
) {
    const { MedplumClient } = await import('@medplum/core');

    const medplum = new MedplumClient({
        baseUrl: process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103',
        clientId: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || ''
    });

    try {
        console.log('🩺 Starting patient vitals data seeding');
        console.log(`📋 Patient ID: ${patientId}`);

        const result = await seedPatientVitalsWithAuth(medplum, patientId, options);

        console.log('✅ Vitals seeding completed for patient:', patientId);
        console.log('📊 Created vitals:', {
            bloodPressure: result.bloodPressure.length,
            heartRate: 1,
            glucose: 1,
            cholesterol: 1,
            bodyWeight: 1
        });

        return result;
    } catch (error: any) {
        console.error('❌ Vitals seeding failed:', error);
        
        if (error.message?.includes('Authentication')) {
            console.error(`
💡 Authentication Help:
• Provide a token: runPatientVitalsSeeding(patientId, { token: "your-token" })
• Use email/password: runPatientVitalsSeeding(patientId, { email: "user@example.com", password: "pass" })
• Login to the application first, then try again
            `);
        }
        
        throw error;
    }
}

// Utility functions for vitals data
export function getStoredAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem('medplum.access_token') || 
           localStorage.getItem('access_token') || 
           null;
}

export function isUserAuthenticated(): boolean {
    return !!getStoredAuthToken();
}
