// src/services/interfaces/IPractitionerDataService.ts
import { Practitioner, CodeableConcept, PractitionerQualification, Address, ContactPoint } from '@medplum/fhirtypes';
import { IBaseDataService } from './IBaseDataService';

// Define ProcessedPractitioner type 
export interface ProcessedPractitioner {
    id: string;
    name: string;
    gender?: Practitioner['gender'];
    qualification: PractitionerQualification[];
    communication?: Practitioner['communication'];
    telecom?: Practitioner['telecom'];
    address?: Practitioner['address'];
    syncStatus: 'synced' | 'pending' | 'error';
}

/**
 * Interface for Practitioner-specific data operations
 */
export interface IPractitionerDataService extends IBaseDataService<Practitioner> {
    /**
     * Get a list of practitioners with processed format for UI
     */
    getPractitioners(): Promise<{
        data: ProcessedPractitioner[];
        isOffline: boolean;
    }>;

    /**
     * Get a single practitioner by ID in processed format
     */
    getPractitionerById(id: string): Promise<ProcessedPractitioner | null>;

    /**
     * Process raw FHIR practitioner resources into a format suitable for the UI
     */
    processPractitionerResources(resources: any[]): ProcessedPractitioner[];

    /**
     * Get practitioner name from FHIR Practitioner resource
     */
    getPractitionerName(practitioner: Practitioner): string;

    /**
     * Get contact details from FHIR Practitioner resource
     */
    getPractitionerContactDetails(practitioner: Practitioner): string;

    /**
     * Store practitioners in local storage for offline access
     */
    cachePractitioners(practitioners: ProcessedPractitioner[]): void;

    /**
     * Retrieve cached practitioners from local storage
     */
    getCachedPractitioners(): ProcessedPractitioner[];

    /**
     * Search practitioners by name or identifier
     */
    searchPractitioners(searchTerm: string): Promise<ProcessedPractitioner[]>;

    /**
     * Get active practitioners (those with active status)
     */
    getActivePractitioners(): Promise<ProcessedPractitioner[]>;
}
