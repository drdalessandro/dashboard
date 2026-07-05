// Normaliza las unidades de entrada de las Observations CKM a la unidad canónica
// que asumen el estadiaje (deriveStage), el scoring del hGraph y las reglas de
// alerta: mg/dL para lípidos y glucemia, % para HbA1c, mg/dL para creatinina.
//
// El backend de la app registra en las unidades locales de Argentina (mg/dL),
// pero como el panel lee Observations que puede haber cargado otro sistema, una
// lectura en mmol/L comparada cruda contra umbrales en mg/dL rompe el estadío:
// p. ej. triglicéridos 3.0 mmol/L (= 266 mg/dL) evaluaría `3.0 >= 150 → false` y
// no clasificaría estadío 2. Este módulo convierte las unidades conocidas a la
// canónica y deja pasar (con aviso) las desconocidas, sin adivinar. Módulo puro,
// sin dependencias de UI: usable por el FrontEnd y por los bots.
import type { CKMParameterId } from './constants';

interface UnitConversion {
  /** Unidad canónica que asume el scoring/estadiaje. */
  canonical: string;
  /** Convierte desde la unidad (clave normalizada) al valor en la canónica. */
  from: Record<string, (value: number) => number>;
}

// Factores estándar de conversión a la unidad canónica. Se cubren las unidades
// que reportan realmente los laboratorios de Argentina/SI, no sólo mmol/L:
// - Glucosa: mmol/L × 18.0182; g/L × 100 (glucemia suele venir en g/L acá).
// - Colesterol (total/LDL/HDL/no-HDL): mmol/L × 38.67; g/L × 100.
// - Triglicéridos: mmol/L × 88.57; g/L × 100.
// - Creatinina: µmol/L ÷ 88.42; mg/L ÷ 10.
// - UACR: mg/mmol (SI) × 8.8402 = mg/g (KDIGO; 1 mg/mmol ≈ 8.84 mg/g).
// - HbA1c: IFCC mmol/mol → NGSP % (afín): % = 0.09148 × mmol/mol + 2.152.
// g/L → mg/dL es ×100 para cualquier concentración de masa (1 g/L = 100 mg/dL).
const gPerL = (v: number): number => v * 100;
const CHOL = (v: number): number => v * 38.67;
const CONVERSIONS: Partial<Record<CKMParameterId, UnitConversion>> = {
  glucoseFasting: { canonical: 'mg/dL', from: { 'mmol/l': (v) => v * 18.0182, 'g/l': gPerL } },
  cholesterolTotal: { canonical: 'mg/dL', from: { 'mmol/l': CHOL, 'g/l': gPerL } },
  nonHdlc: { canonical: 'mg/dL', from: { 'mmol/l': CHOL, 'g/l': gPerL } },
  ldlc: { canonical: 'mg/dL', from: { 'mmol/l': CHOL, 'g/l': gPerL } },
  hdlc: { canonical: 'mg/dL', from: { 'mmol/l': CHOL, 'g/l': gPerL } },
  triglycerides: { canonical: 'mg/dL', from: { 'mmol/l': (v) => v * 88.57, 'g/l': gPerL } },
  creatinine: { canonical: 'mg/dL', from: { 'umol/l': (v) => v / 88.42, 'mg/l': (v) => v / 10 } },
  uacr: { canonical: 'mg/g', from: { 'mg/mmol': (v) => v * 8.8402 } },
  hba1c: { canonical: '%', from: { 'mmol/mol': (v) => v * 0.09148 + 2.152 } },
};

/**
 * Clave normalizada de una unidad para comparar sin depender del formato.
 * Convierte a 'u' tanto el SIGNO MICRO (U+00B5) como la LETRA MU GRIEGA (U+03BC),
 * visualmente idénticas y ambas usadas para "micro" en cargas manuales/EHR.
 */
function unitKey(unit: string): string {
  return unit
    .trim()
    .toLowerCase()
    .replace(/[µμ]/g, 'u')
    .replace(/\s+/g, '');
}

/**
 * Normaliza un único valor observado a la unidad canónica de su parámetro CKM.
 * - Sin unidad, o parámetro sin conversión definida: se deja tal cual.
 * - Unidad ya canónica: se deja tal cual.
 * - Unidad convertible conocida (p. ej. mmol/L): convierte el valor y fija la
 *   unidad canónica.
 * - Unidad desconocida para un parámetro con canónica definida: NO adivina; deja
 *   el valor crudo y avisa por consola para que el problema sea visible.
 */
export function normalizeCKMValue(
  param: CKMParameterId,
  value: number,
  unit: string | undefined
): { value: number; unit?: string } {
  const conv = CONVERSIONS[param];
  if (!conv || unit === undefined || unit.trim() === '') {
    return { value, unit };
  }
  const key = unitKey(unit);
  if (key === unitKey(conv.canonical)) {
    return { value, unit };
  }
  const convert = conv.from[key];
  if (convert) {
    return { value: convert(value), unit: conv.canonical };
  }
  console.warn(
    `CKM: unidad no reconocida para ${param}: "${unit}" (se esperaba ${conv.canonical}); valor sin normalizar`
  );
  return { value, unit };
}
