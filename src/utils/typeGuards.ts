import { Resource } from '@medplum/fhirtypes';

/**
 * Type guard to check if a resource is of a specific FHIR resource type
 * @param resource The resource to check
 * @param resourceType The expected FHIR resource type
 * @returns Boolean indicating if the resource matches the specified type
 */
export function isFhirResource(
  resource: unknown, 
  resourceType: string
): resource is Resource {
  // Check if resource is defined and has a resourceType property
  if (!resource || typeof resource !== 'object') {
    return false;
  }

  // Check if resourceType matches
  return (resource as Resource).resourceType === resourceType;
}

/**
 * Type guard to check if a value is an array of a specific FHIR resource type
 * @param resources The resources to check
 * @param resourceType The expected FHIR resource type
 * @returns Boolean indicating if all resources match the specified type
 */
export function isFhirResourceArray(
  resources: unknown, 
  resourceType: string
): resources is Resource[] {
  // Check if resources is an array
  if (!Array.isArray(resources)) {
    return false;
  }

  // Check if all items are of the specified resource type
  return resources.every(resource => isFhirResource(resource, resourceType));
}
