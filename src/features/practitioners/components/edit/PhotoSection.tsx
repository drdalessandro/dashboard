/**
 * PhotoSection.tsx
 * 
 * Form section for managing practitioner photos with upload functionality
 */
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Box,
  Avatar,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import { Grid } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { PractitionerFormValues, PhotoFormData } from '../../../../adapters/PractitionerAdapter';
import { FormCard } from './FormCard';

interface PhotoSectionProps {
  formValues: PractitionerFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<PractitionerFormValues>>;
  errors: Partial<Record<keyof PractitionerFormValues, string>>;
  isSubmitting?: boolean;
}

export const PhotoSection = React.memo<PhotoSectionProps>(({
  formValues,
  setFormValues,
  errors,
  isSubmitting = false
}) => {
  const { t } = useTranslation(['practitioner', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string>('');

  // Handle file selection
  const handleFileSelect = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError(t('common.errors.invalidImageFile', { ns: 'common' }));
      return;
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t('common.errors.fileSizeLimitExceeded', { ns: 'common' }));
      return;
    }

    setUploadError('');

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const base64Content = base64Data.split(',')[1]; // Remove data:image/...;base64, prefix

      const newPhoto: PhotoFormData = {
        contentType: file.type,
        data: base64Content,
        size: file.size,
        title: file.name
      };

      setFormValues(prev => ({
        ...prev,
        photo: [newPhoto] // Replace existing photo with new one
      }));
    };

    reader.readAsDataURL(file);
  }, [setFormValues]);

  // Handle photo removal
  const handleRemovePhoto = React.useCallback(() => {
    setFormValues(prev => ({
      ...prev,
      photo: []
    }));
    setUploadError('');
  }, [setFormValues]);

  // Get current photo for display
  const currentPhoto = formValues.photo?.[0];
  const photoSrc = currentPhoto?.data
    ? `data:${currentPhoto.contentType};base64,${currentPhoto.data}`
    : currentPhoto?.url || '';

  return (
    <FormCard
      title={t('fields.photo', { ns: 'practitioner' })}
      icon={<PhotoCameraIcon color="primary" />}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid columns={{ xs: 12, md: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column">
            <Avatar
              src={photoSrc}
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                border: '2px solid',
                borderColor: 'divider'
              }}
            >
              {!photoSrc && <PhotoCameraIcon sx={{ fontSize: 40 }} />}
            </Avatar>

            {currentPhoto && (
              <Typography variant="caption" color="text.secondary">
                {currentPhoto.title} ({Math.round((currentPhoto.size || 0) / 1024)}KB)
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid columns={{ xs: 12, md: 8 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                {currentPhoto ? t('actions.changePhoto', { ns: 'practitioner' }) : t('actions.uploadPhoto', { ns: 'practitioner' })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('actions.clickToSelectPhoto', { ns: 'practitioner' })}
                <br />
                {t('supportedFormats', { ns: 'common' })}
              </Typography>
            </Paper>

            {uploadError && (
              <Alert severity="error" onClose={() => setUploadError('')}>
                {uploadError}
              </Alert>
            )}

            {currentPhoto && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRemovePhoto}
                disabled={isSubmitting}
              >
                {t('actions.removePhoto', { ns: 'practitioner' })}
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
        disabled={isSubmitting}
      />
    </FormCard>
  );
});

PhotoSection.displayName = 'PhotoSection';

export default PhotoSection;
