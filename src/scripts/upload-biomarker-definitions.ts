// Sube el panel de biomarcadores (ObservationDefinitions) a Medplum,
// como fuente de verdad FHIR de rangos, interpretaciones y paneles. El bundle es
// idempotente (PUT por id), así que correrlo varias veces actualiza sin duplicar.
//
// Uso:
//   MEDPLUM_CLIENT_ID=xxx MEDPLUM_CLIENT_SECRET=xxx npm run upload-biomarker-defs
import { MedplumClient } from '@medplum/core';
import type { Bundle, OperationOutcome } from '@medplum/fhirtypes';
import biomarkerBundle from '../../data/ckm/biomarker-definitions.json';

function firstDiagnostic(outcome: OperationOutcome | undefined): string {
  return outcome?.issue?.[0]?.diagnostics ?? outcome?.issue?.[0]?.details?.text ?? '';
}

async function main(): Promise<void> {
  const baseUrl = process.env.MEDPLUM_BASE_URL ?? 'https://api.medplum.com.ar';
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Faltan MEDPLUM_CLIENT_ID y MEDPLUM_CLIENT_SECRET');
  }

  const bundle = biomarkerBundle as unknown as Bundle;
  const total = bundle.entry?.length ?? 0;

  const medplum = new MedplumClient({ baseUrl, fetch });
  await medplum.startClientLogin(clientId, clientSecret);
  console.log(`Subiendo ${total} ObservationDefinitions a ${baseUrl} (proyecto ${medplum.getProject()?.id})...`);

  const result = await medplum.executeBatch(bundle);
  const entries = result.entry ?? [];
  const ok = entries.filter((e) => e.response?.status?.startsWith('2'));
  const failed = entries.filter((e) => !e.response?.status?.startsWith('2'));

  console.log(`OK: ${ok.length}/${entries.length} ObservationDefinitions creadas/actualizadas.`);
  if (failed.length > 0) {
    console.log(`\n✗ ${failed.length} fallaron:`);
    failed.slice(0, 10).forEach((e) => console.log(`  ${e.response?.status}  ${firstDiagnostic(e.response?.outcome)}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n✗ Error:', err.message ?? err);
  process.exit(1);
});
