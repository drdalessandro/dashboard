/**
 * PractitionerForm.tsx - Accordion-based design matching HTML template exactly
 * 
 * Form component for editing Practitioner resources with accordion-based layout
 * Updated to match the attached HTML template design exactly
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

import { PractitionerFormValues } from '../../../adapters/PractitionerAdapter';
import { ResourceFormRenderProps } from '../../../components/common/ResourceEditPage';
import {
  AddressSection,
  ContactInfoSection,
  PersonalInfoSection
} from '../../common/components/forms';
import {
  QualificationsSection
} from './edit';
import {
  StyledCard,
  StyledAccordion,
  SectionHeader,
  SectionDescription,
  CredentialsUploadArea,
  NotesTextarea
} from '../../common/components/buttonStyles';


interface PractitionerFormProps extends ResourceFormRenderProps<PractitionerFormValues> { }

/**
 * Main practitioner form component with accordion-based design matching HTML template exactly
 */
export const PractitionerForm = React.memo<PractitionerFormProps>(({
  formValues,
  setFormValues,
  errors,
  isSubmitting
}) => {

  // State for collapsible sections (General Info open by default)
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: true,
    contactInfo: false,
    professionalDetails: false,
    credentials: false,
    notes: false
  });

  // State for notes
  const [notes, setNotes] = useState<string>('');

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

          {/* Persona Information Section */}
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
                    Basic practitioner information and identification details.
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
                  isSubmitting={isSubmitting}
                  config={{
                    showPhoto: true,
                    showPrefix: true,
                    showSuffix: true,
                    showLanguages: true,
                    showIdentifier: true,
                    identifierLabel: 'Identifier (NINA)',
                    identifierRequired: true
                    // prefixOptions, suffixOptions, and availableLanguages now use FHIR value sets
                  }}
                  translationNamespace="practitioner"
                />
              </AccordionDetails>
            </StyledAccordion>
          </StyledCard>

          {/* Contact Details Section */}
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
                    Contact Details
                  </SectionHeader>
                  <SectionDescription>
                    Manage practitioner's contact methods and address information.
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
                    isSubmitting={isSubmitting}
                    config={{
                      showSeparateEmailPhone: true,
                      showUnifiedCards: false
                      // allowedSystems and allowedUses now use FHIR value sets
                    }}
                    translationNamespace="practitioner"
                  />
                  <AddressSection
                    formValues={formValues}
                    setFormValues={setFormValues}
                    addressField="address"
                    errors={errors}
                    isSubmitting={isSubmitting}
                    config={{
                      allowMultiple: true,
                      defaultCountry: 'ML',
                      showPeriod: true
                      // allowedUseTypes now use FHIR value sets (ADDRESS_USE_VALUE_SET)
                    }}
                    translationNamespace="practitioner"
                  />
                </Stack>
              </AccordionDetails>
            </StyledAccordion>
          </StyledCard>

          {/* Professional Details Section */}
          <StyledCard>
            <StyledAccordion
              expanded={expandedSections.professionalDetails}
              onChange={() => toggleSection('professionalDetails')}
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
                    Professional Details
                  </SectionHeader>
                  <SectionDescription>
                    Qualifications, certifications, and professional credentials.
                  </SectionDescription>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{
                padding: '8px 24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <QualificationsSection
                  formValues={formValues}
                  setFormValues={setFormValues}
                  errors={errors}
                  isSubmitting={isSubmitting}
                />
              </AccordionDetails>
            </StyledAccordion>
          </StyledCard>


          {/* Credentials Section */}
          <StyledCard>
            <StyledAccordion
              expanded={expandedSections.credentials}
              onChange={() => toggleSection('credentials')}
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
                    Credentials
                  </SectionHeader>
                  <SectionDescription>
                    Upload and manage professional credentials and certificates.
                  </SectionDescription>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{
                padding: '8px 24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <CredentialsUploadArea>
                  <CloudUploadIcon
                    sx={{
                      fontSize: 64,
                      color: '#94a3b8'
                    }}
                  />
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#1e293b',
                        fontWeight: 600,
                        fontSize: '1.125rem',
                        marginBottom: '4px'
                      }}
                    >
                      Upload Credentials
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#64748b',
                        fontSize: '0.875rem'
                      }}
                    >
                      Drag and drop files here, or click to browse
                    </Typography>
                  </Box>
                  <input
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    style={{ display: 'none' }}
                    id="credentials-upload"
                    type="file"
                    multiple
                  />
                  <label htmlFor="credentials-upload">
                    <Button
                      component="span"
                      variant="contained"
                      sx={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: '#1d4ed8',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      Upload Files
                    </Button>
                  </label>
                </CredentialsUploadArea>
              </AccordionDetails>
            </StyledAccordion>
          </StyledCard>

          {/* Notes Section */}
          <StyledCard>
            <StyledAccordion
              expanded={expandedSections.notes}
              onChange={() => toggleSection('notes')}
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
                    Notes
                  </SectionHeader>
                  <SectionDescription>
                    Additional notes and comments about the practitioner.
                  </SectionDescription>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{
                padding: '8px 24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <Box>
                  <fieldset style={{
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px',
                    padding: '12px',
                    margin: 0,
                    minHeight: '128px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <legend style={{
                      padding: '0 8px',
                      fontSize: '0.75rem',
                      color: 'rgba(0, 0, 0, 0.6)',
                      lineHeight: '12px'
                    }}>
                      Notes
                    </legend>
                    <NotesTextarea
                      placeholder="Add any notes about the practitioner"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{
                        border: 'none',
                        outline: 'none',
                        flex: 1,
                        minHeight: '100px',
                        padding: '0',
                        background: 'transparent'
                      }}
                    />
                  </fieldset>
                </Box>
              </AccordionDetails>
            </StyledAccordion>
          </StyledCard>

        </Stack>
      </Box>
    </Box>
  );
});

PractitionerForm.displayName = 'PractitionerForm';

export default PractitionerForm;