import { buildTerms, computePrevent, computePreventAt, evaluate, PREVENT_VERIFIED } from './prevent';
import type { PreventInputs } from './prevent';

// Vector de referencia oficial (documentación de preventr, derivado de la
// Table S25 del paper PREVENT): mujer 50a, SBP 160 tratada, colesterol total
// 200 / HDL 45 mg/dL, diabética, no fumadora, eGFR 90, IMC 35, modelo base.
const REFERENCE_INPUT: PreventInputs = {
  age: 50,
  sex: 'female',
  totalCholesterol: 200,
  hdl: 45,
  systolicBP: 160,
  egfr: 90,
  bmi: 35,
  diabetes: true,
  smoking: false,
  onAntihypertensive: true,
  onStatin: false,
};
describe('PREVENT — transformaciones (estructura citada)', () => {
  test('centra edad por década respecto de 55', () => {
    const terms = buildTerms({ ...REFERENCE_INPUT, age: 55 });
    expect(terms.age).toBeCloseTo(0, 6);
    expect(buildTerms({ ...REFERENCE_INPUT, age: 65 }).age).toBeCloseTo(1, 6);
  });

  test('splines de SBP con nudo en 110 mmHg', () => {
    const terms = buildTerms({ ...REFERENCE_INPUT, systolicBP: 160 });
    expect(terms.sbpLow).toBeCloseTo(0, 6); // min(160,110)=110 -> (110-110)/20
    expect(terms.sbpHigh).toBeCloseTo(1.5, 6); // (160-130)/20
  });

  test('splines de eGFR con nudo en 60 y escala -15', () => {
    const terms = buildTerms({ ...REFERENCE_INPUT, egfr: 90 });
    expect(terms.egfrLow).toBeCloseTo(0, 6); // min(90,60)=60 -> (60-60)/-15
    expect(terms.egfrHigh).toBeCloseTo(0, 6); // (90-90)/-15
    expect(buildTerms({ ...REFERENCE_INPUT, egfr: 45 }).egfrLow).toBeCloseTo(1, 6); // (45-60)/-15
  });

  test('convierte colesterol mg/dL a mmol/L para non-HDL centrado', () => {
    // non-HDL = 200-45 = 155 mg/dL = 4.009 mmol/L; centrado 3.5 -> 0.509
    const terms = buildTerms(REFERENCE_INPUT);
    expect(terms.nonHdl).toBeCloseTo(155 / 38.67 - 3.5, 3);
  });

  test('evaluate() aplica el link logístico y devuelve porcentaje', () => {
    // logOdds 0 -> 50%
    expect(evaluate({ intercept: 0 }, buildTerms(REFERENCE_INPUT))).toBeCloseTo(50, 6);
    // intercept tal que p≈0.147
    const logOdds = Math.log(0.147 / (1 - 0.147));
    expect(evaluate({ intercept: logOdds }, buildTerms(REFERENCE_INPUT))).toBeCloseTo(14.7, 1);
  });
});

describe('PREVENT — validación contra vector oficial (mujer 50a del paper)', () => {
  test('riesgos a 10 años: total CVD 14.7%, ASCVD 9.2%, IC 8.1%', () => {
    const r10 = computePreventAt(REFERENCE_INPUT, 10);
    expect(r10.totalCvd).toBeCloseTo(14.7, 1);
    expect(r10.ascvd).toBeCloseTo(9.2, 1);
    expect(r10.heartFailure).toBeCloseTo(8.1, 1);
  });

  // Las ecuaciones de 30 años usan las aproximaciones de regresión de la
  // Tabla S12.F (R²≈0.999), que difieren ~0.5pp de los ejemplos exactos del
  // apéndice (53/35.4/39). Diferencia clínicamente despreciable.
  test('riesgos a 30 años dentro de ~1pp del valor oficial', () => {
    const r30 = computePreventAt(REFERENCE_INPUT, 30);
    expect(Math.abs(r30.totalCvd - 53)).toBeLessThan(1);
    expect(Math.abs(r30.ascvd - 35.4)).toBeLessThan(1);
    expect(Math.abs(r30.heartFailure - 39)).toBeLessThan(1);
  });

  test('computePrevent mapea ASCVD/IC a 10a y CVD total a 30a', () => {
    expect(PREVENT_VERIFIED).toBe(true);
    const result = computePrevent(REFERENCE_INPUT);
    expect(result?.ascvd10y).toBeCloseTo(9.2, 1);
    expect(result?.hf10y).toBeCloseTo(8.1, 1);
    expect(Math.abs((result?.cvdTotal30y ?? 0) - 53)).toBeLessThan(1);
  });

  test('non-HDL directo (Control) da el mismo resultado que total - HDL', () => {
    // total 200, HDL 45 -> non-HDL 155. Enviar 155 directo debe coincidir.
    const conTotal = computePrevent(REFERENCE_INPUT);
    const { totalCholesterol: _omit, ...sinTotal } = REFERENCE_INPUT;
    const conNonHdl = computePrevent({ ...sinTotal, nonHdlCholesterol: 155 });
    expect(conNonHdl).toEqual(conTotal);
  });
});
