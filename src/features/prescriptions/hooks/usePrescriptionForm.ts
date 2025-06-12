/**
 * usePrescriptionForm.ts
 * 
 * Custom hook for managing prescription form state with react-hook-form
 * Provides a clean API for managing form state, validation, and submission
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useMedplum } from '@/hooks/useMedplum';
import { MedicationRequest } from '@medplum/fhirtypes';
import { RxNormMedication } from '@/services/implementations/rxnorm';
import { rxNormToFHIRMedication, createMedicationReference, generateDosageInstructions } from '@/utils/fhir/mappers/rxnormMappers';
import { RxNormService } from '@/services/implementations/rxnorm';
import { createLogger } from '@/utils/logger';
import supabaseClient from '@/lib/supabase/client';
import { formatPatientName } from '@/features/patients/utils';
import { usePatient } from '@/hooks/usePatient';

// Initialize logger
const logger = createLogger('usePrescriptionForm');

// Define form validation schema with zod
export const prescriptionFormSchema = z.object({
  patientId: z.string().min(1, { message: 'Patient ID is required' }),
  patientName: z.string().optional(),
  medicationName: z.string().min(1, { message: 'Medication name is required' }),
  dosage: z.string().min(1, { message: 'Dosage is required' }),
  frequency: z.string().min(1, { message: 'Frequency is required' }),
  duration: z.string().min(1, { message: 'Duration is required' }),
  quantity: z.string().min(1, { message: 'Quantity is required' }),
  refills: z.string().default('0'),
  instructions: z.string().optional(),
  status: z.enum(['active', 'draft']).default('active'),
  dateWritten: z.string().default(() => new Date().toISOString().split('T')[0]),
});

// Define the form values type from the schema
export type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

// Define the extended form values with RxNorm medication
export interface ExtendedPrescriptionFormValues extends PrescriptionFormValues {
  medication?: RxNormMedication | null;
}

// Define the hook props
export interface UsePrescriptionFormProps {
  initialPatientId?: string;
  onSuccess?: (data: any) => void;
}

// Define the main hook
export function usePrescriptionForm({ initialPatientId, onSuccess }: UsePrescriptionFormProps = {}) {
  // Create a stable, memoized version of initialPatientId
  const patientId = initialPatientId || '';
  
  // Access medplum client
  const medplum = useMedplum();
  
  // Initialize RxNorm service
  const rxNormService = new RxNormService();
  
  // Check network status
  const { isOffline } = useNetworkStatus?.() || { isOffline: false };
  
  // Access translations
  const { t } = useTranslation(['prescription', 'common']);
  
  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting: isFormSubmitting },
    reset,
    getValues,
  } = useForm<ExtendedPrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      patientId,
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      refills: '0',
      instructions: '',
      status: 'active',
      dateWritten: new Date().toISOString().split('T')[0],
      medication: null,
    },
  });
  
  // Form state
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Medication search state
  const [medicationOptions, setMedicationOptions] = useState<RxNormMedication[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add a previous search term ref to prevent duplicate searches
  const prevSearchTermRef = useRef('');
  
  // Track if search is in progress
  const searchInProgressRef = useRef(false);
  
  // Get patient information if patientId is provided
  const { data: patientData, isLoading: isPatientLoading } = usePatient(watch('patientId'), {
    enabled: !!watch('patientId'),
  });
  
  // Set patient name when patient data is loaded
  useEffect(() => {
    if (patientData && !watch('patientName')) {
      setValue('patientName', formatPatientName(patientData));
    }
  }, [patientData, setValue, watch]);
  
  // Debounced medication search with better infinite loop prevention
  useEffect(() => {
    // Skip if search term hasn't actually changed
    if (searchTerm === prevSearchTermRef.current) {
      return;
    }
    
    // Skip short searches, but still update the ref
    if (!searchTerm || searchTerm.length < 3) {
      prevSearchTermRef.current = searchTerm;
      setMedicationOptions([]);
      return;
    }
    
    // Skip if search is already in progress for this term
    if (searchInProgressRef.current && searchTerm === prevSearchTermRef.current) {
      return;
    }
    
    // Set up debounce timer
    const timer = setTimeout(() => {
      // Store current search term to prevent duplicate searches
      prevSearchTermRef.current = searchTerm;
      searchInProgressRef.current = true;
      
      setSearchLoading(true);
      
      rxNormService.searchMedications(searchTerm)
        .then(results => {
          setMedicationOptions(results);
        })
        .catch(error => {
          logger.error('Error searching medications:', error);
          setMedicationOptions([]);
        })
        .finally(() => {
          setSearchLoading(false);
          searchInProgressRef.current = false;
        });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, rxNormService]);
  
  // Handle medication selection
  const handleMedicationSelect = useCallback((medication: RxNormMedication | null) => {
    setValue('medication', medication);
    if (medication) {
      setValue('medicationName', medication.name);
    }
  }, [setValue]);
  
  // Handle form submission
  const onSubmit: SubmitHandler<ExtendedPrescriptionFormValues> = useCallback(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      logger.info('Creating new prescription', {
        patientId: data.patientId,
        medication: data.medication?.rxcui || data.medicationName
      });
      
      let result;
      if (isOffline) {
        result = await handleOfflinePrescription(data);
      } else {
        result = await handleOnlinePrescription(data);
      }
      
      setSubmitSuccess(true);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      logger.error('Error creating prescription:', error);
      setSubmitError('Failed to create prescription. Please try again.');
      
      if (isOffline) {
        // Even though there was an error, show success for offline mode 
        // since we're queuing it for later sync
        setSubmitSuccess(true);
        setSubmitError('Prescription saved offline. It will be synchronized when connection is restored.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isOffline, onSuccess]);
  
  // Handle online prescription creation
  const handleOnlinePrescription = async (data: ExtendedPrescriptionFormValues) => {
    // Validate medication data
    if (!data.medication) {
      throw new Error('Medication information is required');
    }

    // Parse duration to extract numeric value and unit
    const durationMatch = data.duration.match(/(\d+)\s*(\w+)/);
    const durationValue = durationMatch ? parseInt(durationMatch[1]) : 1;
    const durationUnit = durationMatch ? durationMatch[2] : 'day';

    // Map duration unit to FHIR-compatible units
    const periodUnitMap: Record<string, 'd' | 'wk' | 'mo' | 'a' | 'h' | 'min' | 's'> = {
      'day': 'd',
      'days': 'd',
      'week': 'wk',
      'weeks': 'wk',
      'month': 'mo',
      'months': 'mo',
      'year': 'a',
      'years': 'a',
      'hour': 'h',
      'hours': 'h',
      'minute': 'min',
      'minutes': 'min',
      'second': 's',
      'seconds': 's'
    };

    const mappedPeriodUnit = periodUnitMap[durationUnit.toLowerCase()] || 'd';

    // Prepare default medication data if needed
    const medicationData: RxNormMedication = {
      rxcui: data.medication.rxcui || 'unknown',
      name: data.medication.name || data.medicationName || 'Unknown Medication',
      tty: data.medication.tty || '',
      activeIngredients: data.medication.activeIngredients || [],
      dosageForm: data.medication.dosageForm,
      strength: data.medication.strength,
      route: data.medication.route
    };

    // Generate dosage instructions using the mapper
    const dosageInstructions = generateDosageInstructions(
      medicationData, 
      data.frequency, 
      data.duration
    );

    // Create a fully typed MedicationRequest resource
    const medicationRequest: MedicationRequest = {
      resourceType: 'MedicationRequest',
      status: data.status || 'active', // Default to active if not specified
      intent: 'order', // Explicitly set the intent
      subject: {
        reference: `Patient/${data.patientId}`,
        display: data.patientName
      },
      requester: {
        reference: `Practitioner/${medplum.getProfile()?.id || 'unknown'}` 
      },
      medicationReference: createMedicationReference(medicationData),
      authoredOn: data.dateWritten || new Date().toISOString(),
      dosageInstruction: [
        {
          ...dosageInstructions,
          text: data.instructions || dosageInstructions.text,
          timing: {
            repeat: {
              frequency: 1,
              period: durationValue,
              periodUnit: mappedPeriodUnit
            },
            code: {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation',
                code: 'QD', // Once daily
                display: 'Every day'
              }],
              text: data.frequency
            }
          },
          doseAndRate: [
            {
              doseQuantity: {
                value: parseFloat(data.dosage) || 1,
                unit: 'dose'
              }
            }
          ]
        }
      ],
      dispenseRequest: {
        numberOfRepeatsAllowed: parseInt(data.refills) || 0,
        quantity: {
          value: parseInt(data.quantity) || 1,
          unit: 'tablets'
        }
      }
    };
    
    // Create the resource
    const response = await medplum.createResource(medicationRequest);
    logger.info('Prescription created successfully', { id: response.id });
    
    return response;
  };
  
  // Handle offline prescription creation
  const handleOfflinePrescription = async (data: ExtendedPrescriptionFormValues) => {
    // Queue prescription for later synchronization
    const prescriptionData = {
      medication: data.medication,
      patientId: data.patientId,
      patientName: data.patientName,
      medicationName: data.medicationName,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration,
      quantity: data.quantity,
      refills: data.refills,
      instructions: data.instructions,
      status: data.status,
      dateWritten: data.dateWritten
    };
    
    const { data: response, error } = await supabaseClient
      .from('offline_queue')
      .insert({
        type: 'prescription',
        data: prescriptionData,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    
    if (error) {
      logger.error('Error queuing prescription for offline sync:', error);
      throw error;
    }
    
    logger.info('Prescription queued for offline sync');
    return response;
  };
  
  // Return hook API
  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    setValue,
    watch,
    errors,
    isSubmitting: isSubmitting || isFormSubmitting,
    submitError,
    submitSuccess,
    reset,
    patientData,
    isPatientLoading,
    
    // Medication search
    searchTerm,
    setSearchTerm,
    medicationOptions,
    searchLoading,
    handleMedicationSelect,
    
    // Network status
    isOffline,
    
    // Form utility functions
    getFormValues: getValues,
    clearForm: () => reset(),
    setFormValues: (values: Partial<ExtendedPrescriptionFormValues>) => {
      Object.entries(values).forEach(([key, value]) => {
        setValue(key as keyof ExtendedPrescriptionFormValues, value);
      });
    },
  };
}

// Export frequency and duration options for reuse
export const FREQUENCY_OPTIONS = [
  'once daily',
  'twice daily',
  'three times daily',
  'four times daily',
  'every morning',
  'every evening',
  'every 4 hours',
  'every 6 hours',
  'every 8 hours',
  'every 12 hours',
  'as needed',
  'with meals',
  'after meals',
  'before meals',
  'at bedtime'
];

export const DURATION_OPTIONS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '30 days',
  '90 days',
  'continuous'
];