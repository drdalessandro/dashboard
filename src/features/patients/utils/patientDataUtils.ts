/**
 * Patient Data Utilities
 * Handles data transformation and processing for patient-related components
 * Ensures consistent data access patterns across the application
 */

import { Patient, AllergyIntolerance, Condition, Immunization, MedicationRequest, Observation, Appointment, Encounter } from '@medplum/fhirtypes';
import { format } from 'date-fns';
import { useAllergyIntolerance } from '@/hooks/useAllergyIntolerance';
import { useCondition } from '@/hooks/useCondition';
import { useImmunization } from '@/hooks/useImmunization';
import { useMedicationRequest } from '@/hooks/useMedicationRequest';

/**
 * Extended patient data structure for UI display
 */
export interface PatientDisplayData {
  id: string;
  identifier?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  age?: number;
  phoneNumbers: Array<{ system: string; value: string; }>;
  email?: Array<{ system: string; value: string; }>;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  maritalStatus?: string;
  language?: string;
  photo?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  status: 'active' | 'inactive';
  deceasedBoolean?: boolean;
  registrationDate?: string;
  lastUpdated?: string;
  generalPractitioner?: string;
  managingOrganization?: string;
  insurance?: {
    provider: string;
    memberId: string;
  };
  vitals: PatientVitals;
  clinicalData: PatientClinicalData;
}

/**
 * Patient vitals structure
 */
export interface PatientVitals {
  bloodPressure: string;
  heartRate: string;
  glucoseLevel: string;
  weight: string;
  height: string;
  bmi: string;
  temperature?: string;
  oxygenSaturation?: string;
  respiratoryRate?: string;
  lastUpdated?: string;
}

/**
 * Patient clinical data structure
 */
export interface PatientClinicalData {
  allergies: Array<{ name: string; severity?: string; }>;
  conditions: Array<{ name: string; status?: string; }>;
  immunizations: Array<{ name: string; date: string; }>;
  medications: Array<{ name: string; dosage: string; frequency: string; }>;
}

/**
 * Extract and format patient name from FHIR name array
 */
export function formatPatientName(patient: Patient): string {
  if (!patient.name || patient.name.length === 0) {
    return 'Unknown Patient';
  }

  const name = patient.name[0];

  // Try to use the text field first if available
  if (name.text) {
    return name.text;
  }

  // Otherwise build from parts
  const parts: string[] = [];

  if (name.given) {
    parts.push(...name.given);
  }

  if (name.family) {
    parts.push(name.family);
  }

  return parts.length > 0 ? parts.join(' ') : 'Unknown Patient';
}

/**
 * Extract first and last name separately
 */
export function extractNameParts(patient: Patient): { firstName?: string; lastName?: string } {
  if (!patient.name || patient.name.length === 0) {
    return {};
  }

  const name = patient.name[0];

  return {
    firstName: name.given?.[0],
    lastName: name.family
  };
}

/**
 * Calculate patient's age from birthDate
 */
export function calculateAge(birthDate?: string): number | null {
  if (!birthDate) return null;

  try {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
}

/**
 * Extract phone numbers with their systems from telecom array
 */
export function extractPhoneNumbers(patient: Patient): Array<{ system: string, value: string }> {
  if (!patient.telecom) return [];

  return patient.telecom
    .filter(contact => contact.system === 'phone' && contact.value)
    .map(contact => ({
      system: contact.use || 'phone',
      value: contact.value as string
    }));
}

/**
 * Extract email from telecom array
 */
export function extractEmail(patient: Patient): Array<{ system: string, value: string }> | undefined {
  if (!patient.telecom) return [];

  return patient.telecom
    .filter(contact => contact.system === 'email' && contact.value)
    .map(contact => ({
      system: contact.use || 'email',
      value: contact.value as string
    }));
}

/**
 * Extract and format address components
 */
export function extractAddress(patient: Patient): {
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
} {
  if (!patient.address || patient.address.length === 0) {
    return {};
  }

  const addr = patient.address[0];

  // Build from parts
  const addressParts: string[] = [];

  if (addr.line) {
    addressParts.push(...addr.line);
  }

  return {
    address: addr.text,
    addressLine1: addr.line?.[0],
    addressLine2: addr.line?.[1],
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country
  };
}

/**
 * Extract patient identifier
 */
export function extractIdentifier(patient: Patient, system?: string): string | undefined {
  if (!patient.identifier || patient.identifier.length === 0) return undefined;

  const identifier = system
    ? patient.identifier.find(id => id.system === system)
    : patient.identifier[0];

  return identifier?.value;
}

/**
 * Extract marital status
 */
export function extractMaritalStatus(patient: Patient): string | undefined {
  return patient.maritalStatus?.text || patient.maritalStatus?.coding?.[0]?.display;
}

/**
 * Extract preferred language
 */
export function extractLanguage(patient: Patient): string | undefined {
  return patient.communication?.[0]?.language?.text || patient.communication?.[0]?.language?.coding?.[0]?.display;
}

/**
 * Extract general practitioner
 */
export function extractGeneralPractitioner(patient: Patient): string | undefined {
  if (!patient.generalPractitioner || patient.generalPractitioner.length === 0) return undefined;

  const gp = patient.generalPractitioner[0];
  return gp.display || gp.reference;
}

/**
 * Extract managing organization
 */
export function extractManagingOrganization(patient: Patient): string | undefined {
  if (!patient.managingOrganization) return undefined;

  const mo = patient.managingOrganization;
  return mo.display || mo.reference;
}

/**
 * Convert height from cm to feet/inches
 */
export function getHeightImperial(heightCm: number | undefined): string {
  if (!heightCm) return '-';
  const totalInches = heightCm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

/**
 * Convert weight from kg to lbs
 */
export function getWeightImperial(weightKg: number | undefined): string {
  if (!weightKg) return '-';
  const lbs = Math.round(weightKg * 2.20462);
  return `${lbs} lbs`;
}

/**
 * Calculate BMI
 */
export function calculateBMI(weightKg: number | undefined, heightCm: number | undefined): string {
  if (!weightKg || !heightCm) return '-';

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return bmi.toFixed(1);
}

/**
 * Get formatted registration date
 */
export function getFormattedRegistrationDate(patient: Patient): string {
  const registrationDate = patient.meta?.lastUpdated || new Date().toISOString();

  try {
    return format(new Date(registrationDate), 'MMM dd, yyyy');
  } catch (error) {
    return 'Date not available';
  }
}

/**
 * Process clinical data from various resources
 */
export function processClinicalData(
  allergies: AllergyIntolerance[],
  conditions: Condition[],
  immunizations: Immunization[],
  medications: MedicationRequest[]
): PatientClinicalData {
  return {
    allergies: allergies.map(allergy => ({
      name: getAllergyDisplay(allergy),
      severity: allergy.criticality
    })),
    conditions: conditions.map(condition => ({
      name: getConditionDisplay(condition),
      status: condition.clinicalStatus?.coding?.[0]?.code
    })),
    immunizations: immunizations.map(immunization => ({
      name: getImmunizationDisplay(immunization),
      date: getImmunizationDate(immunization) || new Date().toISOString().split('T')[0]
    })),
    medications: medications.map(medication => ({
      name: getMedicationName(medication),
      dosage: getMedicationDosage(medication),
      frequency: formatDosageInstructions(medication)
    }))
  };
}

/**
 * Process appointments for display
 */
export function processAppointments(appointments: Appointment[]): Array<{
  id: string;
  date: string;
  time: string;
  provider: string;
  reason: string;
  status: string;
}> {
  return appointments.map(appointment => ({
    id: appointment.id || '',
    date: appointment.start ? format(new Date(appointment.start), 'yyyy-MM-dd') : '',
    time: appointment.start ? format(new Date(appointment.start), 'h:mm a') : '',
    provider: appointment.participant?.find(p => p.actor?.reference?.includes('Practitioner'))?.actor?.display || 'Unknown',
    reason: appointment.reasonCode?.[0]?.text || appointment.description || 'General consultation',
    status: appointment.status || 'unknown'
  }));
}


/**
 * Transform FHIR Patient to UI display data with sensible defaults
 */
export function transformPatientForDisplay(
  patient: Patient,
  vitals: PatientVitals,
  clinicalData: PatientClinicalData
): PatientDisplayData {
  const { firstName, lastName } = extractNameParts(patient);
  const addressData = extractAddress(patient);
  const phoneNumbers = extractPhoneNumbers(patient);
  const email = extractEmail(patient);
  const age = calculateAge(patient.birthDate);

  return {
    id: patient.id || '',
    identifier: extractIdentifier(patient),
    name: formatPatientName(patient),
    firstName,
    lastName,
    gender: patient.gender,
    birthDate: patient.birthDate,
    age: age || undefined,
    phoneNumbers,
    email,
    ...addressData,
    maritalStatus: extractMaritalStatus(patient),
    language: extractLanguage(patient),
    photo: patient.photo?.[0]?.url,
    emergencyContact: {
      name: 'Emergency Contact',
      relationship: 'Family Member',
      phone: 'Not provided'
    },
    status: patient.active !== false ? 'active' : 'inactive',
    deceasedBoolean: patient.deceasedBoolean,
    registrationDate: getFormattedRegistrationDate(patient),
    lastUpdated: patient.meta?.lastUpdated,
    generalPractitioner: extractGeneralPractitioner(patient),
    managingOrganization: extractManagingOrganization(patient),
    insurance: {
      provider: t('patient:insurance.defaultProvider'),
      memberId: t('patient:insurance.defaultMemberId')
    },
    vitals,
    clinicalData
  };
}

/**
 * Check if patient data is valid and complete enough for display
 */
export function validatePatientForDisplay(patient: Patient): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!patient.id) {
    missingFields.push('id');
  }

  if (!patient.name || patient.name.length === 0) {
    missingFields.push('name');
  }

  if (!patient.birthDate) {
    missingFields.push('birthDate');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Display value with dash fallback
 */
export function displayOrDash(value: string | number | undefined | null): string {
  return value?.toString() || '-';
}

/**
 * Format date for display
 */
export function formatDateForDisplay(dateString?: string, formatString: string = 'MMM dd, yyyy'): string {
  if (!dateString) return '-';

  try {
    return format(new Date(dateString), formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Get patient initials for avatar
 */
export function getPatientInitials(patient: Patient): string {
  const name = formatPatientName(patient);
  if (!name || name === 'Unknown Patient') return 'UP';

  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Get avatar color based on gender
 */
export function getPatientAvatarColor(gender?: string): string {
  switch (gender?.toLowerCase()) {
    case 'male':
      return '#1E88E5'; // Blue
    case 'female':
      return '#E91E63'; // Pink
    default:
      return '#78909C'; // Blue Grey
  }
}

/**
 * Get status badge color
 */
export function getPatientStatusColor(status: 'active' | 'inactive'): {
  backgroundColor: string;
  color: string;
} {
  return status === 'active'
    ? { backgroundColor: '#E7F5E1', color: '#4CAF50' }
    : { backgroundColor: '#FFE5E5', color: '#FF5252' };
}

/**
 * Validate patient form data
 */
export function validatePatientForm(data: Partial<Patient>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.name || data.name.length === 0 || !data.name[0].family) {
    errors.name = 'Last name is required';
  }

  if (!data.birthDate) {
    errors.birthDate = 'Birth date is required';
  }

  if (!data.gender) {
    errors.gender = 'Gender is required';
  }

  // Validate email format if provided
  const email = data.telecom?.find(t => t.system === 'email')?.value;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Invalid email format';
  }

  // Validate phone format if provided
  const phone = data.telecom?.find(t => t.system === 'phone')?.value;
  if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
    errors.phone = 'Invalid phone format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Create empty patient template
 */
export function createEmptyPatient(): Partial<Patient> {
  return {
    resourceType: 'Patient',
    active: true,
    name: [{
      use: 'official',
      family: '',
      given: ['']
    }],
    telecom: [],
    gender: undefined,
    birthDate: undefined,
    address: [{
      use: 'home',
      line: [],
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }],
    maritalStatus: undefined,
    communication: []
  };
}

/**
 * Merge patient updates with existing data
 */
export function mergePatientUpdates(
  existing: Patient,
  updates: Partial<Patient>
): Patient {
  return {
    ...existing,
    ...updates,
    name: updates.name || existing.name,
    telecom: updates.telecom || existing.telecom,
    address: updates.address || existing.address,
    meta: {
      ...existing.meta,
      lastUpdated: new Date().toISOString()
    }
  };
}


/**
 * Type definition for appointment data
 */
export interface AppointmentData {
  id: string;
  date: string;
  time: string;
  provider: string;
  reason: string;
  status: string;
}

/**
 * Get default vitals data for initial display
 * Used when actual observation data is not yet loaded
 */
export function getDefaultVitals(): PatientVitals {
  return {
    bloodPressure: '120/80',
    heartRate: '72',
    glucoseLevel: '78 - 92',
    weight: '75',
    height: '180',
    bmi: '24.2',
    lastUpdated: new Date().toISOString().split('T')[0]
  };
}

/**
 * Get default appointments for initial display
 * Used when actual appointment data is not yet loaded
 */
export function getDefaultAppointments(): AppointmentData[] {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);

  return [
    {
      id: 'appt1',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      provider: 'Dr. Aminata Diallo',
      reason: 'Follow-up',
      status: 'Completed',
    },
    {
      id: 'appt2',
      date: futureDate.toISOString().split('T')[0],
      time: '2:30 PM',
      provider: 'Dr. Aminata Diallo',
      reason: 'Medication Review',
      status: 'Scheduled',
    },
  ];
}

/**
 * Process clinical data from API responses with loading states
 * Handles the common pattern of checking loading state and mapping data
 */
export function processClinicalDataFromResponses(
  allergiesResponse: { data?: AllergyIntolerance[], isLoading: boolean },
  conditionsResponse: { data?: Condition[], isLoading: boolean },
  immunizationsResponse: { data?: Immunization[], isLoading: boolean },
  medicationsResponse: { data?: MedicationRequest[], isLoading: boolean }
): PatientClinicalData {
  return {
    allergies: !allergiesResponse.isLoading && allergiesResponse.data
      ? allergiesResponse.data.map(allergy => ({
        name: getAllergyDisplay(allergy),
        severity: allergy.criticality
      }))
      : [],
    conditions: !conditionsResponse.isLoading && conditionsResponse.data
      ? conditionsResponse.data.map(condition => ({
        name: getConditionDisplay(condition),
        status: condition.clinicalStatus?.coding?.[0]?.code
      }))
      : [],
    immunizations: !immunizationsResponse.isLoading && immunizationsResponse.data
      ? immunizationsResponse.data.map(immunization => ({
        name: getImmunizationDisplay(immunization),
        date: getImmunizationDate(immunization) || new Date().toISOString().split('T')[0]
      }))
      : [],
    medications: !medicationsResponse.isLoading && medicationsResponse.data
      ? medicationsResponse.data.map(medication => ({
        name: getMedicationName(medication),
        dosage: getMedicationDosage(medication),
        frequency: formatDosageInstructions(medication)
      }))
      : []
  };
}

/**
 * Get patient phone number from telecom array
 * Returns formatted phone or default message
 */
export function getPatientPhone(patient: Patient | undefined): string {
  if (!patient?.telecom) return 'No phone number';

  const phone = patient.telecom.find(t => t.system === 'phone');
  return phone?.value || 'No phone number';
}

/**
 * Calculate combined loading state from multiple queries
 */
export function calculateCombinedLoadingState(
  isValidPatientId: boolean,
  ...loadingStates: boolean[]
): boolean {
  if (!isValidPatientId) return false;
  return loadingStates.some(state => state);
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'Unknown error occurred';
}
/**
 * FHIR Resource Display Utilities
 * Helper functions for extracting display text from FHIR resources
 * These functions safely handle CodeableConcept structures and provide fallbacks
 */

/**
 * Extract display text from FHIR AllergyIntolerance resource
 */
export function getAllergyDisplay(allergy: AllergyIntolerance): string {
  if (!allergy.code) {
    return 'Unknown Allergy';
  }

  // Try text field first
  if (allergy.code.text) {
    return allergy.code.text;
  }

  // Try coding display
  if (allergy.code.coding && allergy.code.coding.length > 0) {
    const coding = allergy.code.coding[0];
    if (coding.display) {
      return coding.display;
    }
    if (coding.code) {
      return coding.code;
    }
  }

  return 'Unknown Allergy';
}

/**
 * Extract display text from FHIR Condition resource
 */
export function getConditionDisplay(condition: Condition): string {
  if (!condition.code) {
    return 'Unknown Condition';
  }

  // Try text field first
  if (condition.code.text) {
    return condition.code.text;
  }

  // Try coding display
  if (condition.code.coding && condition.code.coding.length > 0) {
    const coding = condition.code.coding[0];
    if (coding.display) {
      return coding.display;
    }
    if (coding.code) {
      return coding.code;
    }
  }

  return 'Unknown Condition';
}

/**
 * Extract display text from FHIR Immunization resource
 */
export function getImmunizationDisplay(immunization: Immunization): string {
  if (!immunization.vaccineCode) {
    return 'Unknown Vaccine';
  }

  // Try text field first
  if (immunization.vaccineCode.text) {
    return immunization.vaccineCode.text;
  }

  // Try coding display
  if (immunization.vaccineCode.coding && immunization.vaccineCode.coding.length > 0) {
    const coding = immunization.vaccineCode.coding[0];
    if (coding.display) {
      return coding.display;
    }
    if (coding.code) {
      return coding.code;
    }
  }

  return 'Unknown Vaccine';
}

/**
 * Extract occurrence date from FHIR Immunization resource
 */
export function getImmunizationDate(immunization: Immunization): string | undefined {
  // Try occurrenceDateTime first
  if (immunization.occurrenceDateTime) {
    return immunization.occurrenceDateTime;
  }

  // Try occurrenceString
  if (immunization.occurrenceString) {
    return immunization.occurrenceString;
  }

  // Try recorded date as fallback
  if (immunization.recorded) {
    return immunization.recorded;
  }

  return undefined;
}

/**
 * Extract medication name from FHIR MedicationRequest resource
 */
export function getMedicationName(medication: MedicationRequest): string {
  // Try medicationCodeableConcept first
  if (medication.medicationCodeableConcept) {
    const code = medication.medicationCodeableConcept;

    if (code.text) {
      return code.text;
    }

    if (code.coding && code.coding.length > 0) {
      const coding = code.coding[0];
      if (coding.display) {
        return coding.display;
      }
      if (coding.code) {
        return coding.code;
      }
    }
  }

  // Try medicationReference display
  if (medication.medicationReference && medication.medicationReference.display) {
    return medication.medicationReference.display;
  }

  return 'Unknown Medication';
}

/**
 * Extract dosage information from FHIR MedicationRequest resource
 */
export function getMedicationDosage(medication: MedicationRequest): string {
  if (!medication.dosageInstruction || medication.dosageInstruction.length === 0) {
    return 'Not specified';
  }

  const dosage = medication.dosageInstruction[0];

  // Try doseAndRate first
  if (dosage.doseAndRate && dosage.doseAndRate.length > 0) {
    const doseAndRate = dosage.doseAndRate[0];

    // Try doseQuantity
    if (doseAndRate.doseQuantity) {
      const dose = doseAndRate.doseQuantity;
      return `${dose.value || ''} ${dose.unit || dose.code || ''}`.trim();
    }

    // Try doseRange
    if (doseAndRate.doseRange) {
      const range = doseAndRate.doseRange;
      const low = range.low ? `${range.low.value} ${range.low.unit || ''}` : '';
      const high = range.high ? `${range.high.value} ${range.high.unit || ''}` : '';
      return low && high ? `${low} - ${high}` : low || high || 'Range not specified';
    }
  }

  // Try text field as fallback
  if (dosage.text) {
    return dosage.text;
  }

  return 'Not specified';
}

/**
 * Format dosage instructions from FHIR MedicationRequest resource
 */
export function formatDosageInstructions(medication: MedicationRequest): string {
  if (!medication.dosageInstruction || medication.dosageInstruction.length === 0) {
    return 'As directed';
  }

  const dosage = medication.dosageInstruction[0];

  // Try timing information
  let frequency = '';
  if (dosage.timing) {
    const timing = dosage.timing;

    if (timing.repeat) {
      const repeat = timing.repeat;

      if (repeat.frequency && repeat.period) {
        frequency = `${repeat.frequency} times per ${repeat.periodUnit || 'day'}`;
      } else if (repeat.frequency) {
        frequency = `${repeat.frequency} times daily`;
      }
    }

    // Try code for standard frequencies
    if (timing.code && timing.code.coding && timing.code.coding.length > 0) {
      const timingCode = timing.code.coding[0];
      if (timingCode.display) {
        frequency = timingCode.display;
      }
    }
  }

  // Try patientInstruction
  if (dosage.patientInstruction) {
    return frequency ? `${frequency} - ${dosage.patientInstruction}` : dosage.patientInstruction;
  }

  // Try text field
  if (dosage.text) {
    return frequency ? `${frequency} - ${dosage.text}` : dosage.text;
  }

  return frequency || 'As directed';
}

/**
 * Fallback translation function
 * Provides default values when translation system is not available
 */
function t(key: string): string {
  const translations: Record<string, string> = {
    'patient:insurance.defaultProvider': 'Mali National Health Insurance',
    'patient:insurance.defaultMemberId': 'Not specified'
  };

  return translations[key] || key;
}

/**
 * Process FHIR Observation resources into structured vitals data
 * @param observations - Array of FHIR Observation resources
 * @returns Structured vitals data with latest values
 */
export function processVitalsFromObservations(observations: Observation[]): PatientVitals & {
  vitalsCards: Array<{
    icon: string;
    label: string;
    value: string;
    unit: string;
    status: 'normal' | 'high' | 'low';
    lastUpdated?: string;
  }>
} {
  const vitals: PatientVitals = {
    bloodPressure: '-',
    heartRate: '-',
    glucoseLevel: '-',
    weight: '-',
    height: '-',
    bmi: '-',
    temperature: '-',
    oxygenSaturation: '-',
    respiratoryRate: '-',
    lastUpdated: undefined
  };

  let latestDate: string | undefined = undefined;

  // LOINC code mappings for vital signs
  const vitalMappings: Record<string, keyof PatientVitals> = {
    '85354-9': 'bloodPressure',  // Blood pressure panel
    '8867-4': 'heartRate',       // Heart rate
    '33747-0': 'glucoseLevel',   // Blood glucose
    '29463-7': 'weight',         // Body weight
    '8302-2': 'height',          // Body height
    '39156-5': 'bmi',           // Body mass index
    '8310-5': 'temperature',     // Body temperature
    '2708-6': 'oxygenSaturation', // Oxygen saturation
    '9279-1': 'respiratoryRate'   // Respiratory rate
  };

  // Process each observation
  observations.forEach(obs => {
    if (!obs.code?.coding) return;

    // Find matching LOINC code
    const loinc = obs.code.coding.find(c => c.system === 'http://loinc.org');
    if (!loinc?.code) return;

    const vitalKey = vitalMappings[loinc.code];
    if (!vitalKey) return;

    // Extract value and unit
    let value = '-';
    let unit = '';

    if (obs.valueQuantity) {
      value = obs.valueQuantity.value?.toString() || '-';
      unit = obs.valueQuantity.unit || '';
    } else if (obs.valueString) {
      value = obs.valueString;
    } else if (obs.component && obs.component.length > 0) {
      // Handle blood pressure with components
      if (loinc.code === '85354-9') {
        const systolic = obs.component.find(c =>
          c.code?.coding?.find(cc => cc.code === '8480-6')
        )?.valueQuantity?.value;
        const diastolic = obs.component.find(c =>
          c.code?.coding?.find(cc => cc.code === '8462-4')
        )?.valueQuantity?.value;

        if (systolic && diastolic) {
          value = `${systolic}/${diastolic}`;
          unit = 'mmHg';
        }
      }
    }

    // Update vitals object
    if (value !== '-') {
      vitals[vitalKey] = unit ? `${value} ${unit}` : value;

      // Track latest update date
      if (obs.effectiveDateTime) {
        if (!latestDate || obs.effectiveDateTime > latestDate) {
          latestDate = obs.effectiveDateTime;
        }
      }
    }
  });

  vitals.lastUpdated = latestDate;

  // Create vitals cards data including Body Weight
  const vitalsCards = [
    {
      icon: '🩸',
      label: 'Blood Pressure',
      value: vitals.bloodPressure.replace(/\s.*$/, ''), // Remove unit for display
      unit: 'mmHg',
      status: determineVitalStatus('bloodPressure', vitals.bloodPressure),
      lastUpdated: latestDate
    },
    {
      icon: '❤️',
      label: 'Heart Rate',
      value: vitals.heartRate.replace(/\s.*$/, ''),
      unit: 'bpm',
      status: determineVitalStatus('heartRate', vitals.heartRate),
      lastUpdated: latestDate
    },
    {
      icon: '🩺',
      label: 'Glucose',
      value: vitals.glucoseLevel.replace(/\s.*$/, ''),
      unit: 'mg/dL',
      status: determineVitalStatus('glucose', vitals.glucoseLevel),
      lastUpdated: latestDate
    },
    {
      icon: '💧',
      label: 'Cholesterol',
      value: '-', // Note: Cholesterol LOINC code not in current mapping, will show placeholder
      unit: 'mg/dL',
      status: 'normal' as const,
      lastUpdated: latestDate
    },
    {
      icon: '⚖️',
      label: 'Body Weight',
      value: vitals.weight.replace(/\s.*$/, ''),
      unit: 'kg',
      status: determineVitalStatus('weight', vitals.weight),
      lastUpdated: latestDate
    }
  ];

  return { ...vitals, vitalsCards };
}

/**
 * Determine vital status based on value and type
 * @param vitalType - Type of vital sign
 * @param value - Current value
 * @returns Status classification
 */
function determineVitalStatus(vitalType: string, value: string): 'normal' | 'high' | 'low' {
  if (value === '-' || !value) return 'normal';

  const numericValue = parseFloat(value.replace(/[^\d.]/g, ''));
  if (isNaN(numericValue)) return 'normal';

  switch (vitalType) {
    case 'heartRate':
      if (numericValue < 60) return 'low';
      if (numericValue > 100) return 'high';
      return 'normal';

    case 'bloodPressure':
      // Parse systolic pressure (first number)
      const systolic = parseInt(value.split('/')[0] || '0');
      if (systolic < 90) return 'low';
      if (systolic > 140) return 'high';
      return 'normal';

    case 'glucose':
      if (numericValue < 70) return 'low';
      if (numericValue > 100) return 'high';
      return 'normal';

    case 'weight':
      // Weight status would need height for BMI calculation
      return 'normal';

    default:
      return 'normal';
  }
}

/**
 * Process encounters into visits data
 * @param encounters - Array of FHIR Encounter resources
 * @returns Structured visits data
 */
export function processEncountersIntoVisits(encounters: Encounter[]) {
  return encounters.map(encounter => ({
    id: encounter.id || '',
    date: encounter.period?.start || '',
    type: encounter.type?.[0]?.coding?.[0]?.display || encounter.type?.[0]?.text || 'Visit',
    provider: encounter.participant?.[0]?.individual?.display || 'Unknown Provider',
    status: encounter.status === 'finished' ? 'Completed' :
      encounter.status === 'in-progress' ? 'In Progress' :
        encounter.status === 'planned' ? 'Scheduled' : 'Unknown',
    reason: encounter.reasonCode?.[0]?.coding?.[0]?.display || encounter.reasonCode?.[0]?.text,
    location: encounter.location?.[0]?.location?.display
  }));
}
