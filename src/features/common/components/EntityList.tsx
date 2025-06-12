"use client"

// src/features/common/components/EntityList.tsx
import React, { useCallback, useState, useEffect } from "react";
import { List } from "@refinedev/mui";
import {
    DataGrid,
    GridRowParams,
    GridPaginationModel,
    GridColDef,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { calculateAge } from '@medplum/core';
import { useTranslation } from "react-i18next";
import {
    VisibilityOutlined,
    EditOutlined,
    DeleteOutline
} from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import {
    Alert,
    Box,
    Typography,
    Paper,
    CircularProgress,
    Grid,
    Avatar,
    Chip,
    Tooltip,
    IconButton,
    Button
} from "@mui/material";
import {
    PersonOutlined,
    PersonAddAlt1Outlined,
    LocalHospitalOutlined
} from '@mui/icons-material';
import { Patient, Practitioner, Resource } from '@medplum/fhirtypes';
import { createLogger } from "../../../utils/logger";
import {
    enhancePatient,
    enhancePractitioner,
    formatContactPoint,
    formatHumanName
} from "../../../utils/fhir/resourceUtils";
import { FilterParams, SortParams } from "../../../services/models";
import { EntityListConfig, EntityColumn } from "../EntityListConfig";
import { StatsCard, PageHeader, DataTable } from '../../../components/ui';
import { BaseRowData, getConfigByResourceType, RowTypeForResource } from "../resourceConfig";
import { ResourceTypeMapping } from "../resourceConfig";
import { PractitionerRow } from "@features/practitioners/config/practitionerListConfig";
import { PatientRow } from "@features/patients/config/patientListConfig";

// Define a type that ensures the resource has a resourceType property
type FhirResource = {
    resourceType: string;
    [key: string]: any;
}

// Type guard to check if an object is a FhirResource
function isFhirResource(obj: any): obj is FhirResource {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        'resourceType' in obj &&
        typeof obj.resourceType === 'string'
    );
}

type EntityListViewMode = 'standard' | 'enhanced';

export interface EntityListProps {
    resourceType?: keyof ResourceTypeMapping;
    config?: EntityListConfig<any, any>;
    isOffline?: boolean;
    viewMode?: EntityListViewMode;
}

/**
 * Generic entity list component that renders a data grid based on configuration
 * Uses the appropriate config based on resource type
 */
export const EntityList: React.FC<EntityListProps> = ({
    resourceType,
    config: explicitConfig,
    isOffline = false,
    viewMode = 'enhanced' // Default to enhanced view for better UX
}) => {
    // Get the appropriate config based on resource type or use the explicitly provided config
    const config = explicitConfig || (resourceType ? getConfigByResourceType(resourceType) : null);

    // If no config is available, show an error
    if (!config) {
        return (
            <Alert severity="error">
                No configuration available for resource type: {resourceType || 'unknown'}
            </Alert>
        );
    }

    const { t, i18n } = useTranslation(`${config.entityName.toLowerCase()}`);
    const commonT = useTranslation('common').t;
    const router = useRouter();
    const logger = createLogger(`${config.entityName}List`);

    // State for filters, pagination, and sorting
    const [filters, setFilters] = useState<FilterParams>(config.defaultFilters);
    const [pagination, setPagination] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 10
    });
    const [sort, setSort] = useState<SortParams>(config.defaultSort);
    const [shouldRefresh, setShouldRefresh] = useState(true);

    // Use the entity hook with options
    const {
        data: entityData,
        isLoading,
        error,
        refetch
    } = config.useEntityHook({
        filters,
        pagination,
        sort,
        onError: (err) => {
            logger.error(`Error fetching ${config.entityName}:`, err);
        },
        forceRefresh: shouldRefresh
    });

    // Reset shouldRefresh after data is fetched
    useEffect(() => {
        if (shouldRefresh && !isLoading) {
            logger.debug('Resetting shouldRefresh flag after data fetch');
            setShouldRefresh(false);
        }
    }, [shouldRefresh, isLoading, logger]);

    // Type guards for FHIR resources
    const isPatient = (resource: any): resource is Patient => {
        return (
            isFhirResource(resource) &&
            resource.resourceType === 'Patient'
        );
    };

    const isPractitioner = (resource: any): resource is Practitioner => {
        return (
            isFhirResource(resource) &&
            resource.resourceType === 'Practitioner'
        );
    };

    // Transform the data for the grid
    const rows = React.useMemo(() => {
        // Skip processing if no data
        if (!entityData) return config.transformData(undefined);

        // Process raw FHIR data if needed
        if (Array.isArray(entityData)) {
            // Check if we're dealing with FHIR resources that need enhancement
            // First, check if these are FHIR resources by checking all items
            const containsFhirResources = entityData.length > 0 &&
                entityData.every(item => isFhirResource(item) &&
                    (item.resourceType === 'Patient' || item.resourceType === 'Practitioner')
                );

            // Then check if they already have computed properties
            const needsComputation = containsFhirResources &&
                !entityData.some(item => '_computed' in item);

            // Only enhance if they are FHIR resources without computed properties
            const needsEnhancement = containsFhirResources && needsComputation;

            if (needsEnhancement) {
                logger.debug('Enhancing FHIR resources with computed properties', {
                    resourceType: isFhirResource(entityData[0]) ? entityData[0].resourceType : 'Unknown',
                    totalItems: entityData.length
                });

                // Create enhanced resources with computed properties
                const enhancedData = entityData.map(resource => {
                    // Process Patient resource
                    if (isPatient(resource)) {
                        return enhancePatient(resource);
                    }

                    // Process Practitioner resource
                    if (isPractitioner(resource)) {
                        return enhancePractitioner(resource);
                    }

                    // Return other types unchanged
                    return resource;
                });

                // Type assertion to satisfy TypeScript
                const transformedData = config.transformData(enhancedData as any);
                logger.debug('FHIR resources enhanced and transformed successfully', {
                    rowCount: transformedData.length
                });
                return transformedData;
            }
        }

        // Fall back to standard transformation
        const standardTransformed = config.transformData(entityData);
        logger.debug('Standard transformation applied (no FHIR enhancement needed)', {
            rowCount: standardTransformed.length
        });
        return standardTransformed;
    }, [entityData, config.transformData, logger]);

    // Function to update filters
    const handleFilterChange = useCallback((newFilters: Partial<FilterParams>) => {
        logger.debug('Filter changed, triggering refresh', { newFilters });
        setFilters(prevFilters => ({
            ...prevFilters,
            ...newFilters
        }));
        setShouldRefresh(true); // Trigger refresh when filters change
    }, [logger]);

    // Function to clear filters
    const handleClearFilters = useCallback(() => {
        logger.debug('Filters cleared, triggering refresh');
        setFilters(config.defaultFilters);
        setShouldRefresh(true); // Trigger refresh when filters are cleared
    }, [config.defaultFilters, logger]);

    // Handle page and page size changes
    const handlePaginationChangeForDataGrid = useCallback((model: GridPaginationModel) => {
        logger.debug('Pagination changed, triggering refresh', { model });
        setPagination(model);
        setShouldRefresh(true); // Trigger refresh when pagination changes
    }, [logger]);

    // Update filters when pagination changes (without triggering shouldRefresh again)
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            page: pagination.page,
            pageSize: pagination.pageSize
        }));
    }, [pagination]);

    // Functions for row actions
    const handleViewRow = useCallback((id: string | number) => {
        logger.info(`Viewing ${config.entityName}: ${id}`);
        router.push(`/${config.baseRoute}/show/${id}`);
    }, [router, config.baseRoute, config.entityName, logger]);

    const handleEditRow = useCallback((id: string | number) => {
        logger.info(`Editing ${config.entityName}: ${id}`);
        router.push(`/${config.baseRoute}/edit/${id}`);
    }, [router, config.baseRoute, config.entityName, logger]);

    const handleAddRow = useCallback(() => {
        logger.info(`Adding new ${config.entityName}`);
        router.push(`/${config.baseRoute}/create`);
    }, [router, config.baseRoute, config.entityName, logger]);

    // Convert EntityColumn configurations to GridColDef for standard view
    const standardColumns = React.useMemo((): GridColDef[] => {
        return config.columns.map((column: EntityColumn): GridColDef => {
            const baseColumn: GridColDef = {
                field: column.field,
                headerName: t(column.headerKey),
                flex: column.flex ?? 1,
                width: column.width,
                sortable: column.sortable !== false,
                filterable: column.filterable !== false,
            };

            // Add type-specific configurations
            switch (column.type) {
                case 'date':
                    return {
                        ...baseColumn,
                        valueFormatter: (params: any) => {
                            if (!params) return '';
                            return new Date(params as string).toLocaleDateString();
                        }
                    };

                case 'translatedEnum':
                    return {
                        ...baseColumn,
                        valueFormatter: (params: any) => {
                            if (!params) return '';
                            const enumPrefix = column.enumPrefix || `${config.entityName.toLowerCase()}.${column.field}`;
                            const translationKey = `${enumPrefix}.${params as string}`;
                            return t(translationKey, { defaultValue: String(params) });
                        }
                    };

                case 'status':
                    return {
                        ...baseColumn,
                        renderCell: (params: any) => {
                            const value = String(params.value || '');
                            const statusConfig = column.statusMap?.[value] || { color: 'default.main' };
                            const translationKey = statusConfig.translationKey || `common.status.${value}`;

                            return (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: statusConfig.color
                                    }}
                                >
                                    {t(translationKey, value)}
                                </Box>
                            );
                        }
                    };

                case 'custom':
                    return {
                        ...baseColumn,
                        renderCell: column.renderCell
                            ? (params: GridRenderCellParams<any>) => column.renderCell!(params, t)
                            : undefined,
                        valueFormatter: column.valueFormatter
                            ? (params: any) => column.valueFormatter!(params.value, t)
                            : undefined
                    };

                case 'text':
                default:
                    return baseColumn;
            }
        });
    }, [config.columns, t, config.entityName]);

    // Create enhanced columns with improved UI
    const enhancedColumns = React.useMemo((): GridColDef[] => {
        // Create appropriate columns based on the entity type
        const entityType = config.entityName.toLowerCase();

        switch (entityType) {
            case 'patient':
                return getEnhancedPatientColumns();
            case 'practitioner':
                return getEnhancedPractitionerColumns();
            default:
                // Default to enhanced standard columns for other entity types
                return enhanceStandardColumns();
        }

        // Helper function to create enhanced patient columns
        function getEnhancedPatientColumns(): GridColDef[] {
            // Use the correct PatientRow type for type safety
            return [
                {
                    field: 'name',
                    headerName: t('table.name'),
                    flex: 1,
                    minWidth: 200,
                    renderCell: (params: GridRenderCellParams<PatientRow>) => (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                sx={{
                                    bgcolor: params.row.gender === 'male' ? 'primary.main' : 'secondary.main',
                                    width: 40,
                                    height: 40,
                                    mr: 2
                                }}
                            >
                                {(params.row.name || '').charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="body1" fontWeight={500}>
                                    {params.row.name || ''}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    ID: {params.row.id}
                                </Typography>
                            </Box>
                        </Box>
                    ),
                },
                {
                    field: 'gender',
                    headerName: t('table.gender'),
                    width: 120,
                    valueGetter: (params: GridRenderCellParams<PatientRow> | string | any) => {
                        // Handle case where params is a string
                        if (typeof params === 'string') {
                            return params.charAt(0).toUpperCase() + params.slice(1);
                        }

                        // Handle case where params is an object with row property
                        if (params && typeof params === 'object' && params.row) {
                            const gender = params.row.gender;

                            // Explicit type check and transformation
                            if (typeof gender === 'string') {
                                return gender.charAt(0).toUpperCase() + gender.slice(1);
                            }
                        }

                        // Handle case where params has a value property
                        if (params && params.value) {
                            const value = String(params.value);
                            return value.charAt(0).toUpperCase() + value.slice(1);
                        }

                        return '';
                    },
                },
                {
                    field: 'birthDate',
                    headerName: t('table.birthDate'),
                    width: 100,
                    valueGetter: (params: GridRenderCellParams<PatientRow> | string | any) => {
                        // Handle case where params is a string
                        if (typeof params === 'string') {
                            return params ? params : '';
                        }

                        // Handle case where params is an object with row property
                        if (params && typeof params === 'object' && params.row) {
                            return params.row.birthDate ? params.row.birthDate : '';
                        }

                        // Handle case where params has a value property
                        if (params && params.value) {
                            return params.value ? params.value : '';
                        }

                        return '';
                    },
                },
                {
                    field: 'contactDetails',
                    headerName: t('table.contact'),
                    flex: 1,
                    minWidth: 200,
                    renderCell: (params: GridRenderCellParams<PatientRow>) => (
                        <Box>
                            <Typography variant="body2">{params.row.contactDetails || ''}</Typography>
                        </Box>
                    ),
                },
                {
                    field: 'syncStatus',
                    headerName: t('table.status'),
                    width: 120,
                    renderCell: (params: GridRenderCellParams<PatientRow>) => {
                        // Use status from row if available, otherwise use syncStatus
                        const status = params.row.status || (params.row.syncStatus === 'synced' ? 'active' : 'inactive');

                        return (
                            <Chip
                                label={status === 'active' ? t('status.active', { ns: 'common' }) : t('status.inactive', { ns: 'common' })}
                                color={status === 'active' ? 'success' : 'default'}
                                size="small"
                                variant="outlined"
                            />
                        );
                    },
                },
                getActionsColumn<PatientRow>(),
            ];
        }

        // Helper function to create enhanced practitioner columns
        function getEnhancedPractitionerColumns(): GridColDef[] {
            // Use the correct PractitionerRow type for type safety
            return [
                {
                    field: 'name',
                    headerName: t('table.name'),
                    flex: 1,
                    minWidth: 200,
                    renderCell: (params: GridRenderCellParams<PractitionerRow>) => (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                sx={{
                                    bgcolor: 'primary.main',
                                    width: 40,
                                    height: 40,
                                    mr: 2
                                }}
                            >
                                {(params.row.name || '').charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="body1" fontWeight={500}>
                                    {params.row.name || ''}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    ID: {params.row.id}
                                </Typography>
                            </Box>
                        </Box>
                    ),
                },
                {
                    field: 'gender',
                    headerName: t('table.gender'),
                    width: 120,
                    valueGetter: (params: GridRenderCellParams<PractitionerRow> | string | any) => {
                        // Handle case where params is a string
                        if (typeof params === 'string') {
                            return params.charAt(0).toUpperCase() + params.slice(1);
                        }

                        // Handle case where params is an object with row property
                        if (params && typeof params === 'object' && params.row) {
                            const gender = params.row.gender;

                            // Explicit type check and transformation
                            if (typeof gender === 'string') {
                                return gender.charAt(0).toUpperCase() + gender.slice(1);
                            }
                        }

                        // Handle case where params has a value property
                        if (params && params.value) {
                            const value = String(params.value);
                            return value.charAt(0).toUpperCase() + value.slice(1);
                        }

                        return '';
                    },
                },
                {
                    field: 'qualification',
                    headerName: t('table.qualification'),
                    flex: 1,
                    valueGetter: (params: GridRenderCellParams<PractitionerRow> | string | any) => {
                        // Handle case where params is a string
                        if (typeof params === 'string') {
                            return params || '';
                        }

                        // Handle case where params is an object with row property
                        if (params && typeof params === 'object' && params.row) {
                            return params.row.qualification || '';
                        }

                        // Handle case where params has a value property
                        if (params && params.value) {
                            return params.value || '';
                        }

                        return '';
                    },
                },
                {
                    field: 'contactDetails',
                    headerName: t('table.contact'),
                    flex: 1,
                    minWidth: 200,
                    renderCell: (params: GridRenderCellParams<PractitionerRow>) => (
                        <Box>
                            <Typography variant="body2">{params.row.contactDetails || ''}</Typography>
                        </Box>
                    ),
                },
                {
                    field: 'syncStatus',
                    headerName: t('table.status'),
                    width: 120,
                    renderCell: (params: GridRenderCellParams<PractitionerRow>) => {
                        // Use status from row if available, otherwise use syncStatus
                        const status = params.row.status || (params.row.syncStatus === 'synced' ? 'active' : 'inactive');

                        return (
                            <Chip
                                label={status === 'active' ? t('status.active', { ns: 'common' }) : t('status.inactive', { ns: 'common' })}
                                color={status === 'active' ? 'success' : 'default'}
                                size="small"
                                variant="outlined"
                            />
                        );
                    },
                },
                getActionsColumn<PractitionerRow>(),
            ];
        }

        // Helper function to enhance standard columns
        function enhanceStandardColumns(): GridColDef[] {
            return standardColumns.map(col => {
                // If this is the name field, enhance it with avatar
                if (col.field === 'name') {
                    return {
                        ...col,
                        renderCell: (params: GridRenderCellParams<BaseRowData>) => (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                    sx={{
                                        bgcolor: 'primary.main',
                                        width: 40,
                                        height: 40,
                                        mr: 2
                                    }}
                                >
                                    {(params.row.name as string || '').charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="body1" fontWeight={500}>
                                        {params.row.name || ''}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        ID: {params.row.id}
                                    </Typography>
                                </Box>
                            </Box>
                        )
                    };
                }

                // Add status styling if this is a status field
                if (col.field === 'status' || col.field === 'syncStatus') {
                    return {
                        ...col,
                        renderCell: (params: GridRenderCellParams<BaseRowData>) => {
                            const value = params.value ? String(params.value) : '';
                            const isActive = value === 'active' || value === 'synced';

                            return (
                                <Chip
                                    label={isActive ? commonT('status.active') : commonT('status.inactive')}
                                    color={isActive ? 'success' : 'default'}
                                    size="small"
                                    variant="outlined"
                                />
                            );
                        }
                    };
                }

                return col;
            }).concat([getActionsColumn<BaseRowData>()]);
        }

        // Helper function to create actions column with generics
        function getActionsColumn<T extends BaseRowData>(): GridColDef {
            return {
                field: 'actions',
                headerName: commonT('table.actions'),
                width: 150,
                renderCell: (params: GridRenderCellParams<T>) => (
                    <Box sx={{ display: 'flex' }}>
                        <Tooltip title={commonT('actions.view')}>
                            <IconButton size="small" onClick={(e) => {
                                e.stopPropagation();
                                handleViewRow(params.row.id);
                            }}>
                                <VisibilityOutlined fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={commonT('actions.edit')}>
                            <IconButton size="small" onClick={(e) => {
                                e.stopPropagation();
                                handleEditRow(params.row.id);
                            }}>
                                <EditOutlined fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={commonT('actions.delete')}>
                            <IconButton size="small" onClick={(e) => {
                                e.stopPropagation();
                                // Handle delete action
                                console.log(`Delete ${params.row.id}`);
                            }}>
                                <DeleteOutline fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ),
            };
        }
    }, [standardColumns, t, commonT, handleViewRow, handleEditRow, config.entityName]);

    // Get appropriate no data messages
    const noDataTitle = config.noDataMessage?.title ||
        t(`${config.entityName.toLowerCase()}.no${config.entityName}s`);

    const noDataOnlineMessage = config.noDataMessage?.onlineMessage ||
        t(`${config.entityName.toLowerCase()}.no${config.entityName}sOnline`);

    const noDataOfflineMessage = config.noDataMessage?.offlineMessage ||
        t(`${config.entityName.toLowerCase()}.no${config.entityName}sOffline`);

    // Stats for enhanced view (if available)
    const renderStats = () => {
        // Only show stats in enhanced view
        if (viewMode !== 'enhanced') {
            return null;
        }

        // Helper function to check if a row is active
        const isActiveRow = (row: BaseRowData) => {
            const status = row.status;
            const syncStatus = row.syncStatus;

            return status === 'active' || syncStatus === 'synced';
        };

        return (
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <StatsCard
                        title={t(`stats.total${config.entityName}s`)}
                        value={rows?.length > 0 ? rows.length.toString() : "0"}
                        icon={<PersonOutlined />}
                        trend="up"
                        trendValue="3.1%"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatsCard
                        title={t(`stats.active${config.entityName}s`)}
                        value={
                            rows?.filter(isActiveRow).length.toString() || "0"
                        }
                        icon={<PersonAddAlt1Outlined />}
                        trend="up"
                        trendValue="1.4%"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatsCard
                        title={t(`stats.new${config.entityName}s`)}
                        value="12"
                        icon={<LocalHospitalOutlined />}
                        trend="up"
                        trendValue="2.5%"
                    />
                </Grid>
            </Grid>
        );
    };

    type EntityRowData = BaseRowData;

    // Use a type guard function to determine the correct row type at runtime
    function isPatientRow(row: any): row is PatientRow {
        return row && 'birthDate' in row;
    }

    function isPractitionerRow(row: any): row is PractitionerRow {
        return row && 'qualification' in row;
    }

    return (
        <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 3 } }}>
            {viewMode === 'enhanced' ? (
                <PageHeader
                    title={t(`title`)}
                    subtitle={t(`subtitle`)}
                />
            ) : (
                <List
                    title={t(`${config.entityName.toLowerCase()}.titles.list`)}
                    headerButtons={[
                        <Button
                            key="add"
                            variant="contained"
                            onClick={handleAddRow}
                            startIcon={<AddIcon />}
                        >
                            {commonT('add')}
                        </Button>
                    ]}
                />
            )}

            {/* Offline status indicator */}
            {isOffline && (
                <Alert
                    severity="warning"
                    sx={{ mb: viewMode === 'enhanced' ? 4 : 2 }}
                >
                    {commonT('offlineWarning')}
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {commonT('offlineDataInfo')}
                    </Typography>
                </Alert>
            )}

            {/* Error message */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: viewMode === 'enhanced' ? 4 : 2 }}
                >
                    {error instanceof Error ? error.message : t('errors.unknown')}
                </Alert>
            )}

            {/* Stats Cards for enhanced view */}
            {renderStats()}

            {/* Filter component */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <config.FilterComponent
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />
            </Box>

            {viewMode === 'enhanced' ? (
                /* Enhanced Data Table */
                <DataTable
                    title={t(`table.title`)}
                    columns={enhancedColumns}
                    rows={rows}
                    loading={isLoading}
                    onAdd={handleAddRow}
                    addButtonLabel={commonT('add')}
                    exportFileName={`${config.entityName.toLowerCase()}-list`}
                    pageSize={pagination.pageSize}
                    onRowClick={(params) => handleViewRow(params.id)}
                />
            ) : (
                /* Standard Data Grid */
                <Paper elevation={2}>
                    <DataGrid
                        columns={standardColumns}
                        rows={rows}
                        loading={isLoading}
                        autoHeight
                        pageSizeOptions={[5, 10, 25, 50]}
                        checkboxSelection
                        onRowClick={(params) => handleViewRow(params.id)}
                        paginationModel={pagination}
                        onPaginationModelChange={handlePaginationChangeForDataGrid}
                        sx={{
                            cursor: 'pointer',
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: 'action.hover',
                            },
                        }}
                        slots={{
                            loadingOverlay: () => (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <CircularProgress />
                                </Box>
                            ),
                            noRowsOverlay: () => (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
                                    <Typography variant="h6" component="h3">
                                        {noDataTitle}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {isOffline ? noDataOfflineMessage : noDataOnlineMessage}
                                    </Typography>
                                </Box>
                            )
                        }}
                    />
                </Paper>
            )}
        </Box>
    );
};