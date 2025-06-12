"use client"

// src/features/practitioners/components/details/PractitionerQualifications.tsx
import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, Skeleton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePractitioner } from '../../../../hooks/usePractitioner';

interface PractitionerQualificationsProps {
  practitionerId: string;
}

export const PractitionerQualifications: React.FC<PractitionerQualificationsProps> = ({ practitionerId }) => {
  const { t } = useTranslation();
  const { data: practitioner, isLoading, error } = usePractitioner(practitionerId);

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" height={40} width="40%" />
        <Skeleton variant="rectangular" height={100} width="100%" sx={{ my: 2 }} />
        <Skeleton variant="rectangular" height={100} width="100%" sx={{ my: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">
          {error instanceof Error ? error.message : t('errors.unknown')}
        </Typography>
      </Box>
    );
  }

  if (!practitioner) {
    return (
      <Box>
        <Typography>
          {t('practitioner.notFound')}
        </Typography>
      </Box>
    );
  }

  const qualifications = practitioner.qualification || [];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('practitioner.qualifications.title')}
      </Typography>

      {qualifications.length === 0 ? (
        <Typography color="text.secondary">
          {t('practitioner.qualifications.none')}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {qualifications.map((qualification, index) => {
            const title = qualification.code?.text || 'Unknown Qualification';
            const issuer = qualification.issuer?.display || 'Unknown Institution';
            const startDate = qualification.period?.start;
            const endDate = qualification.period?.end;
            
            return (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {issuer}
                    </Typography>
                    
                    {(startDate || endDate) && (
                      <Box mt={1}>
                        <Chip 
                          size="small" 
                          label={`${startDate || '?'} - ${endDate || t('common.present')}`} 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};