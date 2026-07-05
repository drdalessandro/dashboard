// Panel CKM del chart del paciente: hGraph arriba, scores PREVENT abajo, el
// badge del estadío en el encabezado y acceso al cuestionario SDOH.
import { Button, Group, Paper, SimpleGrid, Stack, Text, Title, Tooltip } from '@mantine/core';
import { formatDate } from '@medplum/core';
import type { Patient, Reference } from '@medplum/fhirtypes';
import { Loading } from '@medplum/react';
import { IconAdjustments, IconClipboardText, IconFlask } from '@tabler/icons-react';
import type { JSX } from 'react';
import { Link } from 'react-router';
import { getPREVENTInputs } from '../extensions';
import { useCKMData } from '../hooks/useCKMData';
import { useScoreHistory } from '../hooks/useScoreHistory';
import { CAC_RECLASS_LEGEND, isProvisional, PROVISIONAL_NOTE } from '../risk';
import type { PreventOutcome } from '../risk';
import { MIN_TREND_POINTS, TREND_WINDOW_MONTHS } from '../score-history';
import type { ScorePoint } from '../score-history';
import { CKMStageBadge } from './CKMStageBadge';
import { HGraph } from './HGraph';
import { RiskBadge } from './RiskBadge';
import { RiskEnhancers } from './RiskEnhancers';
import { Sparkline } from './Sparkline';

export interface PREVENTPanelProps {
  patient: Patient | Reference<Patient> | string;
}

export function PREVENTPanel(props: PREVENTPanelProps): JSX.Element {
  const { patient, stage, hGraphMetrics, preventScores, loading } = useCKMData(props.patient);
  const { series } = useScoreHistory(patient);

  if (loading) {
    return <Loading />;
  }

  const sdoh = getPREVENTInputs(patient).sdoh;
  // El CAC (si existe entre las métricas) reclasifica la categoría de ASCVD.
  const cac = hGraphMetrics?.find((m) => m.id === 'cac')?.value;

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <Group justify="space-between" gap="xs" wrap="nowrap" align="flex-start">
          <Title order={4}>Salud CKM</Title>
          {stage !== undefined && <CKMStageBadge stage={stage} size="md" />}
        </Group>
        <HGraph metrics={hGraphMetrics ?? []} />
        <SimpleGrid cols={3}>
          <ScoreStat
            label="ASCVD 10 años"
            outcome="ascvd10y"
            value={preventScores?.ascvd10y}
            cac={cac}
            points={series.ascvd10y}
          />
          <ScoreStat label="IC 10 años" outcome="hf10y" value={preventScores?.hf10y} points={series.hf10y} />
          <ScoreStat
            label="ECV total 30 años"
            outcome="cvdTotal30y"
            value={preventScores?.cvdTotal30y}
            points={series.cvdTotal30y}
          />
        </SimpleGrid>
        <Text size="xs" c="dimmed">
          {PROVISIONAL_NOTE}
        </Text>
        {cac !== undefined && (
          <Text size="xs" c="dimmed">
            {CAC_RECLASS_LEGEND}
          </Text>
        )}
        <RiskEnhancers patientId={patient?.id} />
        <Button
          component={Link}
          to={`/ckm/biomarkers/${patient?.id}`}
          variant="light"
          size="xs"
          fullWidth
          leftSection={<IconFlask size={16} />}
        >
          Panel de biomarcadores
        </Button>
        <Button
          component={Link}
          to={`/ckm/simulator/${patient?.id}`}
          variant="light"
          size="xs"
          fullWidth
          leftSection={<IconAdjustments size={16} />}
        >
          Simulador ¿Y si...?
        </Button>
        <Group justify="space-between" wrap="nowrap">
          <Button
            component={Link}
            to={`/ckm/sdoh/${patient?.id}`}
            variant="light"
            size="xs"
            leftSection={<IconClipboardText size={16} />}
          >
            Cuestionario SDOH
          </Button>
          <Text size="xs" c="dimmed" ta="right">
            {sdoh
              ? `SDOH respondido el ${formatDate(sdoh.authored)}` +
                (sdoh.score !== undefined ? ` · score ${sdoh.score}` : '')
              : 'SDOH sin responder'}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}

function ScoreStat(props: {
  label: string;
  outcome: PreventOutcome;
  value?: number;
  cac?: number;
  /** Serie histórica del score (más vieja -> más nueva) para el sparkline. */
  points?: ScorePoint[];
}): JSX.Element {
  const label = isProvisional(props.outcome) ? `${props.label} *` : props.label;
  return (
    <Stack gap={4} align="center">
      <Text fz={28} fw={700} lh={1.2}>
        {props.value !== undefined ? `${props.value}%` : '—'}
      </Text>
      <RiskBadge outcome={props.outcome} value={props.value} cac={props.cac} />
      <ScoreTrend label={props.label} points={props.points} />
      <Text size="xs" c="dimmed" ta="center">
        {label}
      </Text>
    </Stack>
  );
}

/** Sparkline de la serie del score; nada con menos de MIN_TREND_POINTS puntos. */
function ScoreTrend(props: { label: string; points?: ScorePoint[] }): JSX.Element | null {
  const { label, points } = props;
  if (!points || points.length < MIN_TREND_POINTS) {
    return null;
  }
  const first = points[0];
  const last = points[points.length - 1];
  const summary =
    `${label}, últimos ${TREND_WINDOW_MONTHS} meses: ${points.length} cálculos · ` +
    `${first.value}% (${first.date.slice(0, 10)}) → ${last.value}% (${last.date.slice(0, 10)})`;
  return (
    <Tooltip label={summary} withArrow events={{ hover: true, focus: false, touch: true }}>
      <Group gap={0}>
        <Sparkline values={points.map((p) => p.value)} minSpan={2} label={summary} />
      </Group>
    </Tooltip>
  );
}
