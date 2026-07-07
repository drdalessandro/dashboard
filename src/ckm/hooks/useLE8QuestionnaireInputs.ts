// Trae del servidor los QuestionnaireResponse de LE8 que cargó el paciente
// (sueño/PSQI, dieta/MEPA, actividad/EVS, tabaco) y los interpreta a los 4
// componentes conductuales de LE8 + los datos clínicos de display (PSQI, MEPA).
// El componente tabaco tiene un fallback: si no hay respuesta del cuestionario
// LE8 de tabaco, se interpreta el ítem fr-tabaquismo del intake clínico
// (texto libre, sin años desde que dejó — el motor asume <1 año, conservador).
// Solo lee, no persiste; el profesional no ve el formulario en blanco.
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { useEffect, useState } from 'react';
import { INTAKE_QUESTIONNAIRE_URL } from '../constants';
import { latestIntakeTobacco } from '../intake';
import { ALL_LE8_QUESTIONNAIRE_URLS, interpretLE8Questionnaires } from '../le8-questionnaires';
import type { BehavioralLE8Inputs, PsqiResult } from '../le8-questionnaires';

const LE8_QUESTIONNAIRE_URLS = [...ALL_LE8_QUESTIONNAIRE_URLS, INTAKE_QUESTIONNAIRE_URL];

export interface LE8QuestionnaireInputs {
  inputs: BehavioralLE8Inputs;
  psqi?: PsqiResult;
  mepaScore?: number;
  /** De dónde salió el componente tabaco: cuestionario LE8 o intake clínico. */
  nicotineSource?: 'le8' | 'intake';
  loading: boolean;
}

const EMPTY: BehavioralLE8Inputs = {};

/** Hook que devuelve los componentes conductuales de LE8 del paciente. */
export function useLE8QuestionnaireInputs(patient: Patient | undefined): LE8QuestionnaireInputs {
  const medplum = useMedplum();
  const [state, setState] = useState<LE8QuestionnaireInputs>({ inputs: EMPTY, loading: true });

  useEffect(() => {
    if (!patient?.id) {
      setState({ inputs: EMPTY, loading: false });
      return;
    }
    let cancelled = false;
    setState({ inputs: EMPTY, loading: true });

    medplum
      .searchResources('QuestionnaireResponse', {
        subject: `Patient/${patient.id}`,
        questionnaire: LE8_QUESTIONNAIRE_URLS.join(','),
        _sort: '-authored',
        _count: '100',
      })
      .then((responses) => {
        if (cancelled) {
          return;
        }
        const { inputs, psqi, mepaScore } = interpretLE8Questionnaires(responses);
        let nicotineSource: 'le8' | 'intake' | undefined = inputs.nicotine ? 'le8' : undefined;
        if (!inputs.nicotine) {
          const fallback = latestIntakeTobacco(responses);
          if (fallback) {
            inputs.nicotine = fallback;
            nicotineSource = 'intake';
          }
        }
        setState({ inputs, psqi, mepaScore, nicotineSource, loading: false });
      })
      .catch((err) => {
        console.error('useLE8QuestionnaireInputs', err);
        if (!cancelled) {
          setState({ inputs: EMPTY, loading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [medplum, patient]);

  return state;
}
