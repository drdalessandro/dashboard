"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  TablePagination,
  Skeleton,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { PatientTableProps } from '@/features/patients/types/patient.types';
import {
  EditIcon,
  DeleteIcon,
  ViewIcon
} from '@/components/ui/icons';

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
  const { t } = useTranslation('patient');
  const theme = useTheme();
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get gender-based avatar background color
  const getAvatarColor = (gender: string) => {
    switch (gender) {
      case 'male':
        return '#1E88E5'; // Primary blue
      case 'female':
        return '#9C27B0'; // Purple
      default:
        return '#78909C'; // Blue grey
    }
  };

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bgColor: theme.palette.success.main,
          textColor: '#fff',
        };
      case 'inactive':
        return {
          bgColor: theme.palette.error.main,
          textColor: '#fff',
        };
      case 'pending':
        return {
          bgColor: theme.palette.warning.main,
          textColor: '#fff',
        };
      default:
        return {
          bgColor: theme.palette.grey[300],
          textColor: theme.palette.text.primary,
        };
    }
  };

  // Handle column sorting
  const handleSort = (column: string) => {
    const isAsc = sortColumn === column && sortDirection === 'asc';
    setSortColumn(column);
    setSortDirection(isAsc ? 'desc' : 'asc');
    onSort?.(column, isAsc ? 'desc' : 'asc');
  };

  // Sortable table header cell
  const SortableHeader = ({
    children,
    column,
    sx
  }: {
    children: React.ReactNode,
    column?: string,
    sx?: any
  }) => (
    <TableCell
      sx={{
        cursor: column ? 'pointer' : 'default',
        userSelect: 'none',
        ...sx
      }}
      onClick={() => column && handleSort(column)}
    >
      <Box
        display="flex"
        alignItems="center"
        gap={1}
      >
        {children}
        {column && (
          <Box
            display="flex"
            flexDirection="column"
            sx={{ opacity: sortColumn === column ? 1 : 0.3 }}
          >
            <ArrowUpwardIcon
              fontSize="small"
              color={sortColumn === column && sortDirection === 'asc' ? 'primary' : 'inherit'}
              sx={{ height: 12 }}
            />
            <ArrowDownwardIcon
              fontSize="small"
              color={sortColumn === column && sortDirection === 'desc' ? 'primary' : 'inherit'}
              sx={{ height: 12 }}
            />
          </Box>
        )}
      </Box>
    </TableCell>
  );

  // Generate skeleton rows for loading state
  const loadingRows = Array(pageSize).fill(0).map((_, index) => (
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
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </TableCell>
    </TableRow>
  ));

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
        <Table stickyHeader aria-label="patient table">
          <TableHead>
            <TableRow>
              <SortableHeader column="name">{t('patient.fields.name')}</SortableHeader>
              <SortableHeader column="address">{t('patient.fields.address')}</SortableHeader>
              <SortableHeader column="gender">{t('patient.fields.gender')}</SortableHeader>
              <SortableHeader column="birthDate">{t('patient.fields.birthDate')}</SortableHeader>
              <SortableHeader column="contact">{t('patient.fields.contact')}</SortableHeader>
              <SortableHeader column="status">{t('patient.fields.status')}</SortableHeader>
              <SortableHeader sx={{ textAlign: 'right' }}>{t('common.actions.title')}</SortableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              loadingRows
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1" color="textSecondary">
                    {t('common.noRecords')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow
                  key={patient.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(patient.gender),
                          width: 40,
                          height: 40
                        }}
                      >
                        {getInitials(patient.name.text)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="body1"
                          fontWeight="medium"
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                            color: 'primary.main'
                          }}
                          onClick={() => onView(patient.id)}
                        >
                          {patient.name.text}
                        </Typography>
                        <Typography variant="body2">
                          {patient.identifier?.[0]?.value || '-'}
                        </Typography>
                        {patient._offline && (
                          <Tooltip title={t('common.offlineCreated')}>
                            <OfflineIcon color="action" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">
                      {/* display home address */}
                      {patient.address?.find(address => address.use === 'home')?.text || t('patient.noAddress')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {t(`patient.gender.${patient.gender}`)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {patient.birthDate ? patient.birthDate : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {patient.telecom?.find(t => t.system === 'phone')?.value && (
                        <Typography variant="body2" color="primary">
                          {patient.telecom?.find(t => t.system === 'phone')?.value}
                        </Typography>
                      )}
                      {patient.telecom?.find(t => t.system === 'email')?.value && (
                        <Typography variant="body2" color="primary">
                          {patient.telecom?.find(t => t.system === 'email')?.value}
                        </Typography>
                      )}
                      {!patient.telecom?.find(t => t.system === 'phone')?.value && !patient.telecom?.find(t => t.system === 'email')?.value && '-'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t(`patient.status.${patient.status}`)}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(patient.status).bgColor,
                        color: getStatusColor(patient.status).textColor,
                        borderRadius: 1,
                        height: 24
                      }}
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 2
        }}
      >
        <Typography variant="body2" color="textSecondary">
          {total > 0 ? t('common.showing', { count: patients.length, total }) : t('common.noResults')}
        </Typography>
        <TablePagination
          component="div"
          count={total}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage={t('common.rowsPerPage')}
        />
      </Box>
    </Paper>
  );
};

export default PatientTable;