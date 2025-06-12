/**
 * FHIRSelect
 * Reusable component for selecting FHIR resources in forms
 * Optimized for healthcare data selection in low-connectivity environments
 */

import React, { useState, useEffect } from 'react';
import { 
  Autocomplete, 
  TextField, 
  CircularProgress, 
  Typography, 
  Box,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Patient, 
  Practitioner,
  Resource
} from '@medplum/fhirtypes';
import { useTranslation } from '../../hooks/common/useTranslation';
import { useDebounce } from '../../hooks/common/useDebounce';
import { filterResourcesBySearchQuery } from '../../utils/fhir/searchUtils';
import { formatPatientName, formatPractitionerName } from '../../utils/fhir/formatters';

interface FHIRResourceOption {
  id: string;
  resourceType: string;
  resource: Resource;
  display: string;
}

interface FHIRSelectProps {
  /**
   * Resource type to select (Patient, Practitioner, etc.)
   */
  resourceType: string;
  
  /**
   * Label for the select input
   */
  label: string;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Currently selected resource
   */
  value?: Resource | null;
  
  /**
   * Callback when a resource is selected
   */
  onChange: (resource: Resource | null) => void;
  
  /**
   * Available resources to select from
   */
  resources: Resource[];
  
  /**
   * Whether the component is in a loading state
   */
  loading?: boolean;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Whether the select is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether multiple resources can be selected
   */
  multiple?: boolean;
  
  /**
   * Currently selected resources (for multiple mode)
   */
  values?: Resource[];
  
  /**
   * Callback when multiple resources are selected
   */
  onChangeMultiple?: (resources: Resource[]) => void;
  
  /**
   * Additional helper text
   */
  helperText?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
}

/**
 * Component for selecting FHIR resources in forms
 * Provides consistent resource selection across the application
 */
export const FHIRSelect: React.FC<FHIRSelectProps> = ({
  resourceType,
  label,
  placeholder,
  value,
  onChange,
  resources,
  loading = false,
  error,
  disabled = false,
  multiple = false,
  values = [],
  onChangeMultiple,
  helperText,
  required = false,
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(inputValue, 300);
  const [filteredOptions, setFilteredOptions] = useState<FHIRResourceOption[]>([]);
  
  // Format resources as options
  const formatResourceOptions = (resources: Resource[]): FHIRResourceOption[] => {
    return resources.map(resource => {
      let display = '';
      
      // Format display based on resource type
      switch (resource.resourceType) {
        case 'Patient':
          display = formatPatientName(resource as Patient);
          break;
        case 'Practitioner':
          display = formatPractitionerName(resource as Practitioner);
          break;
        default:
          display = `${resource.resourceType}/${resource.id}`;
      }
      
      return {
        id: resource.id || '',
        resourceType: resource.resourceType,
        resource,
        display
      };
    });
  };
  
  // Filter options when search term changes
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredOptions(formatResourceOptions(resources));
      return;
    }
    
    const filtered = filterResourcesBySearchQuery(resources, debouncedSearchTerm);
    setFilteredOptions(formatResourceOptions(filtered));
  }, [debouncedSearchTerm, resources]);
  
  // Update filtered options when resources change
  useEffect(() => {
    setFilteredOptions(formatResourceOptions(resources));
  }, [resources]);
  
  // Find option for the current value
  const findOptionForValue = (resource: Resource | null | undefined): FHIRResourceOption | null => {
    if (!resource) return null;
    
    return {
      id: resource.id || '',
      resourceType: resource.resourceType,
      resource,
      display: formatResourceDisplay(resource)
    };
  };
  
  // Format display text based on resource type
  const formatResourceDisplay = (resource: Resource): string => {
    switch (resource.resourceType) {
      case 'Patient':
        return formatPatientName(resource as Patient);
      case 'Practitioner':
        return formatPractitionerName(resource as Practitioner);
      default:
        return `${resource.resourceType}/${resource.id}`;
    }
  };
  
  // Get avatar letter for option
  const getAvatarLetter = (option: FHIRResourceOption): string => {
    if (!option.display) return '?';
    return option.display.charAt(0).toUpperCase();
  };
  
  // Get avatar color based on resource type
  const getAvatarColor = (resourceType: string): string => {
    switch (resourceType) {
      case 'Patient':
        return '#4CAF50'; // Green
      case 'Practitioner':
        return '#2196F3'; // Blue
      case 'Observation':
        return '#FF9800'; // Orange
      case 'MedicationRequest':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };
  
  // Render option
  const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: FHIRResourceOption) => (
    <li {...props}>
      <Box display="flex" alignItems="center">
        <Avatar 
          sx={{ 
            width: 28, 
            height: 28, 
            mr: 1, 
            bgcolor: getAvatarColor(option.resourceType),
            fontSize: '0.875rem'
          }}
        >
          {getAvatarLetter(option)}
        </Avatar>
        <Box>
          <Typography variant="body2">{option.display}</Typography>
          <Typography variant="caption" color="textSecondary">
            {option.resourceType}/{option.id}
          </Typography>
        </Box>
      </Box>
    </li>
  );
  
  // Render tags for multiple selection
  const renderTags = (tagValues: FHIRResourceOption[], getTagProps: any) =>
    tagValues.map((option, index) => (
      <Chip
        key={`${option.resourceType}-${option.id}-${index}`}
        avatar={
          <Avatar 
            sx={{ 
              bgcolor: getAvatarColor(option.resourceType),
              width: 24,
              height: 24,
              fontSize: '0.75rem'
            }}
          >
            {getAvatarLetter(option)}
          </Avatar>
        }
        label={option.display}
        {...getTagProps({ index })}
        size="small"
      />
    ));
  
  return (
    <Autocomplete
      id={`fhir-select-${resourceType}`}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={multiple ? values.map(resource => findOptionForValue(resource)).filter((opt): opt is FHIRResourceOption => opt !== null) : findOptionForValue(value)}
      onChange={(_, newValue) => {
        if (multiple) {
          if (onChangeMultiple) {
            onChangeMultiple(
              Array.isArray(newValue) 
                ? newValue.map(option => option.resource).filter((res): res is Resource => res !== undefined && res !== null)
                : []
            );
          }
        } else {
          onChange(
            newValue ? (newValue as FHIRResourceOption).resource : null
          );
        }
      }}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      options={filteredOptions}
      loading={loading}
      getOptionLabel={(option) => (option as FHIRResourceOption).display}
      isOptionEqualToValue={(option, value) => 
        option.resourceType === value.resourceType && option.id === value.id
      }
      renderOption={renderOption}
      renderTags={renderTags}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={!!error}
          helperText={error || helperText}
          required={required}
          disabled={disabled}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      multiple={multiple}
      filterOptions={(x) => x} // Disable built-in filtering as we're doing our own
      disableCloseOnSelect={multiple}
    />
  );
};

export default FHIRSelect;
