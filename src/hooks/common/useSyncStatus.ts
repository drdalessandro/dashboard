/**
 * useSyncStatus hook
 * Track and manage synchronization status for offline-first healthcare application
 * Critical for healthcare data integrity in areas with intermittent connectivity
 */

import { useState, useEffect, useCallback } from 'react';
import { SyncStatus } from '../../data/models/base';
import { useLocalStorage } from './useLocalStorage';

interface SyncStatusHookReturn {
  syncStatus: SyncStatus;
  hasPendingChanges: boolean;
  lastSyncTime: Date | null;
  isOnline: boolean;
  syncAll: () => Promise<void>;
}

/**
 * Custom hook to manage synchronization status for offline-first capability
 * Tracks online/offline status and pending changes
 * Provides utilities for syncing data when connection is restored
 * 
 * @returns Sync status information and sync functions
 */
export function useSyncStatus(): SyncStatusHookReturn {
  // Track if we're online
  const [isOnline, setIsOnline] = useState<boolean>(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  // Current sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isOnline ? SyncStatus.SYNCED : SyncStatus.OFFLINE
  );
  
  // Track pending changes
  const [pendingChanges, setPendingChanges] = useLocalStorage<string[]>(
    'pendingChanges', 
    []
  );
  
  // Track last successful sync time
  const [lastSyncTime, setLastSyncTime] = useLocalStorage<string | null>(
    'lastSyncTime',
    null
  );

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus(pendingChanges.length > 0 ? SyncStatus.PENDING : SyncStatus.SYNCED);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus(SyncStatus.OFFLINE);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [pendingChanges.length]);
  
  // Register a pending change
  const registerPendingChange = useCallback((changeId: string) => {
    if (!pendingChanges.includes(changeId)) {
      setPendingChanges([...pendingChanges, changeId]);
      
      if (isOnline) {
        setSyncStatus(SyncStatus.PENDING);
      }
    }
  }, [pendingChanges, setPendingChanges, isOnline]);
  
  // Mark a change as synced
  const markChangeAsSynced = useCallback((changeId: string) => {
    const updatedChanges = pendingChanges.filter(id => id !== changeId);
    setPendingChanges(updatedChanges);
    
    if (updatedChanges.length === 0 && isOnline) {
      setSyncStatus(SyncStatus.SYNCED);
      setLastSyncTime(new Date().toISOString());
    }
  }, [pendingChanges, setPendingChanges, isOnline, setLastSyncTime]);
  
  // Sync all pending changes
  const syncAll = useCallback(async (): Promise<void> => {
    if (!isOnline || pendingChanges.length === 0) {
      return;
    }
    
    setSyncStatus(SyncStatus.SYNCING);
    
    try {
      // For each pending change, perform the sync
      // This is a placeholder - the actual implementation would call your
      // sync service for each resource type
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      
      // In a real implementation, you would:
      // 1. Get all pending changes from local storage
      // 2. Group them by resource type
      // 3. Call the appropriate service for each type
      // 4. Update the sync status as each change is processed
      
      // Mark all as synced
      setLastSyncTime(new Date().toISOString());
      setPendingChanges([]);
      setSyncStatus(SyncStatus.SYNCED);
      
    } catch (error) {
      console.error('Failed to sync changes:', error);
      setSyncStatus(SyncStatus.ERROR);
    }
  }, [isOnline, pendingChanges, setPendingChanges, setLastSyncTime]);
  
  // Attempt to sync when coming back online
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      syncAll();
    }
  }, [isOnline, pendingChanges, syncAll]);
  
  return {
    syncStatus,
    hasPendingChanges: pendingChanges.length > 0,
    lastSyncTime: lastSyncTime ? new Date(lastSyncTime) : null,
    isOnline,
    syncAll
  };
}
