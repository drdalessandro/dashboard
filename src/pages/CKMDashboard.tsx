// Panel de trabajo del especialista CKM: pacientes filtrables por estadío y
// nombre, ordenables por estadío y por riesgo PREVENT, con alertas sin leer.
import { Group, MultiSelect, Paper, Table, Text, TextInput, Tooltip, UnstyledButton } from '@mantine/core';
import { formatDate } from '@medplum/core';
import { Loading, useMedplum } from '@medplum/react';
import { IconAlertCircle, IconChevronDown, IconChevronUp, IconSearch, IconSelector } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router';
import { CKMStageBadge } from '../ckm/components/CKMStageBadge';
import { CKM_STAGES } from '../ckm/constants';
import { loadDashboardRows } from '../ckm/dashboard';
import type { DashboardRow } from '../ckm/dashboard';
import type { CKMStage } from '../ckm/types';

type SortField = 'stage' | 'risk';

interface SortState {
  field: SortField;
  descending: boolean;
}

const STAGE_OPTIONS = (Object.keys(CKM_STAGES) as unknown as CKMStage[]).map((stage) => ({
  value: String(stage),
  label: `${stage} — ${CKM_STAGES[stage].label}`,
}));

export function CKMDashboard(): JSX.Element {
  const medplum = useMedplum();
  const [rows, setRows] = useState<DashboardRow[]>();
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [sort, setSort] = useState<SortState>();

  useEffect(() => {
    loadDashboardRows(medplum).then(setRows).catch(console.error);
  }, [medplum]);

  const visibleRows = useMemo(() => {
    if (!rows) {
      return undefined;
    }
    let result = rows;
    if (stageFilter.length > 0) {
      result = result.filter((row) => row.stage !== undefined && stageFilter.includes(String(row.stage)));
    }
    if (nameFilter.trim()) {
      const query = nameFilter.trim().toLowerCase();
      result = result.filter((row) => row.name.toLowerCase().includes(query));
    }
    if (sort) {
      const direction = sort.descending ? -1 : 1;
      result = [...result].sort((a, b) => {
        // Sin dato va siempre al final, sin importar la dirección
        const aValue = sort.field === 'stage' ? a.stage : a.ascvd10y;
        const bValue = sort.field === 'stage' ? b.stage : b.ascvd10y;
        if (aValue === undefined && bValue === undefined) {
          return 0;
        }
        if (aValue === undefined) {
          return 1;
        }
        if (bValue === undefined) {
          return -1;
        }
        return (aValue - bValue) * direction;
      });
    }
    return result;
  }, [rows, stageFilter, nameFilter, sort]);

  function toggleSort(field: SortField): void {
    setSort((current) =>
      current?.field === field ? { field, descending: !current.descending } : { field, descending: true }
    );
  }

  if (!visibleRows) {
    return <Loading />;
  }

  return (
    <Paper shadow="xs" m="md" p="md">
      <Group mb="md" grow>
        <MultiSelect
          label="Estadío CKM"
          placeholder={stageFilter.length === 0 ? 'Todos' : undefined}
          data={STAGE_OPTIONS}
          value={stageFilter}
          onChange={setStageFilter}
          clearable
        />
        <TextInput
          label="Paciente"
          placeholder="Buscar por nombre..."
          leftSection={<IconSearch size={16} />}
          value={nameFilter}
          onChange={(e) => setNameFilter(e.currentTarget.value)}
        />
      </Group>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Paciente</Table.Th>
            <SortableTh label="Estadío" field="stage" sort={sort} onSort={toggleSort} />
            <SortableTh label="PREVENT-CVD 10a" field="risk" sort={sort} onSort={toggleSort} />
            <Table.Th>RiskAssessment</Table.Th>
            <Table.Th>Alertas</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visibleRows.map((row) => (
            <Table.Tr key={row.patient.id}>
              <Table.Td>
                <Text component={Link} to={`/Patient/${row.patient.id}`} fw={500} c="blue">
                  {row.name}
                </Text>
              </Table.Td>
              <Table.Td>
                {row.stage !== undefined ? (
                  <CKMStageBadge stage={row.stage} size="sm" />
                ) : (
                  <Text c="dimmed" span>
                    —
                  </Text>
                )}
              </Table.Td>
              <Table.Td>{row.ascvd10y !== undefined ? `${row.ascvd10y}%` : '—'}</Table.Td>
              <Table.Td>{row.riskUpdated ? formatDate(row.riskUpdated) : '—'}</Table.Td>
              <Table.Td>
                {row.hasAlert && (
                  <Tooltip label="Tiene alertas sin leer" withArrow>
                    <IconAlertCircle size={20} color="var(--mantine-color-red-6)" />
                  </Tooltip>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {visibleRows.length === 0 && (
        <Text c="dimmed" ta="center" p="md">
          No hay pacientes que coincidan con los filtros.
        </Text>
      )}
    </Paper>
  );
}

function SortableTh(props: {
  label: string;
  field: SortField;
  sort?: SortState;
  onSort: (field: SortField) => void;
}): JSX.Element {
  const active = props.sort?.field === props.field;
  const Icon = active ? (props.sort?.descending ? IconChevronDown : IconChevronUp) : IconSelector;
  return (
    <Table.Th>
      <UnstyledButton onClick={() => props.onSort(props.field)} fz="sm" fw={700}>
        <Group gap={4} wrap="nowrap">
          {props.label}
          <Icon size={14} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}
