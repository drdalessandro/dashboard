// Bot CKM: recalcula hGraph y estadío del paciente cuando llega una
// Observation nueva (o editada) con algún parámetro CKM, y notifica al
// profesional cuando hay empeoramiento de estadío o valores críticos.
//
// Se despliega con una Subscription cuyo criteria filtra por los códigos LOINC
// CKM (ver deploy-bots.ts). Flujo:
// 1. Extrae el paciente de la Observation recibida
// 2. Relee todas las Observations CKM y se queda con el último valor de cada
//    parámetro (acepta el panel de PA 85354-9 y la forma legacy separada)
// 3. Calcula scores/status de cada métrica y deriva el estadío CKM
//    (estadío 4 si hay Condition activa de ECV clínica)
// 4. Actualiza las extensiones CKMStage y hGraphData del Patient
// 5. Si el estadío empeoró, o la Observation que disparó el bot trae un valor
//    crítico (CRITICAL_LIMITS), crea una Communication categoría 'alert' (la
//    que muestra el dashboard /ckm) y envía email vía SES con
//    medplum.sendEmail() al médico de cabecera (generalPractitioner con email
//    en telecom) o al secret CKM_ALERT_EMAIL del Bot. El email no incluye
//    datos clínicos ni nombre del paciente, solo el link al chart.
//
// Secrets del Bot (opcionales):
// - CKM_ALERT_EMAIL: destinatario de respaldo si el paciente no tiene
//   generalPractitioner con email
// - CKM_APP_URL: base del link al chart (default https://seguimiento.medplum.com.ar)
//
// TODO PREVENT: el cálculo de los scores PREVENT (ASCVD/IC a 10 años, ECV
// total a 30 años) requiere los coeficientes oficiales publicados de las
// ecuaciones (Khan et al., Circulation 2023). Hasta integrarlos de una fuente
// validada, este bot preserva los scores ya guardados en la extensión.
import type { BotEvent, MedplumClient } from '@medplum/core';
import type { Communication, Condition, Observation, Patient, Practitioner, Reference } from '@medplum/fhirtypes';
import { getCKMStage, getHGraphData, withCKMExtensions } from '../../ckm/extensions';
import { extractCKMValues, getLatestCKMObservations } from '../../ckm/observations';
import { computeMetrics, deriveStage, detectCriticalValues } from '../../ckm/scoring';

const DEFAULT_APP_URL = 'https://seguimiento.medplum.com.ar';

// Prefijos ICD-10 de ECV clínica (estadío 4): enfermedad coronaria (I20-I25),
// insuficiencia cardíaca (I50), enfermedad cerebrovascular (I60-I69),
// fibrilación/aleteo auricular (I48) y enfermedad arterial periférica (I70-I73)
const CLINICAL_CVD_ICD10 = /^I(2[0-5]|48|50|6\d|7[0-3])/;

function isClinicalCVD(condition: Condition): boolean {
  return Boolean(condition.code?.coding?.some((c) => c.code && CLINICAL_CVD_ICD10.test(c.code)));
}

export async function handler(medplum: MedplumClient, event: BotEvent<Observation>): Promise<Patient | undefined> {
  const observation = event.input;

  // Solo reaccionar a Observations de parámetros CKM con sujeto Patient
  const triggeredValues = extractCKMValues(observation);
  const patientId = observation.subject?.reference?.match(/^Patient\/(.+)$/)?.[1];
  if (!patientId || Object.keys(triggeredValues).length === 0) {
    return undefined;
  }

  const patient = await medplum.readResource('Patient', patientId);
  const values = await getLatestCKMObservations(medplum, patientId);

  const conditions = await medplum.searchResources('Condition', {
    subject: `Patient/${patientId}`,
    _count: '200',
  });
  const active = conditions.filter((c) => {
    const status = c.clinicalStatus?.coding?.[0]?.code;
    return !status || status === 'active' || status === 'recurrence' || status === 'relapse';
  });
  const hasClinicalCVD = active.some(isClinicalCVD);

  const previousStage = getCKMStage(patient);
  const metrics = computeMetrics(values);
  const stage = deriveStage(values, { hasClinicalCVD, gender: patient.gender });
  const previous = getHGraphData(patient);

  const updated = await medplum.updateResource({
    ...patient,
    extension: withCKMExtensions(patient, stage, { metrics, prevent: previous.prevent }),
  });

  // Alertas: empeoramiento de estadío, o valor crítico en la Observation que
  // disparó el bot (solo lo recién llegado, para no re-alertar valores viejos)
  const messages: string[] = [];
  if (previousStage !== undefined && stage !== undefined && stage > previousStage) {
    messages.push(`El estadío CKM pasó de ${previousStage} a ${stage}.`);
  }
  messages.push(...detectCriticalValues(triggeredValues).map((c) => c.message));

  if (messages.length > 0) {
    await createAlertCommunication(medplum, patient, messages);
    await sendAlertEmail(medplum, event, patient, messages.length);
  }

  return updated;
}

async function createAlertCommunication(medplum: MedplumClient, patient: Patient, messages: string[]): Promise<void> {
  const communication: Communication = {
    resourceType: 'Communication',
    status: 'in-progress',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/communication-category', code: 'alert' }] }],
    subject: { reference: `Patient/${patient.id}` },
    recipient: patient.generalPractitioner?.filter((r) => r.reference?.startsWith('Practitioner/')),
    sent: new Date().toISOString(),
    payload: messages.map((message) => ({ contentString: message })),
  };
  await medplum.createResource(communication);
}

async function sendAlertEmail(
  medplum: MedplumClient,
  event: BotEvent<Observation>,
  patient: Patient,
  alertCount: number
): Promise<void> {
  const to = await resolveAlertEmail(medplum, event, patient);
  if (!to) {
    console.log(
      `Patient/${patient.id}: alerta sin email (sin generalPractitioner con email ni secret CKM_ALERT_EMAIL)`
    );
    return;
  }
  const appUrl = event.secrets['CKM_APP_URL']?.valueString ?? DEFAULT_APP_URL;
  // Por privacidad el correo no lleva nombre del paciente ni datos clínicos
  await medplum.sendEmail({
    to,
    subject: 'Alerta CKM — paciente de su panel',
    text:
      `Se ${alertCount === 1 ? 'registró 1 alerta' : `registraron ${alertCount} alertas`} CKM ` +
      'para un paciente de su panel.\n\n' +
      `Ver el chart: ${appUrl}/Patient/${patient.id}\n\n` +
      'Por privacidad este correo no incluye datos clínicos. ' +
      'La alerta completa está disponible al iniciar sesión.',
  });
}

async function resolveAlertEmail(
  medplum: MedplumClient,
  event: BotEvent<Observation>,
  patient: Patient
): Promise<string | undefined> {
  const gpRef = patient.generalPractitioner?.find((r) => r.reference?.startsWith('Practitioner/'));
  if (gpRef) {
    try {
      const practitioner = await medplum.readReference(gpRef as Reference<Practitioner>);
      const email = practitioner.telecom?.find((t) => t.system === 'email')?.value;
      if (email) {
        return email;
      }
    } catch (err) {
      console.error(`No se pudo leer ${gpRef.reference}`, err);
    }
  }
  return event.secrets['CKM_ALERT_EMAIL']?.valueString;
}
