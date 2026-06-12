// Sube (upsert por nombre) el AccessPolicy de pacientes al servidor Medplum.
//
// La política vive versionada en data/ckm/patient-access-policy.json.
// Después de subirla, asignarla como Project.defaultPatientAccessPolicy para
// que el registro de pacientes desde Control la aplique automáticamente.
//
// Uso:
//   MEDPLUM_CLIENT_ID=xxx MEDPLUM_CLIENT_SECRET=xxx npm run upload-access-policy
import { MedplumClient } from '@medplum/core';
import type { AccessPolicy } from '@medplum/fhirtypes';
import fs from 'fs';

const POLICY_FILE = 'data/ckm/patient-access-policy.json';

async function main(): Promise<void> {
  const baseUrl = process.env.MEDPLUM_BASE_URL ?? 'https://api.medplum.com.ar';
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'Faltan MEDPLUM_CLIENT_ID y MEDPLUM_CLIENT_SECRET (ClientApplication del proyecto en ' + baseUrl + ')'
    );
  }

  const policy = JSON.parse(fs.readFileSync(POLICY_FILE, 'utf8')) as AccessPolicy;
  if (!policy.name) {
    throw new Error(`${POLICY_FILE} no tiene name; se necesita para el upsert`);
  }

  const medplum = new MedplumClient({ baseUrl, fetch });
  await medplum.startClientLogin(clientId, clientSecret);

  const result = await medplum.upsertResource(policy, `name=${encodeURIComponent(policy.name)}`);
  console.log(`OK: AccessPolicy/${result.id} ("${policy.name}")`);
  console.log(
    'Recordá asignarla: app de admin → Project → defaultPatientAccessPolicy, ' +
      'o en la ProjectMembership de cada paciente existente.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
