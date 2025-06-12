/**
 * createValidation.ts
 * 
 * Validation utilities specifically for the practitioner create form
 */
import { PractitionerCreateParams } from '../types/practitioner.types';

/**
 * Validate practitioner create form
 */
export function validatePractitionerForm(formValues: PractitionerCreateParams): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Validate first name
  if (!formValues.firstName || formValues.firstName.trim() === '') {
    errors.firstName = 'First name is required';
  }
  
  // Validate last name
  if (!formValues.lastName || formValues.lastName.trim() === '') {
    errors.lastName = 'Last name is required';
  }
  
  // Validate birthDate if provided
  if (formValues.birthDate) {
    const birthDate = new Date(formValues.birthDate);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) {
      errors.birthDate = 'Invalid date format';
    } else if (birthDate > today) {
      errors.birthDate = 'Birth date cannot be in the future';
    } else if (birthDate < new Date('1900-01-01')) {
      errors.birthDate = 'Birth date is too far in the past';
    }
  }
  
  // Validate contact information
  if (formValues.contact && formValues.contact.length > 0) {
    formValues.contact.forEach((contact, index) => {
      if (!contact.value || contact.value.trim() === '') {
        errors[`contact_${index}_value`] = 'Contact value is required';
      } else if (contact.system === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact.value)) {
          errors[`contact_${index}_value`] = 'Invalid email format';
        }
      } else if (contact.system === 'phone') {
        const phoneRegex = /^\+?\d{10,15}$/;
        const cleaned = contact.value.replace(/[\s\-\(\)]/g, '');
        if (!phoneRegex.test(cleaned)) {
          errors[`contact_${index}_value`] = 'Invalid phone number format';
        }
      }
    });
  }
  
  // Validate qualifications
  if (formValues.qualifications && formValues.qualifications.length > 0) {
    formValues.qualifications.forEach((qual, index) => {
      if (!qual.code || qual.code.trim() === '') {
        errors[`qualification_${index}_code`] = 'Qualification code is required';
      }
    });
  }
  
  // Validate addresses
  if (formValues.address && formValues.address.length > 0) {
    formValues.address.forEach((addr, index) => {
      if (!addr.line || addr.line.length === 0 || addr.line[0].trim() === '') {
        errors[`address_${index}_line`] = 'Street address is required';
      }
      if (!addr.city || addr.city.trim() === '') {
        errors[`address_${index}_city`] = 'City is required';
      }
      if (!addr.country || addr.country.trim() === '') {
        errors[`address_${index}_country`] = 'Country is required';
      }
    });
  }
  
  // Validate photo
  if (formValues.photo && formValues.photo.length > 0) {
    formValues.photo.forEach((photo, index) => {
      if (photo.data && photo.size && photo.size > 5 * 1024 * 1024) {
        errors[`photo_${index}`] = 'Photo size exceeds 5MB limit';
      }
      if (photo.contentType && !['image/jpeg', 'image/png', 'image/gif'].includes(photo.contentType)) {
        errors[`photo_${index}`] = 'Invalid photo format. Allowed: JPEG, PNG, GIF';
      }
    });
  }
  
  // Validate communication languages
  if (formValues.communication && formValues.communication.length > 0) {
    formValues.communication.forEach((comm, index) => {
      if (!comm.language || comm.language.trim() === '') {
        errors[`communication_${index}_language`] = 'Language code is required';
      }
      if (!comm.text || comm.text.trim() === '') {
        errors[`communication_${index}_text`] = 'Language name is required';
      }
    });
  }
  
  return errors;
}

/**
 * Check if there are any validation errors
 */
export function hasValidationErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}
