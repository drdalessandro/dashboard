/**
 * Patient Form Validation Utilities
 * Provides comprehensive validation for patient forms
 */

import { Patient, ContactPoint, HumanName, Address } from '@medplum/fhirtypes';

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate patient name
 */
export function validatePatientName(name?: HumanName[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!name || name.length === 0) {
    errors.push({
      field: 'name',
      message: 'Patient name is required',
      severity: 'error'
    });
    return errors;
  }

  const primaryName = name[0];

  if (!primaryName.family && (!primaryName.given || primaryName.given.length === 0)) {
    errors.push({
      field: 'name',
      message: 'Either family name or given name is required',
      severity: 'error'
    });
  }

  if (primaryName.family && primaryName.family.length < 2) {
    errors.push({
      field: 'name.family',
      message: 'Family name should be at least 2 characters',
      severity: 'warning'
    });
  }

  if (primaryName.given) {
    primaryName.given.forEach((givenName, index) => {
      if (givenName && givenName.length < 2) {
        errors.push({
          field: `name.given[${index}]`,
          message: 'Given name should be at least 2 characters',
          severity: 'warning'
        });
      }
    });
  }

  return errors;
}

/**
 * Validate birth date
 */
export function validateBirthDate(birthDate?: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!birthDate) {
    errors.push({
      field: 'birthDate',
      message: 'Birth date is required',
      severity: 'error'
    });
    return errors;
  }

  const date = new Date(birthDate);
  const today = new Date();

  if (isNaN(date.getTime())) {
    errors.push({
      field: 'birthDate',
      message: 'Invalid date format',
      severity: 'error'
    });
  } else if (date > today) {
    errors.push({
      field: 'birthDate',
      message: 'Birth date cannot be in the future',
      severity: 'error'
    });
  } else if (date < new Date('1900-01-01')) {
    errors.push({
      field: 'birthDate',
      message: 'Birth date seems too far in the past',
      severity: 'warning'
    });
  }

  return errors;
}

/**
 * Validate gender
 */
export function validateGender(gender?: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!gender) {
    errors.push({
      field: 'gender',
      message: 'Gender is required',
      severity: 'error'
    });
  } else if (!['male', 'female', 'other', 'unknown'].includes(gender)) {
    errors.push({
      field: 'gender',
      message: 'Invalid gender value',
      severity: 'error'
    });
  }

  return errors;
}

/**
 * Validate contact point (phone/email)
 */
export function validateContactPoint(contact: ContactPoint): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!contact.system || !contact.value) {
    return errors; // Skip validation for empty contacts
  }

  if (contact.system === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.value)) {
      errors.push({
        field: 'telecom.email',
        message: 'Invalid email format',
        severity: 'error'
      });
    }
  } else if (contact.system === 'phone') {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(contact.value)) {
      errors.push({
        field: 'telecom.phone',
        message: 'Invalid phone format',
        severity: 'error'
      });
    }
    if (contact.value.replace(/\D/g, '').length < 7) {
      errors.push({
        field: 'telecom.phone',
        message: 'Phone number seems too short',
        severity: 'warning'
      });
    }
  }

  return errors;
}

/**
 * Validate telecom array
 */
export function validateTelecom(telecom?: ContactPoint[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!telecom || telecom.length === 0) {
    errors.push({
      field: 'telecom',
      message: 'At least one contact method is recommended',
      severity: 'warning'
    });
    return errors;
  }

  telecom.forEach((contact, index) => {
    const contactErrors = validateContactPoint(contact);
    errors.push(...contactErrors.map(error => ({
      ...error,
      field: `telecom[${index}].${error.field.split('.').pop()}`
    })));
  });

  return errors;
}

/**
 * Validate address
 */
export function validateAddress(address?: Address[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!address || address.length === 0) {
    errors.push({
      field: 'address',
      message: 'At least one address is recommended',
      severity: 'warning'
    });
    return errors;
  }

  const primaryAddress = address[0];

  if (!primaryAddress.line || primaryAddress.line.length === 0) {
    errors.push({
      field: 'address.line',
      message: 'Street address is recommended',
      severity: 'warning'
    });
  }

  if (!primaryAddress.city) {
    errors.push({
      field: 'address.city',
      message: 'City is recommended',
      severity: 'warning'
    });
  }

  if (!primaryAddress.country) {
    errors.push({
      field: 'address.country',
      message: 'Country is recommended',
      severity: 'warning'
    });
  }

  if (primaryAddress.postalCode) {
    const postalCodeRegex = /^[\d\s\-A-Za-z]+$/;
    if (!postalCodeRegex.test(primaryAddress.postalCode)) {
      errors.push({
        field: 'address.postalCode',
        message: 'Invalid postal code format',
        severity: 'error'
      });
    }
  }

  return errors;
}

/**
 * Validate identifier
 */
export function validateIdentifier(identifier?: Array<{ system?: string; value?: string }>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!identifier || identifier.length === 0) {
    return errors; // Identifiers are optional
  }

  identifier.forEach((id, index) => {
    if (id.value && id.value.length < 3) {
      errors.push({
        field: `identifier[${index}].value`,
        message: 'Identifier value seems too short',
        severity: 'warning'
      });
    }

    if (id.system && !id.value) {
      errors.push({
        field: `identifier[${index}].value`,
        message: 'Identifier value is required when system is specified',
        severity: 'error'
      });
    }
  });

  return errors;
}

/**
 * Validate entire patient resource
 */
export function validatePatient(patient: Partial<Patient>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate name
  errors.push(...validatePatientName(patient.name));

  // Validate birth date
  errors.push(...validateBirthDate(patient.birthDate));

  // Validate gender
  errors.push(...validateGender(patient.gender));

  // Validate telecom
  errors.push(...validateTelecom(patient.telecom));

  // Validate address
  errors.push(...validateAddress(patient.address));

  // Validate identifier
  errors.push(...validateIdentifier(patient.identifier));

  // Check for critical errors
  const hasErrors = errors.some(error => error.severity === 'error');

  return {
    isValid: !hasErrors,
    errors
  };
}

/**
 * Validate patient form for create operation
 */
export function validatePatientCreate(patient: Partial<Patient>): ValidationResult {
  const result = validatePatient(patient);

  // Additional validation for create operation
  if (!patient.active) {
    result.errors.push({
      field: 'active',
      message: 'New patients should be marked as active',
      severity: 'warning'
    });
  }

  return result;
}

/**
 * Validate patient form for update operation
 */
export function validatePatientUpdate(
  original: Patient,
  updates: Partial<Patient>
): ValidationResult {
  // Merge original with updates for validation
  const merged = { ...original, ...updates };
  
  const result = validatePatient(merged);

  // Additional validation for update operation
  if (updates.id && updates.id !== original.id) {
    result.errors.push({
      field: 'id',
      message: 'Patient ID cannot be changed',
      severity: 'error'
    });
    result.isValid = false;
  }

  return result;
}

/**
 * Get field-specific validation message
 */
export function getFieldValidationMessage(
  field: string,
  errors: ValidationError[]
): string | undefined {
  const fieldError = errors.find(error => 
    error.field === field && error.severity === 'error'
  );
  
  return fieldError?.message;
}

/**
 * Get all validation messages for a field
 */
export function getFieldValidationMessages(
  field: string,
  errors: ValidationError[]
): string[] {
  return errors
    .filter(error => error.field === field)
    .map(error => error.message);
}


/**
 * Validate patient ID
 */
export function validatePatientId(patientId: string | undefined): {
  isValid: boolean;
  diagnosticMessage: string | null;
} {
  if (!patientId) {
    return { isValid: false, diagnosticMessage: 'Patient ID is required' };
  }
  
  if (patientId === 'undefined' || patientId === 'null') {
    return { isValid: false, diagnosticMessage: 'Invalid patient ID' };
  }
  
  // Additional validation for FHIR-compliant IDs
  if (patientId.length === 0 || patientId.length > 64) {
    return { isValid: false, diagnosticMessage: 'Patient ID must be between 1 and 64 characters' };
  }
  
  // FHIR IDs should only contain alphanumeric characters, hyphens, and dots
  const fhirIdRegex = /^[A-Za-z0-9\-\.]+$/;
  if (!fhirIdRegex.test(patientId)) {
    return { isValid: false, diagnosticMessage: 'Patient ID contains invalid characters' };
  }
  
  return { isValid: true, diagnosticMessage: null };
}
