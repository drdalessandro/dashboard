// Motor de scoring de Life's Essential 8 (LE8) de la American Heart Association.
//
// LE8 mide la salud cardiovascular con 8 componentes, cada uno puntuado 0–100;
// el puntaje compuesto de salud cardiovascular es el PROMEDIO SIMPLE (sin pesos)
// de los 8. Las tablas de corte de cada componente son las del advisory:
//
//   Lloyd-Jones DM, et al. "Life's Essential 8: Updating and Enhancing the
//   American Heart Association's Construct of Cardiovascular Health: A
//   Presidential Advisory From the American Heart Association." Circulation.
//   2022;146(5):e18–e43.
//
// Este módulo es SOLO el motor: recibe valores ya medidos/derivados y devuelve
// los puntajes. La extracción desde Observations (presión, IMC, lípidos,
// glucosa) y desde QuestionnaireResponses de pacientes (sueño, dieta, actividad
// física, tabaco) vive en otros módulos. Sin dependencias de UI.
//
// Convención de unidades: lípidos y glucemia en mg/dL (uso local Argentina),
// HbA1c en %, presión en mmHg, IMC en kg/m².
//
// Decisión de producto (acordada con el equipo): el COMPUESTO solo se calcula
// si están presentes los 8 componentes; con datos parciales se exponen los
// sub-scores individuales y la lista de faltantes, sin número compuesto.

/** Las 8 claves de componente de LE8. */
export type LE8ComponentKey =
  | 'diet'
  | 'physicalActivity'
  | 'nicotine'
  | 'sleep'
  | 'bmi'
  | 'lipids'
  | 'glucose'
  | 'bloodPressure';

/** Orden de presentación (salud conductual primero, luego biomédica). */
export const LE8_ORDER: LE8ComponentKey[] = [
  'diet',
  'physicalActivity',
  'nicotine',
  'sleep',
  'bmi',
  'lipids',
  'glucose',
  'bloodPressure',
];

/** Etiqueta en español de cada componente. */
export const LE8_LABELS: Record<LE8ComponentKey, string> = {
  diet: 'Dieta',
  physicalActivity: 'Actividad física',
  nicotine: 'Tabaco / nicotina',
  sleep: 'Sueño',
  bmi: 'IMC',
  lipids: 'Lípidos (no-HDL)',
  glucose: 'Glucosa',
  bloodPressure: 'Presión arterial',
};

// ───────────────────────────────────────────────────────────────────────────
// Categoría cualitativa de un puntaje LE8 (0–100). La AHA clasifica la salud
// cardiovascular en alta (80–100), moderada (50–79) y baja (0–49); aplica igual
// a cada componente y al compuesto.
// ───────────────────────────────────────────────────────────────────────────

export type LE8Level = 'high' | 'moderate' | 'low';

export interface LE8Category {
  level: LE8Level;
  /** Etiqueta para mostrar, en español. */
  label: string;
  /** Color de la paleta de Mantine. */
  color: string;
}

const LE8_CATEGORIES: Record<LE8Level, LE8Category> = {
  high: { level: 'high', label: 'Alto', color: 'green' },
  moderate: { level: 'moderate', label: 'Moderado', color: 'yellow' },
  low: { level: 'low', label: 'Bajo', color: 'red' },
};

/** Clasifica un puntaje LE8 (0–100) en alto / moderado / bajo. */
export function le8Category(score: number): LE8Category {
  if (score >= 80) {
    return LE8_CATEGORIES.high;
  }
  if (score >= 50) {
    return LE8_CATEGORIES.moderate;
  }
  return LE8_CATEGORIES.low;
}

// ───────────────────────────────────────────────────────────────────────────
// Entradas de cada componente. Cada scorer devuelve un puntaje 0–100, o
// undefined si no hay dato suficiente para puntuarlo.
// ───────────────────────────────────────────────────────────────────────────

/**
 * Nivel de adherencia dietaria, 1 (más baja) a 5 (más alta). LE8 puntúa la
 * dieta por el patrón tipo DASH/MEPA en 5 niveles: el crosswalk desde el
 * screener que completa el paciente se resuelve en el intérprete del
 * cuestionario (otra etapa); el motor solo mapea el nivel a su puntaje.
 */
export type DietLevel = 1 | 2 | 3 | 4 | 5;

const DIET_LEVEL_SCORE: Record<DietLevel, number> = { 1: 0, 2: 25, 3: 50, 4: 80, 5: 100 };

export interface NicotineInput {
  /** Situación tabáquica del paciente. */
  status: 'never' | 'former' | 'current';
  /** Años desde que dejó (si status = former). Si falta, se asume <1 año. */
  yearsSinceQuit?: number;
  /** Si status = current y solo usa nicotina inhalada (vapeo/e-cig), no combustible. */
  inhaledNicotineOnly?: boolean;
  /** Exposición a humo de segunda mano en el hogar (resta 20, piso 0). */
  secondhandAtHome?: boolean;
}

export interface GlucoseInput {
  /** Diagnóstico de diabetes (Condition). Se complementa con los umbrales de abajo. */
  hasDiabetes: boolean;
  hba1cPercent?: number;
  fastingGlucoseMgDl?: number;
}

export interface BloodPressureInput {
  systolic: number;
  diastolic: number;
  /** En tratamiento antihipertensivo (resta 20, piso 0). */
  onAntihypertensive?: boolean;
}

export interface LE8Inputs {
  diet?: { level: DietLevel };
  physicalActivityMinPerWeek?: number;
  nicotine?: NicotineInput;
  sleepHoursPerNight?: number;
  bmi?: number;
  nonHdlMgDl?: number;
  glucose?: GlucoseInput;
  bloodPressure?: BloodPressureInput;
}

function isFinitePositive(n: number | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/** Dieta: nivel de adherencia 1–5 → {0,25,50,80,100}. */
export function scoreDiet(diet?: { level: DietLevel }): number | undefined {
  if (!diet || !(diet.level in DIET_LEVEL_SCORE)) {
    return undefined;
  }
  return DIET_LEVEL_SCORE[diet.level];
}

/** Actividad física: minutos/semana de actividad moderada-vigorosa (MVPA). */
export function scorePhysicalActivity(minPerWeek?: number): number | undefined {
  if (!isFinitePositive(minPerWeek)) {
    return undefined;
  }
  if (minPerWeek <= 0) {
    return 0;
  }
  if (minPerWeek < 30) {
    return 20;
  }
  if (minPerWeek < 60) {
    return 40;
  }
  if (minPerWeek < 90) {
    return 60;
  }
  if (minPerWeek < 120) {
    return 80;
  }
  if (minPerWeek < 150) {
    return 90;
  }
  return 100;
}

/**
 * Tabaco / nicotina: nunca = 100; ex según años desde que dejó (≥5 = 75,
 * 1–<5 = 50, <1 = 25); uso actual de nicotina inhalada (vapeo) = 25; fumador
 * actual de combustible = 0. La exposición a humo de segunda mano resta 20.
 */
export function scoreNicotine(input?: NicotineInput): number | undefined {
  if (!input) {
    return undefined;
  }
  let base: number;
  if (input.status === 'never') {
    base = 100;
  } else if (input.status === 'former') {
    const y = input.yearsSinceQuit;
    base = !isFinitePositive(y) || y < 1 ? 25 : y >= 5 ? 75 : 50;
  } else {
    // current
    base = input.inhaledNicotineOnly ? 25 : 0;
  }
  if (input.secondhandAtHome) {
    base = Math.max(0, base - 20);
  }
  return base;
}

/** Sueño: horas promedio por noche. 7–<9 es el óptimo (100). */
export function scoreSleep(hours?: number): number | undefined {
  if (!isFinitePositive(hours)) {
    return undefined;
  }
  if (hours < 4) {
    return 0;
  }
  if (hours < 5) {
    return 20;
  }
  if (hours < 6) {
    return 40;
  }
  if (hours < 7) {
    return 70;
  }
  if (hours < 9) {
    return 100;
  }
  if (hours < 10) {
    return 90;
  }
  return 40; // ≥10 h
}

/** IMC (kg/m²). */
export function scoreBmi(bmi?: number): number | undefined {
  if (!isFinitePositive(bmi)) {
    return undefined;
  }
  if (bmi < 25) {
    return 100;
  }
  if (bmi < 30) {
    return 70;
  }
  if (bmi < 35) {
    return 30;
  }
  if (bmi < 40) {
    return 15;
  }
  return 0;
}

/** Lípidos: colesterol no-HDL (mg/dL). LE8 no aplica ajuste por medicación a lípidos. */
export function scoreLipids(nonHdlMgDl?: number): number | undefined {
  if (!isFinitePositive(nonHdlMgDl)) {
    return undefined;
  }
  if (nonHdlMgDl < 130) {
    return 100;
  }
  if (nonHdlMgDl < 160) {
    return 60;
  }
  if (nonHdlMgDl < 190) {
    return 40;
  }
  if (nonHdlMgDl < 220) {
    return 20;
  }
  return 0;
}

/**
 * Glucosa. Sin diabetes se puntúa por HbA1c (o glucemia en ayunas si no hay
 * HbA1c): <5.7% (o <100 mg/dL) = 100; rango prediabético = 60. Con diabetes la
 * escala es por HbA1c: <7 = 40, 7–<8 = 30, 8–<9 = 20, 9–<10 = 10, ≥10 = 0.
 *
 * Se considera diabético si hay diagnóstico O si HbA1c ≥ 6.5% / glucemia ≥ 126
 * (mismo criterio que usará la extracción de Observations), para que el motor
 * sea internamente consistente. Un diabético sin HbA1c no puede puntuarse en la
 * escala diabética → devuelve undefined (dato insuficiente).
 */
export function scoreGlucose(input?: GlucoseInput): number | undefined {
  if (!input) {
    return undefined;
  }
  const a = input.hba1cPercent;
  const f = input.fastingGlucoseMgDl;
  const hasA = isFinitePositive(a);
  const hasF = isFinitePositive(f);
  const diabetic = input.hasDiabetes || (hasA && a >= 6.5) || (hasF && f >= 126);

  if (diabetic) {
    if (!hasA) {
      return undefined; // la escala diabética de LE8 es por HbA1c
    }
    if (a < 7) {
      return 40;
    }
    if (a < 8) {
      return 30;
    }
    if (a < 9) {
      return 20;
    }
    if (a < 10) {
      return 10;
    }
    return 0;
  }
  // No diabético: aquí HbA1c < 6.5 y glucemia < 126 están garantizadas.
  if (hasA) {
    return a < 5.7 ? 100 : 60;
  }
  if (hasF) {
    return f < 100 ? 100 : 60;
  }
  return undefined;
}

/**
 * Presión arterial (mmHg). La categoría la fija la más severa de sistólica o
 * diastólica: <120 y <80 = 100; 120–129 y <80 = 75; 130–139 ó 80–89 = 50;
 * 140–159 ó 90–99 = 25; ≥160 ó ≥100 = 0. En tratamiento antihipertensivo
 * resta 20 (piso 0).
 */
export function scoreBloodPressure(input?: BloodPressureInput): number | undefined {
  if (!input || !isFinitePositive(input.systolic) || !isFinitePositive(input.diastolic)) {
    return undefined;
  }
  const { systolic: s, diastolic: d } = input;
  let base: number;
  if (s >= 160 || d >= 100) {
    base = 0;
  } else if (s >= 140 || d >= 90) {
    base = 25;
  } else if (s >= 130 || d >= 80) {
    base = 50;
  } else if (s >= 120) {
    base = 75; // 120–129 y <80
  } else {
    base = 100; // <120 y <80
  }
  if (input.onAntihypertensive) {
    base = Math.max(0, base - 20);
  }
  return base;
}

// ───────────────────────────────────────────────────────────────────────────
// Cálculo del resultado completo.
// ───────────────────────────────────────────────────────────────────────────

export interface LE8ComponentResult {
  key: LE8ComponentKey;
  label: string;
  score: number;
  category: LE8Category;
}

export interface LE8Result {
  /** Sub-scores de los componentes con dato, en el orden de LE8_ORDER. */
  components: LE8ComponentResult[];
  /** Componentes sin dato suficiente. */
  missing: LE8ComponentKey[];
  /** Promedio simple de los 8; solo presente si están los 8 componentes. */
  composite?: number;
  /** Categoría del compuesto (solo si está el compuesto). */
  compositeCategory?: LE8Category;
  /** true si los 8 componentes tienen dato. */
  complete: boolean;
}

function rawScore(key: LE8ComponentKey, inputs: LE8Inputs): number | undefined {
  switch (key) {
    case 'diet':
      return scoreDiet(inputs.diet);
    case 'physicalActivity':
      return scorePhysicalActivity(inputs.physicalActivityMinPerWeek);
    case 'nicotine':
      return scoreNicotine(inputs.nicotine);
    case 'sleep':
      return scoreSleep(inputs.sleepHoursPerNight);
    case 'bmi':
      return scoreBmi(inputs.bmi);
    case 'lipids':
      return scoreLipids(inputs.nonHdlMgDl);
    case 'glucose':
      return scoreGlucose(inputs.glucose);
    case 'bloodPressure':
      return scoreBloodPressure(inputs.bloodPressure);
  }
}

/**
 * Calcula los 8 sub-scores LE8 y el compuesto. El compuesto (promedio simple)
 * solo se devuelve si están los 8 componentes; con datos parciales quedan los
 * sub-scores disponibles y la lista de faltantes.
 */
export function computeLE8(inputs: LE8Inputs): LE8Result {
  const components: LE8ComponentResult[] = [];
  const missing: LE8ComponentKey[] = [];

  for (const key of LE8_ORDER) {
    const score = rawScore(key, inputs);
    if (score === undefined) {
      missing.push(key);
    } else {
      components.push({ key, label: LE8_LABELS[key], score, category: le8Category(score) });
    }
  }

  const complete = missing.length === 0;
  if (!complete) {
    return { components, missing, complete: false };
  }

  const composite = Math.round(components.reduce((sum, c) => sum + c.score, 0) / components.length);
  return { components, missing, composite, compositeCategory: le8Category(composite), complete: true };
}
