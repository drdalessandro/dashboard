// src/services/interfaces/IPatientDataService.ts
import { Patient } from '@medplum/fhirtypes';
import { IBaseDataService } from './IBaseDataService';

// Define ProcessedPatient type if it doesn't already exist elsewhere
export interface ProcessedPatient {
    id: string;
    name: string;
    gender: "male" | "female" | "other" | "unknown" | undefined;
    birthDate?: string;
    contactDetails: string;
    syncStatus: 'synced' | 'pending' | 'error';
}

/**
 * Interface for Patient-specific data operations
 */
export interface IPatientDataService extends IBaseDataService<Patient> {
    /**
     * Get a list of patients with processed format for UI
     */
    getPatients(): Promise<{
        data: ProcessedPatient[];
        isOffline: boolean;
    }>;

    /**
     * Get a single patient by ID in processed format
     */
    getPatientById(id: string): Promise<ProcessedPatient | null>;

    /**
     * Process raw FHIR patient resources into a format suitable for the UI
     */
    processPatientResources(resources: any[]): ProcessedPatient[];

    /**
     * Get patient name from FHIR Patient resource
     */
    getPatientName(patient: Patient): string;

    /**
     * Get contact details from FHIR Patient resource
     */
    getPatientContactDetails(patient: Patient): string;

    /**
     * Store patients in local storage for offline access
     */
    cachePatients(patients: ProcessedPatient[]): void;

    /**
     * Retrieve cached patients from local storage
     */
    getCachedPatients(): ProcessedPatient[];

    /**
     * Search patients by name or identifier
     */
    searchPatients(searchTerm: string): Promise<ProcessedPatient[]>;

    /**
     * Get active patients (those with active status)
     */
    getActivePatients(): Promise<ProcessedPatient[]>;
}