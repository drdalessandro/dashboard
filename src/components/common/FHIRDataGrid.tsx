/**
 * FHIRDataGrid
 * A standardized data grid for displaying FHIR resources
 * Optimized for healthcare contexts in Mali and Sub-Saharan Africa
 */

import React, { useState } from 'react';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
  GridFilterModel,
  GridSortModel,
  GridPaginationModel
} from '@mui/x-data-grid';
import { Box, Chip, Typography, LinearProgress, Paper } from '@mui/material';
import { Resource } from '@medplum/fhirtypes';
import { useTranslation } from 'react-i18next';
import { sortResources, filterResourcesBySearchQuery } from '../../utils/fhir/searchUtils';
import { SyncStatus } from '../../data/models/base';
import SyncStatusIndicator from './SyncStatusIndicator';

interface FHIRDataGridProps {
  /**
   * FHIR resources to display
   */
  resources: Resource[];

  /**
   * Column definitions
   */
  columns: GridColDef[];

  /**
   * Whether the grid is in a loading state
   */
  loading?: boolean;

  /**
   * Handler for row selection
   */
  onRowSelect?: (resource: Resource) => void;

  /**
   * Handler for row editing
   */
  onRowEdit?: (resource: Resource) => void;

  /**
   * Handler for row deletion
   */
  onRowDelete?: (resource: Resource) => void;

  /**
   * Current sync status of the data
   */
  syncStatus?: SyncStatus;

  /**
   * Text to display when there are no resources
   */
  emptyText?: string;

  /**
   * Default page size
   */
  defaultPageSize?: number;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Whether to show the toolbar
   */
  showToolbar?: boolean;

  /**
   * Height of the grid
   */
  height?: number | string;

  /**
   * Density of the grid
   */
  density?: 'standard' | 'compact' | 'comfortable';

  /**
   * Whether to show row borders
   */
  showBorders?: boolean;

  /**
   * Whether to enable offline search and sorting
   */
  enableOfflineProcessing?: boolean;

  /**
   * Server-side filtering, sorting, and pagination handlers
   */
  onFilterChange?: (model: GridFilterModel) => void;
  onSortChange?: (model: GridSortModel) => void;
  onPaginationChange?: (model: GridPaginationModel) => void;
}

/**
 * Standardized data grid for displaying FHIR resources
 * Provides consistent data display across the application with offline capabilities
 */
export const FHIRDataGrid: React.FC<FHIRDataGridProps> = ({
  resources,
  columns,
  loading = false,
  onRowSelect,
  onRowEdit,
  onRowDelete,
  syncStatus = SyncStatus.SYNCED,
  emptyText,
  defaultPageSize = 10,
  error,
  showToolbar = true,
  height = 500,
  density = 'standard',
  showBorders = true,
  enableOfflineProcessing = true,
  onFilterChange,
  onSortChange,
  onPaginationChange
}) => {
  const { t } = useTranslation('common');

  // State for client-side filtering, sorting, and pagination
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: defaultPageSize
  });

  // Prepare resources for the grid
  const prepareResources = (): any[] => {
    let processedResources = [...resources];

    // Apply client-side filtering if enabled and have quick filter value
    if (enableOfflineProcessing && filterModel.quickFilterValues?.length) {
      const searchQuery = filterModel.quickFilterValues.join(' ');
      processedResources = filterResourcesBySearchQuery(processedResources, searchQuery);
    }

    // Apply client-side sorting if enabled and have sort model
    if (enableOfflineProcessing && sortModel.length > 0) {
      const { field, sort } = sortModel[0];
      processedResources = sortResources(
        processedResources,
        field,
        sort === 'desc' ? 'desc' : 'asc'
      );
    }

    // Add row ID for DataGrid
    return processedResources.map(resource => ({
      ...resource,
      id: resource.id || Math.random().toString(36).substring(2, 11)
    }));
  };

  // Handle filter change
  const handleFilterChange = (model: GridFilterModel) => {
    setFilterModel(model);
    if (onFilterChange) {
      onFilterChange(model);
    }
  };

  // Handle sort change
  const handleSortChange = (model: GridSortModel) => {
    setSortModel(model);
    if (onSortChange) {
      onSortChange(model);
    }
  };

  // Handle pagination change
  const handlePaginationChange = (model: GridPaginationModel) => {
    setPaginationModel(model);
    if (onPaginationChange) {
      onPaginationChange(model);
    }
  };

  // Enhanced columns with resource type chip for consistency
  const enhancedColumns: GridColDef[] = [
    {
      field: 'resourceType',
      headerName: t('resourceType', { ns: 'common' }),
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value as string}
          size="small"
          color={
            params.value === 'Patient' ? 'success' :
              params.value === 'Practitioner' ? 'primary' :
                params.value === 'Observation' ? 'warning' :
                  params.value === 'MedicationRequest' ? 'error' :
                    'default'
          }
        />
      )
    },
    ...columns
  ];

  return (
    <Paper
      elevation={2}
      sx={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: '100%',
        position: 'relative'
      }}
    >
      {(error || syncStatus === SyncStatus.ERROR) && (
        <Box
          sx={{
            p: 1,
            bgcolor: 'error.light',
            color: 'error.contrastText',
            width: '100%'
          }}
        >
          <Typography variant="body2">
            {error || t('errorLoadingData', { ns: 'common' })}
          </Typography>
        </Box>
      )}

      <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
        <DataGrid
          columns={enhancedColumns}
          rows={prepareResources()}
          loading={loading}
          disableRowSelectionOnClick
          filterModel={filterModel}
          sortModel={sortModel}
          paginationModel={paginationModel}
          onFilterModelChange={handleFilterChange}
          onSortModelChange={handleSortChange}
          onPaginationModelChange={handlePaginationChange}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          density={density}
          showCellVerticalBorder={showBorders}
          showColumnVerticalBorder={showBorders}
          slots={{
            toolbar: showToolbar ? GridToolbar : undefined,
            loadingOverlay: () => (
              <LinearProgress color="primary" sx={{ width: '100%', position: 'absolute', top: 0 }} />
            ),
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  {emptyText || t('noData', { ns: 'common' })}
                </Typography>
              </Box>
            )
          }}
          onRowClick={(params) => {
            if (onRowSelect) {
              onRowSelect(params.row as Resource);
            }
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            }
          }}
          initialState={{
            pagination: {
              paginationModel: {
                page: 0,
                pageSize: defaultPageSize,
              },
            },
          }}
        />

        {/* Sync status indicator in the bottom right */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            zIndex: 1
          }}
        >
          <SyncStatusIndicator size="small" />
        </Box>
      </Box>
    </Paper>
  );
};

export default FHIRDataGrid;
