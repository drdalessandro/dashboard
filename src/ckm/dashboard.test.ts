import { indexSearchParameterBundle, indexStructureDefinitionBundle } from '@medplum/core';
import { readJson, SEARCH_PARAMETER_BUNDLE_FILES } from '@medplum/definitions';
import type { Bundle, Patient, SearchParameter } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { CKM_STAGE_URL, HGRAPH_DATA_URL } from './constants';
import { loadDashboardRows } from './dashboard';

describe('Carga del panel CKM', () => {
  beforeAll(() => {
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
    for (const filename of SEARCH_PARAMETER_BUNDLE_FILES) {
      indexSearchParameterBundle(readJson(filename) as Bundle<SearchParameter>);
    }
  });

  test('arma las filas con estadío, PREVENT, RiskAssessment y alerta (datos como los del seed)', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      name: [{ given: ['Jorge'], family: 'Demo' }],
      extension: [
        { url: CKM_STAGE_URL, valueInteger: 3 },
        {
          url: HGRAPH_DATA_URL,
          valueString: JSON.stringify({ metrics: [], prevent: { ascvd10y: 18.2, hf10y: 12.4, cvdTotal30y: 41.9 } }),
        },
      ],
    });
    const otherPatient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      name: [{ given: ['Sin'], family: 'Datos' }],
    });
    await medplum.createResource({
      resourceType: 'RiskAssessment',
      status: 'final',
      subject: { reference: `Patient/${patient.id}` },
      identifier: [{ system: 'https://seguimiento.medplum.com.ar/seed-patient', value: `ckm-seed-risk-${patient.id}` }],
      occurrenceDateTime: '2026-06-12T18:00:00Z',
      prediction: [{ outcome: { text: 'ASCVD 10 años' }, probabilityDecimal: 18.2 }],
    });
    await medplum.createResource({
      resourceType: 'Communication',
      status: 'in-progress',
      category: [
        { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/communication-category', code: 'alert' }] },
      ],
      subject: { reference: `Patient/${patient.id}` },
      payload: [{ contentString: 'Riesgo PREVENT-CVD elevado' }],
    });

    const rows = await loadDashboardRows(medplum);

    const jorge = rows.find((r) => r.patient.id === patient.id);
    expect(jorge).toMatchObject({
      name: 'Jorge Demo',
      stage: 3,
      ascvd10y: 18.2,
      hf10y: 12.4,
      cvdTotal30y: 41.9,
      hasAlert: true,
    });
    expect(jorge?.riskUpdated).toBeDefined();

    const sinDatos = rows.find((r) => r.patient.id === otherPatient.id);
    expect(sinDatos).toMatchObject({
      stage: undefined,
      ascvd10y: undefined,
      hf10y: undefined,
      cvdTotal30y: undefined,
      hasAlert: false,
    });
    expect(sinDatos?.riskUpdated).toBeUndefined();
  });

  test('una alerta completada (leída) no marca la fila', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient', name: [{ family: 'Test' }] });
    await medplum.createResource({
      resourceType: 'Communication',
      status: 'completed',
      category: [
        { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/communication-category', code: 'alert' }] },
      ],
      subject: { reference: `Patient/${patient.id}` },
    });

    const rows = await loadDashboardRows(medplum);
    expect(rows.find((r) => r.patient.id === patient.id)?.hasAlert).toBe(false);
  });
});
