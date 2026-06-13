import { buildTerms, computePrevent, evaluate, PREVENT_VERIFIED } from './prevent';
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
const REFERENCE_OUTPUT = { ascvd10y: 9.2, hf10y: 8.1, cvdTotal30y: 14.7 };

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

describe('PREVENT — validación contra vector oficial', () => {
  // Esta prueba sólo corre cuando los coeficientes están cargados y marcados
  // como verificados. Mientras PREVENT_VERIFIED sea false, queda pendiente
  // para no fallar el CI por coeficientes aún no transcritos del suplemento.
  const maybe = PREVENT_VERIFIED ? test : test.todo;
  maybe('reproduce 9.2% / 8.1% / 14.7% (mujer 50a del paper)', () => {
    const result = computePrevent(REFERENCE_INPUT);
    expect(result?.ascvd10y).toBeCloseTo(REFERENCE_OUTPUT.ascvd10y, 1);
    expect(result?.hf10y).toBeCloseTo(REFERENCE_OUTPUT.hf10y, 1);
    expect(result?.cvdTotal30y).toBeCloseTo(REFERENCE_OUTPUT.cvdTotal30y, 1);
  });

  test('computePrevent devuelve undefined si los coeficientes no están verificados', () => {
    if (!PREVENT_VERIFIED) {
      expect(computePrevent(REFERENCE_INPUT)).toBeUndefined();
    }
  });
});
