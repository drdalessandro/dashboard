"use client";

import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Hook for managing offline mode functionality
 * Extends useNetworkStatus to provide additional offline-related features
 */
export const useOfflineMode = () => {
  const { isOnline, isOffline } = useNetworkStatus();
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  
  // Check for pending changes in local storage or IndexedDB
  const checkPendingChanges = useCallback(() => {
    // In a real implementation, this would check local storage or IndexedDB
    // for pending changes that need to be synced
    // For now, we'll use a mock implementation
    const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    setPendingChanges(offlineQueue.length);
  }, []);
  
  // Sync pending changes when online
  const syncChanges = useCallback(async () => {
    if (isOnline && pendingChanges > 0) {
      try {
        // In a real implementation, this would sync changes from local storage
        // or IndexedDB with the server
        console.log('Syncing pending changes...');
        
        // Mock successful sync
        localStorage.setItem('offlineQueue', '[]');
        setPendingChanges(0);
        
        return { success: true };
      } catch (error) {
        console.error('Error syncing changes:', error);
        return { success: false, error };
      }
    }
    return { success: false, message: 'No changes to sync or offline' };
  }, [isOnline, pendingChanges]);
  
  // Check if a record was created offline
  const getOfflineStatus = useCallback((id: string) => {
    // In a real implementation, this would check if the record
    // exists in the offline queue
    const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    return offlineQueue.some((item: any) => item.id === id);
  }, []);
  
  // Check for pending changes on mount and when network status changes
  useEffect(() => {
    checkPendingChanges();
  }, [isOnline, checkPendingChanges]);
  
  return {
    isOffline,
    hasPendingChanges: pendingChanges,
    syncChanges,
    getOfflineStatus,
    checkPendingChanges
  };
};

export default useOfflineMode;