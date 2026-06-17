// Bot CKM: genera un "Plan Bienestar 100 días" (CarePlan IA) para un paciente.
//
// Se dispara MANUALMENTE (botón en el chart -> medplum.executeBot), no por
// Subscription. Flujo:
// 1. Resuelve el paciente del input (Patient, {patientId} o Parameters).
// 2. Reúne el contexto CKM: estadío, hGraph (métricas + PREVENT), últimas
//    Observations, Conditions activas, medicación y score SDOH.
// 3. Llama a la API de Claude (Anthropic Messages) vía fetch, forzando la tool
//    crear_plan_bienestar para recibir el plan estructurado. Se usa fetch nativo
//    (Node 22) en vez del SDK para no agrandar el bundle del bot en el deploy.
// 4. Convierte el plan a FHIR (Goal + Task + CarePlan) y lo persiste.
//
// GUARDARRAÍL: el CarePlan se crea como 'draft'. El médico lo revisa y aprueba
// (status 'active') desde la UI. El bot no prescribe ni activa nada.
//
// IMPORTANTE: la llamada al LLM tarda más que el timeout por defecto del Lambda
// de Medplum (10s). Subí el timeout del Lambda del bot a ~60s (AWS) para que el
// plan se genere sin "Sandbox.Timedout".
//
// Secrets del Bot:
// - ANTHROPIC_API_KEY (requerido): API key de Anthropic.
// - CKM_CAREPLAN_MODEL (opcional): model id (default claude-opus-4-8).
// - CKM_CAREPLAN_TIMEOUT_MS (opcional): abort de la llamada a Anthropic (default
//   55000); debe ser menor que el timeout del Lambda.
import type { BotEvent, MedplumClient } from '@medplum/core';
import type { CarePlan, Goal, Patient, Reference, Task } from '@medplum/fhirtypes';
import { ageFromBirthDate, deriveMedicationFlags, isActiveCondition, patientPreventSex } from '../../ckm/clinical';
import {
  buildCarePlanMessages,
  CAREPLAN_TOOL,
  proposalToCarePlan,
  proposalToGoals,
  proposalToTasks,
} from '../../ckm/careplan';
import type { CarePlanContext, CarePlanProposal } from '../../ckm/careplan';
import { getCKMStage, getHGraphData, getPREVENTInputs } from '../../ckm/extensions';
import { getLatestCKMObservations } from '../../ckm/observations';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-opus-4-8';

interface AnthropicContentBlock {
  type: string;
  name?: string;
  input?: unknown;
}
interface AnthropicResponse {
  stop_reason?: string;
  content?: AnthropicContentBlock[];
}

/** Resuelve el id de paciente desde el input del bot (varias formas posibles). */
function resolvePatientId(input: unknown): string | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }
  const obj = input as Record<string, unknown>;
  if (obj.resourceType === 'Patient' && typeof obj.id === 'string') {
    return obj.id;
  }
  if (typeof obj.patientId === 'string') {
    return obj.patientId;
  }
  // Parameters: { parameter: [{ name: 'patientId', valueString }] }
  if (obj.resourceType === 'Parameters' && Array.isArray(obj.parameter)) {
    const p = (obj.parameter as { name?: string; valueString?: string }[]).find((x) => x.name === 'patientId');
    if (p?.valueString) {
      return p.valueString;
    }
  }
  return undefined;
}

/** Llama a Claude forzando la tool y devuelve el plan estructurado. */
async function generateProposal(
  apiKey: string,
  model: string,
  ctx: CarePlanContext,
  timeoutMs: number
): Promise<CarePlanProposal> {
  const { system, user } = buildCarePlanMessages(ctx);
  // Abort para que un cuelgue de red falle con un mensaje claro (y no como
  // Sandbox.Timedout) si el Lambda no llega a api.anthropic.com.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system,
        messages: [{ role: 'user', content: user }],
        tools: [CAREPLAN_TOOL],
        tool_choice: { type: 'tool', name: CAREPLAN_TOOL.name },
      }),
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error(
        `Timeout (${timeoutMs}ms) contactando a Anthropic. Verificá que el Lambda del bot tenga salida a ` +
          'api.anthropic.com y que su timeout sea mayor (recomendado 60s).'
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`Anthropic respondió HTTP ${response.status}: ${await response.text()}`);
  }
  const data = (await response.json()) as AnthropicResponse;
  if (data.stop_reason === 'refusal') {
    throw new Error('El modelo declinó generar el plan (refusal). Revisar el contexto del paciente.');
  }
  const toolUse = data.content?.find((b) => b.type === 'tool_use' && b.name === CAREPLAN_TOOL.name);
  if (!toolUse?.input) {
    throw new Error('La respuesta del modelo no incluyó el plan estructurado (sin tool_use).');
  }
  return toolUse.input as CarePlanProposal;
}

async function buildContext(medplum: MedplumClient, patient: Patient): Promise<CarePlanContext> {
  const patientId = patient.id as string;
  const [values, conditions, medications] = await Promise.all([
    getLatestCKMObservations(medplum, patientId),
    medplum.searchResources('Condition', { subject: `Patient/${patientId}`, _count: '200' }),
    medplum.searchResources('MedicationRequest', { subject: `Patient/${patientId}`, status: 'active', _count: '100' }),
  ]);
  void values; // las métricas para el LLM salen del hGraph ya calculado por el bot de recálculo
  const active = conditions.filter(isActiveCondition);
  const hGraph = getHGraphData(patient);
  const { onStatin, onAntihypertensive } = deriveMedicationFlags(medications);

  const medNames = medications
    .map((m) => m.medicationCodeableConcept?.text ?? m.medicationCodeableConcept?.coding?.[0]?.display)
    .filter((x): x is string => Boolean(x));
  // Si no hay medicación nombrada pero sí flags, dejar al menos las clases.
  if (medNames.length === 0) {
    if (onStatin) {
      medNames.push('estatina');
    }
    if (onAntihypertensive) {
      medNames.push('antihipertensivo');
    }
  }

  return {
    stage: getCKMStage(patient),
    ageYears: ageFromBirthDate(patient.birthDate) || undefined,
    sex: patientPreventSex(patient),
    metrics: hGraph.metrics,
    prevent: hGraph.prevent,
    conditions: active
      .map((c) => c.code?.text ?? c.code?.coding?.[0]?.display)
      .filter((x): x is string => Boolean(x)),
    medications: medNames,
    sdohScore: getPREVENTInputs(patient).sdoh?.score,
  };
}

export async function handler(medplum: MedplumClient, event: BotEvent): Promise<CarePlan> {
  const apiKey = event.secrets['ANTHROPIC_API_KEY']?.valueString;
  if (!apiKey) {
    throw new Error('Falta el secret ANTHROPIC_API_KEY del bot.');
  }
  const model = event.secrets['CKM_CAREPLAN_MODEL']?.valueString || DEFAULT_MODEL;
  const timeoutMs = Number(event.secrets['CKM_CAREPLAN_TIMEOUT_MS']?.valueString) || 55000;

  const patientId = resolvePatientId(event.input);
  if (!patientId) {
    throw new Error('No se pudo determinar el paciente del input (Patient, {patientId} o Parameters).');
  }
  const patient = await medplum.readResource('Patient', patientId);

  const ctx = await buildContext(medplum, patient);
  const proposal = await generateProposal(apiKey, model, ctx, timeoutMs);

  const startIso = new Date().toISOString();
  // Crear Goals primero para poder referenciarlos desde el CarePlan.
  const goals: Goal[] = [];
  for (const g of proposalToGoals(proposal, patientId, startIso)) {
    goals.push(await medplum.createResource(g));
  }
  // Tasks de control (a agendar).
  for (const t of proposalToTasks(proposal, patientId, startIso)) {
    await medplum.createResource<Task>(t);
  }
  const goalRefs: Reference<Goal>[] = goals.map((g) => ({ reference: `Goal/${g.id}` }));
  const carePlan = proposalToCarePlan(proposal, patientId, goalRefs, startIso);
  const created = await medplum.createResource(carePlan);
  console.log(
    `CarePlan/${created.id} (draft) creado para Patient/${patientId}: ${goals.length} objetivos, ` +
      `${proposal.controles.length} controles, ${proposal.actividades.length} actividades.`
  );
  return created;
}
