/**
 * Practitioner Overview Tab Component
 * Displays qualifications, certifications, and basic overview information
 */

import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import {
  SchoolOutlined,
  WorkOutlineOutlined,
  VerifiedOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PractitionerDisplayData } from '../../../utils/practitionerDataUtils';

interface PractitionerOverviewTabProps {
  practitioner: PractitionerDisplayData;
}

export const PractitionerOverviewTab: React.FC<PractitionerOverviewTabProps> = ({
  practitioner
}) => {
  const { t } = useTranslation(['practitioner', 'common']);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              {t('details.overview.qualifications', { ns: 'practitioner' })}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SchoolOutlined color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight={500}>
                    {practitioner.qualification}
                  </Typography>
                </Box>                <Typography variant="body2" color="text.secondary">
                  {t('practitioner:medicalBoard')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WorkOutlineOutlined color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight={500}>
                    {t('details.overview.yearsExperience', { ns: 'practitioner' })}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t('details.overview.present', { ns: 'practitioner' })}
                </Typography>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              {t('details.overview.languages', { ns: 'practitioner' })}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {practitioner.languages.map((language, index) => (
                <Chip
                  key={index}
                  label={language}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              {t('details.overview.certifications', { ns: 'practitioner' })}
            </Typography>
            {practitioner.certifications.length > 0 ? (
              practitioner.certifications.map((cert, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <VerifiedOutlined color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1" fontWeight={500}>
                      {cert.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {cert.issuer} • {cert.year}
                  </Typography>
                  {index < practitioner.certifications.length - 1 && (
                    <Divider sx={{ my: 2 }} />
                  )}
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('practitioner:noCertifications')}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};