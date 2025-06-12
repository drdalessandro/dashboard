import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Chip, CircularProgress } from '@mui/material';
import { Medication as MedicationIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { Patient } from '@medplum/fhirtypes';
import { useTranslation } from 'react-i18next';
import { usePatientMedicationRequests } from '@/hooks/useMedicationRequest';
import { getMedicationName, getMedicationDosage, formatDosageInstructions } from '../../utils/patientDataUtils';

interface PatientMedicationsProps {
  patient: Patient;
}

const PatientMedications: React.FC<PatientMedicationsProps> = ({ patient }) => {
  const { t } = useTranslation(['patient', 'common']);
  const patientId = patient.id || '';

  // Fetch medications data using the hook
  const { data: medications, isLoading, error } = usePatientMedicationRequests(patientId, {
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
          {t('errors.failedToLoadMedications', { ns: 'patient' }) || 'Failed to load medications'}
        </Typography>
      </Paper>
    );
  }

  // Handle no medications case
  if (!medications || medications.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <MedicationIcon sx={{ color: '#64748b', mr: 1, fontSize: '1.2rem' }} />
        <Typography variant="body2" sx={{ color: '#374151' }}>
          {t('details.noMedicationsRecorded', { ns: 'patient' }) || 'No medications recorded'}
        </Typography>
      </Box>
    );
  }
  // Render medications list
  return (
    <Box>
      <List sx={{ py: 0 }}>
        {medications.map((medication, index) => {
          const medicationName = getMedicationName(medication);
          const dosage = getMedicationDosage(medication);
          const instructions = formatDosageInstructions(medication);
          const status = medication.status;
          
          // Determine status color
          const getStatusColor = (status?: string) => {
            switch (status) {
              case 'active':
                return { bgcolor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
              case 'on-hold':
                return { bgcolor: '#fef3c7', color: '#d97706', border: '1px solid #fed7aa' };
              case 'cancelled':
                return { bgcolor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
              case 'completed':
                return { bgcolor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' };
              default:
                return { bgcolor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
            }
          };

          return (
            <ListItem key={medication.id || index} sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <MedicationIcon 
                  sx={{ 
                    color: status === 'active' ? '#16a34a' : '#64748b',
                    fontSize: '1.2rem'
                  }} 
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                      {medicationName}
                    </Typography>
                    {status && (
                      <Chip
                        label={status.charAt(0).toUpperCase() + status.slice(1)}
                        size="small"
                        sx={{
                          ...getStatusColor(status),
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 20,
                          borderRadius: '10px'
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box component="span" sx={{ mt: 0.5, display: 'block' }}>
                    {dosage && (
                      <Typography component="span" variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        <strong>Dosage:</strong> {dosage}
                      </Typography>
                    )}
                    {instructions && (
                      <Typography component="span" variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        <strong>Instructions:</strong> {instructions}
                      </Typography>
                    )}
                    {medication.authoredOn && (
                      <Typography component="span" variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        <strong>Prescribed:</strong> {new Date(medication.authoredOn).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default PatientMedications;
