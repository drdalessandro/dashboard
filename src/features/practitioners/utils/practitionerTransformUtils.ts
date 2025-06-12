/**
 * practitionerTransformUtils.ts
 * 
 * Utility functions for transforming practitioner data
 * Enhanced to support all FHIR-compliant fields
 */
import { ContactPoint, Practitioner } from '@medplum/fhirtypes';
import { PractitionerCreateParams } from '../types/practitioner.types';

/**
 * Transform form data to FHIR Practitioner resource format
 */
export function transformFormDataToFHIR(formData: PractitionerCreateParams): Practitioner {
  return {
    resourceType: 'Practitioner',
    name: [
      {
        given: [formData.firstName],
        family: formData.lastName
      }
    ],
    gender: formData.gender,
    birthDate: formData.birthDate,
    qualification: formData.qualifications?.map(q => ({
      code: {
        text: q.code
      },
      issuer: {
        display: q.issuer
      }
    })),
    telecom: formData.contact?.map(c => ({
      system: c.system as ContactPoint['system'],
      value: c.value,
      use: c.use as ContactPoint['use']
    })),
    address: formData.address?.map(a => ({
      use: a.use as 'home' | 'work' | 'temp' | 'old' | 'billing',
      line: a.line,
      city: a.city,
      district: a.district,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country
    })),
    photo: formData.photo?.filter(p => p.data || p.url).map(p => ({
      contentType: p.contentType,
      data: p.data,
      size: p.size,
      title: p.title,
      url: p.url
    })),
    communication: formData.communication?.map(c => ({
      coding: [{
        system: 'urn:ietf:bcp:47',
        code: c.language,
        display: c.text
      }],
      text: c.text
    }))
  };
}

/**
 * Transform FHIR resource to form data format
 */
export function transformFHIRToFormData(fhirResource: Practitioner): PractitionerCreateParams {
  const name = fhirResource.name?.[0] || {};
  
  return {
    firstName: name.given?.[0] || '',
    lastName: name.family || '',
    gender: fhirResource.gender,
    birthDate: fhirResource.birthDate,
    qualifications: fhirResource.qualification?.map((q: any) => ({
      code: q.code?.text || '',
      issuer: q.issuer?.display || ''
    })) || [],
    contact: fhirResource.telecom?.map((t: any) => ({
      system: t.system || 'phone',
      value: t.value || '',
      use: t.use || 'work'
    })) || [],
    address: fhirResource.address?.map(a => ({
      use: a.use || 'home',
      line: a.line || [],
      city: a.city || '',
      district: a.district || '',
      state: a.state || '',
      postalCode: a.postalCode || '',
      country: a.country || ''
    })) || [],
    photo: fhirResource.photo?.map(p => ({
      contentType: p.contentType || '',
      data: p.data || '',
      size: p.size || 0,
      title: p.title || '',
      url: p.url || ''
    })) || [],
    communication: fhirResource.communication?.map(c => ({
      language: c.coding?.[0]?.code || '',
      text: c.text || c.coding?.[0]?.display || ''
    })) || []
  };
}
