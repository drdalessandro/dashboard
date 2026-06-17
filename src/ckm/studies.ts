// "¿Qué estudios solicitar?" — motor de reglas + gap analysis (v1).
//
// Sugiere los estudios diagnósticos/complementarios según el estadío CKM y las
// condiciones clínicas del paciente, y cruza cada uno contra las Observations
// ya cargadas para marcar qué falta o está vencido:
//   🔴 missing  — recomendado y nunca hecho
//   🟡 overdue  — hecho pero vencido (supera el intervalo)
//   🟢 current  — al día
//   ℹ️  info    — recomendado, sin dato trackeable (imagen/funcional)
//
// Fuente del marco: AHA Presidential Advisory on Cardiovascular-Kidney-Metabolic
// (CKM) Health (Ndumele CE et al., Circulation 2023) — la misma guía CKM que
// usa el resto del proyecto. Los intervalos son defaults razonables a validar.
//
// Módulo puro (sin red ni UI): la lectura de Observations la hace el hook.
import type { CKMParameterId } from './constants';
import type { CKMObservationMap } from './observations';
import type { CKMStage } from './types';

export type StudyCategory = 'laboratorio' | 'antropometria' | 'imagen' | 'funcional';
export type ClinicalFlag = 'diabetes' | 'hypertension' | 'ckd' | 'heartFailure';
export type StudyStatus = 'missing' | 'overdue' | 'current' | 'info';

export interface StudyRule {
  id: string;
  label: string;
  category: StudyCategory;
  /** Parámetro CKM (LOINC) que evidencia el estudio; si falta, es 'info'. */
  param?: CKMParameterId;
  /** Periodicidad recomendada en meses. */
  intervalMonths?: number;
  /** Intervalo más corto si está presente una condición (se toma el menor). */
  intervalByCondition?: Partial<Record<ClinicalFlag, number>>;
  /** Estudio de única vez (ej. score de calcio coronario). */
  oneTime?: boolean;
  /** Aplica desde este estadío en adelante. */
  minStage?: CKMStage;
  /** O aplica si está presente alguna de estas condiciones. */
  conditions?: ClinicalFlag[];
  /** Racional / cita para mostrar al profesional. */
  rationale: string;
}

export interface StudyContext {
  stage?: CKMStage;
  flags: Record<ClinicalFlag, boolean>;
}

export interface StudyGap {
  rule: StudyRule;
  status: StudyStatus;
  /** Fecha de la última medición (si la hay). */
  lastDate?: string;
  /** Meses desde la última medición. */
  monthsSince?: number;
  /** Intervalo aplicado (tras considerar condiciones). */
  intervalMonths?: number;
}

// Catálogo de estudios (marco CKM/Ndumele). Orden ~ prioridad clínica.
export const STUDY_RULES: StudyRule[] = [
  {
    id: 'lipids',
    label: 'Perfil lipídico (total, LDL, HDL, No-HDL, TG)',
    category: 'laboratorio',
    param: 'cholesterolTotal',
    intervalMonths: 12,
    minStage: 1,
    rationale: 'Evaluación de riesgo aterosclerótico; insumo de PREVENT. Anual o según tratamiento.',
  },
  {
    id: 'hba1c',
    label: 'Hemoglobina glicosilada (HbA1c)',
    category: 'laboratorio',
    param: 'hba1c',
    intervalMonths: 12,
    intervalByCondition: { diabetes: 6 },
    minStage: 1,
    conditions: ['diabetes'],
    rationale: 'Cribado de disglucemia (estadío ≥1). En diabetes, control cada 3-6 meses.',
  },
  {
    id: 'fasting-glucose',
    label: 'Glucemia en ayunas',
    category: 'laboratorio',
    param: 'glucoseFasting',
    intervalMonths: 12,
    minStage: 1,
    rationale: 'Cribado de prediabetes/diabetes desde el estadío 1.',
  },
  {
    id: 'egfr',
    label: 'Función renal — filtrado glomerular (eGFR)',
    category: 'laboratorio',
    param: 'egfr',
    intervalMonths: 12,
    intervalByCondition: { ckd: 6 },
    minStage: 2,
    conditions: ['diabetes', 'hypertension', 'ckd'],
    rationale: 'Detección/seguimiento de ERC (estadío ≥2, o diabetes/HTA). Anual; más frecuente en ERC.',
  },
  {
    id: 'uacr',
    label: 'Albuminuria — cociente albúmina/creatinina (UACR)',
    category: 'laboratorio',
    param: 'uacr',
    intervalMonths: 12,
    intervalByCondition: { ckd: 6 },
    minStage: 2,
    conditions: ['diabetes', 'hypertension', 'ckd'],
    rationale: 'Marcador renal clave y subutilizado (énfasis de la advisory CKM). Anual en estadío ≥2, diabetes o HTA.',
  },
  {
    id: 'potassium',
    label: 'Potasio sérico (ionograma)',
    category: 'laboratorio',
    param: 'potassium',
    intervalMonths: 6,
    conditions: ['ckd', 'heartFailure'],
    rationale: 'Monitoreo en ERC/IC y bajo IECA/ARA-II/antagonistas de mineralocorticoides.',
  },
  {
    id: 'cac',
    label: 'Score de calcio coronario (CAC)',
    category: 'imagen',
    param: 'cac',
    oneTime: true,
    minStage: 3,
    rationale: 'Refinamiento del riesgo / aterosclerosis subclínica (estadío 3). Estudio de única vez.',
  },
  {
    id: 'ntprobnp',
    label: 'NT-proBNP',
    category: 'laboratorio',
    param: 'ntProBNP',
    intervalMonths: 12,
    minStage: 3,
    conditions: ['heartFailure'],
    rationale: 'Detección de IC subclínica (estadío B) y seguimiento de IC.',
  },
  {
    id: 'hs-troponin',
    label: 'Troponina de alta sensibilidad',
    category: 'laboratorio',
    param: 'hsCtnI',
    intervalMonths: 12,
    minStage: 3,
    rationale: 'Biomarcador de daño miocárdico subclínico (estadío 3).',
  },
  // Estudios sin dato trackeable como Observation CKM → informativos.
  {
    id: 'echo',
    label: 'Ecocardiograma',
    category: 'funcional',
    minStage: 3,
    conditions: ['heartFailure'],
    rationale: 'Evaluación estructural/funcional en ECV subclínica o IC.',
  },
  {
    id: 'abi',
    label: 'Índice tobillo-brazo (EAP)',
    category: 'funcional',
    minStage: 3,
    rationale: 'Cribado de enfermedad arterial periférica ante sospecha.',
  },
  {
    id: 'ischemia',
    label: 'Ergometría / imagen de isquemia',
    category: 'funcional',
    minStage: 4,
    rationale: 'Estudio dirigido en ECV clínica establecida, según indicación.',
  },
  {
    id: 'fundus',
    label: 'Fondo de ojo',
    category: 'funcional',
    conditions: ['diabetes'],
    rationale: 'Cribado de retinopatía en diabetes (derivación a oftalmología).',
  },
];

/** ¿La regla aplica al contexto del paciente? */
function appliesTo(rule: StudyRule, ctx: StudyContext): boolean {
  const byStage = rule.minStage !== undefined && ctx.stage !== undefined && ctx.stage >= rule.minStage;
  const byCondition = Boolean(rule.conditions?.some((c) => ctx.flags[c]));
  return byStage || byCondition;
}

/** Estudios recomendados para el contexto (sin evaluar gaps). */
export function recommendedStudies(ctx: StudyContext): StudyRule[] {
  return STUDY_RULES.filter((r) => appliesTo(r, ctx));
}

/** Intervalo efectivo: el más corto entre el base y los por-condición presentes. */
function effectiveInterval(rule: StudyRule, ctx: StudyContext): number | undefined {
  let interval = rule.intervalMonths;
  for (const [flag, months] of Object.entries(rule.intervalByCondition ?? {}) as [ClinicalFlag, number][]) {
    if (ctx.flags[flag] && (interval === undefined || months < interval)) {
      interval = months;
    }
  }
  return interval;
}

const MS_PER_MONTH = 30.44 * 24 * 3600 * 1000;
const STATUS_ORDER: Record<StudyStatus, number> = { missing: 0, overdue: 1, info: 2, current: 3 };

/**
 * Evalúa los estudios recomendados contra las últimas Observations del paciente.
 * Devuelve un StudyGap por estudio, ordenado por prioridad (missing → current).
 */
export function evaluateStudyGaps(
  ctx: StudyContext,
  values: CKMObservationMap,
  now: number = Date.now()
): StudyGap[] {
  const gaps: StudyGap[] = recommendedStudies(ctx).map((rule) => {
    if (!rule.param) {
      return { rule, status: 'info' as StudyStatus };
    }
    const obs = values[rule.param];
    if (!obs) {
      return { rule, status: 'missing' as StudyStatus };
    }
    if (rule.oneTime) {
      return { rule, status: 'current' as StudyStatus, lastDate: obs.date };
    }
    if (!obs.date) {
      // Hecho en fecha desconocida: no se puede juzgar vencimiento.
      return { rule, status: 'current' as StudyStatus };
    }
    const monthsSince = (now - new Date(obs.date).getTime()) / MS_PER_MONTH;
    const interval = effectiveInterval(rule, ctx);
    const status: StudyStatus = interval !== undefined && monthsSince > interval ? 'overdue' : 'current';
    return { rule, status, lastDate: obs.date, monthsSince: Math.round(monthsSince), intervalMonths: interval };
  });

  return gaps.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}
