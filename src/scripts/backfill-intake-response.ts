// Backfill: procesa QuestionnaireResponse de intake-clinico que ya estaban
// guardadas en el servidor ANTES de que existiera el bot ckm/intake-response.ts
// (su Subscription solo dispara para respuestas NUEVAS, no reprocesa histórico).
//
// Llama al mismo handler() del bot directamente con un MedplumClient real, así
// que no requiere que el bot esté desplegado en el servidor — sirve tanto para
// probar antes del deploy como para backfillear después. Idempotente (mismo
// upsert por identifier que usa el bot): correrlo varias veces no duplica nada.
//
// Uso:
//   MEDPLUM_CLIENT_ID=xxx MEDPLUM_CLIENT_SECRET=xxx npm run backfill-intake-response -- --response=<id>
//   MEDPLUM_CLIENT_ID=xxx MEDPLUM_CLIENT_SECRET=xxx npm run backfill-intake-response            (todas las de intake-clinico)
import { MedplumClient } from '@medplum/core';
import type { QuestionnaireResponse, Resource } from '@medplum/fhirtypes';
import { handler } from '../bots/ckm/intake-response';
import { INTAKE_QUESTIONNAIRE_URL } from '../ckm/constants';

function summarize(created: Resource[]): string {
  const byType = created.reduce<Record<string, number>>((acc, r) => {
    acc[r.resourceType] = (acc[r.resourceType] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(byType)
    .map(([type, n]) => `${n} ${type}`)
    .join(', ');
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

  const responseIdArg = process.argv.find((a) => a.startsWith('--response='))?.split('=')[1];

  const responses: QuestionnaireResponse[] = responseIdArg
    ? [await medplum.readResource('QuestionnaireResponse', responseIdArg)]
    : await medplum.searchResources('QuestionnaireResponse', {
        questionnaire: INTAKE_QUESTIONNAIRE_URL,
        _count: '200',
      });

  console.log(`Encontrada(s) ${responses.length} respuesta(s) a procesar.`);

  for (const response of responses) {
    const patientRef = response.subject?.display ?? response.subject?.reference ?? '(sin paciente)';
    if (response.questionnaire !== INTAKE_QUESTIONNAIRE_URL) {
      console.log(`- ${response.id} (${patientRef}): saltada, questionnaire no es intake-clinico`);
      continue;
    }
    try {
      const created = await handler(medplum, {
        bot: { reference: 'Bot/backfill-intake-response' },
        contentType: 'application/fhir+json',
        input: response,
        secrets: {},
      });
      if (!created) {
        console.log(`- ${response.id} (${patientRef}): saltada, sin Patient/ válido en subject`);
        continue;
      }
      console.log(`- ${response.id} (${patientRef}): ${created.length ? summarize(created) : 'sin datos para estructurar'}`);
    } catch (err) {
      console.error(`- ${response.id} (${patientRef}): ERROR`, err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
