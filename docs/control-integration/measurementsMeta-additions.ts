// ============================================================================
// Control (foomedical fork) — Nuevas mediciones CKM para measurementsMeta
// ----------------------------------------------------------------------------
// COPIAR estas entradas dentro del objeto `measurementsMeta` de
//   src/pages/health-record/Measurement.data.ts
// (respetando las constantes de color backgroundColor/borderColor/
//  secondBackgroundColor/secondBorderColor que ya existen en ese archivo).
//
// Los LOINC y unidades coinciden EXACTAMENTE con lo que Seguimiento lee
// (src/ckm/constants.ts) y con lo que necesita el motor PREVENT. No cambiar
// los códigos ni las unidades: de eso depende que el dato impacte en el score.
//
// Títulos en lenguaje de paciente (sin jerga). El paciente copia el número de
// su análisis de laboratorio.
// ============================================================================

// ── Laboratorio (sección nueva) ─────────────────────────────────────────────

'tfge': {
  id: 'tfge',
  code: '62238-1', // Filtrado glomerular estimado (TFGe / eGFR)
  title: 'Filtrado glomerular (función del riñón)',
  description:
    'El filtrado glomerular estimado (TFGe) indica qué tan bien limpian la sangre sus riñones. ' +
    'Lo encuentra en su análisis de laboratorio, a veces como "TFGe", "VFG" o "eGFR".',
  chartDatasets: [{ label: 'TFGe', unit: 'mL/min/{1.73_m2}', backgroundColor, borderColor }],
},

'triglycerides': {
  id: 'triglycerides',
  code: '2571-8', // Triglicéridos
  title: 'Triglicéridos (grasas en sangre)',
  description: 'Los triglicéridos son un tipo de grasa en la sangre. Valores altos aumentan el riesgo cardiovascular.',
  chartDatasets: [{ label: 'Triglicéridos', unit: 'mg/dL', backgroundColor, borderColor }],
},

'hdl': {
  id: 'hdl',
  code: '2085-9', // Colesterol HDL
  title: 'Colesterol HDL ("bueno")',
  description: 'El colesterol HDL ayuda a proteger su corazón. En general, valores más altos son mejores.',
  chartDatasets: [{ label: 'HDL', unit: 'mg/dL', backgroundColor, borderColor }],
},

'ldl': {
  id: 'ldl',
  code: '13457-7', // Colesterol LDL (calculado)
  title: 'Colesterol LDL ("malo")',
  description: 'El colesterol LDL puede acumularse en las arterias. En general, valores más bajos son mejores.',
  chartDatasets: [{ label: 'LDL', unit: 'mg/dL', backgroundColor, borderColor }],
},

'non-hdl': {
  id: 'non-hdl',
  code: '43396-1', // Colesterol No-HDL
  title: 'Colesterol No-HDL',
  description:
    'El colesterol No-HDL resume todo el colesterol "malo" de la sangre. ' +
    'Figura en su análisis de laboratorio. Es el valor que usa el cálculo de riesgo cardiovascular.',
  chartDatasets: [{ label: 'No-HDL', unit: 'mg/dL', backgroundColor, borderColor }],
},

'hba1c': {
  id: 'hba1c',
  code: '4548-4', // Hemoglobina glicosilada A1c
  title: 'Hemoglobina glicosilada (HbA1c)',
  description: 'La HbA1c refleja el promedio de azúcar en sangre de los últimos 2 a 3 meses.',
  chartDatasets: [{ label: 'HbA1c', unit: '%', backgroundColor, borderColor }],
},

'fasting-glucose': {
  id: 'fasting-glucose',
  code: '1558-6', // Glucosa en ayunas
  title: 'Glucemia en ayunas (azúcar en sangre)',
  description: 'El azúcar en sangre medido en ayunas (sin haber comido). Ayuda a evaluar el riesgo de diabetes.',
  chartDatasets: [{ label: 'Glucemia ayunas', unit: 'mg/dL', backgroundColor, borderColor }],
},

// ── Registro de Salud / Signos vitales (entradas nuevas) ────────────────────

'bmi': {
  id: 'bmi',
  code: '39156-5', // Índice de masa corporal
  title: 'Índice de masa corporal (IMC)',
  description: 'El IMC relaciona su peso con su altura para evaluar si su peso es saludable.',
  chartDatasets: [{ label: 'IMC', unit: 'kg/m2', backgroundColor, borderColor }],
},

'waist-circumference': {
  id: 'waist-circumference',
  code: '56086-2', // Circunferencia de cintura
  title: 'Circunferencia de cintura',
  description:
    'La medida de su cintura con una cinta métrica. Una cintura grande se asocia con mayor riesgo ' +
    'cardiovascular y metabólico.',
  chartDatasets: [{ label: 'Cintura', unit: 'cm', backgroundColor, borderColor }],
},
