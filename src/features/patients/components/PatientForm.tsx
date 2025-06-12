/**
 * @file PatientForm.tsx - Enhanced Patient Edit Form with Template-Matching Design
 * @description Form component for editing Patient resources with clean template-matching layout
 * @module features/patients/components/PatientForm
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  Grid,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

import { PatientFormValues } from '../../../adapters/PatientAdapter';
import { ResourceFormRenderProps } from '../../../components/common/ResourceEditPage';
import { usePatientStatusOptions } from '../../../hooks/useFhirValueSets';
import { GeneralPractitionerSection } from './edit/GeneralPractitionerSection';
import { RelatedPersonSection } from './edit/RelatedPersonSection';
import { MaritalStatusSection } from './edit/MaritalStatusSection';
import {
  ContactInfoSection,
  AddressSection,
  PersonalInfoSection
} from '../../common/components/forms';
import {
  StyledCard,
  StyledAccordion,
  SectionHeader,
  SectionDescription
} from '../../common/components/buttonStyles';


interface PatientFormProps extends ResourceFormRenderProps<PatientFormValues> { }

const PatientForm: React.FC<PatientFormProps> = React.memo(({
  formValues,
  setFormValues,
  errors
}) => {

  // Use FHIR value sets hooks
  const { options: patientStatusOptions } = usePatientStatusOptions();

  // State for collapsible sections (Personal Info open by default)
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: true,
    statusInfo: false,
    contactInfo: false,
    emergencyContact: false,
    primaryCareProvider: false
  });

  // Initialize form values
  const initialRenderRef = useRef(true);
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;

      // Initialize default values if not set
      setFormValues(prev => ({
        ...prev,
        gender: prev.gender || 'unknown',
        maritalStatus: prev.maritalStatus || '',
        telecom: prev.telecom || [],
        deceased: prev.deceased || false,
        deceasedDateTime: prev.deceasedDateTime || '',
        photo: prev.photo || [],
        communication: prev.communication || [],
        contact: prev.contact || [],
        generalPractitioner: prev.generalPractitioner || [],
        managingOrganization: prev.managingOrganization || '',
        link: prev.link || [],
        address: prev.address || []
      }));

    }
  }, [setFormValues]);

  // Handle basic field changes
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
      const { name, value } = event.target;
      setFormValues(prev => ({
        ...prev,
        [name]: value
      }));
    },
    [setFormValues]
  );

  // Handle checkbox changes
  const handleCheckboxChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({
      ...prev,
      [name]: event.target.checked
    }));
  };

  // Handle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  return (
    <Box sx={{
      backgroundColor: '#f1f5f9',
      py: 2,
      px: 1
    }}>
      <Box sx={{ maxWidth: '100%', margin: '0 auto' }}>

        {/* Form Sections */}
        <Stack spacing={3}>

          {/* Personal Information Section */}
          <StyledCard>
            <StyledAccordion
              expanded={expandedSections.personalInfo}
              onChange={() => toggleSection('personalInfo')}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  cursor: 'pointer',
                  padding: '0px 24px',
                  '&:hover': {
                    backgroundColor: '#f8fafc'
                  },
                  transition: 'background-color 150ms ease-in-out'
                }}
              >
                <Box>
                  <SectionHeader>
                    Personal Information
                  </SectionHeader>
                  <SectionDescription>
                    Edit the patient's basic details such as name, date of birth, and gender.
                  </SectionDescription>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{
                padding: '8px 24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <PersonalInfoSection
                  formValues={formValues}
                  setFormValues={setFormValues}
                  errors={errors}
                  config={{
                    showPhoto: true,
                    showPrefix: true,
                    showSuffix: true,
                    showLanguages: true,
                    showIdentifier: true,
                    identifierLabel: 'Identifier (NINA)',
                    identifierRequired: false,
                    prefixOptions: ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.'],
                    suffixOptions: ['Jr.', 'Sr.', 'II', 'III', 'MD', 'PhD'],
                    availableLanguages: [
                      { code: 'en', text: 'English' },
                      { code: 'fr', text: 'French' },
                      { code: 'es', text: 'Spanish' },
                      { code: 'ar', text: 'Arabic' },
                      { code: 'pt', text: 'Portuguese' }
                    ]
                  }}
                  translationNamespace="patient"
                />
              </AccordionDetails>
            </StyledAccordion>
          </StyledCard>

          {/* Status and Deceased Information Section */}
          <StyledCard>
            <StyledAccordion
              expanded={expandedSections.statusInfo || false}
              onChange={() => toggleSection('statusInfo' as keyof typeof expandedSections)}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  cursor: 'pointer',
                  padding: '0px 24px',
                  '&:hover': {
                    backgroundColor: '#f8fafc'
                  },
                  transition: 'background-color 150ms ease-in-out'
                }}
              >
                <Box>
                  <SectionHeader>
                    Status Information
                  </SectionHeader>
                  <SectionDescription>
                    Patient status, marital status, and deceased information.
                  </SectionDescription>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{
                padding: '8px 24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <Stack spacing={3}>
                  {/* Patient Status */}
                  <Box sx={{ maxWidth: '300px' }}>
                    <FormControl fullWidth>
                      <Select
                        value="active"
                        onChange={() => { }}
                        label="Status"
                        sx={{
                          height: 44,
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          '&:focus': {
                            borderColor: '#3b82f6'
                          }
                        }}
                      >
                        {Array.isArray(patientStatusOptions) ? patientStatusOptions.map((status) => (
                          <MenuItem key={status.value} value={status.value}>
                            {status.label}
                          </MenuItem>
                        )) : null}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Marital Status - Using MaritalStatusSection */}
                  <MaritalStatusSection
                    formValues={formValues}
                    setFormValues={setFormValues}
                    errors={errors}
                  />

                  {/* Deceased Section */}
                  <Stack direction="row" spacing={3} alignItems="flex-start">
                    {/* Deceased Checkbox */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formValues.deceased || false}
                            onChange={handleCheckboxChange('deceased')}
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '4px',
                              color: '#3b82f6'
                            }}
                          />
                        }
                        label={
                          <Typography sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#374151',
                            ml: 1
                          }}>
                            Deceased
                          </Typography>
                        }
                        sx={{ margin: 0 }}
                      />
                    </Box>

                    {/* Deceased Datetime (conditional) */}
                    {formValues.deceased && (
                      <Box sx={{ maxWidth: '300px' }}>
                        <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center' }}>
                          <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
                            Deceased Datetime
                          </legend>
                          <TextField
                            name="deceasedDateTime"
                            type="datetime-local"
                            fullWidth
                            value={formValues.deceasedDateTime || ''}
                            onChange={handleChange}
                            InputProps={{
                              style: { border: 'none', height: '26px', minHeight: '26px' }
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: '26px',
                                minHeight: '26px',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                '& fieldset': {
                                  border: 'none'
                                },
                                '& input': {
                                  padding: '2px 0',
                                  height: '14px'
                                }
                              }
                            }}
                          />
                        </fieldset>
                      </Box>
                    )}
                  </Stack>
                </Stack>
              </AccordionDetails>
            </StyledAccordion>
          </StyledCard>

          {/* Contact Information Section */}
          <StyledCard>
            <StyledAccordion
              expanded={expandedSections.contactInfo}
              onChange={() => toggleSection('contactInfo')}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  cursor: 'pointer',
                  padding: '0px 24px',
                  '&:hover': {
                    backgroundColor: '#f8fafc'
                  },
                  transition: 'background-color 150ms ease-in-out'
                }}
              >
                <Box>
                  <SectionHeader>
                    Contact Information
                  </SectionHeader>
                  <SectionDescription>
                    Manage patient's contact methods like phone, email, and address.
                  </SectionDescription>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{
                padding: '8px 24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <Stack spacing={4}>
                  <ContactInfoSection
                    formValues={formValues}
                    setFormValues={setFormValues}
                    telecomField="telecom"
                    errors={errors}
                    config={{
                      showSeparateEmailPhone: true,
                      showUnifiedCards: false,
                      allowedSystems: ['phone', 'email'],
                      allowedUses: ['home', 'work', 'mobile']
                    }}
                    translationNamespace="patient"
                  />
                  <AddressSection
                    formValues={formValues}
                    setFormValues={setFormValues}
                    addressField="address"
                    errors={errors}
                    config={{
                      allowMultiple: true,
                      defaultCountry: 'ML',
                      allowedUseTypes: ['home', 'work', 'temp'],
                      showPeriod: true
                    }}
                    translationNamespace="patient"
                  />
                </Stack>
              </AccordionDetails>
            </StyledAccordion>
          </StyledCard>

          {/* Emergency Contacts & Related Persons Section */}
          <StyledCard>
            <StyledAccordion
              expanded={expandedSections.emergencyContact}
              onChange={() => toggleSection('emergencyContact')}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  cursor: 'pointer',
                  padding: '0px 24px',
                  '&:hover': {
                    backgroundColor: '#f8fafc'
                  },
                  transition: 'background-color 150ms ease-in-out'
                }}
              >
                <Box>
                  <SectionHeader>
                    Emergency Contacts & Related Persons
                  </SectionHeader>
                  <SectionDescription>
                    Provide details for patient's emergency contacts.
                  </SectionDescription>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{
                padding: '8px 24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <RelatedPersonSection
                  formValues={formValues}
                  setFormValues={setFormValues}
                  errors={errors}
                />
              </AccordionDetails>
            </StyledAccordion>
          </StyledCard>

          {/* Primary Care Provider Section */}
          <StyledCard>
            <StyledAccordion
              expanded={expandedSections.primaryCareProvider}
              onChange={() => toggleSection('primaryCareProvider')}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  cursor: 'pointer',
                  padding: '0px 24px',
                  '&:hover': {
                    backgroundColor: '#f8fafc'
                  },
                  transition: 'background-color 150ms ease-in-out'
                }}
              >
                <Box>
                  <SectionHeader>
                    Primary Care Physician
                  </SectionHeader>
                  <SectionDescription>
                    Assign a primary care physician to the patient.
                  </SectionDescription>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{
                padding: '8px 24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <GeneralPractitionerSection
                  formValues={formValues}
                  setFormValues={setFormValues}
                  errors={errors}
                />
              </AccordionDetails>
            </StyledAccordion>
          </StyledCard>

        </Stack>
      </Box>
    </Box>
  );
});

export default PatientForm;
