// Trae la serie histórica de scores PREVENT del paciente (Observations del
// CodeSystem ckm-scores que persiste el bot ckm-recalculate), acotada a la
// ventana de tendencia. Solo lectura.
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { useEffect, useState } from 'react';
import { CKM_SCORES_SYSTEM } from '../constants';
import type { PreventOutcome } from '../risk';
import { SCORE_CODES, scorePointsFromObservations, TREND_WINDOW_MONTHS } from '../score-history';
import type { ScorePoint } from '../score-history';

export interface ScoreHistoryData {
  /** Serie por outcome, de más vieja a más nueva (como espera el Sparkline). */
  series: Partial<Record<PreventOutcome, ScorePoint[]>>;
  loading: boolean;
}

const EMPTY: Partial<Record<PreventOutcome, ScorePoint[]>> = {};

/** Hook con la serie de scores del paciente en los últimos 12 meses. */
export function useScoreHistory(patient: Patient | undefined): ScoreHistoryData {
  const medplum = useMedplum();
  const [state, setState] = useState<ScoreHistoryData>({ series: EMPTY, loading: true });

  useEffect(() => {
    if (!patient?.id) {
      setState({ series: EMPTY, loading: false });
      return;
    }
    let cancelled = false;
    setState({ series: EMPTY, loading: true });

    const since = new Date();
    since.setMonth(since.getMonth() - TREND_WINDOW_MONTHS);

    (async () => {
      const observations = await medplum.searchResources('Observation', {
        subject: `Patient/${patient.id}`,
        code: Object.values(SCORE_CODES)
          .map((c) => `${CKM_SCORES_SYSTEM}|${c.code}`)
          .join(','),
        date: `ge${since.toISOString()}`,
        _sort: 'date',
        _count: '500',
      });
      if (!cancelled) {
        setState({ series: scorePointsFromObservations(observations), loading: false });
      }
    })().catch((err) => {
      console.error('useScoreHistory', err);
      if (!cancelled) {
        setState({ series: EMPTY, loading: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [medplum, patient]);

  return state;
}
