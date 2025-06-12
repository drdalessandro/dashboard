/**
 * FHIR Search Utilities
 * Helper functions for FHIR search operations
 * Optimized for healthcare contexts in Mali and Sub-Saharan Africa
 */

import { Resource } from '@medplum/fhirtypes';

/**
 * Generate a quick search query string from a resource
 * Used for client-side filtering and searching in offline mode
 * 
 * @param resource FHIR resource to generate search text from
 * @returns Search query string derived from the resource
 */
export function getQuickQuery(resource: Resource): string {
  if (!resource) return '';
  
  const searchTexts: string[] = [];
  
  // Add resource type and ID to search text
  searchTexts.push(resource.resourceType);
  if (resource.id) {
    searchTexts.push(resource.id);
  }
  
  // Extract searchable text based on resource type
  switch (resource.resourceType) {
    case 'Patient': {
      const patient = resource as any;
      
      // Extract names
      if (patient.name && Array.isArray(patient.name)) {
        patient.name.forEach((name: any) => {
          if (name.given && Array.isArray(name.given)) {
            searchTexts.push(...name.given);
          }
          if (name.family) {
            searchTexts.push(name.family);
          }
        });
      }
      
      // Extract identifiers
      if (patient.identifier && Array.isArray(patient.identifier)) {
        patient.identifier.forEach((id: any) => {
          if (id.value) {
            searchTexts.push(id.value);
          }
        });
      }
      
      // Extract telecom
      if (patient.telecom && Array.isArray(patient.telecom)) {
        patient.telecom.forEach((telecom: any) => {
          if (telecom.value) {
            searchTexts.push(telecom.value);
          }
        });
      }
      
      // Add gender and birth date
      if (patient.gender) {
        searchTexts.push(patient.gender);
      }
      if (patient.birthDate) {
        searchTexts.push(patient.birthDate);
      }
      
      break;
    }
    
    case 'Practitioner': {
      const practitioner = resource as any;
      
      // Extract names
      if (practitioner.name && Array.isArray(practitioner.name)) {
        practitioner.name.forEach((name: any) => {
          if (name.given && Array.isArray(name.given)) {
            searchTexts.push(...name.given);
          }
          if (name.family) {
            searchTexts.push(name.family);
          }
        });
      }
      
      // Extract qualifications
      if (practitioner.qualification && Array.isArray(practitioner.qualification)) {
        practitioner.qualification.forEach((qual: any) => {
          if (qual.code && qual.code.text) {
            searchTexts.push(qual.code.text);
          }
          if (qual.code && qual.code.coding && Array.isArray(qual.code.coding)) {
            qual.code.coding.forEach((coding: any) => {
              if (coding.display) {
                searchTexts.push(coding.display);
              }
            });
          }
        });
      }
      
      break;
    }
    
    case 'Observation': {
      const observation = resource as any;
      
      // Extract code
      if (observation.code) {
        if (observation.code.text) {
          searchTexts.push(observation.code.text);
        }
        if (observation.code.coding && Array.isArray(observation.code.coding)) {
          observation.code.coding.forEach((coding: any) => {
            if (coding.display) {
              searchTexts.push(coding.display);
            }
            if (coding.code) {
              searchTexts.push(coding.code);
            }
          });
        }
      }
      
      // Extract values
      if (observation.valueString) {
        searchTexts.push(observation.valueString);
      }
      if (observation.valueCodeableConcept && observation.valueCodeableConcept.text) {
        searchTexts.push(observation.valueCodeableConcept.text);
      }
      
      break;
    }
    
    case 'MedicationRequest': {
      const medicationRequest = resource as any;
      
      // Extract medication
      if (medicationRequest.medicationCodeableConcept) {
        if (medicationRequest.medicationCodeableConcept.text) {
          searchTexts.push(medicationRequest.medicationCodeableConcept.text);
        }
        if (medicationRequest.medicationCodeableConcept.coding && Array.isArray(medicationRequest.medicationCodeableConcept.coding)) {
          medicationRequest.medicationCodeableConcept.coding.forEach((coding: any) => {
            if (coding.display) {
              searchTexts.push(coding.display);
            }
            if (coding.code) {
              searchTexts.push(coding.code);
            }
          });
        }
      }
      
      // Extract dosage instructions
      if (medicationRequest.dosageInstruction && Array.isArray(medicationRequest.dosageInstruction)) {
        medicationRequest.dosageInstruction.forEach((dosage: any) => {
          if (dosage.text) {
            searchTexts.push(dosage.text);
          }
        });
      }
      
      break;
    }
  }
  
  // Filter out empty strings and join
  return searchTexts
    .filter(Boolean)
    .map(text => text.toString().toLowerCase())
    .join(' ');
}

/**
 * Build a FHIR search parameters object from filter criteria
 * Useful for constructing FHIR API queries
 * 
 * @param resourceType The FHIR resource type to search
 * @param filters Filter criteria to convert to search parameters
 * @returns FHIR search parameters object
 */
export function buildFhirSearchParams(
  resourceType: string,
  filters: Record<string, any> = {}
): Record<string, string> {
  const searchParams: Record<string, string> = {};
  
  // Convert filters to FHIR search parameters based on resource type
  switch (resourceType) {
    case 'Patient':
      // Name search
      if (filters.name) {
        searchParams.name = filters.name;
      }
      
      // Identifier search
      if (filters.identifier) {
        searchParams.identifier = filters.identifier;
      }
      
      // Gender filter
      if (filters.gender) {
        searchParams.gender = filters.gender;
      }
      
      // Birth date range
      if (filters.birthDate) {
        if (filters.birthDate.start) {
          searchParams['birth-date=ge'] = filters.birthDate.start;
        }
        if (filters.birthDate.end) {
          searchParams['birth-date=le'] = filters.birthDate.end;
        }
      }
      
      // Active status
      if (filters.active !== undefined) {
        searchParams.active = filters.active.toString();
      }
      
      break;
      
    case 'Observation':
      // Code search
      if (filters.code) {
        searchParams.code = filters.code;
      }
      
      // Patient reference
      if (filters.patient) {
        searchParams.subject = `Patient/${filters.patient}`;
      } else if (filters.subject) {
        searchParams.subject = filters.subject;
      }
      
      // Date range
      if (filters.date) {
        if (filters.date.start) {
          searchParams['date=ge'] = filters.date.start;
        }
        if (filters.date.end) {
          searchParams['date=le'] = filters.date.end;
        }
      }
      
      // Status filter
      if (filters.status) {
        searchParams.status = filters.status;
      }
      
      break;
      
    case 'MedicationRequest':
      // Patient reference
      if (filters.patient) {
        searchParams.subject = `Patient/${filters.patient}`;
      } else if (filters.subject) {
        searchParams.subject = filters.subject;
      }
      
      // Status filter
      if (filters.status) {
        searchParams.status = filters.status;
      }
      
      // Medication search
      if (filters.medication) {
        searchParams.medication = filters.medication;
      }
      
      // Author date range
      if (filters.authoredOn) {
        if (filters.authoredOn.start) {
          searchParams['authored=ge'] = filters.authoredOn.start;
        }
        if (filters.authoredOn.end) {
          searchParams['authored=le'] = filters.authoredOn.end;
        }
      }
      
      break;
      
    case 'Practitioner':
      // Name search
      if (filters.name) {
        searchParams.name = filters.name;
      }
      
      // Identifier search
      if (filters.identifier) {
        searchParams.identifier = filters.identifier;
      }
      
      // Qualification search
      if (filters.qualification) {
        searchParams.qualification = filters.qualification;
      }
      
      break;
      
    default:
      // Generic handling for other resource types
      // Just pass through the filters directly for simple cases
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams[key] = value.toString();
        }
      });
  }
  
  return searchParams;
}

/**
 * Filter a list of resources based on a search query
 * Useful for client-side filtering, especially in offline mode
 * 
 * @param resources Array of resources to filter
 * @param query Search query to filter by
 * @returns Filtered array of resources
 */
export function filterResourcesBySearchQuery<T extends Resource>(
  resources: T[],
  query: string
): T[] {
  if (!query || query.trim() === '') {
    return resources;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  const terms = normalizedQuery.split(/\s+/);
  
  return resources.filter(resource => {
    const searchText = getQuickQuery(resource);
    
    // Check if all search terms are found in the resource's search text
    return terms.every(term => searchText.includes(term));
  });
}

/**
 * Sort resources based on a sort parameter
 * Supports common sorting patterns for FHIR resources
 * 
 * @param resources Array of resources to sort
 * @param sortField Field to sort by
 * @param sortOrder Sort direction ('asc' or 'desc')
 * @returns Sorted array of resources
 */
export function sortResources<T extends Resource>(
  resources: T[],
  sortField: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): T[] {
  return [...resources].sort((a, b) => {
    let valueA: any;
    let valueB: any;
    
    // Extract the values based on the sort field and resource type
    switch (sortField) {
      case 'name':
        if (a.resourceType === 'Patient' || a.resourceType === 'Practitioner') {
          const patientA = a as any;
          const patientB = b as any;
          
          valueA = patientA.name && patientA.name[0] ? 
            (patientA.name[0].family || '') + ' ' + ((patientA.name[0].given || []).join(' ') || '') : '';
            
          valueB = patientB.name && patientB.name[0] ? 
            (patientB.name[0].family || '') + ' ' + ((patientB.name[0].given || []).join(' ') || '') : '';
        } else {
          valueA = (a as any).name || '';
          valueB = (b as any).name || '';
        }
        break;
        
      case 'date':
      case 'birthDate':
      case 'effectiveDateTime':
      case 'authoredOn':
        valueA = (a as any)[sortField] ? new Date((a as any)[sortField]).getTime() : 0;
        valueB = (b as any)[sortField] ? new Date((b as any)[sortField]).getTime() : 0;
        break;
        
      case 'status':
        valueA = (a as any).status || '';
        valueB = (b as any).status || '';
        break;
        
      case 'id':
        valueA = a.id || '';
        valueB = b.id || '';
        break;
        
      default:
        // Generic fallback for other fields
        valueA = (a as any)[sortField] !== undefined ? (a as any)[sortField] : '';
        valueB = (b as any)[sortField] !== undefined ? (b as any)[sortField] : '';
    }
    
    // Perform the comparison
    let comparison = 0;
    if (valueA > valueB) {
      comparison = 1;
    } else if (valueA < valueB) {
      comparison = -1;
    }
    
    // Reverse the comparison if descending order
    return sortOrder === 'desc' ? -comparison : comparison;
  });
}
