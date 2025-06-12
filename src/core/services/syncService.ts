// src/core/services/syncService.ts
import { storageService } from './storageService';

/**
 * Interface for offline actions that need to be synchronized
 */
export interface SyncQueueItem {
  id: string;
  resourceType: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Service for managing data synchronization with offline-first capabilities
 * Tracks changes made offline and synchronizes them when back online
 */
export const syncService = {
  // Storage keys
  _storageKeys: {
    SYNC_QUEUE: 'sync_queue',
    LAST_SYNC: 'last_sync_timestamp',
    SYNC_IN_PROGRESS: 'sync_in_progress',
    RESOURCE_TIMESTAMPS: 'resource_timestamps'
  },

  /**
   * Add an item to the synchronization queue
   * @param item The item to be synchronized
   */
  queueForSync(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
    const queue = this.getSyncQueue();
    
    // Generate a unique ID for this sync item
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    queue.push({
      ...item,
      id,
      timestamp: Date.now(),
      retryCount: 0
    });
    
    this.saveSyncQueue(queue);
  },

  /**
   * Get the current synchronization queue
   */
  getSyncQueue(): SyncQueueItem[] {
    return storageService.getData<SyncQueueItem[]>(this._storageKeys.SYNC_QUEUE) || [];
  },

  /**
   * Save the synchronization queue
   */
  saveSyncQueue(queue: SyncQueueItem[]): void {
    storageService.saveData(this._storageKeys.SYNC_QUEUE, queue);
  },

  /**
   * Get the number of items in the sync queue
   */
  getPendingSyncCount(): number {
    return this.getSyncQueue().length;
  },

  /**
   * Check if there are items waiting to be synchronized
   */
  hasPendingSync(): boolean {
    return this.getPendingSyncCount() > 0;
  },

  /**
   * Check if synchronization is in progress
   */
  isSyncInProgress(): boolean {
    return storageService.getData<boolean>(this._storageKeys.SYNC_IN_PROGRESS) || false;
  },

  /**
   * Set the synchronization status
   */
  setSyncInProgress(inProgress: boolean): void {
    storageService.saveData(this._storageKeys.SYNC_IN_PROGRESS, inProgress);
  },

  /**
   * Get the last synchronization timestamp
   */
  getLastSyncTimestamp(): number | null {
    return storageService.getData<number>(this._storageKeys.LAST_SYNC);
  },

  /**
   * Update the last synchronization timestamp
   */
  updateLastSyncTimestamp(): void {
    storageService.saveData(this._storageKeys.LAST_SYNC, Date.now());
  },

  /**
   * Store the timestamp for when a resource type was last synchronized
   * @param resourceType The type of resource (e.g., 'Patient', 'MedicationRequest')
   * @param timestamp The timestamp when it was last synced
   */
  setResourceSyncTimestamp(resourceType: string, timestamp: number = Date.now()): void {
    const timestamps = storageService.getData<Record<string, number>>(
      this._storageKeys.RESOURCE_TIMESTAMPS
    ) || {};
    
    timestamps[resourceType] = timestamp;
    storageService.saveData(this._storageKeys.RESOURCE_TIMESTAMPS, timestamps);
  },

  /**
   * Get the timestamp for when a resource type was last synchronized
   * @param resourceType The type of resource
   * @returns The timestamp or null if never synced
   */
  getResourceSyncTimestamp(resourceType: string): number | null {
    const timestamps = storageService.getData<Record<string, number>>(
      this._storageKeys.RESOURCE_TIMESTAMPS
    ) || {};
    
    return timestamps[resourceType] || null;
  },

  /**
   * Process synchronization queue
   * This should be called when the device comes online
   * @param processFn Function to process each item in the queue
   * @returns Promise that resolves when all items have been processed
   */
  async processQueue(
    processFn: (item: SyncQueueItem) => Promise<boolean>
  ): Promise<{ success: number; failed: number }> {
    // If sync is already in progress, don't start another one
    if (this.isSyncInProgress()) {
      return { success: 0, failed: 0 };
    }
    
    this.setSyncInProgress(true);
    
    try {
      const queue = this.getSyncQueue();
      let successCount = 0;
      let failedCount = 0;
      
      // Process queue in order (oldest first)
      const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);
      
      const remainingItems: SyncQueueItem[] = [];
      
      for (const item of sortedQueue) {
        try {
          const success = await processFn(item);
          
          if (success) {
            successCount++;
          } else {
            // If processing failed, increment retry count and keep in queue
            const updatedItem = { ...item, retryCount: item.retryCount + 1 };
            
            // If we've tried too many times, give up
            if (updatedItem.retryCount < 5) {
              remainingItems.push(updatedItem);
            } else {
              failedCount++;
              // Could implement notification system for failed syncs here
            }
          }
        } catch (error) {
          console.error('Error processing sync item:', error);
          
          // If processing throws, increment retry count and keep in queue
          const updatedItem = { ...item, retryCount: item.retryCount + 1 };
          
          // If we've tried too many times, give up
          if (updatedItem.retryCount < 5) {
            remainingItems.push(updatedItem);
          } else {
            failedCount++;
            // Could implement notification system for failed syncs here
          }
        }
      }
      
      // Update queue with remaining items
      this.saveSyncQueue(remainingItems);
      
      // Update last sync timestamp
      this.updateLastSyncTimestamp();
      
      return { success: successCount, failed: failedCount };
    } finally {
      this.setSyncInProgress(false);
    }
  },

  /**
   * Clear the synchronization queue
   * This should only be used for cleanup or reset purposes
   */
  clearSyncQueue(): void {
    storageService.saveData(this._storageKeys.SYNC_QUEUE, []);
  },

  /**
   * Handle creating a resource offline
   * Stores the resource locally and queues it for sync
   * @param resourceType The type of resource
   * @param data The resource data
   * @param id Temporary ID for the resource
   */
  createOffline(resourceType: string, data: any, id: string): void {
    // Store the resource with a temporary ID
    storageService.saveNamespacedData(resourceType, id, {
      ...data,
      id,
      syncStatus: 'offline'
    });
    
    // Queue for sync when back online
    this.queueForSync({
      resourceType,
      action: 'create',
      data
    });
  },

  /**
   * Handle updating a resource offline
   * Updates the resource locally and queues it for sync
   * @param resourceType The type of resource
   * @param id The resource ID
   * @param data The updated resource data
   */
  updateOffline(resourceType: string, id: string, data: any): void {
    // Get the existing resource
    const existingResource = storageService.getNamespacedData(resourceType, id);
    
    if (!existingResource) {
      console.warn(`Cannot update non-existent resource: ${resourceType}/${id}`);
      return;
    }
    
    // Update the resource locally
    storageService.saveNamespacedData(resourceType, id, {
      ...existingResource,
      ...data,
      syncStatus: 'offline'
    });
    
    // Queue for sync when back online
    this.queueForSync({
      resourceType,
      action: 'update',
      data: {
        id,
        ...data
      }
    });
  },

  /**
   * Handle deleting a resource offline
   * Marks the resource as deleted locally and queues it for sync
   * @param resourceType The type of resource
   * @param id The resource ID
   */
  deleteOffline(resourceType: string, id: string): void {
    // Get the existing resource
    const existingResource = storageService.getNamespacedData(resourceType, id);
    
    if (!existingResource) {
      console.warn(`Cannot delete non-existent resource: ${resourceType}/${id}`);
      return;
    }
    
    // Mark as deleted locally
    storageService.saveNamespacedData(resourceType, id, {
      ...existingResource,
      deleted: true,
      syncStatus: 'offline'
    });
    
    // Queue for sync when back online
    this.queueForSync({
      resourceType,
      action: 'delete',
      data: { id }
    });
  }
};
