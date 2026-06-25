// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Group, Text, Title } from '@mantine/core';
import { SignInForm } from '@medplum/react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import { BioWellnessLogo } from '../components/BioWellnessLogo';
import { getConfig } from '../config';

export function SignInPage(): JSX.Element {
  const navigate = useNavigate();
  return (
    <SignInForm
      googleClientId={getConfig().googleClientId}
      onSuccess={() => navigate('/')?.catch(console.error)}
      clientId={getConfig().clientId}
    >
      <Group justify="center">
        <BioWellnessLogo height={56} />
      </Group>
      <Title ta="center" order={2} mt="sm">
        BioWellness
      </Title>
      <Text ta="center" size="sm" c="dimmed">
        Optimización biológica · Seguimiento clínico
      </Text>
      <Text ta="center" size="xs" c="dimmed" mt="xl">
        Favaloro · Medplum Argentina
      </Text>
    </SignInForm>
  );
}
