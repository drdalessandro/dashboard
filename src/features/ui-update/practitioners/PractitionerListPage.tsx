"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Grid, Button, Typography, Alert, useTheme } from '@mui/material';
import {
  PersonAdd,
  MedicalServices,
  PeopleAlt,
  CalendarToday
} from '@mui/icons-material';

// Import our new components
import MainLayout from '../../../components/ui/layout/MainLayout';
import StatsCard from '../../../components/ui/common/StatsCard';
import DataTable, { Column } from '../../../components/ui/common/DataTable';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useTranslation } from 'react-i18next';

// Integrate with existing data hooks
// Ideally, keep using your existing data retrieval with usePractitioners hook
import { usePractitioners } from '../../../hooks/usePractitioner';

// Type for our practitioner rows
interface PractitionerRow {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  contactDetails: string;
  syncStatus: string;
}

const PractitionerListPage: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation('practitioner');
  const { isOffline } = useNetworkStatus?.() || { isOffline: false };

  // State for filters, pagination, and sorting
  const [filters, setFilters] = useState({
    name: '',
    specialization: [],
  });

  // Use your existing practitioner hook
  const {
    data: practitionersData,
    isLoading,
    error,
    refetch
  } = usePractitioners({
    filters,
    onError: (err) => {
      console.error('Error fetching practitioners:', err);
    }
  });

  // Transform your practitioner data to match the table format
  const practitioners = React.useMemo(() => {
    if (!practitionersData || !Array.isArray(practitionersData)) return [];

    return practitionersData.map(practitioner => ({
      id: practitioner.id || '',
      name: practitioner._computed?.formattedName || "Unknown",
      specialization: practitioner.qualification?.[0]?.code?.text || 'General Practitioner',
      qualification: practitioner.qualification?.[0]?.extension?.[0]?.valueString || '',
      contactDetails: practitioner.telecom?.[0]?.value || '',
      syncStatus: 'synced' // Default sync status
    }));
  }, [practitionersData]);

  // Table columns definition
  const columns: Column<PractitionerRow>[] = [
    {
      id: 'name',
      label: 'Practitioner Name',
      format: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: theme.palette.secondary.light,
              color: theme.palette.secondary.contrastText,
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
      id: 'specialization',
      label: 'Specialization',
      format: (value) => value || 'Not specified'
    },
    {
      id: 'qualification',
      label: 'Qualification',
      format: (value) => value || 'Not specified'
    },
    {
      id: 'contactDetails',
      label: 'Contact',
      format: (value) => value || 'No contact info'
    },
    {
      id: 'syncStatus',
      label: 'Status',
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
  const handleRowClick = (row: PractitionerRow) => {
    router.push(`/practitioners/show/${row.id}`);
  };

  // Actions for each row
  const rowActions = (row: PractitionerRow) => (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/practitioners/edit/${row.id}`);
      }}
      variant="outlined"
      size="small"
      color="primary"
    >
      Edit
    </Button>
  );

  return (
    <MainLayout title="Practitioners" isOffline={isOffline}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Total Practitioners"
            value={practitioners?.length || 0}
            icon={<MedicalServices />}
            iconColor="#00BFA5"
            iconBgColor="rgba(0, 191, 165, 0.1)"
            trend={
              practitioners?.length > 0
                ? { direction: 'up', value: '+1.5% this month' }
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Active Practitioners"
            value={Math.floor((practitioners?.length || 0) * 0.9)}
            icon={<PeopleAlt />}
            trend={{ direction: 'up', value: '+1.0% this month' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="New Practitioners (This Month)"
            value={(practitioners?.length || 0) > 0 ? Math.floor((practitioners?.length || 0) * 0.05) : 0}
            icon={<CalendarToday />}
            iconColor="#FF5252"
            iconBgColor="rgba(255, 82, 82, 0.1)"
            trend={{ direction: 'up', value: '+2.0% this month' }}
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
          {error instanceof Error ? error.message : 'An error occurred while loading practitioners.'}
        </Alert>
      )}

      {/* Practitioner list header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Practitioner List
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAdd />}
          onClick={() => router.push('/practitioners/create')}
        >
          Add Practitioner
        </Button>
      </Box>

      {/* Practitioner data table */}
      <DataTable
        columns={columns}
        data={practitioners || []}
        loading={isLoading}
        onRowClick={handleRowClick}
        actions={rowActions}
        emptyMessage="No practitioners found. Add a new practitioner to get started."
        sortable={true}
        initialSortBy="name"
        initialSortDirection="asc"
      />
    </MainLayout>
  );
};

export default PractitionerListPage;
