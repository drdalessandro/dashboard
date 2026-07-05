import type { Observation } from '@medplum/fhirtypes';
import { CKM_SCORES_SYSTEM } from './constants';
import {
  buildScoreObservation,
  detectScoreRise,
  scorePointsFromObservations,
  shouldPersistScorePoint,
} from './score-history';

describe('shouldPersistScorePoint', () => {
  const now = '2026-07-04T12:00:00Z';

  test('sin punto previo, siempre persiste (línea de base)', () => {
    expect(shouldPersistScorePoint(undefined, 2.1, now)).toBe(true);
  });

  test('valor distinto al previo, persiste', () => {
    expect(shouldPersistScorePoint({ value: 2.1, date: '2026-07-04T11:00:00Z' }, 2.3, now)).toBe(true);
  });

  test('mismo valor hace menos de 24 h, no persiste (anti-inflado)', () => {
    expect(shouldPersistScorePoint({ value: 2.1, date: '2026-07-04T11:00:00Z' }, 2.1, now)).toBe(false);
  });

  test('mismo valor pero el punto previo tiene 24 h o más, persiste', () => {
    expect(shouldPersistScorePoint({ value: 2.1, date: '2026-07-03T12:00:00Z' }, 2.1, now)).toBe(true);
  });
});

describe('buildScoreObservation', () => {
  test('arma la Observation con código, sujeto, fecha y valor en %', () => {
    const obs = buildScoreObservation('p1', 'ascvd10y', 2.1, '2026-07-04T12:00:00Z');
    expect(obs.resourceType).toBe('Observation');
    expect(obs.status).toBe('final');
    expect(obs.code?.coding?.[0]).toMatchObject({ system: CKM_SCORES_SYSTEM, code: 'prevent-ascvd-10y' });
    expect(obs.subject?.reference).toBe('Patient/p1');
    expect(obs.effectiveDateTime).toBe('2026-07-04T12:00:00Z');
    expect(obs.valueQuantity).toEqual({ value: 2.1, unit: '%' });
    expect(obs.derivedFrom).toBeUndefined();
  });

  test('incluye derivedFrom si se pasa (trazabilidad al disparador)', () => {
    const obs = buildScoreObservation('p1', 'hf10y', 1.2, '2026-07-04T12:00:00Z', {
      derivedFrom: [{ reference: 'Observation/o1' }],
    });
    expect(obs.derivedFrom).toEqual([{ reference: 'Observation/o1' }]);
  });
});

describe('detectScoreRise', () => {
  const prev = (value: number): { value: number; date: string } => ({ value, date: '2026-06-01T00:00:00Z' });

  test('sin punto previo no alerta (no hay línea de base)', () => {
    expect(detectScoreRise('ascvd10y', undefined, 10)).toBeUndefined();
  });

  test('baja o sin cambio no alerta', () => {
    expect(detectScoreRise('ascvd10y', prev(5), 4)).toBeUndefined();
    expect(detectScoreRise('ascvd10y', prev(5), 5)).toBeUndefined();
  });

  test('suba absoluta >= 2 pp alerta aunque no cambie la categoría', () => {
    const alert = detectScoreRise('ascvd10y', prev(8), 10.5);
    expect(alert).toBeDefined();
    expect(alert?.ruleId).toBe('score-rise-prevent-ascvd-10y');
    expect(alert?.message).toContain('subió de 8% a 10.5% (+2.5 pp)');
  });

  test('cruce de categoría con suba trivial (< 0.5 pp) no alerta', () => {
    // 4.9 -> 5.1 cruza bajo -> limítrofe pero es ruido
    expect(detectScoreRise('ascvd10y', prev(4.9), 5.1)).toBeUndefined();
  });

  test('cruce de categoría con suba >= 0.5 pp alerta aunque no llegue a 2 pp', () => {
    const alert = detectScoreRise('ascvd10y', prev(6.9), 7.9);
    expect(alert).toBeDefined();
    expect(alert?.message).toContain('categoría');
  });

  test('suba < 2 pp sin cambio de categoría no alerta', () => {
    expect(detectScoreRise('ascvd10y', prev(8), 9)).toBeUndefined();
  });

  test('outcomes provisionales lo aclaran en el mensaje', () => {
    const alert = detectScoreRise('hf10y', prev(3), 6);
    expect(alert?.message).toContain('provisionales');
  });
});

describe('scorePointsFromObservations', () => {
  const scoreObs = (code: string, value: number, date: string): Observation => ({
    resourceType: 'Observation',
    status: 'final',
    code: { coding: [{ system: CKM_SCORES_SYSTEM, code }] },
    subject: { reference: 'Patient/p1' },
    effectiveDateTime: date,
    valueQuantity: { value, unit: '%' },
  });

  test('agrupa por outcome y ordena de más vieja a más nueva', () => {
    const series = scorePointsFromObservations([
      scoreObs('prevent-ascvd-10y', 2.3, '2026-06-01T00:00:00Z'),
      scoreObs('prevent-ascvd-10y', 2.1, '2026-01-01T00:00:00Z'),
      scoreObs('prevent-hf-10y', 1.2, '2026-03-01T00:00:00Z'),
    ]);
    expect(series.ascvd10y?.map((p) => p.value)).toEqual([2.1, 2.3]);
    expect(series.hf10y).toHaveLength(1);
    expect(series.cvdTotal30y).toBeUndefined();
  });

  test('ignora entered-in-error, códigos ajenos y recursos incompletos', () => {
    const bad1 = { ...scoreObs('prevent-ascvd-10y', 2.1, '2026-01-01T00:00:00Z'), status: 'entered-in-error' as const };
    const bad2 = scoreObs('otro-codigo', 2.1, '2026-01-01T00:00:00Z');
    const bad3 = { ...scoreObs('prevent-ascvd-10y', 2.1, '2026-01-01T00:00:00Z'), effectiveDateTime: undefined };
    const bad4 = { ...scoreObs('prevent-ascvd-10y', 2.1, '2026-01-01T00:00:00Z'), valueQuantity: undefined };
    expect(scorePointsFromObservations([bad1, bad2, bad3, bad4])).toEqual({});
  });
});
