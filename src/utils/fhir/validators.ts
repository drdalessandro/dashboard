/**
 * FHIR Resource Validators
 * Validation utilities for FHIR resources to ensure data integrity
 * Critical for healthcare data quality in offline-first applications
 */

import { 
  Patient, 
  Practitioner, 
  Observation,
  MedicationRequest
} from '@medplum/fhirtypes';

/**
 * Validate a FHIR Patient resource
 * 
 * @param patient The Patient resource to validate
 * @returns Validation result with error messages
 */
export function validatePatient(patient: Patient): { 
  valid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  // Check for required fields
  if (!patient.name || patient.name.length === 0) {
    errors.push('Patient name is required');
  } else {
    // Validate name components
    const name = patient.name[0];
    if (!name.family && (!name.given || name.given.length === 0)) {
      errors.push('Patient must have at least a family name or given name');
    }
  }
  
  // Validate gender
  if (patient.gender && !['male', 'female', 'other', 'unknown'].includes(patient.gender)) {
    errors.push('Invalid gender value');
  }
  
  // Validate birth date
  if (patient.birthDate) {
    try {
      const date = new Date(patient.birthDate);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        errors.push('Invalid birth date format');
      } else if (date > now) {
        errors.push('Birth date cannot be in the future');
      }
    } catch (e) {
      errors.push('Invalid birth date format');
    }
  }
  
  // Validate telecom entries
  if (patient.telecom && patient.telecom.length > 0) {
    patient.telecom.forEach((telecom, index) => {
      if (!telecom.system) {
        errors.push(`Contact point #${index + 1} must have a system`);
      }
      
      if (!telecom.value) {
        errors.push(`Contact point #${index + 1} must have a value`);
      }
    });
  }
  
  // Validate identifiers
  if (patient.identifier && patient.identifier.length > 0) {
    patient.identifier.forEach((identifier, index) => {
      if (!identifier.system && !identifier.value) {
        errors.push(`Identifier #${index + 1} must have a system or value`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a FHIR Practitioner resource
 * 
 * @param practitioner The Practitioner resource to validate
 * @returns Validation result with error messages
 */
export function validatePractitioner(practitioner: Practitioner): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for required fields
  if (!practitioner.name || practitioner.name.length === 0) {
    errors.push('Practitioner name is required');
  } else {
    // Validate name components
    const name = practitioner.name[0];
    if (!name.family && (!name.given || name.given.length === 0)) {
      errors.push('Practitioner must have at least a family name or given name');
    }
  }
  
  // Validate qualifications
  if (practitioner.qualification && practitioner.qualification.length > 0) {
    practitioner.qualification.forEach((qual, index) => {
      if (!qual.code) {
        errors.push(`Qualification #${index + 1} must have a code`);
      }
    });
  }
  
  // Validate identifiers
  if (practitioner.identifier && practitioner.identifier.length > 0) {
    practitioner.identifier.forEach((identifier, index) => {
      if (!identifier.system && !identifier.value) {
        errors.push(`Identifier #${index + 1} must have a system or value`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a FHIR Observation resource
 * 
 * @param observation The Observation resource to validate
 * @returns Validation result with error messages
 */
export function validateObservation(observation: Observation): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for required fields
  if (!observation.status) {
    errors.push('Observation status is required');
  } else if (!['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'].includes(observation.status)) {
    errors.push('Invalid observation status');
  }
  
  if (!observation.code) {
    errors.push('Observation code is required');
  }
  
  // Validate subject reference
  if (!observation.subject) {
    errors.push('Observation subject is required');
  }
  
  // Validate that at least one value is present
  const hasValue = 
    observation.valueQuantity !== undefined ||
    observation.valueCodeableConcept !== undefined ||
    observation.valueString !== undefined ||
    observation.valueBoolean !== undefined ||
    observation.valueInteger !== undefined ||
    observation.valueRange !== undefined ||
    observation.valueRatio !== undefined ||
    observation.valueSampledData !== undefined ||
    observation.valueTime !== undefined ||
    observation.valueDateTime !== undefined ||
    observation.valuePeriod !== undefined ||
    (observation.component && observation.component.length > 0);
    
  if (!hasValue) {
    errors.push('Observation must have at least one value');
  }
  
  // Validate effective date/time
  if (observation.effectiveDateTime) {
    try {
      const date = new Date(observation.effectiveDateTime);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        errors.push('Invalid effective date format');
      } else if (date > now) {
        errors.push('Effective date cannot be in the future');
      }
    } catch (e) {
      errors.push('Invalid effective date format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a FHIR MedicationRequest resource
 * 
 * @param medicationRequest The MedicationRequest resource to validate
 * @returns Validation result with error messages
 */
export function validateMedicationRequest(medicationRequest: MedicationRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for required fields
  if (!medicationRequest.status) {
    errors.push('Medication request status is required');
  } else if (!['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown'].includes(medicationRequest.status)) {
    errors.push('Invalid medication request status');
  }
  
  if (!medicationRequest.intent) {
    errors.push('Medication request intent is required');
  } else if (!['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option'].includes(medicationRequest.intent)) {
    errors.push('Invalid medication request intent');
  }
  
  // Validate medication
  if (!medicationRequest.medicationCodeableConcept && !medicationRequest.medicationReference) {
    errors.push('Medication must be specified either as a code or reference');
  }
  
  // Validate subject reference
  if (!medicationRequest.subject) {
    errors.push('Medication request subject is required');
  }
  
  // Validate requester
  if (!medicationRequest.requester) {
    errors.push('Medication request requester is required');
  }
  
  // Validate authoring date
  if (medicationRequest.authoredOn) {
    try {
      const date = new Date(medicationRequest.authoredOn);
      
      if (isNaN(date.getTime())) {
        errors.push('Invalid authored date format');
      }
    } catch (e) {
      errors.push('Invalid authored date format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate FHIR resource identifiers for uniqueness and proper formatting
 * 
 * @param resourceType The type of resource being validated
 * @param identifiers Array of identifiers to validate
 * @returns Validation result with error messages
 */
export function validateIdentifiers(
  resourceType: string,
  identifiers: Array<{ system?: string; value?: string }>
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for duplicates
  const identifierMap = new Map<string, number>();
  
  identifiers.forEach((identifier, index) => {
    const key = `${identifier.system || ''}|${identifier.value || ''}`;
    
    if (identifierMap.has(key)) {
      errors.push(`Duplicate identifier at positions ${identifierMap.get(key)} and ${index}`);
    } else {
      identifierMap.set(key, index);
    }
    
    // Validate system format (should be a URI)
    if (identifier.system && !identifier.system.match(/^(http|urn|https):\/\/[^ "]+$/)) {
      errors.push(`Identifier #${index + 1} has invalid system format. Should be a URI.`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
