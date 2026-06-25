// Etapa B de LE8: deriva los 4 componentes CLÍNICOS de Life's Essential 8
// (presión, IMC, lípidos no-HDL, glucosa) desde los Observations CKM del
// paciente, reusando el mismo lector y los mismos criterios clínicos que el
// panel PREVENT (observations.ts + clinical.ts). Mapeo puro y testeable; el
// fetch vive en el hook useLE8ClinicalInputs.
import type { CKMObservationMap } from './observations';
import type { LE8Inputs } from './le8';

/** Flags clínicos que LE8 necesita además de los valores de laboratorio. */
export interface ClinicalFlags {
  /** Diabetes diagnosticada (Condition activa), igual criterio que PREVENT. */
  diabetes: boolean;
  /** En tratamiento antihipertensivo (MedicationRequest activa). */
  onAntihypertensive: boolean;
}

/** Subconjunto de LE8Inputs que se obtiene de Observations (4 de 8 componentes). */
export type ClinicalLE8Inputs = Pick<LE8Inputs, 'bmi' | 'nonHdlMgDl' | 'glucose' | 'bloodPressure'>;

/**
 * Colesterol no-HDL en mg/dL: usa la Observation directa si existe; si no, lo
 * deriva como colesterol total − HDL (definición de no-HDL) cuando ambos están.
 */
export function nonHdlMgDl(values: CKMObservationMap): number | undefined {
  if (values.nonHdlc?.value !== undefined) {
    return values.nonHdlc.value;
  }
  const total = values.cholesterolTotal?.value;
  const hdl = values.hdlc?.value;
  if (total !== undefined && hdl !== undefined) {
    return total - hdl;
  }
  return undefined;
}

/**
 * Arma los componentes clínicos de LE8 a partir de los últimos valores
 * observados y los flags clínicos. Cada componente se incluye solo si hay dato
 * suficiente para puntuarlo; lo que falte queda fuera y computeLE8 lo reportará
 * como faltante.
 */
export function clinicalLE8Inputs(values: CKMObservationMap, flags: ClinicalFlags): ClinicalLE8Inputs {
  const out: ClinicalLE8Inputs = {};

  if (values.bmi?.value !== undefined) {
    out.bmi = values.bmi.value;
  }

  const nonHdl = nonHdlMgDl(values);
  if (nonHdl !== undefined) {
    out.nonHdlMgDl = nonHdl;
  }

  // Glucosa: se arma si hay algún laboratorio (HbA1c o glucemia). El flag de
  // diabetes se adjunta siempre; scoreGlucose resuelve la escala y devuelve
  // "sin dato" si es diabético sin HbA1c.
  const hba1c = values.hba1c?.value;
  const fasting = values.glucoseFasting?.value;
  if (hba1c !== undefined || fasting !== undefined) {
    out.glucose = { hasDiabetes: flags.diabetes, hba1cPercent: hba1c, fastingGlucoseMgDl: fasting };
  }

  // Presión: requiere sistólica y diastólica (el lector ya descarta cargas
  // implausibles con sistólica <= diastólica).
  if (values.sbp?.value !== undefined && values.dbp?.value !== undefined) {
    out.bloodPressure = {
      systolic: values.sbp.value,
      diastolic: values.dbp.value,
      onAntihypertensive: flags.onAntihypertensive,
    };
  }

  return out;
}
