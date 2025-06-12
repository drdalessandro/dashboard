/**
 * ContactInfoSection.tsx
 * 
 * Generic contact information management component for FHIR resources
 * Used by both patient and practitioner features
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Select,
  MenuItem,
  Paper,
  Typography,
  Divider,
  Autocomplete,
  TextField,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ContactsIcon from '@mui/icons-material/Contacts';
import { AddButton, DeleteButton } from '../buttonStyles';
import { StyledTextField, StyledFormControl, SubSectionHeader } from './BaseFormComponents';
import { PHONE_COUNTRY_CODES } from '../../../../utils/countries';
import { useContactPointSystemOptions, useContactPointUseOptions } from '../../../../hooks/useFhirValueSets';

// Generic telecom interface that works with both Patient and Practitioner
interface TelecomFormData {
  system: string;
  value: string;
  use: string;
  rank?: number;
  countryCode?: string; // Added for phone numbers
}

interface ContactInfoSectionConfig {
  showSeparateEmailPhone?: boolean; // practitioner style
  showUnifiedCards?: boolean; // patient style
  allowedSystems?: string[];
  allowedUses?: string[];
}

interface ContactInfoSectionProps<T extends Record<string, any>> {
  formValues: T;
  setFormValues: React.Dispatch<React.SetStateAction<T>>;
  telecomField: keyof T;
  errors?: Partial<Record<keyof T, string>>;
  isSubmitting?: boolean;
  config?: ContactInfoSectionConfig;
  translationNamespace?: string;
}

// Legacy default values - now provided by FHIR value sets
const LEGACY_DEFAULT_SYSTEMS = ['phone', 'email', 'fax', 'pager', 'url', 'sms', 'other'];
const LEGACY_DEFAULT_USES = ['home', 'work', 'temp', 'old', 'mobile'];

export const ContactInfoSection = <T extends Record<string, any>>({
  formValues,
  setFormValues,
  telecomField,
  errors,
  isSubmitting = false,
  config = {},
  translationNamespace = 'common'
}: ContactInfoSectionProps<T>) => {
  const { t } = useTranslation([translationNamespace, 'common']);

  // Use FHIR value sets hooks
  const { options: systemOptions } = useContactPointSystemOptions();
  const { options: useOptions } = useContactPointUseOptions();

  // Ensure options are properly typed as arrays
  const systemOptionsArray = Array.isArray(systemOptions) ? systemOptions : [];
  const useOptionsArray = Array.isArray(useOptions) ? useOptions : [];

  // Convert FHIR options to legacy format for backward compatibility
  const allowedSystems = config.allowedSystems || systemOptionsArray.map(opt => opt.value);
  const allowedUses = config.allowedUses || useOptionsArray.map(opt => opt.value);

  const {
    showSeparateEmailPhone = false,
    showUnifiedCards = false
  } = config;

  // Get current telecom array
  const telecoms = (formValues[telecomField] as TelecomFormData[]) || [];

  // Helper functions for button state
  const hasEmptyPhones = () => {
    const phones = telecoms.filter(t => ['phone', 'sms'].includes(t.system));
    return phones.some(phone => !phone.value.trim());
  };

  const hasEmptyEmails = () => {
    const emails = telecoms.filter(t => t.system === 'email');
    return emails.some(email => !email.value.trim());
  };

  // Get flag emoji for country code
  const getFlagEmoji = (countryCode: string) => {
    return countryCode
      .toUpperCase()
      .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
  };

  // Add new telecom entry
  const handleAddTelecom = React.useCallback(() => {
    const newTelecom: TelecomFormData = {
      system: 'phone',
      value: '',
      use: 'home',
      countryCode: 'ML' // Default to Mali
    };

    setFormValues(prev => ({
      ...prev,
      [telecomField]: [...telecoms, newTelecom]
    }));
  }, [setFormValues, telecomField, telecoms]);

  // Remove telecom entry
  const handleRemoveTelecom = React.useCallback((index: number) => {
    setFormValues(prev => ({
      ...prev,
      [telecomField]: telecoms.filter((_, i) => i !== index)
    }));
  }, [setFormValues, telecomField, telecoms]);

  // Update telecom entry field
  const handleTelecomChange = React.useCallback((
    index: number,
    field: keyof TelecomFormData,
    value: string | number
  ) => {
    setFormValues(prev => ({
      ...prev,
      [telecomField]: telecoms.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }, [setFormValues, telecomField, telecoms]);

  // Get icon for telecom system
  const getTelecomIcon = (system: string) => {
    switch (system) {
      case 'phone':
      case 'sms':
        return <PhoneIcon fontSize="small" />;
      case 'email':
        return <EmailIcon fontSize="small" />;
      default:
        return <ContactsIcon fontSize="small" />;
    }
  };

  // Render unified cards style (patient style)
  const renderUnifiedCards = () => (
    <Box>
      {/* Add New Telecom Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <SubSectionHeader>
          {t('labels.telecom.title', { ns: translationNamespace, defaultValue: 'Contact Information' })}
        </SubSectionHeader>
        <AddButton
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={handleAddTelecom}
          disabled={isSubmitting}
        >
          {t('labels.telecom.add', { ns: translationNamespace, defaultValue: 'Add Contact' })}
        </AddButton>
      </Box>

      <Stack spacing={3}>
        {/* Telecom Entries */}
        {telecoms.map((telecom, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{ p: 2, bgcolor: 'grey.50' }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTelecomIcon(telecom.system)}
                {t('labels.telecom.entryTitle', { ns: translationNamespace, defaultValue: 'Contact' })} {index + 1}
              </Typography>
              <DeleteButton
                size="small"
                onClick={() => handleRemoveTelecom(index)}
                disabled={isSubmitting}
              >
                <DeleteIcon fontSize="small" />
              </DeleteButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              {/* System */}
              <fieldset style={{
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px',
                padding: '0 12px',
                margin: 0,
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                minWidth: '120px'
              }}>
                <legend style={{
                  padding: '0 8px',
                  fontSize: '0.75rem',
                  color: 'rgba(0, 0, 0, 0.6)',
                  lineHeight: '12px'
                }}>
                  {t('labels.telecom.system', { ns: translationNamespace, defaultValue: 'Type' })}
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
                    value={telecom.system}
                    onChange={(e) => handleTelecomChange(index, 'system', e.target.value)}
                  >
                    {systemOptionsArray.map((system) => (
                      <MenuItem key={system.value} value={system.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTelecomIcon(system.value)}
                          {t(`labels.telecom.systems.${system.value}`, {
                            ns: translationNamespace,
                            defaultValue: system.label
                          })}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </StyledFormControl>
              </fieldset>

              {/* Value */}
              <fieldset style={{
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px',
                padding: '0 12px',
                margin: 0,
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                flex: 1
              }}>
                <legend style={{
                  padding: '0 8px',
                  fontSize: '0.75rem',
                  color: 'rgba(0, 0, 0, 0.6)',
                  lineHeight: '12px'
                }}>
                  {t('labels.telecom.value', { ns: translationNamespace, defaultValue: 'Value' })}
                </legend>
                <StyledTextField
                  fullWidth
                  value={telecom.value}
                  onChange={(e) => handleTelecomChange(index, 'value', e.target.value)}
                  disabled={isSubmitting}
                  placeholder={
                    telecom.system === 'email'
                      ? t('labels.telecom.emailPlaceholder', { ns: translationNamespace, defaultValue: 'Enter email address' })
                      : t('labels.telecom.phonePlaceholder', { ns: translationNamespace, defaultValue: 'Enter phone number' })
                  }
                  type={telecom.system === 'email' ? 'email' : 'tel'}
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

              {/* Use */}
              <fieldset style={{
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px',
                padding: '0 12px',
                margin: 0,
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                minWidth: '100px'
              }}>
                <legend style={{
                  padding: '0 8px',
                  fontSize: '0.75rem',
                  color: 'rgba(0, 0, 0, 0.6)',
                  lineHeight: '12px'
                }}>
                  {t('labels.telecom.use', { ns: translationNamespace, defaultValue: 'Use' })}
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
                    value={telecom.use}
                    onChange={(e) => handleTelecomChange(index, 'use', e.target.value)}
                  >
                    {useOptionsArray.map((use) => (
                      <MenuItem key={use.value} value={use.value}>
                        {t(`labels.telecom.uses.${use.value}`, {
                          ns: translationNamespace,
                          defaultValue: use.label
                        })}
                      </MenuItem>
                    ))}
                  </Select>
                </StyledFormControl>
              </fieldset>
            </Box>
          </Paper>
        ))}
      </Stack>
    </Box>
  );

  // Render separate sections style (practitioner style)
  const renderSeparateSections = () => {
    const phones = telecoms.filter(t => ['phone', 'sms'].includes(t.system));
    const emails = telecoms.filter(t => t.system === 'email');

    return (
      <Box>
        {/* Phone Numbers Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon />
              {t('labels.telecom.phones', { ns: translationNamespace, defaultValue: 'Phone Numbers' })}
            </Typography>
            <AddButton
              startIcon={<AddIcon />}
              onClick={() => {
                const newTelecom: TelecomFormData = { system: 'phone', value: '', use: 'home', countryCode: 'ML' };
                setFormValues(prev => ({
                  ...prev,
                  [telecomField]: [...telecoms, newTelecom]
                }));
              }}
              disabled={hasEmptyPhones() || isSubmitting}
            >
              {t('labels.telecom.addPhone', { ns: translationNamespace, defaultValue: 'Add Phone' })}
            </AddButton>
          </Box>

          {phones.map((phone) => {
            const originalIndex = telecoms.indexOf(phone);
            const currentCountry = PHONE_COUNTRY_CODES.find(c => c.code === (phone.countryCode || 'ML'));

            return (
              <div key={originalIndex} style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                {/* Country Code Dropdown */}
                <div style={{ minWidth: '200px' }}>
                  <Autocomplete
                    value={currentCountry || PHONE_COUNTRY_CODES[0]}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        handleTelecomChange(originalIndex, 'countryCode', newValue.code);
                      }
                    }}
                    options={PHONE_COUNTRY_CODES}
                    getOptionLabel={(option) => `${getFlagEmoji(option.code)} ${option.callingCode} ${option.name}`}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key} {...otherProps}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{getFlagEmoji(option.code)}</span>
                            <span>{option.callingCode}</span>
                            <span>{option.name}</span>
                          </Box>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('labels.telecom.countryCode', { ns: translationNamespace, defaultValue: 'Country' })}
                        disabled={isSubmitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '46px'
                          }
                        }}
                      />
                    )}
                  />
                </div>

                {/* Phone Number Input */}
                <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center', flex: 1 }}>
                  <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
                    {t('labels.telecom.phoneNumber', { ns: translationNamespace, defaultValue: 'Phone Number' })}
                  </legend>
                  <StyledTextField
                    value={phone.value}
                    onChange={(e) => handleTelecomChange(originalIndex, 'value', e.target.value)}
                    disabled={isSubmitting}
                    type="tel"
                    fullWidth
                    placeholder={t('labels.telecom.phonePlaceholder', { ns: translationNamespace, defaultValue: 'Enter phone number' })}
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
                  />
                </fieldset>

                {/* Use Dropdown */}
                <fieldset style={{
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  borderRadius: '4px',
                  padding: '0 12px',
                  margin: 0,
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: '120px'
                }}>
                  <legend style={{
                    padding: '0 8px',
                    fontSize: '0.75rem',
                    color: 'rgba(0, 0, 0, 0.6)',
                    lineHeight: '12px'
                  }}>
                    {t('labels.telecom.use', { ns: translationNamespace, defaultValue: 'Use' })}
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
                      value={phone.use}
                      onChange={(e) => handleTelecomChange(originalIndex, 'use', e.target.value)}
                    >
                      {useOptionsArray.map((use) => (
                        <MenuItem key={use.value} value={use.value}>
                          {t(`labels.telecom.uses.${use.value}`, {
                            ns: translationNamespace,
                            defaultValue: use.label
                          })}
                        </MenuItem>
                      ))}
                    </Select>
                  </StyledFormControl>
                </fieldset>

                {/* Delete Button */}
                <div style={{ height: '46px', display: 'flex', alignItems: 'center' }}>
                  <DeleteButton
                    onClick={() => handleRemoveTelecom(originalIndex)}
                    disabled={isSubmitting}
                    sx={{ height: '40px', width: '40px' }}
                  >
                    <DeleteIcon />
                  </DeleteButton>
                </div>
              </div>
            );
          })}
        </Box>

        {/* Email Addresses Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon />
              {t('labels.telecom.emails', { ns: translationNamespace, defaultValue: 'Email Addresses' })}
            </Typography>
            <AddButton
              startIcon={<AddIcon />}
              onClick={() => {
                const newTelecom: TelecomFormData = { system: 'email', value: '', use: 'home' };
                setFormValues(prev => ({
                  ...prev,
                  [telecomField]: [...telecoms, newTelecom]
                }));
              }}
              disabled={hasEmptyEmails() || isSubmitting}
            >
              {t('labels.telecom.addEmail', { ns: translationNamespace, defaultValue: 'Add Email' })}
            </AddButton>
          </Box>

          {emails.map((email) => {
            const originalIndex = telecoms.indexOf(email);
            return (
              <div key={originalIndex} style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <fieldset style={{
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  borderRadius: '4px',
                  padding: '0 12px',
                  margin: 0,
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1
                }}>
                  <legend style={{
                    padding: '0 8px',
                    fontSize: '0.75rem',
                    color: 'rgba(0, 0, 0, 0.6)',
                    lineHeight: '12px'
                  }}>
                    {t('labels.telecom.emailAddress', { ns: translationNamespace, defaultValue: 'Email Address' })}
                  </legend>
                  <StyledTextField
                    value={email.value}
                    onChange={(e) => handleTelecomChange(originalIndex, 'value', e.target.value)}
                    disabled={isSubmitting}
                    type="email"
                    fullWidth
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
                  />
                </fieldset>
                <fieldset style={{
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  borderRadius: '4px',
                  padding: '0 12px',
                  margin: 0,
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: '120px'
                }}>
                  <legend style={{
                    padding: '0 8px',
                    fontSize: '0.75rem',
                    color: 'rgba(0, 0, 0, 0.6)',
                    lineHeight: '12px'
                  }}>
                    {t('labels.telecom.use', { ns: translationNamespace, defaultValue: 'Use' })}
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
                      value={email.use}
                      onChange={(e) => handleTelecomChange(originalIndex, 'use', e.target.value)}
                    >
                      {allowedUses.map((use) => (
                        <MenuItem key={use} value={use}>
                          {t(`labels.telecom.uses.${use}`, {
                            ns: translationNamespace,
                            defaultValue: use.charAt(0).toUpperCase() + use.slice(1)
                          })}
                        </MenuItem>
                      ))}
                    </Select>
                  </StyledFormControl>
                </fieldset>
                <div style={{ height: '46px', display: 'flex', alignItems: 'center' }}>
                  <DeleteButton
                    onClick={() => handleRemoveTelecom(originalIndex)}
                    disabled={isSubmitting}
                    sx={{ height: '40px', width: '40px' }}
                  >
                    <DeleteIcon />
                  </DeleteButton>
                </div>
              </div>
            );
          })}
        </Box>
      </Box>
    );
  };

  return showSeparateEmailPhone ? renderSeparateSections() : renderUnifiedCards();
};