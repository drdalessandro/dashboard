// src/services/implementations/PractitionerDataService.ts
import { Practitioner, PractitionerQualification } from '@medplum/fhirtypes';
import { BaseDataService } from './BaseDataService';
import { IPractitionerDataService, ProcessedPractitioner } from '../interfaces/IPractitionerDataService';
import { FilterParams } from '../models';
import { DataServiceConfig } from '../interfaces/IBaseDataService';

/**
 * Implementation of the Practitioner data service
 * Handles FHIR Practitioner resources and operations
 */
export class PractitionerDataService extends BaseDataService<Practitioner> implements IPractitionerDataService {

    constructor(config?: Partial<DataServiceConfig>) {
        super(config);
    }

    /**
     * Get the default resource type for this service
     */
    protected getDefaultResourceType(): string {
        return 'Practitioner';
    }

    /**
     * Format practitioner qualifications into a readable string
     * @param qualifications Array of practitioner qualifications
     * @returns Formatted qualification string or undefined
     */
    private formatPractitionerQualifications(
        qualifications?: PractitionerQualification[]
    ): string | undefined {
        if (!qualifications || qualifications.length === 0) {
            return undefined;
        }

        return qualifications
            .map(qual =>
                qual.code?.text ||
                qual.code?.coding?.[0]?.display ||
                qual.code?.coding?.[0]?.code ||
                'Qualification'
            )
            .filter(Boolean)
            .join(', ');
    }

    /**
     * Get practitioner contact details from FHIR Practitioner resource as a formatted string
     * @param practitioner Practitioner resource
     * @returns Formatted contact details
     */
    getPractitionerContactDetails(practitioner: Practitioner): string {
        if (practitioner.telecom && practitioner.telecom.length > 0) {
            return practitioner.telecom.map(contact =>
                `${contact.system}: ${contact.value}`
            ).join(', ');
        }
        return 'No contact information';
    }

    /**
     * Fetch a list of Practitioners from the FHIR server
     * Includes offline fallback capabilities
     */
    async getPractitioners(): Promise<{
        data: ProcessedPractitioner[];
        isOffline: boolean;
    }> {
        try {
            this.logger.debug('Fetching Practitioners list');
            const response = await this.getList({}, { pageSize: 25 });

            // Process the Practitioner resources
            const processedPractitioners = this.processPractitionerResources(response.data);

            // Cache for offline use
            this.cachePractitioners(processedPractitioners);

            return {
                data: processedPractitioners,
                isOffline: false
            };
        } catch (error) {
            this.logger.error("Error fetching Practitioners:", error);

            // Try to get cached data
            const cachedPractitioners = this.getCachedPractitioners();

            return {
                data: cachedPractitioners,
                isOffline: true
            };
        }
    }

    /**
     * Get a single Practitioner by ID in processed format
     */
    async getPractitionerById(id: string): Promise<ProcessedPractitioner | null> {
        try {
            this.logger.debug(`Fetching Practitioner with ID: ${id}`);
            const practitioner = await this.getOne(id);

            if (!practitioner) {
                return null;
            }

            return {
                id: practitioner.id || '',
                name: this.getPractitionerName(practitioner),
                gender: practitioner.gender,
                qualification: practitioner.qualification || [],
                communication: practitioner.communication,
                telecom: practitioner.telecom,
                address: practitioner.address,
                syncStatus: "synced" as const,
            };
        } catch (error) {
            this.logger.error(`Error fetching Practitioner ${id}:`, error);

            // Try to get from cache
            const cachedPractitioners = this.getCachedPractitioners();
            return cachedPractitioners.find(p => p.id === id) || null;
        }
    }

    /**
     * Process raw FHIR Practitioner resources into a format suitable for the UI
     */
    processPractitionerResources(resources: any[]): ProcessedPractitioner[] {
        // Use flatMap to both transform and filter in one operation
        return resources
            .flatMap((resource: any): ProcessedPractitioner[] => {
                // Skip invalid resources
                if (!resource || resource.resourceType !== 'Practitioner') {
                    return [];
                }

                const practitioner = resource as Practitioner;
                return [{
                    id: practitioner.id || '',  // Ensure id is never undefined
                    name: this.getPractitionerName(practitioner),
                    gender: practitioner.gender,
                    qualification: practitioner.qualification || [],
                    telecom: practitioner.telecom,
                    address: practitioner.address,
                    syncStatus: "synced" as const,
                }];
            });
    }

    /**
     * Get Practitioner name from FHIR Practitioner resource
     */
    getPractitionerName(practitioner: Practitioner): string {
        if (practitioner.name && practitioner.name.length > 0) {
            const name = practitioner.name[0];
            return `${name.given?.join(' ') || ''} ${name.family || ''}`.trim() || 'Unnamed Practitioner';
        }
        return "Unknown Practitioner";
    }

    /**
     * Store Practitioners in local storage for offline access
     */
    cachePractitioners(practitioners: ProcessedPractitioner[]): void {
        try {
            localStorage.setItem('cachedPractitioners', JSON.stringify(practitioners));
            this.logger.debug(`Cached ${practitioners.length} Practitioners for offline use`);
        } catch (error) {
            this.logger.error('Error caching Practitioners:', error);
        }
    }

    /**
     * Retrieve cached Practitioners from local storage
     */
    getCachedPractitioners(): ProcessedPractitioner[] {
        try {
            const cachedData = localStorage.getItem('cachedPractitioners');
            if (!cachedData) {
                this.logger.debug('No cached Practitioners found');
                return [];
            }

            const practitioners = JSON.parse(cachedData);
            this.logger.debug(`Retrieved ${practitioners.length} Practitioners from cache`);
            return practitioners;
        } catch (error) {
            this.logger.error('Error retrieving cached Practitioners:', error);
            return [];
        }
    }

    /**
     * Search Practitioners by name or identifier
     */
    async searchPractitioners(searchTerm: string): Promise<ProcessedPractitioner[]> {
        if (!searchTerm || searchTerm.trim() === '') {
            const result = await this.getPractitioners();
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
            return this.processPractitionerResources(response.data);
        } catch (error) {
            this.logger.error(`Error searching Practitioners with term "${searchTerm}":`, error);

            // Try to search in cache for offline fallback
            const cachedPractitioners = this.getCachedPractitioners();
            const normalizedSearch = searchTerm.toLowerCase();

            return cachedPractitioners.filter(practitioner =>
                practitioner.name.toLowerCase().includes(normalizedSearch)
            );
        }
    }

    /**
     * Get active Practitioners (those with active status)
     */
    async getActivePractitioners(): Promise<ProcessedPractitioner[]> {
        try {
            const filters: FilterParams = {
                'active': 'true'
            };

            const response = await this.getList(filters);
            return this.processPractitionerResources(response.data);
        } catch (error) {
            this.logger.error('Error fetching active Practitioners:', error);

            // Try to filter cached Practitioners
            const cachedPractitioners = this.getCachedPractitioners();
            // Since we can't determine active status from ProcessedPractitioner, 
            // we just return all cached Practitioners in this fallback
            return cachedPractitioners;
        }
    }
}