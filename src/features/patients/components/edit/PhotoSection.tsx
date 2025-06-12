/**
 * PhotoSection.tsx - Patient photo management
 * 
 * Uses generic PhotoSection component with patient-specific configuration
 */
import React from 'react';
import { PhotoSection as GenericPhotoSection } from '../../../common/components/forms';
import { PatientFormValues } from '../../../../adapters/PatientAdapter';

interface PhotoSectionProps {
  formValues: PatientFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<PatientFormValues>>;
  errors: Partial<Record<keyof PatientFormValues, string>>;
  isSubmitting?: boolean;
}

export const PhotoSection = React.memo<PhotoSectionProps>(({
  formValues,
  setFormValues,
  errors,
  isSubmitting = false
}) => {
  return (
    <GenericPhotoSection
      formValues={formValues}
      setFormValues={setFormValues}
      photoField="photo"
      errors={errors}
      isSubmitting={isSubmitting}
      config={{
        enableDragDrop: true,
        maxSize: 5, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        showPreview: true,
        multiple: false
      }}
      translationNamespace="patient"
    />
  );
});

PhotoSection.displayName = 'PhotoSection';

export default PhotoSection;