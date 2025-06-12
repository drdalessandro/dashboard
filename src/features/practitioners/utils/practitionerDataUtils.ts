/**
 * Practitioner Data Utilities
 * Handles data transformation and processing for practitioner-related components
 * Ensures consistent data access patterns across the application
 */

import { Address, Practitioner } from '@medplum/fhirtypes';
import { format, differenceInYears } from 'date-fns';
import { TFunction } from 'i18next';

/**
 * Extended practitioner data structure for UI display
 */
export interface PractitionerData {
  id: string;
  name: {
    given?: string[];
    family?: string;
    text?: string;
    use?: string;
  }[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  qualification?: {
    code: string;
    issuer: { reference: string; display: string };
    period: { start: string, end: string };
  }[];
  telecom?: Array<{
    system: string;
    value: string;
    use?: string;
  }>;
  address?: Array<{
    city?: string;
    country?: string;
    use?: string;
    text?: string;
  }>;
  status?: 'active' | 'inactive';
  joinDate?: string;
  _offline?: boolean;
}

export interface PractitionerDisplayData {
  id: string;
  name: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  age?: number;
  phoneNumbers: Array<{ system: string; value: string }>;
  email?: Array<{ system: string; value: string }>;
  address?: string;
  city?: string;
  country?: string;
  qualification?: Array<{ code: { coding: Array<{ display: string }> }; issuer: { reference: string; display: string }; period: { start: string, end: string } }>;
  specialties: string[];
  status: 'active' | 'inactive';
  joinDate?: string;
  lastUpdated?: string;
  availableTime: string[];
  languages: string[];
  bio: string;
  photo?: string;
  patientCount: number;
  appointmentStats: {
    total: number;
    completed: number;
    cancelled: number;
  };
  careTeam: Array<{
    organization: string;
    department: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  experience: Array<{
    position: string;
    organization: string;
    period: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
}

export function formatPractitionerName(
  practitioner: Practitioner,
  t: (key: string, options?: any) => string = (key) => key.split(':').pop() || key
): string {
  if (!practitioner.name || practitioner.name.length === 0) {
    return t('practitioner:unknownPractitioner');
  }

  const name = practitioner.name[0];
  if (name.text) {
    return name.text;
  }

  const parts: string[] = [];
  if (name.given) {
    parts.push(...name.given);
  }
  if (name.family) {
    parts.push(name.family);
  }

  return parts.length > 0 ? parts.join(' ') : t('practitioner:unknownPractitioner');
}

export function extractNameParts(practitioner: Practitioner): { prefix?: string; firstName?: string; lastName?: string } {
  if (!practitioner.name || practitioner.name.length === 0) {
    return {};
  }
  const name = practitioner.name[0];
  return {
    prefix: name.prefix?.[0],
    firstName: name.given?.[0],
    lastName: name.family
  };
}

export function extractPhone(practitioner: Practitioner): Array<{ system: string, value: string }> {
  if (!practitioner.telecom) return [];
  return practitioner.telecom
    .filter(contact => contact.system === 'phone' && contact.value)
    .map(contact => ({
      system: contact.use || 'phone',
      value: contact.value as string
    }));
}

export function extractEmail(practitioner: Practitioner): Array<{ system: string, value: string }> {
  if (!practitioner.telecom) return [];
  return practitioner.telecom
    .filter(contact => contact.system === 'email' && contact.value)
    .map(contact => ({
      system: contact.use || 'email',
      value: contact.value as string
    }));
}

export function extractPhoto(practitioner: Practitioner): string | undefined {
  if (!practitioner.photo || practitioner.photo.length === 0) {
    return undefined;
  }
  const photo = practitioner.photo[0];
  if (photo.data) {
    const contentType = photo.contentType || 'image/jpeg';
    return `data:${contentType};base64,${photo.data}`;
  }
  return photo.url;
}

export function extractLanguages(practitioner: Practitioner): string[] {
  return practitioner.communication?.map(communication =>
    communication.text || communication.coding?.[0]?.display
  ).filter((lang): lang is string => !!lang) || [];
}

export function extractAddress(practitioner: Practitioner): {
  address?: string;
  line?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
} {
  if (!practitioner.address || practitioner.address.length === 0) {
    return {};
  }
  const address = practitioner.address[0];
  return {
    address: formatAddress(address),
    line: address.line?.join(', '),
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country
  };
}

// format complete address with new line
export function formatAddress(address: Address): string {
  const addressParts: string[] = [];
  if (address.line) {
    addressParts.push(...address.line);
  }
  if (address.city) {
    addressParts.push(address.city);
  }
  if (address.state) {
    addressParts.push(address.state);
  }
  if (address.postalCode) {
    addressParts.push(address.postalCode);
  }
  if (address.country) {
    addressParts.push(address.country);
  }
  return addressParts.join('\n');
}

export function formatName(practitioner: PractitionerData): string {
  if (!practitioner.name || practitioner.name.length === 0) {
    return 'Unknown Practitioner';
  }
  const name = practitioner.name[0];
  const parts = [];
  if (name.given) {
    parts.push(...name.given);
  }
  if (name.family) {
    parts.push(name.family);
  }
  return parts.join(' ');
}

export function getEmail(practitioner: PractitionerData): string {
  return practitioner.telecom?.find(t => t.system === 'email')?.value || '';
}

export function getPhone(practitioner: PractitionerData): string {
  return practitioner.telecom?.find(t => t.system === 'phone')?.value || '';
}

export function getQualification(practitioner: PractitionerData): string {
  return practitioner.qualification?.[0]?.code || '';
}

export function getLocation(practitioner: PractitionerData): string {
  const address = practitioner.address?.[0];
  if (!address) return '';
  return [address.city, address.country].filter(Boolean).join(', ');
}

// #TODO: extract careteam organization

// #TODO: implement calculateExperience from careteam organization
export function calculateExperience(
  practitioner: Practitioner | PractitionerData,
  t: (key: string, options?: any) => string = (key: string) => key.split(':').pop() || key
): string {
  if (!('qualification' in practitioner) || !practitioner.qualification?.[0]?.period?.start) {
    return t('practitioner:experienceNotAvailable');
  }

  try {
    const startDate = new Date(practitioner.qualification[0].period.start);
    const years = differenceInYears(new Date(), startDate);
    return `${years}+ ${t('practitioner:yearsExperience')}`;
  } catch (error) {
    return t('practitioner:experienceNotAvailable');
  }
}

// extractQualification map
export function extractQualification(
  practitioner: Practitioner,
  _t?: TFunction | ((key: string, options?: any) => string)
): Array<{
  code: {
    coding: Array<{ display: string }>
  };
  issuer: { reference: string; display: string };
  period: { start: string; end: string }
}> {
  if (!practitioner.qualification || !Array.isArray(practitioner.qualification)) {
    return [];
  }

  return practitioner.qualification
    .filter((q) => {
      // At minimum, we need some qualification text or display
      return !!(
        q.code
      );
    })
    .map(q => ({
      code: {
        coding: q.code?.coding?.map(c => ({
          display: c.display || q.code?.text || ''
        })) || [{ display: q.code?.text || '' }]
      },
      issuer: {
        reference: q.issuer?.reference || '',
        display: q.issuer?.display || 'Unknown Institution'
      },
      period: {
        start: q.period?.start || '',
        end: q.period?.end || ''
      }
    }));
}

export function extractSpecialties(
  practitioner: Practitioner,
  t: TFunction | ((key: string, options?: any) => string) = (key: string) => key.split(':').pop() || key
): string[] {
  if (!practitioner.qualification?.[0]?.code) {
    return [t('practitioner:noSpecialty')];
  }
  return practitioner.qualification
    .map(q => {
      const code = q.code;
      if (!code) return null;

      // Extract display text from code
      if (code.text) {
        return code.text;
      }
      if (code.coding?.[0]?.display) {
        return code.coding[0].display;
      }
      return null;
    })
    .filter((s): s is string => !!s);
}

export function getFormattedJoinDate(
  practitioner: Practitioner,
  t: TFunction | ((key: string) => string) = (key: string) => key.split(':').pop() || key
): string {
  const joinDate = practitioner.meta?.lastUpdated || new Date().toISOString();
  try {
    return format(new Date(joinDate), 'MMM dd, yyyy');
  } catch (error) {
    return t('practitioner:dateNotAvailable');
  }
}

export interface TransformPractitionerOptions {
  /**
   * The number of patients associated with the practitioner
   * If not provided, defaults to 0
   */
  patientCount?: number;

  // Additional options can be added here if needed in the future
}

/**
 * Transforms a FHIR Practitioner resource into a display-friendly format
 * @param practitioner - The FHIR Practitioner resource to transform
 * @param t - Translation function for internationalization
 * @param options - Additional options including patient count
 * @returns A formatted PractitionerDisplayData object ready for UI display
 */
export function transformPractitionerForDisplay(
  practitioner: Practitioner,
  t: (key: string, options?: any) => string,
  options: TransformPractitionerOptions = {}
): PractitionerDisplayData {
  // Extract all necessary data from the practitioner
  const { prefix, firstName, lastName } = extractNameParts(practitioner);
  const { address, city, country } = extractAddress(practitioner);
  const phoneNumbers = extractPhone(practitioner);
  const email = extractEmail(practitioner);
  const languages = extractLanguages(practitioner);
  const specialties = extractSpecialties(practitioner, t);
  const qualification = extractQualification(practitioner, t);
  const joinDate = getFormattedJoinDate(practitioner, t);
  // const experience = calculateExperience(practitioner, t);

  // Use provided patient count or default to 0
  const patientCount = options.patientCount ?? 0;

  return {
    id: practitioner.id || '',
    name: formatPractitionerName(practitioner, t),
    prefix,
    firstName,
    lastName,
    gender: practitioner.gender,
    phoneNumbers,
    email,
    address,
    city,
    country,
    qualification,
    specialties,
    status: practitioner.active ? 'active' : 'inactive',
    joinDate,
    lastUpdated: practitioner.meta?.lastUpdated ? format(new Date(practitioner.meta.lastUpdated), 'PPpp') : '',
    availableTime: [],
    languages,
    bio: t('practitioner:bioNotAvailable', { name: firstName || t('practitioner:thePractitioner') }),
    photo: extractPhoto(practitioner),
    patientCount, // Use the provided patient count
    appointmentStats: {
      total: 0,
      completed: 0,
      cancelled: 0
    },
    careTeam: qualification.length > 0 ? [{
      organization: qualification[0].issuer.display,
      department: 'General Medicine'
    }] : [],
    education: [],
    experience: [],
    // experience: [{
    //   position: qualification,
    //   organization: t('practitioner:medicalInstitution'),
    //   period: experience
    // }],
    certifications: []
  };
}

/**
 * Validates a Practitioner resource for display purposes
 * @param practitioner - The FHIR Practitioner resource to validate
 * @returns Object containing validation result and any missing fields
 */
export async function validatePractitionerForDisplay(practitioner: Practitioner): Promise<{
  isValid: boolean;
  missingFields: string[];
}> {
  // Only require essential fields for display
  const requiredFields = [
    'id',
    'name',
    'resourceType'
  ];

  const missingFields = requiredFields.filter(field => {
    const value = (practitioner as any)[field];
    // Check for empty arrays as they're valid but might be empty
    if (Array.isArray(value)) {
      return false;
    }
    return value === undefined || value === null || value === '';
  });

  // Additional validation for name structure if needed
  if (practitioner.name && practitioner.name.length > 0) {
    const name = practitioner.name[0];
    if (!name.given?.length && !name.family) {
      missingFields.push('name.given', 'name.family');
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}
