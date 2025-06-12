// src/features/patients/utils/patientTransformers.ts
import { Patient as MedplumPatient } from '@medplum/fhirtypes';
import { Patient } from '../types/patient.types';

/**
 * Convert Medplum FHIR Patient to our application's Patient type
 * Ensures all required fields are present and correctly formatted
 */
export const convertPatientFromFHIR = (patient: MedplumPatient): Patient => {
  // Ensure name is in the correct format
  const nameObj = Array.isArray(patient.name)
    ? patient.name[0]
    : { text: '', given: [''], family: '', use: '' };
  const nameText = nameObj.text || `${nameObj.given?.[0] || ''} ${nameObj.family || ''}`;

  // Ensure telecom is in the correct format
  const telecom = patient.telecom || [];
  const phone = telecom.find(t => t.system === 'phone')?.value || '';
  const email = telecom.find(t => t.system === 'email')?.value || '';

  // Handle address
  const address = patient.address || [];
  const homeAddress = address.find(a => a.use === 'home') || { text: '', use: 'home' };

  return {
    ...patient,
    id: patient.id || crypto.randomUUID(), // Ensure non-undefined id
    name: [{
      ...nameObj,
      text: nameText,
      use: (nameObj.use === 'usual' || nameObj.use === 'official' ||
        nameObj.use === 'temp' || nameObj.use === 'nickname' ||
        nameObj.use === 'anonymous' || nameObj.use === 'old' ||
        nameObj.use === 'maiden')
        ? nameObj.use
        : 'usual',
      given: nameObj.given || [],
      family: nameObj.family || ''
    }],
    gender: (patient.gender === 'male' || patient.gender === 'female' ||
      patient.gender === 'other' || patient.gender === 'unknown')
      ? patient.gender
      : 'unknown',
    birthDate: patient.birthDate || '',
    telecom: [
      { system: 'phone', value: phone, use: 'home' },
      { system: 'email', value: email, use: 'home' }
    ],
    address: [{
      use: homeAddress.use || 'home',
      text: homeAddress.text || ''
    }],
    status: patient.active ? 'active' : 'inactive',
    identifier: patient.identifier?.map(id => ({
      value: id.value || '',
      system: id.system || ''
    })) || [],
    _offline: false,
    resourceType: 'Patient'
  } as Patient;
};

/**
 * Format patient data for the table display
 */
export const formatPatientForTable = (patient: MedplumPatient): {
  id: string;
  name: { use: string; text: string };
  gender: string;
  birthDate: string;
  telecom: { system: string; value: string; use?: string }[];
  address: { use: string; text: string }[];
  status: string;
  identifier?: { value: string; system: string }[];
  _offline: boolean;
  resourceType: 'Patient';
} => {
  // Ensure name is in the correct format
  const nameObj = Array.isArray(patient.name)
    ? patient.name[0]
    : { text: '', given: [''], family: '', use: '' };
  const nameText = nameObj.text || `${nameObj.given?.[0] || ''} ${nameObj.family || ''}`;

  // Ensure telecom is in the correct format
  const telecom = patient.telecom || [];
  const phone = telecom.find(t => t.system === 'phone')?.value || '';
  const email = telecom.find(t => t.system === 'email')?.value || '';

  // Ensure address is in the correct format
  const address = patient.address || [];
  const homeAddress = address.find(a => a.use === 'home') || { text: '', use: 'home' };

  // Construct patient object with explicit type
  return {
    id: patient.id || crypto.randomUUID(), // Ensure non-undefined id
    name: {
      use: (nameObj.use === 'usual' || nameObj.use === 'official' ||
        nameObj.use === 'temp' || nameObj.use === 'nickname' ||
        nameObj.use === 'anonymous' || nameObj.use === 'old' ||
        nameObj.use === 'maiden')
        ? nameObj.use
        : 'usual',
      text: nameText
    },
    gender: (patient.gender === 'male' || patient.gender === 'female' ||
      patient.gender === 'other' || patient.gender === 'unknown')
      ? patient.gender
      : 'unknown',
    birthDate: patient.birthDate || '',
    telecom: [
      { system: 'phone', value: phone, use: 'home' },
      { system: 'email', value: email, use: 'home' }
    ],
    address: [{
      use: homeAddress.use || 'home',
      text: homeAddress.text || ''
    }],
    status: patient.active ? 'active' : 'inactive',
    identifier: patient.identifier?.map(id => ({
      value: id.value || '',
      system: id.system || ''
    })) || [],
    _offline: false,
    resourceType: 'Patient'
  };
};

/**
 * Calculate patient statistics
 */
export const calculatePatientStats = (patients: Patient[]) => {
  const totalPatients = patients.length;
  const activePatients = patients.filter(patient => patient.status === 'active').length;
  const inactivePatients = totalPatients - activePatients;

  return {
    total: totalPatients,
    active: activePatients,
    inactive: inactivePatients,
    newPatients: {
      count: 0, // This would be calculated based on registration date in a real implementation
      change: '0%' // This would be calculated based on historical data
    }
  };
};
