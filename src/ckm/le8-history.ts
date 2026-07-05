// Serie histórica de los 4 componentes clínicos de LE8 (IMC, lípidos, glucosa,
// presión), recalculada desde el historial de Observations: para cada fecha en
// la que llegó un dato del componente se reconstruye "el último valor conocido"
// de cada insumo y se re-puntúa con el mismo motor (le8.ts). Los componentes
// conductuales no tienen serie (cuestionarios esporádicos) y quedan fuera.
//
// Limitación documentada (docs/propuesta-serie-scores.md): los flags clínicos
// (diabetes, antihipertensivos) se toman constantes al valor actual, porque las
// Conditions/MedicationRequests no traen fecha confiable para reconstruirlos.
import type { CKMParameterId } from './constants';
import { computeLE8 } from './le8';
import type { LE8ComponentKey } from './le8';
import { clinicalLE8Inputs } from './le8-clinical';
import type { ClinicalFlags } from './le8-clinical';
import type { CKMObservationHistory, CKMObservationMap, CKMObservationValue } from './observations';
import { TREND_WINDOW_MONTHS } from './score-history';

/** Componentes LE8 con serie recalculable desde Observations. */
export type LE8ClinicalKey = Extract<LE8ComponentKey, 'bmi' | 'lipids' | 'glucose' | 'bloodPressure'>;

/** Parámetros CKM que alimentan cada componente clínico. */
const COMPONENT_PARAMS: Record<LE8ClinicalKey, CKMParameterId[]> = {
  bmi: ['bmi'],
  lipids: ['nonHdlc', 'cholesterolTotal', 'hdlc'],
  glucose: ['hba1c', 'glucoseFasting'],
  bloodPressure: ['sbp', 'dbp'],
};

export const LE8_CLINICAL_KEYS = Object.keys(COMPONENT_PARAMS) as LE8ClinicalKey[];

export interface LE8TrendPoint {
  /** Fecha de la lectura que produjo el punto (effectiveDateTime). */
  date: string;
  /** Sub-score 0-100 del componente a esa fecha. */
  score: number;
}

/** Última lectura con fecha <= la fecha dada (lista ordenada ascendente). */
function lastAtOrBefore(ascending: CKMObservationValue[], dateIso: string): CKMObservationValue | undefined {
  let match: CKMObservationValue | undefined;
  for (const value of ascending) {
    if ((value.date as string) <= dateIso) {
      match = value;
    } else {
      break;
    }
  }
  return match;
}

/**
 * Series por componente clínico dentro de la ventana de tendencia, de más
 * vieja a más nueva, un punto por día calendario (la última lectura del día).
 * Un componente sin dato suficiente en una fecha simplemente no aporta punto.
 */
export function le8ClinicalTrend(
  history: CKMObservationHistory,
  flags: ClinicalFlags,
  options?: { nowIso?: string; windowMonths?: number }
): Partial<Record<LE8ClinicalKey, LE8TrendPoint[]>> {
  const now = options?.nowIso ? new Date(options.nowIso) : new Date();
  const since = new Date(now);
  since.setMonth(since.getMonth() - (options?.windowMonths ?? TREND_WINDOW_MONTHS));

  const result: Partial<Record<LE8ClinicalKey, LE8TrendPoint[]>> = {};
  for (const key of LE8_CLINICAL_KEYS) {
    const params = COMPONENT_PARAMS[key];

    // Lecturas fechadas de cada insumo, ordenadas ascendentes (el historial
    // llega de más nueva a más vieja). Las lecturas sin fecha no se pueden
    // ubicar en el tiempo y quedan fuera de la reconstrucción.
    const perParam = new Map<CKMParameterId, CKMObservationValue[]>();
    for (const param of params) {
      const ascending = (history[param] ?? [])
        .filter((v) => v.date !== undefined)
        .slice()
        .sort((a, b) => (a.date as string).localeCompare(b.date as string));
      perParam.set(param, ascending);
    }

    // Fechas de evaluación: cada día (dentro de la ventana) con algún dato del
    // componente; si hubo varias lecturas el mismo día, vale la última.
    const lastPerDay = new Map<string, string>();
    for (const param of params) {
      for (const value of perParam.get(param) as CKMObservationValue[]) {
        const date = value.date as string;
        const time = new Date(date).getTime();
        if (time < since.getTime() || time > now.getTime()) {
          continue;
        }
        const day = date.slice(0, 10);
        const current = lastPerDay.get(day);
        if (!current || date > current) {
          lastPerDay.set(day, date);
        }
      }
    }

    const points: LE8TrendPoint[] = [];
    for (const date of [...lastPerDay.values()].sort()) {
      const at: CKMObservationMap = {};
      for (const param of params) {
        const known = lastAtOrBefore(perParam.get(param) as CKMObservationValue[], date);
        if (known) {
          at[param] = known;
        }
      }
      const inputs = clinicalLE8Inputs(at, flags);
      const component = computeLE8(inputs).components.find((c) => c.key === key);
      if (component) {
        points.push({ date, score: component.score });
      }
    }
    if (points.length > 0) {
      result[key] = points;
    }
  }
  return result;
}
