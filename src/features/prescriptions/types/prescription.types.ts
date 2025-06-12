// src/features/prescriptions/types/prescription.types.ts

/**
 * Processed prescription data ready for UI display
 * Transforms raw FHIR MedicationRequest resources into a format suitable for components
 */
export interface ProcessedPrescription {
  id: string | undefined;
  patientId: string | undefined;
  patientName: string;
  medicationName: string;
  dosageInstructions: string;
  status: "active" | "completed" | "stopped" | "cancelled" | "draft" | "unknown";
  dateWritten: string | undefined;
  prescriberId: string | undefined;
  prescriberName: string;
  syncStatus: "synced" | "offline";
}

/**
 * Prescription filter options
 */
export interface PrescriptionFilters {
  patientId?: string;
  patientName?: string;
  medicationName?: string;
  status?: "active" | "completed" | "stopped" | "cancelled" | "draft" | "unknown";
  dateRange?: {
    start?: string;
    end?: string;
  };
  prescriberName?: string;
}

/**
 * Prescription creation parameters
 */
export interface PrescriptionCreateParams {
  patientId: string;
  medicationId?: string;
  medicationText?: string;  // Free text medication name if not using a medication resource
  dosageInstructions: string;
  status: "active" | "draft";
  dateWritten?: string;
  prescriberId?: string;
}

/**
 * Prescription update parameters
 */
export interface PrescriptionUpdateParams {
  id: string;
  status?: "active" | "completed" | "stopped" | "cancelled" | "draft";
  dosageInstructions?: string;
}
