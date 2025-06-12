"use client"

// src/features/practitioners/components/details/PractitionerExperience.tsx
import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Skeleton, Divider, List, ListItem, ListItemText } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePractitioner } from '../../../../hooks/usePractitioner';

interface PractitionerExperienceProps {
  practitionerId: string;
}

export const PractitionerExperience: React.FC<PractitionerExperienceProps> = ({ practitionerId }) => {
  const { t } = useTranslation(['practitioner', 'common']);
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
          {error instanceof Error ? error.message : t('errors.unknown', { ns: 'common' })}
        </Typography>
      </Box>
    );
  }

  if (!practitioner) {
    return (
      <Box>
        <Typography>
          {t('notFound', { ns: 'practitioner' })}
        </Typography>
      </Box>
    );
  }

  // In a real application, you would extract experience from extensions or other fields
  // For now, we'll use a placeholder
  // @TODO: Extract experience from practitioner resource
  const experienceEntries = [
    {
      title: 'Senior Physician',
      organization: 'Bamako Community Hospital',
      period: '2018 - Present',
      responsibilities: [
        'Patient care and treatment',
        'Team supervision',
        'Medical procedures'
      ]
    },
    {
      title: 'General Practitioner',
      organization: 'Rural Health Clinic',
      period: '2015 - 2018',
      responsibilities: [
        'Primary care',
        'Preventive medicine',
        'Community outreach'
      ]
    }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('experience.title', { ns: 'practitioner' })}
      </Typography>

      {experienceEntries.length === 0 ? (
        <Typography color="text.secondary">
          {t('experience.none', { ns: 'practitioner' })}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {experienceEntries.map((experience, index) => (
            <Grid item xs={12} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">
                    {experience.title}
                  </Typography>

                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {experience.organization}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {experience.period}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    {t('responsibilities', { ns: 'practitioner' })}
                  </Typography>

                  <List dense>
                    {experience.responsibilities.map((responsibility, respIndex) => (
                      <ListItem key={respIndex} sx={{ py: 0 }}>
                        <ListItemText primary={responsibility} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};