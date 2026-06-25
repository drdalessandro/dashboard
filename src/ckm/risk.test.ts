import { categorizeRisk, categorizeRiskWithCac, RISK_BANDS } from './risk';
import type { PreventOutcome } from './risk';

describe('categorizeRisk — ASCVD 10a (tramos de guía ACC/AHA)', () => {
  test.each([
    [0, 'low'],
    [4.9, 'low'],
    [5, 'borderline'],
    [7.4, 'borderline'],
    [7.5, 'intermediate'],
    [19.9, 'intermediate'],
    [20, 'high'],
    [55, 'high'],
  ])('ASCVD %d%% -> %s', (value, level) => {
    expect(categorizeRisk('ascvd10y', value)?.level).toBe(level);
  });

  test('el vector de referencia (ASCVD 9.2%) cae en intermedio', () => {
    expect(categorizeRisk('ascvd10y', 9.2)?.level).toBe('intermediate');
  });
});

describe('categorizeRisk — IC 10a (provisional)', () => {
  test.each([
    [4.9, 'low'],
    [5, 'borderline'],
    [9.9, 'borderline'],
    [10, 'intermediate'],
    [19.9, 'intermediate'],
    [20, 'high'],
  ])('IC %d%% -> %s', (value, level) => {
    expect(categorizeRisk('hf10y', value)?.level).toBe(level);
  });
});

describe('categorizeRisk — ECV total 30a (provisional)', () => {
  test.each([
    [9.9, 'low'],
    [10, 'borderline'],
    [19.9, 'borderline'],
    [20, 'intermediate'],
    [39.9, 'intermediate'],
    [40, 'high'],
  ])('ECV30 %d%% -> %s', (value, level) => {
    expect(categorizeRisk('cvdTotal30y', value)?.level).toBe(level);
  });
});

describe('categorizeRisk — valores ausentes', () => {
  test('undefined devuelve undefined', () => {
    expect(categorizeRisk('ascvd10y', undefined)).toBeUndefined();
  });
  test('NaN/Infinity devuelven undefined', () => {
    expect(categorizeRisk('ascvd10y', NaN)).toBeUndefined();
    expect(categorizeRisk('ascvd10y', Infinity)).toBeUndefined();
  });
});

describe('RISK_BANDS — metadatos', () => {
  test('cada tramo expone label y color de Mantine', () => {
    const tier = categorizeRisk('ascvd10y', 25);
    expect(tier?.label).toBe('Alto');
    expect(tier?.color).toBe('red');
  });

  test('solo ASCVD 10a está respaldado por guía; el resto es provisional', () => {
    expect(RISK_BANDS.ascvd10y.guidelineBased).toBe(true);
    expect(RISK_BANDS.hf10y.guidelineBased).toBe(false);
    expect(RISK_BANDS.cvdTotal30y.guidelineBased).toBe(false);
  });

  test('los tramos de cada outcome están ordenados de menor a mayor riesgo', () => {
    for (const outcome of Object.keys(RISK_BANDS) as PreventOutcome[]) {
      const mins = RISK_BANDS[outcome].tiers.map((t) => t.min);
      expect(mins).toStrictEqual([...mins].sort((a, b) => a - b));
      expect(mins[0]).toBe(0);
    }
  });
});

describe('categorizeRiskWithCac — reclasificación de ASCVD por CAC', () => {
  // ASCVD 9.2% es 'intermediate' de base.
  test('CAC = 0 baja un nivel (intermedio -> limítrofe)', () => {
    const r = categorizeRiskWithCac('ascvd10y', 9.2, 0);
    expect(r).toMatchObject({ base: { level: 'intermediate' }, tier: { level: 'borderline' }, direction: 'down' });
  });

  test('CAC 1–99 no cambia la categoría', () => {
    const r = categorizeRiskWithCac('ascvd10y', 9.2, 50);
    expect(r).toMatchObject({ tier: { level: 'intermediate' }, direction: 'none' });
    expect(r?.cacNote).toMatch(/1–99/);
  });

  test('CAC 100–299 sube un nivel (intermedio -> alto)', () => {
    expect(categorizeRiskWithCac('ascvd10y', 9.2, 150)).toMatchObject({ tier: { level: 'high' }, direction: 'up' });
  });

  test('CAC ≥ 300 lleva a Alto desde cualquier base (bajo -> alto)', () => {
    expect(categorizeRiskWithCac('ascvd10y', 3, 400)).toMatchObject({
      base: { level: 'low' },
      tier: { level: 'high' },
      direction: 'up',
    });
  });

  test('CAC = 0 en base "bajo" no baja más (clamp, sin cambio)', () => {
    expect(categorizeRiskWithCac('ascvd10y', 3, 0)).toMatchObject({ tier: { level: 'low' }, direction: 'none' });
  });

  test('CAC alto en base "alto" no sube más (clamp, sin cambio)', () => {
    expect(categorizeRiskWithCac('ascvd10y', 25, 150)).toMatchObject({ tier: { level: 'high' }, direction: 'none' });
  });

  test('el CAC NO reclasifica IC ni ECV (solo ASCVD)', () => {
    expect(categorizeRiskWithCac('hf10y', 8.1, 400)).toMatchObject({ tier: { level: 'borderline' }, direction: 'none' });
    expect(categorizeRiskWithCac('cvdTotal30y', 15, 400)).toMatchObject({
      tier: { level: 'borderline' },
      direction: 'none',
    });
  });

  test('sin CAC devuelve la categoría base sin nota', () => {
    const r = categorizeRiskWithCac('ascvd10y', 9.2);
    expect(r).toMatchObject({ tier: { level: 'intermediate' }, direction: 'none' });
    expect(r?.cacNote).toBeUndefined();
  });

  test('CAC no finito se ignora', () => {
    expect(categorizeRiskWithCac('ascvd10y', 9.2, NaN)).toMatchObject({ direction: 'none' });
  });

  test('sin valor de score devuelve undefined aunque haya CAC', () => {
    expect(categorizeRiskWithCac('ascvd10y', undefined, 0)).toBeUndefined();
  });

  test('borde CAC = 100 sube (intermedio -> alto); 99 no cambia', () => {
    expect(categorizeRiskWithCac('ascvd10y', 9.2, 100)).toMatchObject({ tier: { level: 'high' }, direction: 'up' });
    expect(categorizeRiskWithCac('ascvd10y', 9.2, 99)).toMatchObject({ tier: { level: 'intermediate' }, direction: 'none' });
  });

  test('borde CAC = 300 lleva a Alto; 299 sube un nivel', () => {
    expect(categorizeRiskWithCac('ascvd10y', 3, 300)).toMatchObject({ tier: { level: 'high' }, direction: 'up' });
    expect(categorizeRiskWithCac('ascvd10y', 3, 299)).toMatchObject({ tier: { level: 'borderline' }, direction: 'up' });
  });

  test('CAC negativo (Agatston inválido) se ignora, no des-escala', () => {
    expect(categorizeRiskWithCac('ascvd10y', 9.2, -5)).toMatchObject({ tier: { level: 'intermediate' }, direction: 'none' });
  });

  test('clamp: la nota no promete un cambio que no ocurrió (base ya en el piso)', () => {
    const r = categorizeRiskWithCac('ascvd10y', 3, 0); // base 'low', no puede bajar más
    expect(r?.direction).toBe('none');
    expect(r?.cacNote).toMatch(/sin cambio/);
  });
});
