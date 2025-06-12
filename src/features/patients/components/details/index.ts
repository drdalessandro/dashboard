/**
 * Patient Details Components
 * Export all patient details components for easy imports
 * Enhanced with Full FHIR Patient Resource Display Components
 */

// Original components
export { default as Sidebar } from './Sidebar';
export { default as PatientDetailsLayout } from './PatientDetailsLayout';
export { default as PatientHeader } from './PatientHeader';
export { default as PatientVitals } from './PatientVitals';
export { default as PatientHistory } from './PatientHistory';
export { default as PatientMedicalHistory } from './PatientMedicalHistory';
export { default as PatientAllergies } from './PatientAllergies';
export { default as PatientMedications } from './PatientMedications';

// Enhanced FHIR display components
export { default as PatientDeceasedInfo } from './PatientDeceasedInfo';
export { default as PatientTelecomInfo } from './PatientTelecomInfo';
export { default as PatientPhotoDisplay } from './PatientPhotoDisplay';
export { default as PatientContacts } from './PatientContacts';
export { default as PatientCareTeam } from './PatientCareTeam';
export { default as PatientMaritalStatus } from './PatientMaritalStatus';
export { default as PatientCommunication } from './PatientCommunication';
export { default as PatientLinks } from './PatientLinks';