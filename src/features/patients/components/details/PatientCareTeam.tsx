/**
   * PatientCareTeam.tsx
   * 
   * Enhanced component for displaying patient's care team with full practitioner details
   */
import React from 'react';
import Link from 'next/link';
import {
    Typography,
    Box,
    Avatar,
    Chip,
    CircularProgress,
    Grid
} from '@mui/material';
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import { Patient, Reference } from '@medplum/fhirtypes';
import { usePractitionerById } from '@/hooks/usePractitionerById';

interface PatientCareTeamProps {
    patient: Patient;
}

// Enhanced practitioner card component
const PractitionerCard: React.FC<{ practitionerId: string }> = ({ practitionerId }) => {
    const { data: practitioner, isLoading, error } = usePractitionerById(practitionerId);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error || !practitioner) {
        return (
            <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Unable to load practitioner details
                </Typography>
            </Box>
        );
    }

    // Extract practitioner data
    const getName = () => {
        if (practitioner.name && practitioner.name.length > 0) {
            const name = practitioner.name[0];
            const given = name.given?.join(' ') || '';
            const family = name.family || '';
            const prefix = name.prefix?.join(' ') || '';
            const suffix = name.suffix?.join(' ') || '';
            return `${prefix} ${given} ${family} ${suffix}`.trim();
        }
        return 'Unknown Practitioner';
    };

    const getInitials = () => {
        const name = practitioner.name?.[0];
        if (name) {
            const given = name.given?.[0] || '';
            const family = name.family || '';
            return `${given.charAt(0)}${family.charAt(0)}`.toUpperCase();
        }
        return 'P';
    };

    const getPhoto = () => {
        if (practitioner.photo && practitioner.photo.length > 0) {
            const photo = practitioner.photo[0];
            if (photo.data) {
                return `data:${photo.contentType || 'image/jpeg'};base64,${photo.data}`;
            } else if (photo.url) {
                return photo.url;
            }
        }
        return null;
    };

    const getSpecialty = () => {
        return practitioner.qualification?.[0]?.code?.text ||
            practitioner.qualification?.[0]?.code?.coding?.[0]?.display ||
            'General Practice';
    };

    const getOrganization = () => {
        // Extract organization from practitioner role or extension
        return 'Healthcare Organization'; // Placeholder - would need PractitionerRole resource
    };

    const getDepartment = () => {
        // Extract department from practitioner role
        return 'Primary Care'; // Placeholder - would need PractitionerRole resource
    };

    const getPhone = () => {
        return practitioner.telecom?.find(t => t.system === 'phone')?.value || 'Not available';
    };

    const getEmail = () => {
        return practitioner.telecom?.find(t => t.system === 'email')?.value || 'Not available';
    };

    return (
        <Box>
            {/* Photo and Name Row */}
            <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                {/* Photo Column */}
                <Grid item xs={4}>
                    <Box sx={{ display: 'flex', justifyContent: 'left' }}>
                        <Avatar
                            src={getPhoto() || undefined}
                            sx={{
                                width: 90,
                                height: 90,
                                fontSize: '1.5rem',
                                bgcolor: '#e2e8f0',
                                border: '1px solid #0ea5e9'
                            }}
                        >
                            {getInitials()}
                        </Avatar>
                    </Box>
                </Grid>

                {/* Name and Specialty Column */}
                <Grid item xs={8}>
                    <Box sx={{ textAlign: 'left' }}>
                        {/* Full name with title - linkable */}
                        <Link
                            href={`/practitioners/show/${practitionerId}`}
                            style={{ textDecoration: 'none' }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#0ea5e9',
                                    mb: 1,
                                    fontSize: '1.2rem',
                                    lineHeight: 1.2,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                        color: '#0284c7'
                                    }
                                }}
                            >
                                {getName()}
                            </Typography>
                        </Link>

                        {/* Specialty */}
                        <Chip
                            label={getSpecialty()}
                            size="small"
                            sx={{
                                bgcolor: '#e0f2fe',
                                color: '#0369a1',
                                fontWeight: 500,
                                fontSize: '0.75rem'
                            }}
                        />
                    </Box>
                </Grid>
            </Grid>

            {/* Details in two columns */}
            <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                {/* Organization and Department Row */}
                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <BusinessIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                            Organization:
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem', mb: 1.5 }}>
                        {getOrganization()}
                    </Typography>
                </Grid>

                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <BusinessIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                            Department:
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem', mb: 1.5 }}>
                        {getDepartment()}
                    </Typography>
                </Grid>

                {/* Phone and Email Row */}
                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                            Phone:
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem' }}>
                        {getPhone()}
                    </Typography>
                </Grid>

                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <EmailIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                            Email:
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem' }}>
                        {getEmail()}
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

export const PatientCareTeam: React.FC<PatientCareTeamProps> = ({ patient }) => {
    // Get general practitioners
    const generalPractitioners = patient.generalPractitioner || [];

    // Extract ID from reference
    const extractIdFromReference = (ref: Reference): string => {
        if (ref.reference) {
            const parts = ref.reference.split('/');
            return parts[parts.length - 1];
        }
        return ref.display || '';
    };

    if (generalPractitioners.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No primary healthcare practitioner assigned
                </Typography>
            </Box>
        );
    }

    // Show the first practitioner (assuming primary care)
    const primaryPractitioner = generalPractitioners[0];
    const practitionerId = extractIdFromReference(primaryPractitioner);

    return <PractitionerCard practitionerId={practitionerId} />;
};

export default PatientCareTeam;