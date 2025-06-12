"use client";

import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Avatar,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CloudOff as CloudOffIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { EditIcon, DeleteIcon, ViewIcon } from '@/components/ui/icons';
import {
  StatusBadge,
  SortableTableHeader,
  DataCard,
  EmptyState,
  SortDirection
} from '@/components/designSystem';
import {
  formatName,
  getEmail,
  getPhone,
  getQualification,
  getLocation,
  calculateExperience,
  PractitionerData
} from '../../utils/practitionerDataUtils';
import PersonIcon from '@mui/icons-material/Person';

// Re-export PractitionerData from practitionerDataUtils
export type { PractitionerData };

export interface PractitionerTableProps {
  practitioners: PractitionerData[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  searchQuery?: string;
  filters?: Array<{
    id: string;
    category: string;
    value: string;
    label?: string;
  }>;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  onSort?: (field: string, direction: SortDirection) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PractitionerTable: React.FC<PractitionerTableProps> = ({
  practitioners,
  loading,
  page,
  pageSize,
  total,
  searchQuery = '',
  filters = [],
  onPageChange,
  onPageSizeChange,
  onSort,
  onView,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation(['practitioner', 'common']);
  const [order, setOrder] = React.useState<SortDirection>('asc');
  const [orderBy, setOrderBy] = React.useState<string>('name');

  // Filter practitioners based on search and filters
  const filteredPractitioners = useMemo(() => {
    return practitioners.filter((practitioner) => {
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesName = formatName(practitioner).toLowerCase().includes(searchLower);
        const matchesEmail = getEmail(practitioner)?.toLowerCase().includes(searchLower);
        const matchesPhone = getPhone(practitioner)?.toLowerCase().includes(searchLower);
        const matchesQualification = getQualification(practitioner)?.toLowerCase().includes(searchLower);
        const matchesLocation = getLocation(practitioner)?.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesQualification && !matchesLocation) {
          return false;
        }
      }

      // Apply other filters
      if (filters && filters.length > 0) {
        return filters.every((filter) => {
          switch (filter.category) {
            case 'status':
              return practitioner.status === filter.value;
            case 'gender':
              return practitioner.gender === filter.value;
            case 'specialization':
              return practitioner.specialization === filter.value;
            case 'qualification':
              return getQualification(practitioner).toLowerCase().includes(filter.value.toLowerCase());
            default:
              return true;
          }
        });
      }

      return true;
    });
  }, [practitioners, searchQuery, filters]);

  // Sort practitioners
  const sortedPractitioners = useMemo(() => {
    return [...filteredPractitioners].sort((a: PractitionerData, b: PractitionerData) => {
      let comparison = 0;

      switch (orderBy) {
        case 'name':
          comparison = formatName(a).localeCompare(formatName(b));
          break;
        case 'specialization':
          comparison = (a.specialization || '').localeCompare(b.specialization || '');
          break;
        case 'qualification':
          comparison = getQualification(a).localeCompare(getQualification(b));
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          comparison = 0;
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }, [filteredPractitioners, orderBy, order]);

  // Handle sort
  const handleSort = (field: string) => {
    const isAsc = orderBy === field && order === 'asc';
    const newOrder: SortDirection = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(field);
    if (onSort) {
      onSort(field, newOrder);
    }
  };

  // Handle page change event
  const handleChangePage = (_: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  // Handle rows per page change event
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPageSizeChange(parseInt(event.target.value, 10));
  };

  // Calculate pagination
  const paginatedPractitioners = useMemo(() => {
    const startIndex = page * pageSize;
    return sortedPractitioners.slice(startIndex, startIndex + pageSize);
  }, [sortedPractitioners, page, pageSize]);

  // Reset to first page when filters change
  React.useEffect(() => {
    onPageChange(0);
  }, [filters, searchQuery, onPageChange]);

  // Define table columns
  const columns = useMemo(() => [
    {
      id: 'name',
      label: t('fields.name', { ns: 'practitioner' }),
      sortable: true,
      minWidth: 250
    },
    {
      id: 'specialization',
      label: t('fields.specialization', { ns: 'practitioner' }),
      sortable: true,
      minWidth: 150
    },
    {
      id: 'qualification',
      label: t('fields.qualification', { ns: 'practitioner' }),
      sortable: true,
      minWidth: 150
    },
    {
      id: 'contact',
      label: t('fields.contact.title', { ns: 'practitioner' }),
      sortable: false,
      minWidth: 200
    },
    {
      id: 'status',
      label: t('fields.status', { ns: 'practitioner' }),
      sortable: true,
      minWidth: 100
    },
    {
      id: 'actions',
      label: t('actions.title', { ns: 'common' }),
      sortable: false,
      minWidth: 150
    }
  ], [t]);

  // Map practitioner status to StatusBadge status
  const getStatusBadgeStatus = (status: string) => {
    return status === 'active' ? 'active' : 'inactive';
  };

  if (!loading && practitioners.length === 0 && !searchQuery && filters.length === 0) {
    return (
      <DataCard>
        <EmptyState
          icon={<PersonIcon />}
          title={t('practitioner.empty.title')}
          subtitle={t('practitioner.empty.subtitle')}
          action={{
            label: t('practitioner.actions.create'),
            onClick: () => window.location.href = '/practitioners/create'
          }}
        />
      </DataCard>
    );
  }

  return (
    <DataCard noPadding>
      <TableContainer>
        <Table aria-label={t('practitioner.titles.list', { ns: 'practitioner' })}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <SortableTableHeader
                  key={column.id}
                  column={column}
                  orderBy={orderBy}
                  order={order}
                  onSort={column.sortable ? handleSort : undefined}
                />
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Loading state - show skeleton rows
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={`skeleton-cell-${column.id}-${index}`}>
                      <Box
                        sx={{
                          height: 24,
                          width: '80%',
                          bgcolor: 'action.hover',
                          borderRadius: 1
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredPractitioners.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 0, border: 0 }}>
                  <EmptyState
                    title={t('noData', { ns: 'common' })}
                    subtitle={searchQuery || filters.length > 0 ? t('practitioner.noSearchResults') : undefined}
                    height={300}
                  />
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              paginatedPractitioners.map((practitioner) => (
                <TableRow key={practitioner.id} hover>
                  {/* Name column */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          bgcolor: practitioner.gender === 'male' ? 'primary.main' : 'secondary.main',
                          width: 40,
                          height: 40,
                          mr: 2
                        }}
                      >
                        {formatName(practitioner).charAt(0)}
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
                          onClick={() => onView(practitioner.id)}
                        >
                          {formatName(practitioner)}
                          {practitioner._offline && (
                            <Tooltip title={t('status.offline', { ns: 'common' })}>
                              <CloudOffIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle', color: 'warning.main' }} />
                            </Tooltip>
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getLocation(practitioner) || t('notAvailable', { ns: 'common' })}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Specialization column */}
                  <TableCell>
                    <Typography variant="body2">
                      {practitioner.specialization ? t(`specialization.${practitioner.specialization}`, { ns: 'practitioner', defaultValue: practitioner.specialization }) : t('notAvailable', { ns: 'common' })}
                    </Typography>
                  </TableCell>

                  {/* Qualification column */}
                  <TableCell>
                    <Typography variant="body2">
                      {getQualification(practitioner) || t('notAvailable', { ns: 'common' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {calculateExperience(practitioner)}
                    </Typography>
                  </TableCell>

                  {/* Contact column */}
                  <TableCell>
                    <Typography variant="body2">
                      {getPhone(practitioner) || t('notAvailable', { ns: 'common' })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getEmail(practitioner)}
                    </Typography>
                  </TableCell>

                  {/* Status column */}
                  <TableCell>
                    <StatusBadge
                      status={getStatusBadgeStatus(practitioner.status || 'inactive')}
                      label={practitioner.status === 'active' ? t('status.active', { ns: 'common' }) : t('status.inactive', { ns: 'common' })}
                    />
                  </TableCell>

                  {/* Actions column */}
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title={t('actions.edit', { ns: 'common' })}>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(practitioner.id)}
                          aria-label={t('actions.edit', { ns: 'common' })}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={t('actions.delete', { ns: 'common' })}>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(practitioner.id)}
                          aria-label={t('actions.delete', { ns: 'common' })}
                        >
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
      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={total || filteredPractitioners.length}
        rowsPerPage={pageSize}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={t('pagination.rowsPerPage', { ns: 'common' })}
        labelDisplayedRows={({ from, to, count }) =>
          t('pagination.displayedRows', { ns: 'common', from, to, count })
        }
      />
    </DataCard>
  );
};

export default PractitionerTable;
