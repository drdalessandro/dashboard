// src/data/utils/formatters.ts
// Utility functions for formatting FHIR resources

import { Patient, Practitioner } from '@medplum/fhirtypes';
import { createLogger } from './logger';
import { COUNTRIES } from './countries';

const logger = createLogger('Formatters');
const translate = (key: string) => key;

// Create a type for the translate function
type TranslateFunction = (key: string) => string;

/**
 * Format a date for display
 * @param date Date string in ISO format
 * @param includeTime Whether to include time in the formatted date
 * @returns Formatted date string
 */
export function validateAndFormatDate(date: string | undefined, includeTime = false, translate: TranslateFunction = (key) => key): string {
  if (!date) return '';

  try {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      logger.error(translate('common.invalidDate'), date);
      return '';
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    logger.error(translate('common.errorFormattingDate'), error);
    return '';
  }
}

/**
 * Format a patient's address for display
 * @param patient Patient resource
 * @returns Formatted address string
 */
export function formatAddress(patient: Patient, translate: TranslateFunction = (key) => key): string {
  if (!patient || !patient.address || patient.address.length === 0) {
    return '';
  }

  const address = patient.address[0];
  const line = Array.isArray(address.line) ? address.line.join(', ') : (address.line || '');
  const city = address.city || '';
  const state = address.state || '';
  const postalCode = address.postalCode || '';
  const country = address.country || '';

  const parts = [line, city, state, postalCode, country].filter(part => part.trim() !== '');

  return parts.join(', ');
}

// get country code
export function getCountryCode(country?: string | null) {
  // If country is undefined, null, or empty string, return undefined
  if (!country) {
    return undefined;
  }

  // Trim and normalize the country name
  const normalizedCountry = country.trim();

  // Find the country code, handling case-insensitivity
  const countryCode = COUNTRIES.find(
    c => c.name.toLowerCase() === normalizedCountry.toLowerCase() || c.code === normalizedCountry
  )?.code;

  // If no matching country found, return undefined
  if (!countryCode) {
    console.warn(`Invalid country: ${country}. Defaulting to undefined.`);
    return undefined;
  }

  return countryCode;
}

/**
 * Calculate patient age from birth date
 * @param birthDate Birth date string in ISO format
 * @returns Age in years or empty string if birthDate is invalid
 */
export function calculateAge(birthDate: string | undefined, translate: TranslateFunction = (key) => key): string {
  if (!birthDate) return '';

  try {
    const birthDateObj = new Date(birthDate);

    if (isNaN(birthDateObj.getTime())) {
      logger.error(translate('patient.common.invalidDate'), birthDate);
      return '';
    }

    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }

    return age.toString();
  } catch (error) {
    logger.error(translate('patient.errorCalculatingAge'), error);
    return '';
  }
}

/**
 * Validate and format birthDate for FHIR Patient resources
 * Ensures date is in YYYY-MM-DD format and is a valid date
 * @param birthDate Date string to validate
 * @returns Validated and formatted date string or undefined
 */
export function validateBirthDate(birthDate: string | undefined): string | undefined {
  if (!birthDate) return undefined;

  // Remove any whitespace
  const trimmedDate = birthDate.trim();

  // Check if the date matches YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(trimmedDate)) {
    try {
      // Try parsing and reformatting various date inputs
      const parsedDate = new Date(trimmedDate);

      // Validate the parsed date
      if (isNaN(parsedDate.getTime())) {
        logger.error(translate('patient.common.invalidDate'), trimmedDate);
        return undefined;
      }

      // Format to YYYY-MM-DD
      return parsedDate.toISOString().split('T')[0];
    } catch (error) {
      logger.error(translate('patient.common.invalidDate'), error);
      return undefined;
    }
  }

  // If already in correct format, validate the date
  const parsedDate = new Date(trimmedDate);
  if (isNaN(parsedDate.getTime())) {
    logger.error(translate('patient.common.invalidDate'), trimmedDate);
    return undefined;
  }

  return trimmedDate;
}
