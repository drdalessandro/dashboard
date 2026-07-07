// Bot CKM: procesa el intake clínico del portal de pacientes
// (App.segundaopinionmedica.org, cuestionario intake-clinico) y estructura sus
// respuestas como recursos FHIR nativos — Condition (antecedentes/factores de
// riesgo), Procedure (cirugías), MedicationRequest (medicación),
// AllergyIntolerance (alergias) y FamilyMemberHistory (antecedentes
// familiares) — en vez de dejarlas solo dentro de un QuestionnaireResponse que
// ninguna pantalla del chart lista.
//
// El cuestionario NO es LE8 ni SDOH (linkIds y contenido distintos; ver
// constants.ts). Los campos codificados (hipertensión/diabetes/dislipemia) se
// mapean a ICD-10 con los mismos rangos que lee clinical.ts (hasHypertension,
// hasDiabetes), para que alimenten el motor PREVENT/CKM existente. Los campos
// de texto libre (antecedentes, cirugías) se guardan sin codificar
// (code.text) — no hay forma confiable de extraer códigos de una narrativa
// sin NLP clínico — así que quedan como texto para revisión médica.
//
// Se despliega con una Subscription sobre QuestionnaireResponse del canónico
// INTAKE_QUESTIONNAIRE_URL (ver deploy-bots.ts).
import { ICD10, SNOMED } from '@medplum/core';
import type { BotEvent, MedplumClient } from '@medplum/core';
import type {
  AllergyIntolerance,
  Condition,
  FamilyMemberHistory,
  MedicationRequest,
  Procedure,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
  Resource,
} from '@medplum/fhirtypes';
import { INTAKE_QUESTIONNAIRE_URL } from '../../ckm/constants';

const INTAKE_IDENTIFIER_SYSTEM = 'https://seguimiento.medplum.com.ar/fhir/identifier/intake-clinico-item';
const SIN_DETALLE = 'Reportado por el paciente en el intake digital, sin detalle adicional (confirmar en consulta).';

type Answers = Map<string, QuestionnaireResponseItemAnswer[]>;

/** Aplana un QuestionnaireResponse a linkId -> answers (recorre grupos anidados). */
function answersByLinkId(items: QuestionnaireResponseItem[] | undefined): Answers {
  const map: Answers = new Map();
  const walk = (list: QuestionnaireResponseItem[] | undefined): void => {
    for (const item of list ?? []) {
      if (item.answer?.length) {
        map.set(item.linkId, item.answer);
      }
      walk(item.item);
    }
  };
  walk(items);
  return map;
}

function boolAt(answers: Answers, linkId: string): boolean | undefined {
  return answers.get(linkId)?.[0]?.valueBoolean;
}

function textAt(answers: Answers, linkId: string): string | undefined {
  return answers.get(linkId)?.[0]?.valueString?.trim() || undefined;
}

/** Quita acentos y pasa a minúsculas para matchear texto libre de forma laxa. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '');
}

/**
 * Interpreta el texto libre de tabaquismo (ej. "Ex fumador/a") a un estado
 * SNOMED best-effort. El ítem no es coded (valueString), así que esto es una
 * aproximación por substring — si la app externa lo emitiera como choice
 * coded (como hace le8-tobacco-v1), esto no haría falta.
 */
function interpretTobaccoText(raw: string): { code: string; display: string; clinicalStatus: 'active' | 'inactive' } | undefined {
  const s = normalize(raw);
  if (!s.includes('fum')) {
    return undefined;
  }
  if (s.includes('ex')) {
    return { code: '8517006', display: 'Ex-fumador/a', clinicalStatus: 'inactive' };
  }
  if (s.includes('nunca')) {
    return undefined;
  }
  // Cualquier otra mención de tabaco ("Fumador/a actual", "Fumo", "Sí, fumo")
  // se interpreta conservadoramente como tabaquismo activo: mejor marcarlo
  // para que el médico lo revise que perderlo.
  return { code: '77176002', display: 'Fumador/a', clinicalStatus: 'active' };
}

async function upsertCondition(
  medplum: MedplumClient,
  patientId: string,
  responseId: string,
  itemKey: string,
  code: { system: string; value: string; display: string } | undefined,
  text: string,
  clinicalStatus: 'active' | 'inactive' = 'active'
): Promise<Condition> {
  const identifierValue = `${responseId}-${itemKey}`;
  const condition: Condition = {
    resourceType: 'Condition',
    subject: { reference: `Patient/${patientId}` },
    clinicalStatus: { coding: [{ code: clinicalStatus }] },
    category: [
      {
        coding: [
          {
            system: 'http://hl7.org/fhir/ValueSet/condition-category',
            code: 'problem-list-item',
            display: 'Problem List Item',
          },
        ],
      },
    ],
    code: code ? { coding: [{ system: code.system, code: code.value, display: code.display }], text } : { text },
    identifier: [{ system: INTAKE_IDENTIFIER_SYSTEM, value: identifierValue }],
  };
  return medplum.upsertResource(condition, `identifier=${INTAKE_IDENTIFIER_SYSTEM}|${identifierValue}`);
}

async function upsertProcedure(
  medplum: MedplumClient,
  patientId: string,
  responseId: string,
  text: string
): Promise<Procedure> {
  const identifierValue = `${responseId}-cirugias-detalle`;
  const procedure: Procedure = {
    resourceType: 'Procedure',
    status: 'completed',
    subject: { reference: `Patient/${patientId}` },
    code: { text },
    identifier: [{ system: INTAKE_IDENTIFIER_SYSTEM, value: identifierValue }],
  };
  return medplum.upsertResource(procedure, `identifier=${INTAKE_IDENTIFIER_SYSTEM}|${identifierValue}`);
}

async function upsertMedication(
  medplum: MedplumClient,
  patientId: string,
  responseId: string,
  index: number,
  text: string
): Promise<MedicationRequest> {
  const identifierValue = `${responseId}-medicacion-detalle-${index}`;
  const medicationRequest: MedicationRequest = {
    resourceType: 'MedicationRequest',
    status: 'active',
    intent: 'order',
    subject: { reference: `Patient/${patientId}` },
    medicationCodeableConcept: { text },
    identifier: [{ system: INTAKE_IDENTIFIER_SYSTEM, value: identifierValue }],
  };
  return medplum.upsertResource(medicationRequest, `identifier=${INTAKE_IDENTIFIER_SYSTEM}|${identifierValue}`);
}

async function upsertAllergy(medplum: MedplumClient, patientId: string, responseId: string): Promise<AllergyIntolerance> {
  const identifierValue = `${responseId}-alergias-tiene`;
  const allergy: AllergyIntolerance = {
    resourceType: 'AllergyIntolerance',
    clinicalStatus: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }],
    },
    patient: { reference: `Patient/${patientId}` },
    code: { text: 'Alergia reportada por el paciente (sin detalle — confirmar en consulta)' },
    identifier: [{ system: INTAKE_IDENTIFIER_SYSTEM, value: identifierValue }],
  };
  return medplum.upsertResource(allergy, `identifier=${INTAKE_IDENTIFIER_SYSTEM}|${identifierValue}`);
}

async function upsertFamilyHistory(
  medplum: MedplumClient,
  patientId: string,
  responseId: string
): Promise<FamilyMemberHistory> {
  const identifierValue = `${responseId}-fr-familiares`;
  const history: FamilyMemberHistory = {
    resourceType: 'FamilyMemberHistory',
    status: 'partial',
    patient: { reference: `Patient/${patientId}` },
    relationship: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode', code: 'FAMMEMB', display: 'Family Member' }],
    },
    condition: [
      { code: { coding: [{ system: SNOMED, code: '49601007', display: 'Enfermedad cardiovascular' }] } },
    ],
    identifier: [{ system: INTAKE_IDENTIFIER_SYSTEM, value: identifierValue }],
  };
  return medplum.upsertResource(history, `identifier=${INTAKE_IDENTIFIER_SYSTEM}|${identifierValue}`);
}

export async function handler(medplum: MedplumClient, event: BotEvent<QuestionnaireResponse>): Promise<Resource[] | undefined> {
  const response = event.input;
  const patientId = response.subject?.reference?.match(/^Patient\/(.+)$/)?.[1];
  if (!patientId || response.questionnaire !== INTAKE_QUESTIONNAIRE_URL) {
    return undefined;
  }

  const responseId = response.id as string;
  const answers = answersByLinkId(response.item);
  const created: Resource[] = [];

  // Antecedentes cardiovasculares
  if (boolAt(answers, 'antecedentes-cardiovasculares')) {
    const detalle = textAt(answers, 'antecedentes-cv-detalle') ?? SIN_DETALLE;
    created.push(await upsertCondition(medplum, patientId, responseId, 'antecedentes-cv-detalle', undefined, detalle));
  }

  // Otras enfermedades crónicas (ítem independiente, sin booleano de gate)
  const otrosDetalle = textAt(answers, 'antecedentes-otros');
  if (otrosDetalle) {
    created.push(await upsertCondition(medplum, patientId, responseId, 'antecedentes-otros', undefined, otrosDetalle));
  }

  // Factores de riesgo codificados (mismos rangos ICD-10 que clinical.ts)
  if (boolAt(answers, 'fr-hipertension')) {
    created.push(
      await upsertCondition(
        medplum,
        patientId,
        responseId,
        'fr-hipertension',
        { system: ICD10, value: 'I10', display: 'Hipertensión esencial' },
        'Hipertensión arterial (reportada por el paciente)'
      )
    );
  }
  if (boolAt(answers, 'fr-diabetes')) {
    created.push(
      await upsertCondition(
        medplum,
        patientId,
        responseId,
        'fr-diabetes',
        { system: ICD10, value: 'E11.9', display: 'Diabetes mellitus tipo 2' },
        'Diabetes (reportada por el paciente)'
      )
    );
  }
  if (boolAt(answers, 'fr-dislipemia')) {
    created.push(
      await upsertCondition(
        medplum,
        patientId,
        responseId,
        'fr-dislipemia',
        { system: ICD10, value: 'E78.5', display: 'Hiperlipidemia, no especificada' },
        'Colesterol alto / dislipemia (reportada por el paciente)'
      )
    );
  }

  // Tabaquismo: texto libre, interpretación best-effort (ver interpretTobaccoText)
  const tabaquismoTexto = textAt(answers, 'fr-tabaquismo');
  if (tabaquismoTexto) {
    const tobacco = interpretTobaccoText(tabaquismoTexto);
    if (tobacco) {
      created.push(
        await upsertCondition(
          medplum,
          patientId,
          responseId,
          'fr-tabaquismo',
          { system: SNOMED, value: tobacco.code, display: tobacco.display },
          tabaquismoTexto,
          tobacco.clinicalStatus
        )
      );
    }
  }

  // Antecedentes familiares
  if (boolAt(answers, 'fr-familiares')) {
    created.push(await upsertFamilyHistory(medplum, patientId, responseId));
  }

  // Cirugías y procedimientos
  if (boolAt(answers, 'cirugias-cardiacas')) {
    const detalle = textAt(answers, 'cirugias-detalle') ?? SIN_DETALLE;
    created.push(await upsertProcedure(medplum, patientId, responseId, detalle));
  }

  // Medicación: una línea de texto = un MedicationRequest
  if (boolAt(answers, 'medicacion-toma')) {
    const detalle = textAt(answers, 'medicacion-detalle');
    const lines = detalle
      ? detalle
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      : [SIN_DETALLE];
    for (let i = 0; i < lines.length; i++) {
      created.push(await upsertMedication(medplum, patientId, responseId, i, lines[i]));
    }
  }

  // Alergias (el cuestionario no captura detalle, solo el flag)
  if (boolAt(answers, 'alergias-tiene')) {
    created.push(await upsertAllergy(medplum, patientId, responseId));
  }

  return created;
}
