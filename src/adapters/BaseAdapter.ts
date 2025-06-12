/**
 * BaseAdapter.ts
 * 
 * Base adapter containing common functionality for both Patient and Practitioner adapters
 */
import { Resource, ContactPoint, Address, Attachment, CodeableConcept } from '@medplum/fhirtypes';
import { ResourceAdapter } from './ResourceAdapter';

// Common constants for telecom
export const TELECOM_SYSTEMS = [
  'phone',
  'fax',
  'email',
  'pager',
  'url',
  'sms',
  'other'
] as const;

export const TELECOM_USES = [
  'home',
  'work',
  'temp',
  'old',
  'mobile'
] as const;

// Common constants for address
export const ADDRESS_USES = [
  'home',
  'work',
  'temp',
  'old',
  'billing'
] as const;

export const ADDRESS_TYPES = [
  'postal',
  'physical',
  'both'
] as const;

// Common form data interfaces
export interface TelecomFormData {
  system: typeof TELECOM_SYSTEMS[number];
  value: string;
  use: typeof TELECOM_USES[number];
  rank?: number;
}

export interface AddressFormData {
  use?: typeof ADDRESS_USES[number];
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface PhotoFormData {
  contentType?: string;
  data?: string; // base64 encoded
  size?: number;
  title?: string;
  url?: string; // alternative to data
}

export interface CommunicationFormData {
  language: string; // language code (e.g., 'en', 'fr')
  text: string; // display name (e.g., 'English', 'French')
  preferred?: boolean;
}

/**
 * Base adapter class with common validation and transformation methods
 */
export abstract class BaseAdapter<TResource extends Resource, TFormValues> 
  implements ResourceAdapter<TResource, TFormValues> {

  // Abstract methods that must be implemented by subclasses
  abstract toFormValues(resource: TResource): TFormValues;
  abstract toResource(formValues: TFormValues, resourceId?: string): TResource;
  abstract getDefaultFormValues(): TFormValues;
  abstract validateFormValues(formValues: TFormValues): boolean;

  /**
   * Validate telecom system value
   */
  protected validateTelecomSystem(system: any): typeof TELECOM_SYSTEMS[number] {
    return TELECOM_SYSTEMS.includes(system as any) ? system as any : 'phone';
  }

  /**
   * Validate telecom use value
   */
  protected validateTelecomUse(use: any): typeof TELECOM_USES[number] {
    return TELECOM_USES.includes(use as any) ? use as any : 'home';
  }

  /**
   * Validate address use value
   */
  protected validateAddressUse(value: any): typeof ADDRESS_USES[number] {
    return ADDRESS_USES.includes(value as any) ? value as any : 'home';
  }

  /**
   * Validate address type value
   */
  protected validateAddressType(value: any): typeof ADDRESS_TYPES[number] {
    return ADDRESS_TYPES.includes(value as any) ? value as any : 'physical';
  }

  /**
   * Convert FHIR telecom array to form data
   */
  protected convertTelecomToFormData(telecom?: ContactPoint[]): TelecomFormData[] {
    return telecom?.map(t => ({
      system: this.validateTelecomSystem(t.system),
      value: t.value || '',
      use: this.validateTelecomUse(t.use),
      rank: t.rank
    })) || [];
  }

  /**
   * Convert form telecom data to FHIR ContactPoint array
   */
  protected convertFormDataToTelecom(telecomData: TelecomFormData[]): ContactPoint[] {
    return telecomData.map(t => ({
      system: t.system,
      value: t.value,
      use: t.use,
      rank: t.rank
    }));
  }

  /**
   * Convert FHIR address array to form data
   */
  protected convertAddressToFormData(addresses?: Address[]): AddressFormData[] {
    return addresses?.map(a => ({
      use: this.validateAddressUse(a.use),
      line: a.line || [],
      city: a.city || '',
      district: a.district || '',
      state: a.state || '',
      postalCode: a.postalCode || '',
      country: a.country || ''
    })) || [];
  }

  /**
   * Convert form address data to FHIR Address array
   */
  protected convertFormDataToAddress(addressData: AddressFormData[]): Address[] {
    return addressData.map(a => ({
      use: a.use,
      line: a.line,
      city: a.city,
      district: a.district,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country
    }));
  }

  /**
   * Convert FHIR photo array to form data
   */
  protected convertPhotoToFormData(photos?: Attachment[]): PhotoFormData[] {
    return photos?.map(p => ({
      contentType: p.contentType || '',
      data: p.data || '',
      size: p.size || 0,
      title: p.title || '',
      url: p.url || ''
    })) || [];
  }

  /**
   * Convert form photo data to FHIR Attachment array
   */
  protected convertFormDataToPhoto(photoData: PhotoFormData[]): Attachment[] {
    return photoData?.filter(p => p.data || p.url).map(p => ({
      contentType: p.contentType,
      data: p.data,
      size: p.size,
      title: p.title,
      url: p.url
    })) || [];
  }

  /**
   * Convert FHIR communication array to form data
   */
  protected convertCommunicationToFormData(communications?: CodeableConcept[]): CommunicationFormData[] {
    return communications?.map(c => ({
      language: c.coding?.[0]?.code || '',
      text: c.text || c.coding?.[0]?.display || ''
    })) || [];
  }

  /**
   * Convert form communication data to FHIR CodeableConcept array
   */
  protected convertFormDataToCommunication(communicationData: CommunicationFormData[]): CodeableConcept[] {
    return communicationData?.map(c => ({
      coding: [{
        system: 'urn:ietf:bcp:47',
        code: c.language,
        display: c.text
      }],
      text: c.text
    })) || [];
  }

  /**
   * Get common languages for Mali/West Africa region
   */
  getCommonLanguages(): { code: string; text: string }[] {
    return [
      { code: 'en', text: 'English' },
      { code: 'fr', text: 'French' },
      { code: 'bm', text: 'Bambara' },
      { code: 'ar', text: 'Arabic' },
      { code: 'sw', text: 'Swahili' },
      { code: 'ha', text: 'Hausa' },
      { code: 'yo', text: 'Yoruba' },
      { code: 'ig', text: 'Igbo' }
    ];
  }
}