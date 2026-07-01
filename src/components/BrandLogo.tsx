// Logo de marca Segunda Opinión Médica. Usa el archivo public/logo.png (tu
// imagen exacta); si todavía no está, cae a un wordmark azul para que la UI
// nunca muestre una imagen rota. Reemplaza al <Logo> de Medplum en header,
// login y landing.
import { Text } from '@mantine/core';
import { useState } from 'react';
import type { JSX } from 'react';

export interface BrandLogoProps {
  /** Alto en px (el ancho se ajusta solo). */
  height?: number;
}

export function BrandLogo(props: BrandLogoProps): JSX.Element {
  const { height = 28 } = props;
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Text component="span" fw={700} fz={Math.round(height * 0.62)} style={{ lineHeight: 1, letterSpacing: '-0.01em' }}>
        <Text component="span" inherit c="brand.6">
          Segunda Opinión
        </Text>{' '}
        <Text component="span" inherit c="dark.5">
          Médica
        </Text>
      </Text>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Segunda Opinión Médica"
      style={{ display: 'block', height, width: 'auto', objectFit: 'contain' }}
      onError={() => setFailed(true)}
    />
  );
}
