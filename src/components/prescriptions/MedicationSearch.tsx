import React, { useState, useEffect, useContext } from 'react';
import { 
  TextField, 
  Autocomplete, 
  CircularProgress, 
  Chip, 
  Box, 
  Paper, 
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid
} from '@mui/material';
import { MedicationFilters, RxNormMedication, RxNormService } from '../../services/implementations/rxnorm';
import { OfflineContext } from '../../contexts/offline';

interface MedicationSearchProps {
  onMedicationSelect: (medication: RxNormMedication) => void;
  initialFilters?: MedicationFilters;
  label?: string;
}

const MedicationSearch: React.FC<MedicationSearchProps> = ({
  onMedicationSelect,
  initialFilters = {},
  label = 'Search Medications'
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<MedicationFilters>(initialFilters);
  const [results, setResults] = useState<RxNormMedication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<RxNormMedication | null>(null);
  const { isOffline } = useContext(OfflineContext);
  const rxNormService = new RxNormService();

  // Common dosage forms for filter options
  const dosageForms = [
    { value: '', label: 'All Forms' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Capsule', label: 'Capsule' },
    { value: 'Solution', label: 'Solution' },
    { value: 'Suspension', label: 'Suspension' },
    { value: 'Injectable', label: 'Injectable' }
  ];

  useEffect(() => {
    // Debounce search for performance
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        searchMedications();
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters.dosageForm]);

  const searchMedications = async () => {
    // Prevent searching if already loading or query is too short
    if (loading || query.length < 3) return;
    
    setLoading(true);
    try {
      const results = await rxNormService.searchMedications(query, filters);
      setResults(results);
    } catch (error) {
      console.error('Error searching medications:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicationSelect = (medication: RxNormMedication | null) => {
    if (medication) {
      setSelectedMedication(medication);
      onMedicationSelect(medication);
    }
  };

  const handleFilterChange = (filterName: keyof MedicationFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  return (
    <Box className="medication-search" sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{label}</Typography>
      
      {isOffline && (
        <Chip 
          label="Offline Mode - Limited Results" 
          color="warning" 
          size="small" 
          sx={{ mb: 2 }}
        />
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Autocomplete
            id="medication-search"
            freeSolo
            options={results}
            getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
            loading={loading}
            onInputChange={(_, value) => setQuery(value)}
            onChange={(_, value) => handleMedicationSelect(value as RxNormMedication)}
            filterOptions={(x) => x} // Disable client-side filtering
            renderInput={(params) => (
              <TextField
                {...params}
                label="Medication Name"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1">{option.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {option.dosageForm && `${option.dosageForm}${option.strength ? ` | ${option.strength}` : ''}`}
                  </Typography>
                </Box>
              </li>
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }} elevation={0} variant="outlined">
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Filters</Typography>
            <FormControl component="fieldset">
              <FormLabel component="legend">Dosage Form</FormLabel>
              <RadioGroup
                value={filters.dosageForm || ''}
                onChange={(e) => handleFilterChange('dosageForm', e.target.value)}
              >
                {dosageForms.map((form) => (
                  <FormControlLabel
                    key={form.value}
                    value={form.value}
                    control={<Radio size="small" />}
                    label={form.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Paper>
        </Grid>
      </Grid>

      {selectedMedication && (
        <Paper sx={{ p: 2, mt: 2 }} elevation={0} variant="outlined">
          <Typography variant="subtitle1">Selected Medication</Typography>
          <Typography variant="body1">{selectedMedication.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {selectedMedication.dosageForm && (
              <Chip 
                size="small" 
                label={`Form: ${selectedMedication.dosageForm}`} 
                color="primary" 
              />
            )}
            {selectedMedication.activeIngredients && selectedMedication.activeIngredients.length > 0 && (
              <Chip 
                size="small" 
                label={`Ingredient: ${selectedMedication.activeIngredients[0].name}`} 
                color="secondary" 
              />
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default MedicationSearch;