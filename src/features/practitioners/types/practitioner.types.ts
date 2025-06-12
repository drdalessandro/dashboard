// src/features/practitioners/types/practitioner.types.ts

/**
 * Processed practitioner data ready for UI display
 * Transforms raw FHIR Practitioner resources into a format suitable for components
 */
export interface ProcessedPractitioner {
  id: string | undefined;
  name: string | undefined;
  gender: "male" | "female" | "other" | "unknown" | undefined;
  qualifications?: { code: string; issuer?: string; period?: { start?: string; end?: string } }[];
  address?: { use?: string; line?: string[]; city?: string; district?: string; state?: string; postalCode?: string; country?: string }[];
  contact?: { system: string; value: string; use?: string }[];
  syncStatus: "synced" | "offline";
}

/**
 * Practitioner list filter options
 */
export interface PractitionerFilters {
  name?: string;
  gender?: "male" | "female" | "other" | "unknown";
  qualifications?: { code: string; issuer?: string; period?: { start?: string; end?: string } }[];
  contact?: { system: string; value: string; use?: string }[];
  address?: { use?: string; line?: string[]; city?: string; district?: string; state?: string; postalCode?: string; country?: string }[];
}

/**
 * Practitioner creation parameters
 * Enhanced to support all FHIR-compliant fields
 */
export interface PractitionerCreateParams {
  firstName: string;
  lastName: string;
  active?: boolean;
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string; // ISO date string (YYYY-MM-DD)
  qualifications?: {
    code: string;
    issuer?: string;
    period?: {
      start?: string;
      end?: string;
    };
  }[];
  contact?: {
    system: string;
    value: string;
    use?: string;
  }[];
  address?: {
    use?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }[];
  photo?: {
    contentType?: string;
    data?: string; // base64 encoded
    size?: number;
    title?: string;
    url?: string;
  }[];
  communication?: {
    language: string; // language code (e.g., 'en', 'fr')
    text: string; // display name (e.g., 'English', 'French')
  }[];
}

/**
 * Practitioner update parameters
 */
export interface PractitionerUpdateParams extends Partial<PractitionerCreateParams> {
  id: string;
}
