// Potenciadores de riesgo (ApoB, Lp(a)) mostrados junto a los scores PREVENT
// en el panel del paciente. Etapa 3: display-only — informan, no modifican el
// score. Cada chip muestra valor + nivel coloreado; el tooltip da los rangos,
// la interpretación clínica y la fuente.
import { Badge, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { JSX } from 'react';
import { RISK_ENHANCERS } from '../biomarkers';
import type { EnhancerDefinition, EnhancerReading } from '../biomarkers';
import { useRiskEnhancers } from '../hooks/useRiskEnhancers';
import { formatUnit } from '../units';

const SECTION_HELP =
  'Marcadores que, elevados, aumentan el riesgo más allá del score PREVENT y pueden justificar ' +
  'tratamiento más intensivo aunque el riesgo calculado sea limítrofe/intermedio (risk enhancers, ACC/AHA). ' +
  'Informativos: no modifican el cálculo de PREVENT.';

export interface RiskEnhancersProps {
  patientId: string | undefined;
}

export function RiskEnhancers(props: RiskEnhancersProps): JSX.Element | null {
  const { readings, loading } = useRiskEnhancers(props.patientId);

  if (loading) {
    return null;
  }

  return (
    <Stack gap={4}>
      <Group gap={6} wrap="nowrap">
        <Text size="sm" fw={600}>
          Potenciadores de riesgo
        </Text>
        <Tooltip label={SECTION_HELP} withArrow multiline maw={340} events={{ hover: true, focus: false, touch: true }}>
          <IconInfoCircle
            size={15}
            role="img"
            color="var(--mantine-color-dimmed)"
            aria-label="Qué son los potenciadores de riesgo"
          />
        </Tooltip>
      </Group>
      <Group gap="xs">
        {RISK_ENHANCERS.map((def) => (
          <EnhancerChip key={def.id} def={def} reading={readings.find((r) => r.def.id === def.id)} />
        ))}
      </Group>
    </Stack>
  );
}

function EnhancerChip(props: { def: EnhancerDefinition; reading?: EnhancerReading }): JSX.Element {
  const { def, reading } = props;

  if (!reading) {
    return (
      <Badge color="gray" variant="light" size="md" style={{ cursor: 'default' }}>
        {def.label} sin dato
      </Badge>
    );
  }

  const { value, unit, info } = reading;
  const displayUnit = formatUnit(unit) ?? def.unit;
  const tooltip =
    `${def.label} ${value} ${displayUnit} · ${info.label}. ` +
    `Óptimo < ${def.optimalBelow}, convencional < ${def.conventionalBelow} ${def.unit}. ` +
    `${def.interpretation} (Fuente: ${def.source})`;

  return (
    <Tooltip label={tooltip} withArrow multiline maw={340} events={{ hover: true, focus: false, touch: true }}>
      <Badge
        color={info.color}
        variant="light"
        size="md"
        aria-label={`${def.label} ${value} ${displayUnit} · ${info.label}`}
        style={{ cursor: 'default' }}
      >
        {def.label} {value} {displayUnit} · {info.label}
      </Badge>
    </Tooltip>
  );
}
