import { lipidTarget, lipidTargetText, lipidTargetTier, lipidTargetValue } from './lipid-targets';

describe('lipidTargetTier', () => {
  test('ECV clínica (estadío CKM 4) => muy alto riesgo', () => {
    expect(lipidTargetTier(4, 'low')).toBe('very-high');
    expect(lipidTargetTier(4, undefined)).toBe('very-high');
  });

  test('ASCVD categoría alta => alto riesgo', () => {
    expect(lipidTargetTier(2, 'high')).toBe('high');
    expect(lipidTargetTier(undefined, 'high')).toBe('high');
  });

  test('el resto => moderado', () => {
    expect(lipidTargetTier(0, 'low')).toBe('moderate');
    expect(lipidTargetTier(1, 'borderline')).toBe('moderate');
    expect(lipidTargetTier(2, 'intermediate')).toBe('moderate');
    expect(lipidTargetTier(undefined, undefined)).toBe('moderate');
  });

  test('estadío 4 gana sobre la categoría ASCVD', () => {
    expect(lipidTargetTier(4, 'low')).toBe('very-high');
  });

  describe('diabetes eleva el tramo (guía 2026: reducir LDL-C ≥50 %)', () => {
    test('diabetes con riesgo intermedio => alto (antes moderado)', () => {
      expect(lipidTargetTier(2, 'intermediate', true)).toBe('high');
      expect(lipidTargetTier(2, 'intermediate', false)).toBe('moderate');
    });

    test('diabetes con riesgo bajo/limítrofe NO eleva (sigue moderado)', () => {
      expect(lipidTargetTier(1, 'low', true)).toBe('moderate');
      expect(lipidTargetTier(1, 'borderline', true)).toBe('moderate');
    });

    test('diabetes no baja el tramo cuando el estadío o el ASCVD ya mandan más alto', () => {
      expect(lipidTargetTier(4, 'low', true)).toBe('very-high');
      expect(lipidTargetTier(2, 'high', true)).toBe('high');
    });

    test('sin flag de diabetes el comportamiento es el de antes (retrocompatible)', () => {
      expect(lipidTargetTier(2, 'intermediate')).toBe('moderate');
    });

    test('fail-safe: diabético SIN score ASCVD (undefined) => alto, no relaja el objetivo', () => {
      expect(lipidTargetTier(2, undefined, true, undefined)).toBe('high');
      expect(lipidTargetTier(2, undefined, true)).toBe('high'); // baseAscvdLevel default = undefined
      // sin diabetes y sin score => moderado (default)
      expect(lipidTargetTier(2, undefined, false, undefined)).toBe('moderate');
    });
  });

  describe('la regla de diabetes usa la categoría ASCVD base (no la bajada por CAC)', () => {
    test('CAC=0 baja la categoría efectiva a limítrofe, pero la base intermedia mantiene el tramo alto en diabéticos', () => {
      // efectiva 'borderline' (por power-of-zero), base 'intermediate'
      expect(lipidTargetTier(2, 'borderline', true, 'intermediate')).toBe('high');
    });

    test('sin diabetes, la categoría efectiva bajada por CAC manda (moderado)', () => {
      expect(lipidTargetTier(2, 'borderline', false, 'intermediate')).toBe('moderate');
    });
  });
});

describe('lipidTarget', () => {
  test('objetivos escalonados de LDL y ApoB por tramo', () => {
    expect(lipidTarget('moderate')).toMatchObject({ ldlBelow: 100, apobBelow: 90 });
    expect(lipidTarget('high')).toMatchObject({ ldlBelow: 70, apobBelow: 80 });
    expect(lipidTarget('very-high')).toMatchObject({ ldlBelow: 55, apobBelow: 65 });
  });
});

describe('lipidTargetText', () => {
  test('LDL y ApoB llevan objetivo por riesgo; otros no', () => {
    expect(lipidTargetText('ldl-colesterol', 'high')).toBe('< 70 mg/dL (riesgo alto)');
    expect(lipidTargetText('apob', 'very-high')).toBe('< 65 mg/dL (riesgo muy alto)');
    expect(lipidTargetText('hdl-colesterol', 'high')).toBeUndefined();
    expect(lipidTargetText('trigliceridos', 'high')).toBeUndefined();
    expect(lipidTargetText(undefined, 'high')).toBeUndefined();
  });
});

describe('lipidTargetValue', () => {
  test('devuelve el umbral numérico para clasificar cumplimiento', () => {
    expect(lipidTargetValue('ldl-colesterol', 'moderate')).toBe(100);
    expect(lipidTargetValue('apob', 'high')).toBe(80);
    expect(lipidTargetValue('lpa', 'high')).toBeUndefined();
  });
});
