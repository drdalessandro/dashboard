/**
 * Enhanced Script to seed dummy patient data into the database
 * This will insert the patients using the Medplum client with enhanced FHIR Patient resource support
 * 
 * Enhanced Features:
 * - Contact party information (guardian, partner, friend)
 * - General practitioner references
 * - Managing organization references
 * - Full FHIR R4 Patient resource compliance
 */

import { Address, HumanName, Patient, ContactPoint } from '@medplum/fhirtypes';
import { medplumClient } from '../lib/medplum/client';
import { faker } from '@faker-js/faker/locale/fr';

// Initialize Medplum client
const medplum = medplumClient;

// Common Malian last names
const malianLastNames = [
  'Diallo', 'Traoré', 'Diakité', 'Sow', 'Diarra', 'Cissé', 'Coulibaly', 'Kanté',
  'Keïta', 'Konaté', 'Diop', 'Sacko', 'Dembélé', 'Sissoko', 'Sangaré', 'Touré',
  'Ba', 'Diawara', 'Dembélé', 'Kouyaté', 'Sidibé', 'Dia', 'Maïga', 'Sissoko', 'Koné'
];

// Common Malian first names
const malianFirstNames = {
  male: [
    'Moussa', 'Ibrahim', 'Amadou', 'Boubacar', 'Sékou', 'Ousmane', 'Modibo', 'Mahamadou',
    'Bakary', 'Samba', 'Mamadou', 'Abdoulaye', 'Boubacar', 'Cheick', 'Aliou', 'Soumaila',
    'Lassana', 'Seydou', 'Yaya', 'Adama', 'Bakari', 'Boubacar', 'Cheick', 'Fousseyni', 'Harouna'
  ],
  female: [
    'Aïssata', 'Aminata', 'Fatoumata', 'Mariam', 'Aïcha', 'Hawa', 'Kadiatou', 'Oumou',
    'Ramatoulaye', 'Saran', 'Awa', 'Djeneba', 'Fanta', 'Kadidia', 'Maimouna', 'Mariam',
    'Nafissatou', 'Rokia', 'Safiatou', 'Sali', 'Sira', 'Ténin', 'Yacine', 'Zeinabou', 'Aïssatou'
  ]
};

// Common Malian cities
const malianCities = [
  'Bamako', 'Sikasso', 'Mopti', 'Koutiala', 'Ségou', 'Gao', 'Kayes', 'Kati', 'Tombouctou',
  'Bougouni', 'Kita', 'Koro', 'Koulikoro', 'Nioro du Sahel', 'Niono', 'San', 'Sikasso',
  'Ténenkou', 'Yorosso', 'Bandiagara', 'Diré', 'Douentza', 'Kidal', 'Menaka', 'Tessalit'
];

// Available practitioners for general practitioner assignments
const availablePractitioners = [
  { id: '0196fc4e-2db6-766e-b989-fa4dda71ca74', name: 'Dr. Aminata Diallo' },
  { id: '0196fc4e-2e5e-715f-92ec-8f0dfd543569', name: 'Dr. Ibrahim Sow' },
  { id: '0196fc4e-2e82-70fa-8064-134687045891', name: 'Dr. Mariam Coulibaly' },
  { id: '0196fc4e-2eba-74dd-9fe4-1a4b65d90712', name: 'Dr. Fatoumata Toure' },
  { id: '0196fc4e-2ef2-70ef-974c-03c8b92079b0', name: 'Dr. Kadiatou Sidibe' },
  { id: '0196fc4e-2f0c-72b8-a05d-7e3c22607346', name: 'Dr. Mamadou Sangare' }
];

// Available organizations for managing organization assignments
// Updated with realistic IDs based on organization seeder patterns
const availableOrganizations = [
  // National Hospitals (from OrganizationDataSeeder)
  { id: 'hosp-nat-point-g', name: 'Hôpital du Point G' },
  { id: 'hosp-nat-gabriel-toure', name: 'Centre Hospitalier Universitaire Gabriel Touré' },
  { id: 'hosp-nat-kati', name: 'Hôpital de Kati' },

  // Regional Hospitals
  { id: 'hosp-reg-sikasso', name: 'Hôpital Régional de Sikasso' },
  { id: 'hosp-reg-segou', name: 'Hôpital Régional de Ségou' },
  { id: 'hosp-reg-mopti', name: 'Hôpital Régional de Mopti' },

  // Referral Centers (CSRef)
  { id: 'csref-commune-i', name: 'Centre de Santé de Référence de Commune I' },
  { id: 'csref-commune-ii', name: 'Centre de Santé de Référence de Commune II' },
  { id: 'csref-commune-iii', name: 'Centre de Santé de Référence de Commune III' },

  // Community Health Centers (CSCom)
  { id: 'cscom-banconi', name: 'Centre de Santé Communautaire de Banconi' },
  { id: 'cscom-magnambougou', name: 'Centre de Santé Communautaire de Magnambougou' },
  { id: 'cscom-sabalibougou', name: 'Centre de Santé Communautaire de Sabalibougou' }
];

// Contact relationship types
const contactRelationshipTypes = [
  {
    code: 'guardian',
    display: 'Guardian',
    system: 'http://terminology.hl7.org/CodeSystem/v2-0131'
  },
  {
    code: 'partner',
    display: 'Partner',
    system: 'http://terminology.hl7.org/CodeSystem/v2-0131'
  },
  {
    code: 'friend',
    display: 'Friend',
    system: 'http://terminology.hl7.org/CodeSystem/v2-0131'
  }
];

// Generate a random Malian phone number
const generatePhoneNumber = () => {
  const prefixes = ['65', '66', '67', '68', '69', '71', '72', '73', '74', '75', '76', '77', '78', '79'];
  const prefix = faker.helpers.arrayElement(prefixes);
  const number = faker.string.numeric(6);
  return `+223 ${prefix} ${number}`.trim();
};

// Generate a random date of birth between 1 and 100 years ago
const generateBirthDate = () => {
  const years = faker.number.int({ min: 1, max: 100 });
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().split('T')[0];
};

// Generate a random patient identifier
const generateIdentifier = () => {
  return {
    system: 'https://healthplatform.ml/patients',
    value: `PAT-${faker.string.alphanumeric(8).toUpperCase()}`
  };
};

// Generate a random address
const generateAddress = (): Address => {
  return {
    use: 'home',
    type: 'physical',
    line: [faker.location.streetAddress()],
    city: faker.helpers.arrayElement(malianCities),
    state: 'Mali',
    postalCode: faker.location.zipCode(),
    country: 'ML'
  };
};

// Generate a random name with Malian names
const generateName = (gender: 'male' | 'female'): HumanName[] => {
  const firstName = faker.helpers.arrayElement(malianFirstNames[gender]);
  const lastName = faker.helpers.arrayElement(malianLastNames);

  return [{
    use: 'official',
    family: lastName,
    given: [firstName],
    prefix: [gender === 'male' ? 'M.' : 'Mme']
  }];
};

// Generate contact information
const generateContactInfo = (): ContactPoint[] => {
  return [
    { system: 'phone', value: generatePhoneNumber(), use: 'mobile' },
    {
      system: 'email',
      value: faker.internet.email().toLowerCase(),
      use: 'home',
      rank: 1
    }
  ];
};

// Generate contact party (guardian, partner, friend)
const generateContactParty = (relationshipType: typeof contactRelationshipTypes[0], patientGender: 'male' | 'female') => {
  // For guardian, use older person; for partner, use similar age; for friend, use any age
  let contactGender: 'male' | 'female';

  if (relationshipType.code === 'partner') {
    // Partners are often opposite gender but can be same gender
    contactGender = faker.datatype.boolean({ probability: 0.7 })
      ? (patientGender === 'male' ? 'female' : 'male')
      : patientGender;
  } else {
    // Guardian and friend can be any gender
    contactGender = faker.person.sexType() as 'male' | 'female';
  }

  return {
    relationship: [
      {
        coding: [
          {
            system: relationshipType.system,
            code: relationshipType.code,
            display: relationshipType.display
          }
        ],
        text: relationshipType.display
      }
    ],
    name: {
      family: faker.helpers.arrayElement(malianLastNames),
      given: [faker.helpers.arrayElement(malianFirstNames[contactGender])],
      use: 'official' as const
    },
    telecom: generateContactInfo(),
    address: generateAddress(),
    gender: contactGender
  };
};

// Generate general practitioner reference
const generateGeneralPractitioner = () => {
  const practitioner = faker.helpers.arrayElement(availablePractitioners);
  return [
    {
      reference: `Practitioner/${practitioner.id}`,
      display: practitioner.name
    }
  ];
};

// Generate managing organization reference
const generateManagingOrganization = () => {
  const organization = faker.helpers.arrayElement(availableOrganizations);
  return {
    reference: `Organization/${organization.id}`,
    display: organization.name
  };
};

// Enhanced dummy patients generation with additional FHIR fields
const generateDummyPatients = (count: number): Patient[] => {
  const patients: Patient[] = [];

  for (let i = 0; i < count; i++) {
    const gender = faker.person.sexType() as 'male' | 'female';
    const birthDate = generateBirthDate();
    const active = faker.datatype.boolean({ probability: 0.85 }); // 85% active

    // Generate 1-3 contact parties (guardian, partner, friend)
    const contactParties = [];
    const numberOfContacts = faker.number.int({ min: 1, max: 3 });
    const selectedRelationships = faker.helpers.arrayElements(contactRelationshipTypes, numberOfContacts);

    for (const relationship of selectedRelationships) {
      contactParties.push(generateContactParty(relationship, gender));
    }

    // Create enhanced patient with additional FHIR fields
    const patient: Patient = {
      resourceType: 'Patient',
      identifier: [generateIdentifier()],
      active,
      name: generateName(gender),
      gender,
      birthDate,
      telecom: generateContactInfo(),
      address: [generateAddress()],
      maritalStatus: {
        coding: [
          {
            system: 'http://hl7.org/fhir/ValueSet/marital-status',
            code: faker.helpers.arrayElement(['S', 'M', 'D', 'W', 'U']),
            display: faker.helpers.arrayElement([
              'Never Married', 'Married', 'Divorced', 'Widowed', 'Unknown'
            ])
          }
        ],
        text: faker.helpers.arrayElement([
          'Never Married', 'Married', 'Divorced', 'Widowed', 'Unknown'
        ])
      },
      // Enhanced contact information with multiple contact parties
      contact: [
        // Original emergency contact
        {
          relationship: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                  code: 'C',
                  display: 'Emergency Contact'
                }
              ]
            }
          ],
          name: {
            family: faker.helpers.arrayElement(malianLastNames),
            given: [faker.person.firstName()],
            use: 'official'
          },
          telecom: [
            { system: 'phone', value: generatePhoneNumber(), use: 'mobile' }
          ],
          address: generateAddress()
        },
        // Additional contact parties (guardian, partner, friend)
        ...contactParties
      ],
      // General practitioner assignment
      generalPractitioner: generateGeneralPractitioner(),
      // Managing organization assignment
      managingOrganization: generateManagingOrganization()
    };

    patients.push(patient);
  }

  return patients;
};

// Enhanced patient seeding class following the vitals seeder pattern
export class EnhancedPatientsSeeder {
  private medplum: any;
  private isAuthenticated: boolean = false;

  constructor(medplumClient: any) {
    this.medplum = medplumClient;
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

      // Check for environment token
      if (process.env.MEDPLUM_ACCESS_TOKEN) {
        console.log('🔑 Using environment token');
        this.medplum.setAccessToken(process.env.MEDPLUM_ACCESS_TOKEN);
        this.isAuthenticated = true;
        return true;
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

      console.log('⚠️  No authentication method succeeded - server may not be running or credentials missing');
      return false;
    } catch (error) {
      console.log('⚠️  Authentication error:', error);
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
  }

  async seedPatients(count: number = 50) {
    await this.ensureAuthenticated();

    console.log('🏥 Starting enhanced patient seeding with additional FHIR fields...');
    const patients = generateDummyPatients(count);
    const results = {
      created: 0,
      failed: 0,
      total: patients.length,
      errors: [] as Array<{ index: number; error: any }>
    };

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      try {
        const created = await this.medplum?.createResource(patient);
        results.created++;

        const patientName = patient.name?.[0];
        const fullName = `${patientName?.given?.join(' ') || ''} ${patientName?.family || ''}`.trim();
        console.log(`✅ Created patient ${i + 1}/${patients.length}: ${fullName} (ID: ${created.id})`);

        // Log additional FHIR fields for verification
        if (patient.generalPractitioner?.length) {
          console.log(`   📋 General Practitioner: ${patient.generalPractitioner[0].display}`);
        }
        if (patient.managingOrganization) {
          console.log(`   🏢 Managing Organization: ${patient.managingOrganization.display}`);
        }
        if (patient.contact && patient.contact.length > 1) {
          console.log(`   👥 Contact Parties: ${patient.contact.length - 1} additional contacts`);
        }

      } catch (error) {
        console.error(`❌ Error creating patient ${i + 1}:`, error);
        results.failed++;
        results.errors.push({ index: i, error });
      }
    }

    console.log('🎉 Enhanced patient seeding completed:', results);
    return results;
  }

  async updatePatientWithEnhancedValues(patientId: string, options?: {
    addContacts?: boolean;
    assignPractitioner?: boolean;
    assignOrganization?: boolean;
    updateDemographics?: boolean;
  }) {
    await this.ensureAuthenticated();
    
    console.log(`🔄 Updating patient ${patientId} with enhanced values...`);
    
    try {
      // First, fetch the existing patient
      const existingPatient = await this.medplum?.readResource('Patient', patientId);
      if (!existingPatient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }

      const patientName = existingPatient.name?.[0];
      const fullName = `${patientName?.given?.join(' ') || ''} ${patientName?.family || ''}`.trim();
      console.log(`📋 Found patient: ${fullName}`);

      // Create enhanced data based on existing patient
      const gender = existingPatient.gender || faker.person.sexType() as 'male' | 'female';
      
      // Build update object with enhanced values
      const updatedPatient: Patient = {
        ...existingPatient,
        resourceType: 'Patient',
        id: patientId
      };

      // Add enhanced contact parties if requested (default: true)
      if (options?.addContacts !== false && (!existingPatient.contact || existingPatient.contact.length <= 1)) {
        console.log('   👥 Adding enhanced contact parties...');
        
        const contactParties = [];
        const numberOfContacts = faker.number.int({ min: 1, max: 3 });
        const selectedRelationships = faker.helpers.arrayElements(contactRelationshipTypes, numberOfContacts);

        for (const relationship of selectedRelationships) {
          contactParties.push(generateContactParty(relationship, gender));
        }

        // Preserve existing emergency contact if it exists
        const existingContacts = existingPatient.contact || [];
        updatedPatient.contact = [
          ...existingContacts,
          ...contactParties
        ];
        
        console.log(`   ✅ Added ${contactParties.length} contact parties`);
      }

      // Assign general practitioner if requested (default: true)
      if (options?.assignPractitioner !== false && !existingPatient.generalPractitioner?.length) {
        console.log('   👨‍⚕️ Assigning general practitioner...');
        updatedPatient.generalPractitioner = generateGeneralPractitioner();
        console.log(`   ✅ Assigned GP: ${updatedPatient.generalPractitioner[0].display}`);
      }

      // Assign managing organization if requested (default: true)
      if (options?.assignOrganization !== false && !existingPatient.managingOrganization) {
        console.log('   🏢 Assigning managing organization...');
        updatedPatient.managingOrganization = generateManagingOrganization();
        console.log(`   ✅ Assigned organization: ${updatedPatient.managingOrganization.display}`);
      }

      // Update demographics if requested (default: false to preserve existing data)
      if (options?.updateDemographics === true) {
        console.log('   📊 Updating demographic information...');
        
        // Add marital status if missing
        if (!existingPatient.maritalStatus) {
          updatedPatient.maritalStatus = {
            coding: [
              {
                system: 'http://hl7.org/fhir/ValueSet/marital-status',
                code: faker.helpers.arrayElement(['S', 'M', 'D', 'W', 'U']),
                display: faker.helpers.arrayElement([
                  'Never Married', 'Married', 'Divorced', 'Widowed', 'Unknown'
                ])
              }
            ],
            text: faker.helpers.arrayElement([
              'Never Married', 'Married', 'Divorced', 'Widowed', 'Unknown'
            ])
          };
          console.log(`   ✅ Added marital status: ${updatedPatient.maritalStatus.text}`);
        }

        // Enhance telecom if limited
        if (!existingPatient.telecom || existingPatient.telecom.length < 2) {
          updatedPatient.telecom = generateContactInfo();
          console.log('   ✅ Enhanced telecom information');
        }

        // Add identifier if missing
        if (!existingPatient.identifier?.length) {
          updatedPatient.identifier = [generateIdentifier()];
          console.log('   ✅ Added patient identifier');
        }
      }

      // Update the patient
      const updated = await this.medplum?.updateResource(updatedPatient);
      
      console.log(`✅ Successfully updated patient: ${fullName} (ID: ${patientId})`);
      
      // Log summary of enhancements
      const enhancements = [];
      if (updatedPatient.contact && updatedPatient.contact.length > (existingPatient.contact?.length || 0)) {
        enhancements.push(`${updatedPatient.contact.length - (existingPatient.contact?.length || 0)} contact parties`);
      }
      if (updatedPatient.generalPractitioner && !existingPatient.generalPractitioner?.length) {
        enhancements.push('general practitioner');
      }
      if (updatedPatient.managingOrganization && !existingPatient.managingOrganization) {
        enhancements.push('managing organization');
      }
      if (options?.updateDemographics && enhancements.length > 0) {
        enhancements.push('demographic data');
      }

      if (enhancements.length > 0) {
        console.log(`📈 Enhanced: ${enhancements.join(', ')}`);
      }

      return {
        success: true,
        patientId,
        patientName: fullName,
        enhancements,
        updated
      };

    } catch (error) {
      console.error(`❌ Error updating patient ${patientId}:`, error);
      return {
        success: false,
        patientId,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Legacy function for backward compatibility
const seedPatients = async (count: number = 50) => {
  const seeder = new EnhancedPatientsSeeder(medplum);
  return await seeder.seedPatients(count);
};

// New convenience function for updating a specific patient
const updatePatientWithEnhancedValues = async (
  patientId: string, 
  options?: {
    addContacts?: boolean;
    assignPractitioner?: boolean;
    assignOrganization?: boolean;
    updateDemographics?: boolean;
  }
) => {
  const seeder = new EnhancedPatientsSeeder(medplum);
  return await seeder.updatePatientWithEnhancedValues(patientId, options);
};

// Enhanced seeding function with authentication options and patient update support
export async function seedPatientsWithAuth(
  medplumClient: any,
  options?: {
    count?: number;
    token?: string;
    useStoredAuth?: boolean;
    email?: string;
    password?: string;
    // New option for updating specific patient
    updatePatientId?: string;
    updateOptions?: {
      addContacts?: boolean;
      assignPractitioner?: boolean;
      assignOrganization?: boolean;
      updateDemographics?: boolean;
    };
  }
): Promise<{
  created: number;
  failed: number;
  total: number;
  errors: Array<{ index: number; error: any }>;
  updated?: {
    success: boolean;
    patientId: string;
    patientName?: string;
    enhancements?: string[];
    error?: string;
  };
}> {
  const seeder = new EnhancedPatientsSeeder(medplumClient);
  const count = options?.count || 50;

  try {
    if (options?.token) {
      await seeder.authenticate(options.token);
    } else if (options?.email && options?.password) {
      console.log('🔐 Attempting email/password authentication');
      await medplumClient.startLogin(options.email, options.password);
    } else if (options?.useStoredAuth !== false) {
      await seeder.authenticate();
    } else {
      await seeder.authenticate();
    }

    // If updatePatientId is provided, update that specific patient
    if (options?.updatePatientId) {
      console.log(`🎯 Updating specific patient: ${options.updatePatientId}`);
      const updateResult = await seeder.updatePatientWithEnhancedValues(
        options.updatePatientId,
        options.updateOptions
      );
      
      return {
        created: 0,
        failed: updateResult.success ? 0 : 1,
        total: 1,
        errors: updateResult.success ? [] : [{ index: 0, error: updateResult.error }],
        updated: updateResult
      };
    }

    // Otherwise, proceed with normal seeding
    return await seeder.seedPatients(count);

  } catch (error: any) {
    if (error.message?.includes('Authentication')) {
      throw new Error(
        `Authentication failed: ${error.message}\n\n` +
        'Available options:\n' +
        '• Provide a token: { token: "your-access-token" }\n' +
        '• Use email/password: { email: "user@example.com", password: "password" }\n' +
        '• Login to the application first, then set: { useStoredAuth: true }\n' +
        '• Update specific patient: { updatePatientId: "patient-id" }'
      );
    }
    throw error;
  }
}

// Run the seeding if this script is executed directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPatients()
    .then(({ created, failed, total, errors }) => {
      console.log(`\n🎉 Enhanced patient seeding complete!`);
      console.log(`✅ Successfully created: ${created} patients`);
      console.log(`❌ Failed to create: ${failed} patients`);
      console.log(`📊 Total processed: ${total} patients`);

      if (errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        errors.forEach(({ index, error }) => {
          console.log(`Patient ${index + 1}:`, error.message);
        });
      }

      console.log('\n📋 Enhanced features added:');
      console.log('• Contact parties (guardian, partner, friend)');
      console.log('• General practitioner assignments');
      console.log('• Managing organization assignments');
      console.log('• Full FHIR R4 Patient resource compliance');

      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error seeding patients:', error);
      process.exit(1);
    });
}

export { seedPatients, updatePatientWithEnhancedValues };
