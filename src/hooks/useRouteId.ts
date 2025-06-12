/**
 * useRouteId.ts - Simplified hook for route ID parameters
 * Alternative to useValidatedId if you prefer a simpler API
 */
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface RouteIdResult {
  id: string | null;
  isLoading: boolean;
  isValid: boolean;
  error: string | null;
}

export function useRouteId(): RouteIdResult {
  const params = useParams();
  const [result, setResult] = useState<RouteIdResult>({
    id: null,
    isLoading: true,
    isValid: false,
    error: null,
  });

  useEffect(() => {
    if (!params || Object.keys(params).length === 0) {
      setResult({ id: null, isLoading: true, isValid: false, error: null });
      return;
    }

    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    if (!id) {
      setResult({ 
        id: null, 
        isLoading: false, 
        isValid: false, 
        error: 'ID parameter is required' 
      });
      return;
    }

    // UUID validation
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    setResult({
      id: isValidUUID ? id : null,
      isLoading: false,
      isValid: isValidUUID,
      error: isValidUUID ? null : 'Invalid ID format - must be a valid UUID',
    });
  }, [params]);

  return result;
}