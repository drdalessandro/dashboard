"use client";

/**
 * DataTable Component
 * A reusable data table component with enhanced styling based on Medical Dashboard UI Kit
 */
import React, { ReactNode } from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridToolbar,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';
import { Box, Button, SxProps, Theme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';

interface CustomToolbarProps {
  title?: string;
  onAdd?: () => void;
  addButtonLabel?: string;
  showExport?: boolean;
  exportFileName?: string;
  rightContent?: ReactNode;
}

const CustomToolbar: React.FC<CustomToolbarProps> = ({
  title,
  onAdd,
  addButtonLabel = 'Add New',
  showExport = true,
  exportFileName = 'data-export',
  rightContent,
}) => {
  return (
    <GridToolbarContainer sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {title && (
          <Box component="h3" sx={{ fontSize: '1.125rem', fontWeight: 600, m: 0 }}>
            {title}
          </Box>
        )}
        <GridToolbarFilterButton />
        {showExport && <GridToolbarExport csvOptions={{ fileName: exportFileName }} />}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {rightContent}
        {onAdd && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{
              bgcolor: 'primary.600',
              '&:hover': {
                bgcolor: 'primary.700',
              },
            }}
          >
            {addButtonLabel}
          </Button>
        )}
      </Box>
    </GridToolbarContainer>
  );
};

interface DataTableProps {
  columns: GridColDef[];
  rows: any[];
  loading?: boolean;
  onRowClick?: (params: GridRowParams) => void;
  title?: string;
  onAdd?: () => void;
  addButtonLabel?: string;
  showExport?: boolean;
  exportFileName?: string;
  rightContent?: ReactNode;
  pageSize?: number;
  sx?: SxProps<Theme> | ((theme: Theme) => SxProps<Theme>)
  autoHeight?: boolean;
  hideFooter?: boolean;
  checkboxSelection?: boolean;
  disableSelectionOnClick?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  loading = false,
  onRowClick,
  title,
  onAdd,
  addButtonLabel,
  showExport = true,
  exportFileName,
  rightContent,
  pageSize = 10,
  sx = {} as SxProps<Theme> | ((theme: Theme) => SxProps<Theme>),
  autoHeight = false,
  hideFooter = false,
  checkboxSelection = false,
  disableSelectionOnClick = true,
}) => {
  const { t } = useTranslation(['common']);

  return (
    <Box sx={{ width: '100%', ...sx }}>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight={autoHeight}
        loading={loading}
        onRowClick={onRowClick}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize },
          },
        }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        slots={{
          toolbar: () => (
            <CustomToolbar
              title={title}
              onAdd={onAdd}
              addButtonLabel={addButtonLabel}
              showExport={showExport}
              exportFileName={exportFileName}
              rightContent={rightContent}
            />
          ),
        }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderColor: 'neutral.100',
            py: 1.5,
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'neutral.50',
            borderBottom: 'none',
          },
          '& .MuiDataGrid-columnHeader': {
            color: 'neutral.700',
            fontWeight: 600,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'primary.50',
          },
          '& .MuiDataGrid-row.Mui-selected': {
            backgroundColor: 'primary.50',
            '&:hover': {
              backgroundColor: 'primary.100',
            },
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: 'none',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        }}
        hideFooter={hideFooter}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick={disableSelectionOnClick}
      />
    </Box>
  );
};

export default DataTable;
