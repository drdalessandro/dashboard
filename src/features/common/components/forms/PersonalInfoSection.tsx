/**
 * PersonalInfoSection.tsx - Generic Personal Information Section
 * 
 * Generic form section for personal information fields that works with both
 * patient and practitioner resources. Configurable to show/hide specific fields.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  MenuItem,
  Button,
  Avatar,
  Box,
  SelectChangeEvent,
  Stack,
  Chip
} from '@mui/material';
import { Grid } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import LanguageIcon from '@mui/icons-material/Language';

import { UploadButton } from '../buttonStyles';
import { StyledTextField, StyledFormControl, FieldLabel, RequiredAsterisk } from './BaseFormComponents';
import { useGenderOptions, useNamePrefixOptions, useNameSuffixOptions, useLanguageOptions } from '../../../../hooks/useFhirValueSets';

// Generic interfaces that work with both Patient and Practitioner
interface CommunicationFormData {
  language: string;
  text: string;
  preferred?: boolean;
}

interface PersonalInfoSectionConfig {
  showPhoto?: boolean;
  showPrefix?: boolean;
  showSuffix?: boolean;
  showLanguages?: boolean;
  showIdentifier?: boolean;
  identifierLabel?: string;
  identifierRequired?: boolean;
  // Legacy support - these will be overridden by FHIR value sets
  prefixOptions?: string[];
  suffixOptions?: string[];
  availableLanguages?: Array<{ code: string; text: string; }>;
}

interface PersonalInfoSectionProps<T extends Record<string, any>> {
  formValues: T;
  setFormValues: React.Dispatch<React.SetStateAction<T>>;
  errors?: Partial<Record<keyof T, string>>;
  isSubmitting?: boolean;
  config?: PersonalInfoSectionConfig;
  translationNamespace?: string;
}

// Default configuration
const DEFAULT_CONFIG: PersonalInfoSectionConfig = {
  showPhoto: true,
  showPrefix: true,
  showSuffix: true,
  showLanguages: true,
  showIdentifier: true,
  identifierLabel: 'Identifier (NINA)',
  identifierRequired: true
};

export const PersonalInfoSection = <T extends Record<string, any>>(
  {
    formValues,
    setFormValues,
    errors,
    isSubmitting = false,
    config = {},
    translationNamespace = 'common'
  }: PersonalInfoSectionProps<T>
) => {
  const { t } = useTranslation([translationNamespace, 'common']);

  // Use FHIR value sets hooks
  const { options: genderOptions } = useGenderOptions();
  const { options: prefixOptions } = useNamePrefixOptions({ sort: true });
  const { options: suffixOptions } = useNameSuffixOptions({ sort: true });
  const { options: languageOptions } = useLanguageOptions({ 
    category: config.availableLanguages ? undefined : 'Official' // Use official languages by default unless custom ones provided
  });

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    showPhoto,
    showPrefix,
    showSuffix,
    showLanguages,
    showIdentifier,
    identifierLabel,
    identifierRequired
  } = finalConfig;

  // Convert FHIR options to legacy format for backward compatibility
  const availableLanguages: Array<{ code: string; text: string }> = config.availableLanguages || languageOptions.map((opt) => ({
    code: opt.value,
    text: opt.label
  }));

  // Handle field changes with optimization
  const handleChange = React.useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>
    ) => {
      const { name, value } = event.target;

      if (!name) return;

      // Don't update if the value hasn't changed
      if (formValues[name as keyof T] === value) return;

      setFormValues(prev => ({
        ...prev,
        [name as string]: value
      }));
    },
    [formValues, setFormValues]
  );

  // Local state for adding communication languages
  const [communication, setCommunication] = useState<CommunicationFormData>({
    language: '',
    text: ''
  });

  // Handle language selection
  const handleLanguageChange = React.useCallback((languageCode: string) => {
    const selectedLanguage = availableLanguages!.find(lang => lang.code === languageCode);
    if (selectedLanguage) {
      setCommunication({
        language: selectedLanguage.code,
        text: selectedLanguage.text
      });
    }
  }, [availableLanguages]);

  // Handle adding a communication language
  const handleAddCommunication = React.useCallback(() => {
    if (communication.language && communication.text) {
      // Check if language already exists
      const exists = formValues.communication?.some((c: CommunicationFormData) => c.language === communication.language);
      if (!exists) {
        setFormValues(prev => ({
          ...prev,
          communication: [...(prev.communication || []), communication]
        }));
        setCommunication({ language: '', text: '' });
      }
    }
  }, [communication, setFormValues, formValues.communication]);

  // Handle removing a communication language
  const handleRemoveCommunication = React.useCallback((index: number) => {
    setFormValues(prev => ({
      ...prev,
      communication: prev.communication?.filter((_: any, i: number) => i !== index)
    }));
  }, [setFormValues]);

  // Get current photo for display
  const currentPhoto = formValues.photo?.[0];
  const photoSrc = currentPhoto?.data
    ? `data:${currentPhoto.contentType};base64,${currentPhoto.data}`
    : currentPhoto?.url || '';

  return (
    <Grid container spacing={3} sx={{ '& .MuiGrid-item': {} }}>

      {/* Row 1: Photo (if enabled) */}
      {showPhoto && (
        <Grid item xs={12} md={12}>
          <Box>
            <FieldLabel>
              {t('labels.photo.title', { ns: translationNamespace, defaultValue: 'Photo' })}
            </FieldLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={photoSrc}
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '50%'
                }}
              >
                {!photoSrc && <PersonIcon sx={{ fontSize: 32, color: '#94a3b8' }} />}
              </Avatar>
              <UploadButton
                startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
                disabled={isSubmitting}
              >
                {t('labels.photo.uploadButton', { ns: translationNamespace, defaultValue: 'Upload Photo' })}
              </UploadButton>
            </Box>
          </Box>
        </Grid>
      )}

      {/* Row 2: Prefix and Suffix (if enabled) */}
      {(showPrefix || showSuffix) && (
        <>
          {showPrefix && (
            <Grid item xs={12} md={showSuffix ? 6 : 12}>
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
                  {t('labels.prefix', { ns: translationNamespace, defaultValue: 'Prefix' })}
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
                    name="prefix"
                    value={formValues.prefix || ''}
                    onChange={handleChange}
                    displayEmpty
                  >
                    <MenuItem value="">
                      {t('labels.selectPrefix', { ns: translationNamespace, defaultValue: 'Select prefix' })}
                    </MenuItem>
                    {prefixOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </StyledFormControl>
              </fieldset>
            </Grid>
          )}

          {showSuffix && (
            <Grid item xs={12} md={showPrefix ? 6 : 12}>
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
                  {t('labels.suffix', { ns: translationNamespace, defaultValue: 'Suffix' })}
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
                    name="suffix"
                    value={formValues.suffix || ''}
                    onChange={handleChange}
                    displayEmpty
                  >
                    <MenuItem value="">
                      {t('labels.selectSuffix', { ns: translationNamespace, defaultValue: 'Select suffix' })}
                    </MenuItem>
                    {suffixOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </StyledFormControl>
              </fieldset>
            </Grid>
          )}
        </>
      )}

      {/* Row 3: First Name and Last Name */}
      <Grid item xs={12} md={6}>
        <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center' }}>
          <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
            {t('labels.firstName', { ns: translationNamespace, defaultValue: 'First Name' })} <RequiredAsterisk>*</RequiredAsterisk>
          </legend>
          <StyledTextField
            name={formValues.givenName !== undefined ? "givenName" : "firstName"}
            value={formValues.givenName || formValues.firstName || ''}
            onChange={handleChange}
            fullWidth
            required
            disabled={isSubmitting}
            error={!!(errors?.givenName || errors?.firstName)}
            placeholder={t('labels.firstNamePlaceholder', { ns: translationNamespace, defaultValue: 'Enter first name' })}
            InputProps={{
              style: { border: 'none', height: '26px', minHeight: '26px' }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '26px',
                minHeight: '26px',
                '& fieldset': {
                  border: 'none'
                },
                '& input': {
                  padding: '2px 0',
                  height: '14px'
                }
              }
            }}
            InputLabelProps={{ shrink: false }}
          />
        </fieldset>
      </Grid>

      <Grid item xs={12} md={6}>
        <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center' }}>
          <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
            {t('labels.lastName', { ns: translationNamespace, defaultValue: 'Last Name' })} <RequiredAsterisk>*</RequiredAsterisk>
          </legend>
          <StyledTextField
            name={formValues.familyName !== undefined ? "familyName" : "lastName"}
            value={formValues.familyName || formValues.lastName || ''}
            onChange={handleChange}
            fullWidth
            required
            disabled={isSubmitting}
            error={!!(errors?.familyName || errors?.lastName)}
            placeholder={t('labels.lastNamePlaceholder', { ns: translationNamespace, defaultValue: 'Enter last name' })}
            InputProps={{
              style: { border: 'none', height: '26px', minHeight: '26px' }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '26px',
                minHeight: '26px',
                '& fieldset': {
                  border: 'none'
                },
                '& input': {
                  padding: '2px 0',
                  height: '14px'
                }
              }
            }}
            InputLabelProps={{ shrink: false }}
          />
        </fieldset>
      </Grid>

      {/* Row 4: Gender and Date of Birth */}
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
            {t('labels.gender', { ns: translationNamespace, defaultValue: 'Gender' })} <RequiredAsterisk>*</RequiredAsterisk>
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
              name="gender"
              value={formValues.gender || ''}
              onChange={handleChange}
              displayEmpty
            >
              <MenuItem value="" disabled>
                {t('labels.selectGender', { ns: translationNamespace, defaultValue: 'Select gender' })}
              </MenuItem>
              {genderOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(`labels.genders.${option.value}`, { ns: translationNamespace, defaultValue: option.label })}
                </MenuItem>
              ))}
            </Select>
          </StyledFormControl>
        </fieldset>
      </Grid>

      <Grid item xs={12} md={6}>
        <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center' }}>
          <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
            {t('labels.birthDate', { ns: translationNamespace, defaultValue: 'Date of Birth' })} <RequiredAsterisk>*</RequiredAsterisk>
          </legend>
          <StyledTextField
            name="birthDate"
            type="date"
            value={formValues.birthDate || ''}
            onChange={handleChange}
            fullWidth
            required
            disabled={isSubmitting}
            error={!!errors?.birthDate}
            InputProps={{
              style: { border: 'none', height: '26px', minHeight: '26px' }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '26px',
                minHeight: '26px',
                '& fieldset': {
                  border: 'none'
                },
                '& input': {
                  padding: '2px 0',
                  height: '14px'
                }
              }
            }}
            InputLabelProps={{ shrink: false }}
          />
        </fieldset>
      </Grid>

      {/* Row 5: Preferred Languages and Identifier (if enabled) */}
      {showLanguages && (
        <Grid item xs={12} md={showIdentifier ? 6 : 12}>
          <Stack spacing={2}>
            <Grid container alignItems="end">
              <Grid item xs={12} md={8}>
                <fieldset style={{
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  borderRadius: '4px',
                  // padding: '0 12px',
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
                    {t('labels.preferredLanguages', { ns: translationNamespace, defaultValue: 'Preferred Languages' })}
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
                      value={communication.language}
                      onChange={e => handleLanguageChange(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>{t('labels.chooseLanguage', { ns: translationNamespace, defaultValue: 'Choose a language' })}</em>
                      </MenuItem>
                      {availableLanguages.map((lang) => (
                        <MenuItem key={lang.code} value={lang.code}>
                          {lang.text}
                        </MenuItem>
                      ))}
                    </Select>
                  </StyledFormControl>
                </fieldset>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  onClick={handleAddCommunication}
                  fullWidth
                  sx={{
                    height: '40px',
                    color: '#2563eb',
                    borderColor: '#cbd5e1',
                    display: 'flex !important',
                    '&:hover': {
                      backgroundColor: '#f8fafc',
                      borderColor: '#2563eb'
                    }
                  }}
                  startIcon={<AddIcon />}
                  disabled={!communication.language || isSubmitting}
                >
                  {t('labels.addLanguage', { ns: translationNamespace, defaultValue: 'Add Language' })}
                </Button>
              </Grid>
            </Grid>

            {formValues.communication && formValues.communication.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {formValues.communication.map((comm: CommunicationFormData, index: number) => (
                  <Chip
                    key={index}
                    label={comm.text}
                    icon={<LanguageIcon fontSize="small" />}
                    onDelete={() => handleRemoveCommunication(index)}
                    disabled={isSubmitting}
                    sx={{
                      backgroundColor: '#f1f5f9',
                      '& .MuiChip-deleteIcon': {
                        color: '#64748b',
                        '&:hover': {
                          color: '#ef4444'
                        }
                      }
                    }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Grid>
      )}

      {showIdentifier && (
        <Grid item xs={12} md={showLanguages ? 6 : 12}>
          <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center' }}>
            <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
              {identifierLabel} {identifierRequired && <RequiredAsterisk>*</RequiredAsterisk>}
            </legend>
            <StyledTextField
              name="identifier"
              value={formValues.identifier || ''}
              onChange={handleChange}
              fullWidth
              required={identifierRequired}
              disabled={isSubmitting}
              error={!!errors?.identifier}
              placeholder={t('labels.identifierPlaceholder', { ns: translationNamespace, defaultValue: 'Enter identifier' })}
              InputProps={{
                style: { border: 'none', height: '26px', minHeight: '26px' }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '26px',
                  minHeight: '26px',
                  '& fieldset': {
                    border: 'none'
                  },
                  '& input': {
                    padding: '2px 0',
                    height: '14px'
                  }
                }
              }}
              InputLabelProps={{ shrink: false }}
            />
          </fieldset>
        </Grid>
      )}
    </Grid>
  );
};

PersonalInfoSection.displayName = 'PersonalInfoSection';

export default PersonalInfoSection;