/**
 * PatientAdapter.ts - Enhanced with Full FHIR Patient Resource Support
 * 
 * Adapter for mapping between Patient FHIR resources and form values
 * Enhanced with all 9 additional FHIR fields: telecom (array), deceased, maritalStatus, 
 * photo, contact (array), communication (array), generalPractitioner, managingOrganization, link (array)
 */
import {
  Patient
} from '@medplum/fhirtypes';
import { BaseAdapter, TelecomFormData, PhotoFormData, CommunicationFormData, AddressFormData, ADDRESS_USES, ADDRESS_TYPES, TELECOM_SYSTEMS, TELECOM_USES } from './BaseAdapter';
import { COUNTRIES } from '../utils/countries';
import { validateBirthDate } from '../utils/formatters';
import { 
  MARITAL_STATUS_VALUE_SET, 
  CONTACT_RELATIONSHIP_VALUE_SET, 
  PATIENT_LINK_TYPE_VALUE_SET,
  type PatientLinkTypeCode
} from '../config/fhirValueSets';

// Re-export the common types and constants for backward compatibility
export type { TelecomFormData, PhotoFormData, CommunicationFormData, AddressFormData };
export { ADDRESS_USES, ADDRESS_TYPES, TELECOM_SYSTEMS, TELECOM_USES };

// Re-export FHIR value sets from centralized config
export { MARITAL_STATUS_VALUE_SET, CONTACT_RELATIONSHIP_VALUE_SET, PATIENT_LINK_TYPE_VALUE_SET };

// Legacy constants for backward compatibility - use the centralized value sets instead
export const MARITAL_STATUS_CODES = MARITAL_STATUS_VALUE_SET;
export const CONTACT_RELATIONSHIP_CODES = CONTACT_RELATIONSHIP_VALUE_SET;
export const PATIENT_LINK_TYPES = PATIENT_LINK_TYPE_VALUE_SET.map(item => item.code);

export type CountryCode = typeof COUNTRIES[number]['code'] | undefined;

/**
 * Interface for contact data in form (Patient-specific)
 */
export interface RelatedPersonData {
  relationship: string; // FHIR relationship code
  name: {
    given?: string;
    family?: string;
  };
  telecom: TelecomFormData[];
  address: {
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  gender?: 'male' | 'female' | 'other' | 'unknown';
  organization?: string;
  period?: {
    start?: string;
    end?: string;
  };
}
/**
 * Interface for patient link data in form
 */
export interface PatientLinkFormData {
  other: string; // Patient reference (Patient ID)
  type: PatientLinkTypeCode;
}

/**
 * Enhanced Patient form interface with all FHIR fields
 */
export interface PatientFormValues {
  // Basic name details
  prefix?: string;
  givenName: string;
  middleName?: string;
  familyName: string;
  suffix?: string;

  // Personal details
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;

  // Telecom information
  telecom: TelecomFormData[];

  // Deceased information
  deceased?: boolean;
  deceasedDateTime?: string;

  // Marital status
  maritalStatus?: string; // FHIR marital status code

  // Photo
  photo: PhotoFormData[];

  // Communication preferences
  communication: CommunicationFormData[];

  // Emergency contacts and related persons
  contact: RelatedPersonData[];

  // Healthcare provider references
  generalPractitioner: string[]; // Array of Practitioner IDs
  managingOrganization?: string; // Organization ID

  // Patient links
  link: PatientLinkFormData[];

  // Address details using AddressFormData array
  address: AddressFormData[];

  // Insurance (existing)
  insurance?: string;
}
/**
 * Enhanced PatientAdapter extends BaseAdapter for Patient resources
 */
export class PatientAdapter extends BaseAdapter<Patient, PatientFormValues> {
  /**
   * Convert a Patient FHIR resource to form values
   */
  toFormValues(patient: Patient): PatientFormValues {
    return {
      // Basic name details
      prefix: patient.name?.[0]?.prefix?.[0] || '',
      givenName: patient.name?.[0]?.given?.[0] || '',
      middleName: patient.name?.[0]?.given?.[1] || '',
      familyName: patient.name?.[0]?.family || '',
      suffix: patient.name?.[0]?.suffix?.[0] || '',

      // Personal details
      gender: patient.gender || 'unknown',
      birthDate: patient.birthDate || '',

      // Enhanced telecom array
      telecom: this.convertTelecomToFormData(patient.telecom),

      // Deceased information
      deceased: typeof patient.deceasedBoolean === 'boolean' ? patient.deceasedBoolean : false,
      deceasedDateTime: typeof patient.deceasedDateTime === 'string' ? patient.deceasedDateTime : '',

      // Marital status
      maritalStatus: patient.maritalStatus?.coding?.[0]?.code || '',

      // Photo attachments
      photo: this.convertPhotoToFormData(patient.photo),

      // Communication preferences
      communication: patient.communication?.map(c => ({
        language: c.language?.coding?.[0]?.code || '',
        text: c.language?.text || '',
        preferred: c.preferred || false
      })) || [],

      // Emergency contacts and related persons
      contact: patient.contact?.map(c => ({
        relationship: c.relationship?.[0]?.coding?.[0]?.code || '',
        name: {
          given: c.name?.given?.[0] || '',
          family: c.name?.family || ''
        },
        telecom: this.convertTelecomToFormData(c.telecom),
        address: {
          line: c.address?.line || [],
          city: c.address?.city || '',
          state: c.address?.state || '',
          postalCode: c.address?.postalCode || '',
          country: c.address?.country || ''
        },
        gender: c.gender,
        organization: c.organization?.display || '',
        period: c.period ? {
          start: c.period.start || '',
          end: c.period.end || ''
        } : undefined
      })) || [],
      // Healthcare provider references
      generalPractitioner: patient.generalPractitioner?.map(gp =>
        gp.reference?.replace('Practitioner/', '') || ''
      ) || [],
      managingOrganization: patient.managingOrganization?.reference?.replace('Organization/', '') || '',

      // Patient links
      link: patient.link?.map(l => ({
        other: l.other?.reference?.replace('Patient/', '') || '',
        type: this.validatePatientLinkType(l.type)
      })) || [],

      // Address details using AddressFormData array
      address: this.convertAddressToFormData(patient.address),

      // Insurance identifier
      insurance: patient.identifier?.find(id =>
        id.type?.coding?.[0]?.code === 'MR'
      )?.value || ''
    };
  }

  /**
   * Convert form values to a Patient FHIR resource
   */
  toResource(formValues: PatientFormValues, resourceId?: string): Patient {
    const patient: Patient = {
      resourceType: 'Patient',
      id: resourceId,

      // Name with all components
      name: [{
        use: 'official',
        prefix: formValues.prefix ? [formValues.prefix] : undefined,
        given: [
          formValues.givenName,
          ...(formValues.middleName ? [formValues.middleName] : [])
        ].filter(Boolean),
        family: formValues.familyName,
        suffix: formValues.suffix ? [formValues.suffix] : undefined,
        text: [
          formValues.prefix,
          formValues.givenName,
          formValues.middleName,
          formValues.familyName,
          formValues.suffix
        ].filter(Boolean).join(' ')
      }],

      // Personal details
      gender: formValues.gender,
      birthDate: validateBirthDate(formValues.birthDate),

      // Telecom information
      telecom: this.convertFormDataToTelecom(formValues.telecom),

      // Deceased information - handle both boolean and dateTime cases
      ...(formValues.deceased && {
        ...(formValues.deceasedDateTime
          ? {
            deceasedDateTime: formValues.deceasedDateTime,
            deceasedBoolean: undefined  // Clear boolean if we have a date
          }
          : {
            deceasedBoolean: true,
            deceasedDateTime: undefined  // Clear date if we only have boolean
          }
        )
      }),

      // Marital status
      maritalStatus: formValues.maritalStatus ? {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          code: formValues.maritalStatus,
          display: MARITAL_STATUS_VALUE_SET.find(ms => ms.code === formValues.maritalStatus)?.display
        }]
      } : undefined,
      // Photo attachments
      photo: this.convertFormDataToPhoto(formValues.photo),

      // Communication preferences
      communication: formValues.communication?.map(c => ({
        language: {
          coding: [{
            system: 'urn:ietf:bcp:47',
            code: c.language,
            display: c.text
          }],
          text: c.text
        },
        preferred: c.preferred
      })) || [],

      // Emergency contacts and related persons
      contact: formValues.contact?.map(c => ({
        relationship: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
            code: c.relationship,
            display: CONTACT_RELATIONSHIP_VALUE_SET.find(cr => cr.code === c.relationship)?.display
          }]
        }],
        name: c.name.given || c.name.family ? {
          given: c.name.given ? [c.name.given] : undefined,
          family: c.name.family
        } : undefined,
        telecom: this.convertFormDataToTelecom(c.telecom),
        address: (c.address.line?.length || c.address.city || c.address.country) ? {
          line: c.address.line,
          city: c.address.city,
          state: c.address.state,
          postalCode: c.address.postalCode,
          country: c.address.country
        } : undefined,
        gender: c.gender,
        organization: c.organization ? { display: c.organization } : undefined,
        period: c.period && (c.period.start || c.period.end) ? {
          start: c.period.start,
          end: c.period.end
        } : undefined
      })) || [],

      // Healthcare provider references
      generalPractitioner: formValues.generalPractitioner?.filter(Boolean).map(gp => ({
        reference: `Practitioner/${gp}`,
        type: 'Practitioner'
      })) || [],
      managingOrganization: formValues.managingOrganization ? {
        reference: `Organization/${formValues.managingOrganization}`,
        type: 'Organization'
      } : undefined,

      // Patient links
      link: formValues.link?.map(l => ({
        other: {
          reference: `Patient/${l.other}`,
          type: 'Patient'
        },
        type: l.type
      })) || [],

      // Address using AddressFormData array
      address: this.convertFormDataToAddress(formValues.address),

      // Insurance identifier
      identifier: formValues.insurance ? [{
        type: {
          coding: [{
            code: 'MR',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203'
          }]
        },
        value: formValues.insurance
      }] : undefined
    };

    return patient;
  }
  /**
   * Get default form values for a new patient
   */
  getDefaultFormValues(): PatientFormValues {
    return {
      // Basic details
      prefix: '',
      givenName: '',
      middleName: '',
      familyName: '',
      suffix: '',
      gender: 'unknown',
      birthDate: '',

      // Enhanced telecom array
      telecom: [],

      // New FHIR fields with defaults
      deceased: false,
      deceasedDateTime: '',
      maritalStatus: '',
      photo: [],
      communication: [],
      contact: [],
      generalPractitioner: [],
      managingOrganization: '',
      link: [],

      // Address using AddressFormData array
      address: [],
      
      // Insurance identifier
      insurance: ''
    };
  }

  /**
   * Enhanced validation for all form values
   */
  validateFormValues(formValues: PatientFormValues): boolean {
    // Basic validation - minimum required fields
    return (
      !!formValues.givenName &&
      !!formValues.familyName &&
      !!formValues.gender
    );
  }

  /**
   * Helper Methods
   */


  /**
   * Validate patient link type
   */
  private validatePatientLinkType(type: any): PatientLinkTypeCode {
    return PATIENT_LINK_TYPE_VALUE_SET.find(item => item.code === type)?.code || 'refer';
  }





  /**
   * Get FHIR marital status options
   */
  getMaritalStatusOptions(): typeof MARITAL_STATUS_VALUE_SET {
    return MARITAL_STATUS_VALUE_SET;
  }

  /**
   * Get FHIR contact relationship options  
   */
  getContactRelationshipOptions(): typeof CONTACT_RELATIONSHIP_VALUE_SET {
    return CONTACT_RELATIONSHIP_VALUE_SET;
  }

  /**
   * Get FHIR patient link type options
   */
  getPatientLinkTypeOptions(): typeof PATIENT_LINK_TYPE_VALUE_SET {
    return PATIENT_LINK_TYPE_VALUE_SET;
  }
}

// Export a singleton instance
export const patientAdapter = new PatientAdapter();