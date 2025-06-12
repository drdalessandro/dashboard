import React from 'react';
import {
  TableCell,
  TableSortLabel,
  TableCellProps,
  Box,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { styled } from '@mui/material/styles';

export type SortDirection = 'asc' | 'desc';

interface SortableTableHeaderProps extends Omit<TableCellProps, 'onClick'> {
  column: {
    id: string;
    label: string;
    sortable?: boolean;
    align?: 'left' | 'right' | 'center';
    minWidth?: number;
  };
  orderBy?: string;
  order?: SortDirection;
  onSort?: (columnId: string) => void;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  fontWeight: 500,
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: '12px 16px',
  whiteSpace: 'nowrap',
  
  '&:hover': {
    backgroundColor: theme.palette.grey[50],
  },
  
  '& .MuiTableSortLabel-root': {
    color: 'inherit',
    '&:hover': {
      color: theme.palette.text.primary,
    },
    '&.Mui-active': {
      color: theme.palette.primary.main,
      '& .MuiTableSortLabel-icon': {
        color: theme.palette.primary.main,
      },
    },
  },
}));

export const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  column,
  orderBy,
  order = 'asc',
  onSort,
  ...cellProps
}) => {
  const createSortHandler = (property: string) => () => {
    if (onSort && column.sortable !== false) {
      onSort(property);
    }
  };

  const isActive = orderBy === column.id;

  return (
    <StyledTableCell
      {...cellProps}
      align={column.align || 'left'}
      style={{ minWidth: column.minWidth }}
      sortDirection={isActive ? order : false}
    >
      {column.sortable !== false && onSort ? (
        <TableSortLabel
          active={isActive}
          direction={isActive ? order : 'asc'}
          onClick={createSortHandler(column.id)}
        >
          {column.label}
          {isActive ? (
            <Box component="span" sx={visuallyHidden}>
              {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
            </Box>
          ) : null}
        </TableSortLabel>
      ) : (
        column.label
      )}
    </StyledTableCell>
  );
};

export default SortableTableHeader;
