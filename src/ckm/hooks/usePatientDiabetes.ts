// Detecta si el paciente tiene diabetes a partir de sus Conditions activas,
// con el mismo criterio (ICD-10 E10-E14) que usan PREVENT, el estadiaje CKM y
// los bots. Se usa para elevar el tramo de objetivo lipídico (la guía 2026 pide
// reducir LDL-C ≥50 % en diabéticos con riesgo intermedio o mayor). Solo lee.
import { useMedplum } from '@medplum/react';
import { useEffect, useState } from 'react';
import { hasDiabetes, isActiveCondition } from '../clinical';

export interface PatientDiabetesResult {
  /** true si alguna Condition activa codifica diabetes (ICD-10 E10-E14). */
  hasDiabetes: boolean;
  /** true mientras se resuelve la búsqueda de Conditions. */
  loading: boolean;
}

/**
 * Devuelve el estado de diabetes del paciente y si aún está cargando. El panel
 * debe esperar a `loading === false` antes de calcular el objetivo lipídico, así
 * un diabético no ve por un instante el objetivo laxo (falso "En objetivo").
 * Ante error o sin paciente devuelve `hasDiabetes: false`.
 */
export function usePatientDiabetes(patientId: string | undefined): PatientDiabetesResult {
  const medplum = useMedplum();
  const [state, setState] = useState<PatientDiabetesResult>({ hasDiabetes: false, loading: Boolean(patientId) });

  useEffect(() => {
    if (!patientId) {
      setState({ hasDiabetes: false, loading: false });
      return;
    }
    let cancelled = false;
    setState({ hasDiabetes: false, loading: true });
    void (async () => {
      try {
        const conditions = await medplum.searchResources('Condition', {
          subject: `Patient/${patientId}`,
          _count: '200',
        });
        if (!cancelled) {
          setState({ hasDiabetes: hasDiabetes(conditions.filter(isActiveCondition)), loading: false });
        }
      } catch (err) {
        console.error('usePatientDiabetes', err);
        if (!cancelled) {
          setState({ hasDiabetes: false, loading: false });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [medplum, patientId]);

  return state;
}
