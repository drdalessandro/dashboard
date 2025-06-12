/**
 * AddressSection.tsx
 * 
 * Generic address management component for FHIR resources
 * Used by both patient and practitioner features
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import { Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { AddButton, DeleteButton } from '../buttonStyles';
import { StyledTextField, StyledFormControl, FieldLabel, SubSectionHeader } from './BaseFormComponents';
import { COUNTRIES } from '../../../../utils/countries';
import { useAddressUseOptions } from '../../../../hooks/useFhirValueSets';

// Generic address interface that works with both Patient and Practitioner
interface AddressFormData {
  use?: string;
  type?: string;
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: {
    start?: string;
    end?: string;
  };
}

interface AddressSectionConfig {
  allowMultiple?: boolean;
  defaultCountry?: string;
  allowedUseTypes?: string[];
  showPeriod?: boolean;
}

interface AddressSectionProps<T extends Record<string, any>> {
  formValues: T;
  setFormValues: React.Dispatch<React.SetStateAction<T>>;
  addressField: keyof T;
  errors?: Partial<Record<keyof T, string>>;
  isSubmitting?: boolean;
  config?: AddressSectionConfig;
  translationNamespace?: string;
}

// Default use types for addresses
const DEFAULT_USE_TYPES = ['home', 'work', 'temp', 'old'];

export const AddressSection = <T extends Record<string, any>>({
  formValues,
  setFormValues,
  addressField,
  errors,
  isSubmitting = false,
  config = {},
  translationNamespace = 'common'
}: AddressSectionProps<T>) => {
  const { t } = useTranslation([translationNamespace, 'common']);

  // Use FHIR value sets hooks
  const { options: addressUseOptions } = useAddressUseOptions();

  // Ensure options are properly typed as arrays
  const addressUseOptionsArray = Array.isArray(addressUseOptions) ? addressUseOptions : [];

  const {
    allowMultiple = true,
    defaultCountry = 'FR',
    allowedUseTypes = addressUseOptionsArray.map(opt => opt.value),
    showPeriod = false
  } = config;

  // Local state for adding new address
  const [newAddress, setNewAddress] = useState<AddressFormData>({
    use: 'home',
    line: [''],
    city: '',
    state: '',
    postalCode: '',
    country: defaultCountry,
    ...(showPeriod && { period: { start: '', end: '' } })
  });

  // Get current addresses array
  const addresses = (formValues[addressField] as AddressFormData[]) || [];

  // Handle adding new address
  const handleAddAddress = React.useCallback(() => {
    if (newAddress.line?.[0] && newAddress.city && newAddress.country) {
      const addressToAdd = {
        ...newAddress,
        line: newAddress.line?.filter(line => line.trim() !== '') || []
      };

      setFormValues(prev => ({
        ...prev,
        [addressField]: allowMultiple ? [...addresses, addressToAdd] : [addressToAdd]
      }));

      // Reset form
      setNewAddress({
        use: 'home',
        line: [''],
        city: '',
        state: '',
        postalCode: '',
        country: defaultCountry,
        ...(showPeriod && { period: { start: '', end: '' } })
      });
    }
  }, [newAddress, setFormValues, addressField, allowMultiple, addresses, defaultCountry, showPeriod]);

  // Handle removing address
  const handleRemoveAddress = React.useCallback((index: number) => {
    setFormValues(prev => ({
      ...prev,
      [addressField]: addresses.filter((_, i) => i !== index)
    }));
  }, [setFormValues, addressField, addresses]);

  // Handle new address field changes
  const handleNewAddressChange = React.useCallback((field: keyof AddressFormData, value: any) => {
    setNewAddress(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle address line changes
  const handleAddressLineChange = React.useCallback((index: number, value: string) => {
    setNewAddress(prev => ({
      ...prev,
      line: prev.line?.map((line, i) => i === index ? value : line) || []
    }));
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <SubSectionHeader sx={{ mb: 3 }}>
            {t('labels.address.title', { ns: translationNamespace, defaultValue: 'Addresses' })}
          </SubSectionHeader>
          <AddButton
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={handleAddAddress}
            disabled={
              !newAddress.line?.[0].trim() ||
              !newAddress.city ||
              !newAddress.country ||
              isSubmitting
            }
          >
            Add Address
          </AddButton>
        </Box>
      </Grid>

      {/* Add New Address Form */}
      {
        (allowMultiple || addresses.length === 0) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
            <Grid container spacing={2}>
              {/* Use Type */}
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
                    {t('labels.address.use', { ns: translationNamespace, defaultValue: 'Use' })}
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
                      value={newAddress.use || ''}
                      onChange={(e) => handleNewAddressChange('use', e.target.value)}
                      displayEmpty
                    >
                      {addressUseOptionsArray.map((useType) => (
                        <MenuItem key={useType.value} value={useType.value}>
                          {t(`labels.address.uses.${useType.value}`, {
                            ns: translationNamespace,
                            defaultValue: useType.label
                          })}
                        </MenuItem>
                      ))}
                    </Select>
                  </StyledFormControl>
                </fieldset>
              </Grid>

              {/* Street Address */}
              <Grid item xs={12}>
                <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center' }}>
                  <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
                    {t('labels.address.street', { ns: translationNamespace, defaultValue: 'Street Address' })}
                  </legend>
                  <StyledTextField
                    value={newAddress.line?.[0] || ''}
                    onChange={(e) => handleAddressLineChange(0, e.target.value)}
                    fullWidth
                    disabled={isSubmitting}
                    placeholder={t('labels.address.streetPlaceholder', { ns: translationNamespace, defaultValue: 'Enter street address' })}
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

              {/* City, State, Postal Code */}
              <Grid item xs={12} md={3}>
                <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center' }}>
                  <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
                    {t('labels.address.city', { ns: translationNamespace, defaultValue: 'City' })}
                  </legend>
                  <StyledTextField
                    value={newAddress.city || ''}
                    onChange={(e) => handleNewAddressChange('city', e.target.value)}
                    fullWidth
                    disabled={isSubmitting}
                    placeholder={t('labels.address.cityPlaceholder', { ns: translationNamespace, defaultValue: 'Enter city' })}
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

              <Grid item xs={12} md={3}>
                <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center' }}>
                  <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
                    {t('labels.address.state', { ns: translationNamespace, defaultValue: 'State/Province' })}
                  </legend>
                  <StyledTextField
                    value={newAddress.state || ''}
                    onChange={(e) => handleNewAddressChange('state', e.target.value)}
                    fullWidth
                    disabled={isSubmitting}
                    placeholder={t('labels.address.statePlaceholder', { ns: translationNamespace, defaultValue: 'Enter state' })}
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

              <Grid item xs={12} md={3}>
                <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center' }}>
                  <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
                    {t('labels.address.postalCode', { ns: translationNamespace, defaultValue: 'Postal Code' })}
                  </legend>
                  <StyledTextField
                    value={newAddress.postalCode || ''}
                    onChange={(e) => handleNewAddressChange('postalCode', e.target.value)}
                    fullWidth
                    disabled={isSubmitting}
                    placeholder={t('labels.address.postalCodePlaceholder', { ns: translationNamespace, defaultValue: 'Enter postal code' })}
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

              {/* Country */}
              <Grid item xs={12} md={3}>
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
                    {t('labels.address.country', { ns: translationNamespace, defaultValue: 'Country' })}
                  </legend>
                  <Autocomplete
                    options={COUNTRIES}
                    getOptionLabel={(option) => option.name}
                    value={COUNTRIES.find(c => c.code === newAddress.country) || null}
                    onChange={(_, newValue) => handleNewAddressChange('country', newValue?.code || '')}
                    disabled={isSubmitting}
                    fullWidth
                    renderInput={(params) => (
                      <StyledTextField
                        {...params}
                        placeholder={t('labels.address.selectCountry', { ns: translationNamespace, defaultValue: 'Select country' })}
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

              {/* Period (if enabled) */}
              {showPeriod && (
                <>
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
                        {t('labels.address.startDate', { ns: translationNamespace, defaultValue: 'Start Date' })}
                      </legend>
                      <StyledTextField
                        type="date"
                        value={newAddress.period?.start || ''}
                        onChange={(e) => handleNewAddressChange('period', {
                          ...newAddress.period,
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
                        {t('labels.address.endDate', { ns: translationNamespace, defaultValue: 'End Date' })}
                      </legend>
                      <StyledTextField
                        type="date"
                        value={newAddress.period?.end || ''}
                        onChange={(e) => handleNewAddressChange('period', {
                          ...newAddress.period,
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
                </>
              )}
            </Grid>
          </Box>
        )
      }


      {/* Existing Addresses */}
      {
        addresses.map((address, index) => (
          <Box key={index} sx={{ p: 3, mt: 3, border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
              <SubSectionHeader variant="h6" sx={{ color: '#1e293b', fontWeight: 600, textTransform: 'capitalize' }}>
                {address.use} {t('labels.address.entry', { ns: translationNamespace, defaultValue: 'Address' })} {index + 1}
              </SubSectionHeader>
              <DeleteButton
                onClick={() => handleRemoveAddress(index)}
                disabled={isSubmitting}
              >
                <DeleteIcon fontSize="small" />
              </DeleteButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box>
                  <FieldLabel>
                    {address.line?.join(', ')}
                  </FieldLabel>
                  <FieldLabel>
                    {address.city}, {address.state} {address.postalCode}
                  </FieldLabel>
                  <FieldLabel>
                    {address.country}
                  </FieldLabel>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ))
      }
    </Box >
  );
};