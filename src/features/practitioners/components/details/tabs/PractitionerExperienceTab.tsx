/**
 * Practitioner Experience Tab Component
 * Displays work experience and professional history
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
  WorkOutlineOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PractitionerDisplayData } from '../../../utils/practitionerDataUtils';

interface PractitionerExperienceTabProps {
  practitioner: PractitionerDisplayData;
}

export const PractitionerExperienceTab: React.FC<PractitionerExperienceTabProps> = ({
  practitioner
}) => {
  const { t } = useTranslation(['practitioner', 'common']);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          {t('details.experience.title', { ns: 'practitioner' })}
        </Typography>
        {practitioner.experience.length > 0 ? (
          practitioner.experience.map((exp, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1" fontWeight={500}>
                    {exp.position}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {exp.organization}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                  <Typography variant="body2" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { sm: 'flex-end' }
                  }}>
                    <WorkOutlineOutlined fontSize="small" sx={{ mr: 0.5 }} />
                    {exp.period}
                  </Typography>
                </Grid>
              </Grid>
              {index < practitioner.experience.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('practitioner:noExperienceInfo')}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};