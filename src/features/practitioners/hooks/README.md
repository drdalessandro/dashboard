# Practitioner Hooks Documentation

## usePractitionerList Hook

The `usePractitionerList` hook has been updated to fetch data from the database using the `usePractitioners` hook instead of directly using `PractitionerDataService`.

### Changes Made:

1. **Hook Integration**: Now uses `usePractitioners` hook from the main hooks directory
2. **Unified Architecture**: Follows the same pattern as other resource hooks in the application
3. **Server-side Operations**: Pagination, filtering, and sorting are handled server-side
4. **Simplified Data Flow**: Removed direct service calls in favor of hook composition
5. **Better Error Handling**: Leverages the error handling from the base hooks

### Key Improvements:

- **Consistency**: Uses the same `useResource` pattern as other hooks
- **Performance**: Server-side filtering and pagination reduce client load
- **Maintainability**: Single source of truth for practitioner data fetching
- **Type Safety**: Uses proper FHIR types from @medplum/fhirtypes

### Data Format:

The hook transforms the FHIR Practitioner data to include:
- `id`: Practitioner ID from FHIR resource
- `name`: Array with given/family name structure from FHIR
- `gender`: Gender from FHIR resource or 'unknown'
- `specialization`: Derived from qualification text
- `qualification`: Array of qualifications from FHIR
- `telecom`: Contact information from FHIR
- `address`: Address information from FHIR
- `status`: 'active' or 'inactive' based on FHIR active field
- `active`: Boolean flag from FHIR
- `birthDate`: Date of birth from FHIR (defaults to '1980-01-01' if missing)
- `joinDate`: Uses meta.lastUpdated as proxy (defaults to '2020-01-01' if missing)

### Usage:

```typescript
const {
  practitioners,
  isLoading,
  error,
  stats,
  page,
  pageSize,
  handlePageChange,
  handlePageSizeChange,
  handleSort,
  handleSearch,
  handleFilter,
  refetch
} = usePractitionerList();
```

### API Integration:

The hook now uses the `usePractitioners` hook which:
- Connects to the FHIR server through Medplum
- Handles authentication and offline support
- Provides real-time data synchronization
- Supports FHIR-compliant filtering and searching

### Filter Mapping:

Filters are converted to FHIR parameters:
- `status` → `active` (true/false)
- `gender` → `gender` (direct mapping)
- `specialization` → `qualification` (mapped to qualification field)

### Important Notes:

1. **Data Seeding**: If the database is empty, use the seed functionality:
   - API: `POST /api/seed-practitioners`
   - UI: Navigate to `/practitioners/seed`
   - Console: Run `seedPractitionersClient()`

2. **FHIR Compliance**: All data operations are FHIR-compliant
3. **Offline Support**: Built-in through the `useResource` hook
4. **Performance**: Server-side operations improve performance for large datasets

### Migration from PractitionerDataService:

If you were using `PractitionerDataService` directly:
1. Replace service calls with this hook
2. Data format is automatically transformed
3. Offline support is built-in
4. No need to manage caching manually


### Future Enhancements:

- Implement real-time updates using WebSockets
- Add more complex client-side filtering options
- Enhance specialization detection logic
- Add support for practitioner roles and organizations

### Technical Details:

The hook is built on top of:
- `usePractitioners`: Core hook for fetching practitioner data
- `useResource`: Base hook for FHIR resource operations
- Medplum Client: FHIR-compliant API client

This architecture ensures consistency across all resource types and provides a unified approach to data fetching and management.