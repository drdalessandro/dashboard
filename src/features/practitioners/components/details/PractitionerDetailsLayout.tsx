/**
 * Practitioner Details Layout Component - Merged with comprehensive detail logic
 * Displays practitioner information in sections similar to patient details page
 * Includes modal edit functionality
 */

"use client";

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Container,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link
} from '@mui/material';
import {
  Edit as EditIcon,
  PersonOutlined
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Practitioner } from '@medplum/fhirtypes';

// Hooks
import { usePractitionerPatients } from '../../../../hooks/usePractitionerPatients';
import { usePractitionerCareTeam } from '../../../../hooks/useCareTeam';

// Utils
import {
  transformPractitionerForDisplay,
} from '../../utils/practitionerDataUtils';

// Components
import PractitionerEditModal from '../PractitionerEditModal';
import {
  EmptyState,
} from '@/components/designSystem';
import { useRouter } from 'next/navigation';

interface PractitionerDetailsLayoutProps {
  practitioner: Practitioner;
  overview?: React.ReactNode;
}

const PractitionerDetailsLayout: React.FC<PractitionerDetailsLayoutProps> = ({ practitioner, overview }) => {
  const router = useRouter();
  const { t } = useTranslation(['practitioner', 'common']);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [editModalOpen, setEditModalOpen] = React.useState(false);

  // Fetch practitioner patients
  const {
    totalPatientCount,
    recentPatients,
    isLoading: patientsLoading,
    error: patientsError
  } = usePractitionerPatients(practitioner.id || '', {
    enabled: !!practitioner.id,
    recentLimit: 5
  });

  // Fetch practitioner care teams
  const {
    careTeams,
    isLoading: careTeamsLoading
  } = usePractitionerCareTeam(practitioner.id || '', {
    enabled: !!practitioner.id
  });

  // Handle edit modal
  const handleEditClick = () => {
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
  };

  const handleEditSave = (updatedPractitioner: Practitioner) => {
    // Optionally refresh the page or update local state
    // The modal will close automatically after successful save
    console.log('Practitioner updated:', updatedPractitioner);
  };

  // Transform practitioner data for display - memoized to prevent unnecessary recalculations
  const practitionerData = useMemo(() => {
    if (!practitioner) return null;
    return transformPractitionerForDisplay(practitioner, t);
  }, [practitioner, t]);

  // Get practitioner photo URL or initials
  const getPractitionerPhoto = () => {
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

  const getPractitionerInitials = () => {
    const name = practitioner.name?.[0];
    if (name) {
      const given = name.given?.[0] || '';
      const family = name.family || '';
      return `${given.charAt(0)}${family.charAt(0)}`.toUpperCase();
    }
    return 'P';
  };

  // return empty if practitionerData is null
  if (!practitionerData) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <Container maxWidth={false} sx={{ py: 3, px: 3 }}>
          <EmptyState title={t('practitionerNotFound', { ns: 'practitioner' })} />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Container maxWidth={false} sx={{ py: 3, px: 3 }}>
        {/* Practitioner Profile Header */}
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={getPractitionerPhoto() || undefined}
                  sx={{
                    width: 96,
                    height: 96,
                    fontSize: '2rem',
                    bgcolor: '#e2e8f0'
                  }}
                >
                  {getPractitionerInitials()}
                </Avatar>
                <Box>
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                    {practitionerData.prefix} {practitionerData.name || t('messages.unknownPractitioner', { ns: 'practitioner' })}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Practitioner ID: <Box component="span" sx={{ fontWeight: 500, color: '#475569' }}>
                      {practitioner.id || 'N/A'}
                    </Box>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    NINA: {practitioner.identifier?.[0]?.value || 'N/A'}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                sx={{
                  bgcolor: '#0ea5e9',
                  '&:hover': { bgcolor: '#0284c7' },
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                  py: 1.5
                }}
              >
                Edit Profile
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Main Content - Two Column Layout */}
        <Grid container spacing={3}>
          {/* Left Column - Identity & Contact */}
          <Grid item xs={12} lg={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* Demographics & Contact Address */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Demographics & Contact Address
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Gender
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {practitioner.gender ? practitioner.gender.charAt(0).toUpperCase() + practitioner.gender.slice(1) : 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Birth Date
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {practitioner.birthDate || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Phone
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {/* display phone numbers with new lines */}
                        {
                          practitionerData.phoneNumbers?.length > 0
                            ? practitionerData.phoneNumbers.map((p, index) => (
                              <span style={{ display: 'block' }} key={index}>{p.system}: {p.value}</span>
                            ))
                            : t('noPhone', { ns: 'common' })
                        }
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Email
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {
                          practitionerData.email && practitionerData.email.length > 0
                            ? practitionerData.email.map((e, index) => (
                              <span style={{ display: 'block' }} key={index}>{e.system}: {e.value}</span>
                            ))
                            : t('noEmail', { ns: 'common' })
                        }
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Address
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {/* display address with new lines */}
                        {practitionerData.address
                          ? practitionerData.address?.split('\n').map((line, index) => (
                            <span key={index}>{line}, </span>
                          ))
                          : t('noAddress', { ns: 'common' })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Preferred Languages
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {practitionerData.languages && practitionerData.languages.length > 0 && practitionerData.languages.filter(Boolean).length > 0
                          ? practitionerData.languages.filter(Boolean).join(', ')
                          : t('noLanguage', { ns: 'common' })}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>


              {/* Professional Information */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Professional Information
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Role
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {careTeamsLoading
                          ? 'Loading...'
                          : careTeams.length > 0
                            ? careTeams.map(team => team.role).filter(Boolean).join(', ') || 'Role not specified'
                            : 'No role assigned'
                        }
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', mb: 1, display: 'block' }}>
                        Organization
                      </Typography>
                      <Typography
                        component="a"
                        href="#"
                        sx={{
                          color: '#0ea5e9',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '0.875rem'
                        }}
                      >
                        {careTeamsLoading
                          ? 'Loading...'
                          : careTeams.length > 0
                            ? careTeams[0]?.organization?.display || ''
                            : t('noOrganization', { ns: 'common' })
                        }
                        <Box component="span" sx={{ fontSize: '0.75rem' }}>🔗</Box>
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Department
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {careTeamsLoading
                          ? 'Loading...'
                          : careTeams.length > 0
                            ? careTeams.map(team => team.department).filter(Boolean).join(', ') || ''
                            : t('noDepartment', { ns: 'common' })
                        }
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', mb: 2, display: 'block' }}>
                        Qualifications
                      </Typography>
                      {practitionerData.qualification && practitionerData.qualification.length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Period</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Issuer</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {practitionerData.qualification.map((qualification, index) => (
                                <TableRow key={index} hover>
                                  <TableCell sx={{ fontSize: '0.875rem' }}>
                                    {qualification.code?.coding?.[0]?.display || 'Not specified'}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.875rem' }}>
                                    {qualification.period ? (
                                      <Box>
                                        {qualification.period.start && (
                                          <Typography variant="body2" component="div">
                                            Start: {new Date(qualification.period.start).toLocaleDateString()}
                                          </Typography>
                                        )}
                                        {qualification.period.end && (
                                          <Typography variant="body2" component="div">
                                            End: {new Date(qualification.period.end).toLocaleDateString()}
                                          </Typography>
                                        )}
                                        {!qualification.period.start && !qualification.period.end && 'Not specified'}
                                      </Box>
                                    ) : (
                                      'Not specified'
                                    )}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.875rem' }}>
                                    {qualification.issuer ? (
                                      <Link
                                        component="button"
                                        variant="body2"
                                        onClick={() => {
                                          // Extract organization ID from reference
                                          const orgId = qualification.issuer?.reference?.split('/')[1];
                                          if (orgId) {
                                            router.push(`/organizations/show/${orgId}`);
                                          }
                                        }}
                                        sx={{
                                          textDecoration: 'none',
                                          color: '#0ea5e9',
                                          '&:hover': { textDecoration: 'underline' },
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5
                                        }}
                                      >
                                        {qualification.issuer.display || qualification.issuer.reference || 'Unknown Organization'}
                                        <Box component="span" sx={{ fontSize: '0.75rem' }}>🔗</Box>
                                      </Link>
                                    ) : (
                                      'Not specified'
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                          {t('noQualification', { ns: 'common' })}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Right Column - Patients Under Care */}
          <Grid item xs={12} lg={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* Patients Section */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Patients Under Care
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {totalPatientCount || 0} total patients under primary care
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  {patientsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : patientsError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      Failed to load patients: {patientsError.userMessage}
                    </Alert>
                  ) : recentPatients.length === 0 ? (
                    <EmptyState
                      icon={<PersonOutlined sx={{ fontSize: 48, color: '#9ca3af' }} />}
                      title="No Patients Found"
                      subtitle="This practitioner is not assigned as primary care provider for any patients."
                    />
                  ) : (
                    <Box>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Date of Birth</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Encounter Type</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Last Encounter Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {recentPatients.map((patient) => (
                              <TableRow key={patient.id} hover>
                                <TableCell>
                                  <Box>
                                    <Link
                                      component="button"
                                      variant="body2"
                                      onClick={() => router.push(`/patients/show/${patient.id}`)}
                                      sx={{
                                        textDecoration: 'none',
                                        color: '#0ea5e9',
                                        '&:hover': { textDecoration: 'underline' }
                                      }}
                                    >
                                      {patient.name}
                                    </Link>
                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                                      {patient.relationshipType}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Not specified'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {patient.encounterType || 'Not specified'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {patient.lastEncounterDate ? new Date(patient.lastEncounterDate).toLocaleDateString() : 'No recent visits'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {totalPatientCount > recentPatients.length && (
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                          <Button
                            variant="outlined"
                            onClick={() => router.push(`/patients?practitioner=${practitioner?.id}`)}
                          >
                            View All {totalPatientCount} Patients
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>


        {/* Custom Overview Content */}
        {overview && (
          <Card sx={{ mt: 3, borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              {overview}
            </CardContent>
          </Card>
        )}

        {/* Practitioner Edit Modal */}
        <PractitionerEditModal
          open={editModalOpen}
          onClose={handleEditModalClose}
          practitioner={practitioner}
          onSave={handleEditSave}
        />
      </Container>
    </Box>
  );
};

export default PractitionerDetailsLayout;