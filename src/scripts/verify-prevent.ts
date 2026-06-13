// Smoke-test de producción del bot ckm-recalculate (modelo PREVENT base).
//
// Crea en el servidor el paciente de referencia oficial (mujer 50a, SBP 160
// tratada, colesterol 200 / HDL 45, diabética, eGFR 90, IMC 35), deja que el
// bot desplegado recalcule, y compara los scores PREVENT que escribió el bot
// contra los que produce el motor local validado (computePrevent). Si
// coinciden, el bot en producción está calculando correctamente.
//
// Requiere que el bot ckm-recalculate y su Subscription ya estén desplegados
// (Upload Example Bots). Idempotente por identifier.
//
// Uso:
//   MEDPLUM_CLIENT_ID=xxx MEDPLUM_CLIENT_SECRET=xxx npm run verify-prevent
//   ... npm run verify-prevent -- --cleanup   (borra el paciente de prueba)
import { MedplumClient, sleep } from '@medplum/core';
import type { Observation, Patient } from '@medplum/fhirtypes';
import { LOINC, LOINC_BP_PANEL, LOINC_SYSTEM } from '../ckm/constants';
import { getHGraphData } from '../ckm/extensions';
import { computePrevent } from '../ckm/prevent';
import type { PreventInputs } from '../ckm/prevent';

const SYSTEM = 'https://seguimiento.medplum.com.ar/seed-patient';
const TEST_ID = 'ckm-prevent-ref';

const REFERENCE: PreventInputs = {
  age: 50,
  sex: 'female',
  totalCholesterol: 200,
  hdl: 45,
  systolicBP: 160,
  egfr: 90,
  bmi: 35,
  diabetes: true,
  smoking: false,
  onAntihypertensive: true,
  onStatin: false,
};

function obs(patientId: string, code: string, value: number, unit: string): Observation {
  return {
    resourceType: 'Observation',
    status: 'final',
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: new Date().toISOString(),
    code: { coding: [{ system: LOINC_SYSTEM, code }] },
    valueQuantity: { value, unit },
  };
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

  // Paciente de referencia (upsert por identifier)
  const birthYear = new Date().getFullYear() - REFERENCE.age - 1;
  const patient = await medplum.upsertResource<Patient>(
    {
      resourceType: 'Patient',
      identifier: [{ system: SYSTEM, value: TEST_ID }],
      name: [{ given: ['PREVENT'], family: 'Referencia' }],
      gender: 'female',
      birthDate: `${birthYear}-01-01`,
    },
    `identifier=${SYSTEM}|${TEST_ID}`
  );
  const pid = patient.id as string;

  if (process.argv.includes('--cleanup')) {
    await medplum.deleteResource('Patient', pid);
    console.log(`Paciente de prueba ${pid} eliminado.`);
    return;
  }

  // Comorbilidad y medicación (idempotentes)
  await medplum.upsertResource(
    {
      resourceType: 'Condition',
      identifier: [{ system: SYSTEM, value: `${TEST_ID}-dm` }],
      subject: { reference: `Patient/${pid}` },
      clinicalStatus: { coding: [{ code: 'active' }] },
      code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'E11.9' }] },
    },
    `identifier=${SYSTEM}|${TEST_ID}-dm`
  );
  await medplum.upsertResource(
    {
      resourceType: 'MedicationRequest',
      identifier: [{ system: SYSTEM, value: `${TEST_ID}-med` }],
      status: 'active',
      intent: 'order',
      subject: { reference: `Patient/${pid}` },
      medicationCodeableConcept: { text: 'Enalapril 10 mg' },
    },
    `identifier=${SYSTEM}|${TEST_ID}-med`
  );

  // Observations: las de laboratorio primero, el panel de PA al final para que
  // el último disparo del bot vea todos los datos.
  await medplum.createResource(obs(pid, LOINC.cholesterolTotal, 200, 'mg/dL'));
  await medplum.createResource(obs(pid, LOINC.hdlc, 45, 'mg/dL'));
  await medplum.createResource(obs(pid, LOINC.egfr, 90, 'mL/min/1.73m²'));
  await medplum.createResource(obs(pid, LOINC.bmi, 35, 'kg/m²'));
  await medplum.createResource({
    resourceType: 'Observation',
    status: 'final',
    subject: { reference: `Patient/${pid}` },
    effectiveDateTime: new Date().toISOString(),
    code: { coding: [{ system: LOINC_SYSTEM, code: LOINC_BP_PANEL }] },
    component: [
      { code: { coding: [{ system: LOINC_SYSTEM, code: LOINC.sbp }] }, valueQuantity: { value: 160, unit: 'mmHg' } },
      { code: { coding: [{ system: LOINC_SYSTEM, code: LOINC.dbp }] }, valueQuantity: { value: 90, unit: 'mmHg' } },
    ],
  });

  const expected = computePrevent(REFERENCE);
  console.log('Motor local (validado):', expected);
  console.log('Esperando a que el bot desplegado recalcule...');

  // Poll hasta ver los scores PREVENT en la extensión del Patient
  let serverPrevent;
  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    const fresh = await medplum.readResource('Patient', pid);
    serverPrevent = getHGraphData(fresh).prevent;
    if (serverPrevent && serverPrevent.ascvd10y === expected?.ascvd10y) {
      break;
    }
    console.log(`  intento ${i + 1}/20: ${serverPrevent ? JSON.stringify(serverPrevent) : 'sin datos aún'}`);
  }

  console.log('\nServidor (bot desplegado):', serverPrevent);
  const ok =
    serverPrevent?.ascvd10y === expected?.ascvd10y &&
    serverPrevent?.hf10y === expected?.hf10y &&
    serverPrevent?.cvdTotal30y === expected?.cvdTotal30y;
  if (ok) {
    console.log('\n✓ OK: el bot en producción coincide con el motor validado.');
  } else {
    console.log('\n✗ Diferencia. Verificá que el bot ckm-recalculate esté desplegado y al día,');
    console.log('  y que su AccessPolicy permita leer Observation/Condition/MedicationRequest.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
