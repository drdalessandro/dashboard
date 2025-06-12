/**
 * PractitionerCreateForm.tsx - Updated to use shared template
 * 
 * Form component for creating new practitioners using shared template design
 */
import React from 'react';
import { PractitionerFormTemplate, PractitionerFormTemplateValues } from '../PractitionerFormTemplate';
import { PractitionerFormValues } from '../../../../adapters/PractitionerAdapter';
import { ResourceFormRenderProps } from '../../../../components/common/ResourceEditPage';
// import { PractitionerCreateParams } from '../../types/practitioner.types';

// interface PractitionerCreateFormProps {
//   formValues: PractitionerCreateParams;
//   setFormValues: React.Dispatch<React.SetStateAction<PractitionerCreateParams>>;
//   errors: Record<string, string>;
//   isSubmitting: boolean;
// }

interface PractitionerCreateFormProps extends ResourceFormRenderProps<PractitionerFormValues> { }

export const PractitionerCreateForm: React.FC<PractitionerCreateFormProps> = React.memo(({
  formValues,
  setFormValues,
  handleSubmit,
  isSubmitting,
  errors
}) => {
  // Convert create params to template values
  const templateValues: PractitionerFormTemplateValues = React.useMemo(() => ({
    firstName: formValues.firstName,
    lastName: formValues.lastName,
    gender: formValues.gender,
    birthDate: formValues.birthDate,
    nina: '', // Add this field to create params if needed
    specialty: formValues.qualifications?.[0]?.code,
    licenseNumber: '', // Add this field to create params if needed
    npiNumber: '', // Add this field to create params if needed
    status: 'active', // Default status for new practitioners
    contact: formValues.contact?.map(c => ({
      system: c.system as 'email' | 'phone',
      value: c.value,
      use: c.use
    })),
    address: formValues.address?.map(a => ({
      line: a.line,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode
    })),
    notes: '', // Add this field to create params if needed
  }), [formValues]);

  // Handle template value changes
  const handleTemplateValuesChange = React.useCallback((newValues: React.SetStateAction<PractitionerFormTemplateValues>) => {
    setFormValues(prev => {
      const updatedTemplateValues = typeof newValues === 'function' ? newValues(templateValues) : newValues;

      // Convert template values back to create params
      return {
        ...prev,
        firstName: updatedTemplateValues.firstName || '',
        lastName: updatedTemplateValues.lastName || '',
        gender: updatedTemplateValues.gender,
        birthDate: updatedTemplateValues.birthDate || '',
        qualifications: updatedTemplateValues.specialty ? [{
          code: updatedTemplateValues.specialty,
          issuer: ''
        }] : [],
        contact: updatedTemplateValues.contact?.map(c => ({
          system: c.system,
          value: c.value,
          use: c.use || 'work'
        })).filter(c => c.system && c.value && c.use) || [],
        address: updatedTemplateValues.address?.map(a => ({
          line: a.line,
          city: a.city,
          state: a.state,
          postalCode: a.postalCode
        })).filter(a => a.line && a.city && a.state && a.postalCode) || []
      };
    });
  }, [templateValues, setFormValues]);

  // Handle form submission - placeholder for now
  // const handleSubmit = React.useCallback((e: React.FormEvent) => {
  //   e.preventDefault();
  //   // The actual submission is handled by the parent component
  // }, []);

  return (
    <PractitionerFormTemplate
      formValues={templateValues}
      setFormValues={handleTemplateValuesChange}
      errors={errors}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      mode="create"
      title="New Practitioner"
    />
  );
});

PractitionerCreateForm.displayName = 'PractitionerCreateForm';

export default PractitionerCreateForm;
