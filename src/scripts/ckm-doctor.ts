// Diagnóstico del panel CKM: verifica con las credenciales del ClientApplication
// que los datos existan y que las queries exactas del panel funcionen en el
// servidor. Distingue entre: faltan datos / falla la query / falta permiso del
// usuario web.
//
// Uso:
//   MEDPLUM_CLIENT_ID=xxx MEDPLUM_CLIENT_SECRET=xxx npm run ckm-doctor
import { MedplumClient } from '@medplum/core';

async function main(): Promise<void> {
  const baseUrl = process.env.MEDPLUM_BASE_URL ?? 'https://api.medplum.com.ar';
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Faltan MEDPLUM_CLIENT_ID y MEDPLUM_CLIENT_SECRET');
  }

  const medplum = new MedplumClient({ baseUrl, fetch });
  await medplum.startClientLogin(clientId, clientSecret);
  console.log(`Conectado a ${baseUrl} como ClientApplication\n`);

  // 1. Datos crudos, sin filtros
  const patients = await medplum.searchResources('Patient', { _count: '50', _sort: '-_lastUpdated' });
  console.log(`1. Pacientes: ${patients.length}`);

  const allRisks = await medplum.searchResources('RiskAssessment', { _count: '100' });
  console.log(`2. RiskAssessments en el proyecto: ${allRisks.length}`);
  for (const r of allRisks.slice(0, 10)) {
    console.log(`   - ${r.subject?.reference} (${r.meta?.lastUpdated})`);
  }

  const allAlerts = await medplum.searchResources('Communication', { category: 'alert', _count: '100' });
  console.log(`3. Communications categoría alert: ${allAlerts.length}`);
  for (const a of allAlerts.slice(0, 10)) {
    console.log(`   - ${a.subject?.reference} status=${a.status}`);
  }

  // 2. Las queries EXACTAS que hace el panel /ckm (subject con lista por comas)
  const subjects = patients.map((p) => `Patient/${p.id}`).join(',');
  const panelRisks = await medplum.searchResources('RiskAssessment', {
    subject: subjects,
    _sort: '-_lastUpdated',
    _count: '500',
  });
  const panelAlerts = await medplum.searchResources('Communication', {
    subject: subjects,
    category: 'alert',
    _count: '500',
  });
  console.log(`4. Query del panel — RiskAssessment con subject=<lista>: ${panelRisks.length}`);
  console.log(`5. Query del panel — Communication alert con subject=<lista>: ${panelAlerts.length}\n`);

  // Conclusión
  if (allRisks.length === 0) {
    console.log(
      '=> NO hay RiskAssessments en el proyecto: re-correr npm run seed-ckm-demo (con --all si querés todos).'
    );
  } else if (panelRisks.length === 0 || (allAlerts.length > 0 && panelAlerts.length === 0)) {
    console.log('=> Los datos EXISTEN pero la búsqueda con subject=<lista separada por comas> devuelve vacío:');
    console.log(
      '   el servidor no está resolviendo el OR de referencias. Reportar este resultado para ajustar la query del panel.'
    );
  } else {
    console.log('=> Los datos existen y las queries del panel funcionan con este client.');
    console.log('   El problema está en el usuario web: (a) su ProjectMembership no tiene asignada la AccessPolicy');
    console.log('   "Clinician Full Access v1.2" (la v1.1 NO incluye RiskAssessment), o (b) el frontend desplegado');
    console.log('   es un build viejo. Asignar la v1.2, redesplegar y recargar con Ctrl+Shift+R.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
