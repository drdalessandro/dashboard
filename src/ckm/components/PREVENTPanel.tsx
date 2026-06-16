// Panel CKM del chart del paciente: hGraph arriba, scores PREVENT abajo, el
// badge del estadío en el encabezado y acceso al cuestionario SDOH.
import { Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { formatDate } from '@medplum/core';
import type { Patient, Reference } from '@medplum/fhirtypes';
import { Loading } from '@medplum/react';
import { IconAdjustments, IconClipboardText } from '@tabler/icons-react';
import type { JSX } from 'react';
import { Link } from 'react-router';
import { getPREVENTInputs } from '../extensions';
import { useCKMData } from '../hooks/useCKMData';
import { CKMStageBadge } from './CKMStageBadge';
import { HGraph } from './HGraph';

export interface PREVENTPanelProps {
  patient: Patient | Reference<Patient> | string;
}

export function PREVENTPanel(props: PREVENTPanelProps): JSX.Element {
  const { patient, stage, hGraphMetrics, preventScores, loading } = useCKMData(props.patient);

  if (loading) {
    return <Loading />;
  }

  const sdoh = getPREVENTInputs(patient).sdoh;

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
