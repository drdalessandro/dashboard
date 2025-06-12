/**
 * usePractitionerById.ts - Wrapper hook for fetching single practitioner by ID
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Practitioner } from '@medplum/fhirtypes';
import { usePractitioner } from './usePractitioner';

interface UsePractitionerByIdResult {
  data: Practitioner | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const usePractitionerById = (id: string | null): UsePractitionerByIdResult => {
  const practitionerHook = usePractitioner();
  const [localData, setLocalData] = useState<Practitioner | null>(null);
  const [localLoading, setLocalLoading] = useState(true); // Start with loading true
  const [localError, setLocalError] = useState<Error | null>(null);
  
  // Use ref to access current hook instance without causing re-renders
  const practitionerHookRef = useRef(practitionerHook);
  practitionerHookRef.current = practitionerHook;
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const fetchPractitioner = useCallback(async () => {
    if (!id) {
      setLocalData(null);
      setLocalLoading(false);
      setLocalError(null);
      return;
    }

    setLocalLoading(true);
    setLocalError(null);

    try {
      const practitioner = await practitionerHookRef.current.fetchOne(id);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLocalData(practitioner);
        setLocalError(null);
      }
    } catch (error) {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLocalError(error instanceof Error ? error : new Error('Failed to fetch practitioner'));
        setLocalData(null);
      }
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLocalLoading(false);
      }
    }
  }, [id]); // Only depend on id, not on practitionerHook

  useEffect(() => {
    isMountedRef.current = true;
    
    if (id) {
      fetchPractitioner();
    } else {
      setLocalData(null);
      setLocalLoading(false);
      setLocalError(null);
    }
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [id, fetchPractitioner]);

  return {
    data: localData,
    isLoading: localLoading,
    error: localError,
    refetch: fetchPractitioner
  };
};

export default usePractitionerById;
