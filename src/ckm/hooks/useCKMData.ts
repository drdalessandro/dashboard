// Hook de acceso a los datos CKM de un paciente.
// El BackEnd (bots de Medplum) persiste el estadío como extensión del Patient
// (CKM_STAGE_URL, valueInteger 0-4).
import type { Patient, Reference } from '@medplum/fhirtypes';
import { useResource } from '@medplum/react';
import { CKM_STAGE_URL } from '../constants';
import type { CKMStage } from '../types';

export interface CKMData {
  patient?: Patient;
  stage?: CKMStage;
  loading: boolean;
}

/** Lee el estadío CKM desde la extensión del recurso Patient. */
export function getCKMStage(patient: Patient | undefined): CKMStage | undefined {
  const extension = patient?.extension?.find((e) => e.url === CKM_STAGE_URL);
  if (!extension) {
    return undefined;
  }
  const value =
    extension.valueInteger ??
    (extension.valueCode !== undefined ? Number(extension.valueCode) : undefined) ??
    (extension.valueString !== undefined ? Number(extension.valueString) : undefined);
  if (value === undefined || !Number.isInteger(value) || value < 0 || value > 4) {
    return undefined;
  }
  return value as CKMStage;
}

/**
 * Devuelve los datos CKM de un paciente. Acepta el recurso Patient ya cargado
 * (no hace fetch), una referencia o un id (hace fetch con useResource).
 */
export function useCKMData(patientOrId: Patient | Reference<Patient> | string | undefined): CKMData {
  const value: Patient | Reference<Patient> | undefined =
    typeof patientOrId === 'string' ? { reference: `Patient/${patientOrId}` } : patientOrId;
  const patient = useResource<Patient>(value);

  return {
    patient,
    stage: getCKMStage(patient),
    loading: value !== undefined && patient === undefined,
  };
}
