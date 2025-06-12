import { MedplumClient } from '@medplum/core';
import { Organization } from '@medplum/fhirtypes';

export class OrganizationDataSeeder {
  private medplum: MedplumClient;
  private isAuthenticated: boolean = false;

  constructor(medplumClient: MedplumClient) {
    this.medplum = medplumClient;
  }

  async authenticate(token?: string): Promise<boolean> {
    try {
      if (token) {
        console.log('🔐 Using provided token for authentication');
        console.log('🔍 Token preview:', token.substring(0, 20) + '...');
        this.medplum.setAccessToken(token);

        // Test the token immediately
        try {
          await this.medplum.search('Organization', { _count: 1 });
          console.log('✅ Token validation successful');
          this.isAuthenticated = true;
          return true;
        } catch (tokenError: any) {
          console.error('❌ Token validation failed:', tokenError.message);
          this.isAuthenticated = false;
          return false;
        }
      }

      const existingToken = this.medplum.getAccessToken();
      if (existingToken) {
        console.log('✅ Using existing Medplum client authentication');
        try {
          await this.medplum.search('Organization', { _count: 1 });
          console.log('✅ Existing token validation successful');
          this.isAuthenticated = true;
          return true;
        } catch (existingTokenError: any) {
          console.error('❌ Existing token validation failed:', existingTokenError.message);
          this.isAuthenticated = false;
          // Continue to other authentication methods
        }
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

    // If we're already authenticated, skip the additional test
    if (this.isAuthenticated) {
      console.log('✅ Authentication confirmed, proceeding with seeding');
      return;
    }

    // Additional verification only if authentication status is unclear
    try {
      await this.medplum.search('Organization', { _count: 1 });
      this.isAuthenticated = true;
    } catch (error: any) {
      if (error.status === 401) {
        this.isAuthenticated = false;
        throw new Error(
          'Authentication failed. Please provide a valid token.\n' +
          'You can get a token from the application after logging in or use: \n' +
          'seeder.authenticate("your-valid-token")'
        );
      }
      throw error;
    }
  }

  async seedOrganizations(): Promise<{
    nationalHospitals: Organization[];
    regionalHospitals: Organization[];
    referralCenters: Organization[];
    communityHealthCenters: Organization[];
    allOrganizations: Organization[];
  }> {
    await this.ensureAuthenticated();

    console.log('🏥 Creating healthcare organizations for Mali healthcare system...');

    const nationalHospitals = await this.createNationalHospitals();
    const regionalHospitals = await this.createRegionalHospitals();
    const referralCenters = await this.createReferralCenters();
    const communityHealthCenters = await this.createCommunityHealthCenters();

    const allOrganizations = [
      ...nationalHospitals,
      ...regionalHospitals,
      ...referralCenters,
      ...communityHealthCenters
    ];

    console.log(`✅ Created ${allOrganizations.length} healthcare organizations for Mali`);

    return {
      nationalHospitals,
      regionalHospitals,
      referralCenters,
      communityHealthCenters,
      allOrganizations
    };
  }

  private async createNationalHospitals(): Promise<Organization[]> {
    const nationalHospitals = [
      {
        name: 'Hôpital du Point G',
        alias: ['Point G Hospital', 'CHU Point G', 'Teaching Hospital Point G'],
        city: 'Bamako',
        address: 'Point G, Bamako',
        phone: '+223 20 22 27 12',
        email: 'contact@pointg.ml',
        website: 'https://pointg.ml',
        type: 'prov',
        subtype: 'hosp',
        specialty: 'Teaching Hospital - General Medicine, Surgery, Emergency',
        description: 'Principal teaching hospital in Mali, affiliated with University of Sciences, Techniques and Technologies of Bamako',
        established: '1960',
        bedCapacity: '650',
        departments: ['Emergency', 'Surgery', 'Internal Medicine', 'Pediatrics', 'Obstetrics'],
        services: ['Emergency Care', 'Surgical Services', 'Laboratory', 'Radiology', 'Pharmacy'],
        accreditation: 'Mali Ministry of Health',
        partOf: null
      },
      {
        name: 'Centre Hospitalier Universitaire Gabriel Touré',
        alias: ['Gabriel Touré Hospital', 'CHU Gabriel Touré', 'Gabriel Toure University Hospital'],
        city: 'Bamako',
        address: 'Avenue Van Vollenhoven, Bamako',
        phone: '+223 20 22 27 92',
        email: 'contact@gabrieltoure.ml',
        website: 'https://gabrieltoure.ml',
        type: 'prov',
        subtype: 'hosp',
        specialty: 'Teaching Hospital - Pediatrics, Maternity, Internal Medicine',
        description: 'Specialized university hospital focusing on maternal and child health services',
        established: '1959',
        bedCapacity: '520',
        departments: ['Pediatrics', 'Maternity', 'Internal Medicine', 'Neonatology'],
        services: ['Maternal Care', 'Pediatric Services', 'Neonatal ICU', 'Laboratory'],
        accreditation: 'Mali Ministry of Health',
        partOf: null
      },
      {
        name: 'Hôpital de Kati',
        alias: ['Kati Hospital', 'Military Hospital Kati', 'Hôpital Militaire de Kati'],
        city: 'Kati',
        address: 'Kati, Koulikoro Region',
        phone: '+223 20 24 20 15',
        email: 'contact@hopitalkati.ml',
        website: 'https://hopitalkati.ml',
        type: 'prov',
        subtype: 'hosp',
        specialty: 'Military Hospital - General Medicine, Surgery',
        description: 'Primary military hospital serving armed forces and civilian population',
        established: '1965',
        bedCapacity: '280',
        departments: ['Surgery', 'Internal Medicine', 'Emergency'],
        services: ['Military Medicine', 'Civilian Care', 'Emergency Services'],
        accreditation: 'Mali Ministry of Defense',
        partOf: null
      }
    ];

    const createdOrganizations: Organization[] = [];

    for (const hospital of nationalHospitals) {
      const organization: Organization = {
        resourceType: 'Organization',
        active: true,
        identifier: [
          {
            use: 'official',
            system: 'http://mali.gov/healthcare/organization-id',
            value: `HOSP-NAT-${hospital.name.replace(/\s+/g, '-').toUpperCase()}`,
            assigner: {
              display: 'Mali Ministry of Health'
            }
          },
          {
            use: 'secondary',
            system: 'http://mali.gov/healthcare/license',
            value: `LIC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            period: {
              start: '2020-01-01',
              end: '2025-12-31'
            }
          }
        ],
        type: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/organization-type',
                code: hospital.type,
                display: 'Healthcare Provider'
              },
              {
                system: 'http://mali.gov/healthcare/organization-subtype',
                code: hospital.subtype,
                display: 'Hospital'
              }
            ],
            text: 'National Teaching Hospital'
          },
          {
            coding: [
              {
                system: 'http://hl7.org/fhir/organization-type',
                code: 'govt',
                display: 'Government'
              }
            ]
          }
        ],
        name: hospital.name,
        alias: hospital.alias,
        telecom: [
          {
            system: 'phone',
            value: hospital.phone,
            use: 'work',
            rank: 1
          },
          {
            system: 'email',
            value: hospital.email,
            use: 'work',
            rank: 1
          },
          {
            system: 'url',
            value: hospital.website,
            use: 'work'
          },
          {
            system: 'fax',
            value: hospital.phone.replace('20 22', '20 23'),
            use: 'work',
            rank: 2
          }
        ],
        address: [
          {
            use: 'work',
            type: 'physical',
            text: hospital.address,
            line: [hospital.address.split(',')[0]],
            city: hospital.city,
            district: hospital.city === 'Bamako' ? 'District de Bamako' : 'Koulikoro',
            state: hospital.city === 'Bamako' ? 'Bamako' : 'Koulikoro',
            postalCode: hospital.city === 'Bamako' ? 'BP 123' : 'BP 456',
            country: 'Mali',
            period: {
              start: hospital.established
            }
          },
          {
            use: 'billing',
            type: 'postal',
            text: `BP 123, ${hospital.city}, Mali`,
            line: ['BP 123'],
            city: hospital.city,
            state: hospital.city === 'Bamako' ? 'Bamako' : 'Koulikoro',
            postalCode: hospital.city === 'Bamako' ? 'BP 123' : 'BP 456',
            country: 'Mali'
          }
        ],
        contact: [
          {
            purpose: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/contactentity-type',
                  code: 'ADMIN',
                  display: 'Administrative'
                }
              ]
            },
            name: {
              use: 'official',
              family: 'Directeur',
              given: ['Médical'],
              text: 'Directeur Médical'
            },
            telecom: [
              {
                system: 'phone',
                value: hospital.phone,
                use: 'work'
              },
              {
                system: 'email',
                value: `directeur@${hospital.email.split('@')[1]}`,
                use: 'work'
              }
            ],
            address: {
              use: 'work',
              text: hospital.address,
              city: hospital.city,
              country: 'Mali'
            }
          },
          {
            purpose: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/contactentity-type',
                  code: 'PRESS',
                  display: 'Press'
                }
              ]
            },
            name: {
              text: 'Service Communication'
            },
            telecom: [
              {
                system: 'email',
                value: `communication@${hospital.email.split('@')[1]}`,
                use: 'work'
              }
            ]
          }
        ],
        endpoint: [
          {
            reference: `Endpoint/endpoint-${hospital.name.replace(/\s+/g, '-').toLowerCase()}`,
            display: `${hospital.name} FHIR Endpoint`
          }
        ],
        extension: [
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-capacity',
            valueInteger: parseInt(hospital.bedCapacity)
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-established',
            valueDate: hospital.established
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-accreditation',
            valueString: hospital.accreditation
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-description',
            valueString: hospital.description
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-departments',
            extension: hospital.departments.map(dept => ({
              url: 'department',
              valueString: dept
            }))
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-services',
            extension: hospital.services.map(service => ({
              url: 'service',
              valueString: service
            }))
          }
        ]
      };

      const created = await this.medplum.createResource(organization);
      createdOrganizations.push(created);
      console.log(`✅ Created national hospital: ${hospital.name}`);
    }

    return createdOrganizations;
  }

  private async createRegionalHospitals(): Promise<Organization[]> {
    const regionalHospitals = [
      {
        name: 'Hôpital Régional de Sikasso',
        city: 'Sikasso',
        region: 'Sikasso',
        phone: '+223 21 62 01 23',
        email: 'contact@hrsikasso.ml',
        website: 'https://hrsikasso.ml',
        established: '1975',
        bedCapacity: '180',
        population: '850000'
      },
      {
        name: 'Hôpital Régional de Ségou',
        city: 'Ségou',
        region: 'Ségou',
        phone: '+223 21 32 01 45',
        email: 'contact@hrsegou.ml',
        website: 'https://hrsegou.ml',
        established: '1972',
        bedCapacity: '160',
        population: '750000'
      },
      {
        name: 'Hôpital Régional de Mopti',
        city: 'Mopti',
        region: 'Mopti',
        phone: '+223 21 43 01 67',
        email: 'contact@hrmopti.ml',
        website: 'https://hrmopti.ml',
        established: '1978',
        bedCapacity: '140',
        population: '650000'
      },
      {
        name: 'Hôpital Régional de Tombouctou',
        city: 'Tombouctou',
        region: 'Tombouctou',
        phone: '+223 21 92 01 89',
        email: 'contact@hrtombouctou.ml',
        website: 'https://hrtombouctou.ml',
        established: '1980',
        bedCapacity: '120',
        population: '500000'
      },
      {
        name: 'Hôpital Régional de Gao',
        city: 'Gao',
        region: 'Gao',
        phone: '+223 21 82 01 34',
        email: 'contact@hrgao.ml',
        website: 'https://hrgao.ml',
        established: '1982',
        bedCapacity: '110',
        population: '450000'
      },
      {
        name: 'Hôpital Régional de Kayes',
        city: 'Kayes',
        region: 'Kayes',
        phone: '+223 21 52 01 56',
        email: 'contact@hrkayes.ml',
        website: 'https://hrkayes.ml',
        established: '1970',
        bedCapacity: '150',
        population: '800000'
      },
      {
        name: 'Hôpital Régional de Koulikoro',
        city: 'Koulikoro',
        region: 'Koulikoro',
        phone: '+223 21 26 01 78',
        email: 'contact@hrkoulikoro.ml',
        website: 'https://hrkoulikoro.ml',
        established: '1974',
        bedCapacity: '170',
        population: '900000'
      }
    ];

    const createdOrganizations: Organization[] = [];

    for (const hospital of regionalHospitals) {
      const organization: Organization = {
        resourceType: 'Organization',
        active: true,
        identifier: [
          {
            use: 'official',
            system: 'http://mali.gov/healthcare/organization-id',
            value: `HOSP-REG-${hospital.region.toUpperCase()}`,
            assigner: {
              display: 'Mali Ministry of Health'
            }
          },
          {
            use: 'secondary',
            system: 'http://mali.gov/healthcare/regional-code',
            value: hospital.region.substring(0, 3).toUpperCase(),
            period: {
              start: hospital.established
            }
          }
        ],
        type: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/organization-type',
                code: 'prov',
                display: 'Healthcare Provider'
              },
              {
                system: 'http://mali.gov/healthcare/organization-subtype',
                code: 'regional-hospital',
                display: 'Regional Hospital'
              }
            ],
            text: 'Regional Hospital'
          },
          {
            coding: [
              {
                system: 'http://hl7.org/fhir/organization-type',
                code: 'govt',
                display: 'Government'
              }
            ]
          }
        ],
        name: hospital.name,
        alias: [`HR ${hospital.region}`, `Regional Hospital ${hospital.city}`],
        telecom: [
          {
            system: 'phone',
            value: hospital.phone,
            use: 'work',
            rank: 1
          },
          {
            system: 'email',
            value: hospital.email,
            use: 'work',
            rank: 1
          },
          {
            system: 'url',
            value: hospital.website,
            use: 'work'
          }
        ],
        address: [
          {
            use: 'work',
            type: 'physical',
            text: `${hospital.city}, ${hospital.region} Region`,
            line: [`Centre Ville, ${hospital.city}`],
            city: hospital.city,
            district: `${hospital.region} Region`,
            state: hospital.region,
            postalCode: `BP ${Math.floor(Math.random() * 900) + 100}`,
            country: 'Mali',
            period: {
              start: hospital.established
            }
          }
        ],
        partOf: {
          reference: 'Organization/mali-ministry-of-health',
          display: 'Mali Ministry of Health'
        },
        contact: [
          {
            purpose: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/contactentity-type',
                  code: 'ADMIN',
                  display: 'Administrative'
                }
              ]
            },
            name: {
              use: 'official',
              family: 'Directeur',
              given: ['Régional'],
              text: 'Directeur Régional'
            },
            telecom: [
              {
                system: 'phone',
                value: hospital.phone,
                use: 'work'
              },
              {
                system: 'email',
                value: hospital.email,
                use: 'work'
              }
            ]
          }
        ],
        extension: [
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-capacity',
            valueInteger: parseInt(hospital.bedCapacity)
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-established',
            valueDate: hospital.established
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-catchment-population',
            valueInteger: parseInt(hospital.population)
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-level',
            valueString: 'Regional'
          }
        ]
      };

      const created = await this.medplum.createResource(organization);
      createdOrganizations.push(created);
      console.log(`✅ Created regional hospital: ${hospital.name}`);
    }

    return createdOrganizations;
  }

  private async createReferralCenters(): Promise<Organization[]> {
    const referralCenters = [
      {
        name: 'Centre de Santé de Référence de Commune I',
        city: 'Bamako',
        district: 'Commune I',
        phone: '+223 20 22 35 67',
        email: 'csref1@bamako.ml',
        website: 'https://csref1.bamako.ml',
        established: '1985',
        population: '120000',
        level: 'District'
      },
      {
        name: 'Centre de Santé de Référence de Commune II',
        city: 'Bamako',
        district: 'Commune II',
        phone: '+223 20 22 46 78',
        email: 'csref2@bamako.ml',
        website: 'https://csref2.bamako.ml',
        established: '1987',
        population: '180000',
        level: 'District'
      },
      {
        name: 'Centre de Santé de Référence de Commune III',
        city: 'Bamako',
        district: 'Commune III',
        phone: '+223 20 22 57 89',
        email: 'csref3@bamako.ml',
        website: 'https://csref3.bamako.ml',
        established: '1986',
        population: '200000',
        level: 'District'
      },
      {
        name: 'Centre de Santé de Référence de Commune IV',
        city: 'Bamako',
        district: 'Commune IV',
        phone: '+223 20 22 68 90',
        email: 'csref4@bamako.ml',
        website: 'https://csref4.bamako.ml',
        established: '1988',
        population: '300000',
        level: 'District'
      },
      {
        name: 'Centre de Santé de Référence de Commune V',
        city: 'Bamako',
        district: 'Commune V',
        phone: '+223 20 22 79 01',
        email: 'csref5@bamako.ml',
        website: 'https://csref5.bamako.ml',
        established: '1989',
        population: '350000',
        level: 'District'
      },
      {
        name: 'Centre de Santé de Référence de Commune VI',
        city: 'Bamako',
        district: 'Commune VI',
        phone: '+223 20 22 80 12',
        email: 'csref6@bamako.ml',
        website: 'https://csref6.bamako.ml',
        established: '1990',
        population: '400000',
        level: 'District'
      },
      {
        name: 'Centre de Santé de Référence de Koutiala',
        city: 'Koutiala',
        district: 'Koutiala',
        phone: '+223 21 64 23 45',
        email: 'csref@koutiala.ml',
        website: 'https://csref.koutiala.ml',
        established: '1983',
        population: '250000',
        level: 'District'
      },
      {
        name: 'Centre de Santé de Référence de Bougouni',
        city: 'Bougouni',
        district: 'Bougouni',
        phone: '+223 21 65 34 56',
        email: 'csref@bougouni.ml',
        website: 'https://csref.bougouni.ml',
        established: '1984',
        population: '180000',
        level: 'District'
      }
    ];

    const createdOrganizations: Organization[] = [];

    for (const center of referralCenters) {
      const organization: Organization = {
        resourceType: 'Organization',
        active: true,
        identifier: [
          {
            use: 'official',
            system: 'http://mali.gov/healthcare/organization-id',
            value: `CSREF-${center.district.replace(/\\s+/g, '-').toUpperCase()}`,
            assigner: {
              display: 'Mali Ministry of Health'
            }
          },
          {
            use: 'secondary',
            system: 'http://mali.gov/healthcare/license',
            value: `CSREF-LIC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            period: {
              start: center.established,
              end: '2030-12-31'
            }
          }
        ],
        type: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/organization-type',
                code: 'prov',
                display: 'Healthcare Provider'
              },
              {
                system: 'http://mali.gov/healthcare/organization-subtype',
                code: 'csref',
                display: 'Centre de Santé de Référence'
              }
            ],
            text: 'Referral Health Center'
          }
        ],
        name: center.name,
        alias: [`CSRef ${center.district}`, `Referral Center ${center.district}`],
        telecom: [
          {
            system: 'phone',
            value: center.phone,
            use: 'work',
            rank: 1
          },
          {
            system: 'email',
            value: center.email,
            use: 'work',
            rank: 1
          },
          {
            system: 'url',
            value: center.website,
            use: 'work'
          }
        ],
        address: [
          {
            use: 'work',
            type: 'physical',
            text: `${center.district}, ${center.city}`,
            line: [`Centre de ${center.district}`],
            city: center.city,
            district: center.district,
            state: center.city === 'Bamako' ? 'Bamako' : 'Sikasso',
            postalCode: `BP ${Math.floor(Math.random() * 900) + 100}`,
            country: 'Mali',
            period: {
              start: center.established
            }
          }
        ],
        partOf: center.city === 'Bamako' ? {
          reference: 'Organization/bamako-health-district',
          display: 'Bamako Health District'
        } : {
          reference: `Organization/${center.city.toLowerCase()}-health-district`,
          display: `${center.city} Health District`
        },
        contact: [
          {
            purpose: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/contactentity-type',
                  code: 'ADMIN',
                  display: 'Administrative'
                }
              ]
            },
            name: {
              use: 'official',
              family: 'Médecin',
              given: ['Chef'],
              text: 'Médecin Chef'
            },
            telecom: [
              {
                system: 'phone',
                value: center.phone,
                use: 'work'
              },
              {
                system: 'email',
                value: center.email,
                use: 'work'
              }
            ]
          },
          {
            purpose: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/contactentity-type',
                  code: 'BILL',
                  display: 'Billing'
                }
              ]
            },
            name: {
              text: 'Service Comptabilité'
            },
            telecom: [
              {
                system: 'email',
                value: `comptabilite@${center.email.split('@')[1]}`,
                use: 'work'
              }
            ]
          }
        ],
        extension: [
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-established',
            valueDate: center.established
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-catchment-population',
            valueInteger: parseInt(center.population)
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-level',
            valueString: center.level
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-services',
            extension: [
              {
                url: 'service',
                valueString: 'Primary Care'
              },
              {
                url: 'service',
                valueString: 'Emergency Services'
              },
              {
                url: 'service',
                valueString: 'Maternal Health'
              },
              {
                url: 'service',
                valueString: 'Pediatric Care'
              },
              {
                url: 'service',
                valueString: 'Laboratory Services'
              }
            ]
          }
        ]
      };

      const created = await this.medplum.createResource(organization);
      createdOrganizations.push(created);
      console.log(`✅ Created referral center: ${center.name}`);
    }

    return createdOrganizations;
  }

  private async createCommunityHealthCenters(): Promise<Organization[]> {
    const communityHealthCenters = [
      {
        name: 'Centre de Santé Communautaire de Banconi',
        community: 'Banconi',
        city: 'Bamako',
        phone: '+223 66 12 34 56',
        email: 'cscom.banconi@bamako.ml',
        type: 'cscom',
        established: '1992',
        population: '25000',
        services: ['Primary Care', 'Vaccination', 'Maternal Health']
      },
      {
        name: 'Centre de Santé Communautaire de Magnambougou',
        community: 'Magnambougou',
        city: 'Bamako',
        phone: '+223 66 23 45 67',
        email: 'cscom.magnambougou@bamako.ml',
        type: 'cscom',
        established: '1993',
        population: '30000',
        services: ['Primary Care', 'Child Health', 'Family Planning']
      },
      {
        name: 'Centre de Santé Communautaire de Sabalibougou',
        community: 'Sabalibougou',
        city: 'Bamako',
        phone: '+223 66 34 56 78',
        email: 'cscom.sabalibougou@bamako.ml',
        type: 'cscom',
        established: '1994',
        population: '22000',
        services: ['Primary Care', 'Nutrition', 'Health Education']
      },
      {
        name: 'Centre de Santé Communautaire de Kalaban Coro',
        community: 'Kalaban Coro',
        city: 'Bamako',
        phone: '+223 66 45 67 89',
        email: 'cscom.kalaban@bamako.ml',
        type: 'cscom',
        established: '1995',
        population: '18000',
        services: ['Primary Care', 'Vaccination', 'TB Screening']
      },
      {
        name: 'Centre de Santé Communautaire de Djelibougou',
        community: 'Djelibougou',
        city: 'Bamako',
        phone: '+223 66 56 78 90',
        email: 'cscom.djelibougou@bamako.ml',
        type: 'cscom',
        established: '1991',
        population: '28000',
        services: ['Primary Care', 'Mental Health', 'Chronic Disease']
      },
      {
        name: 'Centre de Santé Communautaire de Badalabougou',
        community: 'Badalabougou',
        city: 'Bamako',
        phone: '+223 66 67 89 01',
        email: 'cscom.badalabougou@bamako.ml',
        type: 'cscom',
        established: '1996',
        population: '32000',
        services: ['Primary Care', 'Emergency Care', 'Laboratory']
      },
      {
        name: 'Centre de Santé Communautaire de Medina Coura',
        community: 'Medina Coura',
        city: 'Bamako',
        phone: '+223 66 78 90 12',
        email: 'cscom.medina@bamako.ml',
        type: 'cscom',
        established: '1990',
        population: '20000',
        services: ['Primary Care', 'Elderly Care', 'Diabetes Management']
      },
      {
        name: 'Centre de Santé Communautaire de Lafiabougou',
        community: 'Lafiabougou',
        city: 'Bamako',
        phone: '+223 66 89 01 23',
        email: 'cscom.lafiabougou@bamako.ml',
        type: 'cscom',
        established: '1997',
        population: '26000',
        services: ['Primary Care', 'Maternal Health', 'Nutrition']
      },
      {
        name: 'Centre de Santé Communautaire de Sikoro',
        community: 'Sikoro',
        city: 'Bamako',
        phone: '+223 66 90 12 34',
        email: 'cscom.sikoro@bamako.ml',
        type: 'cscom',
        established: '1998',
        population: '35000',
        services: ['Primary Care', 'HIV Testing', 'Community Outreach']
      },
      {
        name: 'Centre de Santé Communautaire de Faladiè',
        community: 'Faladiè',
        city: 'Bamako',
        phone: '+223 66 01 23 45',
        email: 'cscom.faladie@bamako.ml',
        type: 'cscom',
        established: '1999',
        population: '24000',
        services: ['Primary Care', 'Vaccination', 'Health Promotion']
      },
      {
        name: 'Centre de Santé Communautaire de Yanfolila',
        community: 'Yanfolila',
        city: 'Yanfolila',
        phone: '+223 67 12 34 56',
        email: 'cscom.yanfolila@sikasso.ml',
        type: 'cscom',
        established: '1985',
        population: '15000',
        services: ['Primary Care', 'Malaria Treatment', 'Rural Health']
      },
      {
        name: 'Centre de Santé Communautaire de Kolondiéba',
        community: 'Kolondiéba',
        city: 'Kolondiéba',
        phone: '+223 67 23 45 67',
        email: 'cscom.kolondieba@sikasso.ml',
        type: 'cscom',
        established: '1987',
        population: '12000',
        services: ['Primary Care', 'Agricultural Health', 'Water Sanitation']
      }
    ];

    const createdOrganizations: Organization[] = [];

    for (const center of communityHealthCenters) {
      const organization: Organization = {
        resourceType: 'Organization',
        active: true,
        identifier: [
          {
            use: 'official',
            system: 'http://mali.gov/healthcare/organization-id',
            value: `CSCOM-${center.community.replace(/\s+/g, '-').toUpperCase()}`,
            assigner: {
              display: 'Mali Ministry of Health'
            }
          },
          {
            use: 'secondary',
            system: 'http://mali.gov/healthcare/community-code',
            value: center.community.substring(0, 4).toUpperCase() + Math.floor(Math.random() * 100),
            period: {
              start: center.established
            }
          }
        ],
        type: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/organization-type',
                code: 'prov',
                display: 'Healthcare Provider'
              },
              {
                system: 'http://mali.gov/healthcare/organization-subtype',
                code: 'cscom',
                display: 'Centre de Santé Communautaire'
              }
            ],
            text: 'Community Health Center'
          },
          {
            coding: [
              {
                system: 'http://hl7.org/fhir/organization-type',
                code: 'comm',
                display: 'Community'
              }
            ]
          }
        ],
        name: center.name,
        alias: [`CSCom ${center.community}`, `Community Health Center ${center.community}`],
        telecom: [
          {
            system: 'phone',
            value: center.phone,
            use: 'work',
            rank: 1
          },
          {
            system: 'email',
            value: center.email,
            use: 'work',
            rank: 1
          }
        ],
        address: [
          {
            use: 'work',
            type: 'physical',
            text: `${center.community}, ${center.city}`,
            line: [`Quartier ${center.community}`],
            city: center.city,
            district: center.community,
            state: center.city === 'Bamako' ? 'Bamako' : 'Sikasso',
            postalCode: `BP ${Math.floor(Math.random() * 900) + 100}`,
            country: 'Mali',
            period: {
              start: center.established
            }
          }
        ],
        partOf: center.city === 'Bamako' ? {
          reference: 'Organization/bamako-health-district',
          display: 'Bamako Health District'
        } : {
          reference: 'Organization/sikasso-health-district',
          display: 'Sikasso Health District'
        },
        contact: [
          {
            purpose: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/contactentity-type',
                  code: 'ADMIN',
                  display: 'Administrative'
                }
              ]
            },
            name: {
              use: 'official',
              family: 'Infirmier',
              given: ['Chef'],
              text: 'Infirmier Chef de Poste'
            },
            telecom: [
              {
                system: 'phone',
                value: center.phone,
                use: 'work'
              },
              {
                system: 'email',
                value: center.email,
                use: 'work'
              }
            ]
          },
          {
            purpose: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/contactentity-type',
                  code: 'CCP',
                  display: 'Community Care Provider'
                }
              ]
            },
            name: {
              text: 'Agent de Santé Communautaire'
            },
            telecom: [
              {
                system: 'phone',
                value: center.phone,
                use: 'work'
              }
            ]
          }
        ],
        endpoint: [
          {
            reference: `Endpoint/endpoint-${center.community.replace(/\s+/g, '-').toLowerCase()}`,
            display: `${center.name}`
          }
        ],
        extension: [
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-established',
            valueDate: center.established
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-catchment-population',
            valueInteger: parseInt(center.population)
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-level',
            valueString: 'Community'
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-services',
            extension: center.services.map(service => ({
              url: 'service',
              valueString: service
            }))
          },
          {
            url: 'http://mali.gov/fhir/StructureDefinition/organization-operating-hours',
            extension: [
              {
                url: 'monday',
                valueString: '08:00-17:00'
              },
              {
                url: 'tuesday',
                valueString: '08:00-17:00'
              },
              {
                url: 'wednesday',
                valueString: '08:00-17:00'
              },
              {
                url: 'thursday',
                valueString: '08:00-17:00'
              },
              {
                url: 'friday',
                valueString: '08:00-17:00'
              },
              {
                url: 'saturday',
                valueString: '08:00-12:00'
              }
            ]
          }
        ]
      };

      const created = await this.medplum.createResource(organization);
      createdOrganizations.push(created);
      console.log(`✅ Created community health center: ${center.name}`);
    }

    return createdOrganizations;
  }
}

export async function seedOrganizationsWithAuth(
  medplum: MedplumClient,
  options?: {
    token?: string;
    useStoredAuth?: boolean;
    email?: string;
    password?: string;
  }
): Promise<{
  nationalHospitals: Organization[];
  regionalHospitals: Organization[];
  referralCenters: Organization[];
  communityHealthCenters: Organization[];
  allOrganizations: Organization[];
}> {
  const seeder = new OrganizationDataSeeder(medplum);

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

    return await seeder.seedOrganizations();

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
