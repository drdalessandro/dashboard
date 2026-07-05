// hGraph (GoInvo) del paciente: visualización radial de las métricas CKM.
// Cada métrica es un punto sobre un eje que sale del centro, ubicado según su
// score normalizado (0 = centro, 1 = borde) y coloreado por su status.
import { Text, Tooltip } from '@mantine/core';
import { scaleLinear } from 'd3-scale';
import { curveLinearClosed, lineRadial } from 'd3-shape';
import type { JSX } from 'react';
import type { HGraphMetric, HGraphMetricStatus } from '../types';

export interface HGraphProps {
  metrics: HGraphMetric[];
}

const SIZE = 400;
const CENTER = SIZE / 2;
// Aire horizontal extra del viewBox: las etiquetas cercanas a la horizontal
// ("Glucemia ayunas", "Colesterol no-HDL") exceden el cuadrado y se recortaban.
const H_MARGIN = 56;
const RING_RADIUS = 132;
const LABEL_RADIUS = RING_RADIUS + 16;
const GUIDE_SCORES = [0.25, 0.5, 0.75, 1];

const STATUS_COLORS: Record<HGraphMetricStatus, string> = {
  healthy: 'var(--mantine-color-green-6)',
  moderate: 'var(--mantine-color-yellow-6)',
  high: 'var(--mantine-color-red-6)',
};

const STATUS_LABELS: Record<HGraphMetricStatus, string> = {
  healthy: 'Saludable',
  moderate: 'Moderado',
  high: 'Alto',
};

export function HGraph(props: HGraphProps): JSX.Element {
  const { metrics } = props;

  if (metrics.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center" p="md">
        Sin métricas CKM registradas.
      </Text>
    );
  }

  const radius = scaleLinear().domain([0, 1]).range([0, RING_RADIUS]).clamp(true);
  const angle = (index: number): number => (2 * Math.PI * index) / metrics.length;

  // Convención de lineRadial: ángulo horario desde las 12, origen en (0,0)
  const pointX = (index: number, r: number): number => r * Math.sin(angle(index));
  const pointY = (index: number, r: number): number => -r * Math.cos(angle(index));

  const polygonPath =
    lineRadial<HGraphMetric>()
      .angle((_, i) => angle(i))
      .radius((m) => radius(m.score))
      .curve(curveLinearClosed)(metrics) ?? undefined;

  return (
    <svg
      viewBox={`${-H_MARGIN} 0 ${SIZE + 2 * H_MARGIN} ${SIZE}`}
      width="100%"
      role="img"
      aria-label="hGraph de métricas CKM"
    >
      <g transform={`translate(${CENTER}, ${CENTER})`}>
        {/* Guías concéntricas */}
        {GUIDE_SCORES.map((score) => (
          <circle
            key={score}
            r={radius(score)}
            fill="none"
            stroke="var(--mantine-color-gray-3)"
            strokeWidth={score === 1 ? 1.5 : 0.75}
          />
        ))}

        {/* Ejes y etiquetas de cada métrica */}
        {metrics.map((metric, i) => {
          const anchorX = pointX(i, LABEL_RADIUS);
          const textAnchor = Math.abs(anchorX) < 12 ? 'middle' : anchorX > 0 ? 'start' : 'end';
          return (
            <g key={metric.id}>
              <line
                x1={0}
                y1={0}
                x2={pointX(i, RING_RADIUS)}
                y2={pointY(i, RING_RADIUS)}
                stroke="var(--mantine-color-gray-2)"
                strokeWidth={0.75}
              />
              <text x={anchorX} y={pointY(i, LABEL_RADIUS)} textAnchor={textAnchor} fontSize={11}>
                <tspan fill="var(--mantine-color-text)" fontWeight={500}>
                  {metric.label}
                </tspan>
                <tspan x={anchorX} dy={12} fill="var(--mantine-color-dimmed)" fontSize={10}>
                  {metric.value} {metric.unit}
                </tspan>
              </text>
            </g>
          );
        })}

        {/* Área de salud del paciente */}
        <path
          d={polygonPath}
          fill="var(--mantine-color-blue-5)"
          fillOpacity={0.15}
          stroke="var(--mantine-color-blue-5)"
          strokeWidth={1.5}
        />

        {/* Puntos de las métricas */}
        {metrics.map((metric, i) => (
          <Tooltip
            key={metric.id}
            withArrow
            label={`${metric.label}: ${metric.value} ${metric.unit} · ${STATUS_LABELS[metric.status]}`}
          >
            <circle
              cx={pointX(i, radius(metric.score))}
              cy={pointY(i, radius(metric.score))}
              r={6}
              fill={STATUS_COLORS[metric.status]}
              stroke="var(--mantine-color-body)"
              strokeWidth={1.5}
            />
          </Tooltip>
        ))}
      </g>
    </svg>
  );
}
