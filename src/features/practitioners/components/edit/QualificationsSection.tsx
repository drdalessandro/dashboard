/**
 * QualificationsSection.tsx - Professional Details to match HTML template exactly
 * 
 * Form section for managing practitioner professional details matching HTML template design
 */
import React, { useState } from 'react';
import {
  Select,
  MenuItem,
  Box,
  Typography,
  SelectChangeEvent,
  Autocomplete
} from '@mui/material';
import { Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useOrganization } from '../../../../hooks/useOrganization';
import { AddButton, DeleteButton } from '../../../common/components/buttonStyles';

import { PractitionerFormValues, QualificationFormData } from '../../../../adapters/PractitionerAdapter';
import { usePractitionerQualificationOptions } from '../../../../hooks/useFhirValueSets';

import { StyledTextField, StyledFormControl, FieldLabel, RequiredAsterisk, SubSectionHeader } from '../../../common/components/forms';


interface QualificationsSectionProps {
  formValues: PractitionerFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<PractitionerFormValues>>;
  errors: Partial<Record<keyof PractitionerFormValues, string>>;
  isSubmitting?: boolean;
}

export const QualificationsSection = React.memo<QualificationsSectionProps>(({
  formValues,
  setFormValues,
  isSubmitting = false
}) => {

  // Local state for adding new qualification
  const [newQualification, setNewQualification] = useState<QualificationFormData>({
    identifier: '',
    code: '',
    period: {
      start: '',
      end: ''
    },
    issuer: {
      reference: '',
      display: ''
    }
  });

  // Hook for organization search
  const { searchOrganizations } = useOrganization();
  const [organizationOptions, setOrganizationOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [organizationLoading, setOrganizationLoading] = useState(false);

  // Use FHIR value sets hooks
  const { options: qualificationOptions } = usePractitionerQualificationOptions();

  // Handle field changes for active status
  const handleChange = React.useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>
    ) => {
      const { name, value } = event.target;

      if (!name) return;

      setFormValues(prev => ({
        ...prev,
        [name as string]: value
      }));
    },
    [setFormValues]
  );

  // Handle adding new qualification
  const handleAddQualification = React.useCallback(() => {
    if (newQualification.code.trim() && newQualification.issuer?.display?.trim()) {
      setFormValues(prev => ({
        ...prev,
        qualifications: [...(prev.qualifications || []), newQualification]
      }));
      setNewQualification({
        identifier: '',
        code: '',
        period: {
          start: '',
          end: ''
        },
        issuer: {
          reference: '',
          display: ''
        }
      });
    }
  }, [newQualification, setFormValues]);

  // Handle removing qualification
  const handleRemoveQualification = React.useCallback((index: number) => {
    setFormValues(prev => ({
      ...prev,
      qualifications: prev.qualifications?.filter((_, i) => i !== index)
    }));
  }, [setFormValues]);

  // Handle new qualification field changes
  const handleNewQualificationChange = React.useCallback(
    (field: keyof QualificationFormData, value: string | { start?: string; end?: string } | { reference: string; display: string }) => {
      setNewQualification(prev => ({
        ...prev,
        [field]: value
      }));
    },
    []
  );

  // Handle organization search
  const handleOrganizationSearch = React.useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setOrganizationOptions([]);
      return;
    }

    setOrganizationLoading(true);
    try {
      const organizations = await searchOrganizations(searchTerm);
      setOrganizationOptions(
        organizations.map(org => ({
          id: org.id || '',
          name: org.name || ''
        }))
      );
    } catch (error) {
      console.error('Error searching organizations:', error);
      setOrganizationOptions([]);
    } finally {
      setOrganizationLoading(false);
    }
  }, [searchOrganizations]);

  // Get current qualifications
  const qualifications = formValues.qualifications || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Add Qualification Section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <SubSectionHeader>Qualifications</SubSectionHeader>
          <AddButton
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={handleAddQualification}
            disabled={!newQualification.code.trim() || !newQualification.issuer?.display?.trim() || isSubmitting}
          >
            Add Qualification
          </AddButton>
        </Box>

        {/* New Qualification Form */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <fieldset style={{ 
                border: '1px solid rgba(0, 0, 0, 0.23)', 
                borderRadius: '4px', 
                padding: '0 12px', 
                margin: 0, 
                height: '46px', 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <legend style={{ 
                  padding: '0 8px', 
                  fontSize: '0.75rem', 
                  color: 'rgba(0, 0, 0, 0.6)', 
                  lineHeight: '12px' 
                }}>
                  Qualification Identifier
                </legend>
                <StyledTextField
                  value={newQualification.identifier}
                  onChange={(e) => handleNewQualificationChange('identifier', e.target.value)}
                  fullWidth
                  disabled={isSubmitting}
                  placeholder="Enter qualification ID/number"
                  InputLabelProps={{ shrink: false }}
                  InputProps={{
                    style: { border: 'none', height: '26px', minHeight: '26px' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '26px',
                      minHeight: '26px',
                      '& fieldset': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </fieldset>
            </Grid>

            <Grid item xs={12} md={6}>
              <fieldset style={{ 
                border: '1px solid rgba(0, 0, 0, 0.23)', 
                borderRadius: '4px', 
                padding: '0 12px', 
                margin: 0, 
                height: '46px', 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <legend style={{ 
                  padding: '0 8px', 
                  fontSize: '0.75rem', 
                  color: 'rgba(0, 0, 0, 0.6)', 
                  lineHeight: '12px' 
                }}>
                  Specialty/Qualification <RequiredAsterisk>*</RequiredAsterisk>
                </legend>
                <Autocomplete
                  options={Array.isArray(qualificationOptions) ? qualificationOptions : []}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                  value={Array.isArray(qualificationOptions) ? qualificationOptions.find(opt => opt.value === newQualification.code) || null : null}
                  onChange={(_, newValue) => {
                    const qualificationCode = typeof newValue === 'string' ? newValue : newValue?.label || '';
                    handleNewQualificationChange('code', qualificationCode);
                  }}
                  onInputChange={(_, newInputValue) => {
                    handleNewQualificationChange('code', newInputValue);
                  }}
                  freeSolo
                  fullWidth
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      name="qualification-code"
                      fullWidth
                      disabled={isSubmitting}
                      placeholder="Select or enter specialty/qualification"
                      InputLabelProps={{ shrink: false }}
                      InputProps={{
                        ...params.InputProps,
                        style: { border: 'none', height: '26px', minHeight: '26px' }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '26px',
                          minHeight: '26px',
                          '& fieldset': {
                            border: 'none'
                          }
                        }
                      }}
                    />
                  )}
                />
              </fieldset>
            </Grid>

            <Grid item xs={12} md={6}>
              <fieldset style={{ 
                border: '1px solid rgba(0, 0, 0, 0.23)', 
                borderRadius: '4px', 
                padding: '0 12px', 
                margin: 0, 
                height: '46px', 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <legend style={{ 
                  padding: '0 8px', 
                  fontSize: '0.75rem', 
                  color: 'rgba(0, 0, 0, 0.6)', 
                  lineHeight: '12px' 
                }}>
                  Start Date
                </legend>
                <StyledTextField
                  type="date"
                  value={newQualification.period?.start || ''}
                  onChange={(e) => handleNewQualificationChange('period', {
                    ...newQualification.period,
                    start: e.target.value
                  })}
                  fullWidth
                  disabled={isSubmitting}
                  InputLabelProps={{ shrink: false }}
                  InputProps={{
                    style: { border: 'none', height: '26px', minHeight: '26px' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '26px',
                      minHeight: '26px',
                      '& fieldset': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </fieldset>
            </Grid>

            <Grid item xs={12} md={6}>
              <fieldset style={{ 
                border: '1px solid rgba(0, 0, 0, 0.23)', 
                borderRadius: '4px', 
                padding: '0 12px', 
                margin: 0, 
                height: '46px', 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <legend style={{ 
                  padding: '0 8px', 
                  fontSize: '0.75rem', 
                  color: 'rgba(0, 0, 0, 0.6)', 
                  lineHeight: '12px' 
                }}>
                  End Date
                </legend>
                <StyledTextField
                  type="date"
                  value={newQualification.period?.end || ''}
                  onChange={(e) => handleNewQualificationChange('period', {
                    ...newQualification.period,
                    end: e.target.value
                  })}
                  fullWidth
                  disabled={isSubmitting}
                  InputLabelProps={{ shrink: false }}
                  InputProps={{
                    style: { border: 'none', height: '26px', minHeight: '26px' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '26px',
                      minHeight: '26px',
                      '& fieldset': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </fieldset>
            </Grid>

            <Grid item xs={12}>
              <fieldset style={{ 
                border: '1px solid rgba(0, 0, 0, 0.23)', 
                borderRadius: '4px', 
                padding: '0 12px', 
                margin: 0, 
                height: '46px', 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <legend style={{ 
                  padding: '0 8px', 
                  fontSize: '0.75rem', 
                  color: 'rgba(0, 0, 0, 0.6)', 
                  lineHeight: '12px' 
                }}>
                  Issuing Organization <RequiredAsterisk>*</RequiredAsterisk>
                </legend>
                <Autocomplete
                  options={organizationOptions}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                  value={organizationOptions.find(org => org.name === newQualification.issuer?.display) || null}
                  onChange={(_, newValue) => {
                    const issuerName = typeof newValue === 'string' ? newValue : newValue?.name || '';
                    const issuerId = typeof newValue === 'string' ? '' : newValue?.id || '';
                    handleNewQualificationChange('issuer', {
                      reference: issuerId ? `Organization/${issuerId}` : '',
                      display: issuerName
                    });
                  }}
                  onInputChange={(_, newInputValue) => {
                    handleNewQualificationChange('issuer', {
                      reference: '',
                      display: newInputValue
                    });
                    handleOrganizationSearch(newInputValue);
                  }}
                  loading={organizationLoading}
                  freeSolo
                  fullWidth
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      name="qualification-issuer"
                      fullWidth
                      disabled={isSubmitting}
                      placeholder="Search for issuing organization"
                      InputLabelProps={{ shrink: false }}
                      InputProps={{
                        ...params.InputProps,
                        style: { border: 'none', height: '26px', minHeight: '26px' }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '26px',
                          minHeight: '26px',
                          '& fieldset': {
                            border: 'none'
                          }
                        }
                      }}
                    />
                  )}
                />
              </fieldset>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Display existing qualifications */}
      {qualifications.map((qualification, index) => (
        <Box key={index} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#1e293b', fontWeight: 600, mb: 1 }}>
                {qualification.code}
              </Typography>

              {qualification.identifier && (
                <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                  ID: {qualification.identifier}
                </Typography>
              )}

              <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                Qualification: {qualification.code}
              </Typography>

              <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                Issued by: {qualification.issuer?.display}
              </Typography>

              {qualification.period && (qualification.period.start || qualification.period.end) && (
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Period: {qualification.period.start || 'N/A'} - {qualification.period.end || 'Present'}
                </Typography>
              )}
            </Box>
            <DeleteButton onClick={() => handleRemoveQualification(index)}>
              <DeleteIcon sx={{ fontSize: 18 }} />
            </DeleteButton>
          </Box>
        </Box>
      ))}

      {/* Other Professional Details */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
        <SubSectionHeader>Other Details</SubSectionHeader>

        <Grid container spacing={3}>
          {/* NPI Number */}
          <Grid item xs={12} md={6}>
            <fieldset style={{ 
              border: '1px solid rgba(0, 0, 0, 0.23)', 
              borderRadius: '4px', 
              padding: '0 12px', 
              margin: 0, 
              height: '46px', 
              display: 'flex', 
              alignItems: 'center' 
            }}>
              <legend style={{ 
                padding: '0 8px', 
                fontSize: '0.75rem', 
                color: 'rgba(0, 0, 0, 0.6)', 
                lineHeight: '12px' 
              }}>
                NPI Number <RequiredAsterisk>*</RequiredAsterisk>
              </legend>
              <StyledTextField
                name="npiNumber"
                value={formValues.identifier || ''}
                onChange={handleChange}
                fullWidth
                required
                disabled={isSubmitting}
                placeholder="Enter NPI number"
                InputLabelProps={{ shrink: false }}
                InputProps={{
                  style: { border: 'none', height: '26px', minHeight: '26px' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '26px',
                    minHeight: '26px',
                    '& fieldset': {
                      border: 'none'
                    }
                  }
                }}
              />
            </fieldset>
          </Grid>

          {/* Status */}
          <Grid item xs={12} md={6}>
            <fieldset style={{ 
              border: '1px solid rgba(0, 0, 0, 0.23)', 
              borderRadius: '4px', 
              padding: '0 12px', 
              margin: 0, 
              height: '46px', 
              display: 'flex', 
              alignItems: 'center' 
            }}>
              <legend style={{ 
                padding: '0 8px', 
                fontSize: '0.75rem', 
                color: 'rgba(0, 0, 0, 0.6)', 
                lineHeight: '12px' 
              }}>
                Status <RequiredAsterisk>*</RequiredAsterisk>
              </legend>
              <StyledFormControl 
                fullWidth 
                disabled={isSubmitting}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    border: 'none',
                    height: '26px',
                    minHeight: '26px',
                    '& fieldset': {
                      border: 'none'
                    }
                  }
                }}
              >
                <Select
                  name="active"
                  value={formValues.active ? 'active' : 'inactive'}
                  onChange={(e) => {
                    setFormValues(prev => ({
                      ...prev,
                      active: e.target.value === 'active'
                    }));
                  }}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select status
                  </MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                </Select>
              </StyledFormControl>
            </fieldset>
          </Grid>
        </Grid>
      </Box>

    </Box>
  );
});

QualificationsSection.displayName = 'QualificationsSection';

export default QualificationsSection;