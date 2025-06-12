/**
 * Utility function to parse and validate search parameters
 * Follows FHIR-compliant and type-safe parsing principles
 */
import { constructFHIRDateSearchParams } from './convertAgeToDateRange';

export interface SearchParams {
  name?: string;
  gender?: string[];
  ageRange?: {
    min: number;
    max: number;
  };
  // birthdate?: string[];
  // Allow dynamic key access for date search parameters
  [key: string]: any;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export function parseSearchParams(params: Record<string, any>): SearchParams {
  const parsedParams: SearchParams = {};

  // Handle name
  if (typeof params.name === 'string') {
    parsedParams.name = params.name;
  }

  // Handle gender array
  if (Array.isArray(params.gender) && params.gender.length > 0) {
    parsedParams.gender = params.gender.filter(Boolean);
  }

  // Handle gender string
  if (typeof params.gender === 'string') {
    parsedParams.gender = [params.gender];
  }

  // Handle age range and convert to searchparams
  if (params.ageRange && typeof params.ageRange === 'object' && (params.ageRange.min !== undefined || params.ageRange.max !== undefined)) {
    // set a default value for the min and/max if undefined
    if (params.ageRange.min === undefined) params.ageRange.min = 0;
    if (params.ageRange.max === undefined) params.ageRange.max = 150;
    const { min, max } = params.ageRange;
    // Convert age range to FHIR-compliant date search parameters
    parsedParams['birthdate'] = constructFHIRDateSearchParams(min, max);
  }

  // Handle sorting to return a string like this _sort=-probability
  if (params._sort) {
    parsedParams._sort = `${params._order === 'desc' ? '-' : ''}${params._sort}`;
  }

  return parsedParams;
}
