// Helpers puros para leer/escribir las extensiones CKM del recurso Patient.
// Sin dependencias de UI: usable tanto por el FrontEnd como por los bots.
import type { Extension, Patient } from '@medplum/fhirtypes';
import { CKM_STAGE_URL, HGRAPH_DATA_URL } from './constants';
import type { CKMStage, HGraphMetric, PREVENTScores } from './types';

export interface HGraphData {
  metrics?: HGraphMetric[];
  prevent?: PREVENTScores;
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
 * Devuelve la lista de extensiones del Patient con los datos CKM reemplazados,
 * preservando cualquier otra extensión existente.
 */
export function withCKMExtensions(patient: Patient, stage: CKMStage | undefined, hGraphData: HGraphData): Extension[] {
  const others = (patient.extension ?? []).filter((e) => e.url !== CKM_STAGE_URL && e.url !== HGRAPH_DATA_URL);
  const result = [...others, { url: HGRAPH_DATA_URL, valueString: JSON.stringify(hGraphData) }];
  if (stage !== undefined) {
    result.push({ url: CKM_STAGE_URL, valueInteger: stage });
  }
  return result;
}
