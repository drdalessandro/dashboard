/**
 * Practitioner Transformers Index
 * Export all transformation utilities from a single location
 */

export * from './practitioner.transformer';

// Re-export commonly used functions for convenience
export { 
  formatPractitionerName,
  extractContactInfo,
  extractQualificationInfo,
  transformPractitionerForDisplay,
  batchTransformPractitioners,
} from './practitioner.transformer';
