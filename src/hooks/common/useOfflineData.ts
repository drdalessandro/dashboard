/**
 * useOfflineData
 * Custom hook for managing data in offline-first healthcare applications
 * Provides offline caching, synchronization, and conflict resolution strategies
 * Optimized for use in areas with limited connectivity in Mali and Sub-Saharan Africa
 */

import { useState, useEffect, useCallback } from 'react';
import { Resource } from '@medplum/fhirtypes';
import { SyncStatus } from '../../data/models/base';
import { useSyncStatus } from './useSyncStatus';

interface OfflineDataOptions<T extends Resource = Resource> {
  /**
   * Resource type to manage
   */
  resourceType: string;

  /**
   * Function to fetch online data
   */
  fetchOnlineData: () => Promise<T[]>;

  /**
   * Local storage key prefix (default: 'offline')
   */
  storageKeyPrefix?: string;

  /**
   * Maximum age of cached data in milliseconds (default: 24 hours)
   */
  maxAge?: number;

  /**
   * Whether to attempt background sync (default: true)
   */
  backgroundSync?: boolean;

  /**
   * Conflict resolution strategy (default: 'serverWins')
   */
  conflictStrategy?: 'serverWins' | 'clientWins' | 'merge';

  /**
   * Custom merge function for conflict resolution
   */
  mergeFunction?: (clientData: T, serverData: T) => T;

  /**
   * Function to determine if a record is pending synchronization
   */
  isPendingSync?: (resource: T) => boolean;
}

interface OfflineDataState<T extends Resource = Resource> {
  /**
   * Data available for use (either from server or local cache)
   */
  data: T[];

  /**
   * Whether data is currently loading
   */
  loading: boolean;

  /**
   * Error message if any
   */
  error: string | null;

  /**
   * Current synchronization status
   */
  syncStatus: SyncStatus;

  /**
   * Last time data was refreshed from the server
   */
  lastSyncTime: Date | null;

  /**
   * Pending changes that haven't been synchronized yet
   */
  pendingChanges: number;

  /**
   * Whether data is from cache
   */
  isFromCache: boolean;

  /**
   * Additional operations exposed by the hook
   */
  operations: {
    /**
     * Force refresh data from the server
     */
    refresh: () => Promise<void>;

    /**
     * Save data locally
     */
    saveLocally: (data: T[]) => void;

    /**
     * Add or update an item
     */
    upsertItem: (item: T) => Promise<T>;

    /**
     * Delete an item
     */
    deleteItem: (id: string) => Promise<void>;

    /**
     * Force synchronization with the server
     */
    forceSync: () => Promise<void>;

    /**
     * Clear local cache
     */
    clearCache: () => void;

    /**
     * Get an item by id
     */
    getItem: (id: string) => T | undefined;
  };
}

/**
 * Hook for managing offline data synchronization
 * Automatically handles caching, offline detection, and synchronization
 */
export const useOfflineData = <T extends Resource = Resource>(
  options: OfflineDataOptions<T>
): OfflineDataState<T> => {
  const {
    resourceType,
    fetchOnlineData,
    storageKeyPrefix = 'offline',
    maxAge = 24 * 60 * 60 * 1000, // 24 hours default
    backgroundSync = true,
    conflictStrategy = 'serverWins',
    mergeFunction,
    isPendingSync = (resource) => !!resource.meta?.tag?.some(tag =>
      tag.system === 'http://gandallgroup.org/fhir/sync-status' &&
      tag.code === 'pending'
    )
  } = options;

  const { isOnline } = useSyncStatus();

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.PENDING);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  // Storage keys
  const dataKey = `${storageKeyPrefix}_${resourceType}_data`;
  const metaKey = `${storageKeyPrefix}_${resourceType}_meta`;

  // Load data from local storage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const storedData = localStorage.getItem(dataKey);
      const storedMeta = localStorage.getItem(metaKey);

      if (storedData && storedMeta) {
        const parsedData = JSON.parse(storedData) as T[];
        const meta = JSON.parse(storedMeta) as {
          timestamp: string;
          syncStatus: SyncStatus;
        };

        const timestamp = new Date(meta.timestamp);
        const ageMs = Date.now() - timestamp.getTime();

        // Check data freshness
        if (ageMs < maxAge) {
          setData(parsedData);
          setSyncStatus(meta.syncStatus);
          setLastSyncTime(timestamp);
          setIsFromCache(true);

          // Count pending changes
          const pending = parsedData.filter(isPendingSync).length;
          setPendingChanges(pending);

          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Error loading data from localStorage:', err);
      return false;
    }
  }, [dataKey, metaKey, maxAge, isPendingSync, resourceType]);

  // Save data to local storage
  const saveToLocalStorage = useCallback((newData: T[], newSyncStatus: SyncStatus) => {
    try {
      localStorage.setItem(dataKey, JSON.stringify(newData));
      localStorage.setItem(metaKey, JSON.stringify({
        timestamp: new Date().toISOString(),
        syncStatus: newSyncStatus
      }));

      // Count pending changes
      const pending = newData.filter(isPendingSync).length;
      setPendingChanges(pending);
    } catch (err) {
      console.error('Error saving data to localStorage:', err);
    }
  }, [dataKey, metaKey, isPendingSync]);

  // Fetch data from server
  const fetchData = useCallback(async (force = false) => {
    // If not forcing and offline, don't attempt to fetch
    if (!force && !isOnline) {
      const loaded = loadFromLocalStorage();
      if (!loaded) {
        setError('No network connection and no cached data available');
        setSyncStatus(SyncStatus.OFFLINE);
      }
      setLoading(false);
      return;
    }

    // If not forcing and we have recent cached data, use it first
    if (!force) {
      const loaded = loadFromLocalStorage();
      if (loaded) {
        setLoading(false);
      }
    }

    // Don't proceed with online fetch if offline
    if (!isOnline) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setSyncStatus(SyncStatus.SYNCING);

    try {
      // Fetch fresh data from server
      const onlineData = await fetchOnlineData();

      // Handle conflict resolution if we have local data
      if (data.length > 0) {
        const mergedData = resolveConflicts(data, onlineData);
        setData(mergedData);
        saveToLocalStorage(mergedData, SyncStatus.SYNCED);
      } else {
        setData(onlineData);
        saveToLocalStorage(onlineData, SyncStatus.SYNCED);
      }

      setLastSyncTime(new Date());
      setSyncStatus(SyncStatus.SYNCED);
      setError(null);
      setIsFromCache(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data from server');
      setSyncStatus(SyncStatus.ERROR);

      // If no data loaded from cache previously, try again
      if (data.length === 0) {
        loadFromLocalStorage();
      }
    } finally {
      setLoading(false);
    }
  }, [
    isOnline,
    loadFromLocalStorage,
    fetchOnlineData,
    saveToLocalStorage,
    data,
    conflictStrategy,
    mergeFunction
  ]);

  // Resolve conflicts between local and server data
  const resolveConflicts = useCallback((localData: T[], serverData: T[]): T[] => {
    // Create maps for faster lookups
    const localMap = new Map(localData.map(item => [item.id, item]));
    const serverMap = new Map(serverData.map(item => [item.id, item]));
    const resultMap = new Map<string, T>();

    // Process all IDs from both datasets
    const allIds = new Set([...Array.from(localMap.keys()), ...Array.from(serverMap.keys())]);

    allIds.forEach(id => {
      if (!id) return;

      const localItem = localMap.get(id);
      const serverItem = serverMap.get(id);

      // If item is only in one dataset, use that
      if (!localItem) {
        if (serverItem) resultMap.set(id, serverItem);
        return;
      }
      if (!serverItem) {
        // Local-only items might be pending creation
        if (isPendingSync(localItem)) {
          resultMap.set(id, localItem);
        }
        return;
      }

      // Handle conflict based on strategy
      if (isPendingSync(localItem)) {
        // Local changes take precedence if pending sync
        resultMap.set(id, localItem);
      } else {
        switch (conflictStrategy) {
          case 'clientWins':
            resultMap.set(id, localItem);
            break;
          case 'serverWins':
            resultMap.set(id, serverItem);
            break;
          case 'merge':
            if (mergeFunction) {
              resultMap.set(id, mergeFunction(localItem, serverItem));
            } else {
              // Default merge strategy if no function provided
              const serverTimestamp = serverItem.meta?.lastUpdated
                ? new Date(serverItem.meta.lastUpdated).getTime()
                : 0;

              const localTimestamp = localItem.meta?.lastUpdated
                ? new Date(localItem.meta.lastUpdated).getTime()
                : 0;

              resultMap.set(id, serverTimestamp > localTimestamp ? serverItem : localItem);
            }
            break;
        }
      }
    });

    return Array.from(resultMap.values());
  }, [conflictStrategy, mergeFunction, isPendingSync]);

  // Upsert a resource (add or update)
  const upsertItem = useCallback(async (item: T): Promise<T> => {
    // Flag item as pending sync if offline
    const updatedItem = { ...item };

    if (!isOnline) {
      // Add pending sync tag
      if (!updatedItem.meta) {
        updatedItem.meta = {};
      }
      if (!updatedItem.meta.tag) {
        updatedItem.meta.tag = [];
      }

      // Remove any existing sync tags
      updatedItem.meta.tag = updatedItem.meta.tag.filter(tag =>
        tag.system !== 'http://gandallgroup.org/fhir/sync-status'
      );

      // Add pending sync tag
      updatedItem.meta.tag.push({
        system: 'http://gandallgroup.org/fhir/sync-status',
        code: 'pending',
        display: 'Pending Synchronization'
      });
    }

    // Update in-memory data
    const newData = [...data];
    const index = newData.findIndex(r => r.id === item.id);

    if (index >= 0) {
      newData[index] = updatedItem;
    } else {
      newData.push(updatedItem);
    }

    setData(newData);

    // Update local storage
    saveToLocalStorage(
      newData,
      isOnline ? SyncStatus.SYNCED : SyncStatus.PENDING
    );

    // Update pending count
    setPendingChanges(newData.filter(isPendingSync).length);

    return updatedItem;
  }, [data, isOnline, saveToLocalStorage, isPendingSync]);

  // Delete a resource
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    // Filter out the item
    const newData = data.filter(item => item.id !== id);

    setData(newData);

    // Update local storage
    saveToLocalStorage(
      newData,
      isOnline ? SyncStatus.SYNCED : SyncStatus.PENDING
    );

    // Update pending count
    setPendingChanges(newData.filter(isPendingSync).length);
  }, [data, isOnline, saveToLocalStorage, isPendingSync]);

  // Force sync with server
  const forceSync = useCallback(async (): Promise<void> => {
    if (!isOnline) {
      setError('Cannot synchronize while offline');
      return;
    }

    await fetchData(true);
  }, [isOnline, fetchData]);

  // Clear cache
  const clearCache = useCallback((): void => {
    localStorage.removeItem(dataKey);
    localStorage.removeItem(metaKey);
    setData([]);
    setPendingChanges(0);
    setSyncStatus(SyncStatus.PENDING);
    setLastSyncTime(null);
    setIsFromCache(false);
  }, [dataKey, metaKey]);

  // Get item by ID
  const getItem = useCallback((id: string): T | undefined => {
    return data.find(item => item.id === id);
  }, [data]);

  // Save data directly to local storage (for bulk operations)
  const saveLocally = useCallback((newData: T[]): void => {
    setData(newData);
    saveToLocalStorage(
      newData,
      isOnline ? SyncStatus.SYNCED : SyncStatus.PENDING
    );
  }, [isOnline, saveToLocalStorage]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Background sync when connection is restored
  useEffect(() => {
    if (isOnline && backgroundSync && pendingChanges > 0) {
      fetchData(true);
    }
  }, [isOnline, backgroundSync, pendingChanges, fetchData]);

  return {
    data,
    loading,
    error,
    syncStatus,
    lastSyncTime,
    pendingChanges,
    isFromCache,
    operations: {
      refresh: () => fetchData(true),
      saveLocally,
      upsertItem,
      deleteItem,
      forceSync,
      clearCache,
      getItem
    }
  };
};

export default useOfflineData;
