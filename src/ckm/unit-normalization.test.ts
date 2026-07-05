import { normalizeCKMValue } from './unit-normalization';

describe('normalizeCKMValue', () => {
  test('deja el valor tal cual si ya está en la unidad canónica', () => {
    expect(normalizeCKMValue('triglycerides', 150, 'mg/dL')).toEqual({ value: 150, unit: 'mg/dL' });
    expect(normalizeCKMValue('glucoseFasting', 126, 'mg/dl')).toEqual({ value: 126, unit: 'mg/dl' });
  });

  test('deja el valor tal cual si no hay unidad', () => {
    expect(normalizeCKMValue('ldlc', 100, undefined)).toEqual({ value: 100, unit: undefined });
    expect(normalizeCKMValue('ldlc', 100, '')).toEqual({ value: 100, unit: '' });
  });

  test('parámetro sin conversión definida se deja tal cual (ej. presión, UACR)', () => {
    expect(normalizeCKMValue('sbp', 130, 'mmHg')).toEqual({ value: 130, unit: 'mmHg' });
    expect(normalizeCKMValue('uacr', 45, 'mg/g')).toEqual({ value: 45, unit: 'mg/g' });
  });

  test('convierte triglicéridos de mmol/L a mg/dL (el caso que rompía el estadío)', () => {
    const { value, unit } = normalizeCKMValue('triglycerides', 3.0, 'mmol/L');
    expect(unit).toBe('mg/dL');
    expect(value).toBeCloseTo(265.71, 1); // 3.0 × 88.57, cruza el umbral de 150
    expect(value).toBeGreaterThanOrEqual(150);
  });

  test('convierte glucosa de mmol/L a mg/dL', () => {
    const { value, unit } = normalizeCKMValue('glucoseFasting', 7.0, 'mmol/L');
    expect(unit).toBe('mg/dL');
    expect(value).toBeCloseTo(126.13, 1); // 7.0 × 18.0182 ≈ diabetes ≥126
  });

  test('convierte colesterol/LDL de mmol/L a mg/dL', () => {
    expect(normalizeCKMValue('ldlc', 2.59, 'mmol/L').value).toBeCloseTo(100.16, 1);
    expect(normalizeCKMValue('cholesterolTotal', 5.0, 'mmol/L').value).toBeCloseTo(193.35, 1);
  });

  test('convierte glucosa/lípidos de g/L a mg/dL (unidad frecuente en Argentina)', () => {
    // 1.26 g/L glucosa = 126 mg/dL (umbral de diabetes); 3.0 g/L = 300 (crítico)
    expect(normalizeCKMValue('glucoseFasting', 1.26, 'g/L').value).toBeCloseTo(126, 6);
    expect(normalizeCKMValue('glucoseFasting', 3.0, 'g/L')).toEqual({ value: 300, unit: 'mg/dL' });
    // 1.0 g/L LDL = 100 mg/dL; 1.5 g/L TG = 150 mg/dL (umbral de hipertrigliceridemia)
    expect(normalizeCKMValue('ldlc', 1.0, 'g/L').value).toBeCloseTo(100, 6);
    expect(normalizeCKMValue('triglycerides', 1.5, 'g/L').value).toBeCloseTo(150, 6);
  });

  test('convierte creatinina de µmol/L (µ y µ griega) y mg/L a mg/dL', () => {
    expect(normalizeCKMValue('creatinine', 88.42, 'µmol/L').value).toBeCloseTo(1.0, 3); // U+00B5
    expect(normalizeCKMValue('creatinine', 88.42, 'umol/L').value).toBeCloseTo(1.0, 3);
    expect(normalizeCKMValue('creatinine', 88.42, 'μmol/L').value).toBeCloseTo(1.0, 3); // U+03BC (mu griega)
    expect(normalizeCKMValue('creatinine', 10, 'mg/L').value).toBeCloseTo(1.0, 6);
  });

  test('convierte UACR de mg/mmol (SI) a mg/g (cruza el umbral de albuminuria)', () => {
    // 3.4 mg/mmol ≈ 30 mg/g (umbral A2)
    const { value, unit } = normalizeCKMValue('uacr', 3.4, 'mg/mmol');
    expect(unit).toBe('mg/g');
    expect(value).toBeCloseTo(30.06, 1);
    expect(value).toBeGreaterThanOrEqual(30);
  });

  test('convierte HbA1c de mmol/mol (IFCC) a % (NGSP)', () => {
    // 48 mmol/mol ≈ 6.5 % (umbral de diabetes)
    expect(normalizeCKMValue('hba1c', 48, 'mmol/mol').value).toBeCloseTo(6.54, 1);
  });

  test('unidad desconocida: deja el valor crudo y avisa (no adivina)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(normalizeCKMValue('ldlc', 100, 'mg/qux')).toEqual({ value: 100, unit: 'mg/qux' });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
