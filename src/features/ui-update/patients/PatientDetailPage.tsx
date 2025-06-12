"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Grid, 
  Button, 
  Typography, 
  Avatar, 
  Chip, 
  Paper, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  useTheme
} from '@mui/material';
import { 
  Edit as EditIcon, 
  ArrowBack as ArrowBackIcon,
  LocalHospital as LocalHospitalIcon,
  Medication as MedicationIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

// Import components
import MainLayout from '../../../components/ui/layout/MainLayout';
import DetailCard from '../../../components/ui/common/DetailCard';
import CustomTabs from '../../../components/ui/common/TabPanel';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { usePatient } from '../../../hooks/usePatient';
import { formatAge } from '../../../utils/dateUtils';

interface PatientDetailPageProps {
  id: string;
}

const PatientDetailPage: React.FC<PatientDetailPageProps> = ({ id }) => {
  const theme = useTheme();
  const router = useRouter();
  const { isOffline } = useNetworkStatus?.() || { isOffline: false };
  
  // Fetch patient data
  const {
    data: patient,
    isLoading,
    error,
  } = usePatient({ id });
  
  if (isLoading) {
    return (
      <MainLayout title="Patient Details" isOffline={isOffline}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>Loading patient data...</Typography>
        </Box>
      </MainLayout>
    );
  }
  
  if (error || !patient) {
    return (
      <MainLayout title="Patient Details" isOffline={isOffline}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : 'Could not load patient details.'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/patients')}
        >
          Back to Patient List
        </Button>
      </MainLayout>
    );
  }
  
  // Basic patient info for display
  const patientName = patient._computed?.formattedName || 'Unknown Patient';
  const initials = patientName.split(' ').map(n => n[0]).join('').toUpperCase();
  const gender = patient.gender || 'Unknown';
  const birthDate = patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Unknown';
  const age = patient.birthDate ? formatAge(patient.birthDate) : 'Unknown';
  const contact = patient.telecom?.find(t => t.system === 'phone')?.value || 'No phone provided';
  const email = patient.telecom?.find(t => t.system === 'email')?.value || 'No email provided';
  const address = patient.address?.[0] ? 
    [
      patient.address[0].line?.join(', '),
      patient.address[0].city,
      patient.address[0].state,
      patient.address[0].postalCode,
      patient.address[0].country
    ].filter(Boolean).join(', ') : 
    'No address provided';
  
  // Dummy data for medical records (replace with actual data when available)
  const medicalRecords = [
    { id: '1', date: '2023-06-15', diagnosis: 'Common Cold', doctor: 'Dr. Aminata Diallo', status: 'Completed' },
    { id: '2', date: '2023-03-22', diagnosis: 'Annual Checkup', doctor: 'Dr. Ibrahim Sow', status: 'Completed' },
    { id: '3', date: '2022-11-10', diagnosis: 'Influenza', doctor: 'Dr. Aminata Diallo', status: 'Completed' },
  ];
  
  // Dummy data for medications (replace with actual data when available)
  const medications = [
    { id: '1', name: 'Amoxicillin', dosage: '500mg', frequency: 'Every 8 hours', startDate: '2023-06-15', endDate: '2023-06-22', status: 'Completed' },
    { id: '2', name: 'Paracetamol', dosage: '500mg', frequency: 'As needed', startDate: '2023-06-15', endDate: '2023-06-20', status: 'Completed' },
    { id: '3', name: 'Vitamins B Complex', dosage: '1 tablet', frequency: 'Once daily', startDate: '2023-03-22', endDate: 'Ongoing', status: 'Active' },
  ];
  
  // Dummy data for allergies (replace with actual data when available)
  const allergies = patient.extension?.find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/patient-allergies')?.valueString?.split(',') || [];
  
  // Dummy data for upcoming appointments (replace with actual data when available)
  const appointments = [
    { id: '1', date: '2023-07-15', time: '10:00 AM', doctor: 'Dr. Aminata Diallo', reason: 'Follow-up', status: 'Scheduled' },
    { id: '2', date: '2023-09-01', time: '2:30 PM', doctor: 'Dr. Ibrahim Sow', reason: 'Consultation', status: 'Scheduled' },
  ];
  
  return (
    <MainLayout title="Patient Details" isOffline={isOffline}>
      {/* Back button and actions */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/patients')}
        >
          Back to Patient List
        </Button>
        
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => router.push(`/patients/edit/${id}`)}
        >
          Edit Patient
        </Button>
      </Box>
      
      {/* Patient Profile Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 3
        }}
      >
        <Avatar 
          sx={{ 
            width: 80, 
            height: 80, 
            bgcolor: theme.palette.primary.main,
            fontSize: 32,
            fontWeight: 'bold'
          }}
        >
          {initials}
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            {patientName}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Chip 
              label={`ID: ${patient.id}`} 
              size="small" 
              sx={{ bgcolor: theme.palette.grey[100], color: theme.palette.grey[800] }}
            />
            <Chip 
              label={`${gender}, ${age}`} 
              size="small"
              sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}
            />
            <Chip 
              label={patient.active ? 'Active' : 'Inactive'} 
              color={patient.active ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Box>
        
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>Phone:</strong> {contact}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Email:</strong> {email}
          </Typography>
        </Box>
      </Paper>
      
      {/* Patient Info Tabs */}
      <CustomTabs
        tabs={[
          {
            label: 'Overview',
            icon: <AssignmentIcon />,
            content: (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DetailCard title="Personal Information">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                        <Typography variant="body2">{birthDate}</Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Gender</Typography>
                        <Typography variant="body2">{gender}</Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Contact Phone</Typography>
                        <Typography variant="body2">{contact}</Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body2">{email}</Typography>
                      </Box>
                      <Divider />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Address</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>{address}</Typography>
                      </Box>
                    </Box>
                  </DetailCard>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <DetailCard 
                    title="Allergies & Conditions" 
                    icon={<LocalHospitalIcon color="error" />}
                    headerSx={{ color: theme.palette.error.main }}
                  >
                    {allergies.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {allergies.map((allergy, index) => (
                          <Chip 
                            key={index}
                            label={allergy.trim()}
                            size="small"
                            sx={{ 
                              bgcolor: theme.palette.error.light, 
                              color: theme.palette.error.contrastText,
                              fontWeight: 500
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No known allergies or conditions.
                      </Typography>
                    )}
                  </DetailCard>
                </Grid>
                
                <Grid item xs={12}>
                  <DetailCard title="Upcoming Appointments">
                    {appointments.length > 0 ? (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Date & Time</TableCell>
                              <TableCell>Provider</TableCell>
                              <TableCell>Reason</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {appointments.map((appointment) => (
                              <TableRow key={appointment.id}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {new Date(appointment.date).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {appointment.time}
                                  </Typography>
                                </TableCell>
                                <TableCell>{appointment.doctor}</TableCell>
                                <TableCell>{appointment.reason}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={appointment.status} 
                                    size="small"
                                    color={appointment.status === 'Scheduled' ? 'primary' : 'default'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No upcoming appointments scheduled.
                      </Typography>
                    )}
                  </DetailCard>
                </Grid>
              </Grid>
            )
          },
          {
            label: 'Medical History',
            icon: <BookIcon />,
            content: (
              <DetailCard title="Medical Records">
                {medicalRecords.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Diagnosis</TableCell>
                          <TableCell>Doctor</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {medicalRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{record.diagnosis}</TableCell>
                            <TableCell>{record.doctor}</TableCell>
                            <TableCell>
                              <Chip 
                                label={record.status} 
                                size="small"
                                color={record.status === 'Completed' ? 'success' : 'primary'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No medical records available.
                  </Typography>
                )}
              </DetailCard>
            )
          },
          {
            label: 'Medications',
            icon: <MedicationIcon />,
            content: (
              <DetailCard title="Prescribed Medications">
                {medications.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Medication</TableCell>
                          <TableCell>Dosage & Frequency</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {medications.map((medication) => (
                          <TableRow key={medication.id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {medication.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {medication.dosage}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {medication.frequency}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(medication.startDate).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                to {medication.endDate === 'Ongoing' ? 'Ongoing' : new Date(medication.endDate).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={medication.status} 
                                size="small"
                                color={medication.status === 'Active' ? 'primary' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No medications prescribed.
                  </Typography>
                )}
              </DetailCard>
            )
          },
        ]}
      />
    </MainLayout>
  );
};

export default PatientDetailPage;
