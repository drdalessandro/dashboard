/**
 * PractitionerAdapter.ts - Enhanced
 * 
 * Adapter for mapping between Practitioner FHIR resources and form values
 * Enhanced with additional FHIR fields: birthDate, photo, communication, identifier
 */
import { Practitioner } from '@medplum/fhirtypes';
import { BaseAdapter, TelecomFormData, AddressFormData, PhotoFormData, CommunicationFormData } from './BaseAdapter';
import { 
  NAME_PREFIX_VALUE_SET, 
  NAME_SUFFIX_VALUE_SET
} from '../config/fhirValueSets';

// Re-export the common types for backward compatibility
export type { TelecomFormData, AddressFormData, PhotoFormData, CommunicationFormData };

/**
 * Interface for qualification data in form
 */
export interface QualificationFormData {
  identifier?: string;
  code: string;
  period?: {
    start?: string;
    end?: string;
  };
  issuer?: {
    reference: string;
    display: string;
  };
}


/**
 * Enhanced Interface for Practitioner form values with additional FHIR fields
 */
export interface PractitionerFormValues {
  id: string;
  active: boolean;
  identifier?: string; // NINA or other national identifier
  firstName: string;
  lastName: string;
  prefix?: string;
  suffix?: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string; // ISO date string (YYYY-MM-DD)
  qualifications?: QualificationFormData[];
  telecom: TelecomFormData[];
  address: AddressFormData[];
  photo?: PhotoFormData[];
  communication: CommunicationFormData[];
}

/**
 * PractitionerAdapter implements ResourceAdapter for Practitioner resources
 */
export class PractitionerAdapter extends BaseAdapter<Practitioner, PractitionerFormValues> {
  /**
   * Convert a Practitioner FHIR resource to form values
   */
  toFormValues(practitioner: Practitioner): PractitionerFormValues {
    return {
      id: practitioner.id || '',
      identifier: practitioner.identifier?.[0]?.value || '', // Extract first identifier (NINA)
      firstName: practitioner.name?.[0]?.given?.[0] || '',
      lastName: practitioner.name?.[0]?.family || '',
      prefix: practitioner.name?.[0]?.prefix?.[0] || '',
      suffix: practitioner.name?.[0]?.suffix?.[0] || '',
      gender: practitioner.gender || 'unknown',
      birthDate: practitioner.birthDate || '',
      active: practitioner.active || false,

      // Convert qualifications
      qualifications: practitioner.qualification?.map(q => ({
        identifier: q.identifier?.[0]?.value || '',
        code: q.code?.text || q.code?.coding?.[0]?.display || '',
        period: q.period ? {
          start: q.period.start || '',
          end: q.period.end || ''
        } : undefined,
        issuer: q.issuer ? {
          reference: q.issuer.reference || '',
          display: q.issuer.display || ''
        } : undefined
      })) || [],

      // Convert telecom details
      telecom: this.convertTelecomToFormData(practitioner.telecom),

      // Convert address
      address: this.convertAddressToFormData(practitioner.address),

      // Convert photo attachments
      photo: this.convertPhotoToFormData(practitioner.photo),

      // Convert communication languages
      communication: this.convertCommunicationToFormData(practitioner.communication)
    };
  }

  /**
   * Convert form values to a Practitioner FHIR resource
   */
  toResource(formValues: PractitionerFormValues, resourceId?: string): Practitioner {
    console.log('PractitionerAdapter.toResource called with qualifications:', formValues.qualifications);
    return {
      resourceType: 'Practitioner',
      id: resourceId || formValues.id,

      // Identifier (NINA)
      identifier: formValues.identifier ? [{
        system: 'urn:oid:2.16.854.1.4.99.1', // NINA system identifier
        value: formValues.identifier
      }] : undefined,

      // Name
      name: [
        {
          prefix: formValues.prefix ? [formValues.prefix] : undefined,
          given: [formValues.firstName],
          family: formValues.lastName,
          suffix: formValues.suffix ? [formValues.suffix] : undefined
        }
      ],

      // active
      active: formValues.active,

      // Gender and birthDate
      gender: formValues.gender,
      birthDate: formValues.birthDate || undefined,

      // Qualifications
      qualification: formValues.qualifications?.map(q => ({
        identifier: q.identifier ? [{
          value: q.identifier
        }] : undefined,
        code: {
          text: q.code
        },
        period: q.period ? {
          start: q.period.start || undefined,
          end: q.period.end || undefined
        } : undefined,
        issuer: q.issuer ? {
          reference: q.issuer.reference || '',
          display: q.issuer.display || ''
        } : undefined
      })),

      // Telecom details
      telecom: this.convertFormDataToTelecom(formValues.telecom || []),

      // Address
      address: this.convertFormDataToAddress(formValues.address || []),

      // Photo attachments
      photo: this.convertFormDataToPhoto(formValues.photo || []),

      // Communication languages
      communication: this.convertFormDataToCommunication(formValues.communication || [])
    };
  }

  /**
   * Get default form values for a new practitioner
   */
  getDefaultFormValues(): PractitionerFormValues {
    return {
      id: '',
      active: true,
      identifier: '',
      firstName: '',
      lastName: '',
      prefix: '',
      suffix: '',
      gender: 'unknown',
      birthDate: '',
      qualifications: [],
      telecom: [],
      address: [],
      photo: [],
      communication: []
    };
  }

  /**
   * Validate form values
   */
  validateFormValues(formValues: PractitionerFormValues): boolean {
    // Basic validation - at minimum need first and last name
    return !!formValues.firstName && !!formValues.lastName;
  }

  /**
   * Helper methods
   */



  /**
   * Get prefix options
   */
  getPrefixOptions(): typeof NAME_PREFIX_VALUE_SET {
    return NAME_PREFIX_VALUE_SET;
  }

  /**
   * Get suffix options
   */
  getSuffixOptions(): typeof NAME_SUFFIX_VALUE_SET {
    return NAME_SUFFIX_VALUE_SET;
  }
}

// Export a singleton instance
export const practitionerAdapter = new PractitionerAdapter();