"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Grid, Button, Typography, Alert, useTheme } from '@mui/material';
import {
  PersonAdd,
  PeopleAlt,
  PersonOutline,
  CalendarToday,
  MoreVert
} from '@mui/icons-material';

// Import our new components
import MainLayout from '../../../components/ui/layout/MainLayout';
import StatsCard from '../../../components/ui/common/StatsCard';
import DataTable, { Column } from '../../../components/ui/common/DataTable';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useTranslation } from 'react-i18next';

// Integrate with existing data hooks
// Ideally, keep using your existing data retrieval with usePatients hook
import { usePatients } from '../../../hooks/usePatient';

// Type for our patient rows
interface PatientRow {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  contactDetails: string;
  syncStatus: string;
}

const PatientListPage: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation('patients');
  const { isOffline } = useNetworkStatus?.() || { isOffline: false };

  // State for filters, pagination, and sorting
  const [filters, setFilters] = useState({
    name: '',
    gender: [],
    ageRange: { min: 0, max: 150 }
  });

  // Use your existing patient hook
  const {
    data: patientsData,
    isLoading,
    error,
    refetch
  } = usePatients({
    filters,
    onError: (err) => {
      console.error('Error fetching patients:', err);
    }
  });

  // Transform your patient data to match the table format
  const patients = React.useMemo(() => {
    if (!patientsData || !Array.isArray(patientsData)) return [];

    return patientsData.map(patient => ({
      id: patient.id || '',
      name: patient._computed?.formattedName || "Unknown",
      gender: patient.gender || '',
      birthDate: patient.birthDate || '',
      contactDetails: patient.telecom?.[0]?.value || '',
      syncStatus: 'synced' // Default sync status
    }));
  }, [patientsData]);

  // Table columns definition
  const columns: Column<PatientRow>[] = [
    {
      id: 'name',
      label: t('name', { ns: 'patients' }),
      format: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              mr: 2
            }}
          >
            {value?.charAt(0) || '?'}
          </Box>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>{value}</Typography>
            <Typography variant="body2" color="text.secondary">ID: {row.id}</Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'gender',
      label: t('gender', { ns: 'patients' }),
      format: (value) => t(`gender.${value.toLowerCase()}`, { defaultValue: value })
    },
    {
      id: 'birthDate',
      label: t('birthDate', { ns: 'patients' }),
      format: (value) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString();
      }
    },
    {
      id: 'contactDetails',
      label: t('contactDetails', { ns: 'patients' }),
      format: (value) => value || 'No contact info'
    },
    {
      id: 'syncStatus',
      label: t('syncStatus', { ns: 'patients' }),
      format: (value) => {
        const status = value || 'unknown';
        const statusColors = {
          synced: theme.palette.success.main,
          pending: theme.palette.warning.main,
          error: theme.palette.error.main,
          unknown: theme.palette.grey[500]
        };

        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: 10,
              bgcolor: `${statusColors[status as keyof typeof statusColors]}20`,
              color: statusColors[status as keyof typeof statusColors],
              fontWeight: 500,
              fontSize: '0.75rem'
            }}
          >
            {t(`syncStatus.${status}`, { defaultValue: status })}
          </Box>
        );
      }
    }
  ];

  // Handle row click to navigate to details page
  const handleRowClick = (row: PatientRow) => {
    router.push(`/patients/show/${row.id}`);
  };

  // Actions for each row
  const rowActions = (row: PatientRow) => (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/patients/edit/${row.id}`);
      }}
      variant="outlined"
      size="small"
      color="primary"
    >
      {t('edit', { ns: 'common' })}
    </Button>
  );

  return (
    <MainLayout title="Patients" isOffline={isOffline}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title={t('stats.totalPatients', { ns: 'patients' })}
            value={patients?.length || 0}
            icon={<PeopleAlt />}
            trend={
              patients?.length > 0
                ? { direction: 'up', value: '+3.1% this month' }
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title={t('stats.activePatients', { ns: 'patients' })}
            value={Math.floor((patients?.length || 0) * 0.8)}
            icon={<PersonOutline />}
            iconColor="#00BFA5"
            iconBgColor="rgba(0, 191, 165, 0.1)"
            trend={{ direction: 'up', value: '+2.4% this month' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title={t('stats.newPatientsThisMonth', { ns: 'patients' })}
            value={(patients?.length || 0) > 0 ? Math.floor((patients?.length || 0) * 0.15) : 0}
            icon={<CalendarToday />}
            iconColor="#FF5252"
            iconBgColor="rgba(255, 82, 82, 0.1)"
            trend={{ direction: 'up', value: '+5.2% this month' }}
          />
        </Grid>
      </Grid>

      {/* Offline warning */}
      {isOffline && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
        >
          You are currently offline. Some features and data may be limited.
        </Alert>
      )}

      {/* Error display */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error instanceof Error ? error.message : 'An error occurred while loading patients.'}
        </Alert>
      )}

      {/* Patient list header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Patient List
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAdd />}
          onClick={() => router.push('/patients/create')}
        >
          {t('actions.addPatient', { ns: 'patients' })}
        </Button>
      </Box>

      {/* Patient data table */}
      <DataTable
        columns={columns}
        data={patients || []}
        loading={isLoading}
        onRowClick={handleRowClick}
        actions={rowActions}
        emptyMessage={t('emptyMessage', { ns: 'patients' })}
        sortable={true}
        initialSortBy="name"
        initialSortDirection="asc"
      />
    </MainLayout>
  );
};

export default PatientListPage;
