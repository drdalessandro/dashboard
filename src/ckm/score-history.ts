// Serie histórica de scores PREVENT como Observations FHIR (ver
// docs/propuesta-serie-scores.md). El bot ckm-recalculate persiste un punto por
// corrida (con regla anti-inflado) y alerta cuando un score sube de forma
// significativa. Este módulo es puro: usable por el bot, el FrontEnd y los tests.
import type { Observation } from '@medplum/fhirtypes';
import { CKM_SCORES_SYSTEM } from './constants';
import { categorizeRisk, RISK_BANDS } from './risk';
import type { PreventOutcome } from './risk';

/** Código y presentación de cada outcome en el CodeSystem ckm-scores. */
export const SCORE_CODES: Record<PreventOutcome, { code: string; display: string }> = {
  ascvd10y: { code: 'prevent-ascvd-10y', display: 'PREVENT — riesgo ASCVD a 10 años' },
  hf10y: { code: 'prevent-hf-10y', display: 'PREVENT — riesgo de insuficiencia cardíaca a 10 años' },
  cvdTotal30y: { code: 'prevent-cvd-total-30y', display: 'PREVENT — riesgo de ECV total a 30 años' },
};

const CODE_TO_OUTCOME = new Map<string, PreventOutcome>(
  (Object.entries(SCORE_CODES) as [PreventOutcome, { code: string }][]).map(([outcome, { code }]) => [code, outcome])
);

/** Un punto de la serie: valor en % y fecha del cálculo. */
export interface ScorePoint {
  value: number;
  date: string;
}

/** Ventana de tendencia acordada con el equipo médico: últimos 12 meses. */
export const TREND_WINDOW_MONTHS = 12;

/** Puntos mínimos para mostrar un sparkline (menos que esto no es tendencia). */
export const MIN_TREND_POINTS = 3;

// Anti-inflado de la serie: el bot corre con cada Observation nueva del
// paciente; sin esta regla una carga de laboratorio de 10 valores generaría
// 10 puntos idénticos.
export const MIN_HOURS_BETWEEN_POINTS = 24;

/**
 * ¿Corresponde persistir un punto nuevo? Sí cuando no hay punto previo, cuando
 * el valor cambió, o cuando el último punto ya tiene MIN_HOURS_BETWEEN_POINTS
 * de antigüedad (deja constancia periódica aunque el score esté estable).
 */
export function shouldPersistScorePoint(previous: ScorePoint | undefined, value: number, nowIso: string): boolean {
  if (!previous) {
    return true;
  }
  if (previous.value !== value) {
    return true;
  }
  return new Date(nowIso).getTime() - new Date(previous.date).getTime() >= MIN_HOURS_BETWEEN_POINTS * 3600 * 1000;
}

/**
 * Arma la Observation FHIR de un punto de score. La autoría queda en
 * meta.author (Medplum la registra automáticamente para el Bot); derivedFrom
 * apunta a la Observation que disparó el recálculo, como trazabilidad.
 */
export function buildScoreObservation(
  patientId: string,
  outcome: PreventOutcome,
  value: number,
  effectiveIso: string,
  options?: { derivedFrom?: Observation['derivedFrom'] }
): Observation {
  const { code, display } = SCORE_CODES[outcome];
  return {
    resourceType: 'Observation',
    status: 'final',
    code: { coding: [{ system: CKM_SCORES_SYSTEM, code, display }], text: display },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: effectiveIso,
    valueQuantity: { value, unit: '%' },
    ...(options?.derivedFrom?.length ? { derivedFrom: options.derivedFrom } : {}),
  };
}

// Umbrales de "suba significativa" (en puntos porcentuales absolutos).
// Heurísticos, a revisar con el equipo médico: alerta si el score subió
// SCORE_RISE_MIN_ABSOLUTE pp, o si cambió a una categoría de riesgo superior
// con una suba de al menos SCORE_RISE_MIN_FOR_TIER_JUMP pp (evita alertar por
// rozar el corte con variaciones triviales, ej. 4.9 -> 5.0).
export const SCORE_RISE_MIN_ABSOLUTE = 2;
export const SCORE_RISE_MIN_FOR_TIER_JUMP = 0.5;

export interface ScoreRiseAlert {
  /** Ancla del anti-spam (DetectedIssue), una por outcome. */
  ruleId: string;
  outcome: PreventOutcome;
  label: string;
  previous: ScorePoint;
  current: number;
  /** Mensaje listo para Communication / Task. */
  message: string;
}

/**
 * Detecta una suba significativa del score respecto del último punto
 * persistido. Devuelve undefined si no hay punto previo (sin línea de base no
 * hay tendencia), si el score bajó, o si la suba no supera los umbrales.
 */
export function detectScoreRise(
  outcome: PreventOutcome,
  previous: ScorePoint | undefined,
  current: number
): ScoreRiseAlert | undefined {
  if (!previous || !Number.isFinite(current)) {
    return undefined;
  }
  const delta = Math.round((current - previous.value) * 10) / 10;
  if (delta <= 0) {
    return undefined;
  }
  const previousTier = categorizeRisk(outcome, previous.value);
  const currentTier = categorizeRisk(outcome, current);
  const tierJump = previousTier !== undefined && currentTier !== undefined && currentTier.min > previousTier.min;

  if (delta < SCORE_RISE_MIN_ABSOLUTE && !(tierJump && delta >= SCORE_RISE_MIN_FOR_TIER_JUMP)) {
    return undefined;
  }

  const label = SCORE_CODES[outcome].display;
  const tierNote = tierJump ? ` (categoría ${previousTier.label} -> ${currentTier.label})` : '';
  const provisional = RISK_BANDS[outcome].guidelineBased ? '' : ' Bandas provisionales; revisar con el equipo médico.';
  return {
    ruleId: `score-rise-${SCORE_CODES[outcome].code}`,
    outcome,
    label,
    previous,
    current,
    message:
      `${label}: subió de ${previous.value}% a ${current}% (+${delta} pp)${tierNote}, ` +
      `último cálculo del ${previous.date.slice(0, 10)}.${provisional}`,
  };
}

/**
 * Convierte Observations de score (búsqueda por CKM_SCORES_SYSTEM) en series
 * por outcome, ordenadas de más vieja a más nueva (como espera el Sparkline).
 * Ignora recursos sin valor, sin fecha o con código desconocido.
 */
export function scorePointsFromObservations(observations: Observation[]): Partial<Record<PreventOutcome, ScorePoint[]>> {
  const result: Partial<Record<PreventOutcome, ScorePoint[]>> = {};
  for (const observation of observations) {
    if (observation.status === 'entered-in-error') {
      continue;
    }
    const coding = observation.code?.coding?.find((c) => c.system === CKM_SCORES_SYSTEM && c.code);
    const outcome = coding?.code ? CODE_TO_OUTCOME.get(coding.code) : undefined;
    const value = observation.valueQuantity?.value;
    const date = observation.effectiveDateTime;
    if (!outcome || value === undefined || !date) {
      continue;
    }
    (result[outcome] ??= []).push({ value, date });
  }
  for (const points of Object.values(result)) {
    points.sort((a, b) => a.date.localeCompare(b.date));
  }
  return result;
}
