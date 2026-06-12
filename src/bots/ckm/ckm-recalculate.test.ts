import { indexSearchParameterBundle, indexStructureDefinitionBundle } from '@medplum/core';
import { readJson, SEARCH_PARAMETER_BUNDLE_FILES } from '@medplum/definitions';
import type { Bundle, Observation, Patient, SearchParameter } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { CKM_STAGE_URL, HGRAPH_DATA_URL, LOINC, LOINC_BP_PANEL, LOINC_SYSTEM } from '../../ckm/constants';
import type { HGraphMetric } from '../../ckm/types';
import { handler } from './ckm-recalculate';

const bot = { reference: 'Bot/123' };
const contentType = 'application/fhir+json';

function bpPanel(patientId: string, systolic: number, diastolic: number, date: string): Observation {
  return {
    resourceType: 'Observation',
    status: 'final',
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: date,
    code: { coding: [{ system: LOINC_SYSTEM, code: LOINC_BP_PANEL }] },
    component: [
      {
        code: { coding: [{ system: LOINC_SYSTEM, code: LOINC.sbp }] },
        valueQuantity: { value: systolic, unit: 'mmHg' },
      },
      {
        code: { coding: [{ system: LOINC_SYSTEM, code: LOINC.dbp }] },
        valueQuantity: { value: diastolic, unit: 'mmHg' },
      },
    ],
  };
}

function labObservation(patientId: string, code: string, value: number, unit: string, date: string): Observation {
  return {
    resourceType: 'Observation',
    status: 'final',
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: date,
    code: { coding: [{ system: LOINC_SYSTEM, code }] },
    valueQuantity: { value, unit },
  };
}

function getExtensions(patient: Patient): { stage?: number; metrics?: HGraphMetric[] } {
  const stage = patient.extension?.find((e) => e.url === CKM_STAGE_URL)?.valueInteger;
  const raw = patient.extension?.find((e) => e.url === HGRAPH_DATA_URL)?.valueString;
  const metrics = raw ? (JSON.parse(raw) as { metrics?: HGraphMetric[] }).metrics : undefined;
  return { stage, metrics };
}

describe('Bot CKM recalculate', () => {
  beforeAll(() => {
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
    for (const filename of SEARCH_PARAMETER_BUNDLE_FILES) {
      indexSearchParameterBundle(readJson(filename) as Bundle<SearchParameter>);
    }
  });

  test('panel de PA normal: estadío 0 y métricas saludables', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient', gender: 'female' });
    const observation = await medplum.createResource(bpPanel(patient.id as string, 118, 76, '2026-06-01'));

    const result = await handler(medplum, { bot, contentType, input: observation, secrets: {} });

    const { stage, metrics } = getExtensions(result as Patient);
    expect(stage).toBe(0);
    expect(metrics).toHaveLength(2);
    expect(metrics?.find((m) => m.id === 'sbp')).toMatchObject({ value: 118, status: 'healthy' });
  });

  test('hipertensión + ERC: estadío 2, gana la última PA por fecha', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient', gender: 'male' });
    await medplum.createResource(bpPanel(patient.id as string, 118, 76, '2026-01-01'));
    await medplum.createResource(labObservation(patient.id as string, LOINC.egfr, 48, 'mL/min/1.73m²', '2026-05-01'));
    const latest = await medplum.createResource(bpPanel(patient.id as string, 152, 94, '2026-06-01'));

    const result = await handler(medplum, { bot, contentType, input: latest, secrets: {} });

    const { stage, metrics } = getExtensions(result as Patient);
    expect(stage).toBe(2);
    expect(metrics?.find((m) => m.id === 'sbp')).toMatchObject({ value: 152 });
    expect(metrics?.find((m) => m.id === 'egfr')?.status).toBe('moderate');
  });

  test('Condition de ECV clínica activa: estadío 4', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient', gender: 'male' });
    await medplum.createResource({
      resourceType: 'Condition',
      subject: { reference: `Patient/${patient.id}` },
      clinicalStatus: { coding: [{ code: 'active' }] },
      code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'I25.1' }] },
    });
    const observation = await medplum.createResource(bpPanel(patient.id as string, 118, 76, '2026-06-01'));

    const result = await handler(medplum, { bot, contentType, input: observation, secrets: {} });

    expect(getExtensions(result as Patient).stage).toBe(4);
  });

  test('ignora Observations que no son CKM', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient' });
    const observation = await medplum.createResource(
      labObservation(patient.id as string, '8302-2', 170, 'cm', '2026-06-01')
    );

    const result = await handler(medplum, { bot, contentType, input: observation, secrets: {} });

    expect(result).toBeUndefined();
  });

  test('preserva los scores PREVENT ya guardados en la extensión', async () => {
    const medplum = new MockClient();
    const prevent = { ascvd10y: 10.8, hf10y: 6.9, cvdTotal30y: 27.6 };
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      extension: [{ url: HGRAPH_DATA_URL, valueString: JSON.stringify({ metrics: [], prevent }) }],
    });
    const observation = await medplum.createResource(bpPanel(patient.id as string, 137, 85, '2026-06-01'));

    const result = await handler(medplum, { bot, contentType, input: observation, secrets: {} });

    const raw = (result as Patient).extension?.find((e) => e.url === HGRAPH_DATA_URL)?.valueString;
    expect(JSON.parse(raw as string).prevent).toEqual(prevent);
  });
});
