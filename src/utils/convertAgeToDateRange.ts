/**
 * Utility function to convert age range to date range for FHIR-compliant patient search
 * Follows internationalization and type-safety principles
 */
export interface AgeRangeDateParams {
  minDate?: string;
  maxDate?: string;
}

/**
 * Converts age range to date range for patient search
 * @param minAge Minimum age in years
 * @param maxAge Maximum age in years
 * @returns Object with minDate and maxDate in YYYY-MM-DD format
 */
export function convertAgeToDateRange(
  minAge: number,
  maxAge: number
): AgeRangeDateParams {
  // Validate input ages
  const validMinAge = Math.max(0, Math.min(minAge, 150));
  const validMaxAge = Math.max(0, Math.min(maxAge, 150));

  // Get current date
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 0-indexed
  const currentDay = currentDate.getDate();

  // Calculate min and max birth dates based on age
  const minBirthDate = new Date(
    currentYear - validMaxAge,
    currentMonth - 1,
    currentDay
  );

  const maxBirthDate = new Date(
    currentYear - validMinAge,
    currentMonth - 1,
    currentDay
  );

  // Format dates to YYYY-MM-DD for FHIR compliance
  const formatDate = (date: Date): string =>
    date.toISOString().split('T')[0];

  return {
    minDate: formatDate(minBirthDate),
    maxDate: formatDate(maxBirthDate)
  };
}

/**
 * Converts age range to FHIR-compliant date search parameters
 * @param minAge Minimum age in years
 * @param maxAge Maximum age in years
 * @returns FHIR-compliant date search parameters
 */
export function constructFHIRDateSearchParams(
  minAge: number,
  maxAge: number
): string {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();

  // Calculate min and max birth dates based on age
  const minBirthDate = new Date(
    currentYear - Math.max(0, Math.min(maxAge, 150)),
    currentMonth - 1,
    currentDay
  );

  const maxBirthDate = new Date(
    currentYear - Math.max(0, Math.min(minAge, 150)),
    currentMonth - 1,
    currentDay
  );

  // Format dates to YYYY-MM-DD for FHIR compliance
  const formatDate = (date: Date): string =>
    date.toISOString().split('T')[0];

  // Construct date search parameters
  const formattedMinDate = formatDate(minBirthDate);
  const formattedMaxDate = formatDate(maxBirthDate);

  // Return in the format ge1875-03-16
  // TODO fix format to return ge1875-03-16&le1875-03-16
  return `ge${formattedMinDate}`;
}

/**
 * Converts age range to FHIR-compliant date search parameters
 * @param minAge Minimum age in years
 * @param maxAge Maximum age in years
 * @returns FHIR-compliant date search parameters array
 */

export function constructFHIRDateSearchParamsArray(
  minAge: number,
  maxAge: number
): string[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();

  // Calculate min and max birth dates based on age
  const minBirthDate = new Date(
    currentYear - Math.max(0, Math.min(maxAge, 150)),
    currentMonth - 1,
    currentDay
  );

  const maxBirthDate = new Date(
    currentYear - Math.max(0, Math.min(minAge, 150)),
    currentMonth - 1,
    currentDay
  );

  // Format dates to YYYY-MM-DD for FHIR compliance
  const formatDate = (date: Date): string =>
    date.toISOString().split('T')[0];

  const formattedMinDate = formatDate(minBirthDate);
  const formattedMaxDate = formatDate(maxBirthDate);

  // Return an array of date search parameters
  return [
    `ge${formattedMinDate}`,
    `le${formattedMaxDate}`
  ];
}

/**
 * Converts FHIR date search parameters to standard search format
 * @param dateSearchParams FHIR date search parameters
 * @returns Standardized search parameters
 */
export function convertFHIRDateSearchToStandardParams(
  dateSearchParams: Record<string, string>
): Record<string, string> {
  const standardParams: Record<string, string> = {};

  // Map FHIR date search parameters to standard format
  Object.entries(dateSearchParams).forEach(([key, value]) => {
    // Extract comparison operator and date
    const match = value.match(/^(eq|ne|gt|ge|lt|le)(.+)$/);
    if (match) {
      const [, operator, date] = match;
      standardParams[`${key}${operator.toUpperCase()}`] = date;
    }
  });

  return standardParams;
}

/**
 * Constructs search parameters for patient search based on age range
 * @param minAge Minimum age in years
 * @param maxAge Maximum age in years
 * @returns Search parameters object
 */
export function constructAgeSearchParams(
  minAge: number,
  maxAge: number
): Record<string, string> {
  const fhirSearchParams = constructFHIRDateSearchParams(minAge, maxAge);

  // Parse the query string back into an object
  return fhirSearchParams.split('&').reduce((acc, param) => {
    const [key, value] = param.split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Converts FHIR date search parameters to a URL query string
 * @param dateSearchParams FHIR date search parameters
 * @returns URL-compatible date search query string
 */
export function constructDateSearchQueryString(
  dateSearchParams: Record<string, string>
): string {
  // Convert FHIR date search parameters to URL query string
  return Object.entries(dateSearchParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
}
