// src/features/common/EntityListConfig.ts
import { GridPaginationModel } from "@mui/x-data-grid";
import { FilterParams, SortParams } from "../../services/models";

/**
 * Interface for configuring entity list displays
 */
export interface EntityListConfig<T extends object, R> {
    // Entity name for translations and routes
    entityName: string;

    // Base route for navigation (e.g., "patients", "practitioners")
    baseRoute: string;

    // Hook for fetching data
    useEntityHook: (options: {
        filters: FilterParams;
        pagination: GridPaginationModel;
        sort: SortParams;
        onError?: (err: any) => void;
        forceRefresh?: boolean;
    }) => {
        data: T[] | undefined;
        isLoading: boolean;
        error: any;
        refetch: () => void;
    };

    // Function to transform API data to grid rows
    transformData: (data: T[] | undefined) => R[];

    // Column configurations
    columns: EntityColumn[];

    // Default filters
    defaultFilters: FilterParams;

    // Default sort
    defaultSort: SortParams;

    // Filter component
    FilterComponent: React.ComponentType<{
        filters: FilterParams;
        onFilterChange: (newFilters: Partial<FilterParams>) => void;
        onClearFilters: () => void;
    }>;

    // Custom no data message (optional)
    noDataMessage?: {
        title: string;
        onlineMessage: string;
        offlineMessage: string;
    };
}

/**
 * Column configuration for entity lists
 */
export interface EntityColumn {
    field: string;
    headerKey: string;
    type: 'text' | 'date' | 'status' | 'translatedEnum' | 'custom';
    flex?: number;
    width?: number;
    sortable?: boolean;
    filterable?: boolean;
    // For translatedEnum type
    enumPrefix?: string;
    // For status type
    statusMap?: {
        [key: string]: {
            color: string;
            translationKey?: string;
        };
    };
    // For custom rendering
    renderCell?: (params: any, t: any) => React.ReactNode;
    valueFormatter?: (value: any, t: any) => string;
}

/**
 * Utility function to extract full name from FHIR resource
 * @param resource FHIR resource
 * @returns Formatted full name
 */
export const transformResourceName = (resource: any): string => {
    const name = resource.name?.[0];
    if (!name) return 'Unknown';

    const prefix = name.prefix?.[0] ? `${name.prefix[0]} ` : '';
    const given = name.given?.[0] || '';
    const family = name.family || '';

    return `${prefix}${given} ${family}`.trim();
};

/**
 * Type to support dynamic row transformations
 */
export type ExtendedEntityRow<R> = R & {
    name?: string | {
        prefix?: string[];
        given?: string[];
        family?: string;
    }[];
    qualification?: {
        code?: {
            text?: string;
            coding?: { display?: string }[];
        };
    }[];
    qualifications?: string;
};

/**
 * Factory function to create entity list configuration
 */
export function createEntityListConfig<T extends object, R extends { id: string | number }>(
    config: EntityListConfig<T, R>
): EntityListConfig<T, R> {
    return config;
}