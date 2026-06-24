import type { Bundle, Observation, ObservationDefinition } from '@medplum/fhirtypes';
import bundleJson from '../../data/ckm/biomarker-definitions.json';
import {
  classifyBiomarkerValue,
  getBiomarkerDefinitions,
  groupByPanel,
  indexByBiomarcador,
  indexByLoinc,
  latestValueByCode,
  parseObservationDefinition,
  rangeForGender,
  valuesByCodeHistory,
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

describe('classifyBiomarkerValue', () => {
  test('cota superior (glucosa: óptimo 75–85, convencional 70–100)', () => {
    const glu = byId.get('glucosa-en-ayunas')!;
    expect(classifyBiomarkerValue(glu, 80).status).toBe('optimal');
    expect(classifyBiomarkerValue(glu, 92).status).toBe('normal');
    expect(classifyBiomarkerValue(glu, 120).status).toBe('high');
    expect(classifyBiomarkerValue(glu, 65).status).toBe('low');
  });

  test('cota inferior por género (HDL: óptimo ≥60, convencional ≥40 H)', () => {
    const hdl = byId.get('hdl-colesterol')!;
    expect(classifyBiomarkerValue(hdl, 70, 'male').status).toBe('optimal');
    expect(classifyBiomarkerValue(hdl, 45, 'male').status).toBe('normal');
    expect(classifyBiomarkerValue(hdl, 35, 'male').status).toBe('low');
  });

  test('doble cola con rango por género (ácido úrico)', () => {
    const au = byId.get('acido-urico')!;
    expect(classifyBiomarkerValue(au, 4, 'male').status).toBe('optimal'); // óptimo 3.5–5.5
    expect(classifyBiomarkerValue(au, 6.8, 'male').status).toBe('normal'); // convencional H ≤7.2
    expect(classifyBiomarkerValue(au, 8, 'male').status).toBe('high');
    expect(classifyBiomarkerValue(au, 6.5, 'female').status).toBe('high'); // convencional M ≤6
  });

  test('valor ausente -> unknown con etiqueta —', () => {
    const glu = byId.get('glucosa-en-ayunas')!;
    expect(classifyBiomarkerValue(glu, undefined)).toMatchObject({ status: 'unknown', label: '—' });
  });
});

function obs(code: string, value: number | undefined, date: string, status: Observation['status'] = 'final'): Observation {
  return {
    resourceType: 'Observation',
    status,
    code: { coding: [{ system: 'http://loinc.org', code }] },
    effectiveDateTime: date,
    ...(value !== undefined ? { valueQuantity: { value, unit: 'mg/dL' } } : {}),
  };
}

describe('latestValueByCode', () => {
  test('toma el último valor por código, ignora entered-in-error y sin valor', () => {
    const map = latestValueByCode([
      obs('1558-6', 90, '2026-01-01'),
      obs('1558-6', 84, '2026-06-01'), // más nuevo gana
      obs('2085-9', 200, '2026-06-10', 'entered-in-error'),
      obs('2085-9', undefined, '2026-06-09'),
      obs('2085-9', 58, '2026-06-08'),
    ]);
    expect(map.get('1558-6')?.value).toBe(84);
    expect(map.get('2085-9')?.value).toBe(58);
  });
});

describe('valuesByCodeHistory', () => {
  test('historial por código, de más viejo a más nuevo, sin entered-in-error', () => {
    const map = valuesByCodeHistory([
      obs('1558-6', 84, '2026-06-01'),
      obs('1558-6', 90, '2026-01-01'),
      obs('1558-6', 88, '2026-03-01'),
      obs('2085-9', 200, '2026-06-10', 'entered-in-error'),
      obs('2085-9', undefined, '2026-06-09'),
    ]);
    expect(map.get('1558-6')?.map((v) => v.value)).toStrictEqual([90, 88, 84]);
    expect(map.has('2085-9')).toBe(false);
  });
});

describe('groupByPanel', () => {
  test('agrupa por panel con el orden CV primero', () => {
    const groups = groupByPanel(defs);
    expect(groups.slice(0, 3).map((g) => g.panelCode)).toStrictEqual(['metabolico', 'lipidico', 'inflamacion']);
    expect(groups.every((g) => g.panelDisplay && g.defs.length > 0)).toBe(true);
    expect(groups.reduce((n, g) => n + g.defs.length, 0)).toBe(50);
  });
});
