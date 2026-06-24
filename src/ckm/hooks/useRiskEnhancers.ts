// Hook que trae las Observations de los potenciadores de riesgo (ApoB, Lp(a))
// de un paciente y devuelve la última lectura clasificada de cada uno.
// Etapa 3: lectura en vivo desde el servidor, sin pasar por el bot ni la
// extensión hGraphData (no modifica el cálculo de PREVENT).
import { useMedplum } from '@medplum/react';
import { useEffect, useState } from 'react';
import { ENHANCER_LOINC_CODES, readEnhancers } from '../biomarkers';
import type { EnhancerReading } from '../biomarkers';

export interface RiskEnhancersData {
  readings: EnhancerReading[];
  loading: boolean;
}

export function useRiskEnhancers(patientId: string | undefined): RiskEnhancersData {
  const medplum = useMedplum();
  const [readings, setReadings] = useState<EnhancerReading[]>();

  useEffect(() => {
    if (!patientId) {
      setReadings([]);
      return;
    }
    let cancelled = false;
    medplum
      .searchResources('Observation', {
        subject: `Patient/${patientId}`,
        code: ENHANCER_LOINC_CODES.join(','),
        _sort: '-date',
        _count: '50',
      })
      .then((observations) => {
        if (!cancelled) {
          setReadings(readEnhancers(observations));
        }
      })
      .catch((err) => {
        console.error('Potenciadores de riesgo: error buscando Observations', err);
        if (!cancelled) {
          setReadings([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [medplum, patientId]);

  return { readings: readings ?? [], loading: readings === undefined };
}
