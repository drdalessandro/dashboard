/**
 * Practitioner Validator
 * Central location for all practitioner validation logic
 * Implements type-safe validation with comprehensive error handling
 */

import { Practitioner } from '@medplum/fhirtypes';
import { PractitionerFormValues } from '../../../../adapters/PractitionerAdapter';
import { 
  VALIDATION_CONSTRAINTS,
  isValidContactSystem,
  isValidContactUseType,
  isValidAddressUseType,
  isValidGenderType,
} from '../../constants/practitioner.constants';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

/**
 * Field-specific validation result
 */
export interface FieldValidation {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validate practitioner name
 */
export function validateName(firstName?: string, lastName?: string): FieldValidation {
  if (!firstName?.trim()) {
    return { isValid: false, error: 'First name is required' };
  }
  
  if (!lastName?.trim()) {
    return { isValid: false, error: 'Last name is required' };
  }

  if (firstName.length > VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH) {
    return { isValid: false, error: `First name must be less than ${VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH} characters` };
  }

  if (lastName.length > VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH) {
    return { isValid: false, error: `Last name must be less than ${VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH} characters` };
  }

  return { isValid: true };
}

/**
 * Validate birth date
 */
export function validateBirthDate(birthDate?: string): FieldValidation {
  if (!birthDate) {
    return { isValid: true }; // Birth date is optional
  }

  const date = new Date(birthDate);
  const today = new Date();

  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid birth date format' };
  }

  if (date >= today) {
    return { isValid: false, error: 'Birth date must be in the past' };
  }

  const age = today.getFullYear() - date.getFullYear();
  
  if (age < VALIDATION_CONSTRAINTS.BIRTH_DATE_MIN_AGE) {
    return { isValid: false, error: `Must be at least ${VALIDATION_CONSTRAINTS.BIRTH_DATE_MIN_AGE} years old` };
  }

  if (age > VALIDATION_CONSTRAINTS.BIRTH_DATE_MAX_AGE) {
    return { isValid: false, error: 'Birth date seems unrealistic' };
  }

  return { isValid: true };
}

/**
 * Validate gender
 */
export function validateGender(gender?: string): FieldValidation {
  if (!gender) {
    return { isValid: true }; // Gender is optional
  }

  if (!isValidGenderType(gender)) {
    return { isValid: false, error: 'Invalid gender value' };
  }

  return { isValid: true };
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone?: string): FieldValidation {
  if (!phone) {
    return { isValid: true }; // Phone is optional
  }

  if (!VALIDATION_CONSTRAINTS.PHONE_REGEX.test(phone)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }

  return { isValid: true };
}

/**
 * Validate email address
 */
export function validateEmail(email?: string): FieldValidation {
  if (!email) {
    return { isValid: true }; // Email is optional
  }

  if (!VALIDATION_CONSTRAINTS.EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Validate contact information
 */
export function validateContact(contact: { system: string; value: string; use: string }): FieldValidation {
  if (!contact.value?.trim()) {
    return { isValid: false, error: 'Contact value is required' };
  }

  if (!isValidContactSystem(contact.system)) {
    return { isValid: false, error: 'Invalid contact system' };
  }

  if (contact.use && !isValidContactUseType(contact.use)) {
    return { isValid: false, error: 'Invalid contact use type' };
  }

  // Validate based on system type
  switch (contact.system) {
    case 'email':
      return validateEmail(contact.value);
    case 'phone':
    case 'sms':
      return validatePhoneNumber(contact.value);
    default:
      return { isValid: true };
  }
}

/**
 * Validate address
 */
export function validateAddress(address: any): FieldValidation {
  if (!address.line?.[0]?.trim() && !address.city?.trim()) {
    return { isValid: false, error: 'Address must have either street or city' };
  }

  if (address.use && !isValidAddressUseType(address.use)) {
    return { isValid: false, error: 'Invalid address use type' };
  }

  return { isValid: true };
}

/**
 * Validate photo
 */
export function validatePhoto(photo: any): FieldValidation {
  if (!photo.data && !photo.url) {
    return { isValid: false, error: 'Photo must have either data or URL' };
  }

  if (photo.data && !photo.contentType) {
    return { isValid: false, error: 'Photo must have a content type' };
  }

  if (photo.contentType && !VALIDATION_CONSTRAINTS.PHOTO_ALLOWED_TYPES.includes(photo.contentType)) {
    return { isValid: false, error: 'Invalid photo format. Allowed: JPEG, PNG, GIF, WebP' };
  }

  if (photo.size && photo.size > VALIDATION_CONSTRAINTS.PHOTO_MAX_SIZE) {
    return { isValid: false, error: 'Photo size exceeds 5MB limit' };
  }

  return { isValid: true };
}

/**
 * Validate qualification
 */
export function validateQualification(qualification: { code: string; issuer: string }): FieldValidation {
  if (!qualification.code?.trim()) {
    return { isValid: false, error: 'Qualification code is required' };
  }

  if (qualification.code.length > VALIDATION_CONSTRAINTS.QUALIFICATION_MAX_LENGTH) {
    return { isValid: false, error: `Qualification must be less than ${VALIDATION_CONSTRAINTS.QUALIFICATION_MAX_LENGTH} characters` };
  }

  return { isValid: true };
}

/**
 * Validate communication language
 */
export function validateCommunication(communication: { language: string; text: string }): FieldValidation {
  if (!communication.language?.trim() || !communication.text?.trim()) {
    return { isValid: false, error: 'Both language code and text are required' };
  }

  return { isValid: true };
}

/**
 * Validate entire practitioner form
 */
export function validatePractitionerForm(formValues: PractitionerFormValues): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Validate name
  const nameValidation = validateName(formValues.firstName, formValues.lastName);
  if (!nameValidation.isValid && nameValidation.error) {
    errors.name = nameValidation.error;
  }

  // Validate birth date
  const birthDateValidation = validateBirthDate(formValues.birthDate);
  if (!birthDateValidation.isValid && birthDateValidation.error) {
    errors.birthDate = birthDateValidation.error;
  }

  // Validate gender
  const genderValidation = validateGender(formValues.gender);
  if (!genderValidation.isValid && genderValidation.error) {
    errors.gender = genderValidation.error;
  }

  // Validate contacts
  if (formValues.contact) {
    const invalidContacts = formValues.contact.map((contact, index) => ({
      index,
      validation: validateContact(contact)
    })).filter(result => !result.validation.isValid);

    if (invalidContacts.length > 0) {
      errors.contact = `Contact ${invalidContacts[0].index + 1}: ${invalidContacts[0].validation.error}`;
    }
  }

  // Validate addresses
  if (formValues.address && formValues.address.length > 0) {
    const invalidAddresses = formValues.address.map((address, index) => ({
      index,
      validation: validateAddress(address)
    })).filter(result => !result.validation.isValid);

    if (invalidAddresses.length > 0) {
      errors.address = `Address ${invalidAddresses[0].index + 1}: ${invalidAddresses[0].validation.error}`;
    }
  }

  // Validate photos
  if (formValues.photo && formValues.photo.length > 0) {
    const invalidPhotos = formValues.photo.map((photo, index) => ({
      index,
      validation: validatePhoto(photo)
    })).filter(result => !result.validation.isValid);

    if (invalidPhotos.length > 0) {
      errors.photo = invalidPhotos[0].validation.error || 'Invalid photo';
    }
  }

  // Validate qualifications
  if (formValues.qualifications && formValues.qualifications.length > 0) {
    const invalidQualifications = formValues.qualifications.map((qual, index) => ({
      index,
      validation: validateQualification(qual)
    })).filter(result => !result.validation.isValid);

    if (invalidQualifications.length > 0) {
      errors.qualifications = `Qualification ${invalidQualifications[0].index + 1}: ${invalidQualifications[0].validation.error}`;
    }
  }

  // Validate communications
  if (formValues.communication && formValues.communication.length > 0) {
    const invalidCommunications = formValues.communication.map((comm, index) => ({
      index,
      validation: validateCommunication(comm)
    })).filter(result => !result.validation.isValid);

    if (invalidCommunications.length > 0) {
      errors.communication = `Language ${invalidCommunications[0].index + 1}: ${invalidCommunications[0].validation.error}`;
    }
  }

  // Add warnings for recommended fields
  if (!formValues.contact || formValues.contact.length === 0) {
    warnings.contact = 'At least one contact method is recommended';
  }

  if (!formValues.qualifications || formValues.qualifications.length === 0) {
    warnings.qualifications = 'Professional qualifications are recommended';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: Object.keys(warnings).length > 0 ? warnings : undefined,
  };
}

/**
 * Validate FHIR Practitioner resource
 */
export function validatePractitionerResource(practitioner: Practitioner): ValidationResult {
  const errors: Record<string, string> = {};

  if (!practitioner.resourceType || practitioner.resourceType !== 'Practitioner') {
    errors.resourceType = 'Invalid resource type';
  }

  if (!practitioner.name || practitioner.name.length === 0) {
    errors.name = 'Name is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Export all validation functions
 */
export const validators = {
  validateName,
  validateBirthDate,
  validateGender,
  validatePhoneNumber,
  validateEmail,
  validateContact,
  validateAddress,
  validatePhoto,
  validateQualification,
  validateCommunication,
  validatePractitionerForm,
  validatePractitionerResource,
};
