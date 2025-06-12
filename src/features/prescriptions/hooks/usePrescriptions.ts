// src/features/prescriptions/hooks/usePrescriptions.ts
import { useState, useEffect, useCallback } from 'react';
import { ProcessedPrescription, PrescriptionFilters } from '../types/prescription.types';
import { prescriptionService } from '../services/prescriptionService';
import { useTranslation } from 'react-i18next';

/**
 * Hook for managing prescription data with offline-first capabilities
 * Handles loading states, error handling, and data synchronization
 */
export const usePrescriptions = (patientId?: string) => {
  const { t } = useTranslation(['prescription', 'common']);
  const [prescriptions, setPrescriptions] = useState<ProcessedPrescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<ProcessedPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [filters, setFilters] = useState<PrescriptionFilters>({
    patientId: patientId
  });

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch prescriptions data
  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: ProcessedPrescription[] = [];
      let offline = false;

      // If patientId is provided, fetch only for that patient
      if (patientId) {
        data = await prescriptionService.getPrescriptionsForPatient(patientId);
        // We don't have offline status from this method, so we'll use the browser status
        offline = !navigator.onLine;
      } else {
        // Otherwise fetch all prescriptions
        const result = await prescriptionService.getPrescriptions();
        data = result.data;
        offline = result.isOffline;
      }

      setPrescriptions(data);
      setFilteredPrescriptions(data);
      setIsOffline(offline);
    } catch (err) {
      setError(t('prescription.error.fetchFailed'));
      console.error('Error in usePrescriptions hook:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, t]);

  // Initial data fetching
  useEffect(() => {
    fetchPrescriptions();

    // Setup periodic sync when online
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        fetchPrescriptions();
      }
    }, 60000); // Check every minute

    return () => clearInterval(syncInterval);
  }, [fetchPrescriptions]);

  // Apply filters when filters or prescriptions change
  useEffect(() => {
    if (!prescriptions.length) return;

    let result = [...prescriptions];

    // Filter by patientId
    if (filters.patientId) {
      result = result.filter(prescription =>
        prescription.patientId === filters.patientId
      );
    }

    // Filter by patientName
    if (filters.patientName) {
      const searchTerm = filters.patientName.toLowerCase();
      result = result.filter(prescription =>
        prescription.patientName.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by medicationName
    if (filters.medicationName) {
      const searchTerm = filters.medicationName.toLowerCase();
      result = result.filter(prescription =>
        prescription.medicationName.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by status
    if (filters.status) {
      result = result.filter(prescription =>
        prescription.status === filters.status
      );
    }

    // Filter by dateRange
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;

      result = result.filter(prescription => {
        if (!prescription.dateWritten) return true;

        const prescriptionDate = new Date(prescription.dateWritten);

        // Check start date if specified
        if (start && new Date(start) > prescriptionDate) return false;

        // Check end date if specified
        if (end && new Date(end) < prescriptionDate) return false;

        return true;
      });
    }

    // Filter by prescriberName
    if (filters.prescriberName) {
      const searchTerm = filters.prescriberName.toLowerCase();
      result = result.filter(prescription =>
        prescription.prescriberName.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredPrescriptions(result);
  }, [filters, prescriptions]);

  /**
   * Update filters and trigger re-filtering
   */
  const updateFilters = useCallback((newFilters: Partial<PrescriptionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Clear all filters except patientId if it was provided in the hook initialization
   */
  const clearFilters = useCallback(() => {
    setFilters(patientId ? { patientId } : {});
  }, [patientId]);

  /**
   * Manually trigger a data refresh
   */
  const refreshData = useCallback(() => {
    return fetchPrescriptions();
  }, [fetchPrescriptions]);

  return {
    prescriptions: filteredPrescriptions,
    loading,
    error,
    isOffline,
    filters,
    updateFilters,
    clearFilters,
    refreshData
  };
};
