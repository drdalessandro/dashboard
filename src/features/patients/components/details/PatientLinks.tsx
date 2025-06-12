/**
 * PatientLinks.tsx
 * 
 * Component for displaying patient relationships and links to other patient records
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
  Chip,
  Link as MuiLink
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import PersonIcon from '@mui/icons-material/Person';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CallMadeIcon from '@mui/icons-material/CallMade';
import { Patient, PatientLink, Reference } from '@medplum/fhirtypes';

interface PatientLinksProps {
  patient: Patient;
}

export const PatientLinks: React.FC<PatientLinksProps> = ({ patient }) => {
  const { t } = useTranslation(['patient', 'common']);

  // Get patient links
  const links = patient.link || [];

  if (links.length === 0) {
    return null; // Don't render anything if no patient links
  }

  // Get link type display
  const getLinkTypeDisplay = (link: PatientLink): string => {
    const type = link.type;
    if (type) {
      return t(`labels.patientLink.types.${type}`, { 
        ns: 'patient',
        defaultValue: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
      });
    }
    return t('labels.patientLink.types.seealso', { ns: 'patient' });
  };

  // Get icon for link type
  const getLinkTypeIcon = (link: PatientLink) => {
    switch (link.type) {
      case 'replaced-by':
      case 'replaces':
        return <SwapHorizIcon color="warning" />;
      case 'refer':
        return <CallMadeIcon color="info" />;
      case 'seealso':
      default:
        return <VisibilityIcon color="action" />;
    }
  };

  // Get chip color for link type
  const getChipColor = (link: PatientLink) => {
    switch (link.type) {
      case 'replaced-by':
      case 'replaces':
        return 'warning';
      case 'refer':
        return 'info';
      case 'seealso':
      default:
        return 'default';
    }
  };

  // Extract patient info from reference
  const getPatientInfo = (other: Reference): { id: string; display: string } => {
    const id = other.reference?.split('/').pop() || 'Unknown';
    const display = other.display || `Patient ${id}`;
    return { id, display };
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LinkIcon color="primary" />
          <Typography variant="h6">
            {t('labels.patientLink.title', { ns: 'patient' })}
          </Typography>
        </Box>
        
        <List dense>
          {links.map((link: PatientLink, index: number) => {
            const patientInfo = getPatientInfo(link.other);
            
            return (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getLinkTypeIcon(link)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MuiLink 
                        href={`/patients/${patientInfo.id}`}
                        underline="hover"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <PersonIcon fontSize="small" />
                        <Typography variant="body1">
                          {patientInfo.display}
                        </Typography>
                      </MuiLink>
                      <Chip 
                        label={getLinkTypeDisplay(link)}
                        size="small"
                        color={getChipColor(link)}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {t('labels.patientLink.linkedTo', { ns: 'patient' })}: {link.other.reference}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {t('labels.patientLink.helpText', { ns: 'patient' })}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PatientLinks;