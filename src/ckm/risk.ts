// Categorización clínica de los scores de riesgo PREVENT (AHA).
//
// Convierte un porcentaje de riesgo en un nivel cualitativo (Bajo / Limítrofe /
// Intermedio / Alto) con color, para que el riesgo sea legible de un vistazo en
// el panel del paciente y en el listado. Sin dependencias de UI: usable por el
// FrontEnd y por los bots.
//
// IMPORTANTE (herramienta médica): solo los umbrales de ASCVD a 10 años tienen
// respaldo de guía (ACC/AHA 2018 Cholesterol / 2019 Primary Prevention). Los de
// IC a 10 años y ECV total a 30 años NO tienen tiers consensuados en guías:
// son PROVISIONALES (guidelineBased: false) y deben calibrarse con el equipo
// médico. Misma convención que los umbrales heurísticos de scoring.ts.
import type { PREVENTScores } from './types';

/** Nivel cualitativo de riesgo, de menor a mayor. */
export type RiskLevel = 'low' | 'borderline' | 'intermediate' | 'high';

/** Outcome PREVENT categorizable (coincide con las claves de PREVENTScores). */
export type PreventOutcome = keyof PREVENTScores;

/** Un tramo de riesgo: nivel + presentación + límite inferior (% inclusive). */
export interface RiskTier {
  level: RiskLevel;
  /** Etiqueta para mostrar, en español. */
  label: string;
  /** Color de la paleta de Mantine (ej. para <Badge color={...}>). */
  color: string;
  /** Límite inferior inclusive del tramo, en % de riesgo. */
  min: number;
}

/** Definición de los tramos de un outcome PREVENT. */
export interface RiskBands {
  outcome: PreventOutcome;
  /** true si los umbrales tienen respaldo de guía; false si son provisionales. */
  guidelineBased: boolean;
  /** Cita o racional de los umbrales (se muestra en el tooltip). */
  source: string;
  /** Tramos ordenados de menor a mayor riesgo. */
  tiers: RiskTier[];
}

const LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Bajo',
  borderline: 'Limítrofe',
  intermediate: 'Intermedio',
  high: 'Alto',
};

// Verde → amarillo → naranja → rojo. Consistente con el lenguaje de color del
// hGraph (saludable/moderado/alto) y de los badges de estadío CKM.
const LEVEL_COLORS: Record<RiskLevel, string> = {
  low: 'green',
  borderline: 'yellow',
  intermediate: 'orange',
  high: 'red',
};

/** Arma los 4 tramos a partir de los cortes (% inclusive) de cada nivel. */
function tiersFromCutpoints(borderline: number, intermediate: number, high: number): RiskTier[] {
  const mins: Record<RiskLevel, number> = { low: 0, borderline, intermediate, high };
  return (Object.keys(mins) as RiskLevel[]).map((level) => ({
    level,
    label: LEVEL_LABELS[level],
    color: LEVEL_COLORS[level],
    min: mins[level],
  }));
}

/**
 * Tramos de riesgo por outcome PREVENT.
 *
 * - ascvd10y: tramos canónicos de las guías ACC/AHA (bajo <5, limítrofe
 *   5–<7.5, intermedio 7.5–<20, alto ≥20). Mismos cortes que usa la decisión
 *   de estatinas en prevención primaria.
 * - hf10y / cvdTotal30y: PROVISIONALES. PREVENT no define categorías de riesgo
 *   para estos outcomes; las bandas son heurísticas para triage y deben
 *   revisarse con el equipo médico.
 */
export const RISK_BANDS: Record<PreventOutcome, RiskBands> = {
  ascvd10y: {
    outcome: 'ascvd10y',
    guidelineBased: true,
    source:
      'ACC/AHA 2018 Cholesterol / 2019 Prevención Primaria: bajo <5%, limítrofe 5–<7.5%, ' +
      'intermedio 7.5–<20%, alto ≥20% (riesgo ASCVD a 10 años).',
    tiers: tiersFromCutpoints(5, 7.5, 20),
  },
  hf10y: {
    outcome: 'hf10y',
    guidelineBased: false,
    source:
      'PROVISIONAL — no hay tramos de guía para insuficiencia cardíaca a 10 años (PREVENT no ' +
      'define categorías). Bandas heurísticas para triage; revisar con el equipo médico.',
    tiers: tiersFromCutpoints(5, 10, 20),
  },
  cvdTotal30y: {
    outcome: 'cvdTotal30y',
    guidelineBased: false,
    source:
      'PROVISIONAL — no hay tramos de guía para ECV total a 30 años. El horizonte de 30 años ' +
      'eleva el riesgo basal, por eso los umbrales son más altos. Revisar con el equipo médico.',
    tiers: tiersFromCutpoints(10, 20, 40),
  },
};

/**
 * Devuelve el tramo de riesgo de un outcome PREVENT para un valor en %.
 * Devuelve undefined si el valor falta o no es finito.
 */
export function categorizeRisk(outcome: PreventOutcome, value: number | undefined): RiskTier | undefined {
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }
  // tiers están ordenados de menor a mayor: el tramo correcto es el último
  // cuyo límite inferior no supera al valor.
  let match = RISK_BANDS[outcome].tiers[0];
  for (const tier of RISK_BANDS[outcome].tiers) {
    if (value >= tier.min) {
      match = tier;
    }
  }
  return match;
}
