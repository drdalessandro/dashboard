// Objetivos lipídicos dependientes del riesgo cardiovascular del paciente,
// anclados a la guía 2026 AHA/ACC/ADA/ASN CKM (Ndumele et al.): el muy alto
// riesgo lleva LDL-C <55 mg/dL (texto explícito de la guía); los tramos alto y
// moderado siguen el objetivo de la guía de colesterol ACC/AHA que aquélla
// referencia. A diferencia de un "óptimo" fijo, el objetivo baja a mayor
// riesgo. El tramo se deriva del estadío CKM y de la categoría ASCVD que ya
// calcula la app.
//
// Valores de guía, marcados como revisables con el equipo médico. Módulo puro:
// usable por el FrontEnd y por los bots.
import type { RiskLevel } from './risk';
import type { CKMStage } from './types';

/** Tramo de objetivo lipídico, de menor a mayor riesgo. */
export type LipidTargetTier = 'moderate' | 'high' | 'very-high';

export interface LipidTarget {
  /** Objetivo de LDL-C en mg/dL (valor por debajo del cual). */
  ldlBelow: number;
  /** Objetivo de ApoB en mg/dL. */
  apobBelow: number;
  /** Etiqueta del tramo, en español. */
  label: string;
}

// Guía 2026 AHA/ACC/ADA/ASN CKM: muy alto riesgo (ECV clínica con diabetes/ERC)
// → LDL-C <55 mg/dL con estatina de alta intensidad + ezetimibe (± PCSK9i). En
// diabetes con riesgo intermedio+, la guía busca reducir LDL-C ≥50%. ApoB
// emparejado al objetivo de LDL correspondiente.
const TARGETS: Record<LipidTargetTier, LipidTarget> = {
  moderate: { ldlBelow: 100, apobBelow: 90, label: 'riesgo bajo/moderado' },
  high: { ldlBelow: 70, apobBelow: 80, label: 'riesgo alto' },
  'very-high': { ldlBelow: 55, apobBelow: 65, label: 'riesgo muy alto' },
};

/**
 * Deriva el tramo de objetivo desde el estadío CKM, la categoría ASCVD y la
 * diabetes:
 * - muy alto: ECV clínica establecida (estadío CKM 4).
 * - alto: categoría de riesgo ASCVD 'high' (≈ ≥20% a 10 años), o diabetes con
 *   riesgo intermedio o mayor (la guía 2026 pide reducir LDL-C ≥50 %, objetivo
 *   ~<70 mg/dL, en diabéticos con riesgo intermedio+).
 * - moderado: el resto (prevención primaria de bajo/limítrofe riesgo).
 *
 * `baseAscvdLevel` es la categoría ASCVD *antes* de la reclasificación por CAC;
 * la regla de diabetes se evalúa sobre ella porque el "power of zero" del CAC
 * (que baja la categoría con CAC=0) no se aplica a diabéticos según la guía. Si
 * no se provee, se asume igual a `ascvdLevel`.
 *
 * Fail-safe: si el paciente es diabético y su categoría ASCVD base es
 * DESCONOCIDA (sin score PREVENT: edad fuera de rango, faltan labs, bot no
 * corrido), el objetivo NO se relaja a moderado — la diabetes por sí sola
 * justifica el tramo alto. Sólo un riesgo ASCVD explícitamente bajo/limítrofe
 * mantiene al diabético en moderado.
 */
export function lipidTargetTier(
  ckmStage: CKMStage | undefined,
  ascvdLevel: RiskLevel | undefined,
  hasDiabetes = false,
  baseAscvdLevel: RiskLevel | undefined = ascvdLevel
): LipidTargetTier {
  if (ckmStage === 4) {
    return 'very-high';
  }
  if (ascvdLevel === 'high') {
    return 'high';
  }
  if (hasDiabetes && baseAscvdLevel !== 'low' && baseAscvdLevel !== 'borderline') {
    return 'high';
  }
  return 'moderate';
}

export function lipidTarget(tier: LipidTargetTier): LipidTarget {
  return TARGETS[tier];
}

/** Biomarcadores con objetivo dependiente del riesgo (por slug de identifier). */
export const RISK_STRATIFIED_BIOMARKERS = new Set(['ldl-colesterol', 'apob']);

/**
 * Texto del objetivo por riesgo para un biomarcador, o undefined si ese
 * biomarcador no lleva objetivo dependiente del riesgo.
 */
export function lipidTargetText(biomarcadorId: string | undefined, tier: LipidTargetTier): string | undefined {
  if (!biomarcadorId) {
    return undefined;
  }
  const t = TARGETS[tier];
  if (biomarcadorId === 'ldl-colesterol') {
    return `< ${t.ldlBelow} mg/dL (${t.label})`;
  }
  if (biomarcadorId === 'apob') {
    return `< ${t.apobBelow} mg/dL (${t.label})`;
  }
  return undefined;
}

/** Umbral numérico del objetivo (para clasificar si el paciente lo cumple). */
export function lipidTargetValue(biomarcadorId: string | undefined, tier: LipidTargetTier): number | undefined {
  if (biomarcadorId === 'ldl-colesterol') {
    return TARGETS[tier].ldlBelow;
  }
  if (biomarcadorId === 'apob') {
    return TARGETS[tier].apobBelow;
  }
  return undefined;
}

export const LIPID_TARGET_SOURCE =
  'Objetivo según la guía 2026 AHA/ACC/ADA/ASN CKM (muy alto riesgo: LDL-C <55 mg/dL; ' +
  'diabetes: reducir LDL-C ≥50 %). Revisar con el equipo médico.';
