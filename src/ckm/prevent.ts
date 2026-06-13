// Ecuaciones PREVENT (AHA) — motor de cálculo.
//
// Fuente: Khan SS, et al. "Development and Validation of the American Heart
// Association's PREVENT Equations." Circulation. 2024;149(6):430-449.
// doi:10.1161/CIRCULATIONAHA.123.067626 (PMC10910659).
//
// Estructura de transformación y valores de centrado tomados de la
// implementación de referencia `preventr` (Martin G. Mayer,
// https://github.com/martingmayer/preventr), validada contra la calculadora
// oficial de la AHA. Unidades internas: SI (mmol/L). Las Observations del
// proyecto vienen en mg/dL, así que se convierten.
//
// IMPORTANTE (herramienta médica): los coeficientes β están aislados en
// PREVENT_COEFFICIENTS con su cita y un estado de verificación. El motor se
// valida contra el vector de referencia oficial (ver prevent.test.ts). Si la
// validación no pasa, computePrevent() devuelve undefined y el bot conserva
// los scores previos en lugar de publicar un riesgo no verificado.
import type { CKMObservationMap } from './observations';
import type { PREVENTScores } from './types';

export interface PreventInputs {
  age: number; // años (30-79)
  sex: 'female' | 'male';
  totalCholesterol: number; // mg/dL
  hdl: number; // mg/dL
  systolicBP: number; // mmHg
  egfr: number; // mL/min/1.73m²
  bmi: number; // kg/m²
  diabetes: boolean;
  smoking: boolean;
  onAntihypertensive: boolean;
  onStatin: boolean;
  // Extendidas (opcionales)
  hba1c?: number; // %
  uacr?: number; // mg/g
  sdi?: number; // índice de deprivación social, decil 1-10
}

// Factor de conversión colesterol mg/dL -> mmol/L
const CHOL_MG_DL_TO_MMOL_L = 1 / 38.67;

// Valores de centrado (preventr / paper, unidades SI)
const CENTER = {
  age: 55,
  ageScale: 10,
  nonHdl: 3.5, // mmol/L
  hdl: 1.3, // mmol/L
  hdlScale: 0.3,
  sbpKnot: 110,
  sbpLow: 110,
  sbpHigh: 130,
  sbpScale: 20,
  bmiKnot: 30,
  bmiLow: 25,
  bmiScale: 5,
  egfrKnot: 60,
  egfrLow: 60,
  egfrHigh: 90,
  egfrScale: -15,
  hba1c: 5.3, // %
};

export interface PreventClinicalFlags {
  sex: 'female' | 'male';
  ageYears: number;
  diabetes: boolean;
  smoking: boolean;
  onAntihypertensive: boolean;
  onStatin: boolean;
  sdi?: number;
}

/**
 * Arma los PreventInputs combinando los últimos valores observados con los
 * flags clínicos (sexo/edad del Patient; diabetes/tabaquismo de Condition;
 * medicación de MedicationRequest/Statement). Devuelve undefined si falta
 * alguno de los parámetros mínimos requeridos por el modelo base.
 */
export function buildPreventInputs(
  values: CKMObservationMap,
  flags: PreventClinicalFlags
): PreventInputs | undefined {
  const totalCholesterol = values.cholesterolTotal?.value;
  const hdl = values.hdlc?.value;
  const systolicBP = values.sbp?.value;
  const egfr = values.egfr?.value;
  const bmi = values.bmi?.value;
  if (
    totalCholesterol === undefined ||
    hdl === undefined ||
    systolicBP === undefined ||
    egfr === undefined ||
    bmi === undefined ||
    flags.ageYears < 30 ||
    flags.ageYears > 79
  ) {
    return undefined;
  }
  return {
    age: flags.ageYears,
    sex: flags.sex,
    totalCholesterol,
    hdl,
    systolicBP,
    egfr,
    bmi,
    diabetes: flags.diabetes,
    smoking: flags.smoking,
    onAntihypertensive: flags.onAntihypertensive,
    onStatin: flags.onStatin,
    hba1c: values.hba1c?.value,
    uacr: values.uacr?.value,
    sdi: flags.sdi,
  };
}

/** Términos transformados disponibles para las ecuaciones (claves = nombres de coeficiente). */
export function buildTerms(input: PreventInputs): Record<string, number> {
  const age = (input.age - CENTER.age) / CENTER.ageScale;
  const nonHdlMmol = (input.totalCholesterol - input.hdl) * CHOL_MG_DL_TO_MMOL_L;
  const hdlMmol = input.hdl * CHOL_MG_DL_TO_MMOL_L;
  const nonHdl = nonHdlMmol - CENTER.nonHdl;
  const hdl = (hdlMmol - CENTER.hdl) / CENTER.hdlScale;
  const sbpLow = (Math.min(input.systolicBP, CENTER.sbpKnot) - CENTER.sbpLow) / CENTER.sbpScale;
  const sbpHigh = (Math.max(input.systolicBP, CENTER.sbpKnot) - CENTER.sbpHigh) / CENTER.sbpScale;
  const bmiLow = (Math.min(input.bmi, CENTER.bmiKnot) - CENTER.bmiLow) / CENTER.bmiScale;
  const bmiHigh = (Math.max(input.bmi, CENTER.bmiKnot) - CENTER.bmiKnot) / CENTER.bmiScale;
  const egfrLow = (Math.min(input.egfr, CENTER.egfrKnot) - CENTER.egfrLow) / CENTER.egfrScale;
  const egfrHigh = (Math.max(input.egfr, CENTER.egfrKnot) - CENTER.egfrHigh) / CENTER.egfrScale;
  const diabetes = input.diabetes ? 1 : 0;
  const smoking = input.smoking ? 1 : 0;
  const bpMed = input.onAntihypertensive ? 1 : 0;
  const statin = input.onStatin ? 1 : 0;

  return {
    intercept: 1,
    age,
    nonHdl,
    hdl,
    sbpLow,
    sbpHigh,
    bmiLow,
    bmiHigh,
    egfrLow,
    egfrHigh,
    diabetes,
    smoking,
    bpMed,
    statin,
    // Interacciones
    bpMedSbp: bpMed * sbpHigh,
    statinNonHdl: statin * nonHdl,
    ageNonHdl: age * nonHdl,
    ageHdl: age * hdl,
    ageSbp: age * sbpHigh,
    ageBmi: age * bmiHigh,
    ageDiabetes: age * diabetes,
    ageSmoking: age * smoking,
    ageEgfr: age * egfrLow,
    // Extendidas
    hba1c: input.hba1c !== undefined ? input.hba1c - CENTER.hba1c : 0,
    uacr: input.uacr !== undefined ? Math.log(input.uacr) : 0,
    sdi: input.sdi ?? 0,
  };
}

/** Una ecuación = mapa de nombre de término -> coeficiente β. */
export type PreventEquation = Record<string, number>;

export interface PreventModelSet {
  totalCvd: PreventEquation;
  ascvd: PreventEquation;
  heartFailure: PreventEquation;
}

/** Riesgo = 1 / (1 + exp(-Σ βᵢ·xᵢ)). Devuelve porcentaje 0-100, 1 decimal. */
export function evaluate(equation: PreventEquation, terms: Record<string, number>): number {
  let logOdds = 0;
  for (const [name, beta] of Object.entries(equation)) {
    logOdds += beta * (terms[name] ?? 0);
  }
  const risk = 1 / (1 + Math.exp(-logOdds));
  return Math.round(risk * 1000) / 10;
}

/**
 * Calcula los scores PREVENT a 10 años. Devuelve undefined si los coeficientes
 * en uso no están verificados contra el vector oficial (ver PREVENT_VERIFIED).
 */
export function computePrevent(input: PreventInputs): PREVENTScores | undefined {
  if (!PREVENT_VERIFIED) {
    return undefined;
  }
  const terms = buildTerms(input);
  const models = input.sex === 'female' ? COEFFICIENTS_10Y.female : COEFFICIENTS_10Y.male;
  return {
    ascvd10y: evaluate(models.ascvd, terms),
    hf10y: evaluate(models.heartFailure, terms),
    cvdTotal30y: evaluate(models.totalCvd, terms),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Coeficientes β — Khan et al. 2024, Suppl. Table S12 (modelo base, 10 años).
//
// PREVENT_VERIFIED queda en false hasta confirmar estos valores contra el
// vector de referencia oficial en prevent.test.ts. Mientras sea false,
// computePrevent() no publica scores (el bot preserva los existentes).
// ───────────────────────────────────────────────────────────────────────────
export const PREVENT_VERIFIED = false;

export const COEFFICIENTS_10Y: { female: PreventModelSet; male: PreventModelSet } = {
  female: {
    // PENDIENTE: completar desde el suplemento oficial (Table S12).
    totalCvd: {},
    ascvd: {},
    heartFailure: {},
  },
  male: {
    totalCvd: {},
    ascvd: {},
    heartFailure: {},
  },
};
