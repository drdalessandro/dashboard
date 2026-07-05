import { formatUnit } from './units';

describe('formatUnit', () => {
  test('convierte los códigos UCUM que aparecen en nuestros datos', () => {
    expect(formatUnit('mm[Hg]')).toBe('mmHg');
    expect(formatUnit('kg/m2')).toBe('kg/m²');
    expect(formatUnit('mL/min/{1.73_m2}')).toBe('mL/min/1.73m²');
    expect(formatUnit('mL/min/1.73_m2')).toBe('mL/min/1.73m²');
    expect(formatUnit('mg/g{creat}')).toBe('mg/g');
  });

  test('las unidades ya legibles pasan sin cambios', () => {
    expect(formatUnit('mmHg')).toBe('mmHg');
    expect(formatUnit('mg/dL')).toBe('mg/dL');
    expect(formatUnit('mL/min/1.73m²')).toBe('mL/min/1.73m²');
    expect(formatUnit('%')).toBe('%');
    expect(formatUnit('Agatston')).toBe('Agatston');
    expect(formatUnit('mmol/L')).toBe('mmol/L');
  });

  test('limpieza genérica para códigos UCUM no mapeados', () => {
    expect(formatUnit('cm2')).toBe('cm²');
    expect(formatUnit('g/m2')).toBe('g/m²');
    expect(formatUnit('mg/g{total_prot}')).toBe('mg/gtotal_prot');
  });

  test('undefined y vacío pasan tal cual', () => {
    expect(formatUnit(undefined)).toBeUndefined();
    expect(formatUnit('')).toBe('');
  });

  test('no rompe códigos con dígitos que no son superíndices', () => {
    expect(formatUnit('10*3/uL')).toBe('10*3/uL');
  });
});
