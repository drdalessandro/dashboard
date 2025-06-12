/**
 * PatientDetailsLayout.tsx - Updated with Dynamic Database Data
 * 
 * Main layout component for the patient details dashboard
 * Updated to use dynamic data from FHIR resources instead of mock data
 */
import React from 'react';
import {
  Box,
  Container,
  useTheme,
  useMediaQuery,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Event as EventIcon,
  Medication as MedicationIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// Import existing components
import PatientVitals from './PatientVitals';
import PatientHistory from './PatientHistory';
import PatientMedicalHistory from './PatientMedicalHistory';
import PatientAllergies from './PatientAllergies';
import PatientMedications from './PatientMedications';
import PatientEditModal from '../PatientEditModal';
// Import new FHIR display components
import PatientDeceasedInfo from './PatientDeceasedInfo';
import PatientTelecomInfo from './PatientTelecomInfo';
import PatientPhotoDisplay from './PatientPhotoDisplay';
import PatientContacts from './PatientContacts';
import PatientCareTeam from './PatientCareTeam';
import PatientMaritalStatus from './PatientMaritalStatus';
import PatientCommunication from './PatientCommunication';
import PatientLinks from './PatientLinks';

import { useTranslation } from 'react-i18next';
import { Patient } from '@medplum/fhirtypes';
import { usePatientConditions } from '@/hooks/useCondition';
import { usePatientVitals } from '@/hooks/useObservation';
import { usePatientEncounters } from '@/hooks/useEncounter';
import {
  formatPatientName,
  extractNameParts,
  extractPhoneNumbers,
  extractAddress,
  extractIdentifier,
  extractEmail,
  extractMaritalStatus,
  extractLanguage,
  extractGeneralPractitioner,
  calculateAge,
  getFormattedRegistrationDate,
  getConditionDisplay,
  processVitalsFromObservations,
  processEncountersIntoVisits,
  extractManagingOrganization
} from '../../utils/patientDataUtils';

interface PatientDetailsLayoutProps {
  patient: Patient | null;
}

const PatientDetailsLayout: React.FC<PatientDetailsLayoutProps> = ({ patient }) => {
  const { t } = useTranslation(['patient', 'common']);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [fabMenuAnchor, setFabMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);

  // Fetch dynamic data from database - MUST be called before any conditional returns
  const { data: conditions, isLoading: conditionsLoading, error: conditionsError } = usePatientConditions(patient?.id || '', {
    enabled: !!patient?.id,
    clinicalStatus: 'active'
  });

  const { data: vitalsObservations, isLoading: vitalsLoading, error: vitalsError } = usePatientVitals(patient?.id || '');

  const { data: encounters, isLoading: encountersLoading, error: encountersError } = usePatientEncounters(patient?.id || '');

  // Transform patient data for display - MUST be called before conditional return
  const patientDisplayData = React.useMemo(() => {
    if (!patient) return null;

    const nameParts = extractNameParts(patient);
    const phoneNumbers = extractPhoneNumbers(patient);
    const addressInfo = extractAddress(patient);

    return {
      id: patient.id || '',
      identifier: extractIdentifier(patient),
      name: formatPatientName(patient),
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      gender: patient.gender,
      birthDate: patient.birthDate,
      age: calculateAge(patient.birthDate),
      phoneNumbers,
      email: extractEmail(patient),
      address: addressInfo.address,
      addressLine1: addressInfo.addressLine1,
      addressLine2: addressInfo.addressLine2,
      city: addressInfo.city,
      state: addressInfo.state,
      postalCode: addressInfo.postalCode,
      country: addressInfo.country,
      maritalStatus: extractMaritalStatus(patient),
      language: extractLanguage(patient),
      photo: patient.photo?.[0]?.data ? `data:${patient.photo[0].contentType || 'image/jpeg'};base64,${patient.photo[0].data}` : patient.photo?.[0]?.url,
      status: patient.active === false ? 'inactive' : 'active',
      deceasedBoolean: patient.deceasedBoolean,
      registrationDate: getFormattedRegistrationDate(patient),
      lastUpdated: patient.meta?.lastUpdated,
      generalPractitioner: extractGeneralPractitioner(patient),
      managingOrganization: extractManagingOrganization(patient),
    };
  }, [patient]);

  // Process vitals data from observations - MUST be called before conditional return
  const vitalsData = React.useMemo(() => {
    if (!vitalsObservations) return [];
    const observationsArray = Array.isArray(vitalsObservations)
      ? vitalsObservations
      : [vitalsObservations];
    const processed = processVitalsFromObservations(observationsArray);
    return processed.vitalsCards;
  }, [vitalsObservations]);

  // Process encounters into visits data - MUST be called before conditional return
  const visitsData = React.useMemo(() => {
    if (!encounters) return [];
    const encountersArray = Array.isArray(encounters)
      ? encounters
      : [encounters];
    return processEncountersIntoVisits(encountersArray).slice(0, 10); // Show latest 10 visits
  }, [encounters]);

  // Early return if patient is null - AFTER all hooks have been called
  if (!patient) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          {t('common:loading')} Patient details...
        </Typography>
      </Box>
    );
  }

  // Handle edit modal
  const handleEditClick = () => {
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
  };

  const handleEditSave = (updatedPatient: Patient) => {
    // Optionally refresh the page or update local state
    // The modal will close automatically after successful save
    console.log('Patient updated:', updatedPatient);
  };

  const handleFabClick = (event: React.MouseEvent<HTMLElement>) => {
    setFabMenuAnchor(event.currentTarget);
  };

  const handleFabClose = () => {
    setFabMenuAnchor(null);
  };

  // Get patient photo URL or initials
  const getPatientPhoto = () => {
    if (!patient || !patient.photo || patient.photo.length === 0) return null;

    const photo = patient.photo[0];
    if (photo.data) {
      return `data:${photo.contentType || 'image/jpeg'};base64,${photo.data}`;
    } else if (photo.url) {
      return photo.url;
    }
    return null;
  };

  const getPatientInitials = () => {
    if (!patient) return '';

    const name = patient.name?.[0];
    if (name) {
      const given = name.given?.[0] || '';
      const family = name.family || '';
      return `${given.charAt(0)}${family.charAt(0)}`.toUpperCase();
    }
    return '';
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Container maxWidth={false} sx={{ py: 3, px: 3 }}>
        {/* Patient Profile Header */}
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
                  src={getPatientPhoto() || undefined}
                  sx={{
                    width: 96,
                    height: 96,
                    fontSize: '2rem',
                    bgcolor: '#e2e8f0'
                  }}
                >
                  {getPatientInitials()}
                </Avatar>
                <Box>
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                    {patientDisplayData!.name || t('messages.unknownPatient', { ns: 'patient' })}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Patient ID: <Box component="span" sx={{ fontWeight: 500, color: '#475569' }}>
                      {patientDisplayData!.id || 'N/A'}
                    </Box>
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
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Vitals Cards Row - Now with 5 cards including Body Weight */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {vitalsLoading ? (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  </Grid>
                ) : vitalsError ? (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      Failed to load vitals data. Showing placeholder values.
                    </Alert>
                  </Grid>
                ) : null}

                {vitalsData.map((vital, index) => (
                  <Grid item xs={12} sm={6} md={2.4} key={index}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography sx={{ fontSize: '16px' }}>{vital.icon}</Typography>
                          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.875rem' }}>
                            {vital.label}
                          </Typography>
                        </Box>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          {vital.value} <Typography component="span" sx={{ fontSize: '0.875rem', fontWeight: 400, color: '#64748b' }}>
                            {vital.unit}
                          </Typography>
                        </Typography>
                        <Typography variant="caption" sx={{
                          color: vital.status === 'normal' ? '#16a34a' :
                            vital.status === 'high' ? '#dc2626' : '#ea580c',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          {vital.status === 'normal' ? 'Normal' :
                            vital.status === 'high' ? 'High' : 'Low'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Demographics */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Demographics
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Date of Birth
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {patientDisplayData!.birthDate}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Gender
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {patientDisplayData!.gender ? patientDisplayData!.gender.charAt(0).toUpperCase() + patientDisplayData!.gender.slice(1) : 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Preferred Language
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {patientDisplayData!.language}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Marital Status
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {patientDisplayData?.maritalStatus}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Status
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {patientDisplayData!.status}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Deceased
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {patientDisplayData!.deceasedBoolean ? 'Yes' : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Contact & Address */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Contact & Address
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Phone
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {patientDisplayData!.phoneNumbers.map((phone, index) => (
                          <React.Fragment key={index}>
                            {phone.value}
                            {index < patientDisplayData!.phoneNumbers.length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Email
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {/* {patient.telecom?.find(t => t.system === 'email')?.value} */}
                        {patientDisplayData!.email!.map((email, index) => (
                          <React.Fragment key={index}>
                            {email.value}
                            {index < patientDisplayData!.email!.length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Address
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {patientDisplayData!.address}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Organization */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Organization
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', mb: 1, display: 'block' }}>
                        Managing Organization
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
                        {patientDisplayData!.managingOrganization || 'Not assigned'}
                        <Box component="span" sx={{ fontSize: '0.75rem' }}>🔗</Box>
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Emergency Contacts & Related Persons */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Emergency Contacts & Related Persons
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <PatientContacts patient={patient} />
                </CardContent>
              </Card>

              {/* Insurance & Coverage */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Insurance & Coverage
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="overline" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Primary Insurance
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>
                        {/* Insurance data would come from Coverage resources */}
                        Not available
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Primary Healthcare Practitioner - Now using dynamic PatientCareTeam component */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Primary Healthcare Practitioner
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <PatientCareTeam patient={patient} />
                </CardContent>
              </Card>

              {/* Primary Complaint - Now using dynamic conditions data */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Primary Complaint
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  {conditionsLoading ? (
                    <CircularProgress size={20} />
                  ) : conditionsError ? (
                    <Typography variant="body2" sx={{ color: '#ef4444' }}>
                      Failed to load conditions
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Complaint:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151' }}>
                        {conditions && conditions.length > 0
                          ? getConditionDisplay(conditions[0])
                          : 'No primary complaint recorded'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Known Allergies - Dynamic component */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Known Allergies
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <PatientAllergies patient={patient} />
                </CardContent>
              </Card>

              {/* Medications - Dynamic component */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Medications
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <PatientMedications patient={patient} />
                </CardContent>
              </Card>

              {/* Conditions - Dynamic component */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Conditions
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <PatientMedicalHistory patient={patient} />
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Visits & Encounters Table - Now using dynamic encounters data */}
        <Card sx={{ mt: 3, borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Visits & Encounters
            </Typography>
          </Box>
          {encountersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : encountersError ? (
            <CardContent>
              <Alert severity="error">
                Failed to load encounters data
              </Alert>
            </CardContent>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', py: 1.5 }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', py: 1.5 }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', py: 1.5 }}>
                      Provider
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', py: 1.5 }}>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visitsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3, color: '#64748b' }}>
                        No encounters recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    visitsData.map((visit, index) => (
                      <TableRow key={visit.id || index} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        <TableCell sx={{ py: 2, color: '#374151', fontSize: '0.875rem' }}>
                          {visit.date ? new Date(visit.date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ py: 2, color: '#374151', fontSize: '0.875rem' }}>
                          {visit.type}
                        </TableCell>
                        <TableCell sx={{ py: 2, color: '#374151', fontSize: '0.875rem' }}>
                          {visit.provider}
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={visit.status}
                            size="small"
                            sx={{
                              bgcolor: visit.status === 'Completed' ? '#dcfce7' :
                                visit.status === 'In Progress' ? '#dbeafe' : '#fef3c7',
                              color: visit.status === 'Completed' ? '#166534' :
                                visit.status === 'In Progress' ? '#1e40af' : '#92400e',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                              borderRadius: '12px'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: '#0ea5e9',
            '&:hover': { bgcolor: '#0284c7' },
            zIndex: 1000
          }}
          onClick={handleFabClick}
        >
          <AddIcon />
        </Fab>

        {/* FAB Menu */}
        <Menu
          anchorEl={fabMenuAnchor}
          open={Boolean(fabMenuAnchor)}
          onClose={handleFabClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ '& .MuiPaper-root': { borderRadius: 2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' } }}
        >
          <MenuItem onClick={handleFabClose} sx={{ py: 1.5, px: 2, minWidth: 180 }}>
            <ListItemIcon>
              <EventIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add Appointment</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleFabClose} sx={{ py: 1.5, px: 2 }}>
            <ListItemIcon>
              <MedicationIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add Medication</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleFabClose} sx={{ py: 1.5, px: 2 }}>
            <ListItemIcon>
              <AssignmentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add Encounter</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleFabClose} sx={{ py: 1.5, px: 2 }}>
            <ListItemIcon>
              <WarningIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add Allergy</ListItemText>
          </MenuItem>
        </Menu>

        {/* Patient Edit Modal */}
        <PatientEditModal
          open={editModalOpen}
          onClose={handleEditModalClose}
          patient={patient}
          onSave={handleEditSave}
        />
      </Container>
    </Box>
  );
};

export default PatientDetailsLayout;