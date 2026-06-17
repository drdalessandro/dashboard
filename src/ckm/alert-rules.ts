// Reglas de alerta "3 strikes" del proyecto CKM: detectan tendencias anormales
// repetidas (p. ej. 3 registros de presión arterial elevada o 3 de HDL bajo) a
// partir del historial de Observations de un paciente.
//
// Módulo puro (sin dependencias de UI ni del cliente Medplum): el bot
// ckm-recalculate lo usa para decidir cuándo notificar al médico de cabecera.
import type { CKMParameterId } from './constants';
import type { CKMObservationHistory, CKMObservationValue } from './observations';

/** Sexo binario que algunas reglas usan para el umbral (p. ej. HDL). */
export type AlertSex = 'female' | 'male' | undefined;

/** Sistema de codificación de las reglas de alerta (para DetectedIssue.code). */
export const ALERT_RULE_SYSTEM = 'https://seguimiento.medplum.com.ar/fhir/CodeSystem/ckm-alert-rule';

export interface AlertConfig {
  /** Cantidad mínima de lecturas anormales para disparar (default 3). */
  minCount: number;
  /** Ventana en días donde se cuentan las lecturas anormales (default 180). */
  windowDays: number;
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = { minCount: 3, windowDays: 180 };

interface ThresholdRule {
  id: string;
  param: CKMParameterId;
  label: string;
  direction: 'high' | 'low';
  /** Umbral fijo o dependiente del sexo. */
  threshold: number | ((sex: AlertSex) => number);
  unit: string;
}

// Umbrales alineados con cortes de guía (AHA/ACC/ADA/ASN). Se evalúa la
// tendencia, no un valor crítico aislado (eso lo cubre detectCriticalValues).
const THRESHOLD_RULES: ThresholdRule[] = [
  { id: 'sbp-high', param: 'sbp', label: 'Presión sistólica elevada', direction: 'high', threshold: 140, unit: 'mmHg' },
  { id: 'dbp-high', param: 'dbp', label: 'Presión diastólica elevada', direction: 'high', threshold: 90, unit: 'mmHg' },
  {
    id: 'hdl-low',
    param: 'hdlc',
    label: 'Colesterol HDL bajo',
    direction: 'low',
    // HDL bajo: <50 mg/dL en mujeres, <40 mg/dL en varones (o sexo desconocido)
    threshold: (sex) => (sex === 'female' ? 50 : 40),
    unit: 'mg/dL',
  },
  { id: 'ldl-high', param: 'ldlc', label: 'Colesterol LDL elevado', direction: 'high', threshold: 130, unit: 'mg/dL' },
  {
    id: 'tg-high',
    param: 'triglycerides',
    label: 'Triglicéridos elevados',
    direction: 'high',
    threshold: 150,
    unit: 'mg/dL',
  },
  {
    id: 'glucose-high',
    param: 'glucoseFasting',
    label: 'Glucemia en ayunas elevada',
    direction: 'high',
    threshold: 126,
    unit: 'mg/dL',
  },
  { id: 'hba1c-high', param: 'hba1c', label: 'HbA1c elevada', direction: 'high', threshold: 6.5, unit: '%' },
  { id: 'egfr-low', param: 'egfr', label: 'Filtrado glomerular bajo', direction: 'low', threshold: 60, unit: 'mL/min/1.73m²' },
  { id: 'uacr-high', param: 'uacr', label: 'Albuminuria (UACR) elevada', direction: 'high', threshold: 30, unit: 'mg/g' },
];

export interface TriggeredAlert {
  ruleId: string;
  param: CKMParameterId;
  label: string;
  /** Cantidad de lecturas anormales en la ventana. */
  count: number;
  latestValue: number;
  threshold: number;
  unit: string;
  /** Mensaje listo para Communication / Task. */
  message: string;
}

function ruleThreshold(rule: ThresholdRule, sex: AlertSex): number {
  return typeof rule.threshold === 'function' ? rule.threshold(sex) : rule.threshold;
}

function isAbnormal(rule: ThresholdRule, value: number, sex: AlertSex): boolean {
  const thr = ruleThreshold(rule, sex);
  return rule.direction === 'high' ? value >= thr : value < thr;
}

function withinWindow(date: string | undefined, now: number, windowDays: number): boolean {
  if (!date) {
    return true; // sin fecha clínica: se cuenta (conservador)
  }
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) {
    return true;
  }
  return now - t <= windowDays * 24 * 3600 * 1000;
}

function buildMessage(rule: ThresholdRule, count: number, thr: number, latest: number): string {
  const comp = rule.direction === 'high' ? `≥ ${thr}` : `< ${thr}`;
  return (
    `${rule.label}: ${count} registros ${comp} ${rule.unit} (último ${latest} ${rule.unit}). ` +
    'Considere ajuste terapéutico o adelantar el control.'
  );
}

/**
 * Evalúa las reglas de tendencia sobre el historial del paciente. Una regla
 * dispara si la lectura más reciente es anormal y hay al menos `minCount`
 * lecturas anormales dentro de la ventana. Devuelve una alerta por regla
 * disparada.
 */
export function evaluateThresholdRules(
  history: CKMObservationHistory,
  sex: AlertSex,
  config: AlertConfig = DEFAULT_ALERT_CONFIG
): TriggeredAlert[] {
  const now = Date.now();
  const result: TriggeredAlert[] = [];

  for (const rule of THRESHOLD_RULES) {
    const readings = history[rule.param];
    if (!readings || readings.length === 0) {
      continue;
    }
    const sorted = [...readings].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    const latest = sorted[0];
    // Si el valor más reciente ya está normalizado, no alertar (evita re-alertar
    // tendencias viejas ya resueltas).
    if (!isAbnormal(rule, latest.value, sex)) {
      continue;
    }
    const abnormal = sorted.filter(
      (r: CKMObservationValue) => withinWindow(r.date, now, config.windowDays) && isAbnormal(rule, r.value, sex)
    );
    if (abnormal.length >= config.minCount) {
      const thr = ruleThreshold(rule, sex);
      result.push({
        ruleId: rule.id,
        param: rule.param,
        label: rule.label,
        count: abnormal.length,
        latestValue: latest.value,
        threshold: thr,
        unit: rule.unit,
        message: buildMessage(rule, abnormal.length, thr, latest.value),
      });
    }
  }

  return result;
}
