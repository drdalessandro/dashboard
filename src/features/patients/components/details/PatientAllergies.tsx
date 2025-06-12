import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Chip, CircularProgress } from '@mui/material';
import { Warning as WarningIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { Patient } from '@medplum/fhirtypes';
import { useTranslation } from 'react-i18next';
import { usePatientAllergies } from '@/hooks/useAllergyIntolerance';
import { getAllergyDisplay } from '../../utils/patientDataUtils';

interface PatientAllergiesProps {
  patient: Patient;
}

const PatientAllergies: React.FC<PatientAllergiesProps> = ({ patient }) => {
  const { t } = useTranslation(['patient', 'common']);
  const patientId = patient.id || '';

  // Fetch allergies data using the hook
  const { data: allergies, isLoading, error, refetch } = usePatientAllergies(patientId, {
    enabled: !!patientId,
    status: 'active'
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
          {t('errors.failedToLoadAllergies', { ns: 'patient' }) || 'Failed to load allergies'}
        </Typography>
      </Paper>
    );
  }

  // Handle no allergies case
  if (!allergies || allergies.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <CheckCircleIcon sx={{ color: '#16a34a', mr: 1, fontSize: '1.2rem' }} />
        <Typography variant="body2" sx={{ color: '#374151' }}>
          {t('details.noAllergiesRecorded', { ns: 'patient' }) || 'No allergies recorded'}
        </Typography>
      </Box>
    );
  }

  // Render allergies list
  return (
    <Box>
      <List sx={{ py: 0 }}>
        {allergies.map((allergy, index) => {
          const allergyName = getAllergyDisplay(allergy);
          const criticality = allergy.criticality;
          const clinicalStatus = allergy.clinicalStatus?.coding?.[0]?.code;
          
          // Determine severity color
          const getSeverityColor = (criticality?: string) => {
            switch (criticality) {
              case 'high':
                return { bgcolor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
              case 'low':
                return { bgcolor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
              default:
                return { bgcolor: '#fef3c7', color: '#d97706', border: '1px solid #fed7aa' };
            }
          };

          return (
            <ListItem key={allergy.id || index} sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <WarningIcon 
                  sx={{ 
                    color: criticality === 'high' ? '#dc2626' : '#d97706',
                    fontSize: '1.2rem'
                  }} 
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                      {allergyName}
                    </Typography>
                    {criticality && (
                      <Chip
                        label={criticality.charAt(0).toUpperCase() + criticality.slice(1)}
                        size="small"
                        sx={{
                          ...getSeverityColor(criticality),
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 20,
                          borderRadius: '10px'
                        }}
                      />
                    )}
                    {clinicalStatus && clinicalStatus !== 'active' && (
                      <Chip
                        label={clinicalStatus}
                        size="small"
                        sx={{
                          bgcolor: '#f3f4f6',
                          color: '#6b7280',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 20,
                          borderRadius: '10px'
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {allergy.recordedDate && (
                      <>Recorded: {new Date(allergy.recordedDate).toLocaleDateString()}</>
                    )}
                    {allergy.note && allergy.note.length > 0 && (
                      <> • {allergy.note[0].text}</>
                    )}
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default PatientAllergies;
