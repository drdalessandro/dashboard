/**
 * Practitioner Education Tab Component
 * Displays education history and academic qualifications
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Divider,
} from '@mui/material';
import {
  EventNoteOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PractitionerDisplayData } from '../../../utils/practitionerDataUtils';

interface PractitionerEducationTabProps {
  practitioner: PractitionerDisplayData;
}

export const PractitionerEducationTab: React.FC<PractitionerEducationTabProps> = ({
  practitioner
}) => {
  const { t } = useTranslation(['practitioner', 'common']);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          {t('details.education.title', { ns: 'practitioner' })}
        </Typography>
        {practitioner.education.length > 0 ? (
          practitioner.education.map((edu, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1" fontWeight={500}>
                    {edu.degree}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {edu.institution}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                  <Typography variant="body2" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { sm: 'flex-end' }
                  }}>
                    <EventNoteOutlined fontSize="small" sx={{ mr: 0.5 }} />
                    {edu.year}
                  </Typography>
                </Grid>
              </Grid>
              {index < practitioner.education.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('practitioner:noEducationInfo')}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};