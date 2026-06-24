// Badge del nivel de riesgo de un outcome PREVENT (Bajo/Limítrofe/Intermedio/
// Alto), coloreado según su tramo. Reutilizable en el panel del paciente y en
// el listado. El tooltip muestra el valor, si el tramo es provisional y la
// fuente de los umbrales.
import { Badge, Tooltip } from '@mantine/core';
import type { JSX } from 'react';
import { categorizeRisk, RISK_BANDS } from '../risk';
import type { PreventOutcome } from '../risk';

export interface RiskBadgeProps {
  outcome: PreventOutcome;
  value?: number;
  size?: 'sm' | 'md';
}

/** Devuelve null si no hay valor para categorizar (el caller decide el placeholder). */
export function RiskBadge(props: RiskBadgeProps): JSX.Element | null {
  const { outcome, value, size = 'sm' } = props;
  const tier = categorizeRisk(outcome, value);
  if (!tier) {
    return null;
  }
  const band = RISK_BANDS[outcome];
  const provisional = !band.guidelineBased;
  const caveat = provisional ? ' (provisional)' : '';
  const tooltip = `${value}% · ${tier.label}${caveat} — ${band.source}`;
  // El badge solo muestra el nivel ("Limítrofe"); el aria-label le da al lector
  // de pantalla el valor y la salvedad, que si no quedan solo en el tooltip.
  const ariaLabel = `${value}% · ${tier.label}${caveat}`;
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
      </Badge>
    </Tooltip>
  );
}
