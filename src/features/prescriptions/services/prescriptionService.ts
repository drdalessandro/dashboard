// src/features/prescriptions/services/prescriptionService.ts
import { MedicationRequest, Reference } from '@medplum/fhirtypes';
import dataProvider from '../../../providers/dataProviders';
import { ProcessedPrescription } from '../types/prescription.types';
import { patientService } from '../../../data/services/patientService';

/**
 * Service for handling prescription-related data operations
 * Includes methods for fetching, transforming and caching prescription data
 * Implements offline-first capabilities as required for the Gandall Healthcare Platform
 */
export const prescriptionService = {
  /**
   * Fetch a list of prescriptions from the FHIR server
   * Includes offline fallback capabilities
   */
  async getPrescriptions(): Promise<{
    data: ProcessedPrescription[];
    isOffline: boolean;
  }> {
    try {
      const response = await dataProvider.getList({
        resource: "MedicationRequest",
        pagination: {
          pageSize: 50
        }
      });

      // Handle different response structures
      let prescriptionResources: any[] = [];

      if (response.data && Array.isArray(response.data)) {
        prescriptionResources = response.data;
      } else if (response.data && typeof response.data === 'object') {
        const responseData = response.data as any;

        if (responseData.resourceType === 'Bundle' && responseData.entry && Array.isArray(responseData.entry)) {
          prescriptionResources = responseData.entry.map((entry: any) => entry.resource);
        } else if (responseData.entry && Array.isArray(responseData.entry)) {
          prescriptionResources = responseData.entry;
        }
      }

      // Process the prescription resources
      const processedPrescriptions = await this.processPrescriptionResources(prescriptionResources);

      // Cache for offline use
      this.cachePrescriptions(processedPrescriptions);

      return {
        data: processedPrescriptions,
        isOffline: false
      };
    } catch (error) {
      console.error("Error fetching prescriptions:", error);

      // Try to get cached data
      const cachedPrescriptions = this.getCachedPrescriptions();

      return {
        data: cachedPrescriptions,
        isOffline: true
      };
    }
  },

  /**
   * Process raw FHIR MedicationRequest resources into a format suitable for the UI
   */
  async processPrescriptionResources(resources: any[]): Promise<ProcessedPrescription[]> {
    const validResources = resources.filter(
      resource => resource && resource.resourceType === 'MedicationRequest'
    );

    // Process prescriptions and handle them in batches for better memory efficiency
    const results: ProcessedPrescription[] = [];

    // Process in smaller batches to avoid memory issues with large datasets
    const batchSize = 50;
    for (let i = 0; i < validResources.length; i += batchSize) {
      const batch = validResources.slice(i, i + batchSize);

      // Process the current batch
      const batchResults = await Promise.all(
        batch.map(async (resource: MedicationRequest) => {
          try {
            // Get patient name - handle both reference and contained resource
            let patientName = "Unknown Patient";
            let patientId = resource.subject ? this.getIdFromReference(resource.subject) || '' : '';

            if (patientId) {
              try {
                // Try to get patient details
                const patientDetails = await patientService.getPatientById(patientId);
                if (patientDetails) {
                  patientName = patientDetails.name;
                }
              } catch (err) {
                console.error("Error getting patient details:", err);
              }
            }

            // Get medication name
            let medicationName = "Unknown Medication";

            if (resource.medicationCodeableConcept) {
              medicationName = resource.medicationCodeableConcept.text ||
                (resource.medicationCodeableConcept.coding?.[0]?.display || "Unknown Medication");
            } else if (resource.medicationReference) {
              medicationName = `Medication (${this.getIdFromReference(resource.medicationReference) || 'unknown'})`;
            }

            // Get dosage instructions
            let dosageInstructions = "No instructions provided";

            if (resource.dosageInstruction && resource.dosageInstruction.length > 0) {
              const dosage = resource.dosageInstruction[0];
              if (dosage.text) {
                dosageInstructions = dosage.text;
              } else {
                // Build dosage string from structured data if available
                const doseText = dosage.doseAndRate?.[0]?.doseQuantity
                  ? `${dosage.doseAndRate[0].doseQuantity.value} ${dosage.doseAndRate[0].doseQuantity.unit || ''}`
                  : '';

                const timingText = dosage.timing?.code?.text || '';

                dosageInstructions = [doseText, timingText].filter(Boolean).join(' ');
              }
            }

            // Get prescriber name
            let prescriberName = "Unknown Prescriber";
            let prescriberId = '';

            if (resource.requester) {
              prescriberId = this.getIdFromReference(resource.requester) || '';
              prescriberName = prescriberId ? `Prescriber (${prescriberId})` : "Unknown Prescriber";
            }

            // Return a properly typed ProcessedPrescription object
            return {
              id: resource.id || '',
              patientId: patientId,
              patientName,
              medicationName,
              dosageInstructions,
              status: resource.status || "unknown",
              dateWritten: resource.authoredOn,
              prescriberId: prescriberId,
              prescriberName,
              syncStatus: "synced" // This now properly matches the ProcessedPrescription type
            } as ProcessedPrescription;
          } catch (error) {
            console.error("Error processing prescription resource:", error);
            return null;
          }
        })
      );

      // Add valid results from this batch to our results array
      for (const item of batchResults) {
        if (item !== null) {
          results.push(item);
        }
      }
    }

    return results;
  },

  /**
   * Extract ID from a FHIR reference
   */
  getIdFromReference(reference: Reference): string | undefined {
    if (!reference.reference) return undefined;

    // Reference format is typically "ResourceType/id"
    const parts = reference.reference.split('/');
    return parts.length === 2 ? parts[1] : undefined;
  },

  /**
   * Store prescriptions in local storage for offline access
   */
  cachePrescriptions(prescriptions: ProcessedPrescription[]): void {
    localStorage.setItem('cachedPrescriptions', JSON.stringify(prescriptions));
  },

  /**
   * Retrieve cached prescriptions from local storage
   */
  getCachedPrescriptions(): ProcessedPrescription[] {
    const cachedData = localStorage.getItem('cachedPrescriptions');
    return cachedData ? JSON.parse(cachedData) : [];
  },

  /**
   * Get a single prescription by ID
   */
  async getPrescriptionById(id: string): Promise<ProcessedPrescription | null> {
    try {
      const response = await dataProvider.getOne({
        resource: "MedicationRequest",
        id
      });

      if (!response.data) {
        return null;
      }

      const prescription = response.data as MedicationRequest;
      const processed = await this.processPrescriptionResources([prescription]);
      return processed.length > 0 ? processed[0] : null;
    } catch (error) {
      console.error(`Error fetching prescription ${id}:`, error);

      // Try to get from cache
      const cachedPrescriptions = this.getCachedPrescriptions();
      return cachedPrescriptions.find(p => p.id === id) || null;
    }
  },

  /**
   * Get prescriptions for a specific patient
   */
  async getPrescriptionsForPatient(patientId: string): Promise<ProcessedPrescription[]> {
    try {
      const response = await dataProvider.getList({
        resource: "MedicationRequest",
        filters: [
          {
            field: "subject",
            operator: "eq",
            value: `Patient/${patientId}`
          }
        ],
        pagination: {
          pageSize: 100
        }
      });

      let prescriptionResources: any[] = [];

      if (response.data && Array.isArray(response.data)) {
        prescriptionResources = response.data;
      } else if (response.data && typeof response.data === 'object') {
        const responseData = response.data as any;

        if (responseData.resourceType === 'Bundle' && responseData.entry && Array.isArray(responseData.entry)) {
          prescriptionResources = responseData.entry.map((entry: any) => entry.resource);
        }
      }

      return (await this.processPrescriptionResources(prescriptionResources))
        .filter(p => p.patientId === patientId);
    } catch (error) {
      console.error(`Error fetching prescriptions for patient ${patientId}:`, error);

      // Try to get from cache
      const cachedPrescriptions = this.getCachedPrescriptions();
      return cachedPrescriptions.filter(p => p.patientId === patientId);
    }
  }
};
