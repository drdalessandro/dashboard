// Carga de datos del panel CKM (/ckm): pacientes + último RiskAssessment +
// alertas sin leer. Separado del componente para poder testearlo con
// MockClient y reusarlo.
import type { MedplumClient } from '@medplum/core';
import { formatHumanName } from '@medplum/core';
import type { HumanName, Patient } from '@medplum/fhirtypes';
import { getCKMStage, getHGraphData } from './extensions';
import type { CKMStage } from './types';

export interface DashboardRow {
  patient: Patient;
  name: string;
  stage?: CKMStage;
  ascvd10y?: number;
  riskUpdated?: string;
  hasAlert: boolean;
}

export async function loadDashboardRows(medplum: MedplumClient): Promise<DashboardRow[]> {
  // TODO: optimizar con una query GraphQL que traiga Patient +
  // RiskAssessment + Communication en una sola llamada y pagine de verdad.
  const patients = await medplum.searchResources('Patient', { _count: '50', _sort: '-_lastUpdated' });
  if (patients.length === 0) {
    return [];
  }
  const subjects = patients.map((p) => `Patient/${p.id}`).join(',');

  // Las búsquedas auxiliares no deben tumbar el panel completo si fallan:
  // se registra el error y la columna queda vacía.
  const [riskResult, alertResult] = await Promise.allSettled([
    medplum.searchResources('RiskAssessment', { subject: subjects, _sort: '-_lastUpdated', _count: '500' }),
    medplum.searchResources('Communication', { subject: subjects, category: 'alert', _count: '500' }),
  ]);
  if (riskResult.status === 'rejected') {
    console.error('Panel CKM: error buscando RiskAssessment', riskResult.reason);
  }
  if (alertResult.status === 'rejected') {
    console.error('Panel CKM: error buscando Communications de alerta', alertResult.reason);
  }
  const riskAssessments = riskResult.status === 'fulfilled' ? riskResult.value : [];
  // "Sin leer" = no completada; el filtro de status va del lado del cliente
  // para no depender del modificador :not del servidor
  const alerts = (alertResult.status === 'fulfilled' ? alertResult.value : []).filter((c) => c.status !== 'completed');

  // El primer RiskAssessment por paciente es el más reciente (_sort desc)
  const riskUpdatedByPatient = new Map<string, string>();
  for (const risk of riskAssessments) {
    const subject = risk.subject?.reference;
    if (subject && risk.meta?.lastUpdated && !riskUpdatedByPatient.has(subject)) {
      riskUpdatedByPatient.set(subject, risk.meta.lastUpdated);
    }
  }
  const alertedPatients = new Set(alerts.map((a) => a.subject?.reference));

  return patients.map((patient) => ({
    patient,
    name: patient.name ? formatHumanName(patient.name[0] as HumanName) : '',
    stage: getCKMStage(patient),
    ascvd10y: getHGraphData(patient).prevent?.ascvd10y,
    riskUpdated: riskUpdatedByPatient.get(`Patient/${patient.id}`),
    hasAlert: alertedPatients.has(`Patient/${patient.id}`),
  }));
}
