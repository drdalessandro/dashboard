// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Group, Text, Title } from '@mantine/core';
import { SignInForm } from '@medplum/react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import { BrandLogo } from '../components/BrandLogo';
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
        <BrandLogo height={56} />
      </Group>
      <Title ta="center" order={2} mt="sm">
        Segunda Opinión Médica
      </Title>
      <Text ta="center" size="sm" c="dimmed">
        Seguimiento clínico cardiovascular
      </Text>
      <Text ta="center" size="xs" c="dimmed" mt="xl">
        Favaloro · Medplum Argentina
      </Text>
    </SignInForm>
  );
}
