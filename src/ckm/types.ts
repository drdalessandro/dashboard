// Tipos compartidos del proyecto CKM (Cardio-Reno-Metabolismo).
// Deben mantenerse alineados con los bots del BackEnd self-hosted.

/** Estadío CKM según la Guía AHA/ACC/ADA/ASN 2026. */
export type CKMStage = 0 | 1 | 2 | 3 | 4;

/** Estado cualitativo de una métrica en el hGraph. */
export type HGraphMetricStatus = 'healthy' | 'moderate' | 'high';

/** Una métrica individual del hGraph del paciente. */
export interface HGraphMetric {
  /** Identificador de la métrica (clave del objeto LOINC en constants.ts). */
  id: string;
  /** Etiqueta para mostrar en pantalla, en español. */
  label: string;
  /** Último valor medido. */
  value: number;
  /** Unidad de medida (ej. 'mmHg', 'mg/dL', '%'). */
  unit: string;
  /** Score normalizado entre 0 (peor) y 1 (óptimo). */
  score: number;
  status: HGraphMetricStatus;
}

/** Resumen del screening SDOH del paciente (cuestionario ckm-sdoh-screening-v1). */
export interface SDOHSummary {
  /** Suma de los pesos (ordinalValue/itemWeight) de las respuestas; mayor = más deprivación. */
  score?: number;
  /** Cantidad de ítems respondidos. */
  answered: number;
  responseId?: string;
  authored?: string;
}

/** Insumos acumulados para las ecuaciones PREVENT (extensión PREVENTInputs). */
export interface PREVENTInputsData {
  sdoh?: SDOHSummary;
}

/** Scores de riesgo de las ecuaciones PREVENT (AHA), en porcentaje. */
export interface PREVENTScores {
  /** Riesgo de ASCVD a 10 años. */
  ascvd10y: number;
  /** Riesgo de insuficiencia cardíaca a 10 años. */
  hf10y: number;
  /** Riesgo de ECV total a 30 años. */
  cvdTotal30y: number;
}
