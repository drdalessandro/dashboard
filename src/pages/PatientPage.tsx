// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Grid, Loader, Stack } from '@mantine/core';
import type { Patient } from '@medplum/fhirtypes';
import { PatientSummary, useMedplum } from '@medplum/react';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { useParams } from 'react-router';
import { PREVENTPanel } from '../ckm/components/PREVENTPanel';
import { PatientDetails } from '../components/PatientDetails';

export function PatientPage(): JSX.Element {
  const medplum = useMedplum();
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient>();

  useEffect(() => {
    if (id) {
      medplum.readResource('Patient', id).then(setPatient).catch(console.error);
    }
  }, [medplum, id]);

  function onPatientChange(patient: Patient): void {
    setPatient(patient);
  }

  if (!patient) {
    return <Loader />;
  }

  return (
    <Grid>
      <Grid.Col span={4}>
        <Stack gap="md">
          <PREVENTPanel patient={patient} />
          <PatientSummary patient={patient} />
        </Stack>
      </Grid.Col>
      <Grid.Col span={8}>
        <PatientDetails patient={patient} onChange={onPatientChange} />
      </Grid.Col>
    </Grid>
  );
}
