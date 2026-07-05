// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Stack, Text, Title } from '@mantine/core';
import { Document } from '@medplum/react';
import type { JSX } from 'react';
import { Link } from 'react-router';
import { BrandLogo } from '../components/BrandLogo';

export function LandingPage(): JSX.Element {
  return (
    <Document width={520}>
      <Stack align="center" gap="md">
        <BrandLogo height={72} />
        <Text ta="center" c="dimmed" maw={440}>
          Plataforma de seguimiento clínico cardiovascular: riesgo cardiovascular (ecuaciones PREVENT), estadío
          Cardio-Reno-Metabólico (CKM) y panel de biomarcadores, sobre una base FHIR (Medplum).
        </Text>
        <Button component={Link} to="/signin" size="md" radius="xl">
          Ingresar
        </Button>
      </Stack>
    </Document>
  );
}
