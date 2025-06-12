// src/features/patients/config/patientListConfig.ts
import { Patient } from "@medplum/fhirtypes";
import { usePatients } from "../../../hooks/usePatient";
import { formatContactPoint, formatHumanName } from "../../../utils/fhir/resourceUtils";
import { PatientFilters } from "../components/PatientFilters";
import { createEntityListConfig, EntityColumn } from "../../common/EntityListConfig";

/**
 * Patient row structure for the data grid
 * Updated to match new UI design
 */
export interface PatientRow {
    id: string;
    name: string;
    gender: string;
    birthDate: string;
    contactDetails: string;
    status: string;
    syncStatus: string;
    address?: string;
    phone?: string;
    email?: string;
    generalPractitioner?: string;
    managingOrganization?: string;
    identifier?: any[];
    _offline?: boolean;
}

/**
 * Column definitions for patient list
 * Updated with enhanced styling
 */
const patientColumns: EntityColumn[] = [
    {
        field: 'name',
        headerKey: 'fields.name',
        type: 'text',
        flex: 1
    },
    {
        field: 'gender',
        headerKey: 'fields.gender',
        type: 'translatedEnum',
        enumPrefix: 'gender',
        flex: 1
    },
    {
        field: 'birthDate',
        headerKey: 'fields.birthDate',
        type: 'date',
        flex: 1
    },
    {
        field: 'contactDetails',
        headerKey: 'fields.contact',
        type: 'text',
        flex: 1
    },
    {
        field: 'status',
        headerKey: 'fields.status',
        type: 'status',
        flex: 1,
        statusMap: {
            'active': { color: 'success.main', translationKey: 'common.status.active' },
            'inactive': { color: 'error.main', translationKey: 'common.status.inactive' }
        }
    },
    {
        field: 'syncStatus',
        headerKey: 'fields.syncStatus',
        type: 'status',
        flex: 1,
        statusMap: {
            'synced': { color: 'success.main', translationKey: 'common.syncStatus.synced' },
            'pending': { color: 'warning.main', translationKey: 'common.syncStatus.pending' },
            'error': { color: 'error.main', translationKey: 'common.syncStatus.error' }
        }
    }
];

/**
 * Patient list configuration
 * Enhanced with additional fields for the new UI
 */
export const patientListConfig = createEntityListConfig<Patient, PatientRow>({
    entityName: 'Patient',
    baseRoute: 'patients',
    useEntityHook: usePatients,

    transformData: (data?: Patient[]) => {
        if (!data) return [];

        return data.map(patient => ({
            id: patient.id || '',
            status: patient.active === false ? 'inactive' : 'active',
            name: formatHumanName(patient.name),
            gender: patient.gender || '',
            birthDate: patient.birthDate || '',
            contactDetails: formatContactPoint(patient),
            phone: patient.telecom?.find(t => t.system === 'phone')?.value,
            email: patient.telecom?.find(t => t.system === 'email')?.value,
            address: patient.address?.[0]?.text || '',
            generalPractitioner: patient.generalPractitioner?.[0]?.display || '',
            managingOrganization: patient.managingOrganization?.display || '',
            syncStatus: 'synced', // Default to synced
            identifier: patient.identifier
        }));
    },

    columns: patientColumns,

    defaultFilters: {
        name: '',
        gender: [],
        ageRange: { min: 0, max: 150 }
    },

    defaultSort: {
        field: 'name',
        order: 'asc'
    },

    FilterComponent: PatientFilters
});