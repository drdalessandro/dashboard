import { indexSearchParameterBundle, indexStructureDefinitionBundle } from '@medplum/core';
import { readJson, SEARCH_PARAMETER_BUNDLE_FILES } from '@medplum/definitions';
import type { Bundle, Patient, Questionnaire, QuestionnaireResponse, SearchParameter } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import fs from 'fs';
import { PREVENT_INPUTS_URL, SDOH_QUESTIONNAIRE_URL } from '../../ckm/constants';
import type { PREVENTInputsData } from '../../ckm/types';
import { handler } from './sdoh-response';

const bot = { reference: 'Bot/123' };
const contentType = 'application/fhir+json';
const ORDINAL_URL = 'http://hl7.org/fhir/StructureDefinition/ordinalValue';

const sdohQuestionnaire: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'active',
  url: SDOH_QUESTIONNAIRE_URL,
  item: [
    {
      linkId: 'food',
      type: 'choice',
      text: '¿Le preocupó quedarse sin comida?',
      answerOption: [
        { valueCoding: { code: 'si', extension: [{ url: ORDINAL_URL, valueDecimal: 2 }] } },
        { valueCoding: { code: 'no', extension: [{ url: ORDINAL_URL, valueDecimal: 0 }] } },
      ],
    },
    {
      linkId: 'housing',
      type: 'choice',
      text: '¿Tiene problemas de vivienda?',
      answerOption: [
        { valueCoding: { code: 'si', extension: [{ url: ORDINAL_URL, valueDecimal: 3 }] } },
        { valueCoding: { code: 'no', extension: [{ url: ORDINAL_URL, valueDecimal: 0 }] } },
      ],
    },
  ],
};

function sdohResponse(patientId: string, answers: Record<string, string>): QuestionnaireResponse {
  return {
    resourceType: 'QuestionnaireResponse',
    status: 'completed',
    questionnaire: SDOH_QUESTIONNAIRE_URL,
    subject: { reference: `Patient/${patientId}` },
    authored: '2026-06-12T10:00:00Z',
    item: Object.entries(answers).map(([linkId, code]) => ({
      linkId,
      answer: [{ valueCoding: { code } }],
    })),
  };
}

function getInputs(patient: Patient): PREVENTInputsData {
  const raw = patient.extension?.find((e) => e.url === PREVENT_INPUTS_URL)?.valueString;
  return raw ? (JSON.parse(raw) as PREVENTInputsData) : {};
}

describe('Bot SDOH response', () => {
  beforeAll(() => {
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
    for (const filename of SEARCH_PARAMETER_BUNDLE_FILES) {
      indexSearchParameterBundle(readJson(filename) as Bundle<SearchParameter>);
    }
  });

  test('suma los pesos ordinalValue y guarda el resumen en PREVENTInputs', async () => {
    const medplum = new MockClient();
    await medplum.createResource(sdohQuestionnaire);
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient' });
    const response = await medplum.createResource(sdohResponse(patient.id as string, { food: 'si', housing: 'no' }));

    const result = await handler(medplum, { bot, contentType, input: response, secrets: {} });

    const sdoh = getInputs(result as Patient).sdoh;
    expect(sdoh).toMatchObject({ score: 2, answered: 2, responseId: response.id, authored: '2026-06-12T10:00:00Z' });
  });

  test('sin pesos en el cuestionario: registra answered sin score', async () => {
    const medplum = new MockClient();
    await medplum.createResource<Questionnaire>({
      resourceType: 'Questionnaire',
      status: 'active',
      url: SDOH_QUESTIONNAIRE_URL,
      item: [{ linkId: 'food', type: 'choice', answerOption: [{ valueCoding: { code: 'si' } }] }],
    });
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient' });
    const response = await medplum.createResource(sdohResponse(patient.id as string, { food: 'si' }));

    const result = await handler(medplum, { bot, contentType, input: response, secrets: {} });

    const sdoh = getInputs(result as Patient).sdoh;
    expect(sdoh?.score).toBeUndefined();
    expect(sdoh?.answered).toBe(1);
  });

  test('contrato: el cuestionario real del repo produce score con el bot', async () => {
    const medplum = new MockClient();
    const real = JSON.parse(fs.readFileSync('data/ckm/sdoh-questionnaire.json', 'utf8')) as Questionnaire;
    await medplum.createResource(real);
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient' });
    // Peor respuesta en todos los ítems: 3+2+2+1+2+2+2+3 = 17
    const worst: Record<string, string> = {
      vivienda: 'si',
      alimentacion: 'frecuentemente',
      transporte: 'si',
      servicios: 'si',
      seguridad: 'si',
      soledad: 'siempre',
      ingresos: 'si',
      medicamentos: 'si',
    };
    const response = await medplum.createResource(sdohResponse(patient.id as string, worst));

    const result = await handler(medplum, { bot, contentType, input: response, secrets: {} });

    expect(getInputs(result as Patient).sdoh).toMatchObject({ score: 17, answered: 8 });
  });

  test('ignora respuestas de otros cuestionarios', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient' });
    const response = await medplum.createResource<QuestionnaireResponse>({
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: 'https://example.com/otro-cuestionario',
      subject: { reference: `Patient/${patient.id}` },
    });

    const result = await handler(medplum, { bot, contentType, input: response, secrets: {} });

    expect(result).toBeUndefined();
  });
});
