// src/features/patients/utils/patientFormatters.ts
import { format } from 'date-fns';
import { Patient } from '../types/patient.types';
import { HumanName } from '@medplum/fhirtypes';

/**
 * Format a patient's name from the name array
 */
const patientNameFormatter = (name?: HumanName[] | undefined): string => {
  if (!name || name.length === 0) return 'Unknown';

  const nameObj = name[0];
  if (nameObj.text) return nameObj.text;

  const given = nameObj.given?.join(' ') || '';
  const family = nameObj.family || '';
  return `${given} ${family}`.trim() || 'Unknown';
};

/**
 * format patient's name from patient resource
 */
export const formatPatientName = (patient: Patient): string => {
  if (!patient.name || patient.name.length === 0) return 'Unknown';
  return patientNameFormatter(patient.name);
};


/**
 * Get patient's phone number
 */
export const getPatientPhone = (patient: Patient): string => {
  if (!patient.telecom || patient.telecom.length === 0) return '';
  const phone = patient.telecom.find(t => t.system === 'phone');
  return phone?.value || '';
};

/**
 * Get patient's email
 */
export const getPatientEmail = (patient: Patient): string => {
  if (!patient.telecom || patient.telecom.length === 0) return '';
  const email = patient.telecom.find(t => t.system === 'email');
  return email?.value || '';
};

/**
 * Get patient's home address
 */
export const getPatientAddress = (patient: Patient): string => {
  if (!patient.address || patient.address.length === 0) return '';
  const homeAddress = patient.address.find(a => a.use === 'home');
  return homeAddress?.text || '';
};

/**
 * Calculate patient's age from birthDate
 */
export const calculateAge = (birthDate?: string): number | null => {
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
};

/**
 * Format a date string to a human-readable format
 */
export const formatDate = (dateString?: string, formatString: string = 'MMM dd, yyyy'): string => {
  if (!dateString) return '-';

  try {
    return format(new Date(dateString), formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Get patient's identifier of a specific type
 */
export const getPatientIdentifier = (patient: Patient, system?: string): string => {
  if (!patient.identifier || patient.identifier.length === 0) return '';

  const identifier = system
    ? patient.identifier.find(id => id.system === system)
    : patient.identifier[0];

  return identifier?.value || '';
};

/**
 * Get initials from a patient's name
 */
export const getInitials = (name?: string): string => {
  // Add null check to prevent errors with undefined names
  if (!name) return 'NA';

  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Get color for an avatar based on gender
 */
export const getAvatarColor = (gender: string): string => {
  switch (gender) {
    case 'male':
      return '#1E88E5'; // Primary blue
    case 'female':
      return '#9C27B0'; // Purple
    default:
      return '#78909C'; // Blue grey
  }
};

/**
 * Get color for a status chip
 */
export const getStatusColor = (status: string, theme: any): { bgColor: string; textColor: string } => {
  switch (status) {
    case 'active':
      return {
        bgColor: theme.palette.success.main,
        textColor: '#fff',
      };
    case 'inactive':
      return {
        bgColor: theme.palette.error.main,
        textColor: '#fff',
      };
    case 'pending':
      return {
        bgColor: theme.palette.warning.main,
        textColor: '#fff',
      };
    default:
      return {
        bgColor: theme.palette.grey[300],
        textColor: theme.palette.text.primary,
      };
  }
};
