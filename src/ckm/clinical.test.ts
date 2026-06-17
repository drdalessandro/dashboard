import type { Condition, MedicationRequest, Patient } from '@medplum/fhirtypes';
import {
  ageFromBirthDate,
  deriveMedicationFlags,
  hasDiabetes,
  hasSmoking,
  isActiveCondition,
  isClinicalCVD,
  patientPreventSex,
} from './clinical';

function condition(code: string, status?: string): Condition {
  return {
    resourceType: 'Condition',
    code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10-cm', code }] },
    clinicalStatus: status ? { coding: [{ code: status }] } : undefined,
  } as Condition;
}

function med(text: string): MedicationRequest {
  return {
    resourceType: 'MedicationRequest',
    status: 'active',
    medicationCodeableConcept: { text },
  } as MedicationRequest;
}

describe('clinical — flags PREVENT compartidos', () => {
  test('isClinicalCVD detecta ECV clínica por ICD-10', () => {
    expect(isClinicalCVD(condition('I25.10'))).toBe(true); // coronaria
    expect(isClinicalCVD(condition('I50.9'))).toBe(true); // IC
    expect(isClinicalCVD(condition('I63.9'))).toBe(true); // ACV
    expect(isClinicalCVD(condition('E11.9'))).toBe(false); // diabetes, no ECV
  });

  test('hasDiabetes reconoce E10-E14', () => {
    expect(hasDiabetes([condition('E11.9')])).toBe(true);
    expect(hasDiabetes([condition('E10.65')])).toBe(true);
    expect(hasDiabetes([condition('I10')])).toBe(false);
  });

  test('hasSmoking reconoce tabaquismo ICD-10 y SNOMED', () => {
    expect(hasSmoking([condition('Z72.0')])).toBe(true);
    expect(hasSmoking([condition('F17.210')])).toBe(true);
    expect(hasSmoking([condition('449868002')])).toBe(true);
    expect(hasSmoking([condition('I10')])).toBe(false);
  });

  test('isActiveCondition trata sin estado como activa', () => {
    expect(isActiveCondition(condition('I10'))).toBe(true);
    expect(isActiveCondition(condition('I10', 'active'))).toBe(true);
    expect(isActiveCondition(condition('I10', 'resolved'))).toBe(false);
  });

  test('deriveMedicationFlags detecta estatina y antihipertensivo por texto', () => {
    expect(deriveMedicationFlags([med('Atorvastatina 40 mg')])).toEqual({
      onStatin: true,
      onAntihypertensive: false,
    });
    expect(deriveMedicationFlags([med('Enalapril 10 mg')])).toEqual({
      onStatin: false,
      onAntihypertensive: true,
    });
    expect(deriveMedicationFlags([med('Metformina 850 mg')])).toEqual({
      onStatin: false,
      onAntihypertensive: false,
    });
  });

  test('patientPreventSex mapea solo male/female', () => {
    expect(patientPreventSex({ resourceType: 'Patient', gender: 'female' } as Patient)).toBe('female');
    expect(patientPreventSex({ resourceType: 'Patient', gender: 'male' } as Patient)).toBe('male');
    expect(patientPreventSex({ resourceType: 'Patient', gender: 'other' } as Patient)).toBeUndefined();
    expect(patientPreventSex({ resourceType: 'Patient' } as Patient)).toBeUndefined();
  });

  test('ageFromBirthDate calcula años y NaN sin fecha', () => {
    // 30 años + 100 días de margen para no quedar sobre el límite del año bisiesto
    const birth = new Date();
    birth.setFullYear(birth.getFullYear() - 30);
    birth.setDate(birth.getDate() - 100);
    expect(ageFromBirthDate(birth.toISOString().slice(0, 10))).toBe(30);
    expect(Number.isNaN(ageFromBirthDate(undefined))).toBe(true);
  });
});
