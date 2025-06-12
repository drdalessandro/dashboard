/**
 * PatientHeader
 * Displays patient profile information and breadcrumb navigation
 * Includes patient photo, name, email, and edit profile button
 */
import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Breadcrumbs,
  Link as MuiLink,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Patient } from '@medplum/fhirtypes';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import { calculateAge } from '@/utils/date';
import { Grid } from '@mui/material';

interface PatientHeaderProps {
  patient: Patient;
  onEdit?: () => void;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ patient, onEdit }) => {
  const { t } = useTranslation(['patient', 'common']);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Extract patient name
  const patientName = patient.name?.[0]?.text ||
    `${(patient.name?.[0]?.given || []).join(' ')} ${patient.name?.[0]?.family || ''}`.trim();

  // Calculate age
  const birthDate = patient.birthDate
    ? new Date(patient.birthDate)
    : undefined;

  // Extract contact information
  const phoneContact = patient.telecom?.find(contact => contact.system === 'phone');
  const emailContact = patient.telecom?.find(contact => contact.system === 'email');

  // extract patient home address using type = home
  const patientHomeAddress = patient.address?.find(address => address.use === 'home')?.text ||
    `${(patient.address?.[0]?.line || []).join(' ')}, ${patient.address?.[0]?.city || ''}, ${patient.address?.[0]?.state || ''}, ${patient.address?.[0]?.country || ''}`.trim();

  //  extract patient work address using type = work
  const patientWorkAddress = patient.address?.find(address => address.use === 'work')?.text ||
    `${(patient.address?.[0]?.line || []).join(' ')}, ${patient.address?.[0]?.city || ''}, ${patient.address?.[0]?.state || ''}, ${patient.address?.[0]?.country || ''}`.trim();

  // print patient object
  console.log("Muaz Patient", patient);

  const handleEditPatient = () => {
    if (onEdit) {
      onEdit();
    } else if (patient.id) {
      router.push(`/patients/edit/${patient.id}`);
    }
  };

  return (
    <Box>
      {/* Breadcrumb navigation */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <Link href="/patients" passHref legacyBehavior>
          <MuiLink
            underline="hover"
            color="inherit"
          >
            {t('navigation.patient', { ns: 'patient' })}
          </MuiLink>
        </Link>
        <Link href="/patients" passHref legacyBehavior>
          <MuiLink
            underline="hover"
            color="inherit"
          >
            {t('patientDetails', { ns: 'patient' })}
          </MuiLink>
        </Link>
        <Typography color="text.primary">
          {patientName}
        </Typography>
      </Breadcrumbs>

      {/* Patient profile section */}
      <Box sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        p: 3,
        mb: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Grid container spacing={3} alignItems="center">
          {/* Patient Avatar */}
          <Grid columns={{ xs: 12, sm: 2 }} display="flex" justifyContent="center">
            <Avatar
              sx={{
                width: 120,
                height: 120,
                fontSize: '3rem',
                backgroundColor: theme.palette.primary.main
              }}
            >
              {patientName ? patientName.charAt(0).toUpperCase() : '?'}
            </Avatar>
          </Grid>

          {/* Patient Details */}
          <Grid columns={{ xs: 12, sm: 10 }}>
            <Typography variant="h4" gutterBottom>
              {patientName}
            </Typography>

            <Grid container spacing={2}>
              {/* Basic Information */}
              <Grid columns={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle1">
                  <strong>{t('labels.personalInfo.gender', { ns: 'patient' })}:</strong> {t(`labels.personalInfo.gender.${patient.gender}`, { ns: 'patient' })}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>{t('labels.personalInfo.age', { ns: 'patient' })}:</strong> {birthDate ? calculateAge(birthDate) : t('notSpecified', { ns: 'common' })}
                </Typography>
              </Grid>

              {/* Contact Information */}
              <Grid columns={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle1">
                  <strong>{t('labels.contact.phone', { ns: 'patient' })}:</strong> {phoneContact?.value || t('notSpecified', { ns: 'common' })}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>{t('labels.contact.email', { ns: 'patient' })}:</strong> {emailContact?.value || t('notSpecified', { ns: 'common' })}
                </Typography>
              </Grid>

              {/* Address */}
              <Grid columns={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle1">
                  <strong>{t('labels.address.homeAddress', { ns: 'patient' })}:</strong> {patientHomeAddress || t('notSpecified', { ns: 'common' })}
                </Typography>
              </Grid>
            </Grid>

            {/* Edit Profile Button */}
            <Box sx={{ mt: 2 }}>
              <Link href={`/patients/edit/${patient.id}`} passHref>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ borderRadius: '20px', px: 2 }}
                >
                  {t('actions.editProfile', { ns: 'common' })}
                </Button>
              </Link>
            </Box>
          </Grid>
        </Grid>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleEditPatient}
          sx={{ ml: 2 }}
        >
          {t('actions.editProfile', { ns: 'common' })}
        </Button>
      </Box>
    </Box>
  );
};

export default PatientHeader;
