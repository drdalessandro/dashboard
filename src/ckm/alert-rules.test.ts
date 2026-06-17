import { evaluateThresholdRules } from './alert-rules';
import type { CKMObservationHistory } from './observations';

/** Genera lecturas con fechas decrecientes (más nueva primero). */
function readings(values: number[]): { value: number; date: string }[] {
  return values.map((value, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i); // i=0 hoy, i=1 ayer, ...
    return { value, date: d.toISOString() };
  });
}

describe('alert-rules — reglas de tendencia "3 strikes"', () => {
  test('dispara con 3 PA sistólicas elevadas (>=140)', () => {
    const history: CKMObservationHistory = { sbp: readings([150, 145, 142]) };
    const alerts = evaluateThresholdRules(history, undefined);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].ruleId).toBe('sbp-high');
    expect(alerts[0].count).toBe(3);
    expect(alerts[0].latestValue).toBe(150);
    expect(alerts[0].message).toContain('Presión sistólica');
  });

  test('no dispara con solo 2 lecturas elevadas', () => {
    const history: CKMObservationHistory = { sbp: readings([150, 145, 120]) };
    expect(evaluateThresholdRules(history, undefined)).toHaveLength(0);
  });

  test('no dispara si la lectura más reciente ya está normalizada', () => {
    // 3 elevadas viejas pero la última (más nueva) es normal
    const history: CKMObservationHistory = { sbp: readings([120, 150, 145, 142]) };
    expect(evaluateThresholdRules(history, undefined)).toHaveLength(0);
  });

  test('HDL bajo usa umbral por sexo (mujer <50, varón <40)', () => {
    const history: CKMObservationHistory = { hdlc: readings([45, 46, 47]) };
    // Mujer: 45/46/47 < 50 -> dispara
    expect(evaluateThresholdRules(history, 'female')).toHaveLength(1);
    // Varón: 45/46/47 >= 40 -> no dispara
    expect(evaluateThresholdRules(history, 'male')).toHaveLength(0);
  });

  test('cuenta solo lecturas dentro de la ventana', () => {
    const old = new Date();
    old.setDate(old.getDate() - 400);
    const history: CKMObservationHistory = {
      sbp: [
        { value: 150, date: new Date().toISOString() },
        { value: 145, date: new Date().toISOString() },
        { value: 142, date: old.toISOString() }, // fuera de los 180 días
      ],
    };
    expect(evaluateThresholdRules(history, undefined)).toHaveLength(0);
  });

  test('respeta minCount configurable', () => {
    const history: CKMObservationHistory = { sbp: readings([150, 145]) };
    expect(evaluateThresholdRules(history, undefined, { minCount: 2, windowDays: 180 })).toHaveLength(1);
  });

  test('dispara múltiples reglas en simultáneo', () => {
    const history: CKMObservationHistory = {
      sbp: readings([150, 145, 142]),
      hba1c: readings([7.2, 6.8, 6.6]),
    };
    const alerts = evaluateThresholdRules(history, undefined);
    expect(alerts.map((a) => a.ruleId).sort()).toEqual(['hba1c-high', 'sbp-high']);
  });

  test('sin historial no dispara nada', () => {
    expect(evaluateThresholdRules({}, undefined)).toHaveLength(0);
  });
});
