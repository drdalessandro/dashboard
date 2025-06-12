"use client";

import React, { ReactNode } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  useTheme,
  Tooltip
} from '@mui/material';
import { ArrowUpward, ArrowDownward, MoreVert } from '@mui/icons-material';

export interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
  sortable?: boolean;
  initialSortBy?: string;
  initialSortDirection?: 'asc' | 'desc';
  pageSizeOptions?: number[];
  initialPageSize?: number;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  onRowClick,
  actions,
  emptyMessage = 'No data available',
  sortable = true,
  initialSortBy,
  initialSortDirection = 'asc',
  pageSizeOptions = [5, 10, 25],
  initialPageSize = 10
}: DataTableProps<T>) {
  const theme = useTheme();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(initialPageSize);
  const [sortBy, setSortBy] = React.useState<string | undefined>(initialSortBy);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(initialSortDirection);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleSort = (columnId: string) => {
    const isAsc = sortBy === columnId && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortBy(columnId);
  };

  // Apply sorting if enabled
  const sortedData = React.useMemo(() => {
    if (!sortable || !sortBy) return data;
    
    return [...data].sort((a: any, b: any) => {
      const valueA = a[sortBy];
      const valueB = b[sortBy];
      
      if (valueA === valueB) return 0;
      
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;
      
      const comparison = valueA < valueB ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortBy, sortDirection, sortable]);

  // Apply pagination
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Paper sx={{ width: '100%', mb: 2, p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (data.length === 0) {
    return (
      <Paper 
        sx={{ 
          width: '100%', 
          mb: 2, 
          p: 4, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth || 100 }}
                >
                  {sortable && column.sortable !== false ? (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': {
                          color: theme.palette.primary.main
                        }
                      }}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                      {sortBy === column.id && (
                        <Box component="span" sx={{ display: 'inline-flex', verticalAlign: 'middle', ml: 0.5 }}>
                          {sortDirection === 'asc' ? (
                            <ArrowUpward fontSize="small" />
                          ) : (
                            <ArrowDownward fontSize="small" />
                          )}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions && (
                <TableCell align="right" style={{ minWidth: 50 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row: any, rowIndex) => {
              return (
                <TableRow 
                  hover 
                  tabIndex={-1} 
                  key={rowIndex}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{ 
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={column.id} align={column.align || 'left'}>
                        {column.format ? column.format(value, row) : value}
                      </TableCell>
                    );
                  })}
                  {actions && (
                    <TableCell align="right">
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={pageSizeOptions}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
