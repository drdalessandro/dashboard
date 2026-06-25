import {
  computeLE8,
  le8Category,
  LE8_ORDER,
  scoreBloodPressure,
  scoreBmi,
  scoreDiet,
  scoreGlucose,
  scoreLipids,
  scoreNicotine,
  scorePhysicalActivity,
  scoreSleep,
} from './le8';
import type { LE8Inputs } from './le8';

describe('le8Category', () => {
  test('alto ≥80, moderado 50–79, bajo <50', () => {
    expect(le8Category(100).level).toBe('high');
    expect(le8Category(80).level).toBe('high');
    expect(le8Category(79).level).toBe('moderate');
    expect(le8Category(50).level).toBe('moderate');
    expect(le8Category(49).level).toBe('low');
    expect(le8Category(0).level).toBe('low');
  });
  test('colores de la paleta', () => {
    expect(le8Category(90).color).toBe('green');
    expect(le8Category(60).color).toBe('yellow');
    expect(le8Category(10).color).toBe('red');
  });
});

describe('scoreDiet', () => {
  test('niveles 1–5 → 0/25/50/80/100', () => {
    expect(scoreDiet({ level: 1 })).toBe(0);
    expect(scoreDiet({ level: 2 })).toBe(25);
    expect(scoreDiet({ level: 3 })).toBe(50);
    expect(scoreDiet({ level: 4 })).toBe(80);
    expect(scoreDiet({ level: 5 })).toBe(100);
  });
  test('sin dato → undefined', () => {
    expect(scoreDiet(undefined)).toBeUndefined();
  });
});

describe('scorePhysicalActivity (min/sem)', () => {
  test('bordes de cada tramo', () => {
    expect(scorePhysicalActivity(0)).toBe(0);
    expect(scorePhysicalActivity(1)).toBe(20);
    expect(scorePhysicalActivity(29)).toBe(20);
    expect(scorePhysicalActivity(30)).toBe(40);
    expect(scorePhysicalActivity(59)).toBe(40);
    expect(scorePhysicalActivity(60)).toBe(60);
    expect(scorePhysicalActivity(89)).toBe(60);
    expect(scorePhysicalActivity(90)).toBe(80);
    expect(scorePhysicalActivity(119)).toBe(80);
    expect(scorePhysicalActivity(120)).toBe(90);
    expect(scorePhysicalActivity(149)).toBe(90);
    expect(scorePhysicalActivity(150)).toBe(100);
    expect(scorePhysicalActivity(300)).toBe(100);
  });
  test('sin dato → undefined', () => {
    expect(scorePhysicalActivity(undefined)).toBeUndefined();
    expect(scorePhysicalActivity(NaN)).toBeUndefined();
  });
});

describe('scoreNicotine', () => {
  test('nunca = 100', () => {
    expect(scoreNicotine({ status: 'never' })).toBe(100);
  });
  test('ex fumador según años desde que dejó', () => {
    expect(scoreNicotine({ status: 'former', yearsSinceQuit: 5 })).toBe(75);
    expect(scoreNicotine({ status: 'former', yearsSinceQuit: 10 })).toBe(75);
    expect(scoreNicotine({ status: 'former', yearsSinceQuit: 1 })).toBe(50);
    expect(scoreNicotine({ status: 'former', yearsSinceQuit: 4.9 })).toBe(50);
    expect(scoreNicotine({ status: 'former', yearsSinceQuit: 0.5 })).toBe(25);
    expect(scoreNicotine({ status: 'former' })).toBe(25); // años desconocidos → asume <1
  });
  test('uso actual: combustible = 0, solo inhalado = 25', () => {
    expect(scoreNicotine({ status: 'current' })).toBe(0);
    expect(scoreNicotine({ status: 'current', inhaledNicotineOnly: true })).toBe(25);
  });
  test('humo de segunda mano resta 20 (piso 0)', () => {
    expect(scoreNicotine({ status: 'never', secondhandAtHome: true })).toBe(80);
    expect(scoreNicotine({ status: 'former', yearsSinceQuit: 0.5, secondhandAtHome: true })).toBe(5);
    expect(scoreNicotine({ status: 'current', secondhandAtHome: true })).toBe(0); // piso 0
  });
  test('sin dato → undefined', () => {
    expect(scoreNicotine(undefined)).toBeUndefined();
  });
});

describe('scoreSleep (horas/noche)', () => {
  test('bordes de cada tramo', () => {
    expect(scoreSleep(3.9)).toBe(0);
    expect(scoreSleep(4)).toBe(20);
    expect(scoreSleep(5)).toBe(40);
    expect(scoreSleep(6)).toBe(70);
    expect(scoreSleep(7)).toBe(100);
    expect(scoreSleep(8.9)).toBe(100);
    expect(scoreSleep(9)).toBe(90);
    expect(scoreSleep(9.9)).toBe(90);
    expect(scoreSleep(10)).toBe(40);
    expect(scoreSleep(12)).toBe(40);
  });
  test('sin dato → undefined', () => {
    expect(scoreSleep(undefined)).toBeUndefined();
  });
});

describe('scoreBmi', () => {
  test('bordes', () => {
    expect(scoreBmi(24.9)).toBe(100);
    expect(scoreBmi(25)).toBe(70);
    expect(scoreBmi(29.9)).toBe(70);
    expect(scoreBmi(30)).toBe(30);
    expect(scoreBmi(35)).toBe(15);
    expect(scoreBmi(40)).toBe(0);
  });
  test('sin dato → undefined', () => {
    expect(scoreBmi(undefined)).toBeUndefined();
  });
});

describe('scoreLipids (no-HDL mg/dL)', () => {
  test('bordes', () => {
    expect(scoreLipids(129)).toBe(100);
    expect(scoreLipids(130)).toBe(60);
    expect(scoreLipids(160)).toBe(40);
    expect(scoreLipids(190)).toBe(20);
    expect(scoreLipids(220)).toBe(0);
  });
  test('sin dato → undefined', () => {
    expect(scoreLipids(undefined)).toBeUndefined();
  });
});

describe('scoreGlucose', () => {
  test('no diabético por HbA1c', () => {
    expect(scoreGlucose({ hasDiabetes: false, hba1cPercent: 5.6 })).toBe(100);
    expect(scoreGlucose({ hasDiabetes: false, hba1cPercent: 5.7 })).toBe(60);
    expect(scoreGlucose({ hasDiabetes: false, hba1cPercent: 6.4 })).toBe(60);
  });
  test('no diabético por glucemia en ayunas (sin HbA1c)', () => {
    expect(scoreGlucose({ hasDiabetes: false, fastingGlucoseMgDl: 99 })).toBe(100);
    expect(scoreGlucose({ hasDiabetes: false, fastingGlucoseMgDl: 100 })).toBe(60);
    expect(scoreGlucose({ hasDiabetes: false, fastingGlucoseMgDl: 125 })).toBe(60);
  });
  test('diabético por diagnóstico: escala por HbA1c', () => {
    expect(scoreGlucose({ hasDiabetes: true, hba1cPercent: 6.9 })).toBe(40);
    expect(scoreGlucose({ hasDiabetes: true, hba1cPercent: 7 })).toBe(30);
    expect(scoreGlucose({ hasDiabetes: true, hba1cPercent: 8 })).toBe(20);
    expect(scoreGlucose({ hasDiabetes: true, hba1cPercent: 9 })).toBe(10);
    expect(scoreGlucose({ hasDiabetes: true, hba1cPercent: 10 })).toBe(0);
  });
  test('HbA1c ≥6.5 o glucemia ≥126 implican diabético aunque hasDiabetes sea false', () => {
    expect(scoreGlucose({ hasDiabetes: false, hba1cPercent: 6.5 })).toBe(40);
    expect(scoreGlucose({ hasDiabetes: false, hba1cPercent: 11 })).toBe(0);
    // glucemia ≥126 sin HbA1c: es diabético pero la escala diabética necesita HbA1c
    expect(scoreGlucose({ hasDiabetes: false, fastingGlucoseMgDl: 200 })).toBeUndefined();
  });
  test('diabético sin HbA1c → undefined (dato insuficiente)', () => {
    expect(scoreGlucose({ hasDiabetes: true, fastingGlucoseMgDl: 180 })).toBeUndefined();
    expect(scoreGlucose({ hasDiabetes: true })).toBeUndefined();
  });
  test('sin dato → undefined', () => {
    expect(scoreGlucose(undefined)).toBeUndefined();
  });
});

describe('scoreBloodPressure (mmHg)', () => {
  test('categoría por la más severa de sistólica/diastólica', () => {
    expect(scoreBloodPressure({ systolic: 119, diastolic: 79 })).toBe(100);
    expect(scoreBloodPressure({ systolic: 125, diastolic: 79 })).toBe(75);
    expect(scoreBloodPressure({ systolic: 119, diastolic: 82 })).toBe(50); // diastólica manda
    expect(scoreBloodPressure({ systolic: 135, diastolic: 79 })).toBe(50);
    expect(scoreBloodPressure({ systolic: 145, diastolic: 79 })).toBe(25);
    expect(scoreBloodPressure({ systolic: 119, diastolic: 95 })).toBe(25);
    expect(scoreBloodPressure({ systolic: 165, diastolic: 79 })).toBe(0);
    expect(scoreBloodPressure({ systolic: 119, diastolic: 105 })).toBe(0);
  });
  test('tratamiento antihipertensivo resta 20 (piso 0)', () => {
    expect(scoreBloodPressure({ systolic: 118, diastolic: 76, onAntihypertensive: true })).toBe(80);
    expect(scoreBloodPressure({ systolic: 125, diastolic: 78, onAntihypertensive: true })).toBe(55);
    expect(scoreBloodPressure({ systolic: 165, diastolic: 79, onAntihypertensive: true })).toBe(0); // piso 0
  });
  test('sin dato → undefined', () => {
    expect(scoreBloodPressure(undefined)).toBeUndefined();
    expect(scoreBloodPressure({ systolic: 120, diastolic: NaN })).toBeUndefined();
  });
});

describe('computeLE8 — compuesto solo si están los 8', () => {
  const full: LE8Inputs = {
    diet: { level: 5 }, // 100
    physicalActivityMinPerWeek: 150, // 100
    nicotine: { status: 'never' }, // 100
    sleepHoursPerNight: 8, // 100
    bmi: 22, // 100
    nonHdlMgDl: 120, // 100
    glucose: { hasDiabetes: false, hba1cPercent: 5.0 }, // 100
    bloodPressure: { systolic: 110, diastolic: 70 }, // 100
  };

  test('los 8 presentes → compuesto = promedio simple', () => {
    const r = computeLE8(full);
    expect(r.complete).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.components).toHaveLength(8);
    expect(r.composite).toBe(100);
    expect(r.compositeCategory?.level).toBe('high');
  });

  test('promedio simple real (no todos 100)', () => {
    const r = computeLE8({
      ...full,
      bmi: 32, // 30
      bloodPressure: { systolic: 150, diastolic: 95 }, // 25
    });
    // 100*6 + 30 + 25 = 655 / 8 = 81.875 → redondea a 82
    expect(r.composite).toBe(82);
  });

  test('falta un componente → sin compuesto, queda en missing', () => {
    const { sleepHoursPerNight, ...rest } = full;
    void sleepHoursPerNight;
    const r = computeLE8(rest);
    expect(r.complete).toBe(false);
    expect(r.composite).toBeUndefined();
    expect(r.compositeCategory).toBeUndefined();
    expect(r.missing).toEqual(['sleep']);
    expect(r.components).toHaveLength(7);
  });

  test('varios faltantes (caso típico: solo los 4 clínicos)', () => {
    const r = computeLE8({
      bmi: 22,
      nonHdlMgDl: 120,
      glucose: { hasDiabetes: false, hba1cPercent: 5.0 },
      bloodPressure: { systolic: 110, diastolic: 70 },
    });
    expect(r.complete).toBe(false);
    expect(r.composite).toBeUndefined();
    expect(r.missing).toEqual(['diet', 'physicalActivity', 'nicotine', 'sleep']);
    expect(r.components.map((c) => c.key)).toEqual(['bmi', 'lipids', 'glucose', 'bloodPressure']);
  });

  test('sin ningún dato → 8 faltantes, sin compuesto', () => {
    const r = computeLE8({});
    expect(r.components).toEqual([]);
    expect(r.missing).toEqual(LE8_ORDER);
    expect(r.complete).toBe(false);
  });

  test('los componentes salen en el orden de LE8_ORDER', () => {
    const r = computeLE8(full);
    expect(r.components.map((c) => c.key)).toEqual(LE8_ORDER);
  });
});
