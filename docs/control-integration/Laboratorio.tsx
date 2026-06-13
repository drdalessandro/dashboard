// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// Control (foomedical fork) — Página "Laboratorio" (rol paciente)
// ----------------------------------------------------------------------------
// COPIAR a: src/pages/laboratorio/Laboratorio.tsx
//
// Lista las mediciones de laboratorio que el paciente puede cargar. Cada tarjeta
// lleva al formulario de carga reutilizando el componente Measurement existente
// (ver instrucciones de routing en README.md de esta carpeta).
//
// Si tu fork usa otra ruta para Measurement, ajustá BASE_PATH.
// ============================================================================
import { Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { JSX } from 'react';
import { Link } from 'react-router';

const BASE_PATH = '/laboratorio';

// Ids que deben coincidir con las claves agregadas en measurementsMeta
// (ver measurementsMeta-additions.ts).
const LAB_MEASUREMENTS: { id: string; title: string; hint: string }[] = [
  { id: 'tfge', title: 'Filtrado glomerular (función del riñón)', hint: 'TFGe — mL/min/1.73m²' },
  { id: 'triglycerides', title: 'Triglicéridos (grasas en sangre)', hint: 'mg/dL' },
  { id: 'hdl', title: 'Colesterol HDL ("bueno")', hint: 'mg/dL' },
  { id: 'ldl', title: 'Colesterol LDL ("malo")', hint: 'mg/dL' },
  { id: 'non-hdl', title: 'Colesterol No-HDL', hint: 'mg/dL' },
  { id: 'hba1c', title: 'Hemoglobina glicosilada (HbA1c)', hint: '%' },
  { id: 'fasting-glucose', title: 'Glucemia en ayunas (azúcar en sangre)', hint: 'mg/dL' },
];

export function Laboratorio(): JSX.Element {
  return (
    <Stack p="md" gap="md">
      <div>
        <Title order={2}>Laboratorio</Title>
        <Text c="dimmed" size="sm">
          Cargá los resultados de tu último análisis de sangre. Copiá cada valor tal como figura en el informe del
          laboratorio.
        </Text>
      </div>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {LAB_MEASUREMENTS.map((m) => (
          <Card
            key={m.id}
            component={Link}
            to={`${BASE_PATH}/${m.id}`}
            withBorder
            padding="lg"
            radius="md"
            style={{ textDecoration: 'none' }}
          >
            <Text fw={600}>{m.title}</Text>
            <Text c="dimmed" size="xs" mt={4}>
              {m.hint}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
