import { evaluateStudyGaps, recommendedStudies } from './studies';
import type { ClinicalFlag, StudyContext } from './studies';
import type { CKMObservationMap } from './observations';

const NO_FLAGS: Record<ClinicalFlag, boolean> = {
  diabetes: false,
  hypertension: false,
  ckd: false,
  heartFailure: false,
};

const NOW = new Date('2026-06-17T00:00:00.000Z').getTime();

function monthsAgoIso(months: number): string {
  return new Date(NOW - months * 30.44 * 24 * 3600 * 1000).toISOString();
}

describe('studies — reglas de aplicabilidad', () => {
  test('estadío 2 recomienda eGFR y UACR', () => {
    const ctx: StudyContext = { stage: 2, flags: NO_FLAGS };
    const ids = recommendedStudies(ctx).map((r) => r.id);
    expect(ids).toContain('egfr');
    expect(ids).toContain('uacr');
    expect(ids).toContain('lipids');
    // CAC es estadío 3, no debería estar aún
    expect(ids).not.toContain('cac');
  });

  test('diabetes dispara UACR y fondo de ojo aunque el estadío sea bajo', () => {
    const ctx: StudyContext = { stage: 1, flags: { ...NO_FLAGS, diabetes: true } };
    const ids = recommendedStudies(ctx).map((r) => r.id);
    expect(ids).toContain('uacr');
    expect(ids).toContain('fundus');
  });

  test('estadío 3 agrega CAC, NT-proBNP y troponina', () => {
    const ids = recommendedStudies({ stage: 3, flags: NO_FLAGS }).map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining(['cac', 'ntprobnp', 'hs-troponin']));
  });
});

describe('studies — gap analysis', () => {
  test('estadío 2 sin UACR ni eGFR: ambos 🔴 missing', () => {
    const ctx: StudyContext = { stage: 2, flags: NO_FLAGS };
    const gaps = evaluateStudyGaps(ctx, {}, NOW);
    const uacr = gaps.find((g) => g.rule.id === 'uacr');
    const egfr = gaps.find((g) => g.rule.id === 'egfr');
    expect(uacr?.status).toBe('missing');
    expect(egfr?.status).toBe('missing');
  });

  test('eGFR de hace 14 meses (intervalo 12): 🟡 overdue', () => {
    const ctx: StudyContext = { stage: 2, flags: NO_FLAGS };
    const values: CKMObservationMap = { egfr: { value: 55, date: monthsAgoIso(14) } };
    const egfr = evaluateStudyGaps(ctx, values, NOW).find((g) => g.rule.id === 'egfr');
    expect(egfr?.status).toBe('overdue');
    expect(egfr?.monthsSince).toBe(14);
    expect(egfr?.intervalMonths).toBe(12);
  });

  test('eGFR de hace 3 meses: 🟢 current', () => {
    const ctx: StudyContext = { stage: 2, flags: NO_FLAGS };
    const values: CKMObservationMap = { egfr: { value: 80, date: monthsAgoIso(3) } };
    const egfr = evaluateStudyGaps(ctx, values, NOW).find((g) => g.rule.id === 'egfr');
    expect(egfr?.status).toBe('current');
  });

  test('HbA1c con diabetes usa intervalo de 6 meses', () => {
    const ctx: StudyContext = { stage: 2, flags: { ...NO_FLAGS, diabetes: true } };
    // 8 meses: vencido para diabético (intervalo 6)
    const values: CKMObservationMap = { hba1c: { value: 7.5, date: monthsAgoIso(8) } };
    const a1c = evaluateStudyGaps(ctx, values, NOW).find((g) => g.rule.id === 'hba1c');
    expect(a1c?.status).toBe('overdue');
    expect(a1c?.intervalMonths).toBe(6);
  });

  test('CAC es de única vez: presente → current, ausente → missing', () => {
    const ctx: StudyContext = { stage: 3, flags: NO_FLAGS };
    const withCac: CKMObservationMap = { cac: { value: 120, date: monthsAgoIso(40) } };
    expect(evaluateStudyGaps(ctx, withCac, NOW).find((g) => g.rule.id === 'cac')?.status).toBe('current');
    expect(evaluateStudyGaps(ctx, {}, NOW).find((g) => g.rule.id === 'cac')?.status).toBe('missing');
  });

  test('estudios sin parámetro (eco, fondo de ojo) son info', () => {
    const ctx: StudyContext = { stage: 3, flags: { ...NO_FLAGS, diabetes: true } };
    const gaps = evaluateStudyGaps(ctx, {}, NOW);
    expect(gaps.find((g) => g.rule.id === 'echo')?.status).toBe('info');
    expect(gaps.find((g) => g.rule.id === 'fundus')?.status).toBe('info');
  });

  test('ordena por prioridad: missing antes que current', () => {
    const ctx: StudyContext = { stage: 2, flags: NO_FLAGS };
    const values: CKMObservationMap = { egfr: { value: 80, date: monthsAgoIso(2) } };
    const gaps = evaluateStudyGaps(ctx, values, NOW);
    const firstCurrent = gaps.findIndex((g) => g.status === 'current');
    const lastMissing = gaps.map((g) => g.status).lastIndexOf('missing');
    expect(lastMissing).toBeLessThan(firstCurrent);
  });
});
