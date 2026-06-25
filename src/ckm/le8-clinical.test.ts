import { computeLE8 } from './le8';
import { clinicalLE8Inputs, nonHdlMgDl } from './le8-clinical';
import type { CKMObservationMap } from './observations';

/** Helper: arma un CKMObservationMap desde pares parámetro→valor. */
function values(map: Partial<Record<string, number>>): CKMObservationMap {
  const out: CKMObservationMap = {};
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) {
      (out as Record<string, { value: number }>)[k] = { value: v };
    }
  }
  return out;
}

const NO_FLAGS = { diabetes: false, onAntihypertensive: false };

describe('nonHdlMgDl', () => {
  test('usa la Observation de no-HDL directa si existe', () => {
    expect(nonHdlMgDl(values({ nonHdlc: 140, cholesterolTotal: 220, hdlc: 50 }))).toBe(140);
  });
  test('deriva total − HDL si no hay no-HDL directo', () => {
    expect(nonHdlMgDl(values({ cholesterolTotal: 200, hdlc: 55 }))).toBe(145);
  });
  test('sin total o sin HDL → undefined', () => {
    expect(nonHdlMgDl(values({ cholesterolTotal: 200 }))).toBeUndefined();
    expect(nonHdlMgDl(values({ hdlc: 55 }))).toBeUndefined();
    expect(nonHdlMgDl(values({}))).toBeUndefined();
  });
});

describe('clinicalLE8Inputs', () => {
  test('IMC se toma directo', () => {
    expect(clinicalLE8Inputs(values({ bmi: 27.5 }), NO_FLAGS).bmi).toBe(27.5);
    expect(clinicalLE8Inputs(values({}), NO_FLAGS).bmi).toBeUndefined();
  });

  test('lípidos: directo o derivado', () => {
    expect(clinicalLE8Inputs(values({ nonHdlc: 150 }), NO_FLAGS).nonHdlMgDl).toBe(150);
    expect(clinicalLE8Inputs(values({ cholesterolTotal: 210, hdlc: 60 }), NO_FLAGS).nonHdlMgDl).toBe(150);
  });

  test('glucosa: se arma con HbA1c o glucemia y adjunta el flag de diabetes', () => {
    expect(clinicalLE8Inputs(values({ hba1c: 5.4 }), NO_FLAGS).glucose).toEqual({
      hasDiabetes: false,
      hba1cPercent: 5.4,
      fastingGlucoseMgDl: undefined,
    });
    expect(clinicalLE8Inputs(values({ glucoseFasting: 95 }), { ...NO_FLAGS, diabetes: true }).glucose).toEqual({
      hasDiabetes: true,
      hba1cPercent: undefined,
      fastingGlucoseMgDl: 95,
    });
  });

  test('glucosa: sin ningún laboratorio → no se arma (aunque haya diabetes)', () => {
    expect(clinicalLE8Inputs(values({}), { ...NO_FLAGS, diabetes: true }).glucose).toBeUndefined();
  });

  test('presión: requiere sistólica Y diastólica; adjunta el flag de medicación', () => {
    expect(clinicalLE8Inputs(values({ sbp: 128, dbp: 82 }), { ...NO_FLAGS, onAntihypertensive: true }).bloodPressure).toEqual(
      { systolic: 128, diastolic: 82, onAntihypertensive: true }
    );
    expect(clinicalLE8Inputs(values({ sbp: 128 }), NO_FLAGS).bloodPressure).toBeUndefined();
    expect(clinicalLE8Inputs(values({ dbp: 82 }), NO_FLAGS).bloodPressure).toBeUndefined();
  });
});

describe('integración con computeLE8', () => {
  test('los 4 clínicos presentes → 4 componentes, 4 faltantes (conductuales), sin compuesto', () => {
    const inputs = clinicalLE8Inputs(
      values({ bmi: 22, nonHdlc: 120, hba1c: 5.0, sbp: 110, dbp: 70 }),
      NO_FLAGS
    );
    const r = computeLE8(inputs);
    expect(r.complete).toBe(false);
    expect(r.composite).toBeUndefined();
    expect(r.components.map((c) => c.key)).toEqual(['bmi', 'lipids', 'glucose', 'bloodPressure']);
    expect(r.missing).toEqual(['diet', 'physicalActivity', 'nicotine', 'sleep']);
    // valores óptimos → los 4 sub-scores en 100
    expect(r.components.every((c) => c.score === 100)).toBe(true);
  });

  test('diabético sin HbA1c: la glucosa queda como faltante (dato insuficiente)', () => {
    const inputs = clinicalLE8Inputs(values({ bmi: 22, glucoseFasting: 180 }), { ...NO_FLAGS, diabetes: true });
    const r = computeLE8(inputs);
    expect(r.components.map((c) => c.key)).toEqual(['bmi']);
    expect(r.missing).toContain('glucose');
  });

  test('presión medicada aplica el −20', () => {
    const inputs = clinicalLE8Inputs(values({ sbp: 118, dbp: 76 }), { ...NO_FLAGS, onAntihypertensive: true });
    const r = computeLE8(inputs);
    const bp = r.components.find((c) => c.key === 'bloodPressure');
    expect(bp?.score).toBe(80); // 100 − 20
  });
});
