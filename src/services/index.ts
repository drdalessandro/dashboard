// src/services/index.ts

// Export models
export * from './models';

// Export base interfaces
export * from './interfaces/IBaseDataService';

// Export specific interfaces
export * from './interfaces/IPatientDataService';
export * from './interfaces/IPractitionerDataService';
export * from './interfaces/IPrescriptionDataService';

// Export base service
export * from './implementations/BaseDataService';

// Export implementations
export * from './implementations/PatientDataService';
export * from './implementations/PractitionerDataService';
export * from './implementations/PrescriptionDataService';

// Export service factory
export * from './serviceFactory';