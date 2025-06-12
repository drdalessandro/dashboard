import { MedplumClient } from '@medplum/core';
import {
    AllergyIntolerance,
    Immunization,
    Condition,
    MedicationRequest,
    Patient
} from '@medplum/fhirtypes';

class PatientClinicalDataSeeder {
    private medplum: MedplumClient;
    private patientId = '01970192-304e-723a-881f-ab29b1308594';

    constructor(medplumClient: MedplumClient) {
        this.medplum = medplumClient;
    }

    async seedAllClinicalData() {
        try {
            console.log(`Seeding clinical data for patient: ${this.patientId}`);

            // Verify patient exists first
            const patient = await this.verifyPatient();
            console.log(`✓ Patient verified: ${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family}`);

            // Seed all clinical resources
            const allergies = await this.seedAllergyIntolerances();
            const immunizations = await this.seedImmunizations();
            const conditions = await this.seedConditions();
            const medications = await this.seedMedicationRequests();

            console.log('\n✓ All clinical data seeded successfully!');

            return {
                patient,
                allergies,
                immunizations,
                conditions,
                medications
            };
        } catch (error) {
            console.error('Error seeding clinical data:', error);
            throw error;
        }
    }

    private async verifyPatient(): Promise<Patient> {
        const patient = await this.medplum.readResource('Patient', this.patientId);
        if (!patient) {
            throw new Error(`Patient with ID ${this.patientId} not found`);
        }
        return patient;
    }

    // AllergyIntolerance Resources
    async seedAllergyIntolerances(): Promise<AllergyIntolerance[]> {
        const allergies: Partial<AllergyIntolerance>[] = [
            {
                resourceType: 'AllergyIntolerance',
                patient: { reference: `Patient/${this.patientId}` },
                clinicalStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                        code: 'active',
                        display: 'Active'
                    }]
                },
                verificationStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
                        code: 'confirmed',
                        display: 'Confirmed'
                    }]
                },
                type: 'allergy',
                category: ['medication'],
                criticality: 'high',
                code: {
                    coding: [{
                        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                        code: '7980',
                        display: 'Penicillin'
                    }],
                    text: 'Penicillin'
                },
                reaction: [{
                    manifestation: [{
                        coding: [{
                            system: 'http://snomed.info/sct',
                            code: '247472004',
                            display: 'Wheal'
                        }],
                        text: 'Skin rash and swelling'
                    }],
                    severity: 'severe',
                    onset: '2020-03-15'
                }],
                recordedDate: '2023-01-15',
                note: [{
                    text: 'Patient reports severe allergic reaction to penicillin with skin rash. Documented during initial consultation.'
                }]
            },
            {
                resourceType: 'AllergyIntolerance',
                patient: { reference: `Patient/${this.patientId}` },
                clinicalStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                        code: 'active',
                        display: 'Active'
                    }]
                },
                verificationStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
                        code: 'confirmed',
                        display: 'Confirmed'
                    }]
                },
                type: 'intolerance',
                category: ['food'],
                criticality: 'low',
                code: {
                    coding: [{
                        system: 'http://snomed.info/sct',
                        code: '412071004',
                        display: 'Lactose'
                    }],
                    text: 'Lactose intolerance'
                },
                reaction: [{
                    manifestation: [{
                        coding: [{
                            system: 'http://snomed.info/sct',
                            code: '62315008',
                            display: 'Diarrhea'
                        }],
                        text: 'Digestive discomfort and diarrhea'
                    }],
                    severity: 'mild'
                }],
                recordedDate: '2023-02-10',
                note: [{
                    text: 'Mild lactose intolerance causing digestive issues. Patient manages with lactose-free alternatives.'
                }]
            }
        ];

        const createdAllergies: AllergyIntolerance[] = [];
        for (const allergy of allergies) {
            const created = await this.medplum.createResource({
                resourceType: 'AllergyIntolerance',
                patient: { reference: `Patient/${this.patientId}` },
                ...allergy
            });
            createdAllergies.push(created);
            console.log(`✓ Created AllergyIntolerance: ${allergy.code?.text}`);
        }

        return createdAllergies;
    }

    // Immunization Resources
    async seedImmunizations(): Promise<Immunization[]> {
        const immunizations: Partial<Immunization>[] = [
            {
                resourceType: 'Immunization',
                status: 'completed',
                vaccineCode: {
                    coding: [{
                        system: 'http://hl7.org/fhir/sid/cvx',
                        code: '207',
                        display: 'COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose'
                    }],
                    text: 'COVID-19 Vaccine (Pfizer-BioNTech)'
                },
                patient: { reference: `Patient/${this.patientId}` },
                occurrenceDateTime: '2023-03-15',
                recorded: '2023-03-15',
                primarySource: true,
                location: {
                    reference: 'Location/community-health-center-bamako'
                },
                manufacturer: {
                    display: 'Pfizer-BioNTech'
                },
                lotNumber: 'FL8726',
                expirationDate: '2024-03-15',
                site: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/v3-ActSite',
                        code: 'LA',
                        display: 'left arm'
                    }]
                },
                route: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration',
                        code: 'IM',
                        display: 'intramuscular'
                    }]
                },
                doseQuantity: {
                    value: 0.3,
                    unit: 'mL',
                    system: 'http://unitsofmeasure.org',
                    code: 'mL'
                },
                note: [{
                    text: 'First dose of COVID-19 vaccination series. Patient tolerated well with no immediate adverse reactions.'
                }]
            },
            {
                resourceType: 'Immunization',
                status: 'completed',
                vaccineCode: {
                    coding: [{
                        system: 'http://hl7.org/fhir/sid/cvx',
                        code: '141',
                        display: 'Influenza, seasonal, injectable'
                    }],
                    text: 'Seasonal Influenza Vaccine'
                },
                patient: { reference: `Patient/${this.patientId}` },
                occurrenceDateTime: '2023-10-15',
                recorded: '2023-10-15',
                primarySource: true,
                location: {
                    reference: 'Location/community-health-center-bamako'
                },
                lotNumber: 'FLU2023-10',
                expirationDate: '2024-10-15',
                site: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/v3-ActSite',
                        code: 'RA',
                        display: 'right arm'
                    }]
                },
                route: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration',
                        code: 'IM',
                        display: 'intramuscular'
                    }]
                },
                doseQuantity: {
                    value: 0.5,
                    unit: 'mL',
                    system: 'http://unitsofmeasure.org',
                    code: 'mL'
                },
                note: [{
                    text: 'Annual seasonal influenza vaccination. Part of preventive care program.'
                }]
            }
        ];

        const createdImmunizations: Immunization[] = [];
        for (const immunization of immunizations) {
            const created = await this.medplum.createResource({
                resourceType: 'Immunization',
                status: 'completed',
                vaccineCode: immunization.vaccineCode || {
                    coding: [],
                    text: 'Unknown Vaccine'
                },
                patient: { reference: `Patient/${this.patientId}` },
                ...immunization
            });
            createdImmunizations.push(created);
            console.log(`✓ Created Immunization: ${immunization.vaccineCode?.text}`);
        }

        return createdImmunizations;
    }

    // Condition Resources
    async seedConditions(): Promise<Condition[]> {
        const conditions: Partial<Condition>[] = [
            {
                resourceType: 'Condition',
                clinicalStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                        code: 'active',
                        display: 'Active'
                    }]
                },
                verificationStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                        code: 'confirmed',
                        display: 'Confirmed'
                    }]
                },
                category: [{
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                        code: 'problem-list-item',
                        display: 'Problem List Item'
                    }]
                }],
                severity: {
                    coding: [{
                        system: 'http://snomed.info/sct',
                        code: '24484000',
                        display: 'Severe'
                    }]
                },
                code: {
                    coding: [{
                        system: 'http://snomed.info/sct',
                        code: '38341003',
                        display: 'Hypertensive disorder, systemic arterial'
                    }],
                    text: 'Hypertension'
                },
                subject: { reference: `Patient/${this.patientId}` },
                onsetDateTime: '2022-08-15',
                recordedDate: '2022-08-20',
                recorder: {
                    reference: 'Practitioner/dr-aminata-diallo'
                },
                note: [{
                    text: 'Patient diagnosed with essential hypertension. Currently managing with lifestyle modifications and medication.'
                }]
            },
            {
                resourceType: 'Condition',
                clinicalStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                        code: 'active',
                        display: 'Active'
                    }]
                },
                verificationStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                        code: 'confirmed',
                        display: 'Confirmed'
                    }]
                },
                category: [{
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                        code: 'problem-list-item',
                        display: 'Problem List Item'
                    }]
                }],
                severity: {
                    coding: [{
                        system: 'http://snomed.info/sct',
                        code: '255604002',
                        display: 'Mild'
                    }]
                },
                code: {
                    coding: [{
                        system: 'http://snomed.info/sct',
                        code: '73211009',
                        display: 'Diabetes mellitus'
                    }],
                    text: 'Type 2 Diabetes Mellitus'
                },
                subject: { reference: `Patient/${this.patientId}` },
                onsetDateTime: '2023-01-10',
                recordedDate: '2023-01-15',
                recorder: {
                    reference: 'Practitioner/dr-aminata-diallo'
                },
                note: [{
                    text: 'Newly diagnosed Type 2 diabetes mellitus. Patient started on metformin and dietary counseling.'
                }]
            }
        ];

        const createdConditions: Condition[] = [];
        for (const condition of conditions) {
            const created = await this.medplum.createResource({
                resourceType: 'Condition',
                subject: { reference: `Patient/${this.patientId}` },
                ...condition
            });
            createdConditions.push(created);
            console.log(`✓ Created Condition: ${condition.code?.text}`);
        }

        return createdConditions;
    }

    // MedicationRequest Resources
    async seedMedicationRequests(): Promise<MedicationRequest[]> {
        const medicationRequests: Partial<MedicationRequest>[] = [
            {
                resourceType: 'MedicationRequest',
                status: 'active',
                intent: 'order',
                medicationCodeableConcept: {
                    coding: [{
                        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                        code: '860975',
                        display: 'Lisinopril 10 MG Oral Tablet'
                    }],
                    text: 'Lisinopril 10mg tablets'
                },
                subject: { reference: `Patient/${this.patientId}` },
                authoredOn: '2023-08-20',
                requester: {
                    reference: 'Practitioner/dr-aminata-diallo'
                },
                reasonReference: [{
                    reference: 'Condition/hypertension-condition-id'
                }],
                dosageInstruction: [{
                    text: 'Take one tablet by mouth once daily',
                    timing: {
                        repeat: {
                            frequency: 1,
                            period: 1,
                            periodUnit: 'd'
                        }
                    },
                    route: {
                        coding: [{
                            system: 'http://snomed.info/sct',
                            code: '26643006',
                            display: 'Oral route'
                        }]
                    },
                    doseAndRate: [{
                        doseQuantity: {
                            value: 1,
                            unit: 'tablet',
                            system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
                            code: 'TAB'
                        }
                    }]
                }],
                dispenseRequest: {
                    numberOfRepeatsAllowed: 5,
                    quantity: {
                        value: 30,
                        unit: 'tablet',
                        system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
                        code: 'TAB'
                    },
                    expectedSupplyDuration: {
                        value: 30,
                        unit: 'days',
                        system: 'http://unitsofmeasure.org',
                        code: 'd'
                    }
                },
                note: [{
                    text: 'For hypertension management. Monitor blood pressure regularly. Check kidney function in 4 weeks.'
                }]
            },
            {
                resourceType: 'MedicationRequest',
                status: 'active',
                intent: 'order',
                medicationCodeableConcept: {
                    coding: [{
                        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                        code: '860719',
                        display: 'Metformin hydrochloride 500 MG Oral Tablet'
                    }],
                    text: 'Metformin 500mg tablets'
                },
                subject: { reference: `Patient/${this.patientId}` },
                authoredOn: '2023-01-15',
                requester: {
                    reference: 'Practitioner/dr-aminata-diallo'
                },
                reasonReference: [{
                    reference: 'Condition/diabetes-condition-id'
                }],
                dosageInstruction: [{
                    text: 'Take one tablet by mouth twice daily with meals',
                    timing: {
                        repeat: {
                            frequency: 2,
                            period: 1,
                            periodUnit: 'd'
                        }
                    },
                    route: {
                        coding: [{
                            system: 'http://snomed.info/sct',
                            code: '26643006',
                            display: 'Oral route'
                        }]
                    },
                    doseAndRate: [{
                        doseQuantity: {
                            value: 1,
                            unit: 'tablet',
                            system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
                            code: 'TAB'
                        }
                    }]
                }],
                dispenseRequest: {
                    numberOfRepeatsAllowed: 6,
                    quantity: {
                        value: 60,
                        unit: 'tablet',
                        system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
                        code: 'TAB'
                    },
                    expectedSupplyDuration: {
                        value: 30,
                        unit: 'days',
                        system: 'http://unitsofmeasure.org',
                        code: 'd'
                    }
                },
                note: [{
                    text: 'For Type 2 diabetes management. Take with meals to reduce GI side effects. Monitor blood glucose levels.'
                }]
            },
            {
                resourceType: 'MedicationRequest',
                status: 'completed',
                intent: 'order',
                medicationCodeableConcept: {
                    coding: [{
                        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                        code: '197361',
                        display: 'Amoxicillin 500 MG Oral Capsule'
                    }],
                    text: 'Amoxicillin 500mg capsules'
                },
                subject: { reference: `Patient/${this.patientId}` },
                authoredOn: '2023-11-05',
                requester: {
                    reference: 'Practitioner/dr-aminata-diallo'
                },
                dosageInstruction: [{
                    text: 'Take one capsule by mouth three times daily for 7 days',
                    timing: {
                        repeat: {
                            frequency: 3,
                            period: 1,
                            periodUnit: 'd',
                            boundsDuration: {
                                value: 7,
                                unit: 'days',
                                system: 'http://unitsofmeasure.org',
                                code: 'd'
                            }
                        }
                    },
                    route: {
                        coding: [{
                            system: 'http://snomed.info/sct',
                            code: '26643006',
                            display: 'Oral route'
                        }]
                    },
                    doseAndRate: [{
                        doseQuantity: {
                            value: 1,
                            unit: 'capsule',
                            system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
                            code: 'CAP'
                        }
                    }]
                }],
                dispenseRequest: {
                    numberOfRepeatsAllowed: 0,
                    quantity: {
                        value: 21,
                        unit: 'capsule',
                        system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
                        code: 'CAP'
                    },
                    expectedSupplyDuration: {
                        value: 7,
                        unit: 'days',
                        system: 'http://unitsofmeasure.org',
                        code: 'd'
                    }
                },
                note: [{
                    text: 'Prescribed for bacterial respiratory infection. Complete full course even if symptoms improve.'
                }]
            }
        ];

        const createdMedications: MedicationRequest[] = [];
        for (const medication of medicationRequests) {
            const created = await this.medplum.createResource({
                resourceType: 'MedicationRequest',
                status: 'active',
                intent: 'order',
                subject: { reference: `Patient/${this.patientId}` },
                ...medication
            });
            createdMedications.push(created);
            console.log(`✓ Created MedicationRequest: ${medication.medicationCodeableConcept?.text}`);
        }

        return createdMedications;
    }
}

// Usage Example
export async function seedPatientClinicalData(medplumClient: MedplumClient) {
    const seeder = new PatientClinicalDataSeeder(medplumClient);

    try {
        const result = await seeder.seedAllClinicalData();

        console.log('\n📊 Summary of seeded data:');
        console.log(`   • ${result.allergies.length} AllergyIntolerance resources`);
        console.log(`   • ${result.immunizations.length} Immunization resources`);
        console.log(`   • ${result.conditions.length} Condition resources`);
        console.log(`   • ${result.medications.length} MedicationRequest resources`);

        return result;
    } catch (error) {
        console.error('❌ Failed to seed clinical data:', error);
        throw error;
    }
}

// Direct seeding functions for individual resource types
export async function seedPatientAllergies(medplumClient: MedplumClient) {
    const seeder = new PatientClinicalDataSeeder(medplumClient);
    return await seeder.seedAllergyIntolerances();
}

export async function seedPatientImmunizations(medplumClient: MedplumClient) {
    const seeder = new PatientClinicalDataSeeder(medplumClient);
    return await seeder.seedImmunizations();
}

export async function seedPatientConditions(medplumClient: MedplumClient) {
    const seeder = new PatientClinicalDataSeeder(medplumClient);
    return await seeder.seedConditions();
}

export async function seedPatientMedicationRequests(medplumClient: MedplumClient) {
    const seeder = new PatientClinicalDataSeeder(medplumClient);
    return await seeder.seedMedicationRequests();
}