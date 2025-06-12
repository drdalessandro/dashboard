// PatientEncounterDataSeeder.ts - Complete File
import { MedplumClient } from '@medplum/core';
import { Encounter, Patient } from '@medplum/fhirtypes';

export class PatientEncounterDataSeeder {
  private medplum: MedplumClient;
  private patientId: string;
  private isAuthenticated: boolean = false;

  constructor(medplumClient: MedplumClient, patientId: string) {
    this.medplum = medplumClient;
    this.patientId = patientId;
  }

  async authenticate(token?: string): Promise<boolean> {
    try {
      if (token) {
        this.medplum.setAccessToken(token);
        this.isAuthenticated = true;
        return true;
      }

      const existingToken = this.medplum.getAccessToken();
      if (existingToken) {
        this.isAuthenticated = true;
        return true;
      }

      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('medplum.access_token') ||
          localStorage.getItem('access_token');
        if (storedToken) {
          this.medplum.setAccessToken(storedToken);
          this.isAuthenticated = true;
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        throw new Error('Authentication required. Please provide a valid token or ensure you are logged in.');
      }
    }

    try {
      await this.medplum.readResource('Patient', this.patientId);
    } catch (error: any) {
      if (error.status === 401) {
        throw new Error('Authentication failed. Please provide a valid token.');
      }
      throw error;
    }
  }

  async seedAllEncounters() {
    try {
      console.log(`🏥 Seeding encounters for patient: ${this.patientId}`);

      await this.ensureAuthenticated();

      const patient = await this.verifyPatient();
      console.log(`✓ Patient verified: ${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family}`);

      const encounters = await this.seedEncounters();

      console.log('\n✅ All encounter data seeded successfully!');

      return {
        patient,
        encounters
      };
    } catch (error) {
      console.error('Error seeding encounter data:', error);
      throw error;
    }
  }

  private async verifyPatient(): Promise<Patient> {
    const patient = await this.medplum.readResource('Patient', this.patientId);
    if (!patient) {
      throw new Error(`Patient with ID ${this.patientId} not found`);
    }
    return patient;
  }

  async seedEncounters(): Promise<Encounter[]> {
    const encounters: Partial<Encounter>[] = [
      {
        resourceType: 'Encounter',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory'
        },
        type: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '185347001',
            display: 'Encounter for problem'
          }],
          text: 'Initial Consultation'
        }],
        subject: { reference: `Patient/${this.patientId}` },
        participant: [{
          individual: { reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74' }
        }],
        period: {
          start: '2023-01-15T09:00:00Z',
          end: '2023-01-15T09:45:00Z'
        },
        reasonCode: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '38341003',
            display: 'Hypertensive disorder, systemic arterial'
          }],
          text: 'Hypertension screening and management'
        }],
        serviceProvider: { reference: 'Organization/community-health-center-bamako' }
      },
      {
        resourceType: 'Encounter',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory'
        },
        type: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '390906007',
            display: 'Follow-up encounter'
          }],
          text: 'Follow-up Visit'
        }],
        subject: { reference: `Patient/${this.patientId}` },
        participant: [{
          individual: { reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74' }
        }],
        period: {
          start: '2023-02-15T10:00:00Z',
          end: '2023-02-15T10:30:00Z'
        },
        reasonCode: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '38341003',
            display: 'Hypertensive disorder, systemic arterial'
          }],
          text: 'Hypertension follow-up'
        }],
        serviceProvider: { reference: 'Organization/community-health-center-bamako' }
      },
      {
        resourceType: 'Encounter',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory'
        },
        type: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '11429006',
            display: 'Consultation'
          }],
          text: 'Diabetes Screening'
        }],
        subject: { reference: `Patient/${this.patientId}` },
        participant: [{
          individual: { reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74' }
        }],
        period: {
          start: '2023-03-10T08:30:00Z',
          end: '2023-03-10T09:15:00Z'
        },
        reasonCode: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '73211009',
            display: 'Diabetes mellitus'
          }],
          text: 'Diabetes screening and diagnosis'
        }],
        serviceProvider: { reference: 'Organization/community-health-center-bamako' }
      },
      {
        resourceType: 'Encounter',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory'
        },
        type: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '86013001',
            display: 'Periodic examination'
          }],
          text: 'Annual Physical Exam'
        }],
        subject: { reference: `Patient/${this.patientId}` },
        participant: [{
          individual: { reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74' }
        }],
        period: {
          start: '2023-04-20T09:00:00Z',
          end: '2023-04-20T10:00:00Z'
        },
        reasonCode: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '410620009',
            display: 'Well child visit'
          }],
          text: 'Annual preventive care examination'
        }],
        serviceProvider: { reference: 'Organization/community-health-center-bamako' }
      },
      {
        resourceType: 'Encounter',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory'
        },
        type: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '390906007',
            display: 'Follow-up encounter'
          }],
          text: 'Medication Review'
        }],
        subject: { reference: `Patient/${this.patientId}` },
        participant: [{
          individual: { reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74' }
        }],
        period: {
          start: '2023-05-15T11:00:00Z',
          end: '2023-05-15T11:30:00Z'
        },
        reasonCode: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '182836005',
            display: 'Review of medication'
          }],
          text: 'Medication effectiveness and side effects review'
        }],
        serviceProvider: { reference: 'Organization/community-health-center-bamako' }
      },
      {
        resourceType: 'Encounter',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory'
        },
        type: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '11429006',
            display: 'Consultation'
          }],
          text: 'Acute Care Visit'
        }],
        subject: { reference: `Patient/${this.patientId}` },
        participant: [{
          individual: { reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74' }
        }],
        period: {
          start: '2023-06-03T14:00:00Z',
          end: '2023-06-03T14:45:00Z'
        },
        reasonCode: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '54150009',
            display: 'Upper respiratory infection'
          }],
          text: 'Upper respiratory tract infection treatment'
        }],
        serviceProvider: { reference: 'Organization/community-health-center-bamako' }
      },
      {
        resourceType: 'Encounter',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory'
        },
        type: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '390906007',
            display: 'Follow-up encounter'
          }],
          text: 'Follow-up Visit'
        }],
        subject: { reference: `Patient/${this.patientId}` },
        participant: [{
          individual: { reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74' }
        }],
        period: {
          start: '2023-07-10T10:30:00Z',
          end: '2023-07-10T11:00:00Z'
        },
        reasonCode: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '73211009',
            display: 'Diabetes mellitus'
          }],
          text: 'Diabetes management follow-up'
        }],
        serviceProvider: { reference: 'Organization/community-health-center-bamako' }
      },
      {
        resourceType: 'Encounter',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory'
        },
        type: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '33879002',
            display: 'Administration of vaccine product'
          }],
          text: 'Vaccination Visit'
        }],
        subject: { reference: `Patient/${this.patientId}` },
        participant: [{
          individual: { reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74' }
        }],
        period: {
          start: '2023-08-15T15:00:00Z',
          end: '2023-08-15T15:20:00Z'
        },
        reasonCode: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '33879002',
            display: 'Administration of vaccine product'
          }],
          text: 'Annual influenza vaccination'
        }],
        serviceProvider: { reference: 'Organization/community-health-center-bamako' }
      },
      {
        resourceType: 'Encounter',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory'
        },
        type: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '11429006',
            display: 'Consultation'
          }],
          text: 'Specialist Referral'
        }],
        subject: { reference: `Patient/${this.patientId}` },
        participant: [{
          individual: { reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74' }
        }],
        period: {
          start: '2023-09-20T13:00:00Z',
          end: '2023-09-20T13:30:00Z'
        },
        reasonCode: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '3457005',
            display: 'Patient referral'
          }],
          text: 'Referral to endocrinologist for diabetes management'
        }],
        serviceProvider: { reference: 'Organization/community-health-center-bamako' }
      },
      {
        resourceType: 'Encounter',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory'
        },
        type: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '390906007',
            display: 'Follow-up encounter'
          }],
          text: 'Recent Follow-up'
        }],
        subject: { reference: `Patient/${this.patientId}` },
        participant: [{
          individual: { reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74' }
        }],
        period: {
          start: '2023-11-15T09:30:00Z',
          end: '2023-11-15T10:15:00Z'
        },
        reasonCode: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '38341003',
            display: 'Hypertensive disorder, systemic arterial'
          }],
          text: 'Comprehensive health status review'
        }],
        serviceProvider: { reference: 'Organization/community-health-center-bamako' }
      }
    ];

    const createdEncounters: Encounter[] = [];
    for (const encounter of encounters) {
      const created = await this.medplum.createResource(encounter);
      createdEncounters.push(created);
      console.log(`✓ Created Encounter: ${encounter.type?.[0]?.text} (${encounter.period?.start})`);
    }

    return createdEncounters;
  }
}

// Enhanced utility functions for easy usage
export async function seedPatientEncounters(medplumClient: MedplumClient, patientId: string, token?: string) {
  const seeder = new PatientEncounterDataSeeder(medplumClient, patientId);

  // Authenticate if token provided
  if (token) {
    await seeder.authenticate(token);
  }

  try {
    const result = await seeder.seedAllEncounters();

    console.log('\n📊 Summary of seeded encounters:');
    console.log(`   • ${result.encounters.length} Encounter resources created`);
    console.log(`   • Patient: ${result.patient.name?.[0]?.given?.[0]} ${result.patient.name?.[0]?.family}`);

    return result;
  } catch (error) {
    console.error('❌ Failed to seed encounter data:', error);
    throw error;
  }
}

// Enhanced seeding function with automatic authentication
export async function seedPatientEncountersWithAuth(
  medplumClient: MedplumClient,
  patientId: string,
  options?: {
    token?: string;
    email?: string;
    password?: string;
    useStoredAuth?: boolean;
  }
) {
  const seeder = new PatientEncounterDataSeeder(medplumClient, patientId);

  try {
    // Try different authentication methods
    if (options?.token) {
      console.log('🔐 Using provided token');
      await seeder.authenticate(options.token);
    } else if (options?.email && options?.password) {
      console.log('🔑 Authenticating with email/password');
      await medplumClient.startLogin({
        email: options.email,
        password: options.password,
        remember: true
      });
    } else if (options?.useStoredAuth !== false) {
      console.log('🔄 Using stored authentication');
      await seeder.authenticate();
    }

    return await seeder.seedAllEncounters();
  } catch (error: any) {
    if (error.message?.includes('Authentication')) {
      console.error(`
❌ Authentication Error: ${error.message}

💡 Solutions:
1. Provide a valid token: seedPatientEncountersWithAuth(client, patientId, { token: "your-token" })
2. Login first in the application, then run the seeding
3. Use email/password: seedPatientEncountersWithAuth(client, patientId, { email: "user@example.com", password: "password" })
4. Get a token from localStorage after logging in: localStorage.getItem('medplum.access_token')
      `);
    }
    throw error;
  }
}

// ======================================================================
// PatientEncounterUtils.ts - Node.js utilities
// ======================================================================

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