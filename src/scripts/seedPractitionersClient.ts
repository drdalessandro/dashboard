/**
 * Client-side script to seed practitioners into the database
 * Run this in the browser console or as a page component
 */

import { PractitionerDataService } from '../services/implementations/PractitionerDataService';
import { Practitioner } from '@medplum/fhirtypes';

// Dummy practitioners data
export const dummyPractitioners: Partial<Practitioner>[] = [
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
    qualification: [{
      code: { 
        coding: [{ display: 'MD' }], 
        text: 'Doctor of Medicine - General Practice' 
      },
      issuer: { display: 'University of Bamako' },
      period: { start: '2015-06-01' }
    }],
    telecom: [
      { system: 'phone', value: '+223 76 54 32 10', use: 'work' },
      { system: 'email', value: 'aminata.diallo@healthplatform.ml', use: 'work' }
    ],
    address: [{ 
      use: 'work',
      city: 'Bamako', 
      country: 'Mali',
      line: ['123 Medical Center Road']
    }]
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
          coding: [{ display: 'MD' }], 
          text: 'Doctor of Medicine - Cardiology' 
        },
        issuer: { display: 'University of Dakar' },
        period: { start: '2012-07-01' }
      },
      {
        code: { 
          coding: [{ display: 'PhD' }], 
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
    qualification: [{
      code: { 
        coding: [{ display: 'MD' }], 
        text: 'Doctor of Medicine - Pediatrics' 
      },
      issuer: { display: 'University of Bamako' },
      period: { start: '2018-06-15' }
    }],
    telecom: [
      { system: 'phone', value: '+223 78 90 12 34', use: 'work' },
      { system: 'email', value: 'mariam.coulibaly@healthplatform.ml', use: 'work' }
    ],
    address: [{
      use: 'work',
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
          coding: [{ display: 'MD' }], 
          text: 'Doctor of Medicine - Surgery' 
        },
        issuer: { display: 'University of Cape Town' },
        period: { start: '2010-05-20' }
      },
      {
        code: { 
          coding: [{ display: 'FACS' }], 
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
    qualification: [{
      code: { 
        coding: [{ display: 'MD' }], 
        text: 'Doctor of Medicine - Dermatology' 
      },
      issuer: { display: 'University of Dakar' },
      period: { start: '2014-07-10' }
    }],
    telecom: [
      { system: 'phone', value: '+223 89 01 23 45', use: 'work' },
      { system: 'email', value: 'fatoumata.toure@healthplatform.ml', use: 'work' }
    ],
    address: [{
      use: 'work',
      city: 'Bamako',
      country: 'Mali',
      line: ['567 Skin Care Clinic Road']
    }]
  }
];

export async function seedPractitionersClient() {
  const service = new PractitionerDataService();
  const results = [];

  for (const practitioner of dummyPractitioners) {
    try {
      const created = await service.create(practitioner);
      results.push({ success: true, id: created.id });
    } catch (error) {
      results.push({ success: false, error });
    }
  }

  return results;
}