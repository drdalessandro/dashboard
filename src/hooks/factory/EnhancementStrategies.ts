/**
 * EnhancementStrategies.ts
 * 
 * Pre-configured enhancement strategies for different FHIR resource types
 * Used by the resource factory to automatically enhance resources with computed properties
 */

import {
  Patient,
  Practitioner,
  Observation,
  MedicationRequest,
  Condition,
  Resource,
  ResourceType
} from '@medplum/fhirtypes';
import { calculateAge } from '@medplum/core';
import { formatHumanName, formatGender } from '../../utils/fhir/resourceUtils';
import {
  type EnhancementStrategy,
  createEnhancementStrategy
} from '../base/useResourceEnhancement';

/**
 * Patient Enhancement Strategies
 */
export const PatientEnhancementStrategies = {
  basicInfo: createEnhancementStrategy<Patient>(
    'basicInfo',
    (patient: Patient) => ({
      formattedName: formatHumanName(patient.name, 'official') || 'Unknown',
      displayName: formatHumanName(patient.name, 'usual') || formatHumanName(patient.name, 'official') || 'Unknown',
      gender: formatGender(patient.gender),
      age: patient.birthDate ? Number(calculateAge(patient.birthDate)) : undefined,
      ageGroup: getAgeGroup(patient.birthDate),
      isMinor: patient.birthDate ? Number(calculateAge(patient.birthDate)) < 18 : false,
    }),
    { dependencies: ['name', 'gender', 'birthDate'] }
  ),

  contactInfo: createEnhancementStrategy<Patient>(
    'contactInfo',
    (patient: Patient) => ({
      contactInfo: patient.telecom?.[0]?.value || 'N/A',
      primaryPhone: patient.telecom?.find(t => t.system === 'phone')?.value,
      primaryEmail: patient.telecom?.find(t => t.system === 'email')?.value,
      phoneNumbers: patient.telecom?.filter(t => t.system === 'phone').map(t => t.value) || [],
      emails: patient.telecom?.filter(t => t.system === 'email').map(t => t.value) || [],
      hasEmergencyContact: !!patient.contact?.find(c => c.relationship?.[0]?.coding?.[0]?.code === 'emergency'),
    }),
    { dependencies: ['telecom', 'contact'] }
  ),

  addressInfo: createEnhancementStrategy<Patient>(
    'addressInfo',
    (patient: Patient) => ({
      address: formatAddress(patient.address?.[0]),
      city: patient.address?.[0]?.city,
      state: patient.address?.[0]?.state,
      country: patient.address?.[0]?.country,
      postalCode: patient.address?.[0]?.postalCode,
      homeAddress: patient.address?.find(a => a.use === 'home'),
      workAddress: patient.address?.find(a => a.use === 'work'),
    }),
    { dependencies: ['address'] }
  ),

  clinicalInfo: createEnhancementStrategy<Patient>(
    'clinicalInfo',
    (patient: Patient) => ({
      isActive: patient.active !== false,
      isDeceased: !!patient.deceasedBoolean || !!patient.deceasedDateTime,
      deceasedInfo: patient.deceasedDateTime
        ? `Deceased on ${new Date(patient.deceasedDateTime).toLocaleDateString()}`
        : patient.deceasedBoolean
          ? 'Deceased'
          : null,
      maritalStatus: patient.maritalStatus?.text || patient.maritalStatus?.coding?.[0]?.display,
      preferredLanguage: patient.communication?.find(c => c.preferred)?.language?.text ||
        patient.communication?.[0]?.language?.text,
      managingOrganization: patient.managingOrganization?.display,
    }),
    { dependencies: ['active', 'deceasedBoolean', 'deceasedDateTime', 'maritalStatus', 'communication', 'managingOrganization'] }
  ),

  identifiers: createEnhancementStrategy<Patient>(
    'identifiers',
    (patient: Patient) => ({
      identifiers: patient.identifier?.map(id => ({
        system: id.system,
        value: id.value,
        type: id.type?.text || id.type?.coding?.[0]?.display,
        use: id.use
      })) || [],
      primaryIdentifier: patient.identifier?.[0]?.value,
      nationalId: patient.identifier?.find(id =>
        id.type?.coding?.[0]?.code === 'NATL' ||
        id.system?.includes('national')
      )?.value,
    }),
    { dependencies: ['identifier'] }
  ),
};

/**
 * Practitioner Enhancement Strategies
 */
export const PractitionerEnhancementStrategies = {
  basicInfo: createEnhancementStrategy<Practitioner>(
    'basicInfo',
    (practitioner: Practitioner) => ({
      formattedName: formatHumanName(practitioner.name, 'official') || 'Unknown',
      displayName: formatHumanName(practitioner.name, 'usual') || formatHumanName(practitioner.name, 'official') || 'Unknown',
      gender: formatGender(practitioner.gender),
      isActive: practitioner.active !== false,
      title: practitioner.name?.[0]?.prefix?.[0],
      suffix: practitioner.name?.[0]?.suffix?.[0],
    }),
    { dependencies: ['name', 'gender', 'active'] }
  ),

  qualificationInfo: createEnhancementStrategy<Practitioner>(
    'qualificationInfo',
    (practitioner: Practitioner) => ({
      qualification: practitioner.qualification?.[0]?.code?.text ||
        practitioner.qualification?.[0]?.code?.coding?.[0]?.display || 'General',
      qualifications: practitioner.qualification?.map(q => ({
        code: q.code?.text || q.code?.coding?.[0]?.display,
        issuer: q.issuer?.display,
        period: q.period
      })) || [],
      primaryQualification: practitioner.qualification?.[0],
      hasSpecialty: (practitioner.qualification?.length || 0) > 1,
      qualificationCount: practitioner.qualification?.length || 0,
    }),
    { dependencies: ['qualification'] }
  ),

  contactInfo: createEnhancementStrategy<Practitioner>(
    'contactInfo',
    (practitioner: Practitioner) => ({
      contactInfo: practitioner.telecom?.[0]?.value || 'N/A',
      primaryPhone: practitioner.telecom?.find(t => t.system === 'phone')?.value,
      primaryEmail: practitioner.telecom?.find(t => t.system === 'email')?.value,
      workPhone: practitioner.telecom?.find(t => t.system === 'phone' && t.use === 'work')?.value,
      businessEmail: practitioner.telecom?.find(t => t.system === 'email' && t.use === 'work')?.value,
    }),
    { dependencies: ['telecom'] }
  ),

  addressInfo: createEnhancementStrategy<Practitioner>(
    'addressInfo',
    (practitioner: Practitioner) => ({
      address: formatAddress(practitioner.address?.[0]),
      city: practitioner.address?.[0]?.city,
      state: practitioner.address?.[0]?.state,
      country: practitioner.address?.[0]?.country,
      workAddress: practitioner.address?.find(a => a.use === 'work'),
    }),
    { dependencies: ['address'] }
  ),

  photoInfo: createEnhancementStrategy<Practitioner>(
    'photoInfo',
    (practitioner: Practitioner) => ({
      hasPhoto: !!practitioner.photo?.length,
      photoUrl: practitioner.photo?.[0]?.url,
      photoData: practitioner.photo?.[0]?.data,
      photoContentType: practitioner.photo?.[0]?.contentType,
    }),
    { dependencies: ['photo'] }
  ),
};

/**
 * Observation Enhancement Strategies
 */
export const ObservationEnhancementStrategies = {
  basicInfo: createEnhancementStrategy<Observation>(
    'basicInfo',
    (observation: Observation) => ({
      displayCode: observation.code?.text || observation.code?.coding?.[0]?.display || 'Unknown',
      codeSystem: observation.code?.coding?.[0]?.system,
      category: observation.category?.[0]?.text || observation.category?.[0]?.coding?.[0]?.display,
      status: observation.status,
      isFinal: observation.status === 'final',
    }),
    { dependencies: ['code', 'category', 'status'] }
  ),

  valueInfo: createEnhancementStrategy<Observation>(
    'valueInfo',
    (observation: Observation) => ({
      hasValue: !!(observation.valueQuantity || observation.valueString || observation.valueBoolean),
      valueDisplay: formatObservationValue(observation),
      unit: observation.valueQuantity?.unit,
      numericValue: observation.valueQuantity?.value,
      referenceRange: observation.referenceRange?.[0],
      isAbnormal: checkIfAbnormal(observation),
    }),
    { dependencies: ['valueQuantity', 'valueString', 'valueBoolean', 'referenceRange'] }
  ),

  contextInfo: createEnhancementStrategy<Observation>(
    'contextInfo',
    (observation: Observation) => ({
      effectiveDate: observation.effectiveDateTime || observation.effectivePeriod?.start,
      performer: observation.performer?.[0]?.display,
      subject: observation.subject?.display,
      issuedDate: observation.issued,
      daysSincePerformed: observation.effectiveDateTime
        ? Math.floor((Date.now() - new Date(observation.effectiveDateTime).getTime()) / (1000 * 60 * 60 * 24))
        : undefined,
    }),
    { dependencies: ['effectiveDateTime', 'effectivePeriod', 'performer', 'subject', 'issued'] }
  ),
};

/**
 * MedicationRequest Enhancement Strategies
 */
export const MedicationRequestEnhancementStrategies = {
  basicInfo: createEnhancementStrategy<MedicationRequest>(
    'basicInfo',
    (medicationRequest: MedicationRequest) => ({
      medicationDisplay: getMedicationDisplay(medicationRequest),
      status: medicationRequest.status,
      intent: medicationRequest.intent,
      isActive: medicationRequest.status === 'active',
      priority: medicationRequest.priority,
    }),
    { dependencies: ['medicationCodeableConcept', 'medicationReference', 'status', 'intent', 'priority'] }
  ),

  dosageInfo: createEnhancementStrategy<MedicationRequest>(
    'dosageInfo',
    (medicationRequest: MedicationRequest) => ({
      dosageInstructions: medicationRequest.dosageInstruction?.[0]?.text,
      route: medicationRequest.dosageInstruction?.[0]?.route?.text,
      frequency: medicationRequest.dosageInstruction?.[0]?.timing?.repeat?.frequency,
      dose: medicationRequest.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity,
      hasDosageInstructions: !!medicationRequest.dosageInstruction?.length,
    }),
    { dependencies: ['dosageInstruction'] }
  ),

  contextInfo: createEnhancementStrategy<MedicationRequest>(
    'contextInfo',
    (medicationRequest: MedicationRequest) => ({
      authoredOn: medicationRequest.authoredOn,
      requester: medicationRequest.requester?.display,
      subject: medicationRequest.subject?.display,
      reasonCode: medicationRequest.reasonCode?.[0]?.text,
      daysSinceAuthored: medicationRequest.authoredOn
        ? Math.floor((Date.now() - new Date(medicationRequest.authoredOn).getTime()) / (1000 * 60 * 60 * 24))
        : undefined,
    }),
    { dependencies: ['authoredOn', 'requester', 'subject', 'reasonCode'] }
  ),
};

/**
 * Condition Enhancement Strategies
 */
export const ConditionEnhancementStrategies = {
  basicInfo: createEnhancementStrategy<Condition>(
    'basicInfo',
    (condition: Condition) => ({
      displayCode: condition.code?.text || condition.code?.coding?.[0]?.display || 'Unknown',
      clinicalStatus: condition.clinicalStatus?.coding?.[0]?.code,
      verificationStatus: condition.verificationStatus?.coding?.[0]?.code,
      severity: condition.severity?.text || condition.severity?.coding?.[0]?.display,
      isActive: condition.clinicalStatus?.coding?.[0]?.code === 'active',
    }),
    { dependencies: ['code', 'clinicalStatus', 'verificationStatus', 'severity'] }
  ),

  contextInfo: createEnhancementStrategy<Condition>(
    'contextInfo',
    (condition: Condition) => ({
      onsetDate: condition.onsetDateTime || condition.onsetPeriod?.start,
      recordedDate: condition.recordedDate,
      subject: condition.subject?.display,
      asserter: condition.asserter?.display,
      daysSinceOnset: condition.onsetDateTime
        ? Math.floor((Date.now() - new Date(condition.onsetDateTime).getTime()) / (1000 * 60 * 60 * 24))
        : undefined,
    }),
    { dependencies: ['onsetDateTime', 'onsetPeriod', 'recordedDate', 'subject', 'asserter'] }
  ),
};

/**
 * Registry of all enhancement strategies by resource type
 */
export const EnhancementStrategiesByResource = {
  Patient: PatientEnhancementStrategies,
  Practitioner: PractitionerEnhancementStrategies,
  Observation: ObservationEnhancementStrategies,
  MedicationRequest: MedicationRequestEnhancementStrategies,
  Condition: ConditionEnhancementStrategies,
} as const;

/**
 * Get enhancement strategies for a resource type
 */
export function getEnhancementStrategies<T extends Resource = Resource>(
  resourceType: ResourceType
): EnhancementStrategy<T>[] {
  const strategies = EnhancementStrategiesByResource[resourceType as keyof typeof EnhancementStrategiesByResource];
  if (!strategies) return [];

  return Object.values(strategies) as EnhancementStrategy<T>[];
}

/**
 * Utility functions
 */
function getAgeGroup(birthDate?: string): string | undefined {
  if (!birthDate) return undefined;

  const age = Number(calculateAge(birthDate));
  if (age < 1) return 'Infant';
  if (age < 13) return 'Child';
  if (age < 18) return 'Adolescent';
  if (age < 65) return 'Adult';
  return 'Senior';
}

function formatAddress(address?: any): string {
  if (!address) return 'N/A';

  if (address.text) return address.text;

  const parts = [
    ...(address.line || []),
    address.city,
    address.state,
    address.postalCode,
    address.country
  ].filter(Boolean);

  return parts.join(', ') || 'N/A';
}

function formatObservationValue(observation: Observation): string {
  if (observation.valueQuantity) {
    const unit = observation.valueQuantity.unit ? ` ${observation.valueQuantity.unit}` : '';
    return `${observation.valueQuantity.value}${unit}`;
  }

  if (observation.valueString) return observation.valueString;
  if (observation.valueBoolean !== undefined) return observation.valueBoolean.toString();

  return 'N/A';
}

function checkIfAbnormal(observation: Observation): boolean {
  if (!observation.valueQuantity?.value || !observation.referenceRange?.length) {
    return false;
  }

  const value = observation.valueQuantity.value;
  const range = observation.referenceRange[0];

  if (range.low?.value && value < range.low.value) return true;
  if (range.high?.value && value > range.high.value) return true;

  return false;
}

function getMedicationDisplay(medicationRequest: MedicationRequest): string {
  if (medicationRequest.medicationCodeableConcept) {
    return medicationRequest.medicationCodeableConcept.text ||
      medicationRequest.medicationCodeableConcept.coding?.[0]?.display ||
      'Unknown Medication';
  }

  if (medicationRequest.medicationReference) {
    return medicationRequest.medicationReference.display || 'Referenced Medication';
  }

  return 'Unknown Medication';
}

/**
 * Type exports for better TypeScript support
 */
export type PatientStrategies = typeof PatientEnhancementStrategies;
export type PractitionerStrategies = typeof PractitionerEnhancementStrategies;
export type ObservationStrategies = typeof ObservationEnhancementStrategies;
export type MedicationRequestStrategies = typeof MedicationRequestEnhancementStrategies;
export type ConditionStrategies = typeof ConditionEnhancementStrategies;
