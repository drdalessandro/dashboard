import { le8ClinicalTrend } from './le8-history';
import type { CKMObservationHistory } from './observations';

const FLAGS = { diabetes: false, onAntihypertensive: false };
const NOW = { nowIso: '2026-07-01T00:00:00Z' };

describe('le8ClinicalTrend', () => {
  test('IMC: un punto por lectura, con el sub-score LE8 de cada fecha', () => {
    // El historial llega de más nueva a más vieja (como groupCKMValues)
    const history: CKMObservationHistory = {
      bmi: [
        { value: 32, unit: 'kg/m²', date: '2026-06-01T10:00:00Z' },
        { value: 28.5, unit: 'kg/m²', date: '2026-03-01T10:00:00Z' },
        { value: 24, unit: 'kg/m²', date: '2026-01-01T10:00:00Z' },
      ],
    };
    const trend = le8ClinicalTrend(history, FLAGS, NOW);
    // AHA: <25 -> 100 · 25-29.9 -> 70 · 30-34.9 -> 30
    expect(trend.bmi?.map((p) => p.score)).toEqual([100, 70, 30]);
    expect(trend.bmi?.map((p) => p.date.slice(0, 10))).toEqual(['2026-01-01', '2026-03-01', '2026-06-01']);
  });

  test('presión: solo puntúa fechas donde se conocen sistólica y diastólica', () => {
    const history: CKMObservationHistory = {
      sbp: [
        { value: 145, date: '2026-06-01T10:00:00Z' },
        { value: 118, date: '2026-02-01T10:00:00Z' },
      ],
      dbp: [
        { value: 94, date: '2026-06-01T10:00:00Z' },
        { value: 76, date: '2026-02-01T10:00:00Z' },
      ],
    };
    const trend = le8ClinicalTrend(history, FLAGS, NOW);
    // 118/76 óptima -> 100 · 145/94 (140-159 / 90-99) -> 25
    expect(trend.bloodPressure?.map((p) => p.score)).toEqual([100, 25]);
  });

  test('lípidos: usa total−HDL como fallback y reconstruye "último conocido" por fecha', () => {
    const history: CKMObservationHistory = {
      cholesterolTotal: [{ value: 220, date: '2026-02-01T10:00:00Z' }],
      hdlc: [{ value: 50, date: '2026-02-01T10:00:00Z' }],
      // no-HDL directa más nueva: en esa fecha manda la directa
      nonHdlc: [{ value: 120, date: '2026-05-01T10:00:00Z' }],
    };
    const trend = le8ClinicalTrend(history, FLAGS, NOW);
    // 2026-02: no-HDL = 220-50 = 170 -> 40 · 2026-05: no-HDL directa 120 -> 100
    expect(trend.lipids?.map((p) => p.score)).toEqual([40, 100]);
  });

  test('ventana: excluye lecturas fuera de los últimos 12 meses', () => {
    const history: CKMObservationHistory = {
      bmi: [
        { value: 28.5, date: '2026-06-01T10:00:00Z' },
        { value: 40, date: '2020-01-01T10:00:00Z' }, // vieja: fuera de la serie
      ],
    };
    const trend = le8ClinicalTrend(history, FLAGS, NOW);
    expect(trend.bmi).toHaveLength(1);
    expect(trend.bmi?.[0].score).toBe(70);
  });

  test('dos lecturas el mismo día: un solo punto con la última', () => {
    const history: CKMObservationHistory = {
      bmi: [
        { value: 24, date: '2026-06-01T18:00:00Z' },
        { value: 32, date: '2026-06-01T09:00:00Z' },
      ],
    };
    const trend = le8ClinicalTrend(history, FLAGS, NOW);
    expect(trend.bmi).toHaveLength(1);
    expect(trend.bmi?.[0].score).toBe(100);
  });

  test('diabetes sin HbA1c: la glucosa no puntúa y no hay serie', () => {
    const history: CKMObservationHistory = {
      glucoseFasting: [{ value: 90, date: '2026-06-01T10:00:00Z' }],
    };
    const trend = le8ClinicalTrend(history, { diabetes: true, onAntihypertensive: false }, NOW);
    expect(trend.glucose).toBeUndefined();
  });

  test('lecturas sin fecha quedan fuera de la reconstrucción', () => {
    const history: CKMObservationHistory = {
      bmi: [{ value: 28.5 }, { value: 24, date: '2026-06-01T10:00:00Z' }],
    };
    const trend = le8ClinicalTrend(history, FLAGS, NOW);
    expect(trend.bmi?.map((p) => p.score)).toEqual([100]);
  });

  test('historial vacío devuelve objeto vacío', () => {
    expect(le8ClinicalTrend({}, FLAGS, NOW)).toEqual({});
  });
});
