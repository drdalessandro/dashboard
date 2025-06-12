// Seeding services index file
// File: src/services/seeding/index.ts

// Export the main clinical seeding class and enhanced functions
export { 
  PatientClinicalDataSeeder, 
  seedPatientClinicalDataWithAuth
} from './PatientClinicalDataSeeder';

// Export the React integration with enhanced authentication for clinical data
export { 
  usePatientClinicalSeeder, 
  PatientDataSeedingButton, 
  usePatientClinicalData, 
  runPatientSeeding,
  getStoredAuthToken,
  isUserAuthenticated
} from './PatientClinicalSeeder';

// Export the vitals seeding class and enhanced functions
export { 
  PatientVitalsDataSeeder, 
  seedPatientVitalsWithAuth
} from './PatientVitalsDataSeeder';

// Export the React integration with enhanced authentication for vitals data
export { 
  usePatientVitalsSeeder, 
  PatientVitalsSeedingButton, 
  usePatientVitalsData, 
  usePatientVitals
} from './PatientVitalsSeeder';

// Export the encounter seeding class and enhanced functions
export { 
  PatientEncounterDataSeeder, 
  seedPatientEncountersWithAuth
} from './PatientEncounterDataSeeder';

// Export the React integration with enhanced authentication for encounter data
export { 
  usePatientEncounterSeeder, 
  PatientEncounterSeedingButton
} from './PatientEncounterSeeder';

// Export Node.js utilities for encounter seeding
export { 
  runPatientEncounterSeeding,
  getStoredAuthToken,
  isUserAuthenticated
} from './PatientEncounterUtils';

// Export Node.js utilities for vitals seeding
export { 
  runPatientVitalsSeeding,
  getStoredAuthToken,
  isUserAuthenticated
} from './PatientVitalsUtils';

// Export the organization seeding class and enhanced functions
export { 
  OrganizationDataSeeder, 
  seedOrganizationsWithAuth
} from './OrganizationDataSeeder';

// Export the React integration with enhanced authentication for organization data
export { 
  useOrganizationSeeder, 
  OrganizationSeedingButton, 
  useOrganizationsData, 
  useHealthcareOrganizations
} from './OrganizationSeeder';

// Export Node.js utilities for organization seeding
export { 
  runOrganizationSeeding,
  verifyOrganizationSeeding
} from './OrganizationUtils';

// Export types for convenience
export type { 
  AllergyIntolerance, 
  Immunization, 
  Condition, 
  MedicationRequest, 
  Observation,
  Encounter,
  Patient,
  Organization
} from '@medplum/fhirtypes';
