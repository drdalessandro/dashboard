import { categorizeRisk, RISK_BANDS } from './risk';
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
