import { indexSearchParameterBundle, indexStructureDefinitionBundle } from '@medplum/core';
import { readJson, SEARCH_PARAMETER_BUNDLE_FILES } from '@medplum/definitions';
import type { Bundle, Condition, Patient, QuestionnaireResponse, SearchParameter } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { INTAKE_QUESTIONNAIRE_URL } from '../../ckm/constants';
import { handler, parseEmergencyContact } from './intake-response';

const bot = { reference: 'Bot/123' };
const contentType = 'application/fhir+json';

// Respuesta real reportada por App.segundaopinionmedica.org (paciente Clara Podesta).
function claraResponse(patientId: string): QuestionnaireResponse {
  return {
    resourceType: 'QuestionnaireResponse',
    status: 'completed',
    questionnaire: INTAKE_QUESTIONNAIRE_URL,
    subject: { reference: `Patient/${patientId}` },
    authored: '2026-07-07T13:45:46.235Z',
    item: [
      {
        linkId: 'antecedentes',
        item: [
          { linkId: 'antecedentes-cardiovasculares', answer: [{ valueBoolean: true }] },
          {
            linkId: 'antecedentes-cv-detalle',
            answer: [
              {
                valueString:
                  'Miocardiopatia inducida por taquiarritmia. Fibrilacion auricular, Ablacion de FA, HTA. Sobrepeso. Fiebre reumatica en la infancia sin secuelas',
              },
            ],
          },
          { linkId: 'antecedentes-otros' },
        ],
      },
      {
        linkId: 'factores-riesgo',
        item: [
          { linkId: 'fr-hipertension', answer: [{ valueBoolean: true }] },
          { linkId: 'fr-diabetes' },
          { linkId: 'fr-dislipemia' },
          { linkId: 'fr-tabaquismo', answer: [{ valueString: 'Ex fumador/a' }] },
          { linkId: 'fr-familiares', answer: [{ valueBoolean: true }] },
        ],
      },
      {
        linkId: 'cirugias',
        item: [
          { linkId: 'cirugias-cardiacas', answer: [{ valueBoolean: true }] },
          { linkId: 'cirugias-detalle', answer: [{ valueString: 'Ablacion Fibrilacion auricular' }] },
        ],
      },
      {
        linkId: 'medicacion',
        item: [
          { linkId: 'medicacion-toma', answer: [{ valueBoolean: true }] },
          {
            linkId: 'medicacion-detalle',
            answer: [{ valueString: 'valsartan 40\naspirina prevent\nbisoprolol 5\nFinerenona ' }],
          },
        ],
      },
      { linkId: 'alergias', item: [{ linkId: 'alergias-tiene' }] },
      {
        linkId: 'general',
        item: [{ linkId: 'embarazo' }, { linkId: 'contacto-emergencia', answer: [{ valueString: 'Gaston Pagani' }] }],
      },
      { linkId: 'declaracion', answer: [{ valueBoolean: true }] },
    ],
  };
}

async function conditionsOf(medplum: MockClient, patientId: string): Promise<Condition[]> {
  return medplum.searchResources('Condition', { subject: `Patient/${patientId}` });
}

describe('Bot intake-response', () => {
  beforeAll(() => {
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
    for (const filename of SEARCH_PARAMETER_BUNDLE_FILES) {
      indexSearchParameterBundle(readJson(filename) as Bundle<SearchParameter>);
    }
  });

  test('ignora respuestas de otros cuestionarios (LE8, SDOH, etc.)', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient' });
    const response = await medplum.createResource<QuestionnaireResponse>({
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: 'https://bio.medplum.com.ar/fhir/Questionnaire/le8-tobacco-v1',
      subject: { reference: `Patient/${patient.id}` },
    });

    const result = await handler(medplum, { bot, contentType, input: response, secrets: {} });

    expect(result).toBeUndefined();
  });

  test('caso real: estructura antecedentes, factores de riesgo, cirugía, medicación y familiares', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient' });
    const response = await medplum.createResource(claraResponse(patient.id as string));

    const created = await handler(medplum, { bot, contentType, input: response, secrets: {} });

    // Condition: antecedentes-cv-detalle (uncoded), fr-hipertension (I10), fr-tabaquismo (ex-fumador SNOMED)
    const conditions = await conditionsOf(medplum, patient.id as string);
    expect(conditions).toHaveLength(3);

    const cvDetail = conditions.find((c) => c.code?.text?.includes('Miocardiopatia'));
    expect(cvDetail).toBeDefined();
    expect(cvDetail?.code?.coding).toBeUndefined();

    const htaCondition = conditions.find((c) => c.code?.coding?.[0]?.code === 'I10');
    expect(htaCondition?.code?.coding?.[0]?.system).toBe('http://hl7.org/fhir/sid/icd-10');
    expect(htaCondition?.clinicalStatus?.coding?.[0]?.code).toBe('active');

    const tobaccoCondition = conditions.find((c) => c.code?.coding?.[0]?.system === 'http://snomed.info/sct');
    expect(tobaccoCondition?.code?.coding?.[0]?.code).toBe('8517006'); // ex-fumador/a
    expect(tobaccoCondition?.clinicalStatus?.coding?.[0]?.code).toBe('inactive'); // no debe marcar tabaquismo activo

    // Procedure: cirugías
    const procedures = await medplum.searchResources('Procedure', { subject: `Patient/${patient.id}` });
    expect(procedures).toHaveLength(1);
    expect(procedures[0].code?.text).toBe('Ablacion Fibrilacion auricular');

    // MedicationRequest: 4 líneas de medicacion-detalle → 4 recursos
    const meds = await medplum.searchResources('MedicationRequest', {
      subject: `Patient/${patient.id}`,
    });
    expect(meds).toHaveLength(4);
    expect(meds.map((m) => m.medicationCodeableConcept?.text)).toEqual([
      'valsartan 40',
      'aspirina prevent',
      'bisoprolol 5',
      'Finerenona',
    ]);

    // FamilyMemberHistory: fr-familiares=true
    const family = await medplum.searchResources('FamilyMemberHistory', {
      patient: `Patient/${patient.id}`,
    });
    expect(family).toHaveLength(1);

    // AllergyIntolerance: alergias-tiene sin responder → no crea nada
    const allergies = await medplum.searchResources('AllergyIntolerance', {
      patient: `Patient/${patient.id}`,
    });
    expect(allergies).toHaveLength(0);

    // Patient.contact: contacto de emergencia (solo nombre, sin teléfono)
    const updated = await medplum.readResource('Patient', patient.id as string);
    expect(updated.contact).toHaveLength(1);
    expect(updated.contact?.[0]?.name?.text).toBe('Gaston Pagani');
    expect(updated.contact?.[0]?.telecom).toBeUndefined();
    expect(updated.contact?.[0]?.relationship?.[0]?.coding?.[0]?.code).toBe('C');

    expect(created).toHaveLength(3 + 1 + 4 + 1 + 1); // conditions + procedure + meds + family history + patient
  });

  test('reprocesar la misma respuesta es idempotente (no duplica recursos)', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient' });
    const response = await medplum.createResource(claraResponse(patient.id as string));

    await handler(medplum, { bot, contentType, input: response, secrets: {} });
    await handler(medplum, { bot, contentType, input: response, secrets: {} });

    const conditions = await conditionsOf(medplum, patient.id as string);
    const meds = await medplum.searchResources('MedicationRequest', {
      subject: `Patient/${patient.id}`,
    });
    expect(conditions).toHaveLength(3);
    expect(meds).toHaveLength(4);
    // El contacto de emergencia tampoco se duplica al reprocesar.
    const updated = await medplum.readResource('Patient', patient.id as string);
    expect(updated.contact).toHaveLength(1);
  });

  test('alergias-tiene=true sin detalle crea AllergyIntolerance marcada para confirmar', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient' });
    const response = await medplum.createResource<QuestionnaireResponse>({
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: INTAKE_QUESTIONNAIRE_URL,
      subject: { reference: `Patient/${patient.id}` },
      item: [{ linkId: 'alergias', item: [{ linkId: 'alergias-tiene', answer: [{ valueBoolean: true }] }] }],
    });

    await handler(medplum, { bot, contentType, input: response, secrets: {} });

    const allergies = await medplum.searchResources('AllergyIntolerance', {
      patient: `Patient/${patient.id}`,
    });
    expect(allergies).toHaveLength(1);
    expect(allergies[0].code?.text).toMatch(/sin detalle/i);
  });

  test('"Fumador/a actual" marca tabaquismo activo (matchea hasSmoking de clinical.ts)', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient' });
    const response = await medplum.createResource<QuestionnaireResponse>({
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: INTAKE_QUESTIONNAIRE_URL,
      subject: { reference: `Patient/${patient.id}` },
      item: [
        { linkId: 'factores-riesgo', item: [{ linkId: 'fr-tabaquismo', answer: [{ valueString: 'Fumador/a actual' }] }] },
      ],
    });

    await handler(medplum, { bot, contentType, input: response, secrets: {} });

    const conditions = await conditionsOf(medplum, patient.id as string);
    expect(conditions).toHaveLength(1);
    expect(conditions[0].code?.coding?.[0]?.code).toBe('77176002');
    expect(conditions[0].clinicalStatus?.coding?.[0]?.code).toBe('active');
  });
});

describe('parseEmergencyContact', () => {
  test('solo nombre (caso real Clara Podesta)', () => {
    expect(parseEmergencyContact('Gaston Pagani')).toEqual({ name: 'Gaston Pagani', phone: undefined });
  });

  test('nombre y teléfono en el mismo texto', () => {
    expect(parseEmergencyContact('Gaston Pagani 11-5555-1234')).toEqual({
      name: 'Gaston Pagani',
      phone: '11-5555-1234',
    });
    expect(parseEmergencyContact('Gaston Pagani, +54 9 11 5555 1234')).toEqual({
      name: 'Gaston Pagani',
      phone: '+54 9 11 5555 1234',
    });
  });

  test('solo teléfono', () => {
    expect(parseEmergencyContact('1155551234')).toEqual({ name: undefined, phone: '1155551234' });
  });
});

describe('contacto de emergencia → Patient.contact', () => {
  test('conserva los contactos cargados a mano y reemplaza solo el del intake', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      contact: [{ name: { text: 'Contacto Manual' }, telecom: [{ system: 'phone', value: '4444-5555' }] }],
    });
    const withContact = (text: string, authored: string): QuestionnaireResponse => ({
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: INTAKE_QUESTIONNAIRE_URL,
      subject: { reference: `Patient/${patient.id}` },
      authored,
      item: [{ linkId: 'general', item: [{ linkId: 'contacto-emergencia', answer: [{ valueString: text }] }] }],
    });

    const first = await medplum.createResource(withContact('Gaston Pagani', '2026-07-07T00:00:00Z'));
    await handler(medplum, { bot, contentType, input: first, secrets: {} });
    // Una respuesta posterior actualiza el contacto del intake (no lo duplica).
    const second = await medplum.createResource(withContact('Maria Perez 11-5555-1234', '2026-07-08T00:00:00Z'));
    await handler(medplum, { bot, contentType, input: second, secrets: {} });

    const updated = await medplum.readResource('Patient', patient.id as string);
    expect(updated.contact).toHaveLength(2);
    expect(updated.contact?.[0]?.name?.text).toBe('Contacto Manual'); // intacto
    expect(updated.contact?.[1]?.name?.text).toBe('Maria Perez');
    expect(updated.contact?.[1]?.telecom?.[0]?.value).toBe('11-5555-1234');
  });
});
