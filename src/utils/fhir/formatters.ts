/**
 * FHIR Resource Formatters
 * Standard formatting utilities for FHIR resources in healthcare applications
 * Optimized for healthcare contexts in Mali and Sub-Saharan Africa
 */

import {
  Observation,
  MedicationRequest,
  CodeableConcept
} from '@medplum/fhirtypes';

// Import translations for date formatting
import { getLanguage } from '../../hooks/common/useTranslation';

/**
 * Format a codeable concept into a displayable string
 * 
 * @param concept The FHIR CodeableConcept to format
 * @param options Formatting options
 * @returns Formatted concept string
 */
export function formatCodeableConcept(
  concept?: CodeableConcept,
  options: {
    preferText?: boolean;
    includeCoding?: boolean;
  } = {}
): string {
  if (!concept) return '';

  const { preferText = true, includeCoding = false } = options;

  // If text is available and preferred, use it
  if (preferText && concept.text) {
    return concept.text;
  }

  // Otherwise, use the first coding
  if (concept.coding && concept.coding.length > 0) {
    const coding = concept.coding[0];
    if (includeCoding) {
      return coding.display ? `${coding.display} (${coding.code})` : coding.code || '';
    } else {
      return coding.display || coding.code || '';
    }
  }

  return concept.text || '';
}

/**
 * Format an observation value for display
 * 
 * @param observation The FHIR Observation to format
 * @returns Formatted observation value with units
 */
export function formatObservationValue(observation?: Observation): string {
  if (!observation) return '';

  // Handle different value types
  if (observation.valueQuantity) {
    const value = observation.valueQuantity.value;
    const unit = observation.valueQuantity.unit || observation.valueQuantity.code;
    return unit ? `${value} ${unit}` : `${value}`;
  }

  if (observation.valueString) {
    return observation.valueString;
  }

  if (observation.valueBoolean !== undefined) {
    return observation.valueBoolean ? 'Yes' : 'No';
  }

  if (observation.valueInteger !== undefined) {
    return observation.valueInteger.toString();
  }

  if (observation.valueCodeableConcept) {
    return formatCodeableConcept(observation.valueCodeableConcept);
  }

  // Handle component-based observations (e.g., BP)
  if (observation.component && observation.component.length > 0) {
    return observation.component
      .map(comp => {
        const valueString = comp.valueQuantity
          ? `${comp.valueQuantity.value} ${comp.valueQuantity.unit || ''}`
          : '';

        const name = comp.code ? formatCodeableConcept(comp.code) : '';
        return name ? `${name}: ${valueString}` : valueString;
      })
      .join(', ');
  }

  return 'No value recorded';
}

/**
 * Format a date string for display
 * Supports localization for Mali and Sub-Saharan Africa contexts
 * 
 * @param dateString ISO date string to format
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  dateString?: string,
  options: {
    includeTime?: boolean;
    showRelative?: boolean;
    includeSeconds?: boolean;
    format?: 'short' | 'medium' | 'long' | 'full';
  } = {}
): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid

  const locale = getLanguage() === 'fr' ? 'fr-ML' : 'en-US';
  const { includeTime = false, showRelative = false, includeSeconds = false, format = 'medium' } = options;

  // For very recent dates, show relative time if requested
  if (showRelative) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  // Format date
  let dateOptions: Intl.DateTimeFormatOptions = {
    dateStyle: format as 'short' | 'medium' | 'long' | 'full'
  };

  // Add time if requested
  if (includeTime) {
    dateOptions = {
      ...dateOptions,
      timeStyle: includeSeconds ? 'medium' : 'short'
    };
  }

  try {
    return new Intl.DateTimeFormat(locale, dateOptions).format(date);
  } catch (error) {
    // Fallback formatting if Intl API fails
    return date.toLocaleString(locale);
  }
}

/**
 * Format a medication request for display
 * 
 * @param medicationRequest The FHIR MedicationRequest to format
 * @returns Formatted medication instructions
 */
export function formatMedicationInstructions(medicationRequest?: MedicationRequest): string {
  if (!medicationRequest) return '';

  const parts: string[] = [];

  // Medication name
  if (medicationRequest.medicationCodeableConcept) {
    parts.push(formatCodeableConcept(medicationRequest.medicationCodeableConcept));
  } else if (medicationRequest.medicationReference?.display) {
    parts.push(medicationRequest.medicationReference.display);
  }

  // Dosage instructions
  if (medicationRequest.dosageInstruction && medicationRequest.dosageInstruction.length > 0) {
    const dosage = medicationRequest.dosageInstruction[0];

    // Dose
    if (dosage.doseAndRate && dosage.doseAndRate.length > 0) {
      const doseInfo = dosage.doseAndRate[0];
      if (doseInfo.doseQuantity) {
        parts.push(`${doseInfo.doseQuantity.value} ${doseInfo.doseQuantity.unit || ''}`);
      }
    }

    // Route
    if (dosage.route) {
      parts.push(`via ${formatCodeableConcept(dosage.route)}`);
    }

    // Frequency/timing
    if (dosage.timing?.repeat) {
      const repeat = dosage.timing.repeat;

      if (repeat.frequency !== undefined && repeat.period !== undefined) {
        parts.push(`${repeat.frequency} time(s) every ${repeat.period} ${repeat.periodUnit || 'day(s)'}`);
      }
    }

    // Additional instructions
    if (dosage.text) {
      parts.push(dosage.text);
    }
  }

  return parts.join(', ');
}
