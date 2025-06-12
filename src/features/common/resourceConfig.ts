// src/features/common/resourceConfig.ts
import { patientListConfig } from "../patients/config/patientListConfig";
import { practitionerListConfig } from "../practitioners/config/practitionerListConfig";
import { EntityListConfig } from "./EntityListConfig";
import { Patient, Practitioner } from "@medplum/fhirtypes";
import { PatientRow } from "../patients/config/patientListConfig";
import { PractitionerRow } from "../practitioners/config/practitionerListConfig";

/**
 * Map resource types to their respective list configurations
 * This makes it easy to extend the system with new resource types
 */
export const resourceConfigMap: Record<string, EntityListConfig<any, any>> = {
    'Patient': patientListConfig,
    'Practitioner': practitionerListConfig,
    // Add more resource types and their configs here as needed
};

/**
 * Get entity config by resource type
 * @param resourceType FHIR resource type
 * @returns The corresponding entity list config, or undefined if not found
 */
export const getConfigByResourceType = (resourceType: string): EntityListConfig<any, any> | undefined => {
    return resourceConfigMap[resourceType];
};

// Map FHIR resource types to their corresponding TypeScript types
export interface ResourceTypeMapping {
    Patient: {
        resource: Patient;
        row: PatientRow;
    };
    Practitioner: {
        resource: Practitioner;
        row: PractitionerRow;
    };
    // Add more resource types as needed
}

// Type to extract the row type from a resource type
export type RowTypeForResource<T extends keyof ResourceTypeMapping> =
    ResourceTypeMapping[T]['row'];

// Generic row properties that are common across all row types
export interface BaseRowData {
    id: string;
    name?: string;
    gender?: string;
    status?: string | null;
    syncStatus?: string | null;
}