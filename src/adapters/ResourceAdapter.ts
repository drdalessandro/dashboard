/**
 * ResourceAdapter.ts
 * 
 * A general interface for adapting between FHIR resources and form values.
 * This pattern allows us to decouple the form data structure from the FHIR resource structure.
 */
import { Resource } from '@medplum/fhirtypes';

/**
 * Base interface for all resource adapters
 */
export interface ResourceAdapter<
  TResource extends Resource,
  TFormValues
> {
  /**
   * Map a FHIR resource to form values
   */
  toFormValues(resource: TResource): TFormValues;

  /**
   * Map form values to a FHIR resource
   */
  toResource(formValues: TFormValues, resourceId?: string): TResource;

  /**
   * Get default form values for a new resource
   */
  getDefaultFormValues(): TFormValues;

  /**
   * Validate form values
   * @returns True if valid, false otherwise
   */
  validateFormValues?(formValues: TFormValues): boolean;

  /**
   * Get validation errors for form values
   * @returns Record of field names and error messages
   */
  getValidationErrors?(formValues: TFormValues): Record<string, string>;
}
