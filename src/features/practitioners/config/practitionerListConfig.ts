// src/features/practitioners/config/practitionerListConfig.ts
import { Practitioner } from "@medplum/fhirtypes";
import { usePractitioners } from "../../../hooks/usePractitioner";
import { formatContactPoint } from "../../../utils/fhir/resourceUtils";
import { PractitionerFilters } from "../components/PractitionerFilters";
import { createEntityListConfig, EntityColumn } from "../../common/EntityListConfig";

/**
 * Practitioner row structure for the data grid
 */
export interface PractitionerRow {
    id: string;
    name: string;
    gender: string;
    qualification: string;
    contactDetails: string;
    status: string;
    syncStatus: string;
}

/**
 * Column definitions for practitioner list
 */
const practitionerColumns: EntityColumn[] = [
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
        field: 'qualification',
        headerKey: 'fields.qualification',
        type: 'text',
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
 * Practitioner list configuration
 * Defined outside of components to prevent re-creation on each render
 */
export const practitionerListConfig = createEntityListConfig<Practitioner, PractitionerRow>({
    entityName: 'Practitioner',
    baseRoute: 'practitioners',
    useEntityHook: usePractitioners,

    transformData: (data?: Practitioner[]) => {
        if (!data) return [];

        return data.map(practitioner => ({
            id: practitioner.id || '',
            name: practitioner._computed?.formattedName || "Unknown",
            gender: practitioner.gender || '',
            qualification: practitioner._computed?.qualification || "Unknown",
            contactDetails: formatContactPoint(practitioner),
            status: 'active', // Default status
            syncStatus: 'synced' // Default sync status
        }));
    },

    columns: practitionerColumns,

    defaultFilters: {
        name: '',
        gender: [],
        qualification: ''
    },

    defaultSort: {
        field: 'name',
        order: 'asc'
    },

    FilterComponent: PractitionerFilters
});