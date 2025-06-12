/**
 * PatientContacts.tsx
 * 
 * Component for displaying patient emergency contacts and related persons
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Typography,
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid
} from '@mui/material';
import ContactsIcon from '@mui/icons-material/Contacts';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Patient, PatientContact, ContactPoint } from '@medplum/fhirtypes';

interface PatientContactsProps {
    patient: Patient;
}

export const PatientContacts: React.FC<PatientContactsProps> = ({ patient }) => {
    const { t } = useTranslation(['patient', 'common']);

    // Get contacts
    const contacts = patient.contact || [];

    if (contacts.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No emergency contacts or related persons recorded
                </Typography>
            </Box>
        );
    }

    // Get relationship display name
    const getRelationshipDisplay = (contact: PatientContact): string => {
        const code = contact.relationship?.[0]?.coding?.[0]?.code;
        if (code) {
            return t(`labels.contact.relationships.${code}`, {
                ns: 'patient',
                defaultValue: contact.relationship?.[0]?.coding?.[0]?.display || code
            });
        }
        return t('labels.contact.relationships.O', { ns: 'patient' });
    };

    // Get contact name
    const getContactName = (contact: PatientContact): string => {
        if (contact.name) {
            const given = contact.name.given?.[0] || '';
            const family = contact.name.family || '';
            return `${given} ${family}`.trim();
        }
        return t('labels.contact.unknownName', { ns: 'patient', defaultValue: 'Unknown Contact' });
    };

    // Get telecom icon
    const getTelecomIcon = (system: string) => {
        switch (system) {
            case 'phone':
            case 'sms':
                return <PhoneIcon fontSize="small" />;
            case 'email':
                return <EmailIcon fontSize="small" />;
            default:
                return <ContactsIcon fontSize="small" />;
        }
    };

    return (
        <Grid container spacing={2}>
            {contacts.map((contact: PatientContact, index: number) => (
                <Grid item xs={12} md={6} key={index}>
                    <Accordion sx={{ 
                        borderRadius: 2, 
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        '&:before': { display: 'none' }
                    }}>
                        <AccordionSummary 
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ 
                                bgcolor: '#f8fafc',
                                borderRadius: '8px 8px 0 0',
                                '&.Mui-expanded': {
                                    borderRadius: '8px 8px 0 0'
                                }
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <PersonIcon color="primary" />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                        {getContactName(contact)}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        <Chip
                                            label={getRelationshipDisplay(contact)}
                                            size="small"
                                            sx={{
                                                bgcolor: '#e0f2fe',
                                                color: '#0369a1',
                                                fontWeight: 500,
                                                fontSize: '0.75rem'
                                            }}
                                        />
                                        {contact.gender && (
                                            <Chip
                                                label={contact.gender.charAt(0).toUpperCase() + contact.gender.slice(1)}
                                                size="small"
                                                sx={{
                                                    bgcolor: '#f3e8ff',
                                                    color: '#7c3aed',
                                                    fontWeight: 500,
                                                    fontSize: '0.75rem'
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 2 }}>
                            {/* Organization */}
                            {contact.organization && (
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <ContactsIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                                            Organization:
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem' }}>
                                        {contact.organization.display}
                                    </Typography>
                                </Box>
                            )}

                            {/* Telecom */}
                            {contact.telecom && contact.telecom.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                                        Contact Information:
                                    </Typography>
                                    <List dense sx={{ py: 0 }}>
                                        {contact.telecom.map((telecom: ContactPoint, telecomIndex: number) => (
                                            <ListItem key={telecomIndex} sx={{ px: 0, py: 0.5 }}>
                                                <ListItemIcon sx={{ minWidth: 24 }}>
                                                    {getTelecomIcon(telecom.system || 'other')}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#374151' }}>
                                                            {telecom.value}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        telecom.use && (
                                                            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                                {telecom.use.charAt(0).toUpperCase() + telecom.use.slice(1)}
                                                            </Typography>
                                                        )
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* Address */}
                            {contact.address && (contact.address.city || contact.address.country) && (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <HomeIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                                            Address:
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem' }}>
                                        {[
                                            ...(contact.address.line || []),
                                            contact.address.city,
                                            contact.address.state,
                                            contact.address.postalCode,
                                            contact.address.country
                                        ].filter(Boolean).join(', ')}
                                    </Typography>
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                </Grid>
            ))}
        </Grid>
    );
};

export default PatientContacts;