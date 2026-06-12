// Hook de acceso a los datos CKM de un paciente.
// El BackEnd (bots de Medplum) persiste en el recurso Patient:
// - CKM_STAGE_URL: extensión con valueInteger 0-4 (estadío CKM)
// - HGRAPH_DATA_URL: extensión con valueString JSON, ya sea un array de
//   HGraphMetric o un objeto { metrics: HGraphMetric[], prevent?: PREVENTScores }
import type { Patient, Reference } from '@medplum/fhirtypes';
import { useResource } from '@medplum/react';
import { useMemo } from 'react';
import { getCKMStage, getHGraphData } from '../extensions';
import type { CKMStage, HGraphMetric, PREVENTScores } from '../types';

// Re-export para los consumidores existentes; la implementación pura vive en
// extensions.ts para que también puedan usarla los bots (sin dependencias UI).
export { getCKMStage, getHGraphData };

export interface CKMData {
  patient?: Patient;
  stage?: CKMStage;
  hGraphMetrics?: HGraphMetric[];
  preventScores?: PREVENTScores;
  loading: boolean;
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
