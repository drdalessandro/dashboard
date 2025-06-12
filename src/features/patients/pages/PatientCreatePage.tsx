/**
 * PatientCreatePage - With Design System Components
 * Main page component for creating new patients with enhanced UI/UX
 * Implements offline-first capabilities and FHIR compliance
 */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useCreate } from '@refinedev/core';
import {
  Box, Container, Typography, TextField, Button, Grid, Divider,
  Accordion, AccordionSummary, AccordionDetails, MenuItem, Chip,
  IconButton, Avatar, FormControlLabel, Checkbox, Stack, Alert, Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore, PersonOutline, ContactPhoneOutlined, LocationOnOutlined,
  LocalHospitalOutlined, GroupOutlined, LanguageOutlined, AddCircleOutline,
  DeleteOutline, CloudUploadOutlined, HelpOutline, ArrowBackOutlined,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Patient } from '@medplum/fhirtypes';
import { createLogger } from '../../../utils/logger';
import { PageHeader, DataCard, ActionButton } from '@/components/designSystem';

// Initialize logger
const logger = createLogger('PatientCreatePage');

// Patient form interface matching FHIR structure
interface IPatientForm {
  active: boolean;
  name: [{
    use: 'official' | 'usual' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
    family: string;
    given: string[];
    prefix?: string[];
    suffix?: string[];
  }];
  identifier?: [{
    system: string;
    value: string;
  }];
  gender: string;
  birthDate: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  photo?: File | null;
  telecom: Array<{
    system: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
    value: string;
    use: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  }>;
  address: [{
    use: 'home' | 'work' | 'temp' | 'old' | 'billing';
    line: string[];
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }];
  maritalStatus?: string;
  communication: [{
    language: {
      coding: [{
        system: string;
        code: string;
        display: string;
      }];
    };
    preferred: boolean;
  }];
  contact?: any[];
  generalPractitioner?: any[];
  managingOrganization?: string;
}

export const PatientCreatePage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation(['patient', 'common', 'network']);
  const { mutate: createPatient, isLoading } = useCreate();

  // Network status tracking
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | false>('basic');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Form setup with default values matching FHIR structure
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<IPatientForm>({
    defaultValues: {
      active: true,
      name: [{
        use: 'official',
        family: '',
        given: [''],
        prefix: [''],
        suffix: [''],
      }],
      identifier: [{
        system: '',
        value: ''
      }],
      gender: '',
      birthDate: '',
      telecom: [{
        system: 'phone',
        value: '',
        use: 'home'
      }],
      address: [{
        use: 'home',
        line: [''],
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }],
      communication: [{
        language: {
          coding: [{
            system: 'urn:ietf:bcp:47',
            code: '',
            display: ''
          }]
        },
        preferred: false
      }]
    }
  });

  // Form submission handler
  const onSubmit = async (data: IPatientForm) => {
    logger.info('Submitting patient creation form', { offline: isOffline });
    
    try {
      // Transform form data to FHIR Patient resource
      const patient: Patient = {
        resourceType: 'Patient',
        active: data.active,
        name: data.name,
        identifier: data.identifier,
        gender: data.gender as Patient['gender'],
        birthDate: data.birthDate,
        telecom: data.telecom,
        address: data.address,
        maritalStatus: data.maritalStatus ? {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
            code: data.maritalStatus,
            display: data.maritalStatus
          }]
        } : undefined,
        communication: data.communication.filter(c => c.language.coding[0].code),
        contact: data.contact,
        generalPractitioner: data.generalPractitioner,
        managingOrganization: data.managingOrganization ? {
          reference: `Organization/${data.managingOrganization}`
        } : undefined,
        deceasedBoolean: data.deceasedBoolean,
        deceasedDateTime: data.deceasedDateTime
      };

      createPatient({
        resource: 'Patient',
        values: patient,
        successNotification: (data) => ({
          message: t('create.success', { ns: 'patient' }),
          description: t('create.successDescription', { ns: 'patient' }),
          type: 'success',
        }),
        errorNotification: (error) => ({
          message: t('create.error', { ns: 'patient' }),
          description: error?.message || t('create.errorDescription', { ns: 'patient' }),
          type: 'error',
        }),
      }, {
        onSuccess: (data) => {
          logger.info('Patient created successfully', { id: data.data.id });
          router.push('/patients');
        },
        onError: (error) => {
          logger.error('Error creating patient', error);
          setError(error.message || t('create.errorDescription', { ns: 'patient' }));
        }
      });
    } catch (error) {
      logger.error('Error preparing patient data', error);
      setError(t('create.errorDescription', { ns: 'patient' }));
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue('photo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add/remove array fields
  const addArrayField = (fieldName: string, defaultValue: any) => {
    const currentValue = watch(fieldName as any);
    setValue(fieldName as any, [...currentValue, defaultValue]);
  };

  const removeArrayField = (fieldName: string, index: number) => {
    const currentValue = watch(fieldName as any);
    setValue(fieldName as any, currentValue.filter((_: any, i: number) => i !== index));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <PageHeader
        title={t('create.title', { ns: 'patient' })}
        subtitle={t('create.subtitle', { ns: 'patient' })}
        breadcrumbs={[
          { label: t('list.title', { ns: 'patient' }), href: '/patients' },
          { label: t('create.title', { ns: 'patient' }) }
        ]}
        actions={
          <ActionButton
            variant="secondary"
            startIcon={<ArrowBackOutlined />}
            onClick={() => router.push('/patients')}
          >
            {t('back', { ns: 'common' })}
          </ActionButton>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          {/* Basic Information */}
          <Accordion expanded={expandedSection === 'basic'} onChange={(_, isExpanded) => setExpandedSection(isExpanded ? 'basic' : false)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <PersonOutline sx={{ mr: 2 }} />
              <Typography variant="h6">{t('form.sections.basic', { ns: 'patient' })}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <DataCard>
                <Grid container spacing={3}>
                  {/* Active Status */}
                  <Grid item xs={12}>
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Checkbox {...field} checked={field.value} />}
                          label={t('fields.active', { ns: 'patient' })}
                        />
                      )}
                    />
                  </Grid>

                  {/* Name Fields */}
                  <Grid item xs={12} sm={2}>
                    <Controller
                      name="name.0.prefix.0"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t('fields.prefix', { ns: 'patient' })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name="name.0.given.0"
                      control={control}
                      rules={{ required: t('validation.required', { ns: 'common' }) }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          required
                          label={t('fields.firstName', { ns: 'patient' })}
                          error={!!errors.name?.[0]?.given?.[0]}
                          helperText={errors.name?.[0]?.given?.[0]?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name="name.0.family"
                      control={control}
                      rules={{ required: t('validation.required', { ns: 'common' }) }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          required
                          label={t('fields.lastName', { ns: 'patient' })}
                          error={!!errors.name?.[0]?.family}
                          helperText={errors.name?.[0]?.family?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Controller
                      name="name.0.suffix.0"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t('fields.suffix', { ns: 'patient' })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Controller
                      name="name.0.use"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          label={t('fields.nameUse', { ns: 'patient' })}
                        >
                          <MenuItem value="official">{t('options.nameUse.official', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="usual">{t('options.nameUse.usual', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="temp">{t('options.nameUse.temp', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="nickname">{t('options.nameUse.nickname', { ns: 'patient' })}</MenuItem>
                        </TextField>
                      )}
                    />
                  </Grid>

                  {/* Identifier */}
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="identifier.0.system"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t('fields.identifierSystem', { ns: 'patient' })}
                          helperText={t('help.identifierSystem', { ns: 'patient' })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="identifier.0.value"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t('fields.identifierValue', { ns: 'patient' })}
                        />
                      )}
                    />
                  </Grid>

                  {/* Gender and Birth Date */}
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="gender"
                      control={control}
                      rules={{ required: t('validation.required', { ns: 'common' }) }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          required
                          label={t('fields.gender', { ns: 'patient' })}
                          error={!!errors.gender}
                          helperText={errors.gender?.message}
                        >
                          <MenuItem value="male">{t('options.gender.male', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="female">{t('options.gender.female', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="other">{t('options.gender.other', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="unknown">{t('options.gender.unknown', { ns: 'patient' })}</MenuItem>
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="birthDate"
                      control={control}
                      rules={{ required: t('validation.required', { ns: 'common' }) }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="date"
                          fullWidth
                          required
                          label={t('fields.birthDate', { ns: 'patient' })}
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.birthDate}
                          helperText={errors.birthDate?.message}
                        />
                      )}
                    />
                  </Grid>

                  {/* Marital Status */}
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="maritalStatus"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          label={t('fields.maritalStatus', { ns: 'patient' })}
                        >
                          <MenuItem value="">{t('options.none', { ns: 'common' })}</MenuItem>
                          <MenuItem value="A">{t('options.maritalStatus.A', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="D">{t('options.maritalStatus.D', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="I">{t('options.maritalStatus.I', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="L">{t('options.maritalStatus.L', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="M">{t('options.maritalStatus.M', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="P">{t('options.maritalStatus.P', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="S">{t('options.maritalStatus.S', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="T">{t('options.maritalStatus.T', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="U">{t('options.maritalStatus.U', { ns: 'patient' })}</MenuItem>
                          <MenuItem value="W">{t('options.maritalStatus.W', { ns: 'patient' })}</MenuItem>
                        </TextField>
                      )}
                    />
                  </Grid>

                  {/* Photo Upload */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={photoPreview || undefined}
                        sx={{ width: 80, height: 80 }}
                      >
                        <PersonOutline />
                      </Avatar>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadOutlined />}
                      >
                        {t('fields.uploadPhoto', { ns: 'patient' })}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handlePhotoUpload}
                        />
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </DataCard>
            </AccordionDetails>
          </Accordion>

          {/* Contact Information */}
          <Accordion expanded={expandedSection === 'contact'} onChange={(_, isExpanded) => setExpandedSection(isExpanded ? 'contact' : false)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <ContactPhoneOutlined sx={{ mr: 2 }} />
              <Typography variant="h6">{t('form.sections.contact', { ns: 'patient' })}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <DataCard>
                {/* Telecom fields would go here */}
                <Typography variant="body2" color="text.secondary">
                  {t('form.contactInfo', { ns: 'patient' })}
                </Typography>
              </DataCard>
            </AccordionDetails>
          </Accordion>

          {/* Submit Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <ActionButton
              variant="secondary"
              onClick={() => router.push('/patients')}
              disabled={isLoading}
            >
              {t('cancel', { ns: 'common' })}
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
            >
              {isLoading ? t('creating', { ns: 'patient' }) : t('create', { ns: 'patient' })}
            </ActionButton>
          </Box>
        </Stack>
      </form>
    </Container>
  );
};

export default PatientCreatePage;
