// src/services/interfaces/IPrescriptionDataService.ts
import { MedicationRequest } from '@medplum/fhirtypes';
import { IBaseDataService } from './IBaseDataService';

/**
 * Interface for Prescription-specific data operations
 * MedicationRequest is the FHIR resource type for prescriptions
 */
export interface IPrescriptionDataService extends IBaseDataService<MedicationRequest> {
    /**
     * Get prescriptions for a specific patient
     */
    getPrescriptionsForPatient(patientId: string): Promise<MedicationRequest[]>;

    /**
     * Get active prescriptions
     */
    getActivePrescriptions(): Promise<MedicationRequest[]>;

    /**
     * Verify if a prescription is valid
     */
    verifyPrescription(prescriptionId: string): Promise<boolean>;

    /**
     * Convert a prescription to a processed format for UI
     */
    formatPrescriptionForDisplay(prescription: MedicationRequest): any;
}