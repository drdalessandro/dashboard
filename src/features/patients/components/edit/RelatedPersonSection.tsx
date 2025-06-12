/**
 * RelatedPersonSection.tsx
 * 
 * Form section for managing patient emergency contacts and related persons
 * Refactored to follow ContactInfoSection pattern: form at top, saved entries below
 */
import React, { useState } from 'react';
import { Organization } from '@medplum/fhirtypes';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Autocomplete,
  CircularProgress,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContactsIcon from '@mui/icons-material/Contacts';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import ClearIcon from '@mui/icons-material/Clear';

import {
  PatientFormValues,
  RelatedPersonData,
  TelecomFormData,
  TELECOM_SYSTEMS,
  TELECOM_USES,
  patientAdapter
} from '../../../../adapters/PatientAdapter';
import { useGenderOptions } from '../../../../hooks/useFhirValueSets';
import { useResource } from '../../../../hooks/useResource';
import { COUNTRIES } from '../../../../utils/countries';

interface RelatedPersonSectionProps {
  formValues: PatientFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<PatientFormValues>>;
  errors: Partial<Record<keyof PatientFormValues, string>>;
  isSubmitting?: boolean;
}

interface OrganizationOption {
  id: string;
  label: string;
  name: string;
  type?: string;
}

export const RelatedPersonSection = React.memo<RelatedPersonSectionProps>(({
  formValues,
  setFormValues,
  isSubmitting = false
}) => {
  const { t } = useTranslation(['patient', 'common']);
  const [editingContact, setEditingContact] = React.useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [newContact, setNewContact] = React.useState<RelatedPersonData>({
    relationship: 'C',
    name: { given: '', family: '' },
    telecom: [],
    address: { line: [], city: '', state: '', postalCode: '', country: 'ML' },
    gender: undefined,
    organization: '',
    period: undefined
  });

  // Organization search state
  const [organizationOptions, setOrganizationOptions] = useState<OrganizationOption[]>([]);
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [organizationSearchText, setOrganizationSearchText] = useState('');
  const [editOrganizationSearchText, setEditOrganizationSearchText] = useState('');

  const { searchResources } = useResource({ resourceType: 'Organization' });

  // Get contact relationship options
  const relationshipOptions = React.useMemo(() =>
    patientAdapter.getContactRelationshipOptions(), []
  );

  // Use FHIR value sets hooks
  const { options: genderOptions } = useGenderOptions();

  // Search for organizations
  const searchOrganizations = React.useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOrganizationOptions([]);
      return;
    }

    setOrganizationLoading(true);
    try {
      const results = await searchResources<Organization>({
        name: searchTerm,
        _count: 20
      });

      const options: OrganizationOption[] = results.map((organization) => ({
        id: organization.id || '',
        label: organization.name || '',
        name: organization.name || '',
        type: organization.type?.[0]?.coding?.[0]?.display || ''
      }));

      setOrganizationOptions(options);
    } catch (error) {
      console.error('Error searching organizations:', error);
      setOrganizationOptions([]);
    } finally {
      setOrganizationLoading(false);
    }
  }, [searchResources]);


  // Start adding new contact
  const handleStartAddContact = React.useCallback(() => {
    setIsAddingNew(true);
    setEditingContact(null);
    setNewContact({
      relationship: 'C',
      name: { given: '', family: '' },
      telecom: [],
      address: { line: [], city: '', state: '', postalCode: '', country: 'ML' },
      gender: undefined,
      organization: '',
      period: undefined
    });
  }, []);

  // Save new contact
  const handleSaveNewContact = React.useCallback(() => {
    setFormValues(prev => ({
      ...prev,
      contact: [...prev.contact, newContact]
    }));
    setIsAddingNew(false);
  }, [setFormValues, newContact]);

  // Cancel adding new contact
  const handleCancelAdd = React.useCallback(() => {
    setIsAddingNew(false);
  }, []);

  // Start editing contact
  const handleStartEditContact = React.useCallback((index: number) => {
    setEditingContact(index);
    setIsAddingNew(false);
  }, []);

  // Save editing contact
  const handleSaveEdit = React.useCallback(() => {
    setEditingContact(null);
  }, []);

  // Cancel editing contact
  const handleCancelEdit = React.useCallback(() => {
    setEditingContact(null);
  }, []);

  // Remove contact entry
  const handleRemoveContact = React.useCallback((index: number) => {
    setFormValues(prev => ({
      ...prev,
      contact: prev.contact.filter((_, i) => i !== index)
    }));
  }, [setFormValues]);

  // Update contact field
  const handleContactChange = React.useCallback((
    index: number,
    field: keyof RelatedPersonData,
    value: any
  ) => {
    setFormValues(prev => ({
      ...prev,
      contact: prev.contact.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }, [setFormValues]);

  // Update new contact field
  const handleNewContactChange = React.useCallback((
    field: keyof RelatedPersonData,
    value: any
  ) => {
    setNewContact(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update nested contact field (name, address)
  const handleNestedContactChange = React.useCallback((
    index: number,
    parentField: 'name' | 'address' | 'period',
    field: string,
    value: any
  ) => {
    setFormValues(prev => ({
      ...prev,
      contact: prev.contact.map((item, i) =>
        i === index ? {
          ...item,
          [parentField]: {
            ...item[parentField] as any,
            [field]: value
          }
        } : item
      )
    }));
  }, [setFormValues]);

  // Update nested new contact field
  const handleNestedNewContactChange = React.useCallback((
    parentField: 'name' | 'address' | 'period',
    field: string,
    value: any
  ) => {
    setNewContact(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField] as any,
        [field]: value
      }
    }));
  }, []);

  // Add telecom to contact
  const handleAddContactTelecom = React.useCallback((contactIndex: number) => {
    const newTelecom: TelecomFormData = {
      system: 'phone',
      value: '',
      use: 'home'
    };

    setFormValues(prev => ({
      ...prev,
      contact: prev.contact.map((item, i) =>
        i === contactIndex ? {
          ...item,
          telecom: [...item.telecom, newTelecom]
        } : item
      )
    }));
  }, [setFormValues]);

  // Add telecom to new contact
  const handleAddNewContactTelecom = React.useCallback(() => {
    const newTelecom: TelecomFormData = {
      system: 'phone',
      value: '',
      use: 'home'
    };

    setNewContact(prev => ({
      ...prev,
      telecom: [...prev.telecom, newTelecom]
    }));
  }, []);

  // Remove telecom from contact
  const handleRemoveContactTelecom = React.useCallback((contactIndex: number, telecomIndex: number) => {
    setFormValues(prev => ({
      ...prev,
      contact: prev.contact.map((item, i) =>
        i === contactIndex ? {
          ...item,
          telecom: item.telecom.filter((_, j) => j !== telecomIndex)
        } : item
      )
    }));
  }, [setFormValues]);

  // Remove telecom from new contact
  const handleRemoveNewContactTelecom = React.useCallback((telecomIndex: number) => {
    setNewContact(prev => ({
      ...prev,
      telecom: prev.telecom.filter((_, j) => j !== telecomIndex)
    }));
  }, []);

  // Update contact telecom
  const handleContactTelecomChange = React.useCallback((
    contactIndex: number,
    telecomIndex: number,
    field: keyof TelecomFormData,
    value: string | number
  ) => {
    setFormValues(prev => ({
      ...prev,
      contact: prev.contact.map((item, i) =>
        i === contactIndex ? {
          ...item,
          telecom: item.telecom.map((telecom, j) =>
            j === telecomIndex ? { ...telecom, [field]: value } : telecom
          )
        } : item
      )
    }));
  }, [setFormValues]);

  // Update new contact telecom
  const handleNewContactTelecomChange = React.useCallback((
    telecomIndex: number,
    field: keyof TelecomFormData,
    value: string | number
  ) => {
    setNewContact(prev => ({
      ...prev,
      telecom: prev.telecom.map((telecom, j) =>
        j === telecomIndex ? { ...telecom, [field]: value } : telecom
      )
    }));
  }, []);

  // Get telecom icon
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

  // Get relationship display name
  const getRelationshipDisplay = (code: string) => {
    const relationship = relationshipOptions.find(r => r.code === code);
    return t(`labels.contact.relationships.${code}`, {
      ns: 'patient',
      defaultValue: relationship?.display || code
    });
  };

  // Handle organization selection for new contact
  const handleNewContactOrganizationSelect = React.useCallback((organizationName: string | null) => {
    setNewContact(prev => ({
      ...prev,
      organization: organizationName || ''
    }));
    setOrganizationSearchText('');
  }, []);

  // Handle organization selection for existing contact
  const handleContactOrganizationSelect = React.useCallback((contactIndex: number, organizationName: string | null) => {
    setFormValues(prev => ({
      ...prev,
      contact: prev.contact.map((item, i) =>
        i === contactIndex ? { ...item, organization: organizationName || '' } : item
      )
    }));
    setEditOrganizationSearchText('');
  }, [setFormValues]);

  // Render contact form fields
  const renderContactFormFields = (contact: RelatedPersonData, isNew: boolean, contactIndex?: number) => {
    const currentSearchText = isNew ? organizationSearchText : editOrganizationSearchText;
    const setCurrentSearchText = isNew ? setOrganizationSearchText : setEditOrganizationSearchText;

    return (
      <Grid container spacing={3}>
        {/* Row 1: Relationship and Gender */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>{t('labels.contact.relationship', { ns: 'patient' })}</InputLabel>
            <Select
              value={contact.relationship}
              onChange={(e) => isNew
                ? handleNewContactChange('relationship', e.target.value)
                : handleContactChange(contactIndex!, 'relationship', e.target.value)
              }
              disabled={isSubmitting}
              label={t('labels.contact.relationship', { ns: 'patient' })}
            >
              {relationshipOptions.map((rel) => (
                <MenuItem key={rel.code} value={rel.code}>
                  {t(`labels.contact.relationships.${rel.code}`, {
                    ns: 'patient',
                    defaultValue: rel.display
                  })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>{t('labels.contact.gender', { ns: 'patient' })}</InputLabel>
            <Select
              value={contact.gender || ''}
              onChange={(e) => isNew
                ? handleNewContactChange('gender', e.target.value || undefined)
                : handleContactChange(contactIndex!, 'gender', e.target.value || undefined)
              }
              disabled={isSubmitting}
              label={t('labels.contact.gender', { ns: 'patient' })}
            >
              <MenuItem value="">
                <em>{t('labels.contact.selectGender', { ns: 'patient' })}</em>
              </MenuItem>
              {Array.isArray(genderOptions) ? genderOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(`labels.personalInfo.gender.${option.value}`, { 
                    ns: 'patient', 
                    defaultValue: option.label 
                  })}
                </MenuItem>
              )) : null}
            </Select>
          </FormControl>
        </Grid>

        {/* Row 2: Given Name and Family Name */}
        <Grid item xs={12} sm={6}>
          <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center' }}>
            <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
              {t('labels.contact.givenName', { ns: 'patient' })}
            </legend>
            <TextField
              fullWidth
              size="small"
              value={contact.name.given || ''}
              onChange={(e) => isNew
                ? handleNestedNewContactChange('name', 'given', e.target.value)
                : handleNestedContactChange(contactIndex!, 'name', 'given', e.target.value)
              }
              disabled={isSubmitting}
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
        </Grid>

        <Grid item xs={12} sm={6}>
          <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '46px', display: 'flex', alignItems: 'center' }}>
            <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
              {t('labels.contact.familyName', { ns: 'patient' })}
            </legend>
            <TextField
              fullWidth
              size="small"
              value={contact.name.family || ''}
              onChange={(e) => isNew
                ? handleNestedNewContactChange('name', 'family', e.target.value)
                : handleNestedContactChange(contactIndex!, 'name', 'family', e.target.value)
              }
              disabled={isSubmitting}
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
        </Grid>

        {/* Row 3: Organization (Autocomplete) */}
        <Grid item xs={12}>
          <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, minHeight: '56px', display: 'flex', alignItems: 'center' }}>
            <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
              {t('labels.contact.organization', { ns: 'patient' })}
            </legend>
            <Autocomplete
              fullWidth
              options={organizationOptions}
              loading={organizationLoading}
              value={contact.organization ? {
                id: '',
                label: contact.organization,
                name: contact.organization
              } : null}
              inputValue={currentSearchText}
              onInputChange={(_, newInputValue) => {
                setCurrentSearchText(newInputValue);
                searchOrganizations(newInputValue);
              }}
              onChange={(_, newValue) => {
                const selectedName = typeof newValue === 'string' ? newValue : newValue?.name || null;
                if (isNew) {
                  handleNewContactOrganizationSelect(selectedName);
                } else {
                  handleContactOrganizationSelect(contactIndex!, selectedName);
                }
              }}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <BusinessIcon sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="body1">{typeof option === 'string' ? option : option.name}</Typography>
                    {typeof option !== 'string' && option.type && (
                      <Typography variant="caption" color="text.secondary">
                        {option.type}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('labels.contact.organizationPlaceholder', { ns: 'patient', defaultValue: 'Search for organization...' })}
                  disabled={isSubmitting}
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    style: { border: 'none', height: '26px', minHeight: '26px' },
                    endAdornment: (
                      <>
                        {organizationLoading && <CircularProgress color="inherit" size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
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
              )}
              noOptionsText={
                currentSearchText.length < 2
                  ? t('labels.contact.organizationMinSearch', { ns: 'patient', defaultValue: 'Type at least 2 characters to search' })
                  : t('labels.contact.organizationNoResults', { ns: 'patient', defaultValue: 'No organizations found' })
              }
              freeSolo
              disabled={isSubmitting}
            />
          </fieldset>
        </Grid>

        {/* Selected Organization Display */}
        {contact.organization && (
          <Grid item xs={12}>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={contact.organization}
                onDelete={() => {
                  if (isNew) {
                    handleNewContactOrganizationSelect(null);
                  } else {
                    handleContactOrganizationSelect(contactIndex!, null);
                  }
                }}
                deleteIcon={<ClearIcon />}
                variant="outlined"
                color="primary"
                disabled={isSubmitting}
                icon={<BusinessIcon />}
              />
            </Box>
          </Grid>
        )}
      </Grid>
    );
  };

  // Render telecom section
  const renderTelecomSection = (contact: RelatedPersonData, isNew: boolean, contactIndex?: number) => {
    return (
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">
            {t('labels.contact.telecomTitle', { ns: 'patient' })} ({contact.telecom.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {contact.telecom.map((telecom, telecomIndex) => (
              <Grid item xs={12} key={telecomIndex}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Grid container spacing={1} sx={{ flex: 1 }}>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>{t('labels.telecom.system', { ns: 'patient' })}</InputLabel>
                        <Select
                          value={telecom.system}
                          onChange={(e) => isNew
                            ? handleNewContactTelecomChange(telecomIndex, 'system', e.target.value)
                            : handleContactTelecomChange(contactIndex!, telecomIndex, 'system', e.target.value)
                          }
                          label={t('labels.telecom.system', { ns: 'patient' })}
                          disabled={isSubmitting}
                        >
                          {TELECOM_SYSTEMS.map((system) => (
                            <MenuItem key={system} value={system}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getTelecomIcon(system)}
                                {system.charAt(0).toUpperCase() + system.slice(1)}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '40px', display: 'flex', alignItems: 'center' }}>
                        <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
                          {t('labels.telecom.value', { ns: 'patient' })}
                        </legend>
                        <TextField
                          fullWidth
                          size="small"
                          value={telecom.value}
                          onChange={(e) => isNew
                            ? handleNewContactTelecomChange(telecomIndex, 'value', e.target.value)
                            : handleContactTelecomChange(contactIndex!, telecomIndex, 'value', e.target.value)
                          }
                          disabled={isSubmitting}
                          InputProps={{
                            style: { border: 'none', height: '20px', minHeight: '20px' }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              height: '20px',
                              minHeight: '20px',
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
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>{t('labels.telecom.use', { ns: 'patient' })}</InputLabel>
                        <Select
                          value={telecom.use}
                          onChange={(e) => isNew
                            ? handleNewContactTelecomChange(telecomIndex, 'use', e.target.value)
                            : handleContactTelecomChange(contactIndex!, telecomIndex, 'use', e.target.value)
                          }
                          label={t('labels.telecom.use', { ns: 'patient' })}
                          disabled={isSubmitting}
                        >
                          {TELECOM_USES.map((use) => (
                            <MenuItem key={use} value={use}>
                              {use.charAt(0).toUpperCase() + use.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <IconButton
                    size="small"
                    onClick={() => isNew
                      ? handleRemoveNewContactTelecom(telecomIndex)
                      : handleRemoveContactTelecom(contactIndex!, telecomIndex)
                    }
                    disabled={isSubmitting}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => isNew
                  ? handleAddNewContactTelecom()
                  : handleAddContactTelecom(contactIndex!)
                }
                disabled={isSubmitting}
              >
                {t('labels.contact.addTelecom', { ns: 'patient' })}
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  // Render address section
  const renderAddressSection = (contact: RelatedPersonData, isNew: boolean, contactIndex?: number) => {
    return (
      <Accordion sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">
            {t('labels.contact.addressTitle', { ns: 'patient' })}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '40px', display: 'flex', alignItems: 'center' }}>
                <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
                  {t('labels.address.addressCity', { ns: 'patient' })}
                </legend>
                <TextField
                  fullWidth
                  size="small"
                  value={contact.address.city || ''}
                  onChange={(e) => isNew
                    ? handleNestedNewContactChange('address', 'city', e.target.value)
                    : handleNestedContactChange(contactIndex!, 'address', 'city', e.target.value)
                  }
                  disabled={isSubmitting}
                  InputProps={{
                    style: { border: 'none', height: '20px', minHeight: '20px' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '20px',
                      minHeight: '20px',
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '40px', display: 'flex', alignItems: 'center' }}>
                <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
                  {t('labels.address.addressState', { ns: 'patient' })}
                </legend>
                <TextField
                  fullWidth
                  size="small"
                  value={contact.address.state || ''}
                  onChange={(e) => isNew
                    ? handleNestedNewContactChange('address', 'state', e.target.value)
                    : handleNestedContactChange(contactIndex!, 'address', 'state', e.target.value)
                  }
                  disabled={isSubmitting}
                  InputProps={{
                    style: { border: 'none', height: '20px', minHeight: '20px' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '20px',
                      minHeight: '20px',
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '40px', display: 'flex', alignItems: 'center' }}>
                <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
                  {t('labels.address.addressPostalCode', { ns: 'patient' })}
                </legend>
                <TextField
                  fullWidth
                  size="small"
                  value={contact.address.postalCode || ''}
                  onChange={(e) => isNew
                    ? handleNestedNewContactChange('address', 'postalCode', e.target.value)
                    : handleNestedContactChange(contactIndex!, 'address', 'postalCode', e.target.value)
                  }
                  disabled={isSubmitting}
                  InputProps={{
                    style: { border: 'none', height: '20px', minHeight: '20px' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '20px',
                      minHeight: '20px',
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <fieldset style={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '0 12px', margin: 0, height: '40px', display: 'flex', alignItems: 'center' }}>
                <legend style={{ padding: '0 8px', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', lineHeight: '12px' }}>
                  {t('labels.address.addressCountry', { ns: 'patient' })}
                </legend>
                <Autocomplete
                  fullWidth
                  options={COUNTRIES}
                  value={COUNTRIES.find(country => country.code === contact.address.country) || null}
                  onChange={(_, newValue) => {
                    const countryCode = newValue?.code || '';
                    if (isNew) {
                      handleNestedNewContactChange('address', 'country', countryCode);
                    } else {
                      handleNestedContactChange(contactIndex!, 'address', 'country', countryCode);
                    }
                  }}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t('labels.address.countryPlaceholder', { ns: 'patient', defaultValue: 'Search country...' })}
                      disabled={isSubmitting}
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        style: { border: 'none', height: '20px', minHeight: '20px' }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '20px',
                          minHeight: '20px',
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
                  )}
                  disabled={isSubmitting}
                />
              </fieldset>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Stack spacing={3}>
      {/* Add New Contact Form Section */}
      {isAddingNew && (
        <Card variant="outlined">
          <CardHeader
            title={
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon />
                {t('labels.contact.newContact', { ns: 'patient', defaultValue: 'New Emergency Contact' })}
              </Typography>
            }
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={handleSaveNewContact}
                  variant="contained"
                  disabled={isSubmitting || !newContact.name.given || !newContact.name.family}
                >
                  {t('common:buttons.save')}
                </Button>
                <Button
                  size="small"
                  onClick={handleCancelAdd}
                  disabled={isSubmitting}
                >
                  {t('common:buttons.cancel')}
                </Button>
              </Box>
            }
          />
          <CardContent>
            {renderContactFormFields(newContact, true)}
            {renderTelecomSection(newContact, true)}
            {renderAddressSection(newContact, true)}
          </CardContent>
        </Card>
      )}

      {/* Add Contact Button (when not adding) */}
      {!isAddingNew && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleStartAddContact}
            disabled={isSubmitting}
            sx={{ minWidth: 200 }}
          >
            {t('labels.contact.addContact', { ns: 'patient' })}
          </Button>
        </Box>
      )}

      {/* Saved Contacts Section */}
      {formValues.contact.length > 0 && (
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContactsIcon />
            {t('labels.contact.savedContacts', { ns: 'patient', defaultValue: 'Saved Emergency Contacts' })} ({formValues.contact.length})
          </Typography>

          {formValues.contact.map((contact, index) => (
            <Card key={index} variant="outlined">
              {editingContact === index ? (
                // Edit Mode
                <>
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon />
                        {t('labels.contact.editContact', { ns: 'patient', defaultValue: 'Edit Contact' })}
                      </Typography>
                    }
                    action={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={handleSaveEdit}
                          variant="contained"
                          disabled={isSubmitting}
                        >
                          {t('common:buttons.save')}
                        </Button>
                        <Button
                          size="small"
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                        >
                          {t('common:buttons.cancel')}
                        </Button>
                      </Box>
                    }
                  />
                  <CardContent>
                    {renderContactFormFields(contact, false, index)}
                    {renderTelecomSection(contact, false, index)}
                    {renderAddressSection(contact, false, index)}
                  </CardContent>
                </>
              ) : (
                // Display Mode
                <>
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PersonIcon />
                        <Box>
                          <Typography variant="h6">
                            {contact.name.given} {contact.name.family}
                          </Typography>
                          <Chip
                            label={getRelationshipDisplay(contact.relationship)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                    action={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleStartEditContact(index)}
                          disabled={isSubmitting}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveContact(index)}
                          disabled={isSubmitting}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      {contact.gender && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            {t('labels.contact.gender', { ns: 'patient' })}: {t(`labels.personalInfo.gender.${contact.gender}`, { ns: 'patient' })}
                          </Typography>
                        </Grid>
                      )}

                      {contact.organization && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            {t('labels.contact.organization', { ns: 'patient' })}: {contact.organization}
                          </Typography>
                        </Grid>
                      )}

                      {/* Telecom Information */}
                      {contact.telecom.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {t('labels.contact.telecomTitle', { ns: 'patient' })}:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {contact.telecom.map((telecom, telecomIndex) => (
                              <Chip
                                key={telecomIndex}
                                icon={getTelecomIcon(telecom.system)}
                                label={`${telecom.value} (${telecom.use})`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Grid>
                      )}

                      {/* Address Information */}
                      {(contact.address.city || contact.address.state || contact.address.postalCode || contact.address.country) && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            {t('labels.contact.addressTitle', { ns: 'patient' })}:
                            {[contact.address.city, contact.address.state, contact.address.postalCode, contact.address.country]
                              .filter(Boolean)
                              .join(', ')}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </Stack>
      )}

      {/* Empty State */}
      {formValues.contact.length === 0 && !isAddingNew && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic', py: 4 }}>
          {t('labels.contact.emptyState', { ns: 'patient' })}
        </Typography>
      )}
    </Stack>
  );
});

RelatedPersonSection.displayName = 'RelatedPersonSection';

export default RelatedPersonSection;