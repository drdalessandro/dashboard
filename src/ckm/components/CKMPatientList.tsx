// Lista de pacientes CKM. Reemplaza al SearchControl genérico en /Patient:
// conserva las columnas del demo (nombre, género, fecha de nacimiento, última
// actualización) y agrega la columna de estadío CKM.
import { Table, Text } from '@mantine/core';
import { formatDate, formatHumanName } from '@medplum/core';
import type { HumanName, Patient } from '@medplum/fhirtypes';
import { Loading, useSearchResources } from '@medplum/react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import { useCKMData } from '../hooks/useCKMData';
import { CKMStageBadge } from './CKMStageBadge';

const GENDER_LABELS: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
  unknown: 'Desconocido',
};

export function CKMPatientList(): JSX.Element {
  const [patients, loading] = useSearchResources('Patient', { _count: '100', _sort: '-_lastUpdated' });

  if (loading || !patients) {
    return <Loading />;
  }

  if (patients.length === 0) {
    return (
      <Text c="dimmed" p="md">
        No hay pacientes cargados.
      </Text>
    );
  }

  return (
    <Table highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Nombre</Table.Th>
          <Table.Th>Estadío CKM</Table.Th>
          <Table.Th>Género</Table.Th>
          <Table.Th>Fecha de nacimiento</Table.Th>
          <Table.Th>Última actualización</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {patients.map((patient) => (
          <PatientRow key={patient.id} patient={patient} />
        ))}
      </Table.Tbody>
    </Table>
  );
}

function PatientRow(props: { patient: Patient }): JSX.Element {
  const { patient } = props;
  const navigate = useNavigate();
  const { stage } = useCKMData(patient);

  return (
    <Table.Tr
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/Patient/${patient.id}`)?.catch(console.error)}
      onAuxClick={() => window.open(`/Patient/${patient.id}`, '_blank')}
    >
      <Table.Td>{patient.name ? formatHumanName(patient.name[0] as HumanName) : ''}</Table.Td>
      <Table.Td>
        {stage !== undefined ? (
          <CKMStageBadge stage={stage} size="sm" />
        ) : (
          <Text c="dimmed" span>
            —
          </Text>
        )}
      </Table.Td>
      <Table.Td>{patient.gender ? GENDER_LABELS[patient.gender] : ''}</Table.Td>
      <Table.Td>{formatDate(patient.birthDate)}</Table.Td>
      <Table.Td>{formatDate(patient.meta?.lastUpdated)}</Table.Td>
    </Table.Tr>
  );
}
