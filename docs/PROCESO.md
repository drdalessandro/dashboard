# Segunda Opinión Médica · Seguimiento — Proceso y evolución del proyecto

> Documento integral de **todo lo construido** en el repositorio `dashboard`,
> desde su creación hasta hoy. Pensado para que un colega o institución nueva
> entienda de dónde viene la herramienta, cómo está armada y qué hace cada pieza.
> (No cubre la estética/branding; se enfoca en el producto y la ingeniería.)

Última actualización: 2026-06-25 · 120 commits · branch de trabajo `claude/nice-fermat-nuftrr` (PR #1).

---

## 1. Qué es

**Segunda Opinión Médica · Seguimiento** es una aplicación clínica construida sobre
**Medplum** (EHR open-source, API-first, basado en **FHIR R4**). Acompaña a un
paciente a lo largo del tiempo con foco **Cardio-Reno-Metabólico (CKM)** y, de a
poco, hacia **medicina de optimización / BioHacking**:

- **Riesgo cardiovascular** con las ecuaciones **PREVENT** (AHA 2024): ASCVD 10a,
  Insuficiencia Cardíaca 10a y ECV total 30a.
- **Estadío CKM** (0–4) según la guía AHA/ACC/ADA/ASN.
- **hGraph** (GoInvo): visualización radial del estado metabólico del paciente.
- **Panel de biomarcadores** (50 marcadores en 10 paneles) con rangos
  convencional y óptimo (Medicina 3.0), leídos como fuente de verdad FHIR.
- **Bots** (backend serverless de Medplum) que recalculan todo al llegar datos,
  generan alertas y planes de cuidado con IA.

El stack: **React 19 + Mantine 8 + TypeScript** (frontend), **Medplum Bots**
(backend), **FHIR** como modelo de datos, **Vite/Vitest** como tooling.

---

## 2. Línea de tiempo

El repo nació como el **Medplum Charting Demo** (starter de charting: ciclo de
vida de Encounters y notas clínicas). Sobre esa base se construyó toda la suite.

| Fase | Cuándo | Qué se construyó | Trazabilidad |
|---|---|---|---|
| **0. Base** | — | Medplum Charting Demo: Encounters, notas (`ClinicalImpression`), Observations, bots de nota (general/gineco/obstétrica). | `src/bots/core`, `src/components/*` |
| **1. Suite CKM** | jun 11–17 | hGraph + panel PREVENT, estadío CKM, dashboard `/ckm`, bot `ckm-recalculate`, alertas por email, SDOH, AccessPolicies, motor PREVENT verificado, simulador What-If, localización Argentina. | PRs #4–#43 |
| **2. IA y estudios** | jun 17 | CarePlan IA (Plan Bienestar 100 días), add-on "¿Qué estudios solicitar?". | PRs #44–#49 |
| **3. Scores de riesgo** | jun 24 | Etapas 1–4: categorización clínica de los scores, los 3 scores en el listado, ApoB/Lp(a) como potenciadores, CAC como reclasificador. | Commits `f4b8fe3`…`7b0cf82` |
| **4. Biomarcadores** | jun 24 | Etapas 5–8: bundle de ObservationDefinitions como fuente de verdad FHIR, panel por categoría, seed demo, tendencias (sparklines). | `afb5c2c`…`71262ac` |
| **5. Calidad y marca** | jun 24–25 | Etapa 9: fixes de la revisión adversarial 3–8. Etapa 10: marca Segunda Opinión Médica (logo + theme azul + login). | `5f0b388`, `89be7da` |

---

## 3. Fase 0 — La base (Medplum Charting Demo)

El punto de partida fue el starter de charting de Medplum:

- **Ciclo de vida del Encounter** y sus notas, modeladas como `ClinicalImpression`.
- **Conversión de notas a datos estructurados** (`Observation`, `Condition`).
- **Bots de nota de encuentro** (`src/bots/core`): `general-encounter-note`,
  `gynecology-encounter-note`, `obstetric-encounter-note`, con sus utilidades de
  charting (`charting-utils`, `observation-utils`) y tests.
- **Componentes de chart** (`src/components`): `SoapNote`, `EncounterDetails`,
  `EncounterHeader`, `PatientDetails`, `PatientObservations`, etc.

Todo esto sigue vivo y es la cama sobre la que se montó la suite CKM.

---

## 4. Fase 1 — Suite CKM (Cardio-Reno-Metabolismo)

El núcleo del producto. Se construyó en `src/ckm/` (lógica pura, reutilizable por
frontend y bots) + `src/bots/ckm/` (backend) + `src/scripts/` (operación).

### 4.1 Modelo y datos
- **`constants.ts`**: códigos LOINC de los parámetros CKM (PA, antropometría,
  metabólico, lípidos, renal, cardíaco), URLs de extensiones propias, los 5
  estadíos CKM.
- **`observations.ts`**: lectura unificada de Observations **sin importar el rol**
  que las cargó (paciente vía app "Control" o médico). Tolera la forma canónica
  US Core del panel de presión arterial y la forma legacy. Valida **plausibilidad
  de la PA** (descarta cargas con campos cruzados).
- **`extensions.ts`**: helpers puros para leer/escribir las extensiones CKM del
  `Patient` (estadío, hGraph data, PREVENTInputs).

### 4.2 Scoring y estadío
- **`scoring.ts`**: normaliza cada métrica a un score 0–1 para el hGraph,
  detecta valores críticos y **deriva el estadío CKM** (0–4) desde los últimos
  valores observados.
- **`hGraph` (`components/HGraph.tsx`)**: visualización radial (d3) del estado del
  paciente — el esquema que da identidad a la herramienta.

### 4.3 Motor PREVENT (el corazón del riesgo)
- **`prevent.ts`**: implementación de las **ecuaciones PREVENT (Khan et al.,
  Circulation 2024)**. Coeficientes β aislados y citados, **validados contra el
  vector de referencia oficial de la AHA** (`prevent.test.ts`: mujer 50a →
  14.7/9.2/8.1% exacto). Protegido por el flag `PREVENT_VERIFIED`: si fuera
  `false`, no publica riesgos sin verificar. Acepta colesterol **No-HDL directo**
  (para datos de la app Control).
- **Simulador What-If** (`PreventSimulator`, `/ckm/simulator/:id`): mueve los
  factores modificables y muestra el impacto estimado sobre el riesgo a 10 y 30 años.

### 4.4 Backend (bots) y operación
- **Bot `ckm-recalculate`**: al llegar Observations, recalcula hGraph + estadío +
  scores PREVENT y los persiste como extensiones del `Patient`. Corre en el
  servidor self-hosted (AWS Lambda / vmcontext).
- **Alertas por email (SES)**: empeoramiento de estadío, valores críticos y
  **tendencia "3 strikes"** (`alert-rules.ts` + `verify-alerts`).
- **AccessPolicies**: paciente v1.2 (para Control) y clínico v1.2, con scripts de
  upsert.
- **Scripts de diagnóstico**: `ckm-doctor` (panel) y `ckm-bots-doctor`
  (bots/subscriptions del self-hosted: memberships, reprocess, recreate-subs,
  guards de proyecto) — fruto de mucho troubleshooting de la infra Medplum.
- **Terminología**: import de ValueSets de VSAC, ValueSets self-contained con
  CodeSystem para Problems/Allergies, ValueSet curado de medicación
  cardiometabólica (RxNorm). Mensajes accionables ante HTTP 413.

### 4.5 SDOH y localización
- **Cuestionario SDOH** versionado (`/ckm/sdoh/:id`) + bot que conecta las
  respuestas a `PREVENTInputs`.
- **Localización Argentina**: DNI/CUIL, género autopercibido, perfil `Patient` AR.

---

## 5. Fase 2 — IA y estudios

- **CarePlan IA** (`careplan-generate`, `CarePlanPanel`): genera un **Plan
  Bienestar 100 días** con Claude, como **borrador con aprobación médica** (nunca
  publica sin revisión). Validado end-to-end con `verify-careplan`; latencia
  optimizada con abort claro y aviso de timeout del Lambda.
- **Add-on "¿Qué estudios solicitar?"** (`studies.ts`, `StudiesPanel`): motor de
  reglas + análisis de gaps que sugiere los próximos estudios según el perfil del
  paciente.

---

## 6. Fase 3–5 — Esta sesión (Etapas 1–10)

Trabajo realizado sobre el branch `claude/nice-fermat-nuftrr` (PR #1), en etapas
acotadas, cada una commiteada y testeada. **Foco: scores de riesgo → biomarcadores
→ calidad → marca.**

### Etapa 1 — Categorización clínica de los scores (`f4b8fe3`)
Los % crudos de PREVENT pasan a **niveles clínicos con color** (Bajo/Limítrofe/
Intermedio/Alto). Módulo `risk.ts` (primitiva pura reusable) + `RiskBadge`.
ASCVD usa los cortes de guía ACC/AHA; IC y ECV usan bandas **provisionales
marcadas como tales**.

### Etapa 2 — Los 3 scores en el listado (`9d20b41`)
El listado `/ckm` muestra ASCVD, IC y ECV como columnas **ordenables**, con
"sin dato" siempre al final. Comparador `compareRows` extraído y testeado.

### Revisión 1+2 (`a47d09c`)
Revisión adversarial: contraste WCAG (`autoContrast`), provisionalidad visible
(`*` + leyenda + `aria-label`), **salvedad PCE↔PREVENT** (los cortes son de las
PCE, el score es PREVENT que estima más bajo), test del orden.

### Etapa 3 — Puente BioHacking: ApoB / Lp(a) (`91b9ab5`)
ApoB y Lp(a) como **potenciadores de riesgo** junto a PREVENT (display-only).
Módulo `biomarkers.ts`; lectura en vivo desde el servidor.

### Etapa 4 — CAC como reclasificador (`7b0cf82`)
El score de calcio coronario **ajusta la categoría** de ASCVD (nunca el % de
PREVENT): power of zero (CAC=0 baja), ≥300 a Alto. Solo ASCVD.

### Etapa 5 — Biomarcadores como fuente de verdad FHIR (`afb5c2c`)
Carga las **50 ObservationDefinitions** del panel (metabólico,
lipídico, inflamación, micronutrientes, hormonal, renal-hepático, longevidad,
microbiota, tóxicos, autonómico) a Medplum (uploader CLI + UI) y lee sus rangos
**dinámicamente** (`observation-definitions.ts`).

### Etapa 6 — Panel UI de biomarcadores por categoría (`658649c`)
Página `/ckm/biomarkers/:id`: acordeón por panel, con último valor, rangos
convencional/óptimo y estado (Óptimo/Normal/Alto/Bajo) clasificado **agnóstico a
la dirección** y respetando el género.

### Etapa 7 — Seed de biomarcadores demo (`b724d9f`)
Script `seed-biomarkers-demo` que puebla el panel end-to-end. Su test contra las
50 definiciones reales **detectó un bug** del clasificador (Hb con óptimo de una
sola cola), que se corrigió.

### Etapa 8 — Tendencias (sparkline/historial) (`71262ac`)
Columna "Tendencia" con sparkline SVG por biomarcador; el seed escribe una serie
temporal para que haya tendencia que ver.

### Etapa 9 — Fixes de la revisión adversarial 3–8 (`5f0b388`)
Revisión multi-dimensión (31 agentes, 20/25 hallazgos confirmados). Lo más
relevante: el clasificador marcaba "Alto" valores **dentro del óptimo** cuando el
óptimo excede el tope convencional a propósito (T3 Libre, DHEA-S, Testosterona) —
corregido sin reintroducir el caso Hb. Además: CAC negativo/clamp, paginación de
queries, caveats clínicos, a11y.

### Etapa 10 — Marca Segunda Opinión Médica (`89be7da`)
Logo, theme azul sobrio/clínico (color principal #007ce8), login y landing rebrandeados (ver
`public/README.md` para subir el logo).

### Life's Essential 8 (LE8) — Etapas A–E

Puntaje de salud cardiovascular de la AHA (Lloyd-Jones DM, et al. *Circulation*
2022;146:e18–e43). 8 componentes, cada uno 0–100; el **compuesto** es el
promedio simple de los 8 y **solo se calcula si están los 8** (decisión de
producto). Categoría por componente y compuesto: Alto ≥80 · Moderado 50–79 ·
Bajo <50.

**Arquitectura (separación motor / datos / UI):**

- **A — Motor (`src/ckm/le8.ts`).** Puro y agnóstico de UI: las 8 tablas
  oficiales (dieta, actividad física, tabaco, sueño, IMC, lípidos no-HDL,
  glucosa, presión). `computeLE8(inputs)` devuelve sub-scores + faltantes, y el
  compuesto solo si están los 8. Glucosa: diabético por `Condition` **o** HbA1c
  ≥6.5 / glucemia ≥126; diabético sin HbA1c → dato insuficiente. Presión: −20 si
  hay antihipertensivo.
- **B — Componentes clínicos (`le8-clinical.ts` + `useLE8ClinicalInputs`).**
  Presión, IMC, no-HDL (directo o total−HDL) y glucosa salen de los
  `Observation` reusando `observations.ts` y `clinical.ts` (mismo criterio de
  diabetes/medicación que PREVENT → coherencia).
- **C — Cuestionarios del paciente (`le8-questionnaires.ts` + hook + bundle).**
  El paciente carga 4 `Questionnaire` en bio.medplum.com.ar; el dashboard
  **interpreta** las respuestas (no muestra el formulario en blanco):
  - **Sueño/PSQI** (`le8-sleep-psqi-v1`): scoring estándar de Buysse 1989 →
    índice global 0–21 (dato clínico) + horas reales (ítem 4) → score LE8 por
    duración.
  - **Dieta/MEPA** (`le8-diet-mepa-v1`): 16 ítems binarios → 0–16 → nivel 1–5.
    Crosswalk **provisional** (a calibrar con el equipo médico).
  - **Actividad/Exercise Vital Sign** (`le8-activity-evs-v1`): días × min/día.
  - **Tabaco** (`le8-tobacco-v1`): status/años/vapeo/humo de segunda mano.

  Los `linkId` de `le8-questionnaires.ts` son el contrato que respetan los
  recursos FHIR de `data/ckm/le8-questionnaires.json`. Carga: `npm run upload-le8`
  o `/upload/le8`.
- **D — UI (`LE8Panel`, tab "Salud CV · LE8").** Combina B + C → `computeLE8`.
  Rueda estilo AHA de 8 sectores (uno por componente, color por estado, gris si
  falta) con el compuesto al centro; desglose con la **fuente** de cada dato
  (laboratorio vs cuestionario); PSQI global y MEPA como extras.
- **E — Esta documentación** (+ la rueda AHA).

**Caveats** (marcados en la UI): crosswalk MEPA→nivel provisional; ajuste de
presión por medicación solo si hay antihipertensivos registrados; el compuesto
exige los 8 (sin los conductuales del paciente, queda parcial).

### Serie histórica de scores + tendencias (12 meses)

De la revisión de UX ("la película, no la foto"), con diseño y decisiones en
`docs/propuesta-serie-scores.md`:

- **Bot** (`ckm-recalculate` + `ckm/score-history.ts`): cada recálculo persiste
  los scores PREVENT como Observations del CodeSystem `ckm-scores` (regla
  anti-inflado: solo si el valor cambió o pasaron 24 h), con `derivedFrom` a la
  Observation disparadora. Alerta por **suba significativa** (≥2 pp, o cambio
  de categoría con ≥0.5 pp) por el mismo circuito de las alertas de tendencia
  (DetectedIssue + cooldown, Communication, Task, email).
- **UI**: sparklines de los 3 scores en `PREVENTPanel` (`useScoreHistory`) y
  columna "Tendencia" en la tabla LE8 para los 4 componentes clínicos
  (`ckm/le8-history.ts`: recompute histórico con "último valor conocido" por
  fecha; escala fija 0–100; los conductuales no tienen serie). Mínimo 3 puntos.
- **Quick wins previos**: unidades UCUM legibles (`ckm/units.ts`), puntajes LE8
  con color semántico, etiquetas del radar sin recorte.

### Reconfiguración cardiológica del panel de biomarcadores

El panel original citaba fuentes de medicina funcional/longevidad (Attia, Bryan
Johnson, "Lapreire") con un "óptimo" que competía visualmente con umbrales de
guía. Reorientado a cardiología, con **la guía 2026 AHA/ACC/ADA/ASN CKM**
(Ndumele et al., *Circulation*; DOI 10.1161/CIR.0000000000001453) **como fuente
de verdad**:

- **Dos secciones por `tier`** (extensión FHIR en cada ObservationDefinition):
  *Núcleo cardiovascular · guías (ACC/AHA · ADA · KDIGO)* — 11 biomarcadores:
  LDL-C, ApoB, Lp(a), HDL, TG, glucosa, HbA1c, creatinina, eGFR, **UACR** y
  hs-CRP — y *Complementario · fuera de guía CV* (los 40 restantes, con aviso).
- **UACR agregado al núcleo** (LOINC 9318-7): la guía recomienda evaluar eGFR
  **y** UACR para caracterizar ERC (albuminuria ≥30 mg/g = A2 aunque el eGFR sea
  normal). Umbrales de la guía en el núcleo: LDL ≥130, HDL <40 H/<50 M, TG ≥150,
  glucosa/HbA1c ADA, **hs-CRP ≥2.0 mg/L** (la guía usa 2.0, no 3.0).
- **Objetivos lipídicos por riesgo** (`ckm/lipid-targets.ts`): LDL-C y ApoB no
  tienen óptimo fijo; el objetivo baja a mayor riesgo (moderado <100/<90, alto
  <70/<80, muy alto **<55**/<65 mg/dL — la guía 2026 fija LDL-C <55 en muy alto
  riesgo y reducción ≥50 % en diabetes). El tramo se deriva del estadío CKM +
  categoría ASCVD; la fila muestra "En objetivo / Sobre objetivo".
- Se quitó el marco funcional ("Medicina 3.0", Attia, Bryan Johnson) del núcleo
  y del display del contexto óptimo.
- **Panel glucémico alineado a ADA/AHA**: glucemia y HbA1c (núcleo) usan el
  ideal de AHA Life's Essential 8 (<100 / <5.7 %) en vez del óptimo funcional
  (75–85 / <5.2). Insulina, HOMA-IR y fructosamina (complementario) quedan como
  **referencia sin objetivo diagnóstico ADA/AHA** (ADA/AHA no definen cortes
  para éstas); la fructosamina se cita como alternativa a la HbA1c cuando ésta
  no es fiable. Ácido úrico: referencia (la guía CKM no lo incluye).
- **Limpieza masiva de complementarios**: los ~36 biomarcadores que la guía
  2026 CKM no cubre (inflamación, micronutrientes, hormonal, longevidad,
  microbiota, tóxicos) pierden el "óptimo" funcional y las fuentes de medicina
  funcional (Attia, Bryan Johnson, "Lapreire"); quedan como **referencia · sin
  objetivo de guía CV**.
- **Nuevos en el núcleo (respaldo de guía)**: NT-proBNP y troponina hs (panel
  *Cardíaco*, ECV subclínica / estadío CKM 3) y **cistatina C** (renal, la guía
  recomienda combinar creatinina + cistatina para un eGFR más preciso). El
  núcleo pasó de 11 a 14 biomarcadores; el orden dentro de cada panel es
  determinístico (`BIOMARKER_ORDER`).

**Deploy (importante).** El panel lee las `ObservationDefinition` **del servidor
Medplum**, no del JSON del build. Editar `data/ckm/biomarker-definitions.json` no
cambia lo que se ve hasta **re-subir las definiciones**: (a) en la app, ir a
`/upload/biomarkers` (usa la sesión del usuario) y confirmar; o (b) por CLI,
`npm run upload-biomarker-defs` con `MEDPLUM_CLIENT_ID/SECRET`. El bundle es
idempotente (PUT por id): actualiza sin duplicar.

---

## 7. Principios de "herramienta médica"

Convenciones que atraviesan todo el código y conviene mantener:

1. **El motor de riesgo nunca se adultera.** PREVENT está verificado contra el
   vector oficial; las features (categorías, CAC, enhancers) ajustan la
   **presentación/categoría**, nunca el porcentaje calculado.
2. **Lo provisional se marca como tal.** Umbrales sin respaldo de guía (bandas IC/
   ECV, reglas CAC, rangos óptimos Medicina 3.0) están aislados, citados y
   señalizados ("revisar con el equipo médico"), no presentados como verdad dura.
3. **Lógica pura separada de la UI.** `risk.ts`, `biomarkers.ts`,
   `observation-definitions.ts`, `scoring.ts`, `prevent.ts` no dependen de React,
   así las pueden usar también los bots y se testean en Node.
4. **Revisión adversarial antes de mergear.** Dos pasadas (Etapas 1–2 y 3–8) con
   verificación escéptica e independiente de cada hallazgo.

---

## 8. Testing y calidad

- **191 tests** (Vitest, en Node) cubriendo la lógica pura: PREVENT vs vector
  oficial, categorización de riesgo, reclasificación CAC, clasificación de
  biomarcadores (incluidos los bordes que la revisión descubrió), parser de
  ObservationDefinitions, seed, comparador del listado, etc.
- El proyecto **no** testea componentes por render (no hay jsdom/testing-library):
  la lógica relevante vive en funciones puras testeadas; los componentes son
  envoltorios delgados.
- `npm test` corre toda la suite. `npm run build` hace typecheck + build de bots +
  Vite.

---

## 9. Scripts de operación (`package.json`)

| Script | Para qué |
|---|---|
| `dev` / `build` / `preview` | desarrollo y build |
| `test` / `test:coverage` | suite de tests |
| `build:bots` / `deploy-bots-server` | compilar y desplegar los bots al self-hosted |
| `ckm-doctor` / `ckm-bots-doctor` | diagnóstico del panel y de los bots/subscriptions |
| `import-vsac` / `upload-med-valueset` / `upload-condition-valueset` | terminología |
| `upload-biomarker-defs` | subir las 50 ObservationDefinitions del panel |
| `upload-le8` | subir los 4 Questionnaire de Life's Essential 8 |
| `seed-ckm-demo` / `seed-biomarkers-demo` | datos de demostración |
| `verify-prevent` / `verify-alerts` / `verify-careplan` | validaciones end-to-end |
| `upload-access-policy` / `upload-sdoh` / `localize-argentina` | operación |

La mayoría requieren `MEDPLUM_CLIENT_ID` y `MEDPLUM_CLIENT_SECRET` del
ClientApplication del proyecto.

---

## 10. Mapa del repositorio

```
src/
  ckm/                 # Lógica CKM pura + componentes + hooks (el núcleo del producto)
    prevent.ts         # Motor PREVENT verificado
    risk.ts            # Categorización de riesgo + reclasificación CAC
    scoring.ts         # Score 0-1 del hGraph + derivación de estadío
    observations.ts    # Lectura unificada de Observations CKM
    observation-definitions.ts  # Parser/lector de los biomarcadores (fuente FHIR)
    biomarkers.ts      # Potenciadores de riesgo (ApoB/Lp(a))
    biomarker-seed.ts  # Generación de valores demo
    studies.ts / careplan.ts / alert-rules.ts / argentina.ts
    components/         # HGraph, PREVENTPanel, RiskBadge, RiskEnhancers, Sparkline, ...
    hooks/              # useCKMData, useBiomarkerPanel, useObservationDefinitions, ...
  bots/
    core/               # Bots de nota de encuentro (base chart-demo)
    ckm/                # ckm-recalculate, sdoh-response, careplan-generate
  pages/                # CKMDashboard, BiomarkerPanelPage, SimulatorPage, SDOHForm, SignIn, Landing
  components/           # Componentes de chart + BrandLogo
  scripts/              # Operación, seed, verificación, terminología, diagnóstico
data/
  ckm/                  # biomarker-definitions.json, AccessPolicies, SDOH questionnaire
  core/ / example/      # ValueSets y datos de ejemplo
docs/                   # Esta documentación + integración con Control
```

---

## 11. Estado actual y próximos pasos

**Listo y verificado** (PR #1): scores de riesgo legibles, biomarcadores como
fuente de verdad FHIR con panel y tendencias, dos revisiones adversariales
aplicadas, marca Segunda Opinión Médica.

**Candidatos a futuro:**
- Renderizar más biomarcadores en el hGraph (HOMA-IR, hs-CRP, etc.).
- Filtros/orden por estado en el panel de biomarcadores.
- Endurecer la búsqueda de Observations por `system` (colisión cross-system de
  códigos LOINC — hoy latente, bajo riesgo).
- Multi-institución para comercialización (nombre/branding configurable por tenant).
- Leer los rangos de los biomarcadores 100% dinámicos desde las ObservationDefinitions
  cargadas (hoy ApoB/Lp(a) ya lo hacen; extender al resto del panel).
