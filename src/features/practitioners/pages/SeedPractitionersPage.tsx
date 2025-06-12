"use client";

import React, { useState } from 'react';
import { Button, Box, Typography, Alert, CircularProgress } from '@mui/material';
import { PractitionerDataService } from '@/services/implementations/PractitionerDataService';

// Import dummy data
import { dummyPractitioners } from '@/scripts/seedPractitionersClient';

export const SeedPractitionersPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const seedData = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const service = new PractitionerDataService();
      let successCount = 0;
      let errorCount = 0;

      for (const practitioner of dummyPractitioners) {
        try {
          await service.create(practitioner);
          successCount++;
        } catch (err) {
          console.error('Error creating practitioner:', err);
          errorCount++;
        }
      }

      setResult({ success: successCount, errors: errorCount });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Seed Practitioners Data
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Click the button below to seed dummy practitioners data into the database.
        This will create {dummyPractitioners.length} practitioners.
      </Typography>

      <Button
        variant="contained"
        onClick={seedData}
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Seeding Data...
          </>
        ) : (
          'Seed Practitioners'
        )}
      </Button>

      {result && (
        <Alert severity={result.errors === 0 ? 'success' : 'warning'}>
          Seeding complete! Successfully created {result.success} practitioners.
          {result.errors > 0 && ` Failed to create ${result.errors} practitioners.`}
        </Alert>
      )}

      {error && (
        <Alert severity="error">
          Error: {error}
        </Alert>
      )}
    </Box>
  );
};

export default SeedPractitionersPage;