// Presentación de unidades clínicas. Las Observations del servidor suelen traer
// el código UCUM crudo en valueQuantity.unit (mm[Hg], mL/min/{1.73_m2}, ...);
// este módulo lo convierte a la forma legible que espera el equipo médico.
// Sin dependencias de UI: usable por el FrontEnd y por los bots.

/** Códigos UCUM presentes en nuestros datos, con su presentación clínica. */
const UCUM_DISPLAY: Record<string, string> = {
  'mm[Hg]': 'mmHg',
  'kg/m2': 'kg/m²',
  'mL/min/{1.73_m2}': 'mL/min/1.73m²',
  'mL/min/1.73_m2': 'mL/min/1.73m²',
  'mg/g{creat}': 'mg/g',
};

/**
 * Convierte un código UCUM a su presentación legible. Las unidades ya legibles
 * pasan sin cambios; para códigos no mapeados aplica una limpieza genérica
 * (anotaciones {…} fuera, [Hg] sin corchetes, m2 → m²).
 */
export function formatUnit(unit: string): string;
export function formatUnit(unit: string | undefined): string | undefined;
export function formatUnit(unit: string | undefined): string | undefined {
  if (!unit) {
    return unit;
  }
  const exact = UCUM_DISPLAY[unit];
  if (exact) {
    return exact;
  }
  return unit
    .replace(/\[Hg\]/g, 'Hg')
    .replace(/\{([^}]*)\}/g, '$1')
    .replace(/_?m2\b/g, 'm²');
}
