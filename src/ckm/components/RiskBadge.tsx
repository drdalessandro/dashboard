// Badge del nivel de riesgo de un outcome PREVENT (Bajo/Limítrofe/Intermedio/
// Alto), coloreado según su tramo. Reutilizable en el panel del paciente y en
// el listado. El tooltip muestra el valor, si el tramo es provisional y la
// fuente de los umbrales.
import { Badge, Tooltip } from '@mantine/core';
import type { JSX } from 'react';
import { categorizeRiskWithCac, RISK_BANDS } from '../risk';
import type { PreventOutcome } from '../risk';

export interface RiskBadgeProps {
  outcome: PreventOutcome;
  value?: number;
  /** Score de calcio coronario (Agatston). Si se provee, reclasifica ASCVD 10a. */
  cac?: number;
  size?: 'sm' | 'md';
}

/** Devuelve null si no hay valor para categorizar (el caller decide el placeholder). */
export function RiskBadge(props: RiskBadgeProps): JSX.Element | null {
  const { outcome, value, cac, size = 'sm' } = props;
  const category = categorizeRiskWithCac(outcome, value, cac);
  if (!category) {
    return null;
  }
  const { tier, base, direction, cacNote } = category;
  const band = RISK_BANDS[outcome];
  const caveat = band.guidelineBased ? '' : ' (provisional)';
  const reclassified = direction !== 'none';
  const marker = direction === 'up' ? ' ↑' : direction === 'down' ? ' ↓' : '';
  const tooltip = reclassified
    ? `${value}% · ${base.label} → ${tier.label} por CAC${caveat}. ${cacNote} — ${band.source}`
    : `${value}% · ${tier.label}${caveat}${cacNote ? `. ${cacNote}` : ''} — ${band.source}`;
  // El badge solo muestra el nivel ("Limítrofe"); el aria-label le da al lector
  // de pantalla el valor, la salvedad y si fue reclasificado por CAC.
  const ariaLabel = `${value}% · ${tier.label}${caveat}${reclassified ? ', reclasificado por CAC' : ''}`;
  return (
    <Tooltip label={tooltip} withArrow multiline maw={340} events={{ hover: true, focus: true, touch: true }}>
      <Badge
        color={tier.color}
        variant="filled"
        autoContrast
        size={size === 'md' ? 'lg' : 'md'}
        aria-label={ariaLabel}
        style={{ cursor: 'default' }}
      >
        {tier.label}
        {marker}
      </Badge>
    </Tooltip>
  );
}
