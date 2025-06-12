import { MedplumClient } from '@medplum/core';
import { 
  AllergyIntolerance, 
  Immunization, 
  Condition, 
  MedicationRequest,
  Patient 
} from '@medplum/fhirtypes';

export class PatientClinicalDataSeeder {
  private medplum: MedplumClient;
  private patientId: string;
  private isAuthenticated: boolean = false;

  constructor(medplumClient: MedplumClient, patientId: string) {
    this.medplum = medplumClient;
    this.patientId = patientId;
  }

  /**
   * Authenticate the Medplum client using various methods
   */
  async authenticate(token?: string): Promise<boolean> {
    try {
      // Method 1: Use provided token
      if (token) {
        console.log('🔐 Using provided token for authentication');
        this.medplum.setAccessToken(token);
        this.isAuthenticated = true;
        return true;
      }

      // Method 2: Check for existing authentication
      const existingToken = this.medplum.getAccessToken();
      if (existingToken) {
        console.log('✅ Using existing Medplum client authentication');
        this.isAuthenticated = true;
        return true;
      }

      // Method 3: Try to get token from localStorage
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

      // Method 4: Try client credentials authentication (for server/script usage)
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

  /**
   * Verify authentication and patient before seeding
   */
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

    // Test authentication by making a simple API call
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

  async seedAllClinicalData() {
    try {
      console.log(`🏥 Seeding clinical data for patient: ${this.patientId}`);
      
      // Ensure we're authenticated
      await this.ensureAuthenticated();
      
      // Verify patient exists first
      const patient = await this.verifyPatient();
      console.log(`✓ Patient verified: ${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family}`);

      // Seed all clinical resources
      const allergies = await this.seedAllergyIntolerances();
      const immunizations = await this.seedImmunizations();
      const conditions = await this.seedConditions();
      const medications = await this.seedMedicationRequests();

      console.log('\n✅ All clinical data seeded successfully!');
      
      return {
        patient,
        allergies,
        immunizations,
        conditions,
        medications
      };
    } catch (error) {
      console.error('Error seeding clinical data:', error);
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

  // AllergyIntolerance Resources
  async seedAllergyIntolerances(): Promise<AllergyIntolerance[]> {
    const allergies: Partial<AllergyIntolerance>[] = [
      {
        resourceType: 'AllergyIntolerance',
        patient: { reference: `Patient/${this.patientId}` },
        clinicalStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
            code: 'active',
            display: 'Active'
          }]
        },
        verificationStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
            code: 'confirmed',
            display: 'Confirmed'
          }]
        },
        type: 'allergy',
        category: ['medication'],
        criticality: 'high',
        code: {
          coding: [{
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: '7980',
            display: 'Penicillin'
          }],
          text: 'Penicillin'
        },
        reaction: [{
          manifestation: [{
            coding: [{
              system: 'http://snomed.info/sct',
              code: '247472004',
              display: 'Wheal'
            }],
            text: 'Skin rash and swelling'
          }],
          severity: 'severe',
          onset: '2020-03-15'
        }],
        recordedDate: '2023-01-15',
        note: [{
          text: 'Patient reports severe allergic reaction to penicillin with skin rash. Documented during initial consultation.'
        }]
      },
      {
        resourceType: 'AllergyIntolerance',
        patient: { reference: `Patient/${this.patientId}` },
        clinicalStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
            code: 'active',
            display: 'Active'
          }]
        },
        verificationStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
            code: 'confirmed',
            display: 'Confirmed'
          }]
        },
        type: 'intolerance',
        category: ['food'],
        criticality: 'low',
        code: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '412071004',
            display: 'Lactose'
          }],
          text: 'Lactose intolerance'
        },
        reaction: [{
          manifestation: [{
            coding: [{
              system: 'http://snomed.info/sct',
              code: '62315008',
              display: 'Diarrhea'
            }],
            text: 'Digestive discomfort and diarrhea'
          }],
          severity: 'mild'
        }],
        recordedDate: '2023-02-10',
        note: [{
          text: 'Mild lactose intolerance causing digestive issues. Patient manages with lactose-free alternatives.'
        }]
      }
    ];

    const createdAllergies: AllergyIntolerance[] = [];
    for (const allergy of allergies) {
      const created = await this.medplum.createResource(allergy);
      createdAllergies.push(created);
      console.log(`✓ Created AllergyIntolerance: ${allergy.code?.text}`);
    }

    return createdAllergies;
  }
  // Immunization Resources
  async seedImmunizations(): Promise<Immunization[]> {
    const immunizations: Partial<Immunization>[] = [
      {
        resourceType: 'Immunization',
        status: 'completed',
        vaccineCode: {
          coding: [{
            system: 'http://hl7.org/fhir/sid/cvx',
            code: '207',
            display: 'COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose'
          }],
          text: 'COVID-19 Vaccine (Pfizer-BioNTech)'
        },
        patient: { reference: `Patient/${this.patientId}` },
        occurrenceDateTime: '2023-03-15',
        recorded: '2023-03-15',
        primarySource: true,
        location: {
          reference: 'Location/community-health-center-bamako'
        },
        manufacturer: {
          display: 'Pfizer-BioNTech'
        },
        lotNumber: 'FL8726',
        expirationDate: '2024-03-15',
        site: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActSite',
            code: 'LA',
            display: 'left arm'
          }]
        },
        route: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration',
            code: 'IM',
            display: 'intramuscular'
          }]
        },
        doseQuantity: {
          value: 0.3,
          unit: 'mL',
          system: 'http://unitsofmeasure.org',
          code: 'mL'
        },
        note: [{
          text: 'First dose of COVID-19 vaccination series. Patient tolerated well with no immediate adverse reactions.'
        }]
      },
      {
        resourceType: 'Immunization',
        status: 'completed',
        vaccineCode: {
          coding: [{
            system: 'http://hl7.org/fhir/sid/cvx',
            code: '141',
            display: 'Influenza, seasonal, injectable'
          }],
          text: 'Seasonal Influenza Vaccine'
        },
        patient: { reference: `Patient/${this.patientId}` },
        occurrenceDateTime: '2023-10-15',
        recorded: '2023-10-15',
        primarySource: true,
        location: {
          reference: 'Location/community-health-center-bamako'
        },
        lotNumber: 'FLU2023-10',
        expirationDate: '2024-10-15',
        site: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActSite',
            code: 'RA',
            display: 'right arm'
          }]
        },
        route: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration',
            code: 'IM',
            display: 'intramuscular'
          }]
        },
        doseQuantity: {
          value: 0.5,
          unit: 'mL',
          system: 'http://unitsofmeasure.org',
          code: 'mL'
        },
        note: [{
          text: 'Annual seasonal influenza vaccination. Part of preventive care program.'
        }]
      }
    ];

    const createdImmunizations: Immunization[] = [];
    for (const immunization of immunizations) {
      const created = await this.medplum.createResource(immunization);
      createdImmunizations.push(created);
      console.log(`✓ Created Immunization: ${immunization.vaccineCode?.text}`);
    }

    return createdImmunizations;
  }
  // Condition Resources
  async seedConditions(): Promise<Condition[]> {
    const conditions: Partial<Condition>[] = [
      {
        resourceType: 'Condition',
        clinicalStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active',
            display: 'Active'
          }]
        },
        verificationStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
            display: 'Confirmed'
          }]
        },
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'problem-list-item',
            display: 'Problem List Item'
          }]
        }],
        severity: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '24484000',
            display: 'Severe'
          }]
        },
        code: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '38341003',
            display: 'Hypertensive disorder, systemic arterial'
          }],
          text: 'Hypertension'
        },
        subject: { reference: `Patient/${this.patientId}` },
        onsetDateTime: '2022-08-15',
        recordedDate: '2022-08-20',
        recorder: {
          reference: 'Practitioner/dr-aminata-diallo'
        },
        note: [{
          text: 'Patient diagnosed with essential hypertension. Currently managing with lifestyle modifications and medication.'
        }]
      },
      {
        resourceType: 'Condition',
        clinicalStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active',
            display: 'Active'
          }]
        },
        verificationStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
            display: 'Confirmed'
          }]
        },
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'problem-list-item',
            display: 'Problem List Item'
          }]
        }],
        severity: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '255604002',
            display: 'Mild'
          }]
        },
        code: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '73211009',
            display: 'Diabetes mellitus'
          }],
          text: 'Type 2 Diabetes Mellitus'
        },
        subject: { reference: `Patient/${this.patientId}` },
        onsetDateTime: '2023-01-10',
        recordedDate: '2023-01-15',
        recorder: {
          reference: 'Practitioner/dr-aminata-diallo'
        },
        note: [{
          text: 'Newly diagnosed Type 2 diabetes mellitus. Patient started on metformin and dietary counseling.'
        }]
      }
    ];

    const createdConditions: Condition[] = [];
    for (const condition of conditions) {
      const created = await this.medplum.createResource(condition);
      createdConditions.push(created);
      console.log(`✓ Created Condition: ${condition.code?.text}`);
    }

    return createdConditions;
  }
  // MedicationRequest Resources
  async seedMedicationRequests(): Promise<MedicationRequest[]> {
    const medicationRequests: Partial<MedicationRequest>[] = [
      {
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
          coding: [{
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: '860975',
            display: 'Lisinopril 10 MG Oral Tablet'
          }],
          text: 'Lisinopril 10mg tablets'
        },
        subject: { reference: `Patient/${this.patientId}` },
        authoredOn: '2023-08-20',
        requester: {
          reference: 'Practitioner/dr-aminata-diallo'
        },
        reasonReference: [{
          reference: 'Condition/hypertension-condition-id'
        }],
        dosageInstruction: [{
          text: 'Take one tablet by mouth once daily',
          timing: {
            repeat: {
              frequency: 1,
              period: 1,
              periodUnit: 'd'
            }
          },
          route: {
            coding: [{
              system: 'http://snomed.info/sct',
              code: '26643006',
              display: 'Oral route'
            }]
          },
          doseAndRate: [{
            doseQuantity: {
              value: 1,
              unit: 'tablet',
              system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
              code: 'TAB'
            }
          }]
        }],
        dispenseRequest: {
          numberOfRepeatsAllowed: 5,
          quantity: {
            value: 30,
            unit: 'tablet',
            system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
            code: 'TAB'
          },
          expectedSupplyDuration: {
            value: 30,
            unit: 'days',
            system: 'http://unitsofmeasure.org',
            code: 'd'
          }
        },
        note: [{
          text: 'For hypertension management. Monitor blood pressure regularly. Check kidney function in 4 weeks.'
        }]
      },
      {
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
          coding: [{
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: '860719',
            display: 'Metformin hydrochloride 500 MG Oral Tablet'
          }],
          text: 'Metformin 500mg tablets'
        },
        subject: { reference: `Patient/${this.patientId}` },
        authoredOn: '2023-01-15',
        requester: {
          reference: 'Practitioner/dr-aminata-diallo'
        },
        reasonReference: [{
          reference: 'Condition/diabetes-condition-id'
        }],
        dosageInstruction: [{
          text: 'Take one tablet by mouth twice daily with meals',
          timing: {
            repeat: {
              frequency: 2,
              period: 1,
              periodUnit: 'd'
            }
          },
          route: {
            coding: [{
              system: 'http://snomed.info/sct',
              code: '26643006',
              display: 'Oral route'
            }]
          },
          doseAndRate: [{
            doseQuantity: {
              value: 1,
              unit: 'tablet',
              system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
              code: 'TAB'
            }
          }]
        }],
        dispenseRequest: {
          numberOfRepeatsAllowed: 6,
          quantity: {
            value: 60,
            unit: 'tablet',
            system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
            code: 'TAB'
          },
          expectedSupplyDuration: {
            value: 30,
            unit: 'days',
            system: 'http://unitsofmeasure.org',
            code: 'd'
          }
        },
        note: [{
          text: 'For Type 2 diabetes management. Take with meals to reduce GI side effects. Monitor blood glucose levels.'
        }]
      },
      {
        resourceType: 'MedicationRequest',
        status: 'completed',
        intent: 'order',
        medicationCodeableConcept: {
          coding: [{
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: '197361',
            display: 'Amoxicillin 500 MG Oral Capsule'
          }],
          text: 'Amoxicillin 500mg capsules'
        },
        subject: { reference: `Patient/${this.patientId}` },
        authoredOn: '2023-11-05',
        requester: {
          reference: 'Practitioner/dr-aminata-diallo'
        },
        dosageInstruction: [{
          text: 'Take one capsule by mouth three times daily for 7 days',
          timing: {
            repeat: {
              frequency: 3,
              period: 1,
              periodUnit: 'd',
              boundsDuration: {
                value: 7,
                unit: 'days',
                system: 'http://unitsofmeasure.org',
                code: 'd'
              }
            }
          },
          route: {
            coding: [{
              system: 'http://snomed.info/sct',
              code: '26643006',
              display: 'Oral route'
            }]
          },
          doseAndRate: [{
            doseQuantity: {
              value: 1,
              unit: 'capsule',
              system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
              code: 'CAP'
            }
          }]
        }],
        dispenseRequest: {
          numberOfRepeatsAllowed: 0,
          quantity: {
            value: 21,
            unit: 'capsule',
            system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
            code: 'CAP'
          },
          expectedSupplyDuration: {
            value: 7,
            unit: 'days',
            system: 'http://unitsofmeasure.org',
            code: 'd'
          }
        },
        note: [{
          text: 'Prescribed for bacterial respiratory infection. Complete full course even if symptoms improve.'
        }]
      }
    ];

    const createdMedications: MedicationRequest[] = [];
    for (const medication of medicationRequests) {
      const created = await this.medplum.createResource(medication);
      createdMedications.push(created);
      console.log(`✓ Created MedicationRequest: ${medication.medicationCodeableConcept?.text}`);
    }

    return createdMedications;
  }
}

// Enhanced utility functions for easy usage
export async function seedPatientClinicalData(medplumClient: MedplumClient, patientId: string, token?: string) {
  const seeder = new PatientClinicalDataSeeder(medplumClient, patientId);
  
  // Authenticate if token provided
  if (token) {
    await seeder.authenticate(token);
  }
  
  try {
    const result = await seeder.seedAllClinicalData();
    
    console.log('\n📊 Summary of seeded data:');
    console.log(`   • ${result.allergies.length} AllergyIntolerance resources`);
    console.log(`   • ${result.immunizations.length} Immunization resources`);
    console.log(`   • ${result.conditions.length} Condition resources`);
    console.log(`   • ${result.medications.length} MedicationRequest resources`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to seed clinical data:', error);
    throw error;
  }
}

// Utility functions for individual resource types
export async function seedPatientAllergies(medplumClient: MedplumClient, patientId: string, token?: string) {
  const seeder = new PatientClinicalDataSeeder(medplumClient, patientId);
  if (token) await seeder.authenticate(token);
  return await seeder.seedAllergyIntolerances();
}

export async function seedPatientImmunizations(medplumClient: MedplumClient, patientId: string, token?: string) {
  const seeder = new PatientClinicalDataSeeder(medplumClient, patientId);
  if (token) await seeder.authenticate(token);
  return await seeder.seedImmunizations();
}

export async function seedPatientConditions(medplumClient: MedplumClient, patientId: string, token?: string) {
  const seeder = new PatientClinicalDataSeeder(medplumClient, patientId);
  if (token) await seeder.authenticate(token);
  return await seeder.seedConditions();
}

export async function seedPatientMedicationRequests(medplumClient: MedplumClient, patientId: string, token?: string) {
  const seeder = new PatientClinicalDataSeeder(medplumClient, patientId);
  if (token) await seeder.authenticate(token);
  return await seeder.seedMedicationRequests();
}

// Enhanced seeding function with automatic authentication
export async function seedPatientClinicalDataWithAuth(
  medplumClient: MedplumClient, 
  patientId: string, 
  options?: {
    token?: string;
    email?: string;
    password?: string;
    useStoredAuth?: boolean;
  }
) {
  const seeder = new PatientClinicalDataSeeder(medplumClient, patientId);
  
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
    
    return await seeder.seedAllClinicalData();
  } catch (error: any) {
    if (error.message?.includes('Authentication')) {
      console.error(`
❌ Authentication Error: ${error.message}

💡 Solutions:
1. Provide a valid token: seedPatientClinicalDataWithAuth(client, patientId, { token: "your-token" })
2. Login first in the application, then run the seeding
3. Use email/password: seedPatientClinicalDataWithAuth(client, patientId, { email: "user@example.com", password: "password" })
4. Get a token from localStorage after logging in: localStorage.getItem('medplum.access_token')
      `);
    }
    throw error;
  }
}