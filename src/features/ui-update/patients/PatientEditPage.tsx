"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Grid, 
  Button, 
  Typography, 
  TextField, 
  MenuItem, 
  Paper, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Alert, 
  CircularProgress,
  Divider,
  useTheme
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// Import components
import MainLayout from '../../../components/ui/layout/MainLayout';
import DetailCard from '../../../components/ui/common/DetailCard';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { usePatient, useUpdatePatient } from '../../../hooks/usePatient';

interface PatientEditPageProps {
  id: string;
}

const PatientEditPage: React.FC<PatientEditPageProps> = ({ id }) => {
  const theme = useTheme();
  const router = useRouter();
  const { isOffline } = useNetworkStatus?.() || { isOffline: false };
  
  // Fetch patient data
  const {
    data: patient,
    isLoading,
    error,
  } = usePatient({ id });
  
  // Update patient hook
  const {
    updatePatient,
    isLoading: isUpdating,
    error: updateError,
    success
  } = useUpdatePatient?.() || { updatePatient: null, isLoading: false, error: null, success: false };
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    allergies: '',
    active: true
  });
  
  // Initialize form with patient data
  useEffect(() => {
    if (patient) {
      const name = patient.name?.[0] || {};
      const telecom = patient.telecom || [];
      const address = patient.address?.[0] || {};
      
      setFormData({
        firstName: name.given?.[0] || '',
        lastName: name.family || '',
        gender: patient.gender || '',
        birthDate: patient.birthDate || '',
        phone: telecom.find(t => t.system === 'phone')?.value || '',
        email: telecom.find(t => t.system === 'email')?.value || '',
        address: address.line?.[0] || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || '',
        allergies: patient.extension?.find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/patient-allergies')?.valueString || '',
        active: patient.active !== undefined ? patient.active : true
      });
    }
  }, [patient]);
  
  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!updatePatient) {
      console.error('Update patient function not available');
      return;
    }
    
    // Transform form data to FHIR patient format
    const updatedPatient = {
      ...patient,
      name: [{
        use: 'official',
        family: formData.lastName,
        given: [formData.firstName]
      }],
      gender: formData.gender,
      birthDate: formData.birthDate,
      telecom: [
        { system: 'phone', value: formData.phone, use: 'home' },
        { system: 'email', value: formData.email, use: 'home' }
      ],
      address: [{
        use: 'home',
        line: [formData.address],
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country
      }],
      active: formData.active,
      extension: [
        {
          url: 'http://hl7.org/fhir/StructureDefinition/patient-allergies',
          valueString: formData.allergies
        }
      ]
    };
    
    // Call update function
    try {
      await updatePatient(id, updatedPatient);
      
      // If success is true, navigate back to patient details
      if (success) {
        router.push(`/patients/show/${id}`);
      }
    } catch (err) {
      console.error('Error updating patient:', err);
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout title="Edit Patient" isOffline={isOffline}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  if (error || !patient) {
    return (
      <MainLayout title="Edit Patient" isOffline={isOffline}>
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
  
  return (
    <MainLayout title="Edit Patient" isOffline={isOffline}>
      {/* Back button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/patients/show/${id}`)}
        >
          Back to Patient Details
        </Button>
      </Box>
      
      {/* Error display */}
      {updateError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {updateError instanceof Error ? updateError.message : 'An error occurred while updating patient.'}
        </Alert>
      )}
      
      {/* Success message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Patient updated successfully.
        </Alert>
      )}
      
      {/* Form */}
      <Paper
        elevation={0}
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Edit Patient Information
        </Typography>
        
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Personal Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="firstName"
              label="First Name"
              variant="outlined"
              fullWidth
              required
              value={formData.firstName}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="lastName"
              label="Last Name"
              variant="outlined"
              fullWidth
              required
              value={formData.lastName}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="birthDate"
              label="Date of Birth"
              type="date"
              variant="outlined"
              fullWidth
              required
              value={formData.birthDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="gender"
              label="Gender"
              select
              variant="outlined"
              fullWidth
              required
              value={formData.gender}
              onChange={handleChange}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
              <MenuItem value="unknown">Unknown</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>
          
          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Contact Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="phone"
              label="Phone Number"
              variant="outlined"
              fullWidth
              value={formData.phone}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="email"
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              value={formData.email}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="address"
              label="Address"
              variant="outlined"
              fullWidth
              value={formData.address}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="city"
              label="City"
              variant="outlined"
              fullWidth
              value={formData.city}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="state"
              label="State/Province"
              variant="outlined"
              fullWidth
              value={formData.state}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="postalCode"
              label="Postal Code"
              variant="outlined"
              fullWidth
              value={formData.postalCode}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="country"
              label="Country"
              variant="outlined"
              fullWidth
              value={formData.country}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>
          
          {/* Medical Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Medical Information
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="allergies"
              label="Allergies (comma separated)"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={formData.allergies}
              onChange={handleChange}
              helperText="Enter allergies separated by commas, e.g., 'Penicillin, Peanuts, Shellfish'"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Patient Status</FormLabel>
              <RadioGroup
                row
                name="active"
                value={formData.active.toString()}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    active: e.target.value === 'true'
                  }));
                }}
              >
                <FormControlLabel value="true" control={<Radio />} label="Active" />
                <FormControlLabel value="false" control={<Radio />} label="Inactive" />
              </RadioGroup>
            </FormControl>
          </Grid>
          
          {/* Form actions */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.push(`/patients/show/${id}`)}
                sx={{ mr: 2 }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </MainLayout>
  );
};

export default PatientEditPage;
