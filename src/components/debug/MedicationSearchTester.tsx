import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import { RxNormService, RxNormMedication } from '../../services/implementations/rxnorm/RxNormService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('MedicationSearchTester');

/**
 * Component for testing the RxNorm medication search functionality
 */
const MedicationSearchTester: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<RxNormMedication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<RxNormMedication | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const rxNormService = new RxNormService();

  // Update online status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setError(null);
    setIsLoading(true);
    setResults([]);

    try {
      logger.info('Searching medications', { query });
      const searchResults = await rxNormService.searchMedications(query);
      setResults(searchResults);
      
      if (searchResults.length === 0) {
        setError('No results found. Try a different search term.');
      }
    } catch (err) {
      logger.error('Error searching medications:', err);
      setError('Error searching medications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMedication = (medication: RxNormMedication) => {
    setSelectedMedication(medication);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Medication Search Tester
      </Typography>
      
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You are currently offline. Search results will be limited to cached medications.
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', mb: 3 }}>
        <TextField
          fullWidth
          label="Search Medications"
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          disabled={isLoading}
          sx={{ ml: 2, whiteSpace: 'nowrap' }}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Search'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Results List */}
        <Card sx={{ flex: 1, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Search Results ({results.length})
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List dense>
                {results.map((medication) => (
                  <React.Fragment key={medication.rxcui}>
                    <ListItem 
                      button 
                      onClick={() => handleSelectMedication(medication)}
                      selected={selectedMedication?.rxcui === medication.rxcui}
                    >
                      <ListItemText
                        primary={medication.name}
                        secondary={medication.dosageForm || medication.tty}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Selected Medication Details */}
        {selectedMedication && (
          <Card sx={{ flex: 1, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medication Details
              </Typography>
              
              <Typography variant="subtitle1">
                {selectedMedication.name}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  RxCUI: {selectedMedication.rxcui}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Type: {selectedMedication.tty}
                </Typography>
                
                {selectedMedication.dosageForm && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Dosage Form: {selectedMedication.dosageForm}
                  </Typography>
                )}
                
                {selectedMedication.strength && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Strength: {selectedMedication.strength}
                  </Typography>
                )}
                
                {selectedMedication.route && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Route: {selectedMedication.route}
                  </Typography>
                )}
              </Box>
              
              {selectedMedication.activeIngredients && selectedMedication.activeIngredients.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">
                    Active Ingredients:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {selectedMedication.activeIngredients.map((ingredient) => (
                      <Chip 
                        key={ingredient.rxcui} 
                        label={ingredient.name}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default MedicationSearchTester;