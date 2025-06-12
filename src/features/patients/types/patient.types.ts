// src/features/patients/types/patient.types.ts

import { Patient as MedplumPatient, HumanName, ContactPoint, Address, Identifier, Reference, Extension } from '@medplum/fhirtypes';

/**
 * Extended Patient interface based on FHIR R4 specification with custom fields
 * See: https://hl7.org/fhir/R4/patient.html
 */
export interface Patient extends MedplumPatient {
  // Application-specific extensions
  _offline?: boolean;
  _syncStatus?: 'synced' | 'pending' | 'error';
  _contactDetails?: string;
}

/**
 * Props for the PatientTable component
 */
export interface PatientTableProps {
  patients: Array<{
    id: string;
    name: {
      use: string;
      text: string;
    };
    gender: string;
    birthDate: string;
    telecom: {
      system: string;
      value: string;
      use?: string;
    }[];
    address: {
      use: string;
      text: string;
    }[];
    status: string;
    identifier?: Array<{ value: string; system: string }>;
    _offline: boolean;
  }>;
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

/**
 * Processed patient data ready for UI display
 * Transforms raw FHIR Patient resources into a format suitable for components
 */
export interface ProcessedPatient {
  identifier: string | undefined;
  name: {
    use: string;
    text: string;
  };
  gender: "male" | "female" | "other" | "unknown" | undefined;
  birthDate: string | undefined;
  contactDetails: string;
  syncStatus: "synced" | "offline";
}

/**
 * Patient list filter options
 */
export interface PatientFilters {
  name?: string;
  gender?: "male" | "female" | "other" | "unknown";
  ageRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Patient creation parameters
 */
export interface PatientCreateParams {
  firstName: string;
  lastName: string;
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  contact?: {
    system: string;
    value: string;
    use?: string;
  }[];
}

/**
 * Patient update parameters
 */
export interface PatientUpdateParams extends Partial<PatientCreateParams> {
  id: string;
}