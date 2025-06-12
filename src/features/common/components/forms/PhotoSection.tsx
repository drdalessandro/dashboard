/**
 * PhotoSection.tsx
 * 
 * Generic photo/attachment management component for FHIR resources
 * Used by both patient and practitioner features
 */
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Avatar,
  Typography,
  Alert,
  LinearProgress,
  Fade
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonIcon from '@mui/icons-material/Person';
import { UploadButton } from '../buttonStyles';
import { FieldLabel } from './BaseFormComponents';

// Generic photo interface that works with both Patient and Practitioner
interface PhotoFormData {
  contentType?: string;
  data?: string;
  url?: string;
  title?: string;
  creation?: string;
}

interface PhotoSectionConfig {
  enableDragDrop?: boolean;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  showPreview?: boolean;
  multiple?: boolean;
}

interface PhotoSectionProps<T extends Record<string, any>> {
  formValues: T;
  setFormValues: React.Dispatch<React.SetStateAction<T>>;
  photoField: keyof T;
  errors?: Partial<Record<keyof T, string>>;
  isSubmitting?: boolean;
  config?: PhotoSectionConfig;
  translationNamespace?: string;
}

// Default configuration
const DEFAULT_CONFIG: PhotoSectionConfig = {
  enableDragDrop: true,
  maxSize: 5, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  showPreview: true,
  multiple: false
};

export const PhotoSection = <T extends Record<string, any>>({
  formValues,
  setFormValues,
  photoField,
  errors,
  isSubmitting = false,
  config = {},
  translationNamespace = 'common'
}: PhotoSectionProps<T>) => {
  const { t } = useTranslation([translationNamespace, 'common']);
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    enableDragDrop,
    maxSize,
    allowedTypes,
    showPreview,
    multiple
  } = finalConfig;

  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get current photos
  const photos = multiple 
    ? (formValues[photoField] as PhotoFormData[]) || []
    : [(formValues[photoField] as PhotoFormData)].filter(Boolean);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!allowedTypes!.includes(file.type)) {
      return t('errors.photo.invalidType', { 
        ns: translationNamespace, 
        defaultValue: 'Invalid file type. Please upload an image file.' 
      });
    }

    if (file.size > maxSize! * 1024 * 1024) {
      return t('errors.photo.tooLarge', { 
        ns: translationNamespace, 
        defaultValue: `File too large. Maximum size is ${maxSize}MB.`,
        maxSize 
      });
    }

    return null;
  }, [allowedTypes, maxSize, t, translationNamespace]);

  // Convert file to base64
  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const filesToProcess = multiple ? fileArray : fileArray.slice(0, 1);

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const newPhotos: PhotoFormData[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          setUploadError(validationError);
          setUploading(false);
          return;
        }

        // Convert to base64
        const base64Data = await convertToBase64(file);
        
        const photoData: PhotoFormData = {
          contentType: file.type,
          data: base64Data,
          title: file.name,
          creation: new Date().toISOString()
        };

        newPhotos.push(photoData);
        
        // Update progress
        setUploadProgress(((i + 1) / filesToProcess.length) * 100);
      }

      // Update form values
      if (multiple) {
        setFormValues(prev => ({
          ...prev,
          [photoField]: [...photos, ...newPhotos]
        }));
      } else {
        setFormValues(prev => ({
          ...prev,
          [photoField]: newPhotos[0]
        }));
      }

    } catch (error) {
      setUploadError(t('errors.photo.uploadFailed', { 
        ns: translationNamespace, 
        defaultValue: 'Failed to upload photo. Please try again.' 
      }));
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [validateFile, convertToBase64, setFormValues, photoField, photos, multiple, t, translationNamespace]);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Handle drag and drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Remove photo
  const handleRemovePhoto = useCallback((index: number) => {
    if (multiple) {
      setFormValues(prev => ({
        ...prev,
        [photoField]: photos.filter((_, i) => i !== index)
      }));
    } else {
      setFormValues(prev => ({
        ...prev,
        [photoField]: undefined
      }));
    }
  }, [setFormValues, photoField, photos, multiple]);

  // Get photo source URL
  const getPhotoSrc = (photo: PhotoFormData) => {
    if (photo.data) {
      return `data:${photo.contentType};base64,${photo.data}`;
    }
    return photo.url || '';
  };

  return (
    <Box>
      <FieldLabel>
        {t('labels.photo.title', { ns: translationNamespace, defaultValue: 'Photo' })}
      </FieldLabel>

      {/* Current Photos */}
      {showPreview && photos.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {photos.map((photo, index) => (
            <Box key={index} sx={{ position: 'relative' }}>
              <Avatar
                src={getPhotoSrc(photo)}
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '50%'
                }}
              >
                {!getPhotoSrc(photo) && <PersonIcon sx={{ fontSize: 32, color: '#94a3b8' }} />}
              </Avatar>
              {multiple && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#dc2626'
                    }
                  }}
                  onClick={() => handleRemovePhoto(index)}
                >
                  ×
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Upload Area */}
      {(multiple || photos.length === 0) && (
        <Box
          sx={{
            border: dragOver ? '2px dashed #3b82f6' : '2px dashed #cbd5e1',
            borderRadius: '8px',
            padding: 3,
            textAlign: 'center',
            backgroundColor: dragOver ? '#f0f9ff' : '#f8fafc',
            transition: 'all 0.2s ease',
            cursor: enableDragDrop ? 'pointer' : 'default'
          }}
          onDragOver={enableDragDrop ? handleDragOver : undefined}
          onDragLeave={enableDragDrop ? handleDragLeave : undefined}
          onDrop={enableDragDrop ? handleDrop : undefined}
        >
          <input
            type="file"
            accept={allowedTypes!.join(',')}
            onChange={handleFileInputChange}
            disabled={isSubmitting || uploading}
            multiple={multiple}
            style={{ display: 'none' }}
            id={`photo-upload-${String(photoField)}`}
          />
          
          <label htmlFor={`photo-upload-${String(photoField)}`}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CloudUploadIcon sx={{ fontSize: 48, color: '#94a3b8' }} />
              
              <Typography variant="body1" color="textSecondary">
                {enableDragDrop
                  ? t('labels.photo.dragDropText', { 
                      ns: translationNamespace, 
                      defaultValue: 'Drag and drop photos here, or click to select' 
                    })
                  : t('labels.photo.clickText', { 
                      ns: translationNamespace, 
                      defaultValue: 'Click to select photos' 
                    })
                }
              </Typography>
              
              <Typography variant="caption" color="textSecondary">
                {t('labels.photo.supportedFormats', { 
                  ns: translationNamespace, 
                  defaultValue: `Supported formats: ${allowedTypes!.map(type => type.split('/')[1].toUpperCase()).join(', ')}. Max size: ${maxSize}MB.`,
                  formats: allowedTypes!.map(type => type.split('/')[1].toUpperCase()).join(', '),
                  maxSize
                })}
              </Typography>

              <UploadButton
                component="span"
                startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
                disabled={isSubmitting || uploading}
              >
                {t('labels.photo.uploadButton', { ns: translationNamespace, defaultValue: 'Upload Photo' })}
              </UploadButton>
            </Box>
          </label>
        </Box>
      )}

      {/* Upload Progress */}
      <Fade in={uploading}>
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            {t('labels.photo.uploading', { ns: translationNamespace, defaultValue: 'Uploading...' })} {Math.round(uploadProgress)}%
          </Typography>
        </Box>
      </Fade>

      {/* Upload Error */}
      {uploadError && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}

      {/* Form Error */}
      {errors && errors[photoField] && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {String(errors[photoField])}
        </Alert>
      )}
    </Box>
  );
};