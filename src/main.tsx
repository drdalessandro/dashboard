// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider, createTheme } from '@mantine/core';
import type { MantineColorsTuple } from '@mantine/core';
import '@mantine/core/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { MedplumClient } from '@medplum/core';
import { MedplumProvider } from '@medplum/react';
import '@medplum/react/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { getConfig } from './config';

const medplum = new MedplumClient({
  onUnauthenticated: () => (window.location.href = '/'),
  baseUrl: getConfig().baseUrl,
});

// Paleta de marca Segunda Opinión Médica: azul como acento sobre una base
// neutra/clínica. Escala de 10 tonos (claro -> oscuro) para Mantine.
// El tono 6 (#007ce8) es el color principal de marca.
const brand: MantineColorsTuple = [
  '#eaf5fd',
  '#d1e7fb',
  '#a6d1f7',
  '#73b7f2',
  '#459fee',
  '#218deb',
  '#007ce8',
  '#0068c3',
  '#005299',
  '#003c6f',
];

const theme = createTheme({
  primaryColor: 'brand',
  // El tono 6 (#007ce8) es el color principal de marca; en oscuro se usa un
  // tono algo más claro para mejor lectura sobre fondos profundos.
  primaryShade: { light: 6, dark: 5 },
  colors: { brand },
  defaultRadius: 'md',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  headings: {
    fontWeight: '600',
    sizes: {
      h1: {
        fontSize: '1.125rem',
        fontWeight: '600',
        lineHeight: '2.0',
      },
    },
  },
  fontSizes: {
    xs: '0.6875rem',
    sm: '0.875rem',
    md: '0.875rem',
    lg: '1.0rem',
    xl: '1.125rem',
  },
});

const container = document.getElementById('root') as HTMLDivElement;
const root = createRoot(container);
root.render(
  <StrictMode>
    <BrowserRouter>
      <MedplumProvider medplum={medplum}>
        <MantineProvider theme={theme}>
          <Notifications />
          <App />
        </MantineProvider>
      </MedplumProvider>
    </BrowserRouter>
  </StrictMode>
);
