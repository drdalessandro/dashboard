/**
 * Script to seed dummy practitioners data into the database
 * This will insert the practitioners using the Medplum client
 */

import { Practitioner } from '@medplum/fhirtypes';
import { medplumClient } from '../lib/medplum/client';


// Initialize Medplum client
const medplum = medplumClient;

// Dummy practitioners data in FHIR format
const dummyPractitioners: Partial<Practitioner>[] = [
  {
    resourceType: 'Practitioner',
    active: true,
    name: [{
      given: ['Aminata'],
      family: 'Diallo',
      prefix: ['Dr.']
    }],
    gender: 'female',
    birthDate: '1990-05-15',
    qualification: [
      {
        code: {
          coding: [{
            display: 'MD',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0360'
          }],
          text: 'Doctor of Medicine'
        },
        issuer: { display: 'University of Bamako' },
        period: { start: '2015-06-01' }
      }
    ],
    telecom: [
      { system: 'phone', value: '+223 76 54 32 10', use: 'work' },
      { system: 'email', value: 'aminata.diallo@healthplatform.ml', use: 'work' }
    ],
    address: [{
      use: 'work',
      type: 'both',
      city: 'Bamako',
      country: 'Mali',
      line: ['123 Medical Center Road']
    }],
    photo: [{
      contentType: 'image/jpeg',
      data: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigD//2Q=='
    }],
    communication: [{
      coding: [{
        system: 'urn:ietf:bcp:47',
        code: 'fr',
        display: 'French'
      }],
      text: 'French'
    }
    ]
  },
  {
    resourceType: 'Practitioner',
    active: true,
    name: [{
      given: ['Ibrahim'],
      family: 'Sow',
      prefix: ['Dr.']
    }],
    gender: 'male',
    birthDate: '1985-03-20',
    qualification: [
      {
        code: {
          coding: [{
            display: 'MD',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0360'
          }],
          text: 'Doctor of Medicine - Cardiology'
        },
        issuer: { display: 'University of Dakar' },
        period: { start: '2012-07-01' }
      },
      {
        code: {
          coding: [{
            display: 'PhD',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0360'
          }],
          text: 'Doctor of Philosophy - Cardiovascular Medicine'
        },
        issuer: { display: 'University of Dakar' },
        period: { start: '2016-09-01' }
      }
    ],
    telecom: [
      { system: 'phone', value: '+223 65 43 21 09', use: 'work' },
      { system: 'email', value: 'ibrahim.sow@healthplatform.ml', use: 'work' }
    ],
    address: [{
      use: 'work',
      type: 'both',
      city: 'Bamako',
      country: 'Mali',
      line: ['456 Heart Center Avenue']
    }]
  },
  {
    resourceType: 'Practitioner',
    active: true,
    name: [{
      given: ['Mariam'],
      family: 'Coulibaly',
      prefix: ['Dr.']
    }],
    gender: 'female',
    birthDate: '1992-11-05',
    qualification: [
      {
        code: {
          coding: [{
            display: 'MD',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0360'
          }],
          text: 'Doctor of Medicine - Pediatrics'
        },
        issuer: { display: 'University of Bamako' },
        period: { start: '2018-06-15' }
      }
    ],
    telecom: [
      { system: 'phone', value: '+223 78 90 12 34', use: 'work' },
      { system: 'email', value: 'mariam.coulibaly@healthplatform.ml', use: 'work' }
    ],
    address: [{
      use: 'work',
      type: 'both',
      city: 'Bamako',
      country: 'Mali',
      line: ['789 Children\'s Hospital Street']
    }]
  },
  {
    resourceType: 'Practitioner',
    active: false,
    name: [{
      given: ['Modibo'],
      family: 'Keita',
      prefix: ['Dr.']
    }],
    gender: 'male',
    birthDate: '1980-08-30',
    qualification: [
      {
        code: {
          coding: [{
            display: 'MD',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0360'
          }],
          text: 'Doctor of Medicine - Surgery'
        },
        issuer: { display: 'University of Cape Town' },
        period: { start: '2010-05-20' }
      },
      {
        code: {
          coding: [{
            display: 'FACS',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0360'
          }],
          text: 'Fellow of the American College of Surgeons'
        },
        issuer: { display: 'American College of Surgeons' },
        period: { start: '2015-10-01' }
      }
    ],
    telecom: [
      { system: 'phone', value: '+223 67 89 01 23', use: 'work' },
      { system: 'email', value: 'modibo.keita@healthplatform.ml', use: 'work' }
    ],
    address: [{
      use: 'work',
      type: 'both',
      city: 'Sikasso',
      country: 'Mali',
      line: ['321 Surgical Center Boulevard']
    }]
  },
  {
    resourceType: 'Practitioner',
    active: true,
    name: [{
      given: ['Fatoumata'],
      family: 'Toure',
      prefix: ['Dr.']
    }],
    gender: 'female',
    birthDate: '1988-04-12',
    qualification: [
      {
        code: {
          coding: [{
            display: 'MD',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0360'
          }],
          text: 'Doctor of Medicine - Dermatology'
        },
        issuer: { display: 'University of Dakar' },
        period: { start: '2014-07-10' }
      }
    ],
    telecom: [
      { system: 'phone', value: '+223 89 01 23 45', use: 'work' },
      { system: 'email', value: 'fatoumata.toure@healthplatform.ml', use: 'work' }
    ],
    address: [{
      use: 'work',
      type: 'both',
      city: 'Bamako',
      country: 'Mali',
      line: ['567 Skin Care Clinic Road']
    }]
  },
  {
    resourceType: 'Practitioner',
    active: true,
    name: [{
      given: ['Oumar'],
      family: 'Traore',
      prefix: ['Dr.']
    }],
    gender: 'male',
    birthDate: '1983-07-22',
    qualification: [
      {
        code: {
          coding: [{
            display: 'MD',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0360'
          }],
          text: 'Doctor of Medicine - Obstetrics and Gynecology'
        },
        issuer: { display: 'University of Bamako' },
        period: { start: '2013-08-30' }
      }
    ],
    telecom: [
      { system: 'phone', value: '+223 90 12 34 56', use: 'work' },
      { system: 'email', value: 'oumar.traore@healthplatform.ml', use: 'work' }
    ],
    address: [{
      use: 'work',
      type: 'both',
      city: 'Mopti',
      country: 'Mali',
      line: ['890 Women\'s Health Center']
    }]
  },
  {
    resourceType: 'Practitioner',
    active: true,
    name: [{
      given: ['Kadiatou'],
      family: 'Sidibe',
      prefix: ['Dr.']
    }],
    gender: 'female',
    birthDate: '1991-02-14',
    qualification: [
      {
        code: {
          coding: [{
            display: 'MD',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0360'
          }],
          text: 'Doctor of Medicine - General Practice'
        },
        issuer: { display: 'University of Bamako' },
        period: { start: '2019-01-15' }
      }
    ],
    telecom: [
      { system: 'phone', value: '+223 76 12 34 56', use: 'work' },
      { system: 'email', value: 'kadiatou.sidibe@healthplatform.ml', use: 'work' }
    ],
    address: [{
      use: 'work',
      type: 'both',
      city: 'Bamako',
      country: 'Mali',
      line: ['234 Family Medicine Plaza']
    }]
  },
  {
    resourceType: 'Practitioner',
    active: true,
    name: [{
      given: ['Mamadou'],
      family: 'Sangare',
      prefix: ['Dr.']
    }],
    gender: 'male',
    birthDate: '1987-09-10',
    qualification: [
      {
        code: {
          coding: [{
            display: 'MD',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0360'
          }],
          text: 'Doctor of Medicine - Internal Medicine'
        },
        issuer: { display: 'University of Bamako' },
        period: { start: '2015-03-20' }
      }
    ],
    telecom: [
      { system: 'phone', value: '+223 65 98 76 54', use: 'work' },
      { system: 'email', value: 'mamadou.sangare@healthplatform.ml', use: 'work' }
    ],
    address: [{
      use: 'work',
      type: 'both',
      city: 'Bamako',
      country: 'Mali',
      line: ['678 Internal Medicine Department']
    }]
  }
];

/**
 * Seed practitioners into the database
 */
export async function seedPractitioners() {
  console.log('Starting to seed practitioners...');

  let successCount = 0;
  let errorCount = 0;

  const results = {
    created: 0,
    failed: 0,
    total: dummyPractitioners.length,
    errors: [] as Array<{ practitioner: any, error: string }>
  };

  for (const practitioner of dummyPractitioners) {
    try {
      const name = practitioner.name?.[0];
      const fullName = `${name?.prefix?.join(' ') || ''} ${name?.given?.join(' ') || ''} ${name?.family || ''}`.trim();

      console.log(`Creating practitioner: ${fullName}`);

      // const created = await practitionerService.create(practitioner);
      const created = await medplum?.createResource({
        resourceType: 'Practitioner',
        ...practitioner
      });

      if (!created) {
        throw new Error('Failed to create practitioner');
      }

      results.created++;
      console.log(`✓ Successfully created practitioner: ${fullName} (ID: ${created.id})`);
      successCount++;
    } catch (error) {
      console.error(`✗ Error creating practitioner:`, error);
      errorCount++;
      results.failed++;
      results.errors.push({ practitioner, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  console.log(`\nSeeding complete!`);
  console.log(`Successfully created: ${successCount} practitioners`);
  console.log(`Errors: ${errorCount}`);

  return results;
}

// Run the seeding if this script is executed directly
// Check if this is the main module (ESM compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPractitioners()
    .then(({ created, failed, total, errors }) => {
      console.log(`\nSeeding complete!`);
      console.log(`Successfully created: ${created} practitioners`);
      console.log(`Errors: ${failed}`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error during seeding:', error);
      process.exit(1);
    });
}
