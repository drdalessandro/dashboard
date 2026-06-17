// Valida EN EL SERVIDOR la regla de alertas "3 strikes" del bot ckm-recalculate.
//
// Usa un paciente de prueba dedicado (identificado por un identifier propio),
// limpia su estado en cada corrida (para no chocar con el cooldown de 30 días),
// carga 3 registros de presión arterial elevada y espera a que el bot
// (Subscription async) cree el DetectedIssue + Task + Communication esperados.
//
// NO envía emails: el paciente de prueba no tiene generalPractitioner con email,
// así que el bot crea los recursos pero no manda correo.
//
// Requiere que el bot ya esté desplegado (npm run deploy-bots-server) y con su
// ProjectMembership creada (npm run ckm-bots-doctor -- --fix-bot-membership).
//
// Uso:
//   MEDPLUM_CLIENT_ID=xxx MEDPLUM_CLIENT_SECRET=xxx npm run verify-alerts
import { MedplumClient } from '@medplum/core';
import type { Observation, Patient } from '@medplum/fhirtypes';
import { LOINC, LOINC_BP_PANEL, LOINC_SYSTEM } from '../ckm/constants';
import { ALERT_RULE_SYSTEM } from '../ckm/alert-rules';

const TEST_IDENTIFIER_SYSTEM = 'https://seguimiento.medplum.com.ar/fhir/test';
const TEST_IDENTIFIER_VALUE = 'ckm-alert-3strikes';
const RULE_ID = 'sbp-high';
const POLL_ATTEMPTS = 24;
const POLL_INTERVAL_MS = 2500;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function bpPanel(patientId: string, systolic: number, diastolic: number, date: string): Observation {
  return {
    resourceType: 'Observation',
    status: 'final',
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: date,
    code: { coding: [{ system: LOINC_SYSTEM, code: LOINC_BP_PANEL }] },
    component: [
      { code: { coding: [{ system: LOINC_SYSTEM, code: LOINC.sbp }] }, valueQuantity: { value: systolic, unit: 'mmHg' } },
      { code: { coding: [{ system: LOINC_SYSTEM, code: LOINC.dbp }] }, valueQuantity: { value: diastolic, unit: 'mmHg' } },
    ],
  };
}

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Borra los recursos de un tipo que matcheen una búsqueda (para limpiar estado). */
async function deleteWhere(medplum: MedplumClient, type: Parameters<MedplumClient['searchResources']>[0], query: string): Promise<number> {
  const found = await medplum.searchResources(type, query);
  for (const r of found) {
    await medplum.deleteResource(type, r.id as string);
  }
  return found.length;
}

async function main(): Promise<void> {
  const baseUrl = process.env.MEDPLUM_BASE_URL ?? 'https://api.medplum.com.ar';
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Faltan MEDPLUM_CLIENT_ID y MEDPLUM_CLIENT_SECRET');
  }

  const medplum = new MedplumClient({ baseUrl, fetch });
  await medplum.startClientLogin(clientId, clientSecret);
  console.log(`Proyecto del client: ${medplum.getProject()?.id} en ${baseUrl}\n`);

  // 1. Paciente de prueba dedicado (idempotente por identifier)
  const patient = await medplum.upsertResource<Patient>(
    {
      resourceType: 'Patient',
      identifier: [{ system: TEST_IDENTIFIER_SYSTEM, value: TEST_IDENTIFIER_VALUE }],
      name: [{ given: ['Prueba'], family: 'Alertas CKM' }],
      gender: 'male',
      birthDate: '1968-01-01',
    },
    `identifier=${encodeURIComponent(`${TEST_IDENTIFIER_SYSTEM}|${TEST_IDENTIFIER_VALUE}`)}`
  );
  const pid = patient.id as string;
  console.log(`1. Paciente de prueba: Patient/${pid}`);

  // 2. Reset de estado para que la corrida sea limpia (evita el cooldown)
  const subj = `subject=Patient/${pid}`;
  const pat = `patient=Patient/${pid}`;
  const obs = await deleteWhere(medplum, 'Observation', subj);
  const di = await deleteWhere(medplum, 'DetectedIssue', pat);
  const tasks = await deleteWhere(medplum, 'Task', pat);
  const comms = await deleteWhere(medplum, 'Communication', subj);
  console.log(`2. Estado previo limpiado: ${obs} Observation, ${di} DetectedIssue, ${tasks} Task, ${comms} Communication`);

  // 3. Cargar 3 PA elevadas (sistólica >=140, diastólica normal, no críticas)
  console.log('3. Cargando 3 registros de PA elevada (145, 148, 150 mmHg)...');
  await medplum.createResource(bpPanel(pid, 145, 85, daysAgoIso(2)));
  await medplum.createResource(bpPanel(pid, 148, 86, daysAgoIso(1)));
  await medplum.createResource(bpPanel(pid, 150, 84, daysAgoIso(0)));

  // 4. Esperar a que el bot (Subscription async) cree el DetectedIssue
  console.log(`4. Esperando al bot (hasta ${(POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s)...`);
  let detected = false;
  for (let i = 0; i < POLL_ATTEMPTS && !detected; i++) {
    await sleep(POLL_INTERVAL_MS);
    const issues = await medplum.searchResources('DetectedIssue', `${pat}&code=${encodeURIComponent(`${ALERT_RULE_SYSTEM}|${RULE_ID}`)}`);
    if (issues.length > 0) {
      detected = true;
    } else {
      process.stdout.write('.');
    }
  }
  process.stdout.write('\n');

  // 5. Reportar
  const issues = await medplum.searchResources('DetectedIssue', pat);
  const taskList = await medplum.searchResources('Task', pat);
  const commList = await medplum.searchResources('Communication', `${subj}&category=alert`);

  console.log('\n── Resultado ──────────────────────────────');
  console.log(`  DetectedIssue: ${issues.length}  ${issues.length > 0 ? '✓' : '✗'}`);
  issues.forEach((x) => console.log(`    · ${x.code?.coding?.[0]?.code ?? x.code?.text}: ${x.detail}`));
  console.log(`  Task (revisión): ${taskList.length}  ${taskList.length > 0 ? '✓' : '✗'}`);
  console.log(`  Communication 'alert': ${commList.length}  ${commList.length > 0 ? '✓' : '✗'}`);

  if (detected && taskList.length > 0 && commList.length > 0) {
    console.log('\n✓ OK: la regla "3 strikes" disparó y creó DetectedIssue + Task + Communication.');
  } else {
    console.log(
      '\n✗ No se detectó la alerta esperada. Verificá:\n' +
        '  - El bot está desplegado con el código nuevo (npm run build:bots && npm run deploy-bots-server)\n' +
        '  - La Subscription del bot está activa y en el proyecto de los pacientes\n' +
        '  - El bot tiene ProjectMembership (npm run ckm-bots-doctor -- --fix-bot-membership)\n' +
        '  - Subí POLL_ATTEMPTS si el procesamiento async está lento.'
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n✗ Error:', err.message ?? err);
  process.exit(1);
});
