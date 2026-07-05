// Panel de biomarcadores de un paciente. Dos secciones: el "Núcleo
// cardiovascular" con respaldo de guía (ACC/AHA, ADA, KDIGO) y el
// "Complementario" (referencia general / longevidad, fuera de guía CV). Para
// cada biomarcador muestra el último valor, la referencia y un estado. Los
// objetivos de LDL-C y ApoB dependen del riesgo cardiovascular del paciente.
// Solo lectura.
import { Accordion, Alert, Anchor, Badge, Group, Loader, Paper, Stack, Table, Text, Title, Tooltip } from '@mantine/core';
import { formatHumanName } from '@medplum/core';
import type { HumanName } from '@medplum/fhirtypes';
import { IconArrowLeft, IconDatabaseImport, IconInfoCircle, IconShieldCheck } from '@tabler/icons-react';
import type { JSX } from 'react';
import { Link, useParams } from 'react-router';
import { Sparkline } from '../ckm/components/Sparkline';
import { useBiomarkerPanel } from '../ckm/hooks/useBiomarkerPanel';
import { useCKMData } from '../ckm/hooks/useCKMData';
import { usePatientDiabetes } from '../ckm/hooks/usePatientDiabetes';
import {
  LIPID_TARGET_SOURCE,
  lipidTargetText,
  lipidTargetTier,
  lipidTargetValue,
} from '../ckm/lipid-targets';
import type { LipidTargetTier } from '../ckm/lipid-targets';
import { classifyBiomarkerValue } from '../ckm/observation-definitions';
import type { BiomarkerDefinition, BiomarkerPanelGroup, CodedValue } from '../ckm/observation-definitions';
import { categorizeRiskWithCac } from '../ckm/risk';
import { formatUnit } from '../ckm/units';

const DEFAULT_OPEN = ['lipidico', 'metabolico', 'renal-hepatico'];

export function BiomarkerPanelPage(): JSX.Element {
  const { patientId } = useParams();
  const { patient, tiers, valuesByCode, historyByCode, gender, loading } = useBiomarkerPanel(patientId);
  const { stage, preventScores, hGraphMetrics, loading: ckmLoading } = useCKMData(patientId);
  const { hasDiabetes, loading: diabetesLoading } = usePatientDiabetes(patientId);

  // Esperar también a los datos de riesgo (estadío/PREVENT/CAC) y a la diabetes:
  // el objetivo lipídico depende de ellos y no debe mostrarse a medias.
  if (loading || ckmLoading || diabetesLoading) {
    return <Loader m="xl" />;
  }

  const patientName = patient?.name?.[0] ? formatHumanName(patient.name[0] as HumanName) : 'Paciente';
  // El tramo de objetivo lipídico sigue la misma categoría ASCVD (reclasificada
  // por CAC) que el badge de riesgo del dashboard, y sube a "alto" en diabéticos
  // con riesgo intermedio+ (guía 2026: reducir LDL-C ≥50 %).
  const cac = hGraphMetrics?.find((m) => m.id === 'cac')?.value;
  const ascvd = categorizeRiskWithCac('ascvd10y', preventScores?.ascvd10y, cac);
  const targetTier = lipidTargetTier(stage, ascvd?.tier.level, hasDiabetes, ascvd?.base.level);
  const totalDefs = [...tiers.core, ...tiers.complementary].reduce((n, g) => n + g.defs.length, 0);
  const empty = totalDefs === 0;

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
            {patientName} · {totalDefs} biomarcadores. El estado se clasifica contra los rangos de cada definición; los
            objetivos de LDL-C y ApoB dependen del riesgo cardiovascular del paciente.
          </Text>
        </Stack>

        {empty ? (
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
          <>
            <Stack gap={6}>
              <Group gap={6} wrap="nowrap">
                <IconShieldCheck size={18} color="var(--mantine-color-teal-6)" />
                <Title order={5}>Núcleo cardiovascular · guías (ACC/AHA · ADA · KDIGO)</Title>
              </Group>
              <Accordion multiple defaultValue={DEFAULT_OPEN} variant="separated">
                {tiers.core.map((group) => (
                  <PanelSection
                    key={group.panelCode}
                    group={group}
                    valuesByCode={valuesByCode}
                    historyByCode={historyByCode}
                    gender={gender}
                    targetTier={targetTier}
                  />
                ))}
              </Accordion>
            </Stack>

            <Stack gap={6}>
              <Title order={5}>Complementario · fuera de guía cardiovascular</Title>
              <Alert color="gray" variant="light" icon={<IconInfoCircle size={16} />} p="xs">
                <Text size="xs">
                  Rangos de referencia general y de longevidad, sin respaldo de guía cardiovascular. Orientativos; no
                  usar como objetivo terapéutico de prevención CV.
                </Text>
              </Alert>
              <Accordion multiple variant="separated">
                {tiers.complementary.map((group) => (
                  <PanelSection
                    key={group.panelCode}
                    group={group}
                    valuesByCode={valuesByCode}
                    historyByCode={historyByCode}
                    gender={gender}
                  />
                ))}
              </Accordion>
            </Stack>
          </>
        )}

        <Text size="xs" c="dimmed">
          El estado se calcula según el género del paciente cuando la definición lo distingue. {LIPID_TARGET_SOURCE}
        </Text>
      </Stack>
    </Paper>
  );
}

function PanelSection(props: {
  group: BiomarkerPanelGroup;
  valuesByCode: Map<string, CodedValue>;
  historyByCode: Map<string, CodedValue[]>;
  gender?: string;
  /** Presente solo en el núcleo: activa el objetivo por riesgo (LDL/ApoB). */
  targetTier?: LipidTargetTier;
}): JSX.Element {
  const { group, valuesByCode, historyByCode, gender, targetTier } = props;
  const withData = group.defs.filter((d) => d.code && valuesByCode.has(d.code)).length;
  const optimalHeader = targetTier ? 'Óptimo / objetivo' : 'Óptimo';

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
              <Table.Th>Tendencia</Table.Th>
              <Table.Th>Convencional</Table.Th>
              <Table.Th>{optimalHeader}</Table.Th>
              <Table.Th>Estado</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {group.defs.map((def) => (
              <BiomarkerRow
                key={def.biomarcadorId ?? def.code ?? def.label}
                def={def}
                reading={def.code ? valuesByCode.get(def.code) : undefined}
                history={def.code ? historyByCode.get(def.code) : undefined}
                gender={gender}
                targetTier={targetTier}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

function trendLabel(history: CodedValue[], def: BiomarkerDefinition): string {
  const first = history[0];
  const last = history[history.length - 1];
  const unit = formatUnit(last.unit) ?? def.unit ?? '';
  const date = last.date ? ` · último ${last.date.slice(0, 10)}` : '';
  return `${history.length} lecturas · ${first.value} → ${last.value} ${unit}${date}`.trim();
}

function BiomarkerRow(props: {
  def: BiomarkerDefinition;
  reading?: CodedValue;
  history?: CodedValue[];
  gender?: string;
  targetTier?: LipidTargetTier;
}): JSX.Element {
  const { def, reading, history, gender, targetTier } = props;
  // Objetivo por riesgo (LDL/ApoB): si aplica, reemplaza al óptimo estático y
  // clasifica el cumplimiento contra el umbral del tramo del paciente.
  const riskTarget = targetTier ? lipidTargetText(def.biomarcadorId, targetTier) : undefined;
  const riskTargetValue = targetTier ? lipidTargetValue(def.biomarcadorId, targetTier) : undefined;
  // Estrictamente por debajo del umbral: el objetivo se muestra como "< X", así
  // que un valor exactamente igual a X no está "En objetivo".
  const status =
    riskTargetValue !== undefined && reading
      ? reading.value < riskTargetValue
        ? { label: 'En objetivo', color: 'green' }
        : { label: 'Sobre objetivo', color: 'red' }
      : classifyBiomarkerValue(def, reading?.value, gender);

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
              events={{ hover: true, focus: false, touch: true }}
            >
              <IconInfoCircle
                size={14}
                role="img"
                color="var(--mantine-color-dimmed)"
                aria-label={`Sobre ${def.label}`}
              />
            </Tooltip>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        {reading ? (
          <Text size="sm">
            {reading.value} {formatUnit(reading.unit) ?? def.unit ?? ''}
          </Text>
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        {history && history.length >= 2 ? (
          <Tooltip label={trendLabel(history, def)} withArrow events={{ hover: true, focus: false, touch: true }}>
            <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
              <Sparkline
                values={history.map((h) => h.value)}
                dotColor={`var(--mantine-color-${status.color}-6)`}
                label={trendLabel(history, def)}
              />
            </span>
          </Tooltip>
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
        {riskTarget ? (
          <Tooltip label={LIPID_TARGET_SOURCE} withArrow multiline maw={320}>
            <Text size="sm" fw={600} c="teal.7" style={{ cursor: 'default' }}>
              {riskTarget}
            </Text>
          </Tooltip>
        ) : (
          <Text size="sm" c="dimmed">
            {def.optimalText ?? '—'}
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        {reading ? (
          <Badge color={status.color} variant="light" style={{ cursor: 'default' }}>
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
