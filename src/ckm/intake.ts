// Intérprete puro del intake clínico del portal de pacientes
// (App.segundaopinionmedica.org, INTAKE_QUESTIONNAIRE_URL). Compartido por el
// bot intake-response (que estructura a Condition/etc.) y por el panel LE8
// (fallback del componente tabaco cuando el paciente no respondió el
// cuestionario LE8 de tabaco). Sin dependencias de UI ni del cliente Medplum.
import type { QuestionnaireResponse } from '@medplum/fhirtypes';
import { INTAKE_QUESTIONNAIRE_URL } from './constants';
import type { NicotineInput } from './le8';
import { answersByLinkId } from './le8-questionnaires';

/** linkId del ítem de tabaquismo del intake (texto libre, ej. "Ex fumador/a"). */
export const INTAKE_TOBACCO_LINK = 'fr-tabaquismo';

/** Quita acentos y pasa a minúsculas para matchear texto libre de forma laxa. */
export function normalizeIntakeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '');
}

/**
 * Interpreta el texto libre de tabaquismo del intake a un status LE8/SNOMED
 * best-effort. El ítem no es coded (valueString), así que esto es una
 * aproximación por patrones — si la app externa lo emitiera como choice coded
 * (como le8-tobacco-v1), esto no haría falta. Devuelve undefined si el texto
 * no menciona tabaco de forma reconocible (no se inventa un estado).
 */
export function tobaccoStatusFromText(raw: string): 'never' | 'former' | 'current' | undefined {
  const s = normalizeIntakeText(raw);
  if (!s.includes('fum')) {
    return undefined;
  }
  if (/(nunca|jamas|no)\s+(he\s+)?fum/.test(s)) {
    return 'never';
  }
  if (/ex\s*-?\s*fumador|exfumador|dej(e|o|ado)?\s+de\s+fumar/.test(s)) {
    return 'former';
  }
  // Cualquier otra mención de tabaco ("Fumador/a actual", "Fumo") se interpreta
  // conservadoramente como tabaquismo activo: mejor marcarlo para que el médico
  // lo revise que perderlo.
  return 'current';
}

/**
 * Extrae el componente tabaco/nicotina de LE8 desde una respuesta del intake.
 * Sin años desde que dejó ni vapeo/humo de segunda mano (el intake no los
 * pregunta): el motor LE8 asume <1 año para ex-fumadores (conservador).
 */
export function interpretIntakeTobacco(response: QuestionnaireResponse): NicotineInput | undefined {
  const raw = answersByLinkId(response).get(INTAKE_TOBACCO_LINK)?.[0]?.valueString?.trim();
  if (!raw) {
    return undefined;
  }
  const status = tobaccoStatusFromText(raw);
  return status ? { status } : undefined;
}

/**
 * De una lista de QuestionnaireResponse (puede venir mezclada con las de LE8),
 * devuelve el tabaco interpretable del intake más reciente, o undefined.
 */
export function latestIntakeTobacco(responses: QuestionnaireResponse[]): NicotineInput | undefined {
  const intakes = responses
    .filter((r) => r.questionnaire === INTAKE_QUESTIONNAIRE_URL && r.status !== 'entered-in-error')
    .sort((a, b) => (b.authored ?? '').localeCompare(a.authored ?? ''));
  for (const response of intakes) {
    const nicotine = interpretIntakeTobacco(response);
    if (nicotine) {
      return nicotine;
    }
  }
  return undefined;
}
