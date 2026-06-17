// Helpers clínicos puros compartidos por el BackEnd (bot ckm-recalculate) y el
// FrontEnd (simulador What-If, paneles). Derivan los flags que necesitan las
// ecuaciones PREVENT a partir de Condition / MedicationRequest / Patient.
//
// Sin dependencias de UI ni del cliente Medplum: solo lógica sobre recursos
// FHIR ya cargados, para que la misma definición de "diabético/fumador/en
// estatina" valga igual en ambos lados del contrato.
import type { Condition, MedicationRequest, Patient } from '@medplum/fhirtypes';

// Prefijos ICD-10 de ECV clínica (estadío 4): enfermedad coronaria (I20-I25),
// insuficiencia cardíaca (I50), enfermedad cerebrovascular (I60-I69),
// fibrilación/aleteo auricular (I48) y enfermedad arterial periférica (I70-I73)
export const CLINICAL_CVD_ICD10 = /^I(2[0-5]|48|50|6\d|7[0-3])/;

// ICD-10 de diabetes (E10-E14)
export const DIABETES_ICD10 = /^E1[0-4]/;

// ICD-10 de hipertensión (I10-I16), enfermedad renal crónica (N18) e
// insuficiencia cardíaca (I50) — para las reglas de estudios sugeridos.
export const HYPERTENSION_ICD10 = /^I1[0-6]/;
export const CKD_ICD10 = /^N18/;
export const HEART_FAILURE_ICD10 = /^I50/;

// Tabaquismo activo: ICD-10 (Z72.0, F17.x) y SNOMED (fumador actual)
export const SMOKING_CODES = /^(Z72\.0|F17|449868002|77176002)/;

// Texto de medicación (display/text) que indica estatina o antihipertensivo
const STATIN_TEXT = /statin|estatina|atorvastat|rosuvastat|simvastat|pravastat/;
const ANTIHYPERTENSIVE_TEXT =
  /enalapril|losart|valsart|amlodip|ramipril|lisinopril|hidroclorotiazida|hydrochlorothiazide|antihipertens/;

/** Devuelve true si algún coding de la Condition matchea el patrón de código. */
export function conditionMatches(condition: Condition, pattern: RegExp): boolean {
  return Boolean(condition.code?.coding?.some((c) => c.code && pattern.test(c.code)));
}

/** ECV clínica (define el estadío CKM 4). */
export function isClinicalCVD(condition: Condition): boolean {
  return conditionMatches(condition, CLINICAL_CVD_ICD10);
}

/** Una Condition se considera activa si no tiene estado o está activa/recurrente. */
export function isActiveCondition(condition: Condition): boolean {
  const status = condition.clinicalStatus?.coding?.[0]?.code;
  return !status || status === 'active' || status === 'recurrence' || status === 'relapse';
}

/** Hay diabetes si alguna Condition activa matchea los ICD-10 de diabetes. */
export function hasDiabetes(conditions: Condition[]): boolean {
  return conditions.some((c) => conditionMatches(c, DIABETES_ICD10));
}

/** Hay tabaquismo activo si alguna Condition activa lo codifica. */
export function hasSmoking(conditions: Condition[]): boolean {
  return conditions.some((c) => conditionMatches(c, SMOKING_CODES));
}

/** Hay hipertensión si alguna Condition activa la codifica (ICD-10 I10-I16). */
export function hasHypertension(conditions: Condition[]): boolean {
  return conditions.some((c) => conditionMatches(c, HYPERTENSION_ICD10));
}

/** Hay enfermedad renal crónica si alguna Condition activa la codifica (N18). */
export function hasCKD(conditions: Condition[]): boolean {
  return conditions.some((c) => conditionMatches(c, CKD_ICD10));
}

/** Hay insuficiencia cardíaca si alguna Condition activa la codifica (I50). */
export function hasHeartFailure(conditions: Condition[]): boolean {
  return conditions.some((c) => conditionMatches(c, HEART_FAILURE_ICD10));
}

/** Flags de medicación PREVENT a partir de las MedicationRequest activas. */
export function deriveMedicationFlags(medications: MedicationRequest[]): {
  onStatin: boolean;
  onAntihypertensive: boolean;
} {
  const medText = medications
    .map((m) => m.medicationCodeableConcept?.text ?? m.medicationCodeableConcept?.coding?.[0]?.display ?? '')
    .join(' ')
    .toLowerCase();
  return {
    onStatin: STATIN_TEXT.test(medText),
    onAntihypertensive: ANTIHYPERTENSIVE_TEXT.test(medText),
  };
}

/** Edad en años a partir de birthDate (NaN si falta). */
export function ageFromBirthDate(birthDate: string | undefined): number {
  if (!birthDate) {
    return NaN;
  }
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

/** Sexo binario que aceptan las ecuaciones PREVENT (o undefined si no aplica). */
export function patientPreventSex(patient: Patient): 'female' | 'male' | undefined {
  return patient.gender === 'female' ? 'female' : patient.gender === 'male' ? 'male' : undefined;
}
