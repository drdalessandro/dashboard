/**
 * PatientCommunication.tsx
 * 
 * Component for displaying patient communication preferences and languages
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import StarIcon from '@mui/icons-material/Star';
import TranslateIcon from '@mui/icons-material/Translate';
import { Patient, CodeableConcept } from '@medplum/fhirtypes';

interface PatientCommunicationProps {
  patient: Patient;
}

export const PatientCommunication: React.FC<PatientCommunicationProps> = ({ patient }) => {
  const { t } = useTranslation(['patient', 'common']);

  // Get communication preferences
  const communication = patient.communication || [];

  if (communication.length === 0) {
    return null; // Don't render anything if no communication preferences
  }

  // Get language display name
  const getLanguageDisplay = (comm: any): string => {
    // Try different ways to get language display
    if (comm.language?.text) {
      return comm.language.text;
    }
    if (comm.language?.coding?.[0]?.display) {
      return comm.language.coding[0].display;
    }
    if (comm.language?.coding?.[0]?.code) {
      return comm.language.coding[0].code.toUpperCase();
    }
    return t('labels.communication.unknownLanguage', { ns: 'patient', defaultValue: 'Unknown Language' });
  };

  // Check if language is preferred
  const isPreferred = (comm: any): boolean => {
    return comm.preferred === true;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TranslateIcon color="primary" />
          <Typography variant="h6">
            {t('labels.communication.title', { ns: 'patient' })}
          </Typography>
        </Box>
        
        <List dense>
          {communication.map((comm: any, index: number) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {isPreferred(comm) ? (
                  <StarIcon color="warning" />
                ) : (
                  <LanguageIcon color="action" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">
                      {getLanguageDisplay(comm)}
                    </Typography>
                    {isPreferred(comm) && (
                      <Chip 
                        label={t('labels.communication.preferred', { ns: 'patient' })}
                        size="small"
                        color="warning"
                        variant="filled"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </Box>
                }
                secondary={comm.language?.coding?.[0]?.system ? 
                  `System: ${comm.language.coding[0].system}` : 
                  undefined
                }
              />
            </ListItem>
          ))}
        </List>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {t('labels.communication.helpText', { ns: 'patient' })}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PatientCommunication;