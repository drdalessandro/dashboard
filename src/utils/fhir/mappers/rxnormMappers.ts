import { Reference, Medication, Dosage } from '@medplum/fhirtypes';
import { RxNormMedication } from '@/services/implementations/rxnorm';

/**
 * Convert RxNorm medication data to a FHIR Medication resource
 */
export function rxNormToFHIRMedication(rxNormData: RxNormMedication) {
  // Create base medication resource with comprehensive properties
  const medication: any = {
    resourceType: 'Medication',

    // Always set a status to indicate the medication's current state
    status: 'active', // Can be 'active', 'inactive', or 'entered-in-error'

    // Unique identifier for the medication
    identifier: [{
      system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
      value: rxNormData.rxcui
    }],

    // Primary code for the medication
    code: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: rxNormData.rxcui,
        display: rxNormData.name
      }]
    }
  };

  // Add dosage form if available
  if (rxNormData.dosageForm) {
    medication.form = {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        display: rxNormData.dosageForm
      }]
    };
  }

  // Add route of administration if available
  if (rxNormData.route) {
    medication.route = {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0162', // Standard route codes
        display: rxNormData.route
      }]
    };
  }

  // Add strength if available
  if (rxNormData.strength) {
    medication.strength = {
      numerator: {
        value: parseFloat(rxNormData.strength.split(' ')[0]),
        unit: rxNormData.strength.split(' ')[1] || 'mg'
      }
    };
  }

  // Add ingredients if available
  if (rxNormData.activeIngredients && rxNormData.activeIngredients.length > 0) {
    medication.ingredient = rxNormData.activeIngredients.map(ingredient => ({
      itemCodeableConcept: {
        coding: [{
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: ingredient.rxcui,
          display: ingredient.name
        }]
      },
      isActive: true
    }));
  }

  // Add manufacturer if known (optional)
  // You might want to fetch this from additional sources or add a field to RxNormMedication
  if (rxNormData.manufacturer) {
    medication.manufacturer = {
      display: rxNormData.manufacturer
    };
  }

  // Add package information if available
  if (rxNormData.packageSize) {
    medication.package = {
      content: [{
        amount: {
          value: rxNormData.packageSize,
          unit: rxNormData.packageUnit || 'tablets'
        }
      }]
    };
  }

  return medication;
}

/**
 * Convert RxNorm medication to a reference for use in MedicationRequest
 */
export function createMedicationReference(medication: RxNormMedication | Medication | null | undefined): Reference<Medication> | undefined {
  // Handle null or undefined input
  if (!medication) {
    return undefined;
  }

  // If medication is a FHIR Medication resource
  if ('resourceType' in medication && medication.resourceType === 'Medication') {
    const medResource = medication as Medication;
    return medResource.id
      ? {
        reference: `Medication/${medResource.id}`,
        display: medResource.code?.coding?.[0]?.display || 'Unknown Medication'
      }
      : {
        display: medResource.code?.coding?.[0]?.display || 'Unknown Medication'
      };
  }

  // If medication is RxNorm data
  const rxNormMed = medication as RxNormMedication;
  if (rxNormMed.rxcui || rxNormMed.name) {
    return {
      display: rxNormMed.name || 'Unknown Medication',
      identifier: rxNormMed.rxcui
        ? {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          value: rxNormMed.rxcui
        }
        : undefined
    };
  }

  return undefined;
}

/**
 * Convert medication form to dosage instructions
 */
export function generateDosageInstructions(medication: RxNormMedication, frequency: string, duration: string): Dosage {
  // Parse duration to extract numeric value and unit
  const durationMatch = duration.match(/(\d+)\s*(\w+)/);
  const durationValue = durationMatch ? parseInt(durationMatch[1]) : 1;
  const durationUnit = durationMatch ? durationMatch[2] : 'd';

  // Map duration unit to FHIR-compatible units
  const periodUnitMap: Record<string, 'd' | 'wk' | 'mo' | 'a' | 'h' | 'min' | 's'> = {
    'day': 'd',
    'days': 'd',
    'week': 'wk',
    'weeks': 'wk',
    'month': 'mo',
    'months': 'mo',
    'year': 'a',
    'years': 'a',
    'hour': 'h',
    'hours': 'h',
    'minute': 'min',
    'minutes': 'min',
    'second': 's',
    'seconds': 's'
  };

  const mappedPeriodUnit = periodUnitMap[durationUnit.toLowerCase()] || 'd';

  return {
    text: `Take ${medication.strength || 'as directed'}. ${frequency} for ${duration}. ${medication.route || 'By mouth'}.`,
    timing: {
      repeat: {
        frequency: 1, // Default to once per period
        period: durationValue,
        periodUnit: mappedPeriodUnit
      },
      code: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation',
          code: 'QD', // Once daily
          display: 'Every day'
        }],
        text: frequency
      }
    },
    route: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0162',
        code: medication.route || 'PO', // PO = Per Os (by mouth)
        display: medication.route || 'Oral'
      }]
    },
    method: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '421521009', // Swallow (administration method)
        display: 'Swallow'
      }]
    },
    doseAndRate: [
      {
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/dose-rate-type',
            code: 'ordered',
            display: 'Ordered'
          }]
        },
        doseQuantity: {
          value: parseFloat(medication.strength?.split(' ')[0] || '1'),
          unit: medication.strength?.split(' ')[1] || 'dose'
        }
      }
    ]
  };
}