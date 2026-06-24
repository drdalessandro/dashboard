// Lector del panel de biomarcadores BioWellness desde sus ObservationDefinitions
// (fuente de verdad FHIR cargada con upload-biomarker-definitions).
//
// Cada ObservationDefinition trae: identifier (slug del biomarcador), code
// (LOINC o código local), category (panel: metabolico/lipidico/inflamacion/…),
// unidad, rangos por contexto ('normal' = convencional, 'funcional-optimo' =
// óptimo, opcionalmente por género) y extensiones de texto (rango convencional/
// óptimo, interpretación, fuente). Este módulo las normaliza a una forma plana
// y fácil de consumir. Sin dependencias de UI.
import type { MedplumClient } from '@medplum/core';
import type { ObservationDefinition } from '@medplum/fhirtypes';

export const BIOMARCADOR_IDENTIFIER_SYSTEM = 'https://bio.medplum.com.ar/fhir/sid/biomarcador';
export const PANEL_SYSTEM = 'https://bio.medplum.com.ar/fhir/CodeSystem/panel-biomarcador';
export const CONTEXTO_RANGO_SYSTEM = 'https://bio.medplum.com.ar/fhir/CodeSystem/contexto-rango';
const EXT_BASE = 'https://bio.medplum.com.ar/fhir/StructureDefinition/';
export const EXT_RANGO_CONVENCIONAL_TEXTO = EXT_BASE + 'rango-convencional-texto';
export const EXT_RANGO_OPTIMO_TEXTO = EXT_BASE + 'rango-optimo-texto';
export const EXT_INTERPRETACION = EXT_BASE + 'interpretacion';
export const EXT_FUENTE = EXT_BASE + 'fuente';
export const LOINC_SYSTEM = 'http://loinc.org';

/** Contexto de un rango: convencional ('normal') u óptimo ('funcional-optimo'). */
export type RangeContext = 'normal' | 'funcional-optimo';

export interface BiomarkerRange {
  low?: number;
  high?: number;
  /** 'male' | 'female' si el rango es específico por género; ausente si aplica a ambos. */
  gender?: string;
}

/** Forma normalizada de una ObservationDefinition de biomarcador. */
export interface BiomarkerDefinition {
  /** Slug del biomarcador (identifier en BIOMARCADOR_IDENTIFIER_SYSTEM). */
  biomarcadorId?: string;
  /** Nombre para mostrar (code.text). */
  label: string;
  /** Código (LOINC o local). */
  code?: string;
  system?: string;
  /** Código del panel (metabolico, lipidico, inflamacion, …). */
  panelCode?: string;
  panelDisplay?: string;
  unit?: string;
  conventionalText?: string;
  optimalText?: string;
  interpretation?: string;
  source?: string;
  /** Rangos convencionales (contexto 'normal'); puede haber uno por género. */
  conventional: BiomarkerRange[];
  /** Rangos óptimos (contexto 'funcional-optimo'). */
  optimal: BiomarkerRange[];
}

function extString(od: ObservationDefinition, url: string): string | undefined {
  return od.extension?.find((e) => e.url === url)?.valueString;
}

function intervalsForContext(od: ObservationDefinition, context: RangeContext): BiomarkerRange[] {
  return (od.qualifiedInterval ?? [])
    .filter((q) => q.context?.coding?.some((c) => c.code === context))
    .map((q) => ({ low: q.range?.low?.value, high: q.range?.high?.value, gender: q.gender }));
}

/** Normaliza una ObservationDefinition de biomarcador a BiomarkerDefinition. */
export function parseObservationDefinition(od: ObservationDefinition): BiomarkerDefinition {
  const coding = od.code?.coding?.[0];
  const unit = od.quantitativeDetails?.unit;
  return {
    biomarcadorId: od.identifier?.find((i) => i.system === BIOMARCADOR_IDENTIFIER_SYSTEM)?.value,
    label: od.code?.text ?? coding?.display ?? coding?.code ?? '(sin nombre)',
    code: coding?.code,
    system: coding?.system,
    panelCode: od.category?.[0]?.coding?.[0]?.code,
    panelDisplay: od.category?.[0]?.coding?.[0]?.display,
    unit: unit?.text ?? unit?.coding?.[0]?.code,
    conventionalText: extString(od, EXT_RANGO_CONVENCIONAL_TEXTO),
    optimalText: extString(od, EXT_RANGO_OPTIMO_TEXTO),
    interpretation: extString(od, EXT_INTERPRETACION),
    source: extString(od, EXT_FUENTE),
    conventional: intervalsForContext(od, 'normal'),
    optimal: intervalsForContext(od, 'funcional-optimo'),
  };
}

/**
 * Elige el rango aplicable a un género: el específico si existe, si no el no
 * especificado, y como último recurso el primero. Devuelve undefined si la
 * lista está vacía.
 */
export function rangeForGender(ranges: BiomarkerRange[], gender?: string): BiomarkerRange | undefined {
  if (ranges.length === 0) {
    return undefined;
  }
  if (gender) {
    const specific = ranges.find((r) => r.gender === gender);
    if (specific) {
      return specific;
    }
  }
  return ranges.find((r) => !r.gender) ?? ranges[0];
}

/** Indexa las definiciones por código LOINC (solo las que tienen system LOINC). */
export function indexByLoinc(defs: BiomarkerDefinition[]): Map<string, BiomarkerDefinition> {
  const map = new Map<string, BiomarkerDefinition>();
  for (const def of defs) {
    if (def.code && def.system === LOINC_SYSTEM) {
      map.set(def.code, def);
    }
  }
  return map;
}

/** Indexa las definiciones por slug de biomarcador. */
export function indexByBiomarcador(defs: BiomarkerDefinition[]): Map<string, BiomarkerDefinition> {
  const map = new Map<string, BiomarkerDefinition>();
  for (const def of defs) {
    if (def.biomarcadorId) {
      map.set(def.biomarcadorId, def);
    }
  }
  return map;
}

/** Trae las ObservationDefinitions del servidor y las normaliza. */
export async function getBiomarkerDefinitions(medplum: MedplumClient): Promise<BiomarkerDefinition[]> {
  const ods = await medplum.searchResources('ObservationDefinition', { _count: '200' });
  return ods.map(parseObservationDefinition);
}
