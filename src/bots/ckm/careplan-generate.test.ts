import { indexSearchParameterBundle, indexStructureDefinitionBundle } from '@medplum/core';
import { readJson, SEARCH_PARAMETER_BUNDLE_FILES } from '@medplum/definitions';
import type { Bundle, Patient, SearchParameter } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { afterEach, vi } from 'vitest';
import { HGRAPH_DATA_URL } from '../../ckm/constants';
import { CAREPLAN_TOOL } from '../../ckm/careplan';
import type { CarePlanProposal } from '../../ckm/careplan';
import { handler } from './careplan-generate';

const bot = { reference: 'Bot/123' };
const contentType = 'application/fhir+json';
const secrets = { ANTHROPIC_API_KEY: { name: 'ANTHROPIC_API_KEY', valueString: 'sk-test' } };

const PROPOSAL: CarePlanProposal = {
  resumen: 'Plan de prueba.',
  objetivos: [{ descripcion: 'Bajar la presión', metrica: 'PA sistólica', valorObjetivo: '<130', plazoDias: 90 }],
  actividades: [{ categoria: 'alimentacion', titulo: 'Menos sal', descripcion: 'Reducir sodio' }],
  controles: [{ titulo: 'Control de PA', diaProgramado: 30 }],
  planAlimentario: { descripcion: 'DASH' },
  planCaminata: { descripcion: 'Caminata progresiva' },
};

function mockAnthropic(body: unknown, ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    }))
  );
}

function toolResponse(proposal: CarePlanProposal): unknown {
  return { stop_reason: 'tool_use', content: [{ type: 'tool_use', name: CAREPLAN_TOOL.name, input: proposal }] };
}

describe('Bot careplan-generate', () => {
  beforeAll(() => {
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
    for (const filename of SEARCH_PARAMETER_BUNDLE_FILES) {
      indexSearchParameterBundle(readJson(filename) as Bundle<SearchParameter>);
    }
  });

  afterEach(() => vi.unstubAllGlobals());

  async function makePatient(medplum: MockClient): Promise<Patient> {
    return medplum.createResource<Patient>({
      resourceType: 'Patient',
      gender: 'male',
      birthDate: '1968-01-01',
      extension: [
        {
          url: HGRAPH_DATA_URL,
          valueString: JSON.stringify({ metrics: [], prevent: { ascvd10y: 12, hf10y: 6, cvdTotal30y: 28 } }),
        },
      ],
    });
  }

  test('genera CarePlan draft + Goal + Task desde el plan del LLM', async () => {
    const medplum = new MockClient();
    const patient = await makePatient(medplum);
    mockAnthropic(toolResponse(PROPOSAL));

    const result = await handler(medplum, { bot, contentType, input: patient, secrets });

    expect(result.resourceType).toBe('CarePlan');
    expect(result.status).toBe('draft');
    expect(result.subject?.reference).toBe(`Patient/${patient.id}`);
    expect(result.goal).toHaveLength(1);

    const goals = await medplum.searchResources('Goal', `subject=Patient/${patient.id}`);
    expect(goals).toHaveLength(1);
    expect(goals[0].lifecycleStatus).toBe('proposed');

    const tasks = await medplum.searchResources('Task', `patient=Patient/${patient.id}`);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].code?.text).toBe('Control de PA');
  });

  test('acepta input {patientId}', async () => {
    const medplum = new MockClient();
    const patient = await makePatient(medplum);
    mockAnthropic(toolResponse(PROPOSAL));

    const result = await handler(medplum, { bot, contentType, input: { patientId: patient.id }, secrets });
    expect(result.status).toBe('draft');
  });

  test('falla si falta ANTHROPIC_API_KEY', async () => {
    const medplum = new MockClient();
    const patient = await makePatient(medplum);
    await expect(handler(medplum, { bot, contentType, input: patient, secrets: {} })).rejects.toThrow(
      /ANTHROPIC_API_KEY/
    );
  });

  test('propaga el refusal del modelo', async () => {
    const medplum = new MockClient();
    const patient = await makePatient(medplum);
    mockAnthropic({ stop_reason: 'refusal', content: [] });

    await expect(handler(medplum, { bot, contentType, input: patient, secrets })).rejects.toThrow(/declinó|refusal/);
  });
});
