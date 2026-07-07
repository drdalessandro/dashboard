import type { QuestionnaireResponse } from '@medplum/fhirtypes';
import { INTAKE_QUESTIONNAIRE_URL } from './constants';
import { interpretIntakeTobacco, latestIntakeTobacco, tobaccoStatusFromText } from './intake';
import { scoreNicotine } from './le8';
import { LE8_TOBACCO_QUESTIONNAIRE_URL } from './le8-questionnaires';

function intakeResponse(tobaccoText: string | undefined, authored: string): QuestionnaireResponse {
  return {
    resourceType: 'QuestionnaireResponse',
    status: 'completed',
    questionnaire: INTAKE_QUESTIONNAIRE_URL,
    authored,
    item: [
      {
        linkId: 'factores-riesgo',
        item: tobaccoText ? [{ linkId: 'fr-tabaquismo', answer: [{ valueString: tobaccoText }] }] : [],
      },
    ],
  };
}

describe('tobaccoStatusFromText', () => {
  test('ex-fumador en sus variantes', () => {
    expect(tobaccoStatusFromText('Ex fumador/a')).toBe('former');
    expect(tobaccoStatusFromText('ex-fumadora')).toBe('former');
    expect(tobaccoStatusFromText('Exfumador')).toBe('former');
    expect(tobaccoStatusFromText('Dejé de fumar hace 10 años')).toBe('former');
  });

  test('fumador actual (incluye texto no clasificable como ex/nunca)', () => {
    expect(tobaccoStatusFromText('Fumador/a actual')).toBe('current');
    expect(tobaccoStatusFromText('Fumo 10 por día')).toBe('current');
    expect(tobaccoStatusFromText('Sí, fumo')).toBe('current');
  });

  test('nunca fumó', () => {
    expect(tobaccoStatusFromText('Nunca fumé')).toBe('never');
    expect(tobaccoStatusFromText('No fumo')).toBe('never');
    expect(tobaccoStatusFromText('Jamás he fumado')).toBe('never');
  });

  test('texto sin mención reconocible de tabaco: undefined (no inventa estado)', () => {
    expect(tobaccoStatusFromText('Vapeo únicamente')).toBeUndefined();
    expect(tobaccoStatusFromText('N/A')).toBeUndefined();
    expect(tobaccoStatusFromText('')).toBeUndefined();
  });
});

describe('interpretIntakeTobacco', () => {
  test('caso real Clara Podesta: "Ex fumador/a" → former, puntuable por LE8', () => {
    const nicotine = interpretIntakeTobacco(intakeResponse('Ex fumador/a', '2026-07-07T13:45:46.235Z'));
    expect(nicotine).toEqual({ status: 'former' });
    // Sin años desde que dejó, el motor asume <1 año (conservador): 25/100.
    expect(scoreNicotine(nicotine)).toBe(25);
  });

  test('sin respuesta de tabaquismo: undefined', () => {
    expect(interpretIntakeTobacco(intakeResponse(undefined, '2026-07-07T00:00:00Z'))).toBeUndefined();
  });
});

describe('latestIntakeTobacco', () => {
  test('usa la respuesta de intake más reciente e ignora las de otros cuestionarios', () => {
    const le8Tobacco: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: LE8_TOBACCO_QUESTIONNAIRE_URL,
      authored: '2026-07-09T00:00:00Z',
      item: [{ linkId: 'fr-tabaquismo', answer: [{ valueString: 'Fumador/a actual' }] }],
    };
    const responses = [
      intakeResponse('Fumador/a actual', '2026-07-01T00:00:00Z'),
      intakeResponse('Ex fumador/a', '2026-07-07T00:00:00Z'),
      le8Tobacco,
    ];
    expect(latestIntakeTobacco(responses)).toEqual({ status: 'former' });
  });

  test('saltea intakes sin tabaco interpretable y cae al anterior', () => {
    const responses = [
      intakeResponse('Ex fumador/a', '2026-07-01T00:00:00Z'),
      intakeResponse(undefined, '2026-07-07T00:00:00Z'),
    ];
    expect(latestIntakeTobacco(responses)).toEqual({ status: 'former' });
  });

  test('descarta entered-in-error', () => {
    const errored = { ...intakeResponse('Fumador/a actual', '2026-07-08T00:00:00Z'), status: 'entered-in-error' as const };
    const responses = [errored, intakeResponse('Ex fumador/a', '2026-07-01T00:00:00Z')];
    expect(latestIntakeTobacco(responses)).toEqual({ status: 'former' });
  });

  test('sin intakes: undefined', () => {
    expect(latestIntakeTobacco([])).toBeUndefined();
  });
});
