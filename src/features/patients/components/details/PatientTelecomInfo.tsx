/**
 * PatientTelecomInfo.tsx
 * 
 * Component for displaying patient telecom information (phone, email, etc.)
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
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import FaxIcon from '@mui/icons-material/Fax';
import LanguageIcon from '@mui/icons-material/Language';
import SmsIcon from '@mui/icons-material/Sms';
import ContactsIcon from '@mui/icons-material/Contacts';
import { Patient, ContactPoint } from '@medplum/fhirtypes';

interface PatientTelecomInfoProps {
    patient: Patient;
}

export const PatientTelecomInfo: React.FC<PatientTelecomInfoProps> = ({ patient }) => {
    const { t } = useTranslation(['patient', 'common']);

    // Get telecom information
    const telecom = patient.telecom || [];

    if (telecom.length === 0) {
        return (
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <ContactsIcon color="primary" />
                        <Typography variant="h6">
                            {t('labels.telecom.title', { ns: 'patient' })}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {t('labels.contactInfo.noPhone', { ns: 'patient' })}
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    // Get icon for telecom system
    const getTelecomIcon = (system: string) => {
        switch (system) {
            case 'phone':
                return <PhoneIcon />;
            case 'email':
                return <EmailIcon />;
            case 'fax':
                return <FaxIcon />;
            case 'url':
                return <LanguageIcon />;
            case 'sms':
                return <SmsIcon />;
            default:
                return <ContactsIcon />;
        }
    };

    // Get display name for telecom system
    const getTelecomSystemDisplay = (system: string): string => {
        return t(`labels.telecom.systems.${system}`, {
            ns: 'patient',
            defaultValue: system.charAt(0).toUpperCase() + system.slice(1)
        });
    };

    // Get display name for telecom use
    const getTelecomUseDisplay = (use: string): string => {
        return t(`labels.telecom.uses.${use}`, {
            ns: 'patient',
            defaultValue: use.charAt(0).toUpperCase() + use.slice(1)
        });
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ContactsIcon color="primary" />
                    <Typography variant="h6">
                        {t('labels.telecom.title', { ns: 'patient' })}
                    </Typography>
                </Box>

                <List dense>
                    {telecom.map((contact: ContactPoint, index: number) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                {getTelecomIcon(contact.system || 'other')}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1">
                                            {contact.value}
                                        </Typography>
                                        {contact.use && (
                                            <Chip
                                                label={getTelecomUseDisplay(contact.use)}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                            />
                                        )}
                                        {contact.rank && (
                                            <Chip
                                                label={`#${contact.rank}`}
                                                size="small"
                                                variant="filled"
                                                color="secondary"
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={getTelecomSystemDisplay(contact.system || 'other')}
                            />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};

export default PatientTelecomInfo;