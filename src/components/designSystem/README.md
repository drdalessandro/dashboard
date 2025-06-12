# Design System Components

This directory contains the reusable design system components created from the extracted HTML/CSS templates.

## Components

### 1. SearchInput
A styled search input field with an integrated search icon.

```tsx
import { SearchInput } from '@/components/designSystem';

<SearchInput
  placeholder="Search practitioners..."
  value={searchValue}
  onChange={(value) => setSearchValue(value)}
  onSearch={(value) => handleSearch(value)}
  fullWidth
/>
```

### 2. ActionButton
A versatile button component with multiple variants.

```tsx
import { ActionButton } from '@/components/designSystem';

// Primary button
<ActionButton variant="primary" onClick={handleClick}>
  Create New
</ActionButton>

// Secondary button
<ActionButton variant="secondary" startIcon={<EditIcon />}>
  Edit
</ActionButton>

// Outline button with loading state
<ActionButton variant="outline" loading={isLoading}>
  Save Changes
</ActionButton>
```

### 3. StatusBadge
Displays status indicators with appropriate colors.

```tsx
import { StatusBadge } from '@/components/designSystem';

<StatusBadge status="active" />
<StatusBadge status="inactive" label="Disabled" />
<StatusBadge status="pending" variant="outlined" />
```

### 4. SortableTableHeader
Table header cells with built-in sorting functionality.

```tsx
import { SortableTableHeader } from '@/components/designSystem';

<TableHead>
  <TableRow>
    <SortableTableHeader
      column={{ id: 'name', label: 'Name', sortable: true }}
      orderBy={orderBy}
      order={order}
      onSort={handleSort}
    />
  </TableRow>
</TableHead>
```

### 5. FilterBar
A comprehensive filter management component.

```tsx
import { FilterBar } from '@/components/designSystem';

<FilterBar
  filters={activeFilters}
  filterOptions={[
    {
      field: 'status',
      label: 'Status',
      values: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ]}
  onAddFilter={handleAddFilter}
  onRemoveFilter={handleRemoveFilter}
  onClearFilters={handleClearFilters}
/>
```

### 6. DataCard
A styled card component for content containers.

```tsx
import { DataCard } from '@/components/designSystem';

<DataCard
  title="Patient Information"
  subtitle="Basic demographic details"
  action={<IconButton><EditIcon /></IconButton>}
>
  {/* Card content */}
</DataCard>
```

### 7. PageHeader
Page header with title, subtitle, breadcrumbs, and actions.

```tsx
import { PageHeader } from '@/components/designSystem';

<PageHeader
  title="Practitioners"
  subtitle="Manage healthcare providers"
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Practitioners' }
  ]}
  actions={
    <ActionButton variant="primary">
      Add Practitioner
    </ActionButton>
  }
/>
```

### 8. EmptyState
Display component for empty data states.

```tsx
import { EmptyState } from '@/components/designSystem';

<EmptyState
  icon={<PersonAddIcon />}
  title="No practitioners found"
  subtitle="Get started by adding your first practitioner"
  action={{
    label: 'Add Practitioner',
    onClick: handleAddPractitioner
  }}
/>
```

## Design Tokens

All components use the design tokens defined in:
- `/src/theme/designSystemTheme.ts` - Material-UI theme configuration
- `/src/app/globals.css` - CSS variables

## Color System

- **Primary**: #1993e5 (Healthcare blue)
- **Secondary**: #e7eef3 (Light gray)
- **Success**: #28a745 (Green)
- **Warning**: #ffc107 (Yellow)
- **Error**: #dc3545 (Red)
- **Background**: #ffffff (White)
- **Foreground**: #f9fafb (Light gray)

## Typography

- **Font Family**: Inter, Noto Sans
- **Font Sizes**: 12px to 36px (0.75rem to 2.25rem)
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## Spacing

Based on 4px unit:
- spacing(1) = 4px
- spacing(2) = 8px
- spacing(3) = 12px
- spacing(4) = 16px
- spacing(6) = 24px
- spacing(8) = 32px

## Usage Guidelines

1. **Import from barrel export**:
   ```tsx
   import { SearchInput, ActionButton, StatusBadge } from '@/components/designSystem';
   ```

2. **Use theme values instead of hardcoded colors**:
   ```tsx
   sx={{ color: 'primary.main' }} // Good
   sx={{ color: '#1993e5' }}      // Avoid
   ```

3. **Maintain consistency** with the design system patterns.

4. **Leverage TypeScript** for prop validation and autocomplete.

## Next Steps

These components are ready to be integrated into the existing Practitioner and Patient pages in Steps 3 and 4 of the visual integration project.
