/**
 * Practitioner Schedule Tab Component
 * Displays availability and appointment statistics
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
  AccessTimeOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PractitionerDisplayData } from '../../../utils/practitionerDataUtils';

interface PractitionerScheduleTabProps {
  practitioner: PractitionerDisplayData;
}

export const PractitionerScheduleTab: React.FC<PractitionerScheduleTabProps> = ({
  practitioner
}) => {
  const { t } = useTranslation(['practitioner', 'common']);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          {t('details.schedule.title', { ns: 'practitioner' })}
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
            {t('details.schedule.availability', { ns: 'practitioner' })}
          </Typography>
          {practitioner.availableTime.length > 0
            ? practitioner.availableTime.map((time, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeOutlined fontSize="small" color="primary" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {time}
                </Typography>
              </Box>
            ))
            : (
              <Typography variant="body2" color="text.secondary">
                {t('practitioner:notAvailable')}
              </Typography>
            )}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
            {t('details.schedule.appointmentStats', { ns: 'practitioner' })}
          </Typography>          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('details.schedule.totalAppointments', { ns: 'practitioner' })}
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {practitioner.appointmentStats.total}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('details.schedule.completed', { ns: 'practitioner' })}
                </Typography>
                <Typography variant="h6" fontWeight={600} color="success.main">
                  {practitioner.appointmentStats.completed}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('details.schedule.cancelled', { ns: 'practitioner' })}
                </Typography>
                <Typography variant="h6" fontWeight={600} color="error.main">
                  {practitioner.appointmentStats.cancelled}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};