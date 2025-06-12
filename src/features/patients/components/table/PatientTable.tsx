"use client";

import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  IconButton,
  TablePagination,
  Skeleton,
  Tooltip,
  Avatar,
  useTheme
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PatientTableProps } from '@/features/patients/types/patient.types';
import { EditIcon, DeleteIcon, ViewIcon } from '@/components/ui/icons';
import { getInitials, getAvatarColor } from '../../utils/patientFormatters';
import { createLogger } from '@/utils/logger';
import { 
  StatusBadge, 
  SortableTableHeader, 
  DataCard,
  EmptyState,
  SortDirection 
} from '@/components/designSystem';
import PersonIcon from '@mui/icons-material/Person';

// Initialize logger
const logger = createLogger('PatientTable');

// Format age from birthDate
const formatAge = (birthDate: string | undefined) => {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    return age - 1;
  }
  return age;
};

// Table row component
const PatientTableRow = memo(({
  patient,
  onEdit,
  onDelete,
  onView
}: {
  patient: any,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onView: (id: string) => void
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['patient', 'common']);

  return (
    <TableRow hover>
      <TableCell>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: getAvatarColor(patient.gender, theme).bgColor,
              color: getAvatarColor(patient.gender, theme).textColor
            }}
          >
            {getInitials(patient.name?.text || 'Unknown')}
          </Avatar>
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography
                variant="body2"
                fontWeight="medium"
                sx={{
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                  color: 'primary.main'
                }}
                onClick={() => onView(patient.id)}
              >
                {patient.name?.text || 'Unknown'}
              </Typography>
              {patient._offline && (
                <Tooltip title={t('common.offline')}>
                  <OfflineIcon fontSize="small" color="warning" />
                </Tooltip>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              ID: {patient.identifier?.[0]?.value || patient.id}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {patient.address?.find((addr: any) => addr.use === 'home')?.text || '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{patient.gender || '-'}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {patient.birthDate ? formatAge(patient.birthDate) : '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <Box>
          {patient.telecom?.find((t: any) => t.system === 'phone')?.value && (
            <Typography variant="body2">
              {patient.telecom.find((t: any) => t.system === 'phone').value}
            </Typography>
          )}
          {patient.telecom?.find((t: any) => t.system === 'email')?.value && (
            <Typography variant="caption" color="text.secondary">
              {patient.telecom.find((t: any) => t.system === 'email').value}
            </Typography>
          )}
          {!patient.telecom?.find((t: any) => t.system === 'phone')?.value && !patient.telecom?.find((t: any) => t.system === 'email')?.value && '-'}
        </Box>
      </TableCell>
      <TableCell>
        <StatusBadge
          status={patient.status === 'active' ? 'active' : 'inactive'}
          label={patient.status === 'active' ? t('common.active') : t('common.inactive')}
        />
      </TableCell>
      <TableCell align="right">
        <Box display="flex" gap={1} justifyContent="flex-end">
          <Tooltip title={t('common.actions.edit')}>
            <IconButton size="small" onClick={() => onEdit(patient.id)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.actions.delete')}>
            <IconButton size="small" onClick={() => onDelete(patient.id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
});

PatientTableRow.displayName = 'PatientTableRow';

// Loading skeleton
const TableLoadingSkeleton = memo(({ rowCount }: { rowCount: number }) => {
  return (
    <>
      {Array(rowCount).fill(0).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell>
            <Box display="flex" alignItems="center" gap={2}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width={150} />
            </Box>
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={120} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={80} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={40} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={140} />
          </TableCell>
          <TableCell>
            <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 1 }} />
          </TableCell>
          <TableCell align="right">
            <Box display="flex" gap={1} justifyContent="flex-end">
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
});

TableLoadingSkeleton.displayName = 'TableLoadingSkeleton';

// Main patient table component
const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onView,
  onSort
}) => {
  const { t } = useTranslation(['patient', 'common']);
  const theme = useTheme();
  const logger = createLogger('PatientTable');

  // Initialize with a default sort
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Enhanced handleSort function
  const handleSort = useCallback((column: string) => {
    logger.debug(`PatientTable handleSort: column=${column}`);

    // Determine new direction
    const isAsc = sortColumn === column && sortDirection === 'asc';
    const newDirection: SortDirection = isAsc ? 'desc' : 'asc';

    // Update local state
    setSortColumn(column);
    setSortDirection(newDirection);

    // Call parent component's onSort if available
    if (onSort) {
      logger.debug(`Calling parent onSort with ${column}:${newDirection}`);
      onSort(column, newDirection);
    }
  }, [sortColumn, sortDirection, onSort, logger]);

  // Log when component renders with current sort state
  useEffect(() => {
    logger.debug(`PatientTable rendered with sortColumn=${sortColumn}, sortDirection=${sortDirection}`);
  }, [sortColumn, sortDirection, logger]);

  // Helper function to safely get nested properties from patient objects
  const getPatientValue = useCallback((patient: any, column: string | null) => {
    if (!column) return '';

    switch (column) {
      case 'name':
        return patient.name?.text || '';
      case 'address':
        return patient.address?.find((addr: any) => addr.use === 'home')?.text || '';
      case 'gender':
        return patient.gender || '';
      case 'birthDate':
        return patient.birthDate || '';
      case 'contact': {
        const phone = patient.telecom?.find((t: any) => t.system === 'phone')?.value || '';
        const email = patient.telecom?.find((t: any) => t.system === 'email')?.value || '';
        return phone || email || '';
      }
      case 'status':
        return patient.status || '';
      default:
        return patient[column] || '';
    }
  }, []);

  // Apply local sorting for all cases
  const sortedPatients = useMemo(() => {
    if (!sortColumn) {
      return patients;
    }

    // Clone the array to avoid mutating the original
    logger.debug(`Performing local sort by ${sortColumn} (${sortDirection})`);
    return [...patients].sort((a, b) => {
      const valueA = getPatientValue(a, sortColumn);
      const valueB = getPatientValue(b, sortColumn);

      // Skip sorting for the actions column
      if (sortColumn === 'actions') return 0;

      // Handle string comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      // Handle numeric/date comparison
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [patients, sortColumn, sortDirection, getPatientValue, logger]);

  // Table columns configuration
  const columns = useMemo(() => [
    {
      id: 'name',
      label: t('patient.fields.name'),
      sortable: true,
      minWidth: 250
    },
    {
      id: 'address',
      label: t('patient.fields.address.title'),
      sortable: true,
      minWidth: 200
    },
    {
      id: 'gender',
      label: t('patient.fields.gender'),
      sortable: true,
      minWidth: 100
    },
    {
      id: 'birthDate',
      label: t('patient.fields.age'),
      sortable: true,
      minWidth: 100
    },
    {
      id: 'contact',
      label: t('patient.fields.contact'),
      sortable: false,
      minWidth: 200
    },
    {
      id: 'status',
      label: t('common.status'),
      sortable: true,
      minWidth: 100
    },
    {
      id: 'actions',
      label: t('common.actions.title'),
      sortable: false,
      minWidth: 100
    }
  ], [t]);

  if (!loading && patients.length === 0) {
    return (
      <DataCard>
        <EmptyState
          icon={<PersonIcon />}
          title={t('patient.empty.title')}
          subtitle={t('patient.empty.subtitle')}
          action={{
            label: t('patient.actions.create'),
            onClick: () => window.location.href = '/patients/create'
          }}
        />
      </DataCard>
    );
  }

  return (
    <DataCard noPadding>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
        <Table stickyHeader aria-label="patient table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <SortableTableHeader
                  key={column.id}
                  column={column}
                  orderBy={sortColumn}
                  order={sortDirection}
                  onSort={column.sortable ? handleSort : undefined}
                />
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableLoadingSkeleton rowCount={pageSize} />
            ) : sortedPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 0, border: 0 }}>
                  <EmptyState
                    title={t('common.noData')}
                    subtitle={t('patient.noSearchResults')}
                    height={300}
                  />
                </TableCell>
              </TableRow>
            ) : (
              sortedPatients.map((patient) => (
                <PatientTableRow
                  key={patient.id}
                  patient={patient}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={total}
        rowsPerPage={pageSize}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(event) => onPageSizeChange(parseInt(event.target.value, 10))}
        labelRowsPerPage={t('common.pagination.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) =>
          t('common.pagination.displayedRows', { from, to, count })
        }
      />
    </DataCard>
  );
};

export default PatientTable;
