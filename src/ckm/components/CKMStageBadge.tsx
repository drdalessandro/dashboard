// Badge del estadío CKM. Reutilizable en la lista de pacientes (sm) y en el
// encabezado del chart (md).
import { Badge, Tooltip } from '@mantine/core';
import type { JSX } from 'react';
import { CKM_STAGES } from '../constants';
import type { CKMStage } from '../types';

export interface CKMStageBadgeProps {
  stage: CKMStage;
  size?: 'sm' | 'md';
}

export function CKMStageBadge(props: CKMStageBadgeProps): JSX.Element {
  const { stage, size = 'md' } = props;
  const info = CKM_STAGES[stage];

  if (size === 'sm') {
    return (
      <Tooltip label={`Estadío ${stage}: ${info.label}`} withArrow>
        <Badge circle variant="filled" autoContrast color={info.color} size="lg" style={{ cursor: 'default' }}>
          {stage}
        </Badge>
      </Tooltip>
    );
  }

  // El número va dentro del texto (no como leftSection): con leftSection el
  // grid interno del Badge envolvía el label a 2 líneas y la altura fija lo
  // recortaba. Altura automática + wrap normal para que los labels largos
  // bajen de línea limpiamente en columnas angostas en vez de cortarse.
  return (
    <Tooltip label={info.description} withArrow maw={320} multiline>
      <Badge
        variant="filled"
        autoContrast
        color={info.color}
        size="sm"
        tt="none"
        styles={{
          root: { height: 'auto', paddingTop: 3, paddingBottom: 3, cursor: 'default' },
          label: { whiteSpace: 'normal', overflow: 'visible', lineHeight: 1.25 },
        }}
      >
        Estadío {stage} · {info.label}
      </Badge>
    </Tooltip>
  );
}
