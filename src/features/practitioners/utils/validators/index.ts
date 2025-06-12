/**
 * Practitioner Validators Index
 * Export all validation utilities from a single location
 */

export * from './practitioner.validator';

// Re-export commonly used functions for convenience
export { 
  validatePractitionerForm,
  validatePractitionerResource,
  validateName,
  validateBirthDate,
  validateContact,
  validateAddress,
} from './practitioner.validator';
