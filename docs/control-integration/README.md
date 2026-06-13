# Integración Control → Seguimiento (carga de datos del paciente)

Cambios para el repo **Control** (fork de `medplum/foomedical`) que permiten al
paciente cargar sus datos para que impacten en el score CKM/PREVENT de
**Seguimiento**. Apuntan al mismo servidor Medplum (`api.medplum.com.ar`), así
que una Observation creada en Control la lee el bot `ckm-recalculate` y recalcula
el hGraph, el estadío y PREVENT en tiempo real.

> Estos archivos viven en `seguimiento` solo como referencia. Hay que copiarlos
> al repo `control` y aplicarlos ahí.

## Contrato de datos (NO cambiar códigos ni unidades)

Los LOINC y las unidades deben coincidir con `seguimiento/src/ckm/constants.ts`.
De eso depende que el dato alimente el score.

| Lo que ve el paciente | id en measurementsMeta | LOINC | Unidad | Dónde |
|---|---|---|---|---|
| Filtrado glomerular (función del riñón) | `tfge` | 62238-1 | mL/min/1.73m² | Laboratorio |
| Triglicéridos | `triglycerides` | 2571-8 | mg/dL | Laboratorio |
| Colesterol HDL ("bueno") | `hdl` | 2085-9 | mg/dL | Laboratorio |
| Colesterol LDL ("malo") | `ldl` | 13457-7 | mg/dL | Laboratorio |
| Colesterol No-HDL | `non-hdl` | 43396-1 | mg/dL | Laboratorio |
| Hemoglobina glicosilada (HbA1c) | `hba1c` | 4548-4 | % | Laboratorio |
| Glucemia en ayunas | `fasting-glucose` | 1558-6 | mg/dL | Laboratorio |
| Presión arterial *(ya existe)* | `blood-pressure` | 85354-9 (8480-6/8462-4) | mm[Hg] | Registro de Salud |
| Índice de masa corporal (IMC) | `bmi` | 39156-5 | kg/m² | Registro de Salud |
| Circunferencia de cintura | `waist-circumference` | 56086-2 | cm | Registro de Salud |

**No-HDL vs Colesterol Total:** PREVENT usa el colesterol No-HDL directamente.
Seguimiento ya acepta `43396-1` (No-HDL) además de HDL (`2085-9`), así que con
esos dos el cálculo PREVENT funciona sin necesidad de cargar el colesterol total.

## Paso 1 — Definiciones de medición

Pegar las entradas de `measurementsMeta-additions.ts` dentro del objeto
`measurementsMeta` de `src/pages/health-record/Measurement.data.ts`. Usan las
mismas constantes de color que ya están en ese archivo.

## Paso 2 — Página Laboratorio

Copiar `Laboratorio.tsx` a `src/pages/laboratorio/Laboratorio.tsx`. Reutiliza el
componente `Measurement` para el formulario de carga.

## Paso 3 — Routing (`src/Router.tsx`)

Agregar las rutas de Laboratorio reutilizando el componente `Measurement`. Las
mediciones nuevas de vitals (IMC, Cintura) funcionan con la ruta existente
`/health-record/vitals/:measurementId` sin tocar nada.

```tsx
import { Laboratorio } from './pages/laboratorio/Laboratorio';
import { Measurement } from './pages/health-record/Measurement'; // ya importado

// dentro de <Routes>:
<Route path="laboratorio" element={<Laboratorio />} />
<Route path="laboratorio/:measurementId" element={<Measurement />} />
```

Si el componente `Measurement` arma un link de "volver" hardcodeado a
`/health-record/vitals`, conviene derivar la base de la ruta actual (o aceptar
que el back de labs apunte a vitals; es cosmético).

## Paso 4 — Menú superior (`src/components/Header.tsx`)

a) **Traducir** las etiquetas del menú:
- `Health Record` → **Registro de Salud**
- `Messages` → **Mensajes**
- (opcional) `Care Plan` → **Plan de Cuidado**, `Get Care` → **Atención**

b) **Agregar** el ítem **Laboratorio** entre "Registro de Salud" y "Mensajes".
En foomedical el menú es una lista de links; agregar uno nuevo a `/laboratorio`.
Ejemplo del patrón (adaptar al markup real del Header):

```tsx
const navLinks = [
  { label: 'Registro de Salud', href: '/health-record' },
  { label: 'Laboratorio', href: '/laboratorio' }, // ← NUEVO, en este orden
  { label: 'Mensajes', href: '/messages' },
  { label: 'Plan de Cuidado', href: '/care-plan' },
  { label: 'Atención', href: '/get-care' },
];
```

## Paso 5 — IMC y Cintura en el sidebar de Registro de Salud

El submenú de "Vitals" (Blood Pressure, Body Temperature, Height, …) enumera ids
de medición. Agregar `'bmi'` y `'waist-circumference'` a esa lista para que
aparezcan como opciones cargables, junto con la presión arterial que ya está.
(Traducir también esas etiquetas del submenú al español si se desea.)

## Cómo verificar

1. Loguearse en Control como paciente y cargar, por ejemplo, HDL, No-HDL, TFGe,
   IMC, glucemia, HbA1c y una presión arterial.
2. En Seguimiento, abrir el chart de ese paciente: el hGraph y los scores PREVENT
   deben actualizarse en segundos (el bot `ckm-recalculate` corre al llegar cada
   Observation).
3. Para PREVENT necesita el set mínimo: edad 30-79, sexo, No-HDL (o total), HDL,
   PA sistólica, eGFR e IMC. Con eso los % dejan de ser "—".

## Notas

- **Unidades UCUM:** el servidor valida `valueQuantity` contra UCUM. Usar
  `mg/dL`, `%`, `kg/m2`, `cm`, `mm[Hg]`. Para TFGe, `mL/min/{1.73_m2}` es la forma
  UCUM correcta; si el servidor la rechaza, usar `mL/min`.
- **Permisos del paciente:** la AccessPolicy "HeartInnovations — Patient Self
  Access v1.2" (en `seguimiento/data/ckm/patient-access-policy.json`) ya permite
  crear Observations. Asignarla como `defaultPatientAccessPolicy` del proyecto.
- **Presión arterial:** el formulario actual de Control muestra Diastólica
  primero, lo que induce a cargar los valores cruzados. Conviene invertir el
  orden (Sistólica primero) y validar sistólica > diastólica. Seguimiento ya
  descarta lecturas cruzadas, pero corregir el formulario evita el problema.
