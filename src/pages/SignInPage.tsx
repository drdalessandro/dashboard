// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Text, Title } from '@mantine/core'; // Se agregó 'Text' aquí
import { Logo, SignInForm } from '@medplum/react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import { getConfig } from '../config';

export function SignInPage(): JSX.Element {
  const navigate = useNavigate();
  return (
    <SignInForm
      // Configure according to your settings
      googleClientId={getConfig().googleClientId}
      onSuccess={() => navigate('/')?.catch(console.error)}
      clientId={getConfig().clientId}
    >
      <Logo size={32} />
      <Title ta="center" order={2}>Ingresar a Favaloro</Title>
      
      {/* Primer bloque: 2 espacios abajo, tamaño de texto intermedio */}
      <Text ta="center" size="sm" fw={500} c="dimmed" mt="xl">
        Favaloro | Medplum Argentina
      </Text>
      
      {/* Segundo bloque: 2 espacios más abajo, tamaño más sutil */}
      <Text ta="center" size="xs" c="dimmed" mt="md">
        HeartInnovations
      </Text>
    </SignInForm>
  );
}
