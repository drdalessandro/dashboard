// Despliega los bots del bundle al servidor Medplum de forma headless, sin
// depender de la página /upload/bots (que requiere que el usuario web sea
// admin y que su AccessPolicy permita Bot). Replica la lógica de
// UploadDataPage.uploadExampleBots usando las credenciales del
// ClientApplication.
//
// Requiere un ClientApplication con rol de admin de proyecto (para crear y
// desplegar Bots). Idempotente: actualiza y re-deploya los bots existentes.
//
// Uso:
//   npm run build:bots   (genera data/core/example-bots.json)
//   MEDPLUM_CLIENT_ID=xxx MEDPLUM_CLIENT_SECRET=xxx npm run deploy-bots-server
import { MedplumClient } from '@medplum/core';
import type { Bot, Bundle, BundleEntry } from '@medplum/fhirtypes';
import fs from 'fs';

const BUNDLE_FILE = 'data/core/example-bots.json';

async function main(): Promise<void> {
  const baseUrl = process.env.MEDPLUM_BASE_URL ?? 'https://api.medplum.com.ar';
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Faltan MEDPLUM_CLIENT_ID y MEDPLUM_CLIENT_SECRET');
  }
  if (!fs.existsSync(BUNDLE_FILE)) {
    throw new Error(`No existe ${BUNDLE_FILE}. Corré primero: npm run build:bots`);
  }

  const medplum = new MedplumClient({ baseUrl, fetch });
  await medplum.startClientLogin(clientId, clientSecret);
  const projectId = medplum.getProject()?.id;
  if (!projectId) {
    throw new Error('No se pudo determinar el proyecto del ClientApplication.');
  }
  console.log(`Proyecto ${projectId} en ${baseUrl}`);

  const bundle = JSON.parse(fs.readFileSync(BUNDLE_FILE, 'utf8')) as Bundle;
  let transactionString = fs.readFileSync(BUNDLE_FILE, 'utf8');
  const botEntries: BundleEntry[] = (bundle.entry ?? []).filter((e) => e.resource?.resourceType === 'Bot');
  const botIds: Record<string, string> = {};

  // 1. Crear los Bots que falten y resolver los placeholders del bundle
  for (const entry of botEntries) {
    const botName = (entry.resource as Bot).name as string;
    const found = await medplum.searchOne('Bot', { name: botName });
    let bot: Bot;
    if (!found) {
      const url = new URL(`admin/projects/${projectId}/bot`, medplum.getBaseUrl());
      bot = (await medplum.post(url, { name: botName })) as Bot;
      console.log(`  + Bot creado: ${botName} (${bot.id})`);
    } else {
      bot = found;
      console.log(`  · Bot existente: ${botName} (${bot.id})`);
    }
    const botId = bot.id as string;
    botIds[botName] = botId;
    transactionString = transactionString
      .replaceAll(`$bot-${botName}-reference`, `Bot/${botId}`)
      .replaceAll(`$bot-${botName}-id`, botId);
  }

  // 2. Resolver placeholders de cuestionarios (para los bots de encuentro)
  const questionnaires = await medplum.searchResources('Questionnaire', { _count: '100' });
  for (const q of questionnaires) {
    if (q.name && q.id) {
      transactionString = transactionString.replaceAll(`$${q.name}`, `Questionnaire/${q.id}`);
    }
  }

  // 3. Ejecutar la transacción (Binarys + Bots + Subscriptions)
  await medplum.executeBatch(JSON.parse(transactionString) as Bundle);
  console.log('  Transacción ejecutada (código fuente + suscripciones).');

  // 4. Desplegar el código ejecutable de cada bot a Lambda
  for (const entry of botEntries) {
    const botName = (entry.resource as Bot).name as string;
    const distUrl = (entry.resource as Bot).executableCode?.url;
    const distEntry = (bundle.entry ?? []).find((e) => e.fullUrl === distUrl);
    const data = (distEntry?.resource as { data?: string })?.data;
    if (!data) {
      console.log(`  ! ${botName}: sin código ejecutable en el bundle, salteado`);
      continue;
    }
    const code = Buffer.from(data, 'base64').toString('utf8');
    await medplum.post(medplum.fhirUrl('Bot', botIds[botName], '$deploy'), { code });
    console.log(`  ✓ ${botName} desplegado`);
  }

  console.log('\nListo. Verificá con: npm run verify-prevent');
}

main().catch((err) => {
  console.error('\n✗ Error:', err.message ?? err);
  if (String(err).includes('Forbidden')) {
    console.error(
      '  El ClientApplication necesita rol de admin de proyecto para crear/desplegar Bots.\n' +
        '  En app.medplum.com.ar: Project → Clients → (tu client) → marcar Admin, o asignarle\n' +
        '  una membership admin sin AccessPolicy restrictiva.'
    );
  }
  process.exit(1);
});
