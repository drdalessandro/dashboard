// Normalización de métricas CKM (score 0-1 para el hGraph) y derivación del
// estadío CKM a partir de los últimos valores observados.
//
// Los umbrales son heurísticas basadas en la Guía AHA/ACC/ADA/ASN 2026 y
// definiciones usuales de práctica clínica. Revisar con el equipo médico.
// Sin dependencias de UI: usable por el FrontEnd y por los bots.
import type { CKMParameterId } from './constants';
import type { CKMObservationMap } from './observations';
import type { CKMStage, HGraphMetric, HGraphMetricStatus } from './types';

interface MetricDefinition {
  label: string;
  defaultUnit: string;
  /** Valor con score 1 (óptimo) y valor con score 0 (peor). */
  goodAt: number;
  badAt: number;
  /** Rango bueno inferior para métricas con doble cola (ej. potasio). */
  lowBadAt?: number;
  lowGoodAt?: number;
}

export const METRIC_DEFINITIONS: Partial<Record<CKMParameterId, MetricDefinition>> = {
  sbp: { label: 'PA sistólica', defaultUnit: 'mmHg', goodAt: 120, badAt: 180 },
  dbp: { label: 'PA diastólica', defaultUnit: 'mmHg', goodAt: 80, badAt: 110 },
  bmi: { label: 'IMC', defaultUnit: 'kg/m²', goodAt: 25, badAt: 40 },
  waist: { label: 'Cintura', defaultUnit: 'cm', goodAt: 94, badAt: 125 },
  glucoseFasting: { label: 'Glucemia ayunas', defaultUnit: 'mg/dL', goodAt: 100, badAt: 200 },
  hba1c: { label: 'HbA1c', defaultUnit: '%', goodAt: 5.7, badAt: 10 },
  cholesterolTotal: { label: 'Colesterol total', defaultUnit: 'mg/dL', goodAt: 200, badAt: 300 },
  ldlc: { label: 'LDL-C', defaultUnit: 'mg/dL', goodAt: 100, badAt: 190 },
  hdlc: { label: 'HDL-C', defaultUnit: 'mg/dL', goodAt: 50, badAt: 25 },
  triglycerides: { label: 'Triglicéridos', defaultUnit: 'mg/dL', goodAt: 150, badAt: 500 },
  creatinine: { label: 'Creatinina', defaultUnit: 'mg/dL', goodAt: 1.2, badAt: 3 },
  egfr: { label: 'TFGe', defaultUnit: 'mL/min/1.73m²', goodAt: 90, badAt: 15 },
  uacr: { label: 'UACR', defaultUnit: 'mg/g', goodAt: 30, badAt: 300 },
  potassium: { label: 'Potasio', defaultUnit: 'mmol/L', goodAt: 5.0, badAt: 6.5, lowGoodAt: 3.5, lowBadAt: 2.5 },
  ntProBNP: { label: 'NT-proBNP', defaultUnit: 'pg/mL', goodAt: 125, badAt: 2000 },
  hsCtnI: { label: 'Troponina I us', defaultUnit: 'ng/L', goodAt: 26, badAt: 100 },
  cac: { label: 'Score de calcio', defaultUnit: 'Agatston', goodAt: 0, badAt: 400 },
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Score 0-1: 1 dentro del rango óptimo, 0 en el umbral malo, lineal entre ambos. */
export function scoreFor(param: CKMParameterId, value: number): number {
  const def = METRIC_DEFINITIONS[param];
  if (!def) {
    return 0.5;
  }
  // Cola baja (ej. hipopotasemia): por debajo del rango bueno el score cae
  if (def.lowGoodAt !== undefined && def.lowBadAt !== undefined && value < def.lowGoodAt) {
    return clamp01((value - def.lowBadAt) / (def.lowGoodAt - def.lowBadAt));
  }
  // goodAt > badAt significa "más bajo es peor" (ej. TFGe, HDL-C)
  return clamp01(1 - (value - def.goodAt) / (def.badAt - def.goodAt));
}

export function statusForScore(score: number): HGraphMetricStatus {
  if (score >= 0.75) {
    return 'healthy';
  }
  return score >= 0.4 ? 'moderate' : 'high';
}

/**
 * Límites de valor crítico: riesgo inmediato que amerita notificación al
 * profesional aunque el estadío no cambie. Revisar con el equipo médico.
 * Crítico si value >= max o value < min.
 */
export const CRITICAL_LIMITS: Partial<Record<CKMParameterId, { min?: number; max?: number }>> = {
  sbp: { max: 180 },
  dbp: { max: 110 },
  potassium: { min: 2.8, max: 6.0 },
  egfr: { min: 30 },
  glucoseFasting: { min: 60, max: 300 },
  hsCtnI: { max: 100 },
  ntProBNP: { max: 2000 },
};

export interface CriticalValue {
  param: CKMParameterId;
  value: number;
  unit?: string;
  message: string;
}

/** Detecta valores críticos entre los valores observados que se pasen. */
export function detectCriticalValues(values: CKMObservationMap): CriticalValue[] {
  const result: CriticalValue[] = [];
  for (const [param, limits] of Object.entries(CRITICAL_LIMITS) as [CKMParameterId, { min?: number; max?: number }][]) {
    const observed = values[param];
    if (!observed) {
      continue;
    }
    const critical =
      (limits.max !== undefined && observed.value >= limits.max) ||
      (limits.min !== undefined && observed.value < limits.min);
    if (critical) {
      const label = METRIC_DEFINITIONS[param]?.label ?? param;
      const unit = observed.unit ?? METRIC_DEFINITIONS[param]?.defaultUnit ?? '';
      result.push({
        param,
        value: observed.value,
        unit: observed.unit,
        message: `Valor crítico: ${label} ${observed.value} ${unit}`.trim(),
      });
    }
  }
  return result;
}

/** Convierte los últimos valores observados en métricas del hGraph. */
export function computeMetrics(values: CKMObservationMap): HGraphMetric[] {
  const metrics: HGraphMetric[] = [];
  for (const [param, def] of Object.entries(METRIC_DEFINITIONS) as [CKMParameterId, MetricDefinition][]) {
    const observed = values[param];
    if (!observed) {
      continue;
    }
    const score = Math.round(scoreFor(param, observed.value) * 100) / 100;
    metrics.push({
      id: param,
      label: def.label,
      value: observed.value,
      unit: observed.unit ?? def.defaultUnit,
      score,
      status: statusForScore(score),
    });
  }
  return metrics;
}

export interface StageContext {
  /** El paciente tiene ECV clínica diagnosticada (Condition activa). */
  hasClinicalCVD?: boolean;
  gender?: string;
}

/**
 * Deriva el estadío CKM desde los últimos valores observados.
 * Heurística (revisar con el equipo médico):
 * - 4: ECV clínica (requiere Conditions codificadas, viene en el contexto)
 * - 3: ECV subclínica: CAC > 0, NT-proBNP >= 125 o troponina us >= percentil 99
 * - 2: HTA (>=130/80), DM2 (HbA1c >= 6.5 o glucemia >= 126), TG >= 135,
 *      o ERC (TFGe < 60 o UACR >= 30)
 * - 1: exceso de adiposidad (IMC >= 25, cintura elevada según sexo) o
 *      prediabetes (HbA1c 5.7-6.4 o glucemia 100-125)
 * - 0: nada de lo anterior
 * Devuelve undefined si no hay ningún dato para evaluar.
 */
export function deriveStage(values: CKMObservationMap, context: StageContext = {}): CKMStage | undefined {
  if (context.hasClinicalCVD) {
    return 4;
  }
  if (Object.keys(values).length === 0) {
    return undefined;
  }

  const v = (param: CKMParameterId): number | undefined => values[param]?.value;

  const subclinical =
    (v('cac') ?? 0) > 0 || (v('ntProBNP') ?? 0) >= 125 || (v('hsCtnI') ?? 0) >= METRIC_DEFINITIONS.hsCtnI!.goodAt;
  if (subclinical) {
    return 3;
  }

  const hypertension = (v('sbp') ?? 0) >= 130 || (v('dbp') ?? 0) >= 80;
  const diabetes = (v('hba1c') ?? 0) >= 6.5 || (v('glucoseFasting') ?? 0) >= 126;
  const hypertriglyceridemia = (v('triglycerides') ?? 0) >= 135;
  const egfr = v('egfr');
  const ckd = (egfr !== undefined && egfr < 60) || (v('uacr') ?? 0) >= 30;
  if (hypertension || diabetes || hypertriglyceridemia || ckd) {
    return 2;
  }

  const waistLimit = context.gender === 'female' ? 88 : 102;
  const overweight = (v('bmi') ?? 0) >= 25 || (v('waist') ?? 0) >= waistLimit;
  const hba1c = v('hba1c');
  const glucose = v('glucoseFasting');
  const prediabetes =
    (hba1c !== undefined && hba1c >= 5.7 && hba1c < 6.5) || (glucose !== undefined && glucose >= 100 && glucose < 126);
  if (overweight || prediabetes) {
    return 1;
  }

  return 0;
}
