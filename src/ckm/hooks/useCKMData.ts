// Hook de acceso a los datos CKM de un paciente.
// El BackEnd (bots de Medplum) persiste en el recurso Patient:
// - CKM_STAGE_URL: extensión con valueInteger 0-4 (estadío CKM)
// - HGRAPH_DATA_URL: extensión con valueString JSON, ya sea un array de
//   HGraphMetric o un objeto { metrics: HGraphMetric[], prevent?: PREVENTScores }
import type { Patient, Reference } from '@medplum/fhirtypes';
import { useResource } from '@medplum/react';
import { useMemo } from 'react';
import { CKM_STAGE_URL, HGRAPH_DATA_URL } from '../constants';
import type { CKMStage, HGraphMetric, PREVENTScores } from '../types';

export interface CKMData {
  patient?: Patient;
  stage?: CKMStage;
  hGraphMetrics?: HGraphMetric[];
  preventScores?: PREVENTScores;
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

interface HGraphData {
  metrics?: HGraphMetric[];
  prevent?: PREVENTScores;
}

/** Lee y parsea la extensión hGraphData del recurso Patient. */
export function getHGraphData(patient: Patient | undefined): HGraphData {
  const extension = patient?.extension?.find((e) => e.url === HGRAPH_DATA_URL);
  if (!extension?.valueString) {
    return {};
  }
  try {
    const parsed = JSON.parse(extension.valueString) as HGraphMetric[] | HGraphData;
    if (Array.isArray(parsed)) {
      return { metrics: parsed };
    }
    return { metrics: parsed.metrics, prevent: parsed.prevent };
  } catch (err) {
    console.error('hGraphData inválido en Patient/' + patient?.id, err);
    return {};
  }
}

/**
 * Devuelve los datos CKM de un paciente. Acepta el recurso Patient ya cargado
 * (no hace fetch), una referencia o un id (hace fetch con useResource).
 */
export function useCKMData(patientOrId: Patient | Reference<Patient> | string | undefined): CKMData {
  const value: Patient | Reference<Patient> | undefined =
    typeof patientOrId === 'string' ? { reference: `Patient/${patientOrId}` } : patientOrId;
  const patient = useResource<Patient>(value);
  const hGraphData = useMemo(() => getHGraphData(patient), [patient]);

  return {
    patient,
    stage: getCKMStage(patient),
    hGraphMetrics: hGraphData.metrics,
    preventScores: hGraphData.prevent,
    loading: value !== undefined && patient === undefined,
  };
}
