import type { CKMObservationMap } from './observations';
import { deriveStage } from './scoring';

const tg = (value: number): CKMObservationMap => ({ triglycerides: { value, unit: 'mg/dL' } });

describe('deriveStage — umbral de hipertrigliceridemia (guía 2026 CKM)', () => {
  test('TG ≥ 150 mg/dL clasifica estadío 2', () => {
    expect(deriveStage(tg(150))).toBe(2);
    expect(deriveStage(tg(180))).toBe(2);
  });

  test('TG entre 135 y 149 ya NO alcanza el estadío 2 por sí solo', () => {
    // 135 era el umbral anterior; la guía 2026 usa 150
    expect(deriveStage(tg(135))).toBe(0);
    expect(deriveStage(tg(149))).toBe(0);
  });
});
