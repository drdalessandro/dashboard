/**
 * PatientMaritalStatus.tsx
 * 
 * Component for displaying patient marital status information
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonIcon from '@mui/icons-material/Person';
import { Patient } from '@medplum/fhirtypes';

interface PatientMaritalStatusProps {
  patient: Patient;
}

export const PatientMaritalStatus: React.FC<PatientMaritalStatusProps> = ({ patient }) => {
  const { t } = useTranslation(['patient', 'common']);

  // Get marital status
  const maritalStatus = patient.maritalStatus;

  if (!maritalStatus) {
    return null; // Don't render anything if no marital status
  }

  // Get marital status display
  const getMaritalStatusDisplay = (): string => {
    const code = maritalStatus.coding?.[0]?.code;
    if (code) {
      return t(`labels.maritalStatus.options.${code}`, { 
        ns: 'patient',
        defaultValue: maritalStatus.coding?.[0]?.display || code
      });
    }
    return maritalStatus.text || t('labels.maritalStatus.options.UNK', { ns: 'patient' });
  };

  // Get icon based on marital status
  const getMaritalStatusIcon = () => {
    const code = maritalStatus.coding?.[0]?.code;
    switch (code) {
      case 'M': // Married
      case 'P': // Polygamous
        return <FavoriteIcon color="secondary" />;
      default:
        return <PersonIcon color="primary" />;
    }
  };

  // Get chip color based on marital status
  const getChipColor = () => {
    const code = maritalStatus.coding?.[0]?.code;
    switch (code) {
      case 'M': // Married
      case 'P': // Polygamous
        return 'secondary';
      case 'S': // Never Married
      case 'U': // Unmarried
        return 'primary';
      case 'D': // Divorced
      case 'L': // Legally Separated
      case 'W': // Widowed
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {getMaritalStatusIcon()}
          <Typography variant="h6">
            {t('labels.maritalStatus.title', { ns: 'patient' })}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={getMaritalStatusDisplay()}
            size="medium"
            color={getChipColor()}
            variant="filled"
            sx={{ fontWeight: 500 }}
          />
        </Box>

        {maritalStatus.text && maritalStatus.text !== getMaritalStatusDisplay() && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
            {maritalStatus.text}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientMaritalStatus;