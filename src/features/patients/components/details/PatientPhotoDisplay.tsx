/**
 * PatientPhotoDisplay.tsx
 * 
 * Component for displaying patient photo with fallback to initials
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Avatar
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import { Patient, Attachment } from '@medplum/fhirtypes';

interface PatientPhotoDisplayProps {
    patient: Patient;
}

export const PatientPhotoDisplay: React.FC<PatientPhotoDisplayProps> = ({ patient }) => {
    const { t } = useTranslation(['patient', 'common']);

    // Get patient photo
    const photo = patient.photo?.[0];

    // Get patient name for initials fallback
    const name = patient.name?.[0];
    const givenName = name?.given?.[0] || '';
    const familyName = name?.family || '';
    const initials = `${givenName.charAt(0)}${familyName.charAt(0)}`.toUpperCase();
    const fullName = `${givenName} ${familyName}`.trim();

    // Get photo URL
    const getPhotoUrl = (photo: Attachment): string | undefined => {
        if (photo.url) {
            return photo.url;
        }
        if (photo.data && photo.contentType) {
            return `data:${photo.contentType};base64,${photo.data}`;
        }
        return undefined;
    };

    const photoUrl = photo ? getPhotoUrl(photo) : undefined;

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PhotoCameraIcon color="primary" />
                    <Typography variant="h6">
                        {t('labels.photo.title', { ns: 'patient' })}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        src={photoUrl}
                        alt={fullName}
                        sx={{
                            width: 120,
                            height: 120,
                            fontSize: '2rem',
                            bgcolor: photoUrl ? 'transparent' : 'primary.main'
                        }}
                    >
                        {!photoUrl && (initials || <PersonIcon sx={{ fontSize: '3rem' }} />)}
                    </Avatar>

                    {fullName && (
                        <Typography variant="subtitle1" align="center" sx={{ fontWeight: 500 }}>
                            {fullName}
                        </Typography>
                    )}

                    {!photo && (
                        <Typography variant="caption" color="text.secondary" align="center">
                            {t('labels.photo.emptyState', { ns: 'patient', defaultValue: 'No photo available' })}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default PatientPhotoDisplay;