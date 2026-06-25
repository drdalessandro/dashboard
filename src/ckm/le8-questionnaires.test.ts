import type { QuestionnaireResponse, QuestionnaireResponseItemAnswer } from '@medplum/fhirtypes';
import {
  interpretActivity,
  interpretDiet,
  interpretLE8Questionnaires,
  interpretSleep,
  interpretTobacco,
  LE8_ACTIVITY_QUESTIONNAIRE_URL,
  LE8_DIET_QUESTIONNAIRE_URL,
  LE8_SLEEP_QUESTIONNAIRE_URL,
  LE8_TOBACCO_QUESTIONNAIRE_URL,
  mepaLevel,
  scorePsqi,
} from './le8-questionnaires';
import type { PsqiAnswers } from './le8-questionnaires';

/** Arma un QuestionnaireResponse desde linkId -> answer. */
function resp(
  url: string,
  answers: Record<string, QuestionnaireResponseItemAnswer>,
  authored?: string
): QuestionnaireResponse {
  return {
    resourceType: 'QuestionnaireResponse',
    status: 'completed',
    questionnaire: url,
    authored,
    item: Object.entries(answers).map(([linkId, answer]) => ({ linkId, answer: [answer] })),
  };
}

// PSQI buen dormidor: latencia corta, 7.5 h, eficiencia alta, sin alteraciones.
const goodSleeper: PsqiAnswers = {
  bedtimeMinutes: 23 * 60,
  waketimeMinutes: 7 * 60,
  latencyMinutes: 10,
  hoursSlept: 7.5,
  disturbances: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  quality: 0,
  medication: 0,
  stayingAwake: 0,
  enthusiasm: 0,
};

// PSQI mal dormidor (global calculado a mano = 12).
const poorSleeper: PsqiAnswers = {
  bedtimeMinutes: 23 * 60,
  waketimeMinutes: 7 * 60, // 8 h en cama
  latencyMinutes: 45, // sub 2
  hoursSlept: 5.5,
  disturbances: [2, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 5a=2 (latencia); 5b..5j suman 9
  quality: 2,
  medication: 1,
  stayingAwake: 2,
  enthusiasm: 1,
};

describe('scorePsqi', () => {
  test('buen dormidor → global 0 y todos los componentes 0', () => {
    const r = scorePsqi(goodSleeper);
    expect(r.global).toBe(0);
    expect(r.components).toEqual({
      quality: 0,
      latency: 0,
      duration: 0,
      efficiency: 0,
      disturbances: 0,
      medication: 0,
      daytime: 0,
    });
  });

  test('mal dormidor → global 12 con los componentes esperados', () => {
    const r = scorePsqi(poorSleeper);
    expect(r.components).toEqual({
      quality: 2,
      latency: 2, // band6(2+2=4) = 2
      duration: 2, // 5.5 h
      efficiency: 2, // 5.5/8 = 68.75%
      disturbances: 1, // suma 9
      medication: 1,
      daytime: 2, // band6(2+1=3) = 2
    });
    expect(r.global).toBe(12);
  });

  test('falta un componente → global undefined pero la duración se calcula igual', () => {
    const r = scorePsqi({ ...goodSleeper, quality: undefined });
    expect(r.global).toBeUndefined();
    expect(r.components.duration).toBe(0);
    expect(r.components.quality).toBeUndefined();
  });

  test('cruce de medianoche: 23:30 a 06:30 = 7 h en cama', () => {
    const r = scorePsqi({ ...goodSleeper, bedtimeMinutes: 23 * 60 + 30, waketimeMinutes: 6 * 60 + 30, hoursSlept: 7 });
    // 7/7 = 100% → eficiencia 0
    expect(r.components.efficiency).toBe(0);
  });
});

describe('interpretSleep', () => {
  test('extrae horas (para LE8) y PSQI del QuestionnaireResponse', () => {
    const response = resp(LE8_SLEEP_QUESTIONNAIRE_URL, {
      'psqi-1-bedtime': { valueTime: '23:00:00' },
      'psqi-3-waketime': { valueTime: '07:00:00' },
      'psqi-2-latency-min': { valueInteger: 10 },
      'psqi-4-hours': { valueDecimal: 7.5 },
      'psqi-5a': { valueInteger: 0 },
      'psqi-6-quality': { valueInteger: 0 },
      'psqi-7-medication': { valueInteger: 0 },
      'psqi-8-staying-awake': { valueInteger: 0 },
      'psqi-9-enthusiasm': { valueInteger: 0 },
    });
    const { sleepHoursPerNight, psqi } = interpretSleep(response);
    expect(sleepHoursPerNight).toBe(7.5);
    expect(psqi.components.duration).toBe(0);
  });
});

describe('mepaLevel (0–16 → 1–5)', () => {
  test('cortes provisionales por quintil', () => {
    expect(mepaLevel(0)).toBe(1);
    expect(mepaLevel(3)).toBe(1);
    expect(mepaLevel(4)).toBe(2);
    expect(mepaLevel(6)).toBe(2);
    expect(mepaLevel(7)).toBe(3);
    expect(mepaLevel(9)).toBe(3);
    expect(mepaLevel(10)).toBe(4);
    expect(mepaLevel(12)).toBe(4);
    expect(mepaLevel(13)).toBe(5);
    expect(mepaLevel(16)).toBe(5);
  });
});

describe('interpretDiet', () => {
  test('cuenta los favorables (true) y mapea a nivel', () => {
    const answers: Record<string, QuestionnaireResponseItemAnswer> = {};
    for (let i = 1; i <= 16; i++) {
      answers[`mepa-${i}`] = { valueBoolean: i <= 10 }; // 10 favorables
    }
    const r = interpretDiet(resp(LE8_DIET_QUESTIONNAIRE_URL, answers));
    expect(r.mepaScore).toBe(10);
    expect(r.diet).toEqual({ level: 4 });
  });

  test('sin respuestas → vacío', () => {
    expect(interpretDiet(resp(LE8_DIET_QUESTIONNAIRE_URL, {}))).toEqual({});
  });
});

describe('interpretActivity (Exercise Vital Sign)', () => {
  test('días × minutos = min/semana', () => {
    const r = interpretActivity(
      resp(LE8_ACTIVITY_QUESTIONNAIRE_URL, { 'evs-days': { valueInteger: 5 }, 'evs-minutes': { valueInteger: 30 } })
    );
    expect(r.physicalActivityMinPerWeek).toBe(150);
  });
  test('falta un ítem → vacío', () => {
    expect(interpretActivity(resp(LE8_ACTIVITY_QUESTIONNAIRE_URL, { 'evs-days': { valueInteger: 5 } }))).toEqual({});
  });
});

describe('interpretTobacco', () => {
  test('ex fumador con años desde que dejó', () => {
    const r = interpretTobacco(
      resp(LE8_TOBACCO_QUESTIONNAIRE_URL, {
        'tobacco-status': { valueCoding: { code: 'former' } },
        'tobacco-quit-years': { valueDecimal: 6 },
        'tobacco-secondhand': { valueBoolean: false },
      })
    );
    expect(r.nicotine).toEqual({
      status: 'former',
      yearsSinceQuit: 6,
      inhaledNicotineOnly: undefined,
      secondhandAtHome: false,
    });
  });
  test('status inválido o ausente → vacío', () => {
    expect(interpretTobacco(resp(LE8_TOBACCO_QUESTIONNAIRE_URL, {}))).toEqual({});
  });
});

describe('interpretLE8Questionnaires', () => {
  test('combina los 4 cuestionarios en inputs conductuales + datos clínicos', () => {
    const sleepAnswers: Record<string, QuestionnaireResponseItemAnswer> = {
      'psqi-4-hours': { valueDecimal: 8 },
    };
    const dietAnswers: Record<string, QuestionnaireResponseItemAnswer> = {};
    for (let i = 1; i <= 16; i++) {
      dietAnswers[`mepa-${i}`] = { valueBoolean: i <= 14 };
    }
    const responses: QuestionnaireResponse[] = [
      resp(LE8_SLEEP_QUESTIONNAIRE_URL, sleepAnswers),
      resp(LE8_DIET_QUESTIONNAIRE_URL, dietAnswers),
      resp(LE8_ACTIVITY_QUESTIONNAIRE_URL, { 'evs-days': { valueInteger: 4 }, 'evs-minutes': { valueInteger: 40 } }),
      resp(LE8_TOBACCO_QUESTIONNAIRE_URL, { 'tobacco-status': { valueCoding: { code: 'never' } } }),
    ];
    const r = interpretLE8Questionnaires(responses);
    expect(r.inputs.sleepHoursPerNight).toBe(8);
    expect(r.inputs.diet).toEqual({ level: 5 }); // 14 favorables
    expect(r.inputs.physicalActivityMinPerWeek).toBe(160);
    expect(r.inputs.nicotine?.status).toBe('never');
    expect(r.psqi).toBeDefined();
    expect(r.mepaScore).toBe(14);
  });

  test('toma la respuesta más reciente por authored', () => {
    const old = resp(LE8_ACTIVITY_QUESTIONNAIRE_URL, { 'evs-days': { valueInteger: 1 }, 'evs-minutes': { valueInteger: 10 } }, '2026-01-01T00:00:00Z');
    const recent = resp(LE8_ACTIVITY_QUESTIONNAIRE_URL, { 'evs-days': { valueInteger: 5 }, 'evs-minutes': { valueInteger: 30 } }, '2026-06-01T00:00:00Z');
    const r = interpretLE8Questionnaires([old, recent]);
    expect(r.inputs.physicalActivityMinPerWeek).toBe(150); // la reciente
  });

  test('sin respuestas → inputs vacíos', () => {
    expect(interpretLE8Questionnaires([])).toEqual({ inputs: {} });
  });
});
