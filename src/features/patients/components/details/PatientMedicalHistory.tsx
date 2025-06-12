import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Chip, CircularProgress } from '@mui/material';
import { LocalHospital as ConditionIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { Patient } from '@medplum/fhirtypes';
import { useTranslation } from 'react-i18next';
import { usePatientConditions } from '@/hooks/useCondition';
import { getConditionDisplay } from '../../utils/patientDataUtils';

interface PatientMedicalHistoryProps {
  patient: Patient;
}

const PatientMedicalHistory: React.FC<PatientMedicalHistoryProps> = ({ patient }) => {
  const { t } = useTranslation(['patient', 'common']);
  const patientId = patient.id || '';

  // Fetch conditions data using the hook
  const { data: conditions, isLoading, error } = usePatientConditions(patientId, {
    enabled: !!patientId,
    clinicalStatus: undefined // Get all conditions
  });

  // Handle loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 1, color: '#64748b' }}>
          {t('loading', { ns: 'common' })}
        </Typography>
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
        <Typography variant="body2" sx={{ color: '#dc2626' }}>
          {t('errors.failedToLoadConditions', { ns: 'patient' }) || 'Failed to load medical conditions'}
        </Typography>
      </Paper>
    );
  }

  // Handle no conditions case
  if (!conditions || conditions.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <CheckCircleIcon sx={{ color: '#16a34a', mr: 1, fontSize: '1.2rem' }} />
        <Typography variant="body2" sx={{ color: '#374151' }}>
          {t('details.noConditionsRecorded', { ns: 'patient' }) || 'No conditions recorded'}
        </Typography>
      </Box>
    );
  }
  // Render conditions list
  return (
    <Box>
      <List sx={{ py: 0 }}>
        {conditions.map((condition, index) => {
          const conditionName = getConditionDisplay(condition);
          const clinicalStatus = condition.clinicalStatus?.coding?.[0]?.code;
          const verificationStatus = condition.verificationStatus?.coding?.[0]?.code;
          const severity = condition.severity?.coding?.[0]?.display;
          
          // Determine status color
          const getStatusColor = (status?: string) => {
            switch (status) {
              case 'active':
                return { bgcolor: '#fef3c7', color: '#d97706', border: '1px solid #fed7aa' };
              case 'recurrence':
              case 'relapse':
                return { bgcolor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
              case 'inactive':
              case 'remission':
              case 'resolved':
                return { bgcolor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
              default:
                return { bgcolor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' };
            }
          };

          return (
            <ListItem key={condition.id || index} sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <ConditionIcon 
                  sx={{ 
                    color: clinicalStatus === 'active' ? '#d97706' : '#64748b',
                    fontSize: '1.2rem'
                  }} 
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                      {conditionName}
                    </Typography>
                    {clinicalStatus && (
                      <Chip
                        label={clinicalStatus.charAt(0).toUpperCase() + clinicalStatus.slice(1)}
                        size="small"
                        sx={{
                          ...getStatusColor(clinicalStatus),
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 20,
                          borderRadius: '10px'
                        }}
                      />
                    )}
                    {severity && (
                      <Chip
                        label={severity}
                        size="small"
                        sx={{
                          bgcolor: '#f8fafc',
                          color: '#64748b',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 20,
                          borderRadius: '10px'
                        }}
                      />
                    )}
                  </span>
                }
                secondary={
                  <span style={{ marginTop: '4px', display: 'block' }}>
                    {condition.recordedDate && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        <strong>Recorded:</strong> {new Date(condition.recordedDate).toLocaleDateString()}
                      </Typography>
                    )}
                    {condition.onsetDateTime && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        <strong>Onset:</strong> {new Date(condition.onsetDateTime).toLocaleDateString()}
                      </Typography>
                    )}
                    {condition.note && condition.note.length > 0 && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        <strong>Notes:</strong> {condition.note[0].text}
                      </Typography>
                    )}
                  </span>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default PatientMedicalHistory;
