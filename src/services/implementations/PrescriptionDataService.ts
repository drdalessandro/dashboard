// src/services/implementations/PrescriptionDataService.ts
import { MedicationRequest } from '@medplum/fhirtypes';
import { BaseDataService } from './BaseDataService';
import { IPrescriptionDataService } from '../interfaces/IPrescriptionDataService';
import { DataServiceConfig } from '../interfaces/IBaseDataService';

/**
 * Implementation of IPrescriptionDataService for handling prescription data operations
 */
export class PrescriptionDataService extends BaseDataService<MedicationRequest> implements IPrescriptionDataService {
    
    constructor(config?: Partial<DataServiceConfig>) {
        super(config);
    }

    /**
     * Get the default resource type for this service
     */
    protected getDefaultResourceType(): string {
        return 'MedicationRequest';
    }

    /**
     * Get prescriptions for a specific patient
     */
    async getPrescriptionsForPatient(patientId: string): Promise<MedicationRequest[]> {
        try {
            const response = await this.getList({
                'subject': `Patient/${patientId}`
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Error fetching prescriptions for patient ${patientId}:`, error);
            return [];
        }
    }

    /**
     * Get active prescriptions
     */
    async getActivePrescriptions(): Promise<MedicationRequest[]> {
        try {
            const response = await this.getList({
                'status': 'active'
            });
            return response.data;
        } catch (error) {
            this.logger.error('Error fetching active prescriptions:', error);
            return [];
        }
    }

    /**
     * Verify if a prescription is valid
     */
    async verifyPrescription(prescriptionId: string): Promise<boolean> {
        try {
            const prescription = await this.getOne(prescriptionId);
            // A prescription is considered valid if it exists and is not expired
            return !!prescription && prescription.status !== 'completed' && prescription.status !== 'cancelled';
        } catch (error) {
            this.logger.error(`Error verifying prescription ${prescriptionId}:`, error);
            return false;
        }
    }

    /**
     * Convert a prescription to a processed format for UI
     */
    formatPrescriptionForDisplay(prescription: MedicationRequest): any {
        // Extract the medication name
        const medicationName = this.getMedicationName(prescription);
        
        // Extract dosage instructions
        const dosageInstructions = this.getDosageInstructions(prescription);
        
        // Format dates
        const authoredOn = prescription.authoredOn ? new Date(prescription.authoredOn).toLocaleDateString() : 'Unknown';
        
        // Extract prescriber details
        const prescriber = this.getPrescriberDetails(prescription);
        
        return {
            id: prescription.id,
            medicationName,
            status: prescription.status,
            intent: prescription.intent,
            authoredOn,
            dosageInstructions,
            prescriber,
            patientId: this.getPatientId(prescription)
        };
    }

    /**
     * Extract medication name from a MedicationRequest
     */
    private getMedicationName(prescription: MedicationRequest): string {
        // Handle different ways medication can be specified in FHIR
        if (prescription.medicationCodeableConcept?.text) {
            return prescription.medicationCodeableConcept.text;
        }
        
        if (prescription.medicationCodeableConcept?.coding?.length) {
            return prescription.medicationCodeableConcept.coding[0].display || 
                   prescription.medicationCodeableConcept.coding[0].code || 
                   'Unknown Medication';
        }
        
        if (prescription.medicationReference?.display) {
            return prescription.medicationReference.display;
        }
        
        return 'Unknown Medication';
    }

    /**
     * Extract dosage instructions from a MedicationRequest
     */
    private getDosageInstructions(prescription: MedicationRequest): string {
        if (prescription.dosageInstruction && prescription.dosageInstruction.length > 0) {
            const dosage = prescription.dosageInstruction[0];
            
            if (dosage.text) {
                return dosage.text;
            }
            
            // Build instructions from components
            let instructions = '';
            
            if (dosage.doseAndRate && dosage.doseAndRate.length > 0) {
                const doseAndRate = dosage.doseAndRate[0];
                
                if (doseAndRate.doseQuantity) {
                    instructions += `${doseAndRate.doseQuantity.value} ${doseAndRate.doseQuantity.unit || ''} `;
                }
            }
            
            if (dosage.timing?.code?.text) {
                instructions += dosage.timing.code.text;
            }
            
            if (instructions) {
                return instructions;
            }
        }
        
        return 'No specific instructions';
    }

    /**
     * Extract prescriber details from a MedicationRequest
     */
    private getPrescriberDetails(prescription: MedicationRequest): string {
        if (prescription.requester?.display) {
            return prescription.requester.display;
        }
        
        if (prescription.requester?.reference) {
            // Return just the reference ID for now
            return prescription.requester.reference;
        }
        
        return 'Unknown Prescriber';
    }

    /**
     * Extract patient ID from a MedicationRequest
     */
    private getPatientId(prescription: MedicationRequest): string {
        if (prescription.subject?.reference) {
            // Extract just the ID from the reference (e.g., "Patient/123" -> "123")
            const parts = prescription.subject.reference.split('/');
            return parts.length > 1 ? parts[1] : prescription.subject.reference;
        }
        
        return '';
    }
}