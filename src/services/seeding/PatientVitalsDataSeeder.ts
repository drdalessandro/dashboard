import { MedplumClient } from '@medplum/core';
import { Observation, Patient } from '@medplum/fhirtypes';

export class PatientVitalsDataSeeder {
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
        console.log('🔐 Using provided token for authentication');
        this.medplum.setAccessToken(token);
        this.isAuthenticated = true;
        return true;
      }

      const existingToken = this.medplum.getAccessToken();
      if (existingToken) {
        console.log('✅ Using existing Medplum client authentication');
        this.isAuthenticated = true;
        return true;
      }

      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('medplum.access_token') || 
                          localStorage.getItem('access_token');
        if (storedToken) {
          console.log('🔄 Using stored token from localStorage');
          this.medplum.setAccessToken(storedToken);
          this.isAuthenticated = true;
          return true;
        }
      }

      if (process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_SECRET) {
        console.log('🔑 Attempting client credentials authentication');
        try {
          await this.medplum.startClientLogin(
            process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || '',
            process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_SECRET
          );
          this.isAuthenticated = true;
          return true;
        } catch (clientAuthError) {
          console.warn('Client credentials authentication failed:', clientAuthError);
        }
      }

      console.error('❌ No authentication method succeeded');
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
        throw new Error(
          'Authentication required. Please provide a valid token or ensure you are logged in.\n' +
          'Usage: await seeder.authenticate("your-token-here") or login to the application first.'
        );
      }
    }

    try {
      await this.medplum.readResource('Patient', this.patientId);
    } catch (error: any) {
      if (error.status === 401) {
        throw new Error(
          'Authentication failed. Please provide a valid token.\n' +
          'You can get a token from the application after logging in or use: \n' +
          'seeder.authenticate("your-valid-token")'
        );
      }
      throw error;
    }
  }

  async seedVitalsData(): Promise<{
    bloodPressure: Observation[];
    heartRate: Observation;
    glucose: Observation;
    cholesterol: Observation;
    bodyWeight: Observation;
  }> {
    await this.ensureAuthenticated();

    console.log('🩺 Creating vitals observations for patient:', this.patientId);

    const bloodPressure = await this.createBloodPressureObservations();
    const heartRate = await this.createHeartRateObservation();
    const glucose = await this.createGlucoseObservation();
    const cholesterol = await this.createCholesterolObservation();
    const bodyWeight = await this.createBodyWeightObservation();

    return {
      bloodPressure,
      heartRate,
      glucose,
      cholesterol,
      bodyWeight
    };
  }

  private async createBloodPressureObservations(): Promise<Observation[]> {
    const baseDate = new Date();
    baseDate.setHours(baseDate.getHours() - 2);

    const combinedBP: Observation = {
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure panel with all children optional'
          }
        ],
        text: 'Blood Pressure'
      },
      subject: {
        reference: `Patient/${this.patientId}`
      },
      effectiveDateTime: baseDate.toISOString(),
      component: [
        {
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '8480-6',
                display: 'Systolic blood pressure'
              }
            ]
          },
          valueQuantity: {
            value: 128,
            unit: 'mm[Hg]',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        },
        {
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '8462-4',
                display: 'Diastolic blood pressure'
              }
            ]
          },
          valueQuantity: {
            value: 82,
            unit: 'mm[Hg]',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        }
      ],
      performer: [
        {
          reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74',
          display: 'Dr. Aminata Diallo'
        }
      ]
    };

    const createdBP = await this.medplum.createResource(combinedBP);
    console.log('✅ Created blood pressure observations');
    return [createdBP];
  }

  private async createHeartRateObservation(): Promise<Observation> {
    const baseDate = new Date();
    baseDate.setHours(baseDate.getHours() - 1.5);

    const heartRate: Observation = {
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '8867-4',
            display: 'Heart rate'
          }
        ],
        text: 'Heart Rate'
      },
      subject: {
        reference: `Patient/${this.patientId}`
      },
      effectiveDateTime: baseDate.toISOString(),
      valueQuantity: {
        value: 76,
        unit: '/min',
        system: 'http://unitsofmeasure.org',
        code: '/min'
      },
      performer: [
        {
          reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74',
          display: 'Dr. Aminata Diallo'
        }
      ]
    };

    const created = await this.medplum.createResource(heartRate);
    console.log('✅ Created heart rate observation');
    return created;
  }

  private async createGlucoseObservation(): Promise<Observation> {
    const baseDate = new Date();
    baseDate.setHours(baseDate.getHours() - 8);

    const glucose: Observation = {
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
              display: 'Laboratory'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '33747-0',
            display: 'Glucose [Mass/volume] in Blood by Glucometer'
          }
        ],
        text: 'Blood Glucose'
      },
      subject: {
        reference: `Patient/${this.patientId}`
      },
      effectiveDateTime: baseDate.toISOString(),
      valueQuantity: {
        value: 94,
        unit: 'mg/dL',
        system: 'http://unitsofmeasure.org',
        code: 'mg/dL'
      },
      performer: [
        {
          reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74',
          display: 'Dr. Aminata Diallo'
        }
      ]
    };

    const created = await this.medplum.createResource(glucose);
    console.log('✅ Created glucose observation');
    return created;
  }

  private async createCholesterolObservation(): Promise<Observation> {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 30);

    const cholesterol: Observation = {
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
              display: 'Laboratory'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '2093-3',
            display: 'Cholesterol [Mass/volume] in Serum or Plasma'
          }
        ],
        text: 'Total Cholesterol'
      },
      subject: {
        reference: `Patient/${this.patientId}`
      },
      effectiveDateTime: baseDate.toISOString(),
      valueQuantity: {
        value: 185,
        unit: 'mg/dL',
        system: 'http://unitsofmeasure.org',
        code: 'mg/dL'
      },
      performer: [
        {
          reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74',
          display: 'Dr. Aminata Diallo'
        }
      ]
    };

    const created = await this.medplum.createResource(cholesterol);
    console.log('✅ Created cholesterol observation');
    return created;
  }

  private async createBodyWeightObservation(): Promise<Observation> {
    const baseDate = new Date();
    baseDate.setMinutes(baseDate.getMinutes() - 30);

    const bodyWeight: Observation = {
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '29463-7',
            display: 'Body weight'
          }
        ],
        text: 'Body Weight'
      },
      subject: {
        reference: `Patient/${this.patientId}`
      },
      effectiveDateTime: baseDate.toISOString(),
      valueQuantity: {
        value: 68.5,
        unit: 'kg',
        system: 'http://unitsofmeasure.org',
        code: 'kg'
      },
      performer: [
        {
          reference: 'Practitioner/0196fc4e-2db6-766e-b989-fa4dda71ca74',
          display: 'Dr. Aminata Diallo'
        }
      ]
    };

    const created = await this.medplum.createResource(bodyWeight);
    console.log('✅ Created body weight observation');
    return created;
  }
}

export async function seedPatientVitalsWithAuth(
  medplum: MedplumClient,
  patientId: string,
  options?: {
    token?: string;
    useStoredAuth?: boolean;
    email?: string;
    password?: string;
  }
): Promise<{
  bloodPressure: Observation[];
  heartRate: Observation;
  glucose: Observation;
  cholesterol: Observation;
  bodyWeight: Observation;
}> {
  const seeder = new PatientVitalsDataSeeder(medplum, patientId);

  try {
    if (options?.token) {
      await seeder.authenticate(options.token);
    } else if (options?.email && options?.password) {
      console.log('🔐 Attempting email/password authentication');
      await medplum.startLogin(options.email, options.password);
    } else if (options?.useStoredAuth !== false) {
      await seeder.authenticate();
    } else {
      await seeder.authenticate();
    }

    return await seeder.seedVitalsData();

  } catch (error: any) {
    if (error.message?.includes('Authentication')) {
      throw new Error(
        `Authentication failed: ${error.message}\n\n` +
        'Available options:\n' +
        '• Provide a token: { token: "your-access-token" }\n' +
        '• Use email/password: { email: "user@example.com", password: "password" }\n' +
        '• Login to the application first, then set: { useStoredAuth: true }'
      );
    }
    throw error;
  }
}
