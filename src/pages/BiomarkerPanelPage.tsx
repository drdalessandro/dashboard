// Panel de biomarcadores BioWellness de un paciente, agrupado por categoría
// (metabólico, lipídico, inflamación, …). Para cada biomarcador muestra el
// último valor del paciente, los rangos convencional/óptimo y un estado
// (Óptimo/Normal/Alto/Bajo) clasificado contra los rangos de su
// ObservationDefinition. Solo lectura.
import { Accordion, Alert, Anchor, Badge, Group, Loader, Paper, Stack, Table, Text, Title, Tooltip } from '@mantine/core';
import { formatHumanName } from '@medplum/core';
import type { HumanName } from '@medplum/fhirtypes';
import { IconArrowLeft, IconDatabaseImport, IconInfoCircle } from '@tabler/icons-react';
import type { JSX } from 'react';
import { Link, useParams } from 'react-router';
import { useBiomarkerPanel } from '../ckm/hooks/useBiomarkerPanel';
import { classifyBiomarkerValue } from '../ckm/observation-definitions';
import type { BiomarkerDefinition, BiomarkerPanelGroup, CodedValue } from '../ckm/observation-definitions';

const DEFAULT_OPEN = ['metabolico', 'lipidico', 'inflamacion'];

export function BiomarkerPanelPage(): JSX.Element {
  const { patientId } = useParams();
  const { patient, groups, valuesByCode, gender, loading } = useBiomarkerPanel(patientId);

  if (loading) {
    return <Loader m="xl" />;
  }

  const patientName = patient?.name?.[0] ? formatHumanName(patient.name[0] as HumanName) : 'Paciente';

  return (
    <Paper shadow="xs" m="md" p="md" maw={1000} mx="auto">
      <Stack gap="md">
        <Stack gap={4}>
          <Anchor component={Link} to={`/Patient/${patientId}`} size="sm">
            <Group gap={4} wrap="nowrap">
              <IconArrowLeft size={14} />
              Volver al chart
            </Group>
          </Anchor>
          <Title order={3}>Panel de biomarcadores</Title>
          <Text c="dimmed" size="sm">
            {patientName} · {groups.reduce((n, g) => n + g.defs.length, 0)} biomarcadores BioWellness. Estado clasificado
            contra los rangos convencional y óptimo (Medicina 3.0) de cada definición.
          </Text>
        </Stack>

        {groups.length === 0 ? (
          <Alert color="yellow" icon={<IconDatabaseImport size={18} />} title="No hay definiciones cargadas">
            <Text size="sm">
              No se encontraron ObservationDefinitions de biomarcadores. Cargá el panel desde{' '}
              <Anchor component={Link} to="/upload/biomarkers">
                Upload Biomarker Definitions
              </Anchor>{' '}
              y volvé a esta página.
            </Text>
          </Alert>
        ) : (
          <Accordion multiple defaultValue={DEFAULT_OPEN} variant="separated">
            {groups.map((group) => (
              <PanelSection key={group.panelCode} group={group} valuesByCode={valuesByCode} gender={gender} />
            ))}
          </Accordion>
        )}

        <Text size="xs" c="dimmed">
          Rangos óptimos de referencia (Medicina 3.0): orientativos, revisar con el equipo médico. El estado se calcula
          según el género del paciente cuando la definición lo distingue.
        </Text>
      </Stack>
    </Paper>
  );
}

function PanelSection(props: {
  group: BiomarkerPanelGroup;
  valuesByCode: Map<string, CodedValue>;
  gender?: string;
}): JSX.Element {
  const { group, valuesByCode, gender } = props;
  const withData = group.defs.filter((d) => d.code && valuesByCode.has(d.code)).length;

  return (
    <Accordion.Item value={group.panelCode}>
      <Accordion.Control>
        <Group justify="space-between" wrap="nowrap" pr="md">
          <Text fw={600}>{group.panelDisplay}</Text>
          <Text size="xs" c="dimmed">
            {withData}/{group.defs.length} con datos
          </Text>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Table verticalSpacing="xs" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Biomarcador</Table.Th>
              <Table.Th>Valor</Table.Th>
              <Table.Th>Convencional</Table.Th>
              <Table.Th>Óptimo</Table.Th>
              <Table.Th>Estado</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {group.defs.map((def) => (
              <BiomarkerRow
                key={def.biomarcadorId ?? def.code ?? def.label}
                def={def}
                reading={def.code ? valuesByCode.get(def.code) : undefined}
                gender={gender}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

function BiomarkerRow(props: { def: BiomarkerDefinition; reading?: CodedValue; gender?: string }): JSX.Element {
  const { def, reading, gender } = props;
  const status = classifyBiomarkerValue(def, reading?.value, gender);

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap={6} wrap="nowrap">
          <Text size="sm">{def.label}</Text>
          {(def.interpretation || def.source) && (
            <Tooltip
              label={`${def.interpretation ?? ''}${def.source ? ` (Fuente: ${def.source})` : ''}`}
              withArrow
              multiline
              maw={360}
              events={{ hover: true, focus: true, touch: true }}
            >
              <IconInfoCircle size={14} color="var(--mantine-color-dimmed)" aria-label={`Sobre ${def.label}`} />
            </Tooltip>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        {reading ? (
          <Text size="sm">
            {reading.value} {reading.unit ?? def.unit ?? ''}
          </Text>
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {def.conventionalText ?? '—'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {def.optimalText ?? '—'}
        </Text>
      </Table.Td>
      <Table.Td>
        {reading ? (
          <Badge color={status.color} variant="light" autoContrast style={{ cursor: 'default' }}>
            {status.label}
          </Badge>
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
