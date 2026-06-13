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
// COEFFICIENTS_10Y / COEFFICIENTS_30Y con su cita y el flag PREVENT_VERIFIED.
// El motor se valida contra el vector de referencia oficial (ver
// prevent.test.ts: mujer 50a -> 14.7/9.2/8.1% a 10 años, exacto). Si
// PREVENT_VERIFIED es false, computePrevent() devuelve undefined y el bot
// conserva los scores previos en lugar de publicar un riesgo no verificado.
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
export function buildPreventInputs(values: CKMObservationMap, flags: PreventClinicalFlags): PreventInputs | undefined {
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
 * Calcula los scores PREVENT. ASCVD e IC se reportan a 10 años; CVD total a
 * 30 años (consistente con PREVENTScores). Devuelve undefined si los
 * coeficientes en uso no están verificados (ver PREVENT_VERIFIED).
 */
export function computePrevent(input: PreventInputs): PREVENTScores | undefined {
  if (!PREVENT_VERIFIED) {
    return undefined;
  }
  const terms = buildTerms(input);
  const m10 = input.sex === 'female' ? COEFFICIENTS_10Y.female : COEFFICIENTS_10Y.male;
  const m30 = input.sex === 'female' ? COEFFICIENTS_30Y.female : COEFFICIENTS_30Y.male;
  return {
    ascvd10y: evaluate(m10.ascvd, terms),
    hf10y: evaluate(m10.heartFailure, terms),
    cvdTotal30y: evaluate(m30.totalCvd, terms),
  };
}

/** Riesgo de los tres outcomes a un horizonte dado (10 o 30 años), en %. */
export function computePreventAt(
  input: PreventInputs,
  horizon: 10 | 30
): { totalCvd: number; ascvd: number; heartFailure: number } {
  const terms = buildTerms(input);
  const sets = horizon === 10 ? COEFFICIENTS_10Y : COEFFICIENTS_30Y;
  const m = input.sex === 'female' ? sets.female : sets.male;
  return {
    totalCvd: evaluate(m.totalCvd, terms),
    ascvd: evaluate(m.ascvd, terms),
    heartFailure: evaluate(m.heartFailure, terms),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Coeficientes β — Khan et al. 2024, Circulation, Material Suplementario:
// Tabla S12.A (modelo base, 10 años) y Tabla S12.F (modelo base, 30 años).
// Centrado: edad 55, non-HDL-C 3.5 mmol/L, HDL-C 1.3 mmol/L, SBP 130, BMI 25,
// eGFR 90, sin DM, no fumador, sin medicación.
// Validados contra el vector de referencia oficial (ver prevent.test.ts).
// ───────────────────────────────────────────────────────────────────────────
export const PREVENT_VERIFIED = true;

export const COEFFICIENTS_10Y: { female: PreventModelSet; male: PreventModelSet } = {
  female: {
    totalCvd: {
      intercept: -3.307728,
      age: 0.7939329,
      nonHdl: 0.0305239,
      hdl: -0.1606857,
      sbpLow: -0.2394003,
      sbpHigh: 0.3600781,
      diabetes: 0.8667604,
      smoking: 0.5360739,
      egfrLow: 0.6045917,
      egfrHigh: 0.0433769,
      bpMed: 0.3151672,
      statin: -0.1477655,
      bpMedSbp: -0.0663612,
      statinNonHdl: 0.1197879,
      ageNonHdl: -0.0819715,
      ageHdl: 0.0306769,
      ageSbp: -0.0946348,
      ageDiabetes: -0.27057,
      ageSmoking: -0.078715,
      ageEgfr: -0.1637806,
    },
    ascvd: {
      intercept: -3.819975,
      age: 0.719883,
      nonHdl: 0.1176967,
      hdl: -0.151185,
      sbpLow: -0.0835358,
      sbpHigh: 0.3592852,
      diabetes: 0.8348585,
      smoking: 0.4831078,
      egfrLow: 0.4864619,
      egfrHigh: 0.0397779,
      bpMed: 0.2265309,
      statin: -0.0592374,
      bpMedSbp: -0.0395762,
      statinNonHdl: 0.0844423,
      ageNonHdl: -0.0567839,
      ageHdl: 0.0325692,
      ageSbp: -0.1035985,
      ageDiabetes: -0.2417542,
      ageSmoking: -0.0791142,
      ageEgfr: -0.1671492,
    },
    heartFailure: {
      intercept: -4.310409,
      age: 0.8998235,
      sbpLow: -0.4559771,
      sbpHigh: 0.3576505,
      diabetes: 1.038346,
      smoking: 0.583916,
      bmiLow: -0.0072294,
      bmiHigh: 0.2997706,
      egfrLow: 0.7451638,
      egfrHigh: 0.0557087,
      bpMed: 0.3534442,
      bpMedSbp: -0.0981511,
      ageSbp: -0.0946663,
      ageDiabetes: -0.3581041,
      ageSmoking: -0.1159453,
      ageBmi: -0.003878,
      ageEgfr: -0.1884289,
    },
  },
  male: {
    totalCvd: {
      intercept: -3.031168,
      age: 0.7688528,
      nonHdl: 0.0736174,
      hdl: -0.0954431,
      sbpLow: -0.4347345,
      sbpHigh: 0.3362658,
      diabetes: 0.7692857,
      smoking: 0.4386871,
      egfrLow: 0.5378979,
      egfrHigh: 0.0164827,
      bpMed: 0.288879,
      statin: -0.1337349,
      bpMedSbp: -0.0475924,
      statinNonHdl: 0.150273,
      ageNonHdl: -0.0517874,
      ageHdl: 0.0191169,
      ageSbp: -0.1049477,
      ageDiabetes: -0.2251948,
      ageSmoking: -0.0895067,
      ageEgfr: -0.1543702,
    },
    ascvd: {
      intercept: -3.500655,
      age: 0.7099847,
      nonHdl: 0.1658663,
      hdl: -0.1144285,
      sbpLow: -0.2837212,
      sbpHigh: 0.3239977,
      diabetes: 0.7189597,
      smoking: 0.3956973,
      egfrLow: 0.3690075,
      egfrHigh: 0.0203619,
      bpMed: 0.2036522,
      statin: -0.0865581,
      bpMedSbp: -0.0322916,
      statinNonHdl: 0.114563,
      ageNonHdl: -0.0300005,
      ageHdl: 0.0232747,
      ageSbp: -0.0927024,
      ageDiabetes: -0.2018525,
      ageSmoking: -0.0970527,
      ageEgfr: -0.1217081,
    },
    heartFailure: {
      intercept: -3.946391,
      age: 0.8972642,
      sbpLow: -0.6811466,
      sbpHigh: 0.3634461,
      diabetes: 0.923776,
      smoking: 0.5023736,
      bmiLow: -0.0485841,
      bmiHigh: 0.3726929,
      egfrLow: 0.6926917,
      egfrHigh: 0.0251827,
      bpMed: 0.2980922,
      bpMedSbp: -0.0497731,
      ageSbp: -0.1289201,
      ageDiabetes: -0.3040924,
      ageSmoking: -0.1401688,
      ageBmi: 0.0068126,
      ageEgfr: -0.1797778,
    },
  },
};

export const COEFFICIENTS_30Y: { female: PreventModelSet; male: PreventModelSet } = {
  female: {
    totalCvd: {
      intercept: -1.318827,
      age: 0.5503079,
      nonHdl: 0.0409794,
      hdl: -0.1663306,
      sbpLow: -0.1628654,
      sbpHigh: 0.3299505,
      diabetes: 0.6793894,
      smoking: 0.3196112,
      egfrLow: 0.1857101,
      egfrHigh: 0.0553528,
      bpMed: 0.2894,
      statin: -0.075688,
      bpMedSbp: -0.056367,
      statinNonHdl: 0.1071019,
      ageNonHdl: -0.0751438,
      ageHdl: 0.0301786,
      ageSbp: -0.0998776,
      ageDiabetes: -0.3206166,
      ageSmoking: -0.1607862,
      ageEgfr: -0.1450788,
    },
    ascvd: {
      intercept: -1.974074,
      age: 0.4669202,
      nonHdl: 0.1256901,
      hdl: -0.1542255,
      sbpLow: -0.0018093,
      sbpHigh: 0.322949,
      diabetes: 0.6296707,
      smoking: 0.268292,
      egfrLow: 0.100106,
      egfrHigh: 0.0499663,
      bpMed: 0.1875292,
      statin: 0.0152476,
      bpMedSbp: -0.0276123,
      statinNonHdl: 0.0736147,
      ageNonHdl: -0.0521962,
      ageHdl: 0.0316918,
      ageSbp: -0.1046101,
      ageDiabetes: -0.2727793,
      ageSmoking: -0.1530907,
      ageEgfr: -0.1299149,
    },
    heartFailure: {
      intercept: -2.205379,
      age: 0.6254374,
      sbpLow: -0.3919241,
      sbpHigh: 0.3142295,
      diabetes: 0.8330787,
      smoking: 0.3438651,
      bmiLow: 0.0594874,
      bmiHigh: 0.2525536,
      egfrLow: 0.2981642,
      egfrHigh: 0.0667159,
      bpMed: 0.333921,
      bpMedSbp: -0.0893177,
      ageSbp: -0.0974299,
      ageDiabetes: -0.404855,
      ageSmoking: -0.1982991,
      ageBmi: -0.0035619,
      ageEgfr: -0.1564215,
    },
  },
  male: {
    totalCvd: {
      intercept: -1.148204,
      age: 0.4627309,
      nonHdl: 0.0836088,
      hdl: -0.1029824,
      sbpLow: -0.2140352,
      sbpHigh: 0.2904325,
      diabetes: 0.5331276,
      smoking: 0.2141914,
      egfrLow: 0.1155556,
      egfrHigh: 0.0603775,
      bpMed: 0.232714,
      statin: -0.0272112,
      bpMedSbp: -0.0384488,
      statinNonHdl: 0.134192,
      ageNonHdl: -0.0511759,
      ageHdl: 0.0165865,
      ageSbp: -0.1101437,
      ageDiabetes: -0.2585943,
      ageSmoking: -0.1566406,
      ageEgfr: -0.1166776,
    },
    ascvd: {
      intercept: -1.736444,
      age: 0.3994099,
      nonHdl: 0.1744643,
      hdl: -0.120203,
      sbpLow: -0.0665117,
      sbpHigh: 0.2753037,
      diabetes: 0.4790257,
      smoking: 0.1782635,
      egfrLow: -0.0218789,
      egfrHigh: 0.0602553,
      bpMed: 0.1421182,
      statin: 0.0135996,
      bpMedSbp: -0.0218265,
      statinNonHdl: 0.1013148,
      ageNonHdl: -0.0312619,
      ageHdl: 0.020673,
      ageSbp: -0.0920935,
      ageDiabetes: -0.2159947,
      ageSmoking: -0.1548811,
      ageEgfr: -0.0712547,
    },
    heartFailure: {
      intercept: -1.95751,
      age: 0.5681541,
      sbpLow: -0.4761564,
      sbpHigh: 0.30324,
      diabetes: 0.6840338,
      smoking: 0.2656273,
      bmiLow: 0.0833107,
      bmiHigh: 0.26999,
      egfrLow: 0.2541805,
      egfrHigh: 0.0638923,
      bpMed: 0.2583631,
      bpMedSbp: -0.0391938,
      ageSbp: -0.1269124,
      ageDiabetes: -0.3273572,
      ageSmoking: -0.2043019,
      ageBmi: -0.0182831,
      ageEgfr: -0.1342618,
    },
  },
};
