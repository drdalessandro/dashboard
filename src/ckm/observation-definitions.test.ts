import type { Bundle, ObservationDefinition } from '@medplum/fhirtypes';
import bundleJson from '../../data/ckm/biomarker-definitions.json';
import {
  getBiomarkerDefinitions,
  indexByBiomarcador,
  indexByLoinc,
  parseObservationDefinition,
  rangeForGender,
} from './observation-definitions';

const bundle = bundleJson as unknown as Bundle;
const defs = (bundle.entry ?? [])
  .map((e) => e.resource as ObservationDefinition)
  .filter((r) => r?.resourceType === 'ObservationDefinition')
  .map(parseObservationDefinition);

const byId = indexByBiomarcador(defs);

describe('parseObservationDefinition — sobre el bundle real', () => {
  test('parsea las 50 definiciones del bundle', () => {
    expect(defs).toHaveLength(50);
  });

  test('ApoB: LOINC, panel lipídico, rangos óptimo/convencional', () => {
    const apob = byId.get('apob')!;
    expect(apob).toMatchObject({ label: 'ApoB', code: '1884-6', system: 'http://loinc.org', panelCode: 'lipidico' });
    expect(apob.optimal[0]?.high).toBe(90);
    expect(apob.conventional[0]?.high).toBe(130);
  });

  test('Lp(a): rangos 50 (óptimo) / 75 (convencional) nmol/L', () => {
    const lpa = byId.get('lpa')!;
    expect(lpa.optimal[0]?.high).toBe(50);
    expect(lpa.conventional[0]?.high).toBe(75);
    expect(lpa.unit).toBeDefined();
  });

  test('captura interpretación y fuente de las extensiones', () => {
    const glucosa = byId.get('glucosa-en-ayunas')!;
    expect(glucosa.interpretation).toMatch(/insulín/i);
    expect(glucosa.source).toBeTruthy();
  });

  test('rangos por género: ácido úrico tiene convencional male/female y óptimo sin género', () => {
    const au = byId.get('acido-urico')!;
    expect(au.conventional.find((r) => r.gender === 'male')).toMatchObject({ low: 3.5, high: 7.2 });
    expect(au.conventional.find((r) => r.gender === 'female')).toMatchObject({ low: 2.5, high: 6 });
    expect(rangeForGender(au.conventional, 'female')).toMatchObject({ high: 6 });
    // óptimo no tiene género -> rangeForGender cae al no-especificado
    expect(rangeForGender(au.optimal, 'male')).toMatchObject({ low: 3.5, high: 5.5 });
  });

  test('todas las definiciones tienen panel y label', () => {
    for (const def of defs) {
      expect(def.label).toBeTruthy();
      expect(def.panelCode).toBeTruthy();
    }
  });
});

describe('rangeForGender', () => {
  test('lista vacía -> undefined', () => {
    expect(rangeForGender([])).toBeUndefined();
  });
  test('sin match de género cae al no-especificado', () => {
    expect(rangeForGender([{ high: 10 }, { high: 5, gender: 'male' }], 'female')).toMatchObject({ high: 10 });
  });
  test('sin no-especificado ni match cae al primero', () => {
    expect(rangeForGender([{ high: 7, gender: 'male' }], 'female')).toMatchObject({ high: 7 });
  });
});

describe('índices', () => {
  test('indexByLoinc solo incluye códigos LOINC', () => {
    const byLoinc = indexByLoinc(defs);
    expect(byLoinc.get('1884-6')?.label).toBe('ApoB');
    // HOMA-IR usa código local, no debe estar indexado por LOINC
    expect([...byLoinc.values()].some((d) => d.label === 'HOMA-IR')).toBe(false);
  });

  test('indexByBiomarcador cubre todos los slugs presentes', () => {
    expect(byId.size).toBe(defs.filter((d) => d.biomarcadorId).length);
    expect(byId.has('homa-ir')).toBe(true);
  });
});

describe('getBiomarkerDefinitions', () => {
  test('mapea las ObservationDefinitions del cliente', async () => {
    const fakeMedplum = {
      searchResources: async () =>
        (bundle.entry ?? []).map((e) => e.resource as ObservationDefinition).slice(0, 3),
    } as unknown as Parameters<typeof getBiomarkerDefinitions>[0];
    const result = await getBiomarkerDefinitions(fakeMedplum);
    expect(result).toHaveLength(3);
    expect(result[0].label).toBeTruthy();
  });
});
