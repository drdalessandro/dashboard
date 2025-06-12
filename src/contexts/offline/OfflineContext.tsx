import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MedplumClient } from '@medplum/core';
import { Medication } from '@medplum/fhirtypes';

interface OfflineContextType {
  isOffline: boolean;
  lastOnlineAt: Date | null;
  syncPending: boolean;
  triggerSync: () => Promise<void>;
}

export const OfflineContext = createContext<OfflineContextType>({
  isOffline: false,
  lastOnlineAt: null,
  syncPending: false,
  triggerSync: async () => { }
});

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  const [syncPending, setSyncPending] = useState<boolean>(false);

  // Initialize offline status
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);

      // Set up event listeners for online/offline status
      const handleOnline = () => {
        setIsOffline(false);
        setLastOnlineAt(new Date());
        // Auto-sync when coming back online
        triggerSync();
      };

      const handleOffline = () => {
        setIsOffline(true);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Function to trigger synchronization of offline data
  const triggerSync = async (): Promise<void> => {
    if (isOffline) {
      setSyncPending(true);
      return;
    }

    try {
      setSyncPending(true);

      // Synchronize pending prescriptions
      await syncPendingPrescriptions();

      // Synchronize other data as needed

      setSyncPending(false);
    } catch (error) {
      console.error('Error syncing offline data:', error);
      setSyncPending(false);
    }
  };

  // Synchronize pending prescriptions
  const syncPendingPrescriptions = async (): Promise<void> => {
    try {
      // Import here to avoid circular dependencies
      const { rxNormToFHIRMedication } = await import('../../utils/fhir/mappers');

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const medplum = new MedplumClient({
        baseUrl: process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL!,
        clientId: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID!
      });

      // Get current user token
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await medplum.startClientLogin(session.access_token);
      }

      // Get pending prescriptions
      const { data: pendingItems } = await supabase
        .from('offline_queue')
        .select('*')
        .eq('type', 'prescription')
        .eq('status', 'pending');

      if (!pendingItems || pendingItems.length === 0) return;

      // Process each pending prescription
      for (const item of pendingItems) {
        const { medication, prescription } = item.data;

        // Create or find Medication resource
        let medicationResource;
        if (medication) {
          // Convert RxNorm data to FHIR Medication
          const medicationData = rxNormToFHIRMedication(medication) as Medication;

          try {
            // Check if medication already exists
            const existingMedication = await medplum.searchOne('Medication', {
              'code:contains': medication.rxcui
            }) as Medication;

            if (existingMedication) {
              medicationResource = existingMedication;
            } else {
              // Create new Medication resource
              medicationResource = await medplum.createResource(medicationData);
            }

            // Create MedicationRequest with reference to Medication
            const medicationRequest = await medplum.createResource({
              resourceType: 'MedicationRequest',
              status: 'active',
              intent: 'order',
              medicationReference: {
                reference: `Medication/${medicationResource.id}`,
                display: medicationResource.code.coding[0].display
              },
              ...prescription
            });

            // Mark as synced
            await supabase
              .from('offline_queue')
              .update({ status: 'synced' })
              .eq('id', item.id);
          } catch (error) {
            console.error('Error syncing prescription:', error);

            // Mark as failed
            await supabase
              .from('offline_queue')
              .update({
                status: 'failed',
                error_message: String(error)
              })
              .eq('id', item.id);
          }
        }
      }
    } catch (error) {
      console.error('Error in syncPendingPrescriptions:', error);
    }
  };

  return (
    <OfflineContext.Provider value={{ isOffline, lastOnlineAt, syncPending, triggerSync }}>
      {children}
    </OfflineContext.Provider>
  );
};