// src/features/prescriptions/components/PrescriptionsList.tsx
import React from "react";
import { DataGrid, GridRowParams } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Alert, Box, Typography, CircularProgress, Chip } from "@mui/material";
import { usePrescriptions } from "../hooks/usePrescriptions";
import { PrescriptionFilters } from "../components/PrescriptionFilters";
import { PageHeader, DataCard, EmptyState, ActionButton } from "@/components/designSystem";
import MedicationIcon from '@mui/icons-material/Medication';
import AddIcon from '@mui/icons-material/Add';

interface PrescriptionsListProps {
  patientId?: string;
}

/**
 * Prescriptions list component with offline-first capabilities
 */
export const PrescriptionsList: React.FC<PrescriptionsListProps> = ({ patientId }) => {
  const { t } = useTranslation('prescription');
  const router = useRouter();
  const {
    prescriptions,
    loading,
    error,
    isOffline,
    filters,
    updateFilters,
    clearFilters,
    refreshData
  } = usePrescriptions(patientId);

  const columns = [
    {
      field: 'medicationName',
      headerName: t('fields.medication'),
      flex: 1.5
    },
    // Only show patient column when not filtered by a specific patient
    ...(patientId ? [] : [{
      field: 'patientName',
      headerName: t('fields.patient'),
      flex: 1.5
    }]),
    {
      field: 'dosageInstructions',
      headerName: t('fields.dosage'),
      flex: 2,
      renderCell: (params: any) => (
        <Typography variant="body2" sx={{ whiteSpace: 'normal', lineHeight: 1.3 }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: t('fields.status'),
      flex: 1,
      renderCell: (params: any) => {
        const statusColors: Record<string, "success" | "error" | "warning" | "default" | "primary" | "secondary" | "info"> = {
          active: "success",
          completed: "primary",
          stopped: "error",
          cancelled: "error",
          draft: "warning",
          unknown: "default"
        };

        return (
          <Chip
            label={t(`status.${params.value}`)}
            color={statusColors[params.value] || "default"}
            size="small"
          />
        );
      }
    },
    {
      field: 'dateWritten',
      headerName: t('fields.date'),
      flex: 1,
      valueFormatter: (params: any) =>
        params.value ? new Date(params.value).toLocaleDateString() : ''
    },
    {
      field: 'prescriberName',
      headerName: t('fields.prescriber'),
      flex: 1
    },
    {
      field: 'syncStatus',
      headerName: t('common.syncStatus'),
      width: 100,
      renderCell: (params: any) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: params.value === 'synced' ? 'success.main' : 'warning.main'
          }}
        >
          {t(`common.syncStatus.${params.value}`)}
        </Box>
      )
    },
  ];

  // Handle row click to navigate to prescription detail
  const handleRowClick = (params: GridRowParams) => {
    if (params.id) {
      router.push(`/prescriptions/${params.id}`);
    }
  };

  const handleCreatePrescription = () => {
    router.push('/prescriptions/create');
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header with design system component */}
      <PageHeader
        title={
          patientId
            ? t('titles.listForPatient')
            : t('titles.list')
        }
        subtitle={t('subtitle', 'Manage and track patient prescriptions')}
        actions={
          <ActionButton
            variant="primary"
            startIcon={<AddIcon />}
            onClick={handleCreatePrescription}
            disabled={isOffline}
          >
            {t('actions.create')}
          </ActionButton>
        }
      />

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <PrescriptionFilters
          filters={filters}
          onFilterChange={updateFilters}
          onClearFilters={clearFilters}
          hidePatientFilter={!!patientId}
        />
      </Box>

      {/* Offline status indicator */}
      {isOffline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('common.offlineWarning')}
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            {t('common.offlineDataInfo')}
          </Typography>
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Data grid */}
      <DataCard noPadding>
        {prescriptions.length === 0 && !loading ? (
          <EmptyState
            icon={<MedicationIcon />}
            title={t('noPrescriptions')}
            subtitle={
              isOffline
                ? t('noPrescriptionsOffline')
                : patientId
                  ? t('noPrescriptionsForPatient')
                  : t('noPrescriptionsOnline')
            }
            action={{
              label: t('actions.create'),
              onClick: handleCreatePrescription
            }}
          />
        ) : (
          <DataGrid
            columns={columns}
            rows={prescriptions}
            loading={loading}
            autoHeight
            pageSizeOptions={[5, 10, 25, 50]}
            checkboxSelection
            onRowClick={handleRowClick}
            sx={{
              cursor: 'pointer',
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'action.hover',
              },
              '& .MuiDataGrid-cell': {
                padding: '8px 16px'
              }
            }}
            slots={{
              loadingOverlay: () => (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ),
              noRowsOverlay: () => (
                <EmptyState
                  title={t('noPrescriptions')}
                  subtitle={
                    isOffline
                      ? t('noPrescriptionsOffline')
                      : patientId
                        ? t('noPrescriptionsForPatient')
                        : t('noPrescriptionsOnline')
                  }
                  height={300}
                />
              )
            }}
          />
        )}
      </DataCard>
    </Box>
  );
};
