// Sparkline: mini gráfico de línea SVG para mostrar la tendencia de un
// biomarcador dentro de una celda de tabla. Liviano (sin librería de charts por
// fila). Espera los valores de más viejo a más nuevo.
import type { JSX } from 'react';

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  /** Color del punto del último valor (por defecto, el de la línea). */
  dotColor?: string;
  /** Nombre accesible del gráfico (lo lee el lector de pantalla). */
  label?: string;
  /** Escala fija [min, max] (ej. [0, 100] para sub-scores LE8). */
  domain?: [number, number];
  /**
   * Rango mínimo del autoescalado: sin esto, una variación clínicamente
   * trivial (2.1 -> 2.2) se dibuja como una montaña. Ignorado si hay domain.
   */
  minSpan?: number;
}

export function Sparkline(props: SparklineProps): JSX.Element | null {
  const {
    values,
    width = 84,
    height = 24,
    color = 'var(--mantine-color-gray-5)',
    dotColor,
    label = 'Tendencia',
    domain,
    minSpan,
  } = props;
  if (values.length < 2) {
    return null;
  }
  const pad = 3;
  let min = domain ? domain[0] : Math.min(...values);
  let max = domain ? domain[1] : Math.max(...values);
  if (!domain && minSpan !== undefined && max - min < minSpan) {
    const mid = (max + min) / 2;
    min = mid - minSpan / 2;
    max = mid + minSpan / 2;
  }
  const span = max - min || 1;
  const x = (i: number): number => pad + (i / (values.length - 1)) * (width - 2 * pad);
  const y = (v: number): number => {
    // Clamp por si un valor cae fuera del domain fijado
    const t = Math.min(1, Math.max(0, (v - min) / span));
    return height - pad - t * (height - 2 * pad);
  };
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={2.5} fill={dotColor ?? color} />
    </svg>
  );
}
