// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { LOINC, LOINC_BP_PANEL } from '../../ckm/constants';

export interface ObservationType {
  id: string;
  code: string;
  title: string;
  description: string;
  chartDatasets: {
    label: string;
    code?: string;
    unit: string;
    backgroundColor: string;
    borderColor: string;
  }[];
}

const backgroundColor = 'rgba(29, 112, 214, 0.7)';
const borderColor = 'rgba(29, 112, 214, 1)';
const secondBackgroundColor = 'rgba(255, 119, 0, 0.7)';
const secondBorderColor = 'rgba(255, 119, 0, 1)';

/** Helper para mediciones de un solo valor (valueQuantity). */
function single(id: string, code: string, title: string, unit: string): ObservationType {
  return {
    id,
    code,
    title,
    description: title,
    chartDatasets: [{ label: title, unit, backgroundColor, borderColor }],
  };
}

// Todas las mediciones CKM (más altura/peso). El orden define el orden del menú.
// Los LOINC coinciden con src/ckm/constants.ts y con lo que carga Control.
export const measurementStyles: Record<string, ObservationType> = {
  'blood-pressure': {
    id: 'blood-pressure',
    code: LOINC_BP_PANEL,
    title: 'Presión arterial',
    description:
      'La presión arterial es la fuerza que ejerce la sangre sobre las paredes de las arterias. ' +
      'Valores altos sostenidos (hipertensión) aumentan el riesgo cardiovascular.',
    chartDatasets: [
      // Orden alineado al component[] canónico US Core del panel 85354-9: sistólica primero,
      // diastólica segundo. getObservationValues (ObservationGraph.tsx) mapea por índice.
      { label: 'Sistólica', code: LOINC.sbp, unit: 'mm[Hg]', backgroundColor, borderColor },
      {
        label: 'Diastólica',
        code: LOINC.dbp,
        unit: 'mm[Hg]',
        backgroundColor: secondBackgroundColor,
        borderColor: secondBorderColor,
      },
    ],
  },
  bmi: single('bmi', LOINC.bmi, 'Índice de masa corporal (IMC)', 'kg/m^2'),
  waist: single('waist', LOINC.waist, 'Circunferencia de cintura', 'cm'),
  egfr: single('egfr', LOINC.egfr, 'Filtrado glomerular (TFGe)', 'mL/min/{1.73_m2}'),
  glucose: single('glucose', LOINC.glucoseFasting, 'Glucemia en ayunas', 'mg/dL'),
  hba1c: single('hba1c', LOINC.hba1c, 'Hemoglobina glicosilada (HbA1c)', '%'),
  'total-cholesterol': single('total-cholesterol', LOINC.cholesterolTotal, 'Colesterol total', 'mg/dL'),
  hdl: single('hdl', LOINC.hdlc, 'Colesterol HDL', 'mg/dL'),
  ldl: single('ldl', LOINC.ldlc, 'Colesterol LDL', 'mg/dL'),
  'non-hdl': single('non-hdl', LOINC.nonHdlc, 'Colesterol No-HDL', 'mg/dL'),
  triglycerides: single('triglycerides', LOINC.triglycerides, 'Triglicéridos', 'mg/dL'),
  creatinine: single('creatinine', LOINC.creatinine, 'Creatinina', 'mg/dL'),
  uacr: single('uacr', LOINC.uacr, 'UACR (albúmina/creatinina)', 'mg/g'),
  potassium: single('potassium', LOINC.potassium, 'Potasio', 'mmol/L'),
  ntprobnp: single('ntprobnp', LOINC.ntProBNP, 'NT-proBNP', 'pg/mL'),
  troponin: single('troponin', LOINC.hsCtnI, 'Troponina I ultrasensible', 'ng/L'),
  cac: single('cac', LOINC.cac, 'Score de calcio coronario', 'Agatston'),
  height: single('height', '8302-2', 'Altura', 'cm'),
  weight: single('weight', '29463-7', 'Peso', 'kg'),
};
