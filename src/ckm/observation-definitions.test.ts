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
  splitByTier,
  valuesByCodeHistory,
} from './observation-definitions';

const bundle = bundleJson as unknown as Bundle;
const defs = (bundle.entry ?? [])
  .map((e) => e.resource as ObservationDefinition)
  .filter((r) => r?.resourceType === 'ObservationDefinition')
  .map(parseObservationDefinition);

const byId = indexByBiomarcador(defs);

describe('parseObservationDefinition — sobre el bundle real', () => {
  test('parsea las 54 definiciones del bundle', () => {
    expect(defs).toHaveLength(54);
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
    expect(glucosa.interpretation).toMatch(/glucemia|prediabetes/i);
    expect(glucosa.source).toBeTruthy();
  });

  test('tier: el núcleo cardiovascular está citado a la guía 2026 CKM', () => {
    const core = ['ldl-colesterol', 'apob', 'lpa', 'hdl-colesterol', 'trigliceridos', 'glucosa-en-ayunas', 'hba1c', 'creatinina', 'egfr-tfg-estimada', 'pcr-ultrasensible-hs-crp', 'uacr-albumina-creatinina', 'nt-probnp', 'troponina-hs', 'cistatina-c'];
    for (const id of core) {
      const def = byId.get(id)!;
      expect(def.tier).toBe('guia-cv');
      expect(def.source).toMatch(/2026 AHA\/ACC\/ADA\/ASN CKM|CIR\.0000000000001453/);
    }
    // Ningún biomarcador del núcleo conserva marco de medicina funcional
    for (const id of core) {
      const raw = `${byId.get(id)!.source ?? ''} ${byId.get(id)!.interpretation ?? ''}`;
      expect(raw).not.toMatch(/Attia|Bryan Johnson|Lapreire|Zone Diet|Medicina 3\.0/i);
    }
  });

  test('núcleo cardíaco: NT-proBNP y troponina hs en el panel cardiaco', () => {
    expect(byId.get('nt-probnp')!.panelCode).toBe('cardiaco');
    expect(byId.get('nt-probnp')!.conventional[0]?.high).toBe(125);
    expect(byId.get('troponina-hs')!.panelCode).toBe('cardiaco');
    expect(byId.get('cistatina-c')!.panelCode).toBe('renal-hepatico');
  });

  test('limpieza masiva: ningún complementario conserva óptimo funcional ni marcas', () => {
    const complementary = defs.filter((d) => d.tier !== 'guia-cv');
    expect(complementary).toHaveLength(40);
    for (const d of complementary) {
      const raw = `${d.source ?? ''} ${d.interpretation ?? ''} ${d.optimalText ?? ''}`;
      expect(raw).not.toMatch(/Attia|Bryan Johnson|Bryan|Lapreire|Zone Diet|Blueprint|Medicina 3\.0/i);
    }
    // Los complementarios con óptimo numérico ahora lo pierden (referencia)
    expect(byId.get('vitamina-d3-25-oh')!.optimal).toHaveLength(0);
    expect(byId.get('vitamina-d3-25-oh')!.optimalText).toMatch(/Sin objetivo de guía CV/);
  });

  test('UACR está en el núcleo, con umbral de albuminuria ≥30 mg/g', () => {
    const uacr = byId.get('uacr-albumina-creatinina')!;
    expect(uacr.tier).toBe('guia-cv');
    expect(uacr.panelCode).toBe('renal-hepatico');
    expect(uacr.conventional[0]?.high).toBe(30);
    expect(uacr.code).toBe('9318-7');
  });

  test('hs-CRP usa el umbral de la guía 2026 (≥2.0 mg/L)', () => {
    const crp = byId.get('pcr-ultrasensible-hs-crp')!;
    expect(crp.conventional[0]?.high).toBe(2);
  });

  test('tier: los biomarcadores de longevidad quedan como complementario', () => {
    expect(byId.get('edad-biologica-metilacion-adn')!.tier).toBe('complementario');
    expect(byId.get('nad-plus-intracelular')!.tier).toBe('complementario');
    expect(byId.get('insulina-en-ayunas')!.tier).toBe('complementario');
  });

  test('splitByTier: 11 en el núcleo, 40 complementario', () => {
    const { core, complementary } = splitByTier(defs);
    const count = (gs: { defs: unknown[] }[]): number => gs.reduce((n, g) => n + g.defs.length, 0);
    expect(count(core)).toBe(14);
    expect(count(complementary)).toBe(40);
    // El núcleo arranca por lípidos
    expect(core[0].panelCode).toBe('lipidico');
  });

  test('orden clínico dentro del panel: glucemia antes que HbA1c', () => {
    const metab = groupByPanel(defs).find((g) => g.panelCode === 'metabolico')!;
    const ids = metab.defs.map((d) => d.biomarcadorId);
    expect(ids.indexOf('glucosa-en-ayunas')).toBeLessThan(ids.indexOf('hba1c'));
    // Lípidos: LDL antes que HDL y que Lp(a)
    const lip = groupByPanel(defs).find((g) => g.panelCode === 'lipidico')!;
    const lids = lip.defs.map((d) => d.biomarcadorId);
    expect(lids.indexOf('ldl-colesterol')).toBeLessThan(lids.indexOf('hdl-colesterol'));
  });

  test('rangos por género: ácido úrico tiene convencional male/female (referencia, sin óptimo funcional)', () => {
    const au = byId.get('acido-urico')!;
    expect(au.conventional.find((r) => r.gender === 'male')).toMatchObject({ low: 3.5, high: 7 });
    expect(au.conventional.find((r) => r.gender === 'female')).toMatchObject({ low: 2.5, high: 6 });
    expect(rangeForGender(au.conventional, 'female')).toMatchObject({ high: 6 });
    // Sin óptimo funcional: la guía CKM no fija objetivo CV para el ácido úrico
    expect(au.optimal).toHaveLength(0);
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

  test('filtra por sistema en el cliente: descarta ODs ajenas / sin identifier de biomarcador', async () => {
    const propias = (bundle.entry ?? []).map((e) => e.resource as ObservationDefinition).slice(0, 3);
    const ajena: ObservationDefinition = {
      resourceType: 'ObservationDefinition',
      identifier: [{ system: 'https://otro-equipo.example/fhir/sid/marcador', value: 'x' }],
      code: { text: 'Marcador ajeno' },
    };
    const sinIdentifier: ObservationDefinition = { resourceType: 'ObservationDefinition', code: { text: 'Sin id' } };
    // El server devuelve un mix (la query no acota por identifier); el filtro de
    // cliente debe quedarse solo con las 3 ODs del sistema de biomarcador.
    const fakeMedplum = {
      searchResources: async () => [ajena, ...propias, sinIdentifier],
    } as unknown as Parameters<typeof getBiomarkerDefinitions>[0];
    const result = await getBiomarkerDefinitions(fakeMedplum);
    expect(result).toHaveLength(3);
    expect(result.every((d) => d.biomarcadorId)).toBe(true);
  });
});

describe('classifyBiomarkerValue', () => {
  test('glucosa ADA/LE8: <100 es ideal (óptimo), ≥100 prediabetes (alto)', () => {
    const glu = byId.get('glucosa-en-ayunas')!;
    expect(classifyBiomarkerValue(glu, 80).status).toBe('optimal');
    expect(classifyBiomarkerValue(glu, 92).status).toBe('optimal'); // <100 = ideal LE8
    expect(classifyBiomarkerValue(glu, 120).status).toBe('high'); // prediabetes
    expect(classifyBiomarkerValue(glu, 65).status).toBe('low');
  });

  test('insulina sin óptimo (referencia): <25 normal, ≥25 alto', () => {
    const ins = byId.get('insulina-en-ayunas')!;
    expect(ins.optimal).toHaveLength(0); // ADA/AHA no define objetivo
    expect(classifyBiomarkerValue(ins, 12).status).toBe('normal');
    expect(classifyBiomarkerValue(ins, 30).status).toBe('high');
  });

  test('cota inferior por género (HDL: óptimo ≥60, convencional ≥40 H)', () => {
    const hdl = byId.get('hdl-colesterol')!;
    expect(classifyBiomarkerValue(hdl, 70, 'male').status).toBe('optimal');
    expect(classifyBiomarkerValue(hdl, 45, 'male').status).toBe('normal');
    expect(classifyBiomarkerValue(hdl, 35, 'male').status).toBe('low');
  });

  test('doble cola con rango por género (ácido úrico, referencia sin óptimo)', () => {
    const au = byId.get('acido-urico')!;
    expect(classifyBiomarkerValue(au, 5, 'male').status).toBe('normal'); // conv H 3.5–7.0
    expect(classifyBiomarkerValue(au, 6.8, 'male').status).toBe('normal');
    expect(classifyBiomarkerValue(au, 8, 'male').status).toBe('high'); // hiperuricemia
    expect(classifyBiomarkerValue(au, 3, 'male').status).toBe('low');
    expect(classifyBiomarkerValue(au, 6.5, 'female').status).toBe('high'); // conv M ≤6
  });

  test('valor ausente -> unknown con etiqueta —', () => {
    const glu = byId.get('glucosa-en-ayunas')!;
    expect(classifyBiomarkerValue(glu, undefined)).toMatchObject({ status: 'unknown', label: '—' });
  });
});

describe('classifyBiomarkerValue — óptimo de una cola vs óptimo que excede el convencional', () => {
  // Definiciones sintéticas: la lógica se prueba directamente, sin depender de
  // un marcador del bundle (los complementarios ya no tienen óptimo funcional).
  const def = (conventional: { low?: number; high?: number }[], optimal: { low?: number; high?: number }[]) =>
    ({ label: 'X', conventional, optimal }) as unknown as Parameters<typeof classifyBiomarkerValue>[0];

  test('óptimo de una sola cola (≥14) NO tapa el tope convencional (18 -> Alto)', () => {
    const d = def([{ low: 12, high: 17.5 }], [{ low: 14 }]); // óptimo sin tope superior
    expect(classifyBiomarkerValue(d, 18).status).toBe('high'); // supera el convencional; el óptimo no lo acota
    expect(classifyBiomarkerValue(d, 14.5).status).toBe('optimal');
    expect(classifyBiomarkerValue(d, 13).status).toBe('normal');
  });

  test('óptimo que excede el tope convencional: el valor on-target es Óptimo, no Alto', () => {
    const d = def([{ low: 2.3, high: 4.2 }], [{ low: 3.5, high: 4.5 }]);
    expect(classifyBiomarkerValue(d, 4.4).status).toBe('optimal'); // >conv high pero dentro del óptimo acotado
    expect(classifyBiomarkerValue(d, 4.6).status).toBe('high'); // fuera del óptimo acotado
  });
});

describe('parseObservationDefinition — fallbacks y OD incompleta', () => {
  test('label cae a coding.display y luego a coding.code', () => {
    const withDisplay = parseObservationDefinition({
      resourceType: 'ObservationDefinition',
      code: { coding: [{ code: 'C1', display: 'Disp' }] },
    } as ObservationDefinition);
    expect(withDisplay.label).toBe('Disp');

    const onlyCode = parseObservationDefinition({
      resourceType: 'ObservationDefinition',
      code: { coding: [{ code: 'C2' }] },
    } as ObservationDefinition);
    expect(onlyCode.label).toBe('C2');
  });

  test('OD vacía: label "(sin nombre)", rangos vacíos, sin throw', () => {
    const def = parseObservationDefinition({ resourceType: 'ObservationDefinition' } as unknown as ObservationDefinition);
    expect(def).toMatchObject({
      label: '(sin nombre)',
      conventional: [],
      optimal: [],
      code: undefined,
      panelCode: undefined,
    });
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
  test('agrupa por panel con lípidos y metabolismo primero', () => {
    const groups = groupByPanel(defs);
    expect(groups.slice(0, 3).map((g) => g.panelCode)).toStrictEqual(['lipidico', 'metabolico', 'renal-hepatico']);
    expect(groups.every((g) => g.panelDisplay && g.defs.length > 0)).toBe(true);
    expect(groups.reduce((n, g) => n + g.defs.length, 0)).toBe(54);
  });
});
