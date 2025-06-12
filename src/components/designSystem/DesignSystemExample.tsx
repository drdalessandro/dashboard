import React from 'react';
import { Box, Grid } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { 
  PageHeader, 
  SearchInput, 
  ActionButton, 
  StatusBadge,
  FilterBar,
  DataCard,
  EmptyState,
  SortableTableHeader
} from '@/components/designSystem';

// Example usage of all design system components
export const DesignSystemExample = () => {
  const [searchValue, setSearchValue] = React.useState('');
  const [filters, setFilters] = React.useState([]);

  return (
    <Box sx={{ p: 4 }}>
      {/* Page Header Example */}
      <PageHeader
        title="Design System Components"
        subtitle="Examples of all components from the visual integration"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Components' }
        ]}
        actions={
          <ActionButton variant="primary" icon={<PersonAddIcon />}>
            Add New Item
          </ActionButton>
        }
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Search Input Example */}
        <Grid item xs={12} md={6}>
          <DataCard title="Search Input">
            <SearchInput
              placeholder="Search for items..."
              value={searchValue}
              onChange={setSearchValue}
              fullWidth
            />
          </DataCard>
        </Grid>

        {/* Action Buttons Example */}
        <Grid item xs={12} md={6}>
          <DataCard title="Action Buttons">
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <ActionButton variant="primary">Primary</ActionButton>
              <ActionButton variant="secondary">Secondary</ActionButton>
              <ActionButton variant="outline">Outline</ActionButton>
              <ActionButton variant="primary" loading>Loading</ActionButton>
            </Box>
          </DataCard>
        </Grid>

        {/* Status Badges Example */}
        <Grid item xs={12} md={6}>
          <DataCard title="Status Badges">
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <StatusBadge status="active" />
              <StatusBadge status="inactive" />
              <StatusBadge status="pending" />
              <StatusBadge status="warning" />
              <StatusBadge status="error" />
              <StatusBadge status="success" />
            </Box>
          </DataCard>
        </Grid>

        {/* Filter Bar Example */}
        <Grid item xs={12} md={6}>
          <DataCard title="Filter Bar">
            <FilterBar
              filters={filters}
              filterOptions={[
                {
                  field: 'status',
                  label: 'Status',
                  values: [
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ]
                },
                {
                  field: 'role',
                  label: 'Role',
                  values: [
                    { value: 'doctor', label: 'Doctor' },
                    { value: 'nurse', label: 'Nurse' }
                  ]
                }
              ]}
              onAddFilter={(filter) => {
                setFilters([...filters, { ...filter, id: Date.now().toString() }]);
              }}
              onRemoveFilter={(id) => {
                setFilters(filters.filter(f => f.id !== id));
              }}
              onClearFilters={() => setFilters([])}
            />
          </DataCard>
        </Grid>

        {/* Empty State Example */}
        <Grid item xs={12}>
          <DataCard title="Empty State">
            <EmptyState
              icon={<PersonAddIcon />}
              title="No data found"
              subtitle="Get started by adding your first item to see it here"
              action={{
                label: 'Add First Item',
                onClick: () => console.log('Add item clicked')
              }}
            />
          </DataCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DesignSystemExample;
