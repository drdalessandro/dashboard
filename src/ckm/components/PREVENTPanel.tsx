// Panel CKM del chart del paciente: hGraph arriba, scores PREVENT abajo y el
// badge del estadío en el encabezado.
import { Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { Patient, Reference } from '@medplum/fhirtypes';
import { Loading } from '@medplum/react';
import type { JSX } from 'react';
import { useCKMData } from '../hooks/useCKMData';
import { CKMStageBadge } from './CKMStageBadge';
import { HGraph } from './HGraph';

export interface PREVENTPanelProps {
  patient: Patient | Reference<Patient> | string;
}

export function PREVENTPanel(props: PREVENTPanelProps): JSX.Element {
  const { stage, hGraphMetrics, preventScores, loading } = useCKMData(props.patient);

  if (loading) {
    return <Loading />;
  }

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap">
          <Title order={4}>Salud CKM</Title>
          {stage !== undefined && <CKMStageBadge stage={stage} size="md" />}
        </Group>
        <HGraph metrics={hGraphMetrics ?? []} />
        <SimpleGrid cols={3}>
          <ScoreStat label="ASCVD 10 años" value={preventScores?.ascvd10y} />
          <ScoreStat label="IC 10 años" value={preventScores?.hf10y} />
          <ScoreStat label="ECV total 30 años" value={preventScores?.cvdTotal30y} />
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

function ScoreStat(props: { label: string; value?: number }): JSX.Element {
  return (
    <Stack gap={0} align="center">
      <Text fz={28} fw={700} lh={1.2}>
        {props.value !== undefined ? `${props.value}%` : '—'}
      </Text>
      <Text size="xs" c="dimmed" ta="center">
        {props.label}
      </Text>
    </Stack>
  );
}
