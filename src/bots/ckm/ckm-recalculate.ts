// Bot CKM: recalcula hGraph y estadío del paciente cuando llega una
// Observation nueva (o editada) con algún parámetro CKM.
//
// Se despliega con una Subscription cuyo criteria filtra por los códigos LOINC
// CKM (ver deploy-bots.ts). Flujo:
// 1. Extrae el paciente de la Observation recibida
// 2. Relee todas las Observations CKM y se queda con el último valor de cada
//    parámetro (acepta el panel de PA 85354-9 y la forma legacy separada)
// 3. Calcula scores/status de cada métrica y deriva el estadío CKM
//    (estadío 4 si hay Condition activa de ECV clínica)
// 4. Actualiza las extensiones CKMStage y hGraphData del Patient
//
// TODO PREVENT: el cálculo de los scores PREVENT (ASCVD/IC a 10 años, ECV
// total a 30 años) requiere los coeficientes oficiales publicados de las
// ecuaciones (Khan et al., Circulation 2023). Hasta integrarlos de una fuente
// validada, este bot preserva los scores ya guardados en la extensión.
import type { BotEvent, MedplumClient } from '@medplum/core';
import type { Condition, Observation, Patient } from '@medplum/fhirtypes';
import { getHGraphData, withCKMExtensions } from '../../ckm/extensions';
import { extractCKMValues, getLatestCKMObservations } from '../../ckm/observations';
import { computeMetrics, deriveStage } from '../../ckm/scoring';

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
  const patientId = observation.subject?.reference?.match(/^Patient\/(.+)$/)?.[1];
  if (!patientId || Object.keys(extractCKMValues(observation)).length === 0) {
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

  const metrics = computeMetrics(values);
  const stage = deriveStage(values, { hasClinicalCVD, gender: patient.gender });
  const previous = getHGraphData(patient);

  return medplum.updateResource({
    ...patient,
    extension: withCKMExtensions(patient, stage, { metrics, prevent: previous.prevent }),
  });
}
