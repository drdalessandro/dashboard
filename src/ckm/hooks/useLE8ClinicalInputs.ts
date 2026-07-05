// Trae del servidor los 4 componentes clínicos de LE8 (presión, IMC, lípidos
// no-HDL, glucosa) y su tendencia (sub-scores recalculados sobre el historial
// de Observations). Hace exactamente las mismas búsquedas y deriva los flags
// con los mismos criterios que usePreventBaseline / el bot ckm-recalculate, así
// el LE8 es coherente con el resto del panel. No persiste nada: solo lee.
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { useEffect, useState } from 'react';
import { deriveMedicationFlags, hasDiabetes, isActiveCondition } from '../clinical';
import { clinicalLE8Inputs } from '../le8-clinical';
import type { ClinicalLE8Inputs } from '../le8-clinical';
import { le8ClinicalTrend } from '../le8-history';
import type { LE8ClinicalKey, LE8TrendPoint } from '../le8-history';
import { fetchCKMObservations, groupCKMValues, latestCKMValues } from '../observations';

export interface LE8ClinicalData {
  /** Los 4 componentes clínicos disponibles (los que falten quedan fuera). */
  inputs: ClinicalLE8Inputs;
  /** Serie de sub-scores por componente clínico (últimos 12 meses). */
  trend: Partial<Record<LE8ClinicalKey, LE8TrendPoint[]>>;
  loading: boolean;
}

// Referencias estables para el estado vacío, así los consumidores que derivan
// memos no entran en loop.
const EMPTY: ClinicalLE8Inputs = {};
const EMPTY_TREND: Partial<Record<LE8ClinicalKey, LE8TrendPoint[]>> = {};

/** Hook que devuelve los componentes clínicos de LE8 del paciente. */
export function useLE8ClinicalInputs(patient: Patient | undefined): LE8ClinicalData {
  const medplum = useMedplum();
  const [state, setState] = useState<LE8ClinicalData>({ inputs: EMPTY, trend: EMPTY_TREND, loading: true });

  useEffect(() => {
    if (!patient?.id) {
      setState({ inputs: EMPTY, trend: EMPTY_TREND, loading: false });
      return;
    }
    let cancelled = false;
    setState({ inputs: EMPTY, trend: EMPTY_TREND, loading: true });

    (async () => {
      const patientId = patient.id as string;
      const [observations, conditions, medications] = await Promise.all([
        fetchCKMObservations(medplum, patientId),
        medplum.searchResources('Condition', { subject: `Patient/${patientId}`, _count: '200' }),
        medplum.searchResources('MedicationRequest', {
          subject: `Patient/${patientId}`,
          status: 'active',
          _count: '100',
        }),
      ]);
      if (cancelled) {
        return;
      }
      const active = conditions.filter(isActiveCondition);
      const { onAntihypertensive } = deriveMedicationFlags(medications);
      const flags = { diabetes: hasDiabetes(active), onAntihypertensive };
      const inputs = clinicalLE8Inputs(latestCKMValues(observations), flags);
      const trend = le8ClinicalTrend(groupCKMValues(observations), flags);
      setState({ inputs, trend, loading: false });
    })().catch((err) => {
      console.error('useLE8ClinicalInputs', err);
      if (!cancelled) {
        setState({ inputs: EMPTY, trend: EMPTY_TREND, loading: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [medplum, patient]);

  return state;
}
