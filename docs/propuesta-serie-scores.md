# Serie histórica de scores (PREVENT y LE8) — diseño e implementación

**Estado: implementado (Opción A + tendencia LE8 clínica).** Sale de la revisión
de UX del panel CKM: el dashboard mostraba la "foto" (último score) y queríamos
la "película" (tendencia). Decisiones tomadas con el equipo:

- **Ventana de tendencia: últimos 12 meses** (`TREND_WINDOW_MONTHS`).
- **Alerta por suba significativa de score: sí** (umbrales por defecto abajo,
  revisables con el equipo médico).
- **Fusión de PA sistólica/diastólica en el radar: rechazada** — el radar
  continúa con ambos vértices como está.

## 1. Problema

Los scores PREVENT (ASCVD 10a, IC 10a, ECV total 30a) y el estadío CKM se
persisten como **extensiones del recurso `Patient`** (`hGraphData`,
`ckm-stage`), que el bot `ckm-recalculate` **pisa en cada corrida**. No queda
serie temporal consultable: no se puede dibujar una tendencia, ni alertar por
"subió el score", ni auditar qué score vio el médico en una consulta pasada.

Los biomarcadores no tienen este problema: son `Observations` y su historial ya
se consulta hoy (panel de biomarcadores, `useBiomarkerPanel`, sparklines).

## 2. Opción A (implementada) — El bot persiste cada score como Observation

En cada corrida, además de actualizar las extensiones (que siguen siendo la
"foto" barata de leer), `ckm-recalculate` crea una `Observation` por outcome:

```
Observation {
  status: "final",
  code: { coding: [{
    system: "https://seguimiento.medplum.com.ar/fhir/CodeSystem/ckm-scores",
    code: "prevent-ascvd-10y" | "prevent-hf-10y" | "prevent-cvd-total-30y",
  }]},
  subject: Reference(Patient),
  effectiveDateTime: <fecha de corrida>,
  valueQuantity: { value: 2.1, unit: "%" },
  derivedFrom: [<refs a las Observations insumo>],   // trazabilidad
  device/performer: <ref al Bot>                      // quién lo calculó
}
```

Notas de diseño:

- **CodeSystem propio**: LOINC no tiene códigos para PREVENT (AHA 2023); usamos
  el sistema del proyecto, igual que ya hacemos con las extensiones. Si algún
  día aparece un LOINC oficial, se agrega como segundo `coding`.
- **Idempotencia / anti-inflado**: el bot corre con cada Observation nueva del
  paciente. Para no generar series infladas, solo se crea el punto si (a) el
  valor cambió respecto del último persistido, o (b) pasó un mínimo de tiempo
  (p. ej. 24 h) desde el último punto. Regla simple, testeable en el bot.
- **AccessPolicies**: revisar que las policies de clínico y paciente permitan
  leer (y el bot escribir) `Observation` con estos codes. Hoy ya permiten
  Observations, así que se espera cambio menor o nulo.
- **LE8**: mismo esquema si se quiere serie del compuesto
  (`le8-composite`), con la salvedad de la §4.

Consumo en UI: un hook `useScoreHistory(patient, code)` (search de
`Observation?code=...&_sort=date`) + el componente `Sparkline` **que ya existe**
junto a cada score del `PREVENTPanel`.

Ventajas: serie FHIR real — consultable, auditable, exportable, usable por las
reglas de alertas; coherente con la decisión de "biomarcadores como fuente de
verdad FHIR". Costo: cambio en el bot + revisión de policies.

## 3. Opción B (interina, sin cambio de datos) — Recomputar en el cliente

El motor PREVENT (`ckm/prevent.ts`) es puro; el historial de Observations ya se
puede traer (patrón de `useBiomarkerPanel`). Se puede reconstruir "el último
valor conocido de cada insumo a la fecha t" y recomputar el score en varios
puntos del pasado, todo client-side.

Sirve como puente (no toca el bot), pero tiene límites que hay que aceptar
explícitamente:

- Los flags (diabetes, tabaquismo, medicación) muchas veces no tienen fecha
  confiable → el score recalculado a fecha pasada **puede no coincidir** con el
  que se mostró ese día.
- Costo de red/CPU en cada render de la ficha.
- La serie no existe en FHIR: las alertas y exportaciones no la ven.

Si se hace, dejar el cálculo en un módulo puro con tests (mismo estándar que el
resto de `src/ckm`) para poder compararlo contra la Opción A cuando exista.

## 4. LE8: qué serie es honesta y cuál no

- **Componentes clínicos** (IMC, lípidos, glucosa, presión): recomputables por
  fecha desde el historial de Observations → columna "Tendencia" viable.
- **Componentes conductuales** (dieta, actividad, tabaco, sueño): salen de
  cuestionarios que el paciente responde esporádicamente; casi siempre hay un
  solo punto → **no prometer sparkline**; mostrar "—" hasta tener ≥3 puntos.
- **Compuesto**: exige los 8 componentes; una "tendencia del compuesto" sería
  en la práctica la tendencia de los 4 clínicos disfrazada → no mostrarla como
  tendencia del compuesto. Si hay serie del compuesto persistida (Opción A,
  puntos solo cuando estuvieron los 8), esa sí es honesta.

## 5. Reglas de presentación (para cualquier opción)

- Sparkline solo con **≥3 puntos**; con menos, no mostrar nada (el componente
  actual ya no renderiza con <2).
- **Escala fija 0–100** para sub-scores LE8 (hoy el Sparkline autoescala
  min–max y una variación trivial parece una montaña). Para scores PREVENT
  (porcentajes chicos), escala min–max con piso mínimo de rango.
- Tooltip con primer/último valor y fechas (patrón `trendLabel` del panel de
  biomarcadores).
- Punto final coloreado por el estado semántico del último valor.

## 6. Estado de implementación

| Etapa | Qué | Estado |
|---|---|---|
| 1 | Bot: Observations de score (`ckm/score-history.ts` + `persistScoreSeries` en `ckm-recalculate`) | ✔ hecho |
| 2 | UI: `useScoreHistory` + sparklines en los 3 scores del `PREVENTPanel` | ✔ hecho |
| 3 | LE8 clínicos: recompute histórico (`ckm/le8-history.ts`) + columna "Tendencia" | ✔ hecho |
| 4 | (Opcional) Backfill: recomputar retroactivo y sembrar la serie inicial | pendiente |

Notas de lo implementado:

- Solo se persisten scores **recién calculados**; los preservados de corridas
  anteriores (cuando faltan insumos) no generan puntos.
- La alerta de suba reutiliza el ancla anti-spam de las alertas de tendencia
  (DetectedIssue + cooldown de 30 días) y el mismo circuito
  Communication + Task + email.
- Umbrales de suba (`score-history.ts`, revisables con el equipo médico):
  alerta si el score subió **≥ 2 pp absolutos**, o si **cambió a una categoría
  de riesgo superior** con una suba de al menos **0.5 pp** (evita alertar por
  rozar el corte, ej. 4.9 → 5.0).
- La serie PREVENT arranca vacía: los sparklines aparecen cuando el bot haya
  persistido ≥ 3 puntos (o antes, si se hace el backfill de la Etapa 4).

## 7. Decisiones tomadas

1. **Ventana de la tendencia: últimos 12 meses.**
2. **Alerta por suba significativa: sí**, con los umbrales por defecto de la
   sección 6 (a calibrar con el equipo médico si genera ruido).
3. **Fusión de PA sistólica/diastólica en el radar: rechazada.** El radar
   continúa mostrando ambos vértices por separado.
