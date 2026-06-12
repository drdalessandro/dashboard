// Bot CKM: procesa las respuestas del cuestionario SDOH y acumula el resumen
// en la extensión PREVENTInputs del Patient (el índice de deprivación social
// es un insumo opcional de las ecuaciones PREVENT).
//
// Se despliega con una Subscription sobre QuestionnaireResponse del canónico
// ckm-sdoh-screening-v1 (ver deploy-bots.ts).
//
// Scoring agnóstico del contenido del cuestionario: suma los pesos declarados
// en las answerOption del Questionnaire con la extensión estándar
// ordinalValue/itemWeight. Si el cuestionario no define pesos, no calcula
// score pero igual registra que el screening fue respondido (responseId y
// fecha), que ya es señal para el equipo tratante.
import type { BotEvent, MedplumClient } from '@medplum/core';
import type {
  Patient,
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
} from '@medplum/fhirtypes';
import { PREVENT_INPUTS_URL, SDOH_QUESTIONNAIRE_URL } from '../../ckm/constants';
import { getPREVENTInputs, replaceExtension } from '../../ckm/extensions';

const WEIGHT_EXTENSION_URLS = [
  'http://hl7.org/fhir/StructureDefinition/ordinalValue',
  'http://hl7.org/fhir/StructureDefinition/itemWeight',
];

export async function handler(
  medplum: MedplumClient,
  event: BotEvent<QuestionnaireResponse>
): Promise<Patient | undefined> {
  const response = event.input;
  const patientId = response.subject?.reference?.match(/^Patient\/(.+)$/)?.[1];
  if (!patientId || response.questionnaire !== SDOH_QUESTIONNAIRE_URL) {
    return undefined;
  }

  const questionnaire = await medplum.searchOne('Questionnaire', `url=${SDOH_QUESTIONNAIRE_URL}`);
  const weights = questionnaire ? buildWeightMap(questionnaire) : new Map<string, number>();
  const { score, answered } = scoreResponse(response, weights);

  const patient = await medplum.readResource('Patient', patientId);
  const inputs = getPREVENTInputs(patient);
  inputs.sdoh = {
    score,
    answered,
    responseId: response.id,
    authored: response.authored ?? new Date().toISOString(),
  };

  return medplum.updateResource({
    ...patient,
    extension: replaceExtension(patient.extension, {
      url: PREVENT_INPUTS_URL,
      valueString: JSON.stringify(inputs),
    }),
  });
}

/** Mapa "linkId|code" -> peso, desde las answerOption del Questionnaire. */
function buildWeightMap(questionnaire: Questionnaire): Map<string, number> {
  const weights = new Map<string, number>();
  const walk = (items: QuestionnaireItem[] | undefined): void => {
    for (const item of items ?? []) {
      for (const option of item.answerOption ?? []) {
        const code = option.valueCoding?.code;
        const weight = option.valueCoding?.extension?.find((e) => WEIGHT_EXTENSION_URLS.includes(e.url))?.valueDecimal;
        if (code !== undefined && weight !== undefined) {
          weights.set(`${item.linkId}|${code}`, weight);
        }
      }
      walk(item.item);
    }
  };
  walk(questionnaire.item);
  return weights;
}

function scoreResponse(
  response: QuestionnaireResponse,
  weights: Map<string, number>
): { score?: number; answered: number } {
  let sum = 0;
  let hasWeights = false;
  let answered = 0;
  const walk = (items: QuestionnaireResponseItem[] | undefined): void => {
    for (const item of items ?? []) {
      if (item.answer?.length) {
        answered += 1;
        for (const answer of item.answer) {
          const code = answer.valueCoding?.code;
          const weight = code !== undefined ? weights.get(`${item.linkId}|${code}`) : undefined;
          if (weight !== undefined) {
            sum += weight;
            hasWeights = true;
          }
        }
      }
      walk(item.item);
    }
  };
  walk(response.item);
  return { score: hasWeights ? sum : undefined, answered };
}
