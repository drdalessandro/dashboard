/**
 * FHIR Value Sets Configuration
 * 
 * Comprehensive FHIR R4 compliant value sets for dropdown fields across all resources.
 * Based on official FHIR R4 specification and common healthcare industry standards.
 * 
 * @see https://www.hl7.org/fhir/R4/terminologies.html
 */

/**
 * =============================================================================
 * ADMINISTRATIVE GENDER VALUE SET
 * @see http://hl7.org/fhir/ValueSet/administrative-gender
 * =============================================================================
 */
export const GENDER_VALUE_SET = [
  { code: 'female', display: 'Female', definition: 'Female' },
  { code: 'male', display: 'Male', definition: 'Male' },
  { code: 'other', display: 'Other', definition: 'Other' },
  { code: 'unknown', display: 'Unknown', definition: 'Unknown' }
] as const;

/**
 * =============================================================================
 * MARITAL STATUS VALUE SET
 * @see http://hl7.org/fhir/ValueSet/marital-status
 * System: http://terminology.hl7.org/CodeSystem/v3-MaritalStatus
 * =============================================================================
 */
export const MARITAL_STATUS_VALUE_SET = [
  { code: 'A', display: 'Annulled', definition: 'Marriage contract has been declared null and to not have existed' },
  { code: 'C', display: 'Common Law', definition: 'A marriage recognized in some jurisdictions and based on the parties\' agreement to consider themselves married and can also be based on documentation of cohabitation' },
  { code: 'D', display: 'Divorced', definition: 'Marriage contract has been declared dissolved and inactive' },
  { code: 'T', display: 'Domestic Partner', definition: 'Person declares that a domestic partner relationship exists' },
  { code: 'I', display: 'Interlocutory', definition: 'Subject to an Interlocutory Decree' },
  { code: 'L', display: 'Legally Separated', definition: 'Legally Separated' },
  { code: 'M', display: 'Married', definition: 'A current marriage contract is active' },
  { code: 'S', display: 'Never Married', definition: 'No marriage contract has ever been entered' },
  { code: 'P', display: 'Polygamous', definition: 'More than 1 current spouse' },
  { code: 'UNK', display: 'Unknown', definition: 'Description:A proper value is applicable, but not known' },
  { code: 'U', display: 'Unmarried', definition: 'Currently not in a marriage contract' },
  { code: 'W', display: 'Widowed', definition: 'The spouse has died' }
] as const;

/**
 * =============================================================================
 * PATIENT STATUS VALUE SET
 * Custom value set for patient resource status (not standardized in FHIR)
 * =============================================================================
 */
export const PATIENT_STATUS_VALUE_SET = [
  { code: 'active', display: 'Active', definition: 'Patient record is active and in use' },
  { code: 'entered-in-error', display: 'Entered in Error', definition: 'Patient record was created in error and should not be used' },
  { code: 'inactive', display: 'Inactive', definition: 'Patient record is not active and not in regular use' },
  { code: 'suspended', display: 'Suspended', definition: 'Patient record is temporarily suspended' }
] as const;

/**
 * =============================================================================
 * CONTACT POINT SYSTEM VALUE SET
 * @see http://hl7.org/fhir/ValueSet/contact-point-system
 * =============================================================================
 */
export const CONTACT_POINT_SYSTEM_VALUE_SET = [
  { code: 'email', display: 'Email', definition: 'The value is an email address' },
  { code: 'fax', display: 'Fax', definition: 'The value is a fax machine number' },
  { code: 'other', display: 'Other', definition: 'A contact that is not a phone, fax, pager or email address' },
  { code: 'pager', display: 'Pager', definition: 'The value is a pager number' },
  { code: 'phone', display: 'Phone', definition: 'The value is a telephone number used for voice calls' },
  { code: 'sms', display: 'SMS', definition: 'The value is a telephone number used for text messages' },
  { code: 'url', display: 'URL', definition: 'The value is a URL that describes the endpoint' }
] as const;

/**
 * =============================================================================
 * CONTACT POINT USE VALUE SET
 * @see http://hl7.org/fhir/ValueSet/contact-point-use
 * =============================================================================
 */
export const CONTACT_POINT_USE_VALUE_SET = [
  { code: 'home', display: 'Home', definition: 'A communication contact point at a home; attempted contacts for business purposes might intrude privacy and chances are one will contact family or other household members instead of the person one wishes to call' },
  { code: 'mobile', display: 'Mobile', definition: 'A mobile contact point for mobile devices such as cellular phones' },
  { code: 'old', display: 'Old', definition: 'This contact point is no longer in use (or was never correct, but retained for records)' },
  { code: 'temp', display: 'Temporary', definition: 'A temporary contact point. The period can provide more detailed information' },
  { code: 'work', display: 'Work', definition: 'An office contact point. First choice for business related contacts during business hours' }
] as const;

/**
 * =============================================================================
 * ADDRESS USE VALUE SET
 * @see http://hl7.org/fhir/ValueSet/address-use
 * =============================================================================
 */
export const ADDRESS_USE_VALUE_SET = [
  { code: 'billing', display: 'Billing', definition: 'An address to be used for billing purposes' },
  { code: 'home', display: 'Home', definition: 'A communication address at a home' },
  { code: 'old', display: 'Old', definition: 'This address is no longer in use (or was never correct but retained for records)' },
  { code: 'temp', display: 'Temporary', definition: 'A temporary address. The period can provide more detailed information' },
  { code: 'work', display: 'Work', definition: 'An office address. First choice for business related contacts during business hours' }
] as const;

/**
 * =============================================================================
 * ADDRESS TYPE VALUE SET
 * @see http://hl7.org/fhir/ValueSet/address-type
 * =============================================================================
 */
export const ADDRESS_TYPE_VALUE_SET = [
  { code: 'physical', display: 'Physical', definition: 'A physical address that can be visited' },
  { code: 'postal', display: 'Postal', definition: 'Mailing addresses - PO Boxes and care-of addresses' },
  { code: 'both', display: 'Postal & Physical', definition: 'An address that is both physical and postal' }
] as const;

/**
 * =============================================================================
 * CONTACT RELATIONSHIP VALUE SET
 * @see http://hl7.org/fhir/ValueSet/v2-0131
 * System: http://terminology.hl7.org/CodeSystem/v2-0131
 * =============================================================================
 */
export const CONTACT_RELATIONSHIP_VALUE_SET = [
  { code: 'CHLDADOPT', display: 'Adopted child', category: 'Family' },
  { code: 'DAUADOPT', display: 'Adopted daughter', category: 'Family' },
  { code: 'SONADOPT', display: 'Adopted son', category: 'Family' },
  { code: 'AUNT', display: 'Aunt', category: 'Family' },
  { code: 'BP', display: 'Billing contact person', category: 'Administrative' },
  { code: 'BRO', display: 'Brother', category: 'Family' },
  { code: 'BROINLAW', display: 'Brother-in-law', category: 'Family' },
  { code: 'CHILD', display: 'Child', category: 'Family' },
  { code: 'CHLDINLAW', display: 'Child-in-law', category: 'Family' },
  { code: 'CP', display: 'Contact person', category: 'Administrative' },
  { code: 'COUSN', display: 'Cousin', category: 'Family' },
  { code: 'DAUC', display: 'Daughter', category: 'Family' },
  { code: 'DAUINLAW', display: 'Daughter in-law', category: 'Family' },
  { code: 'DOMPART', display: 'Domestic partner', category: 'Spouse/Partner' },
  { code: 'EP', display: 'Emergency contact person', category: 'Administrative' },
  { code: 'FTH', display: 'Father', category: 'Family' },
  { code: 'FTHINLAW', display: 'Father-in-law', category: 'Family' },
  { code: 'CHLDFOST', display: 'Foster child', category: 'Family' },
  { code: 'GRFTH', display: 'Grandfather', category: 'Family' },
  { code: 'GRMTH', display: 'Grandmother', category: 'Family' },
  { code: 'GRPRN', display: 'Grandparent', category: 'Family' },
  { code: 'GGRFTH', display: 'Great grandfather', category: 'Family' },
  { code: 'GGRMTH', display: 'Great grandmother', category: 'Family' },
  { code: 'GGRPRN', display: 'Great grandparent', category: 'Family' },
  { code: 'GUARD', display: 'Guardian', category: 'Legal' },
  { code: 'HBRO', display: 'Half-brother', category: 'Family' },
  { code: 'HSIS', display: 'Half-sister', category: 'Family' },
  { code: 'HUSB', display: 'Husband', category: 'Spouse/Partner' },
  { code: 'MTH', display: 'Mother', category: 'Family' },
  { code: 'MTHINLAW', display: 'Mother-in-law', category: 'Family' },
  { code: 'DAU', display: 'Natural daughter', category: 'Family' },
  { code: 'NFTH', display: 'Natural father', category: 'Family' },
  { code: 'NMTH', display: 'Natural mother', category: 'Family' },
  { code: 'SON', display: 'Natural son', category: 'Family' },
  { code: 'NBRO', display: 'Natural brother', category: 'Family' },
  { code: 'NSIS', display: 'Natural sister', category: 'Family' },
  { code: 'NBOR', display: 'Neighbor', category: 'Other' },
  { code: 'NEPHEW', display: 'Nephew', category: 'Family' },
  { code: 'NOK', display: 'Next of kin', category: 'Legal' },
  { code: 'NIECE', display: 'Niece', category: 'Family' },
  { code: 'NIENEPH', display: 'Niece/nephew', category: 'Family' },
  { code: 'PRNINLAW', display: 'Parent in-law', category: 'Family' },
  { code: 'PR', display: 'Person preparing referral', category: 'Administrative' },
  { code: 'POWATT', display: 'Power of attorney', category: 'Legal' },
  { code: 'ROOM', display: 'Roommate', category: 'Other' },
  { code: 'SIB', display: 'Sibling', category: 'Family' },
  { code: 'SIBINLAW', display: 'Sibling in-law', category: 'Family' },
  { code: 'SIS', display: 'Sister', category: 'Family' },
  { code: 'SISINLAW', display: 'Sister-in-law', category: 'Family' },
  { code: 'SONC', display: 'Son', category: 'Family' },
  { code: 'SONINLAW', display: 'Son in-law', category: 'Family' },
  { code: 'SPS', display: 'Spouse', category: 'Spouse/Partner' },
  { code: 'STPDAU', display: 'Stepdaughter', category: 'Family' },
  { code: 'STPFTH', display: 'Stepfather', category: 'Family' },
  { code: 'STPMTH', display: 'Stepmother', category: 'Family' },
  { code: 'STPSON', display: 'Stepson', category: 'Family' },
  { code: 'STPBRO', display: 'Stepbrother', category: 'Family' },
  { code: 'STPSIS', display: 'Stepsister', category: 'Family' },
  { code: 'UNCLE', display: 'Uncle', category: 'Family' },
  { code: 'FRND', display: 'Unrelated friend', category: 'Other' },
  { code: 'WIFE', display: 'Wife', category: 'Spouse/Partner' }
] as const;

/**
 * =============================================================================
 * PATIENT LINK TYPE VALUE SET
 * @see http://hl7.org/fhir/ValueSet/link-type
 * =============================================================================
 */
export const PATIENT_LINK_TYPE_VALUE_SET = [
  { code: 'refer', display: 'Refer', definition: 'The patient resource containing this link is in use and valid but not considered the main source of information about a patient' },
  { code: 'replaced-by', display: 'Replaced-by', definition: 'The patient resource containing this link must no longer be used. The link points forward to another patient resource that must be used in lieu of the patient resource that contains this link' },
  { code: 'replaces', display: 'Replaces', definition: 'The patient resource containing this link is the current active patient record. The link points back to an inactive patient resource that has been merged into this resource' },
  { code: 'seealso', display: 'See also', definition: 'The patient resource containing this link is in use and valid, but points to another patient resource that is known to contain data about the same person' }
] as const;

/**
 * =============================================================================
 * NAME PREFIX VALUE SET
 * Common honorific prefixes (not standardized in FHIR)
 * =============================================================================
 */
export const NAME_PREFIX_VALUE_SET = [
  { code: 'Capt', display: 'Capt.', definition: 'Captain' },
  { code: 'Col', display: 'Col.', definition: 'Colonel' },
  { code: 'Dr', display: 'Dr.', definition: 'Doctor' },
  { code: 'Gen', display: 'Gen.', definition: 'General' },
  { code: 'Hon', display: 'Hon.', definition: 'Honorable' },
  { code: 'Lady', display: 'Lady', definition: 'Lady' },
  { code: 'Maj', display: 'Maj.', definition: 'Major' },
  { code: 'Mr', display: 'Mr.', definition: 'Mister' },
  { code: 'Mrs', display: 'Mrs.', definition: 'Missus' },
  { code: 'Ms', display: 'Ms.', definition: 'Miss/Ms' },
  { code: 'Prof', display: 'Prof.', definition: 'Professor' },
  { code: 'Rev', display: 'Rev.', definition: 'Reverend' },
  { code: 'Sir', display: 'Sir', definition: 'Sir' }
] as const;

/**
 * =============================================================================
 * NAME SUFFIX VALUE SET
 * Common name suffixes (not standardized in FHIR)
 * =============================================================================
 */
export const NAME_SUFFIX_VALUE_SET = [
  { code: 'BSN', display: 'BSN', definition: 'Bachelor of Science in Nursing' },
  { code: 'CNM', display: 'CNM', definition: 'Certified Nurse Midwife' },
  { code: 'DDS', display: 'DDS', definition: 'Doctor of Dental Surgery' },
  { code: 'DMD', display: 'DMD', definition: 'Doctor of Dental Medicine' },
  { code: 'DNP', display: 'DNP', definition: 'Doctor of Nursing Practice' },
  { code: 'DO', display: 'DO', definition: 'Doctor of Osteopathic Medicine' },
  { code: 'DPT', display: 'DPT', definition: 'Doctor of Physical Therapy' },
  { code: 'Esq', display: 'Esq.', definition: 'Esquire' },
  { code: 'II', display: 'II', definition: 'The Second' },
  { code: 'III', display: 'III', definition: 'The Third' },
  { code: 'IV', display: 'IV', definition: 'The Fourth' },
  { code: 'JD', display: 'JD', definition: 'Juris Doctor' },
  { code: 'Jr', display: 'Jr.', definition: 'Junior' },
  { code: 'LPN', display: 'LPN', definition: 'Licensed Practical Nurse' },
  { code: 'MA', display: 'MA', definition: 'Master of Arts' },
  { code: 'MBA', display: 'MBA', definition: 'Master of Business Administration' },
  { code: 'MD', display: 'MD', definition: 'Doctor of Medicine' },
  { code: 'MS', display: 'MS', definition: 'Master of Science' },
  { code: 'NP', display: 'NP', definition: 'Nurse Practitioner' },
  { code: 'PA', display: 'PA', definition: 'Physician Assistant' },
  { code: 'PharmD', display: 'PharmD', definition: 'Doctor of Pharmacy' },
  { code: 'PhD', display: 'PhD', definition: 'Doctor of Philosophy' },
  { code: 'RN', display: 'RN', definition: 'Registered Nurse' },
  { code: 'RPh', display: 'RPh', definition: 'Registered Pharmacist' },
  { code: 'Sr', display: 'Sr.', definition: 'Senior' },
  { code: 'V', display: 'V', definition: 'The Fifth' }
] as const;

/**
 * =============================================================================
 * LANGUAGE VALUE SET
 * Based on BCP 47 language tags - Common languages for Mali/West Africa
 * @see https://tools.ietf.org/html/bcp47
 * =============================================================================
 */
export const LANGUAGE_VALUE_SET = [
  { code: 'am', display: 'Amharic', region: 'East Africa' },
  { code: 'ar', display: 'Arabic', region: 'Regional' },
  { code: 'bm', display: 'Bambara', region: 'Mali' },
  { code: 'zh', display: 'Chinese', region: 'International' },
  { code: 'en', display: 'English', region: 'International' },
  { code: 'fr', display: 'French', region: 'Official' },
  { code: 'ffm', display: 'Fulfulde Mali', region: 'Mali' },
  { code: 'de', display: 'German', region: 'International' },
  { code: 'ha', display: 'Hausa', region: 'West Africa' },
  { code: 'hi', display: 'Hindi', region: 'International' },
  { code: 'ig', display: 'Igbo', region: 'West Africa' },
  { code: 'it', display: 'Italian', region: 'International' },
  { code: 'ja', display: 'Japanese', region: 'International' },
  { code: 'ko', display: 'Korean', region: 'International' },
  { code: 'khq', display: 'Koyra Chiini Songhay', region: 'Mali' },
  { code: 'ses', display: 'Koyraboro Senni Songhai', region: 'Mali' },
  { code: 'myk', display: 'Mamara Senoufo', region: 'Mali' },
  { code: 'fa', display: 'Persian', region: 'International' },
  { code: 'pt', display: 'Portuguese', region: 'International' },
  { code: 'ru', display: 'Russian', region: 'International' },
  { code: 'snk', display: 'Soninke', region: 'Mali' },
  { code: 'es', display: 'Spanish', region: 'International' },
  { code: 'sw', display: 'Swahili', region: 'East Africa' },
  { code: 'tmh', display: 'Tamashek', region: 'Mali' },
  { code: 'dtm', display: 'Tomo Kan Dogon', region: 'Mali' },
  { code: 'tr', display: 'Turkish', region: 'International' },
  { code: 'ur', display: 'Urdu', region: 'International' },
  { code: 'wo', display: 'Wolof', region: 'West Africa' },
  { code: 'yo', display: 'Yoruba', region: 'West Africa' }
] as const;

/**
 * =============================================================================
 * PRACTITIONER QUALIFICATION VALUE SET
 * Common medical and healthcare qualifications
 * =============================================================================
 */
export const PRACTITIONER_QUALIFICATION_VALUE_SET = [
  { code: 'ADN', display: 'Associate Degree in Nursing', category: 'Nursing' },
  { code: 'BDS', display: 'Bachelor of Dental Surgery', category: 'Dental' },
  { code: 'MBBS', display: 'Bachelor of Medicine, Bachelor of Surgery', category: 'Medical Degree' },
  { code: 'MBChB', display: 'Bachelor of Medicine and Surgery', category: 'Medical Degree' },
  { code: 'BPharm', display: 'Bachelor of Pharmacy', category: 'Pharmacy' },
  { code: 'BSN', display: 'Bachelor of Science in Nursing', category: 'Nursing' },
  { code: 'Board-Certified', display: 'Board Certified', category: 'Certification' },
  { code: 'CNM', display: 'Certified Nurse Midwife', category: 'Nursing' },
  { code: 'AuD', display: 'Doctor of Audiology', category: 'Allied Health' },
  { code: 'DMD', display: 'Doctor of Dental Medicine', category: 'Dental' },
  { code: 'DDS', display: 'Doctor of Dental Surgery', category: 'Dental' },
  { code: 'MD', display: 'Doctor of Medicine', category: 'Medical Degree' },
  { code: 'DNP', display: 'Doctor of Nursing Practice', category: 'Nursing' },
  { code: 'OTD', display: 'Doctor of Occupational Therapy', category: 'Allied Health' },
  { code: 'DO', display: 'Doctor of Osteopathic Medicine', category: 'Medical Degree' },
  { code: 'PharmD', display: 'Doctor of Pharmacy', category: 'Pharmacy' },
  { code: 'DPT', display: 'Doctor of Physical Therapy', category: 'Allied Health' },
  { code: 'PsyD', display: 'Doctor of Psychology', category: 'Psychology' },
  { code: 'DrPH', display: 'Doctor of Public Health', category: 'Public Health' },
  { code: 'DVM', display: 'Doctor of Veterinary Medicine', category: 'Veterinary' },
  { code: 'EMT', display: 'Emergency Medical Technician', category: 'Allied Health' },
  { code: 'Fellowship', display: 'Fellowship Trained', category: 'Certification' },
  { code: 'LPN', display: 'Licensed Practical Nurse', category: 'Nursing' },
  { code: 'MPH', display: 'Master of Public Health', category: 'Public Health' },
  { code: 'MSN', display: 'Master of Science in Nursing', category: 'Nursing' },
  { code: 'MT', display: 'Medical Technologist', category: 'Allied Health' },
  { code: 'NP', display: 'Nurse Practitioner', category: 'Nursing' },
  { code: 'Paramedic', display: 'Paramedic', category: 'Allied Health' },
  { code: 'PhD-Psych', display: 'PhD in Psychology', category: 'Psychology' },
  { code: 'PA', display: 'Physician Assistant', category: 'Allied Health' },
  { code: 'RN', display: 'Registered Nurse', category: 'Nursing' },
  { code: 'Residency', display: 'Residency Completed', category: 'Certification' },
  { code: 'RT', display: 'Respiratory Therapist', category: 'Allied Health' },
  { code: 'VMD', display: 'Veterinariae Medicinae Doctoris', category: 'Veterinary' }
] as const;

/**
 * =============================================================================
 * TYPE DEFINITIONS FOR VALUE SETS
 * =============================================================================
 */

export type GenderCode = typeof GENDER_VALUE_SET[number]['code'];
export type MaritalStatusCode = typeof MARITAL_STATUS_VALUE_SET[number]['code'];
export type PatientStatusCode = typeof PATIENT_STATUS_VALUE_SET[number]['code'];
export type ContactPointSystemCode = typeof CONTACT_POINT_SYSTEM_VALUE_SET[number]['code'];
export type ContactPointUseCode = typeof CONTACT_POINT_USE_VALUE_SET[number]['code'];
export type AddressUseCode = typeof ADDRESS_USE_VALUE_SET[number]['code'];
export type AddressTypeCode = typeof ADDRESS_TYPE_VALUE_SET[number]['code'];
export type ContactRelationshipCode = typeof CONTACT_RELATIONSHIP_VALUE_SET[number]['code'];
export type PatientLinkTypeCode = typeof PATIENT_LINK_TYPE_VALUE_SET[number]['code'];
export type NamePrefixCode = typeof NAME_PREFIX_VALUE_SET[number]['code'];
export type NameSuffixCode = typeof NAME_SUFFIX_VALUE_SET[number]['code'];
export type LanguageCode = typeof LANGUAGE_VALUE_SET[number]['code'];
export type PractitionerQualificationCode = typeof PRACTITIONER_QUALIFICATION_VALUE_SET[number]['code'];

/**
 * =============================================================================
 * GROUPED VALUE SETS FOR EASIER ACCESS
 * =============================================================================
 */

export const FHIR_VALUE_SETS = {
  gender: GENDER_VALUE_SET,
  maritalStatus: MARITAL_STATUS_VALUE_SET,
  patientStatus: PATIENT_STATUS_VALUE_SET,
  contactPointSystem: CONTACT_POINT_SYSTEM_VALUE_SET,
  contactPointUse: CONTACT_POINT_USE_VALUE_SET,
  addressUse: ADDRESS_USE_VALUE_SET,
  addressType: ADDRESS_TYPE_VALUE_SET,
  contactRelationship: CONTACT_RELATIONSHIP_VALUE_SET,
  patientLinkType: PATIENT_LINK_TYPE_VALUE_SET,
  namePrefix: NAME_PREFIX_VALUE_SET,
  nameSuffix: NAME_SUFFIX_VALUE_SET,
  language: LANGUAGE_VALUE_SET,
  practitionerQualification: PRACTITIONER_QUALIFICATION_VALUE_SET
} as const;

/**
 * =============================================================================
 * UTILITY FUNCTIONS
 * =============================================================================
 */

/**
 * Get display value for a code from any value set
 */
export function getDisplayForCode<T extends readonly { code: string; display: string }[]>(
  valueSet: T,
  code: string
): string | undefined {
  return valueSet.find(item => item.code === code)?.display;
}

/**
 * Get all codes from a value set
 */
export function getCodesFromValueSet<T extends readonly { code: string }[]>(
  valueSet: T
): string[] {
  return valueSet.map(item => item.code);
}

/**
 * Get all display values from a value set
 */
export function getDisplaysFromValueSet<T extends readonly { display: string }[]>(
  valueSet: T
): string[] {
  return valueSet.map(item => item.display);
}

/**
 * Filter value set by category (if category field exists)
 */
export function filterValueSetByCategory<T extends readonly { category?: string }[]>(
  valueSet: T,
  category: string
): T[number][] {
  return valueSet.filter(item => item.category === category);
}

/**
 * Get grouped contact relationships by category
 */
export function getContactRelationshipsByCategory() {
  const grouped: Record<string, typeof CONTACT_RELATIONSHIP_VALUE_SET[number][]> = {};
  
  CONTACT_RELATIONSHIP_VALUE_SET.forEach(item => {
    const category = item.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });
  
  return grouped;
}

/**
 * Get grouped languages by region
 */
export function getLanguagesByRegion() {
  const grouped: Record<string, typeof LANGUAGE_VALUE_SET[number][]> = {};
  
  LANGUAGE_VALUE_SET.forEach(item => {
    const region = item.region || 'Other';
    if (!grouped[region]) {
      grouped[region] = [];
    }
    grouped[region].push(item);
  });
  
  return grouped;
}

/**
 * Get grouped practitioner qualifications by category
 */
export function getPractitionerQualificationsByCategory() {
  const grouped: Record<string, typeof PRACTITIONER_QUALIFICATION_VALUE_SET[number][]> = {};
  
  PRACTITIONER_QUALIFICATION_VALUE_SET.forEach(item => {
    const category = item.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });
  
  return grouped;
}