// src/services/implementations/PatientDataService.ts
import { Patient } from '@medplum/fhirtypes';
import { BaseDataService } from './BaseDataService';
import { IPatientDataService, ProcessedPatient } from '../interfaces/IPatientDataService';
import { FilterParams } from '../models';
import { DataServiceConfig } from '../interfaces/IBaseDataService';

/**
 * Implementation of IPatientDataService for handling patient data operations
 */
export class PatientDataService extends BaseDataService<Patient> implements IPatientDataService {

    constructor(config?: Partial<DataServiceConfig>) {
        super(config);
    }

    /**
     * Get the default resource type for this service
     */
    protected getDefaultResourceType(): string {
        return 'Patient';
    }

    /**
     * Fetch a list of patients from the FHIR server
     * Includes offline fallback capabilities
     */
    async getPatients(): Promise<{
        data: ProcessedPatient[];
        isOffline: boolean;
    }> {
        try {
            this.logger.debug('Fetching patients list');
            const response = await this.getList({}, { pageSize: 25 });

            // Process the patient resources
            const processedPatients = this.processPatientResources(response.data);

            // Cache for offline use
            this.cachePatients(processedPatients);

            return {
                data: processedPatients,
                isOffline: false
            };
        } catch (error) {
            this.logger.error("Error fetching patients:", error);

            // Try to get cached data
            const cachedPatients = this.getCachedPatients();

            return {
                data: cachedPatients,
                isOffline: true
            };
        }
    }

    /**
     * Get a single patient by ID in processed format
     */
    async getPatientById(id: string): Promise<ProcessedPatient | null> {
        try {
            this.logger.debug(`Fetching patient with ID: ${id}`);
            const patient = await this.getOne(id);

            if (!patient) {
                return null;
            }

            return {
                id: patient.id || '',
                name: this.getPatientName(patient),
                gender: patient.gender,
                birthDate: patient.birthDate,
                contactDetails: this.getPatientContactDetails(patient),
                syncStatus: "synced" as const,
            };
        } catch (error) {
            this.logger.error(`Error fetching patient ${id}:`, error);

            // Try to get from cache
            const cachedPatients = this.getCachedPatients();
            return cachedPatients.find(p => p.id === id) || null;
        }
    }

    /**
     * Process raw FHIR patient resources into a format suitable for the UI
     */
    processPatientResources(resources: any[]): ProcessedPatient[] {
        // Use flatMap to both transform and filter in one operation
        return resources
            .flatMap((resource: any): ProcessedPatient[] => {
                // Skip invalid resources
                if (!resource || resource.resourceType !== 'Patient') {
                    return [];
                }

                const patient = resource as Patient;
                return [{
                    id: patient.id || '',  // Ensure id is never undefined
                    name: this.getPatientName(patient),
                    gender: patient.gender,
                    birthDate: patient.birthDate,
                    contactDetails: this.getPatientContactDetails(patient),
                    syncStatus: "synced" as const,
                }];
            });
    }

    /**
     * Get patient name from FHIR Patient resource
     */
    getPatientName(patient: Patient): string {
        if (patient.name && patient.name.length > 0) {
            const name = patient.name[0];
            return `${name.given?.join(' ') || ''} ${name.family || ''}`.trim() || 'Unnamed Patient';
        }
        return "Unknown Patient";
    }

    /**
     * Get contact details from FHIR Patient resource
     */
    getPatientContactDetails(patient: Patient): string {
        if (patient.telecom && patient.telecom.length > 0) {
            return patient.telecom.map(contact =>
                `${contact.system}: ${contact.value}`
            ).join(', ');
        }
        return 'No contact information';
    }

    /**
     * Store patients in local storage for offline access
     */
    cachePatients(patients: ProcessedPatient[]): void {
        try {
            localStorage.setItem('cachedPatients', JSON.stringify(patients));
            this.logger.debug(`Cached ${patients.length} patients for offline use`);
        } catch (error) {
            this.logger.error('Error caching patients:', error);
        }
    }

    /**
     * Retrieve cached patients from local storage
     */
    getCachedPatients(): ProcessedPatient[] {
        try {
            const cachedData = localStorage.getItem('cachedPatients');
            if (!cachedData) {
                this.logger.debug('No cached patients found');
                return [];
            }

            const patients = JSON.parse(cachedData);
            this.logger.debug(`Retrieved ${patients.length} patients from cache`);
            return patients;
        } catch (error) {
            this.logger.error('Error retrieving cached patients:', error);
            return [];
        }
    }

    /**
     * Search patients by name or identifier
     */
    async searchPatients(searchTerm: string): Promise<ProcessedPatient[]> {
        if (!searchTerm || searchTerm.trim() === '') {
            const result = await this.getPatients();
            return result.data;
        }

        try {
            // Create FHIR search parameters
            const filters: FilterParams = {
                // Search by name (family or given)
                'name:contains': searchTerm,
                // Or by identifier (MRN, etc)
                '_query': 'identifier',
                'identifier': searchTerm
            };

            const response = await this.getList(filters);
            return this.processPatientResources(response.data);
        } catch (error) {
            this.logger.error(`Error searching patients with term "${searchTerm}":`, error);

            // Try to search in cache for offline fallback
            const cachedPatients = this.getCachedPatients();
            const normalizedSearch = searchTerm.toLowerCase();

            return cachedPatients.filter(patient =>
                patient.name.toLowerCase().includes(normalizedSearch) ||
                patient.contactDetails.toLowerCase().includes(normalizedSearch)
            );
        }
    }

    /**
     * Get active patients (those with active status)
     */
    async getActivePatients(): Promise<ProcessedPatient[]> {
        try {
            const filters: FilterParams = {
                'active': 'true'
            };

            const response = await this.getList(filters);
            return this.processPatientResources(response.data);
        } catch (error) {
            this.logger.error('Error fetching active patients:', error);

            // Try to filter cached patients
            const cachedPatients = this.getCachedPatients();
            // Since we can't determine active status from ProcessedPatient, 
            // we just return all cached patients in this fallback
            return cachedPatients;
        }
    }
}