/**
 * FHIR Resource Utilities
 * Helper functions for working with FHIR resources in healthcare applications
 * Designed to work with Refine and support offline-first capabilities
 */

import {
  Patient,
  Practitioner,
  HumanName,
  Address,
  ContactPoint,
  Observation,
  MedicationRequest,
  Resource,
  Bundle,
  BundleEntry,
  Reference
} from '@medplum/fhirtypes';
import { calculateAge, formatAddress } from '@medplum/core';
import { createLogger } from '../logger';

// Create a logger
const logger = createLogger('FHIR Resource Utilities');

// Create a type for the translate function
type TranslateFunction = (key: string) => string;

/**
 * Create a new empty Patient resource with default values
 * Useful for creating new patients in the system
 * 
 * @param defaultValues Optional default values to pre-populate
 * @returns A new Patient resource with default values
 */
export function createEmptyPatient(defaultValues?: Partial<Patient>): Patient {
  return {
    resourceType: 'Patient',
    active: true,
    name: [
      {
        use: 'official',
        family: '',
        given: ['']
      }
    ],
    telecom: [
      {
        system: 'phone',
        value: '',
        use: 'mobile'
      }
    ],
    gender: 'unknown',
    ...defaultValues
  };
}

/**
 * Create a new empty Practitioner resource with default values
 * 
 * @param defaultValues Optional default values to pre-populate
 * @returns A new Practitioner resource with default values
 */
export function createEmptyPractitioner(defaultValues?: Partial<Practitioner>): Practitioner {
  return {
    resourceType: 'Practitioner',
    active: true,
    name: [
      {
        use: 'official',
        family: '',
        given: ['']
      }
    ],
    telecom: [
      {
        system: 'phone',
        value: '',
        use: 'work'
      }
    ],
    ...defaultValues
  };
}

/**
 * Create a new empty Observation resource with default values
 * 
 * @param patientId Optional patient ID to associate with the observation
 * @param defaultValues Optional default values to pre-populate
 * @returns A new Observation resource with default values
 */
export function createEmptyObservation(
  patientId?: string,
  defaultValues?: Partial<Observation>
): Observation {
  return {
    resourceType: 'Observation',
    status: 'preliminary',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '',
          display: ''
        }
      ],
      text: ''
    },
    subject: patientId ? {
      reference: `Patient/${patientId}`,
      type: 'Patient'
    } : {
      reference: '',
      type: 'Patient'
    },
    effectiveDateTime: new Date().toISOString(),
    ...defaultValues
  };
}

/**
 * Create a new empty MedicationRequest resource with default values
 * 
 * @param patientId Optional patient ID to associate with the medication request
 * @param practitionerId Optional practitioner ID to set as the requester
 * @param defaultValues Optional default values to pre-populate
 * @returns A new MedicationRequest resource with default values
 */
export function createEmptyMedicationRequest(
  patientId?: string,
  practitionerId?: string,
  defaultValues?: Partial<MedicationRequest>
): MedicationRequest {
  return {
    resourceType: 'MedicationRequest',
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [
        {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: '',
          display: ''
        }
      ],
      text: ''
    },
    subject: patientId ? {
      reference: `Patient/${patientId}`,
      type: 'Patient'
    } : {
      reference: '',
      type: 'Patient'
    },
    requester: practitionerId ? {
      reference: `Practitioner/${practitionerId}`,
      type: 'Practitioner'
    } : {
      reference: '',
      type: 'Practitioner'
    },
    authoredOn: new Date().toISOString(),
    dosageInstruction: [
      {
        text: '',
        timing: {
          repeat: {
            frequency: 1,
            period: 1,
            periodUnit: 'd'
          }
        },
        doseAndRate: [
          {
            doseQuantity: {
              value: 1,
              unit: '',
              system: 'http://unitsofmeasure.org',
              code: ''
            }
          }
        ]
      }
    ],
    ...defaultValues
  };
}

/**
 * Extract a resource ID from a FHIR reference
 * 
 * @param reference FHIR reference string or Reference object
 * @returns The extracted resource ID or undefined if not found
 */
export function extractReferenceId(reference?: string | Reference): string | undefined {
  if (!reference) return undefined;

  const refString = typeof reference === 'string'
    ? reference
    : reference.reference;

  if (!refString) return undefined;

  // Extract ID from reference strings like "Patient/123" or "#123"
  const parts = refString.split('/');
  return parts.length > 1 ? parts[1] : undefined;
}

/**
 * Extract a resource type from a FHIR reference
 * 
 * @param reference FHIR reference string or Reference object
 * @returns The extracted resource type or undefined if not found
 */
export function extractReferenceType(reference?: string | Reference): string | undefined {
  if (!reference) return undefined;

  const refString = typeof reference === 'string'
    ? reference
    : reference.reference;

  if (!refString) return undefined;

  // Extract type from reference strings like "Patient/123"
  const parts = refString.split('/');
  return parts.length > 1 ? parts[0] : undefined;
}

/**
 * Create a FHIR reference to a resource
 * 
 * @param resourceType The type of resource being referenced
 * @param id The ID of the resource
 * @param display Optional display text
 * @returns A FHIR Reference object
 */
export function createReference(
  resourceType: string,
  id: string,
  display?: string
): Reference {
  return {
    reference: `${resourceType}/${id}`,
    display: display
  };
}

/**
 * Convert an array of resources to a FHIR Bundle
 * Useful for bulk operations and offline synchronization
 * 
 * @param resources Array of FHIR resources to include in the bundle
 * @param type Bundle type (default: 'collection')
 * @returns FHIR Bundle containing the resources
 */
export function createBundle(
  resources: Resource[],
  type: 'transaction' | 'batch' | 'collection' = 'collection'
): Bundle {
  const entries: BundleEntry[] = resources.map(resource => ({
    resource,
    fullUrl: `urn:uuid:${resource.id || generateUUID()}`
  }));

  return {
    resourceType: 'Bundle',
    type,
    entry: entries
  };
}

/**
 * Extract resources from a FHIR Bundle
 * 
 * @param bundle FHIR Bundle to extract resources from
 * @param resourceType Optional resource type to filter by
 * @returns Array of resources from the bundle
 */
export function extractResourcesFromBundle<T extends Resource>(
  bundle: Bundle,
  resourceType?: string
): T[] {
  if (!bundle.entry) return [];

  return bundle.entry
    .filter(entry => entry.resource)
    .filter(entry => !resourceType || entry.resource?.resourceType === resourceType)
    .map(entry => entry.resource) as T[];
}

/**
 * Convert a FHIR resource for use with Refine's data provider
 * Maps FHIR resources to Refine's expected format
 * 
 * @param resource FHIR resource to convert
 * @returns Resource formatted for Refine
 */
export function convertResourceForRefine<T extends Resource>(resource: T): any {
  if (!resource) return null;

  // Create a reference id format that Refine expects
  return {
    ...resource,
    id: resource.id,
    // Add additional mappings as needed for specific resources
    // This is a basic implementation that can be expanded based on requirements
  };
}

/**
 * Generate a UUID v4
 * Useful for creating temporary IDs for resources in offline mode
 * 
 * @returns A new UUID string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a quick search display for a resource
 * Useful for autocomplete and reference displays
 * 
 * @param resource FHIR resource to generate display for
 * @returns Object with id, display, and search query string
 */
export function generateQuickDisplay(resource: Resource): {
  id: string;
  display: string;
  searchMatches: string[]
} {
  if (!resource || !resource.id) {
    return { id: '', display: 'Unknown', searchMatches: [] };
  }

  let display = 'Unknown';
  const searchMatches: string[] = [];

  switch (resource.resourceType) {
    case 'Patient': {
      const patient = resource as Patient;
      // Use formatters from another file
      display = patient.name && patient.name.length > 0
        ? `${patient.name[0].given?.join(' ') || ''} ${patient.name[0].family || ''}`.trim()
        : `Patient/${patient.id}`;

      // Add searchable terms
      if (patient.name) {
        patient.name.forEach(name => {
          if (name.given) searchMatches.push(...name.given);
          if (name.family) searchMatches.push(name.family);
        });
      }

      if (patient.identifier) {
        patient.identifier.forEach(id => {
          if (id.value) searchMatches.push(id.value);
        });
      }

      break;
    }

    case 'Practitioner': {
      const practitioner = resource as Practitioner;
      display = practitioner.name && practitioner.name.length > 0
        ? `${practitioner.name[0].prefix?.join(' ') || ''} ${practitioner.name[0].given?.join(' ') || ''} ${practitioner.name[0].family || ''}`.trim()
        : `Practitioner/${practitioner.id}`;

      // Add searchable terms
      if (practitioner.name) {
        practitioner.name.forEach(name => {
          if (name.given) searchMatches.push(...name.given);
          if (name.family) searchMatches.push(name.family);
        });
      }

      break;
    }

    case 'Observation': {
      const observation = resource as Observation;
      display = observation.code?.text ||
        observation.code?.coding?.[0]?.display ||
        `Observation/${observation.id}`;

      // Add searchable terms
      if (observation.code?.text) {
        searchMatches.push(observation.code.text);
      }

      if (observation.code?.coding) {
        observation.code.coding.forEach(coding => {
          if (coding.display) searchMatches.push(coding.display);
          if (coding.code) searchMatches.push(coding.code);
        });
      }

      break;
    }

    case 'MedicationRequest': {
      const medicationRequest = resource as MedicationRequest;
      display = medicationRequest.medicationCodeableConcept?.text ||
        medicationRequest.medicationCodeableConcept?.coding?.[0]?.display ||
        medicationRequest.medicationReference?.display ||
        `MedicationRequest/${medicationRequest.id}`;

      // Add searchable terms
      if (medicationRequest.medicationCodeableConcept?.text) {
        searchMatches.push(medicationRequest.medicationCodeableConcept.text);
      }

      break;
    }

    default:
      display = `${resource.resourceType}/${resource.id}`;
      break;
  }

  return {
    id: resource.id || '',
    display,
    searchMatches: Array.from(new Set(searchMatches.filter(Boolean)))
  };
}

/**
 * Check if a resource can be edited by the current user
 * Implement access control logic based on resource type and content
 * 
 * @param resource The resource to check
 * @param userRole The current user's role
 * @returns Boolean indicating if the resource can be edited
 */
export function canEditResource(
  resource: Resource,
  userRole: string
): boolean {
  // This is a placeholder implementation
  // In a real system, this would implement row-level security checks

  if (!resource) return false;

  switch (userRole) {
    case 'admin':
      // Admins can edit everything
      return true;

    case 'practitioner':
      // Practitioners can edit patients, observations, and medication requests
      return ['Patient', 'Observation', 'MedicationRequest'].includes(resource.resourceType);

    case 'patient':
      // Patients can only view, not edit
      return false;

    default:
      return false;
  }
}

/**
 * Formats a FHIR HumanName into a display string
 * @param name The FHIR HumanName object or array of HumanName objects
 * @param preferredUse Optional preferred 'use' value (e.g., 'official', 'usual')
 * @returns Formatted name string
 */
export const formatHumanName = (
  name: HumanName | HumanName[] | undefined,
  preferredUse?: string
): string => {
  // Handle undefined or empty array
  if (!name) return 'Unknown';

  // If it's an array, find the preferred name
  let nameObj: HumanName | undefined;

  if (Array.isArray(name)) {
    if (name.length === 0) return 'Unknown';

    // Try to find name with preferred use
    if (preferredUse) {
      nameObj = name.find(n => n.use === preferredUse);
    }

    // Default to first name if preferred not found
    nameObj = nameObj || name[0];
  } else {
    nameObj = name;
  }

  // Format the name components
  const prefix = nameObj.prefix?.length ? `${nameObj.prefix[0]} ` : '';
  const given = nameObj.given?.length ? nameObj.given.join(' ') : '';
  const family = nameObj.family || '';
  const suffix = nameObj.suffix?.length ? `, ${nameObj.suffix[0]}` : '';

  const formattedName = `${prefix}${given} ${family}${suffix}`.trim();
  return formattedName || 'Unknown';
};

/**
 * Formats a FHIR Address into a display string
 * @param address The FHIR Address object or array of Address objects
 * @param preferredUse Optional preferred 'use' value (e.g., 'home', 'work')
 * @returns Formatted address string
 */
export const customFormatAddress = (
  address: Address | Address[] | undefined,
  preferredUse?: string
): string => {
  // Handle undefined or empty array
  if (!address) return 'No address';

  // If it's an array, find the preferred address
  let addressObj: Address | undefined;

  if (Array.isArray(address)) {
    if (address.length === 0) return 'No address';

    // Try to find address with preferred use
    if (preferredUse) {
      addressObj = address.find(a => a.use === preferredUse);
    }

    // Default to first address if preferred not found
    addressObj = addressObj || address[0];
  } else {
    addressObj = address;
  }

  // If text is available, use it directly
  if (addressObj.text) return addressObj.text;

  // Otherwise, construct from components
  const line = addressObj.line?.join(', ') || '';
  const city = addressObj.city ? (line ? ', ' : '') + addressObj.city : '';
  const state = addressObj.state ? (city || line ? ', ' : '') + addressObj.state : '';
  const postalCode = addressObj.postalCode ? ' ' + addressObj.postalCode : '';
  const country = addressObj.country ? (state || city || line ? ', ' : '') + addressObj.country : '';

  const formattedAddress = `${line}${city}${state}${postalCode}${country}`.trim();
  return formattedAddress || 'No address';
};

/**
 * Formats a FHIR ContactPoint into a display string
 * @param telecom The FHIR ContactPoint object or array of ContactPoint objects
 * @param preferredSystem Optional preferred 'system' value (e.g., 'phone', 'email')
 * @param preferredUse Optional preferred 'use' value (e.g., 'home', 'work')
 * @returns Formatted contact string
 */
export const formatContactPoint = (
  telecom: ContactPoint | ContactPoint[] | undefined,
  preferredSystem?: string,
  preferredUse?: string
): string => {
  // Handle undefined or empty array
  if (!telecom) return 'No contact info';

  // If it's not an array, wrap it
  const telecomArray = Array.isArray(telecom) ? telecom : [telecom];
  if (telecomArray.length === 0) return 'No contact info';

  // Try to find contact with preferred system and use
  let contact: ContactPoint | undefined;

  if (preferredSystem && preferredUse) {
    contact = telecomArray.find(t => t.system === preferredSystem && t.use === preferredUse);
  }

  // Try to find contact with preferred system
  if (!contact && preferredSystem) {
    contact = telecomArray.find(t => t.system === preferredSystem);
  }

  // Try to find contact with preferred use
  if (!contact && preferredUse) {
    contact = telecomArray.find(t => t.use === preferredUse);
  }

  // Default to first contact if preferred not found
  contact = contact || telecomArray[0];

  // Format the contact
  if (!contact.value) return 'No contact info';

  const system = contact.system ? `(${contact.system})` : '';
  const use = contact.use ? `(${contact.use})` : '';

  return `${contact.value} ${system} ${use}`.trim();
};

/**
 * Processes communication array from FHIR resources
 * @param communication Communication array from FHIR resource
 * @returns Formatted languages string
 */
export const formatCommunication = (communication: any[] | undefined): string => {
  if (!communication || !communication.length) {
    return '';
  }

  return communication
    .map(lang => {
      if (lang.text) return lang.text;
      if (lang.language?.coding && lang.language.coding.length) return lang.language.coding[0].display;
      if (lang.language?.text) return lang.language.text;
      if (lang.coding && lang.coding.length) return lang.coding[0].display;
      return '';
    })
    .filter(Boolean)
    .join(', ');
};

/**
 * Formats qualifications from Practitioner resource
 * @param qualifications Qualification array from FHIR Practitioner
 * @returns Formatted qualifications string
 */
export const formatQualifications = (qualifications: any[] | undefined): string => {
  if (!qualifications || !qualifications.length) {
    return 'None specified';
  }

  return qualifications
    .map(q => {
      const text = q.code?.text;
      const coding = q.code?.coding?.[0]?.display;
      return text || coding || 'Unknown';
    })
    .join(', ');
};

/**
 * Extracts primary specialty from qualifications
 * @param qualifications Qualification array from FHIR Practitioner
 * @returns Primary specialty string
 */
export const extractPrimarySpecialty = (qualifications: any[] | undefined): string => {
  if (!qualifications || !qualifications.length) {
    return 'General';
  }

  // Try to find a specialty (not MD/DO)
  const specialty = qualifications.find(q => {
    const code = q.code?.coding?.[0]?.code;
    return code && code !== 'MD' && code !== 'DO';
  });

  if (specialty?.code?.text) {
    return specialty.code.text;
  }

  if (specialty?.code?.coding?.[0]?.display) {
    return specialty.code.coding[0].display;
  }

  // If no specialty, return primary qualification
  return qualifications[0]?.code?.text ||
    qualifications[0]?.code?.coding?.[0]?.display ||
    'General';
};

/**
 * Format a patient's gender for display
 * @param gender Patient gender code
 * @returns Formatted gender string
 */
export function formatGender(gender: string | undefined, translate: TranslateFunction = (key) => key): string {
  if (!gender) return 'Unknown';

  // Capitalize first letter
  const formattedGender = gender.charAt(0).toUpperCase() + gender.toLowerCase().slice(1);

  // If translation keys are provided, use them
  switch (gender.toLowerCase()) {
    case 'male':
      return translate('patient.gender.male') || formattedGender;
    case 'female':
      return translate('patient.gender.female') || formattedGender;
    case 'other':
      return translate('patient.gender.other') || formattedGender;
    case 'unknown':
      return translate('patient.gender.unknown') || formattedGender;
    default:
      return formattedGender;
  }
}

/**
 * Enhances a Patient resource with computed fields for display
 * Handles missing fields by using defaults
 * @param patient FHIR Patient resource
 * @returns Enhanced patient with computed fields
 */
export const enhancePatient = (patient: Patient): Patient & Record<string, any> => {
  return {
    ...patient,
    _computed: {
      formattedName: formatHumanName(patient.name, 'official'),
      contactInfo: formatContactPoint(patient.telecom, 'email'),
      address: customFormatAddress(patient.address, 'home'),
      communication: formatCommunication(patient.communication),
      gender: formatGender(patient.gender),
      age: patient.birthDate ? Number(calculateAge(patient.birthDate)) : undefined,
      // insuranceStatus: patient.link?.length ? 'Linked' : 'Unknown',
      // maritalStatus: patient.maritalStatus?.coding?.[0]?.display ||
      //   patient.maritalStatus?.text || 'Unknown',
      // language: patient.communication?.[0]?.language?.coding?.[0]?.display ||
      //   patient.communication?.[0]?.language?.text || 'English',
      // active: patient.active === true ? 'Active' :
      //   patient.active === false ? 'Inactive' : 'Unknown',
      // identifier: patient.identifier?.[0]?.value || 'Unknown ID',
      // identifierSystem: patient.identifier?.[0]?.system || 'Unknown System',
      // lastUpdated: patient.meta?.lastUpdated ? new Date(patient.meta.lastUpdated).toLocaleString() : 'Unknown'
    }
  };
};

/**
 * Enhances a Practitioner resource with computed fields for display
 * Handles missing fields by using defaults
 * @param practitioner FHIR Practitioner resource
 * @returns Enhanced practitioner with computed fields
 */
export const enhancePractitioner = (practitioner: Practitioner): Practitioner & Record<string, any> => {
  return {
    ...practitioner,
    _computed: {
      formattedName: formatHumanName(practitioner.name, 'official'),
      contactInfo: formatContactPoint(practitioner.telecom, 'email', 'work'),
      address: customFormatAddress(practitioner.address, 'work'),
      communication: formatCommunication(practitioner.communication),
      gender: formatGender(practitioner.gender),
      qualification: extractPrimarySpecialty(practitioner.qualification),
      // qualifications: formatQualifications(practitioner.qualification),
      // activeStatus: practitioner.active === true ? 'Active' :
      // practitioner.active === false ? 'Inactive' : 'Unknown',
      // identifier: practitioner.identifier?.[0]?.value || 'Unknown ID',
      // identifierSystem: practitioner.identifier?.[0]?.system || 'Unknown System',
      // specialty: practitioner.qualification?.[0]?.code?.coding?.[0]?.display ||
      //   practitioner.qualification?.[0]?.code?.text || 'General',
      // role: practitioner.extension?.find(ext => ext.url.includes('role'))?.valueString ||
      //   practitioner.extension?.find(ext => ext.url.includes('role'))?.valueCode || 'Unknown',
      // organization: practitioner.extension?.find(ext => ext.url.includes('organization'))?.valueReference?.display || 'Unknown',
      // lastUpdated: practitioner.meta?.lastUpdated ? new Date(practitioner.meta.lastUpdated).toLocaleString() : 'Unknown'
    }
  };
};