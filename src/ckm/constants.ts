// Constantes compartidas del proyecto CKM (Cardio-Reno-Metabolismo).
// Códigos, URLs de extensiones y estadíos usados también por los bots del BackEnd.
import type { CKMStage } from './types';

export const LOINC_SYSTEM = 'http://loinc.org';

/** Códigos LOINC de los parámetros CKM. */
export const LOINC = {
  // Presión arterial
  sbp: '8480-6',
  dbp: '8462-4',
  // Antropometría
  bmi: '39156-5',
  waist: '56086-2',
  // Metabólico
  glucoseFasting: '1558-6',
  hba1c: '4548-4',
  // Lípidos
  cholesterolTotal: '2093-3',
  ldlc: '13457-7',
  hdlc: '2085-9',
  triglycerides: '2571-8',
  // Renal
  creatinine: '38483-4',
  egfr: '62238-1',
  uacr: '9318-7',
  potassium: '6298-4',
  // Cardíaco
  ntProBNP: '33762-6',
  hsCtnT: '89579-7',
  cac: '41970-0',
} as const;

/** Clave de un parámetro CKM (ej. 'sbp', 'egfr'). */
export type CKMParameterId = keyof typeof LOINC;

// URLs de las extensiones FHIR propias del proyecto
export const CKM_STAGE_URL = 'https://seguimiento.medplum.com.ar/fhir/StructureDefinition/CKMStage';
export const HGRAPH_DATA_URL = 'https://seguimiento.medplum.com.ar/fhir/StructureDefinition/hGraphData';
export const PREVENT_INPUTS_URL = 'https://seguimiento.medplum.com.ar/fhir/StructureDefinition/PREVENTInputs';

export interface CKMStageInfo {
  label: string;
  description: string;
  /** Color de la paleta de Mantine (ej. para <Badge color={...}>). */
  color: string;
}

/** Los 5 estadíos CKM de la Guía AHA/ACC/ADA/ASN 2026. */
export const CKM_STAGES: Record<CKMStage, CKMStageInfo> = {
  0: {
    label: 'Sin factores de riesgo',
    description: 'Sin factores de riesgo CKM. Prevención primordial.',
    color: 'gray',
  },
  1: {
    label: 'Exceso de grasa corporal',
    description: 'Sobrepeso/obesidad, adiposidad abdominal o prediabetes, sin otros factores metabólicos.',
    color: 'yellow',
  },
  2: {
    label: 'Factores de riesgo metabólicos o ERC',
    description: 'Hipertensión, diabetes tipo 2, hipertrigliceridemia, síndrome metabólico o enfermedad renal crónica.',
    color: 'orange',
  },
  3: {
    label: 'Enfermedad cardiovascular subclínica',
    description: 'Aterosclerosis subclínica (ej. score de calcio coronario elevado) o riesgo equivalente.',
    color: 'violet',
  },
  4: {
    label: 'Enfermedad cardiovascular clínica',
    description: 'ECV clínica: enfermedad coronaria, insuficiencia cardíaca, ACV o enfermedad arterial periférica.',
    color: 'red',
  },
};
