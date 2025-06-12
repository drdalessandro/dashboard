/**
 * PatientDeceasedInfo.tsx
 * 
 * Component for displaying patient deceased status and date/time
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Alert
} from '@mui/material';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import EventIcon from '@mui/icons-material/Event';
import { Patient } from '@medplum/fhirtypes';

interface PatientDeceasedInfoProps {
    patient: Patient;
}

export const PatientDeceasedInfo: React.FC<PatientDeceasedInfoProps> = ({ patient }) => {
    const { t } = useTranslation(['patient', 'common']);

    // Check if patient is deceased
    const isDeceased = patient.deceasedBoolean === true || (typeof patient.deceasedDateTime === 'string' && patient.deceasedDateTime);
    const deceasedDateTime = typeof patient.deceasedDateTime === 'string' ? patient.deceasedDateTime : undefined;

    if (!isDeceased) {
        return null; // Don't render anything if patient is not deceased
    }

    // Format deceased date/time
    const formatDeceasedDateTime = (dateTime: string): string => {
        try {
            const date = new Date(dateTime);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        } catch {
            return dateTime;
        }
    };

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PersonOffIcon color="error" />
                    <Typography variant="h6" color="error">
                        {t('labels.deceased.title', { ns: 'patient' })}
                    </Typography>
                </Box>

                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {t('labels.deceased.status', { ns: 'patient' })}
                    </Typography>
                </Alert>

                {deceasedDateTime && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                        <EventIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                            {t('labels.deceased.dateTime', { ns: 'patient' })}:
                        </Typography>
                        <Chip
                            label={formatDeceasedDateTime(deceasedDateTime)}
                            size="small"
                            variant="outlined"
                            color="error"
                        />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default PatientDeceasedInfo;