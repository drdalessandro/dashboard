import { indexSearchParameterBundle, indexStructureDefinitionBundle } from '@medplum/core';
import { readJson, SEARCH_PARAMETER_BUNDLE_FILES } from '@medplum/definitions';
import type { Bundle, Communication, Observation, Patient, SearchParameter } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { vi } from 'vitest';
import { CKM_SCORES_SYSTEM, CKM_STAGE_URL, HGRAPH_DATA_URL, LOINC, LOINC_BP_PANEL, LOINC_SYSTEM } from '../../ckm/constants';
import { buildScoreObservation } from '../../ckm/score-history';
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

  test('empeoramiento de estadío: crea Communication alert y manda email', async () => {
    const medplum = new MockClient();
    const sendEmail = vi.spyOn(medplum, 'sendEmail').mockResolvedValue({} as never);
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      gender: 'male',
      extension: [{ url: CKM_STAGE_URL, valueInteger: 1 }],
    });
    // TFGe 48 -> ERC -> estadío 2 (antes 1)
    const observation = await medplum.createResource(
      labObservation(patient.id as string, LOINC.egfr, 48, 'mL/min/1.73m²', '2026-06-01')
    );

    const result = await handler(medplum, {
      bot,
      contentType,
      input: observation,
      secrets: { CKM_ALERT_EMAIL: { name: 'CKM_ALERT_EMAIL', valueString: 'cardio@example.com' } },
    });

    expect(getExtensions(result as Patient).stage).toBe(2);
    const alerts = await medplum.searchResources('Communication', `subject=Patient/${patient.id}`);
    expect(alerts).toHaveLength(1);
    expect((alerts[0] as Communication).payload?.[0]?.contentString).toContain('pasó de 1 a 2');
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({ to: 'cardio@example.com' });
    // Por privacidad el email solo lleva el link, sin datos clínicos
    const emailBody = JSON.stringify(sendEmail.mock.calls[0][0]);
    expect(emailBody).not.toContain('TFGe');
    expect(emailBody).not.toContain('estadío');
  });

  test('valor crítico sin cambio de estadío: alerta al generalPractitioner', async () => {
    const medplum = new MockClient();
    const sendEmail = vi.spyOn(medplum, 'sendEmail').mockResolvedValue({} as never);
    const gp = await medplum.createResource({
      resourceType: 'Practitioner',
      telecom: [{ system: 'email', value: 'dra.lopez@example.com' }],
    });
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      gender: 'female',
      generalPractitioner: [{ reference: `Practitioner/${gp.id}` }],
      extension: [{ url: CKM_STAGE_URL, valueInteger: 2 }],
    });
    // PA 186/92: crítico (>=180) pero sigue siendo estadío 2
    const observation = await medplum.createResource(bpPanel(patient.id as string, 186, 92, '2026-06-01'));

    await handler(medplum, { bot, contentType, input: observation, secrets: {} });

    const alerts = await medplum.searchResources('Communication', `subject=Patient/${patient.id}`);
    expect(alerts).toHaveLength(1);
    expect((alerts[0] as Communication).payload?.[0]?.contentString).toContain('PA sistólica 186');
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({ to: 'dra.lopez@example.com' });
  });

  test('valores normales sin empeoramiento: no alerta ni manda email', async () => {
    const medplum = new MockClient();
    const sendEmail = vi.spyOn(medplum, 'sendEmail').mockResolvedValue({} as never);
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      gender: 'female',
      extension: [{ url: CKM_STAGE_URL, valueInteger: 2 }],
    });
    const observation = await medplum.createResource(bpPanel(patient.id as string, 118, 76, '2026-06-01'));

    await handler(medplum, {
      bot,
      contentType,
      input: observation,
      secrets: { CKM_ALERT_EMAIL: { name: 'CKM_ALERT_EMAIL', valueString: 'cardio@example.com' } },
    });

    const alerts = await medplum.searchResources('Communication', `subject=Patient/${patient.id}`);
    expect(alerts).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('PA cruzada (87/160): alerta de carga inconsistente, sin falsos críticos, estadío preservado', async () => {
    const medplum = new MockClient();
    const sendEmail = vi.spyOn(medplum, 'sendEmail').mockResolvedValue({} as never);
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      gender: 'male',
      extension: [{ url: CKM_STAGE_URL, valueInteger: 1 }],
    });
    // Campos cruzados al cargar en Control: sistólica 87, diastólica 160
    const observation = await medplum.createResource(bpPanel(patient.id as string, 87, 160, '2026-06-12'));

    const result = await handler(medplum, {
      bot,
      contentType,
      input: observation,
      secrets: { CKM_ALERT_EMAIL: { name: 'CKM_ALERT_EMAIL', valueString: 'cardio@example.com' } },
    });

    // La lectura no debe usarse: ni métricas de PA ni cambio de estadío
    const { stage, metrics } = getExtensions(result as Patient);
    expect(stage).toBe(1);
    expect(metrics?.find((m) => m.id === 'dbp')).toBeUndefined();

    const alerts = await medplum.searchResources('Communication', `subject=Patient/${patient.id}`);
    expect(alerts).toHaveLength(1);
    const payloads = (alerts[0] as Communication).payload?.map((p) => p.contentString ?? '') ?? [];
    expect(payloads.join(' ')).toContain('inconsistente');
    // Sin falso "valor crítico" por la diastólica 160
    expect(payloads.join(' ')).not.toContain('Valor crítico');
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  test('tendencia "3 strikes": 3 PA elevadas crean DetectedIssue + Task + Communication y no se duplican', async () => {
    const medplum = new MockClient();
    const sendEmail = vi.spyOn(medplum, 'sendEmail').mockResolvedValue({} as never);
    const gp = await medplum.createResource({
      resourceType: 'Practitioner',
      telecom: [{ system: 'email', value: 'dra.lopez@example.com' }],
    });
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      gender: 'male',
      generalPractitioner: [{ reference: `Practitioner/${gp.id}` }],
    });
    // 3 PA con sistólica elevada (>=140), diastólica normal, ninguna crítica
    await medplum.createResource(bpPanel(patient.id as string, 145, 85, '2026-06-15'));
    await medplum.createResource(bpPanel(patient.id as string, 148, 86, '2026-06-16'));
    const latest = await medplum.createResource(bpPanel(patient.id as string, 150, 84, '2026-06-17'));

    await handler(medplum, { bot, contentType, input: latest, secrets: {} });

    const issues = await medplum.searchResources('DetectedIssue', `patient=Patient/${patient.id}`);
    expect(issues).toHaveLength(1);
    expect(issues[0].code?.coding?.[0]).toMatchObject({ code: 'sbp-high' });

    const tasks = await medplum.searchResources('Task', `patient=Patient/${patient.id}`);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ owner: { reference: `Practitioner/${gp.id}` }, priority: 'urgent' });

    const alerts = await medplum.searchResources('Communication', `subject=Patient/${patient.id}`);
    expect(alerts).toHaveLength(1);
    expect((alerts[0] as Communication).payload?.[0]?.contentString).toContain('Presión sistólica');
    expect(sendEmail).toHaveBeenCalledTimes(1);

    // Segunda lectura elevada dentro del cooldown: no debe duplicar la alerta
    const again = await medplum.createResource(bpPanel(patient.id as string, 151, 85, '2026-06-17'));
    await handler(medplum, { bot, contentType, input: again, secrets: {} });

    expect(await medplum.searchResources('DetectedIssue', `patient=Patient/${patient.id}`)).toHaveLength(1);
    expect(await medplum.searchResources('Task', `patient=Patient/${patient.id}`)).toHaveLength(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  // Paciente con todos los insumos PREVENT (edad 30-79, sexo, PA, colesterol,
  // HDL, TFGe, IMC) para que el bot calcule scores y persista la serie.
  async function seedPreventPatient(medplum: MockClient): Promise<{ patient: Patient; latest: Observation }> {
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      gender: 'male',
      birthDate: '1955-01-01',
    });
    const id = patient.id as string;
    await medplum.createResource(labObservation(id, LOINC.cholesterolTotal, 240, 'mg/dL', '2026-06-01'));
    await medplum.createResource(labObservation(id, LOINC.hdlc, 35, 'mg/dL', '2026-06-01'));
    await medplum.createResource(labObservation(id, LOINC.egfr, 60, 'mL/min/1.73m²', '2026-06-01'));
    await medplum.createResource(labObservation(id, LOINC.bmi, 32, 'kg/m²', '2026-06-01'));
    const latest = await medplum.createResource(bpPanel(id, 160, 95, '2026-06-02'));
    return { patient, latest };
  }

  async function scoreSeries(medplum: MockClient, patientId: string, code: string): Promise<Observation[]> {
    return medplum.searchResources('Observation', {
      subject: `Patient/${patientId}`,
      code: `${CKM_SCORES_SYSTEM}|${code}`,
    });
  }

  test('serie de scores: persiste una Observation por outcome con trazabilidad, sin duplicar corridas', async () => {
    const medplum = new MockClient();
    vi.spyOn(medplum, 'sendEmail').mockResolvedValue({} as never);
    const { patient, latest } = await seedPreventPatient(medplum);

    await handler(medplum, { bot, contentType, input: latest, secrets: {} });

    const ascvd = await scoreSeries(medplum, patient.id as string, 'prevent-ascvd-10y');
    expect(ascvd).toHaveLength(1);
    expect(ascvd[0].valueQuantity?.unit).toBe('%');
    expect(ascvd[0].valueQuantity?.value).toBeGreaterThan(0);
    expect(ascvd[0].derivedFrom).toEqual([{ reference: `Observation/${latest.id}` }]);
    expect(await scoreSeries(medplum, patient.id as string, 'prevent-hf-10y')).toHaveLength(1);
    expect(await scoreSeries(medplum, patient.id as string, 'prevent-cvd-total-30y')).toHaveLength(1);

    // Re-corrida inmediata con los mismos datos: mismo valor hace <24 h,
    // la regla anti-inflado no agrega puntos
    await handler(medplum, { bot, contentType, input: latest, secrets: {} });
    expect(await scoreSeries(medplum, patient.id as string, 'prevent-ascvd-10y')).toHaveLength(1);
  });

  test('suba significativa de score: DetectedIssue + Communication + Task + email, con cooldown', async () => {
    const medplum = new MockClient();
    const sendEmail = vi.spyOn(medplum, 'sendEmail').mockResolvedValue({} as never);
    const { patient, latest } = await seedPreventPatient(medplum);
    // Línea de base vieja y baja: el score actual (perfil de alto riesgo)
    // queda varios pp arriba -> suba significativa
    await medplum.createResource(
      buildScoreObservation(patient.id as string, 'ascvd10y', 0.5, '2026-01-01T00:00:00Z')
    );

    await handler(medplum, {
      bot,
      contentType,
      input: latest,
      secrets: { CKM_ALERT_EMAIL: { name: 'CKM_ALERT_EMAIL', valueString: 'cardio@example.com' } },
    });

    const issues = await medplum.searchResources('DetectedIssue', `patient=Patient/${patient.id}`);
    expect(issues.map((i) => i.code?.coding?.[0]?.code)).toContain('score-rise-prevent-ascvd-10y');

    const alerts = await medplum.searchResources('Communication', `subject=Patient/${patient.id}`);
    const payloads = alerts.flatMap((a) => (a as Communication).payload?.map((p) => p.contentString ?? '') ?? []);
    expect(payloads.join(' ')).toContain('subió de 0.5%');

    const tasks = await medplum.searchResources('Task', `patient=Patient/${patient.id}`);
    expect(tasks.length).toBeGreaterThan(0);
    expect(sendEmail).toHaveBeenCalled();

    // Re-corrida dentro del cooldown: no duplica el DetectedIssue de suba
    await handler(medplum, { bot, contentType, input: latest, secrets: {} });
    const issuesAfter = await medplum.searchResources('DetectedIssue', `patient=Patient/${patient.id}`);
    expect(issuesAfter.filter((i) => i.code?.coding?.[0]?.code === 'score-rise-prevent-ascvd-10y')).toHaveLength(1);
  });

  test('sin insumos PREVENT completos no persiste puntos de score', async () => {
    const medplum = new MockClient();
    // Sin birthDate: no hay edad -> no se calcula PREVENT
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient', gender: 'female' });
    const observation = await medplum.createResource(bpPanel(patient.id as string, 118, 76, '2026-06-01'));

    await handler(medplum, { bot, contentType, input: observation, secrets: {} });

    expect(await scoreSeries(medplum, patient.id as string, 'prevent-ascvd-10y')).toHaveLength(0);
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
